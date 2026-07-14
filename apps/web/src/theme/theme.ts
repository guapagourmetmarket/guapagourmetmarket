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

    // Superficies naturales
    cream: "#FBEBCF",       // fondo de la app
    beige: "#F0E1C3",       // superficie alterna
    sand: "#E5D9BF",        // bordes marcados
    surface: "#FFFFFF",     // tarjetas
    line: "#ECE4D5",        // hairline

    // Texto
    ink: "#2E332C",         // primario (carbón cálido)
    muted: "#7C8279",       // secundario
    faint: "#A7ABA1",       // pistas / placeholders

    // Semánticos (suaves)
    success: "#4A8054",
    warning: "#D9A13A",     // próximo a vencer
    danger: "#CB6149",      // stock bajo / error
  },

  typography: {
    display: "'Poppins', -apple-system, sans-serif", // marca y titulares (geométrica, acorde al logo)
    body: "'Inter', -apple-system, 'Segoe UI', Roboto, sans-serif", // UI, formularios, tablas
    numeric: "font-variant-numeric: tabular-nums",
  },

  radius: { sm: "10px", md: "14px", lg: "20px", pill: "999px" },
  shadow: { card: "0 1px 2px rgba(46,51,44,0.05)", pop: "0 8px 24px rgba(46,51,44,0.12)" },
} as const;

/** Publica la marca como variables CSS en :root. Llamar al arrancar la app. */
export function applyBrand(b = brand) {
  const r = document.documentElement.style;
  Object.entries(b.colors).forEach(([k, v]) => r.setProperty(`--c-${k}`, v));
  Object.entries(b.radius).forEach(([k, v]) => r.setProperty(`--radius-${k}`, v));
  Object.entries(b.shadow).forEach(([k, v]) => r.setProperty(`--shadow-${k}`, v));
  r.setProperty("--font-display", b.typography.display);
  r.setProperty("--font-body", b.typography.body);
}

export type BrandColors = keyof typeof brand.colors;
