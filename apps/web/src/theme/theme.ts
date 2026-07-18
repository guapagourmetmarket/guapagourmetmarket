/**
 * Guapa Gourmet Market — Design Tokens
 * ------------------------------------------------------------
 * ÚNICA FUENTE DE VERDAD de la identidad visual.
 * Colores oficiales tomados del logotipo de la marca.
 * Para refrescar la identidad en el futuro, edita solo `brand`.
 */

export const brand = {
  name: "Guapa Gourmet Market",
  creator: "Paola Rodríguez", // creadora de la marca — mostrar como "by Paola Rodríguez"

  // Dominio público de la app (para armar enlaces absolutos, ej. el del código QR).
  publicUrl: "https://guapagourmetmarket-web.vercel.app",

  // Logo oficial (círculo con fondo transparente). Reemplazable en /public/brand/.
  logo: {
    full: "/brand/logo-guapa.png",     // 256px
    hi:   "/brand/logo-guapa@2x.png",  // 512px (retina / impresión)
  },

  contacto: {
    telefono: "317 404 7796",
    telefonoHref: "tel:+573174047796",
    whatsappHref: "https://wa.me/573174047796",
    direccion: "Calle 1 # 4-09, Barrio Las Villas, Mosquera, Cundinamarca",
    // Enlaces exactos (no una búsqueda por dirección) para que "cómo llegar" lleve al punto preciso.
    mapsHref: "https://maps.app.goo.gl/NTy584eTYFm1vBx7A",
    wazeHref: "https://waze.com/ul/hd2g4yb99e",
    // Enlace oficial "Solicita opiniones" del Perfil de Negocio de Google de Paola.
    resenaHref: "https://g.page/r/CS3ruEimoT5TEBM/review",
    instagram: "@guapa_gourmet",
    instagramHref: "https://instagram.com/guapa_gourmet",
    tiktok: "@guapagourmet",
    tiktokHref: "https://www.tiktok.com/@guapagourmet",
    // Portal donde Paola emite la factura electrónica gratuita de la DIAN
    // (el sistema no está integrado con la DIAN, esto solo abre un acceso directo).
    dianHref: "https://catalogo-vpfe-hab.dian.gov.co/User/PersonLogin",
  },

  colors: {
    // Marca (del logo) — un punto más vivos que el pastel original, a pedido
    // de Paola ("se veía muy pálido"), sin llegar a colores saturados.
    sage: "#7EB484",        // verde del logo (marca, superficies suaves)
    sageDeep: "#4A8054",    // salvia fuerte: botones y texto sobre claro
    sageDark: "#3C6946",    // hover
    sageSoft: "#E6F0E3",    // tintes, chips

    rose: "#E7B0A7",        // rosa empolvado del logo (acento cálido)
    roseSoft: "#F6E2DE",
    roseDeep: "#B6665B",    // texto sobre rosa / acentos
    // Variante más oscura de roseDeep, solo para texto pequeño en mayúsculas
    // (ej. la barra de navegación): roseDeep da 4.16:1 sobre blanco, por
    // debajo del mínimo de accesibilidad (4.5:1) a ese tamaño; esta da 7.3:1.
    roseInk: "#8B4038",

    // Superficies naturales
    cream: "#FBEBCF",       // fondo de la app
    beige: "#F0E1C3",       // superficie alterna
    sand: "#E5D9BF",        // bordes marcados
    surface: "#FFFFFF",     // tarjetas
    line: "#ECE4D5",        // hairline

    // Texto
    ink: "#2E332C",         // primario (carbón cálido)
    // Un poco más oscuro que el salvia original (#7C8279): a ese tono le
    // faltaba contraste (3.9:1) para leerse bien como texto sobre blanco;
    // este cumple el mínimo de accesibilidad (4.5:1) sin verse distinto.
    muted: "#61655E",       // secundario
    faint: "#8E9189",       // pistas / placeholders

    // Semánticos (suaves)
    success: "#4A8054",
    warning: "#D9A13A",     // próximo a vencer — fondos de insignia/punto
    // Variante oscura de `warning`, solo para texto (ej. "3 unidades" en
    // rojo mostaza): el tono claro de arriba no se leía bien sobre blanco.
    warningText: "#876424",
    danger: "#CB6149",      // stock bajo / error
    dangerHover: "#B34E38", // hover de botones de peligro (~12% más oscuro)
    // Rojo vivo (más saturado que `danger`) solo para el puntico de alarma
    // de la barra de navegación ("Alertas"): a propósito rompe la regla de
    // "sin colores saturados" porque su trabajo es alarmar y resaltar, no
    // decorar — pidió Paola que se viera "realmente rojo".
    alerta: "#E5342A",

    // Texto de botones/insignias con fondo sólido de un color de marca
    // (sageDeep, roseDeep, danger, warning). En modo claro esos fondos son
    // oscuros → texto blanco. En modo oscuro esos mismos tokens se aclaran
    // (ver `darkColors`) → el texto pasa a oscuro en esa variante.
    onAccent: "#FFFFFF",
  },

  typography: {
    display: "'Poppins', -apple-system, sans-serif", // marca y titulares (geométrica, acorde al logo)
    body: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif", // UI, formularios, tablas
    numeric: "font-variant-numeric: tabular-nums",
  },

  radius: { sm: "10px", md: "14px", lg: "20px", pill: "999px" },
  shadow: { card: "0 1px 2px rgba(46,51,44,0.05)", pop: "0 8px 24px rgba(46,51,44,0.12)" },
} as const;

