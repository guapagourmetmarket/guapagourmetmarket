import { Readable } from 'node:stream';
import { Inject, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import { CATEGORIAS_REPOSITORY } from '../domain/categorias.repository';
import type { CategoriasRepository } from '../domain/categorias.repository';
import { MARCAS_REPOSITORY } from '../domain/marcas.repository';
import type { MarcasRepository } from '../domain/marcas.repository';
import { COLUMNAS_PRODUCTOS } from './productos-excel.columns';
import type { Iva } from '../domain/producto.entity';

export interface ErrorImportacion {
  fila: number;
  mensaje: string;
}

export interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  errores: ErrorImportacion[];
}

const IVAS_VALIDOS = [0, 5, 19];

function celda(row: ExcelJS.Row, columna: number | undefined): string {
  if (!columna) return '';
  const valor = row.getCell(columna).value;
  if (valor === null || valor === undefined) return '';
  if (typeof valor === 'object' && 'text' in (valor as object)) {
    return String((valor as { text: unknown }).text ?? '').trim();
  }
  return String(valor).trim();
}

@Injectable()
export class ImportarProductosUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
    @Inject(CATEGORIAS_REPOSITORY) private readonly categoriasRepository: CategoriasRepository,
    @Inject(MARCAS_REPOSITORY) private readonly marcasRepository: MarcasRepository,
  ) {}

  async ejecutar(buffer: Buffer, esCsv: boolean): Promise<ResultadoImportacion> {
    const workbook = new ExcelJS.Workbook();
    let hoja: ExcelJS.Worksheet;
    if (esCsv) {
      hoja = await workbook.csv.read(Readable.from(buffer));
    } else {
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
      hoja = workbook.worksheets[0];
    }

    const columnaPorClave = new Map<string, number>();
    const filaEncabezado = hoja.getRow(1);
    filaEncabezado.eachCell((cell, colNumber) => {
      const texto = String(cell.value ?? '').trim().toLowerCase();
      const columna = COLUMNAS_PRODUCTOS.find((c) => c.header.toLowerCase() === texto);
      if (columna) columnaPorClave.set(columna.key, colNumber);
    });

    const productosExistentes = await this.productosRepository.listar(true);
    const idPorCodigo = new Map(productosExistentes.map((p) => [p.codigoInterno, p.id]));

    const resultado: ResultadoImportacion = { creados: 0, actualizados: 0, errores: [] };

    for (let numeroFila = 2; numeroFila <= hoja.rowCount; numeroFila++) {
      const row = hoja.getRow(numeroFila);
      const nombre = celda(row, columnaPorClave.get('nombre'));
      if (!nombre) continue; // fila vacía o de notas: se ignora sin marcar error

      const codigoInterno = celda(row, columnaPorClave.get('codigoInterno'));
      if (!codigoInterno) {
        resultado.errores.push({ fila: numeroFila, mensaje: 'Falta el código interno.' });
        continue;
      }

      try {
        const categoriaNombre = celda(row, columnaPorClave.get('categoria'));
        if (!categoriaNombre) {
          resultado.errores.push({ fila: numeroFila, mensaje: 'Falta la categoría.' });
          continue;
        }
        const categoria = await this.categoriasRepository.obtenerOCrear(categoriaNombre);

        const marcaNombre = celda(row, columnaPorClave.get('marca'));
        const marca = marcaNombre ? await this.marcasRepository.obtenerOCrear(marcaNombre) : null;

        const ivaTexto = celda(row, columnaPorClave.get('iva'));
        const iva = ivaTexto ? Number(ivaTexto) : 0;
        if (!IVAS_VALIDOS.includes(iva)) {
          resultado.errores.push({ fila: numeroFila, mensaje: `IVA inválido ("${ivaTexto}"). Debe ser 0, 5 o 19.` });
          continue;
        }

        const precioCompraTexto = celda(row, columnaPorClave.get('precioCompra'));
        const precioVentaTexto = celda(row, columnaPorClave.get('precioVenta'));
        const existenciasTexto = celda(row, columnaPorClave.get('existencias'));
        const pesoTexto = celda(row, columnaPorClave.get('peso'));

        const camposNumericos: [string, string][] = [
          ['Precio de compra', precioCompraTexto],
          ['Precio de venta', precioVentaTexto],
          ['Existencias', existenciasTexto],
          ['Peso', pesoTexto],
        ];
        const campoInvalido = camposNumericos.find(([, texto]) => texto && Number.isNaN(Number(texto)));
        if (campoInvalido) {
          resultado.errores.push({
            fila: numeroFila,
            mensaje: `"${campoInvalido[0]}" tiene un valor inválido ("${campoInvalido[1]}"), debe ser un número.`,
          });
          continue;
        }

        // Sin precio de compra y de venta (mayores a 0) no se puede calcular
        // la rentabilidad del producto en los reportes de margen.
        if (!(Number(precioCompraTexto) > 0) || !(Number(precioVentaTexto) > 0)) {
          resultado.errores.push({
            fila: numeroFila,
            mensaje: 'Falta "Precio de compra" o "Precio de venta" (ambos deben ser mayores a 0).',
          });
          continue;
        }

        const datos = {
          codigoInterno,
          codigoBarras: celda(row, columnaPorClave.get('codigoBarras')) || undefined,
          nombre,
          descripcion: celda(row, columnaPorClave.get('descripcion')) || undefined,
          categoriaId: categoria.id,
          marcaId: marca?.id,
          unidadMedida: celda(row, columnaPorClave.get('unidadMedida')) || 'unidad',
          precioCompra: precioCompraTexto ? Number(precioCompraTexto) : 0,
          precioVenta: precioVentaTexto ? Number(precioVentaTexto) : 0,
          iva: iva as Iva,
          existencias: existenciasTexto ? Math.max(0, Math.round(Number(existenciasTexto) * 1000) / 1000) : 0,
          ingredientes: celda(row, columnaPorClave.get('ingredientes')) || undefined,
          peso: pesoTexto ? Number(pesoTexto) : undefined,
          pesoUnidad: celda(row, columnaPorClave.get('pesoUnidad')) || undefined,
        };

        const idExistente = idPorCodigo.get(codigoInterno);
        let productoId: string;
        if (idExistente) {
          await this.productosRepository.actualizar(idExistente, datos);
          productoId = idExistente;
          resultado.actualizados += 1;
        } else {
          const creado = await this.productosRepository.crear(datos);
          productoId = creado.id;
          idPorCodigo.set(codigoInterno, productoId);
          resultado.creados += 1;
        }

        const activoTexto = celda(row, columnaPorClave.get('activo')).toLowerCase();
        if (activoTexto === 'no') {
          await this.productosRepository.cambiarEstado(productoId, false);
        } else if (activoTexto === 'sí' || activoTexto === 'si') {
          await this.productosRepository.cambiarEstado(productoId, true);
        }
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : 'Error desconocido.';
        resultado.errores.push({ fila: numeroFila, mensaje });
      }
    }

    return resultado;
  }
}
