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

// Rutas SVG (viewBox 24x24) de los íconos reales, tomadas de Simple Icons (CC0,
// pensado justo para enlazar/mencionar perfiles) y Lucide (ya usado en la web).
const IG_PATH =
  'M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077';
const TT_PATH =
  'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z';
const PHONE_PATH =
  'M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384';

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

    // Teléfono con insignia (ícono real de teléfono).
    const textoTel = `Tel. ${CONTACTO_TELEFONO}`;
    doc.font('Helvetica-Bold').fontSize(10.5);
    const anchoTel = doc.widthOfString(textoTel);
    const radioTel = 9;
    const gapTelTexto = 8;
    const grupoTelAncho = radioTel * 2 + gapTelTexto + anchoTel;
    const telY = cardY + 64;
    const telX = centroX - grupoTelAncho / 2 + radioTel;
    this.dibujarInsignia(doc, telX, telY, radioTel, COLOR_SAGE_DARK, PHONE_PATH, '#FFFFFF', true);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(textoTel, telX + radioTel + gapTelTexto, telY - 5, { lineBreak: false });

    doc
      .moveTo(MARGEN + 60, cardY + 86)
      .lineTo(MARGEN + anchoUtil - 60, cardY + 86)
      .strokeColor(COLOR_LINE)
      .lineWidth(1)
      .stroke();

    // Fila de redes sociales con el ícono real de cada plataforma en una insignia de color.
    doc.font('Helvetica-Bold').fontSize(10.5);
    const anchoIg = doc.widthOfString(CONTACTO_INSTAGRAM);
    const anchoTt = doc.widthOfString(CONTACTO_TIKTOK);
    const radioRed = 10;
    const gapIconoTexto = 8;
    const gapGrupos = 26;
    const grupoIgAncho = radioRed * 2 + gapIconoTexto + anchoIg;
    const grupoTtAncho = radioRed * 2 + gapIconoTexto + anchoTt;
    const filaAncho = grupoIgAncho + gapGrupos + grupoTtAncho;
    let cursorX = centroX - filaAncho / 2 + radioRed;
    const filaY = cardY + 102;

    this.dibujarInsignia(doc, cursorX, filaY, radioRed, '#E1306C', IG_PATH, '#FFFFFF', false);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(CONTACTO_INSTAGRAM, cursorX + radioRed + gapIconoTexto, filaY - 5, { lineBreak: false });
    cursorX += grupoIgAncho + gapGrupos;

    this.dibujarInsignia(doc, cursorX, filaY, radioRed, '#000000', TT_PATH, '#FFFFFF', false);
    doc
      .font('Helvetica-Bold')
      .fontSize(10.5)
      .fillColor(COLOR_INK)
      .text(CONTACTO_TIKTOK, cursorX + radioRed + gapIconoTexto, filaY - 5, { lineBreak: false });

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

  /** Dibuja un ícono a partir de una ruta SVG (viewBox 24x24), escalado al tamaño pedido. */
  private dibujarIconoSvg(
    doc: PDFKit.PDFDocument,
    pathD: string,
    x: number,
    y: number,
    size: number,
    color: string,
    trazo = false,
  ) {
    const escala = size / 24;
    doc.save();
    doc.translate(x, y).scale(escala);
    const trazado = doc.path(pathD);
    if (trazo) {
      trazado.lineWidth(2).strokeColor(color).lineCap('round').lineJoin('round').stroke();
    } else {
      trazado.fillColor(color).fill();
    }
    doc.restore();
  }

  /** Insignia circular de color con un ícono real adentro (teléfono, Instagram, TikTok). */
  private dibujarInsignia(
    doc: PDFKit.PDFDocument,
    cx: number,
    cy: number,
    radio: number,
    colorFondo: string,
    pathD: string,
    colorIcono: string,
    trazo: boolean,
  ) {
    doc.circle(cx, cy, radio).fillColor(colorFondo).fill();
    const size = radio * 1.15;
    this.dibujarIconoSvg(doc, pathD, cx - size / 2, cy - size / 2, size, colorIcono, trazo);
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