/**
 * Modo oscuro — mismos matices de marca (salvia y rosa empolvado), pero
 * invertidos: fondo oscuro cálido en vez de crema, texto claro en vez de
 * tinta. Los acentos (sageDeep, roseDeep, warning, danger) se aclaran para
 * leerse bien como texto sobre el fondo oscuro; por eso `onAccent` cambia
 * a un tono oscuro aquí (antes era blanco), para que los botones/insignias
 * de fondo sólido sigan siendo legibles. Todos los valores verificados con
 * la fórmula de contraste WCAG (mínimo 4.5:1 texto, 3:1 íconos/UI).
 */
export const darkColors = {
  sage: "#6FA378",
  sageDeep: "#7EB484",
  sageDark: "#94C99B",
  sageSoft: "#2E3B2C",

  rose: "#D9998D",
  roseSoft: "#3A2C29",
  roseDeep: "#E2A79C",
  roseInk: "#E2A79C",

  cream: "#232922",
  beige: "#2E352A",
  sand: "#4A5142",
  surface: "#333A2D",
  line: "#3F4638",

  ink: "#F3EFE3",
  muted: "#C6C7BA",
  faint: "#93968A",

  success: "#7EB484",
  warning: "#E3AE4E",
  warningText: "#F0C878",
  danger: "#E28268",
  dangerHover: "#EC9782", // en oscuro el hover aclara en vez de oscurecer
  alerta: "#FF5A4C",

  onAccent: "#232922",
} as const;

export type TemaModo = "claro" | "oscuro";

/** Publica la marca como variables CSS en :root. Llamar al arrancar la app. */
export function applyBrand(b = brand, modo: TemaModo = "claro") {
  const r = document.documentElement.style;
  const colores = modo === "oscuro" ? darkColors : b.colors;
  Object.entries(colores).forEach(([k, v]) => r.setProperty(`--c-${k}`, v));
  Object.entries(b.radius).forEach(([k, v]) => r.setProperty(`--radius-${k}`, v));
  Object.entries(b.shadow).forEach(([k, v]) => r.setProperty(`--shadow-${k}`, v));
  r.setProperty("--font-display", b.typography.display);
  r.setProperty("--font-body", b.typography.body);
  document.documentElement.style.colorScheme = modo === "oscuro" ? "dark" : "light";
  document.documentElement.setAttribute("data-tema", modo);
}

export type BrandColors = keyof typeof brand.colors;
