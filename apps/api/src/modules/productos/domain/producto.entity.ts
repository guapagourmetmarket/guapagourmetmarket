export type Iva = 0 | 5 | 19;

export interface InfoNutricional {
  calorias?: number;
  proteinaG?: number;
  grasaG?: number;
  carbohidratosG?: number;
  azucaresG?: number;
  sodioMg?: number;
}

export interface ImagenProducto {
  id: string;
  url: string;
  esPrincipal: boolean;
}

export interface Producto {
  id: string;
  codigoInterno: string;
  codigoBarras: string | null;
  nombre: string;
  descripcion: string | null;
  precioCompra: number;
  costoPromedio: number | null;
  precioVenta: number;
  iva: Iva;
  categoriaId: string;
  categoriaNombre: string;
  marcaId: string | null;
  marcaNombre: string | null;
  unidadMedida: string;
  existencias: number;
  stockMinimo: number;
  vendePorPeso: boolean;
  favoritoPos: boolean;
  imagenUrl: string | null;
  imagenes: ImagenProducto[];
  activo: boolean;
  ingredientes: string | null;
  infoNutricional: InfoNutricional | null;
  peso: number | null;
  pesoUnidad: string | null;
}

export interface NuevoProducto {
  codigoInterno: string;
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  iva: Iva;
  categoriaId: string;
  marcaId?: string;
  unidadMedida: string;
  existencias: number;
  stockMinimo?: number;
  vendePorPeso?: boolean;
  ingredientes?: string;
  infoNutricional?: InfoNutricional;
  peso?: number;
  pesoUnidad?: string;
}

export type CambiosProducto = Partial<NuevoProducto>;
