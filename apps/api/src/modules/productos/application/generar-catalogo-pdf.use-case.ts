import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PRODUCTOS_UPLOADS_DIR } from '../../../uploads-path';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import type { Producto } from '../domain/producto.entity';

const LOGO_PATH = join(__dirname, '..', '..', '..', '..', 'assets', 'brand', 'logo-guapa.png');

const COLOR_SAGE_DEEP = '#5F7A64';
const COLOR_SAGE_SOFT = '#EAF0E8';
const COLOR_INK = '#2E332C';
const COLOR_MUTED = '#7C8279';
const COLOR_LINE = '#ECE4D5';

const MARGEN = 40;
const COLUMNAS = 2;
const TARJETA_ALTO = 130;
const IMAGEN_LADO = 90;

const formatoCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function rutaImagen(url: string | null): string | null {
  if (!url) return null;
  const ruta = join(PRODUCTOS_UPLOADS_DIR, basename(url));
  return existsSync(ruta) ? ruta : null;
}

function agruparPorCategoria(productos: Producto[]): Map<string, Producto[]> {
  const grupos = new Map<string, Producto[]>();
  for (const p of productos) {
    const lista = grupos.get(p.categoriaNombre) ?? [];
    lista.push(p);
    grupos.set(p.categoriaNombre, lista);
  }
  return new Map([...grupos.entries()].sort(([a], [b]) => a.localeCompare(b, 'es')));
}

@Injectable()
export class GenerarCatalogoPdfUseCase {
  constructor(
    @Inject(PRODUCTOS_REPOSITORY) private readonly productosRepository: ProductosRepository,
  ) {}

