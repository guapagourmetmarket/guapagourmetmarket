import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { COLUMNAS_PRODUCTOS } from './productos-excel.columns';

@Injectable()
export class GenerarPlantillaProductosUseCase {
  async ejecutar(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const hoja = workbook.addWorksheet('Productos');
    hoja.columns = [...COLUMNAS_PRODUCTOS];
    hoja.getRow(1).font = { bold: true };

    hoja.addRow({
      codigoInterno: 'PLANTILLA-001',
      codigoBarras: '',
      nombre: 'Granola artesanal miel y nueces (ejemplo — cámbialo o bórralo)',
      descripcion: 'Bolsa 400g',
      categoria: 'Desayuno',
      marca: 'Guapa Bakery',
      precioCompra: 8500,
      precioVenta: 15900,
      iva: 0,
      unidadMedida: 'unidad',
      existencias: 20,
      ingredientes: 'Avena, miel, almendras, coco rallado',
      peso: 400,
      pesoUnidad: 'g',
      activo: 'Sí',
    });

    const notas = hoja.addRow({
      codigoInterno:
        'Notas: Código interno y Nombre son obligatorios. Si la categoría o marca no existe, se crea automáticamente. Deja "Código interno" igual al de un producto existente para actualizarlo en vez de crear uno nuevo.',
    });
    notas.font = { italic: true, size: 10 };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
