import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { Inject, Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { PRODUCTOS_REPOSITORY } from '../domain/productos.repository';
import type { ProductosRepository } from '../domain/productos.repository';
import type { Producto } from '../domain/producto.entity';

const LOGO_PATH = join(__dirname, '..', '..', '..', '..', 'assets', 'brand', 'logo-guapa.png');
const ESCUDO_PATH = join(__dirname, '..', '..', '..', '..', 'assets', 'brand', 'escudo-mariano-moreno.png');
// Proporción real del recorte del escudo (ancho / alto), para dibujarlo sin deformarlo.
const ESCUDO_RATIO = 211 / 435;

const COLOR_SAGE_DEEP = '#5F7A64';
const COLOR_SAGE_DARK = '#3C6946';
const COLOR_SAGE_SOFT = '#EAF0E8';
const COLOR_ROSE = '#E2C1BC';
const COLOR_ROSE_DEEP = '#C4948C';
const COLOR_INK = '#2E332C';
const COLOR_MUTED = '#8A8F84';
const COLOR_LINE = '#ECE4D5';
const COLOR_CREAM = '#FAF5EC';

const MARGEN = 40;

const CONTACTO_TELEFONO = '317 404 7796';
const CONTACTO_DIRECCION = 'Calle 1 # 4-09, Barrio Las Villas, Mosquera, Cundinamarca';
const CONTACTO_INSTAGRAM = '@guapa_gourmet';
const CONTACTO_TIKTOK = '@guapagourmet';
const LINEA_CONTACTO_PIE = `${CONTACTO_DIRECCION}  ·  Tel. ${CONTACTO_TELEFONO}  ·  IG ${CONTACTO_INSTAGRAM}  ·  TikTok ${CONTACTO_TIKTOK}`;
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

/** Las fotos de producto viven en Cloudinary (URL completa); se descargan para incrustarlas en el PDF. */
async function obtenerBufferImagen(url: string | null): Promise<Buffer | null> {
  if (!url || !/^https?:\/\//.test(url)) return null;
  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) return null;
    return Buffer.from(await respuesta.arrayBuffer());
  } catch {
    return null;
  }
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

    const imagenesPorProducto = new Map<string, Buffer | null>();
    await Promise.all(
      productos.map(async (p) => {
        imagenesPorProducto.set(p.id, await obtenerBufferImagen(p.imagenUrl));
      }),
    );

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
        this.dibujarTarjetaProducto(
          doc,
          producto,
          x,
          y,
          anchoTarjeta,
          imagenesPorProducto.get(producto.id) ?? null,
        );

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
    const centroX = MARGEN + anchoUtil / 2;

    // Fondo verde de borde a borde (identidad de marca), con dos círculos
    // suaves de textura para que no se sienta un panel plano.
    doc.rect(0, 0, doc.page.width, doc.page.height).fillColor(COLOR_SAGE_DEEP).fill();
    doc.save();
    doc.circle(doc.page.width + 30, 10, 150).fillColor('#FFFFFF').fillOpacity(0.05).fill();
    doc.circle(-20, doc.page.height - 40, 170).fillColor(COLOR_ROSE).fillOpacity(0.14).fill();
    doc.restore();

    if (existsSync(LOGO_PATH)) {
      doc.circle(centroX, 118, 56).fillColor('#FFFFFF').fill();
      doc.image(LOGO_PATH, centroX - 48, 70, { width: 96, height: 96 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(34)
      .fillColor('#FFFFFF')
      .text('GUAPA GOURMET MARKET', MARGEN, 200, { width: anchoUtil, align: 'center', characterSpacing: 0.4 });

    doc
      .font('Helvetica')
      .fontSize(13)
      .fillColor(COLOR_CREAM)
      .text('C A T Á L O G O   D E   P R O D U C T O S', MARGEN, 242, { width: anchoUtil, align: 'center' });

    doc.moveTo(centroX - 40, 272).lineTo(centroX + 40, 272).strokeColor(COLOR_ROSE).lineWidth(2).stroke();

    doc
      .font('Helvetica-Bold')
      .fontSize(19)
      .fillColor(COLOR_CREAM)
      .text('Chef Paola Rodríguez', MARGEN, 288, { width: anchoUtil, align: 'center' });

    const escudoTopY = 318;
    const alturaEscudo = this.dibujarEscudoGastronomia(doc, centroX, escudoTopY, 58);
    const yCaption = escudoTopY + alturaEscudo + 14;

    doc
      .font('Helvetica-Oblique')
      .fontSize(10)
      .fillColor(COLOR_CREAM)
      .text('Egresada de la Escuela de Gastronomía Mariano Moreno', MARGEN, yCaption, {
        width: anchoUtil,
        align: 'center',
      });

    const resumen =
      totalProductos === 0
        ? 'Aún no hay productos activos'
        : `${totalProductos} producto${totalProductos === 1 ? '' : 's'} · ${totalCategorias} categoría${totalCategorias === 1 ? '' : 's'}`;
    const yResumen = yCaption + 22;
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor(COLOR_CREAM)
      .text(resumen, MARGEN, yResumen, { width: anchoUtil, align: 'center' });

    const yDivisor2 = yResumen + 48;
    doc
      .moveTo(centroX - 26, yDivisor2)
      .lineTo(centroX + 26, yDivisor2)
      .strokeColor(COLOR_ROSE)
      .lineWidth(1.4)
      .stroke();

    // Lema destacado en una píldora de color, para que resalte sobre el fondo verde.
    const textoLema = 'TU NUEVO HÁBITO SALUDABLE';
    doc.font('Helvetica-Bold').fontSize(15);
    const anchoLema = doc.widthOfString(textoLema);
    const lemaPaddingX = 22;
    const lemaAncho = anchoLema + lemaPaddingX * 2;
    const lemaAlto = 34;
    const lemaY = yDivisor2 + 18;
    doc
      .roundedRect(centroX - lemaAncho / 2, lemaY, lemaAncho, lemaAlto, lemaAlto / 2)
      .fillColor(COLOR_ROSE_DEEP)
      .fill();
    doc
      .font('Helvetica-Bold')
      .fontSize(15)
      .fillColor('#FFFFFF')
      .text(textoLema, centroX - lemaAncho / 2, lemaY + 10, { width: lemaAncho, align: 'center' });

    // Tarjeta de contacto: dirección, teléfono y redes sociales con su ícono.
    const cardY = 570;
    const cardAlto = 158;
    doc.roundedRect(MARGEN, cardY, anchoUtil, cardAlto, 16).fillColor(COLOR_CREAM).fill();

    doc
      .font('Helvetica-Bold')
      .fontSize(9.5)
      .fillColor(COLOR_SAGE_DARK)
      .text('VISÍTANOS Y SÍGUENOS', MARGEN, cardY + 18, {
        width: anchoUtil,
        align: 'center',
        characterSpacing: 1.2,
      });

    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(CONTACTO_DIRECCION, MARGEN + 24, cardY + 40, { width: anchoUtil - 48, align: 'center' });

    doc
      .font('Helvetica')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(`Tel. ${CONTACTO_TELEFONO}`, MARGEN, cardY + 60, { width: anchoUtil, align: 'center' });

    doc
      .moveTo(MARGEN + 60, cardY + 84)
      .lineTo(MARGEN + anchoUtil - 60, cardY + 84)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    doc.font('Helvetica-Bold').fontSize(10.5);
    const anchoIg = doc.widthOfString(CONTACTO_INSTAGRAM);
    const anchoTt = doc.widthOfString(CONTACTO_TIKTOK);
    const iconoSize = 15;
    const gapIconoTexto = 6;
    const gapGrupos = 30;
    const grupoIgAncho = iconoSize + gapIconoTexto + anchoIg;
    const grupoTtAncho = iconoSize + gapIconoTexto + anchoTt;
    const filaAncho = grupoIgAncho + gapGrupos + grupoTtAncho;
    let cursorX = centroX - filaAncho / 2;
    const filaY = cardY + 100;

    this.dibujarIconoInstagram(doc, cursorX, filaY - 1, iconoSize, COLOR_ROSE_DEEP);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(CONTACTO_INSTAGRAM, cursorX + iconoSize + gapIconoTexto, filaY, { lineBreak: false });
    cursorX += grupoIgAncho + gapGrupos;

    this.dibujarIconoTikTok(doc, cursorX, filaY - 1, iconoSize, COLOR_INK);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(CONTACTO_TIKTOK, cursorX + iconoSize + gapIconoTexto, filaY, { lineBreak: false });

    const hoy = new Date().toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLOR_CREAM)
      .text(`Generado el ${hoy}`, MARGEN, cardY + cardAlto + 18, { width: anchoUtil, align: 'center' });
  }

  /** Escudo oficial de la Escuela de Gastronomía Mariano Moreno, en una placa blanca para que resalte sobre el fondo verde. Devuelve el alto total dibujado. */
  private dibujarEscudoGastronomia(doc: PDFKit.PDFDocument, cx: number, topY: number, alto: number): number {
    const ancho = alto * ESCUDO_RATIO;
    const padX = 16;
    const padY = 12;
    const cardAncho = ancho + padX * 2;
    const cardAlto = alto + padY * 2;
    const cardX = cx - cardAncho / 2;

    doc.roundedRect(cardX, topY, cardAncho, cardAlto, 10).fillColor('#FFFFFF').fill();
    if (existsSync(ESCUDO_PATH)) {
      doc.image(ESCUDO_PATH, cx - ancho / 2, topY + padY, { width: ancho, height: alto });
    }
    return cardAlto;
  }

  private dibujarIconoInstagram(doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string) {
    doc.save();
    doc.roundedRect(x, y, size, size, size * 0.28).lineWidth(1.2).strokeColor(color).stroke();
    doc.circle(x + size / 2, y + size / 2, size * 0.24).lineWidth(1.2).strokeColor(color).stroke();
    doc.circle(x + size * 0.76, y + size * 0.24, size * 0.07).fillColor(color).fill();
    doc.restore();
  }

  private dibujarIconoTikTok(doc: PDFKit.PDFDocument, x: number, y: number, size: number, color: string) {
    doc.save();
    const cx = x + size * 0.42;
    const cy = y + size * 0.78;
    const r = size * 0.22;
    doc.circle(cx, cy, r).fillColor(color).fill();
    doc
      .moveTo(cx + r, cy)
      .lineTo(cx + r, y + size * 0.08)
      .lineWidth(size * 0.16)
      .strokeColor(color)
      .stroke();
    doc
      .moveTo(cx + r, y + size * 0.08)
      .quadraticCurveTo(x + size * 0.95, y + size * 0.08, x + size * 0.95, y + size * 0.38)
      .lineWidth(size * 0.14)
      .strokeColor(color)
      .stroke();
    doc.restore();
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
    imagenBuffer: Buffer | null,
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

    doc.save();
    doc.roundedRect(x, y, ancho, TARJETA_ALTO, radio).clip();
    if (imagenBuffer) {
      doc.image(imagenBuffer, x, y, { cover: [ancho, IMAGEN_ALTO], align: 'center', valign: 'center' });
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
      const anchoUtil = doc.page.width - MARGEN * 2;

      const yPie = doc.page.height - 44;
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
          width: anchoUtil,
          align: 'right',
        });

      // Datos de contacto de la chef, presentes en todas las hojas del catálogo.
      doc
        .font('Helvetica')
        .fontSize(7)
        .fillColor(COLOR_MUTED)
        .text(LINEA_CONTACTO_PIE, MARGEN, yPie + 12, { width: anchoUtil, align: 'center' });

      doc.page.margins.bottom = margenInferiorOriginal;
    }
  }
}
