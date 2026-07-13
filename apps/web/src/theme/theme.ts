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

  // Logo oficial (círculo con fondo transparente). Reemplazable en /public/brand/.
  logo: {
    full: "/brand/logo-guapa.png",     // 256px
    hi:   "/brand/logo-guapa@2x.png",  // 512px (retina / impresión)
  },

  colors: {
    // Marca (del logo)
    sage: "#9AAD9C",        // verde del logo (marca, superficies suaves)
    sageDeep: "#5F7A64",    // salvia fuerte: botones y texto sobre claro
    sageDark: "#4C6351",    // hover
    sageSoft: "#EAF0E8",    // tintes, chips

    rose: "#E2C1BC",        // rosa empolvado del logo (acento cálido)
    roseSoft: "#F5E7E4",
    roseDeep: "#A97D77",    // texto sobre rosa / acentos

    // Superficies naturales
    cream: "#FAF5EC",       // fondo de la app
    beige: "#EFE7D8",       // superficie alterna
    sand: "#E3DAC6",        // bordes marcados
    surface: "#FFFFFF",     // tarjetas
    line: "#ECE4D5",        // hairline

    // Texto
    ink: "#2E332C",         // primario (carbón cálido)
    muted: "#7C8279",       // secundario
    faint: "#A7ABA1",       // pistas / placeholders

    // Semánticos (suaves)
    success: "#5F7A64",
    warning: "#CFA24E",     // próximo a vencer
    danger: "#C0705E",      // stock bajo / error
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
