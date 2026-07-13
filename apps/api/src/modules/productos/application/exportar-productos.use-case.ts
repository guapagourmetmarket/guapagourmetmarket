import { Inject, Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import { COLUMNAS_PRODUCTOS } from './productos-excel.columns';

@Injectable()
export class ExportarProductosUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  async ejecutar(): Promise<Buffer> {
    const productos = await this.productosRepository.listar(true);

    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Productos');
    hoja.columns = [...COLUMNAS_PRODUCTOS];
    hoja.getRow(1).font = { bold: true };

    for (const p of productos) {
      hoja.addRow({
        codigoInterno: p.codigoInterno,
        codigoBarras: p.codigoBarras ?? '',
        nombre: p.nombre,
        descripcion: p.descripcion ?? '',
        categoria: p.categoriaNombre,
        marca: p.marcaNombre ?? '',
        precioCompra: p.precioCompra,
        precioVenta: p.precioVenta,
        iva: p.iva,
        unidadMedida: p.unidadMedida,
        existencias: p.existencias,
        ingredientes: p.ingredientes ?? '',
        peso: p.peso ?? '',
        pesoUnidad: p.pesoUnidad ?? '',
        activo: p.activo ? 'Sí' : 'No',
      });
    }

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
