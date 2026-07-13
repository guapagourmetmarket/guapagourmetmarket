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
const COLOR_ROSE = '#E2C1BC';
const COLOR_ROSE_DEEP = '#C4948C';
const COLOR_INK = '#2E332C';
const COLOR_MUTED = '#8A8F84';
const COLOR_LINE = '#ECE4D5';
const COLOR_CREAM = '#FAF5EC';

const MARGEN = 40;
const COLUMNAS = 2;
const GAP = 18;
const IMAGEN_ALTO = 148;
const TARJETA_ALTO = 246;
const ALTO_ENCABEZADO_PAGINA = 34;
const ALTO_ENCABEZADO_CATEGORIA = 34;

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
    const anchoTarjeta = (anchoUtil - GAP * (COLUMNAS - 1)) / COLUMNAS;

    this.dibujarPortada(doc, anchoUtil, productos.length, porCategoria.size);
    doc.addPage();

    // Flujo continuo: las categorías se acomodan una tras otra en la misma
    // página mientras haya espacio, para que catálogos con categorías cortas
    // no dejen páginas casi vacías. Solo se agrega una página nueva cuando el
    // contenido realmente no cabe.
    let y = this.dibujarEncabezadoPagina(doc, anchoUtil);
    let columna = 0;

    for (const [categoria, items] of porCategoria) {
      if (y + ALTO_ENCABEZADO_CATEGORIA + TARJETA_ALTO > doc.page.height - MARGEN) {
        doc.addPage();
        y = this.dibujarEncabezadoPagina(doc, anchoUtil);
      }
      y = this.dibujarEncabezadoCategoria(doc, categoria, items.length, anchoUtil, y);
      columna = 0;

      for (const producto of items) {
        if (y + TARJETA_ALTO > doc.page.height - MARGEN) {
          doc.addPage();
          y = this.dibujarEncabezadoPagina(doc, anchoUtil);
          y = this.dibujarEncabezadoCategoria(doc, categoria, items.length, anchoUtil, y, true);
          columna = 0;
        }

        const x = MARGEN + columna * (anchoTarjeta + GAP);
        this.dibujarTarjetaProducto(doc, producto, x, y, anchoTarjeta);

        columna += 1;
        if (columna >= COLUMNAS) {
          columna = 0;
          y += TARJETA_ALTO + GAP;
        }
      }

      if (columna !== 0) {
        y += TARJETA_ALTO + GAP;
        columna = 0;
      }
      y += 10;
    }

    this.numerarPaginas(doc);
    doc.end();
    return fin;
  }

  private dibujarPortada(
    doc: PDFKit.PDFDocument,
    anchoUtil: number,
    totalProductos: number,
    totalCategorias: number,
  ) {
    // Franja de color de fondo, de borde a borde, para que la portada no sea
    // una hoja en blanco con texto centrado sino que se sienta diseñada.
    doc.rect(0, 0, doc.page.width, doc.page.height).fillColor(COLOR_CREAM).fill();
    doc.rect(0, 0, doc.page.width, 210).fillColor(COLOR_SAGE_SOFT).fill();
    doc.rect(0, doc.page.height - 90, doc.page.width, 90).fillColor(COLOR_ROSE).fillOpacity(0.35).fill();
    doc.fillOpacity(1);

    const centroX = MARGEN + anchoUtil / 2;

    if (existsSync(LOGO_PATH)) {
      doc.save();
      doc.circle(centroX, 210, 58).fillColor('#FFFFFF').fill();
      doc.restore();
      doc.image(LOGO_PATH, centroX - 50, 160, { width: 100, height: 100 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(30)
      .fillColor(COLOR_INK)
      .text('Guapa Gourmet Market', MARGEN, 300, { width: anchoUtil, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLOR_MUTED)
      .text('by Paola Rodríguez', MARGEN, 338, { width: anchoUtil, align: 'center' });

    doc
      .moveTo(centroX - 30, 372)
      .lineTo(centroX + 30, 372)
      .strokeColor(COLOR_ROSE_DEEP)
      .lineWidth(2)
      .stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLOR_SAGE_DEEP)
      .text('Catálogo de productos', MARGEN, 390, { width: anchoUtil, align: 'center' });

    const resumen =
      totalProductos === 0
        ? 'Aún no hay productos activos'
        : `${totalProductos} producto${totalProductos === 1 ? '' : 's'} · ${totalCategorias} categoría${totalCategorias === 1 ? '' : 's'}`;
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLOR_MUTED)
      .text(resumen, MARGEN, 416, { width: anchoUtil, align: 'center' });

    const hoy = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .font('Helvetica')
      .fontSize(9.5)
      .fillColor(COLOR_MUTED)
      .text(`Generado el ${hoy}`, MARGEN, doc.page.height - 55, { width: anchoUtil, align: 'center' });
  }

  /** Encabezado corrido (logo + nombre + línea) al inicio de cada página de contenido. Devuelve el y donde puede empezar el contenido. */
  private dibujarEncabezadoPagina(doc: PDFKit.PDFDocument, anchoUtil: number): number {
    if (existsSync(LOGO_PATH)) {
      doc.save();
      doc.circle(MARGEN + 8, MARGEN + 8, 8).clip();
      doc.image(LOGO_PATH, MARGEN, MARGEN, { width: 16, height: 16 });
      doc.restore();
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLOR_SAGE_DEEP)
      .text('GUAPA GOURMET MARKET', MARGEN + 24, MARGEN + 3, { characterSpacing: 0.6 });

    const yLinea = MARGEN + 22;
    doc
      .moveTo(MARGEN, yLinea)
      .lineTo(MARGEN + anchoUtil, yLinea)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    return yLinea + ALTO_ENCABEZADO_PAGINA - 22;
  }

  private dibujarEncabezadoCategoria(
    doc: PDFKit.PDFDocument,
    categoria: string,
    cantidad: number,
    anchoUtil: number,
    y: number,
    continuacion = false,
  ): number {
    doc.roundedRect(MARGEN, y + 2, 9, 9, 2).fillColor(COLOR_ROSE_DEEP).fill();

    doc
      .font('Helvetica-Bold')
      .fontSize(14)
      .fillColor(COLOR_INK)
      .text(continuacion ? `${categoria} (continuación)` : categoria, MARGEN + 16, y, {
        width: anchoUtil - 100,
        continued: false,
      });

    const etiquetaCantidad = `${cantidad} producto${cantidad === 1 ? '' : 's'}`;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR_MUTED)
      .text(etiquetaCantidad, MARGEN, y + 2, { width: anchoUtil, align: 'right' });

    const yLinea = y + 20;
    doc
      .moveTo(MARGEN, yLinea)
      .lineTo(MARGEN + anchoUtil, yLinea)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    return yLinea + 14;
  }

  private dibujarTarjetaProducto(
    doc: PDFKit.PDFDocument,
    producto: Producto,
    x: number,
    y: number,
    ancho: number,
  ) {
    const radio = 12;

    doc
      .roundedRect(x, y, ancho, TARJETA_ALTO, radio)
      .fillColor('#FFFFFF')
      .fill()
      .roundedRect(x, y, ancho, TARJETA_ALTO, radio)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    const rutaImg = rutaImagen(producto.imagenUrl);

    doc.save();
    doc.roundedRect(x, y, ancho, TARJETA_ALTO, radio).clip();
    if (rutaImg) {
      doc.image(rutaImg, x, y, { cover: [ancho, IMAGEN_ALTO], align: 'center', valign: 'center' });
    } else {
      doc.rect(x, y, ancho, IMAGEN_ALTO).fillColor(COLOR_SAGE_SOFT).fill();
      doc
        .font('Helvetica')
        .fontSize(9.5)
        .fillColor(COLOR_MUTED)
        .text('Sin foto', x, y + IMAGEN_ALTO / 2 - 5, { width: ancho, align: 'center' });
    }
    doc.restore();

    doc
      .moveTo(x, y + IMAGEN_ALTO)
      .lineTo(x + ancho, y + IMAGEN_ALTO)
      .strokeColor(COLOR_ROSE_DEEP)
      .lineWidth(2)
      .stroke();

    const padding = 14;
    const textoX = x + padding;
    const textoAncho = ancho - padding * 2;
    let cursorY = y + IMAGEN_ALTO + padding;

    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor(COLOR_INK)
      .text(producto.nombre, textoX, cursorY, { width: textoAncho, height: 30, ellipsis: true });
    cursorY += 32;

    if (producto.marcaNombre) {
      doc
        .font('Helvetica-Oblique')
        .fontSize(9)
        .fillColor(COLOR_MUTED)
        .text(producto.marcaNombre, textoX, cursorY, { width: textoAncho, height: 12, ellipsis: true });
    }
    cursorY += 18;

    const textoPrecio = formatoCOP.format(producto.precioVenta);
    doc.font('Helvetica-Bold').fontSize(14.5);
    const anchoPrecio = doc.widthOfString(textoPrecio);
    const pillPaddingX = 10;
    const pillAncho = anchoPrecio + pillPaddingX * 2;
    const pillAlto = 22;

    doc
      .roundedRect(textoX, cursorY, pillAncho, pillAlto, pillAlto / 2)
      .fillColor(COLOR_SAGE_SOFT)
      .fill();
    doc
      .fillColor(COLOR_SAGE_DEEP)
      .text(textoPrecio, textoX + pillPaddingX, cursorY + 4.5);

    if (producto.unidadMedida) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(COLOR_MUTED)
        .text(`/ ${producto.unidadMedida}`, textoX + pillAncho + 8, cursorY + 7, {
          width: textoAncho - pillAncho - 8,
        });
    }
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

      const yPie = doc.page.height - 30;
      doc
        .moveTo(MARGEN, yPie - 8)
        .lineTo(doc.page.width - MARGEN, yPie - 8)
        .strokeColor(COLOR_LINE)
        .lineWidth(1)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLOR_MUTED)
        .text('Guapa Gourmet Market', MARGEN, yPie, { width: 200 });
      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor(COLOR_MUTED)
        .text(`Página ${i + 1} de ${rango.count}`, MARGEN, yPie, {
          width: doc.page.width - MARGEN * 2,
          align: 'right',
        });
      doc.page.margins.bottom = margenInferiorOriginal;
    }
  }
}