  async ejecutar(): Promise<Buffer> {
    const productos = await this.productosRepository.listar(false);
    const porCategoria = agruparPorCategoria(productos);

    const doc = new PDFDocument({ size: 'A4', margin: MARGEN, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const fin = new Promise<Buffer>((resolve) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
    });

    const anchoUtil = doc.page.width - MARGEN * 2;
    const anchoTarjeta = (anchoUtil - 16) / COLUMNAS;

    this.dibujarPortada(doc, anchoUtil);
    doc.addPage();

    // Flujo continuo: las categorías se acomodan una tras otra en la misma
    // página mientras haya espacio, para que catálogos con categorías cortas
    // no dejen páginas casi vacías. Solo se agrega una página nueva cuando el
    // contenido realmente no cabe.
    const ALTO_ENCABEZADO = 50;
    let y = MARGEN;
    let columna = 0;

    for (const [categoria, items] of porCategoria) {
      if (y + ALTO_ENCABEZADO + TARJETA_ALTO > doc.page.height - MARGEN) {
        doc.addPage();
        y = MARGEN;
      }
      y = this.dibujarEncabezadoCategoria(doc, categoria, anchoUtil, y);
      columna = 0;

      for (const producto of items) {
        if (y + TARJETA_ALTO > doc.page.height - MARGEN) {
          doc.addPage();
          y = this.dibujarEncabezadoCategoria(doc, categoria, anchoUtil, MARGEN, true);
          columna = 0;
        }

        const x = MARGEN + columna * (anchoTarjeta + 16);
        this.dibujarTarjetaProducto(doc, producto, x, y, anchoTarjeta);

        columna += 1;
        if (columna >= COLUMNAS) {
          columna = 0;
          y += TARJETA_ALTO + 14;
        }
      }

      if (columna !== 0) {
        y += TARJETA_ALTO + 14;
        columna = 0;
      }
      y += 24;
    }

    this.numerarPaginas(doc);
    doc.end();
    return fin;
  }

  private dibujarPortada(doc: PDFKit.PDFDocument, anchoUtil: number) {
    const centroX = MARGEN + anchoUtil / 2;

    if (existsSync(LOGO_PATH)) {
      doc.image(LOGO_PATH, centroX - 50, 160, { width: 100, height: 100 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(28)
      .fillColor(COLOR_INK)
      .text('Guapa Gourmet Market', MARGEN, 290, { width: anchoUtil, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLOR_MUTED)
      .text('by Paola Rodríguez', MARGEN, 328, { width: anchoUtil, align: 'center' });

    doc
      .font('Helvetica-Bold')
      .fontSize(16)
      .fillColor(COLOR_SAGE_DEEP)
      .text('Catálogo de productos', MARGEN, 380, { width: anchoUtil, align: 'center' });

    const hoy = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLOR_MUTED)
      .text(`Generado el ${hoy}`, MARGEN, 405, { width: anchoUtil, align: 'center' });
  }

  private dibujarEncabezadoCategoria(
    doc: PDFKit.PDFDocument,
    categoria: string,
    anchoUtil: number,
    y: number,
    continuacion = false,
  ): number {
    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLOR_SAGE_DEEP)
      .text(continuacion ? `${categoria} (cont.)` : categoria, MARGEN, y, { width: anchoUtil });
    const yLinea = doc.y + 4;
    doc
      .moveTo(MARGEN, yLinea)
      .lineTo(MARGEN + anchoUtil, yLinea)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();
    return yLinea + 18;
  }

  private dibujarTarjetaProducto(
    doc: PDFKit.PDFDocument,
    producto: Producto,
    x: number,
    y: number,
    ancho: number,
  ) {
    doc
      .roundedRect(x, y, ancho, TARJETA_ALTO, 8)
      .fillColor('#FFFFFF')
      .fill()
      .roundedRect(x, y, ancho, TARJETA_ALTO, 8)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    const padding = 10;
    const imagenX = x + padding;
    const imagenY = y + padding;
    const rutaImg = rutaImagen(producto.imagenUrl);

    if (rutaImg) {
      doc.save();
      doc.roundedRect(imagenX, imagenY, IMAGEN_LADO, IMAGEN_LADO, 6).clip();
      doc.image(rutaImg, imagenX, imagenY, { fit: [IMAGEN_LADO, IMAGEN_LADO], align: 'center', valign: 'center' });
      doc.restore();
    } else {
      doc
        .roundedRect(imagenX, imagenY, IMAGEN_LADO, IMAGEN_LADO, 6)
        .fillColor(COLOR_SAGE_SOFT)
        .fill();
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLOR_MUTED)
        .text('Sin foto', imagenX, imagenY + IMAGEN_LADO / 2 - 5, { width: IMAGEN_LADO, align: 'center' });
    }

    const textoX = imagenX + IMAGEN_LADO + 12;
    const textoAncho = ancho - IMAGEN_LADO - padding * 2 - 12;

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLOR_INK)
      .text(producto.nombre, textoX, y + padding, { width: textoAncho, height: 40 });

    if (producto.marcaNombre) {
      doc
        .font('Helvetica')
        .fontSize(9)
        .fillColor(COLOR_MUTED)
        .text(producto.marcaNombre, textoX, y + padding + 32, { width: textoAncho });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor(COLOR_SAGE_DEEP)
      .text(formatoCOP.format(producto.precioVenta), textoX, y + TARJETA_ALTO - padding - 18, {
        width: textoAncho,
      });
  }

  private numerarPaginas(doc: PDFKit.PDFDocument) {
    const rango = doc.bufferedPageRange();
    for (let i = 0; i < rango.count; i++) {
      doc.switchToPage(i);
      if (i === 0) continue;

      // El pie de página cae dentro del margen inferior: pdfkit interpreta eso
      // como "no cabe" y agrega una página nueva antes de dibujar. Se anula el
      // margen momentáneamente solo para este trazo, ya que es lo último que
      // se dibuja en la página.
      const margenInferiorOriginal = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLOR_MUTED)
        .text(`Página ${i + 1} de ${rango.count}`, MARGEN, doc.page.height - 30, {
          width: doc.page.width - MARGEN * 2,
          align: 'center',
        });
      doc.page.margins.bottom = margenInferiorOriginal;
    }
  }
}
