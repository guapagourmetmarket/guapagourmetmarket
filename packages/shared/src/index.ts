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
  codigoBarras?: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  costoPromedio?: number | null;
  precioVenta: number;
  iva: Iva;
  categoriaId: string;
  categoriaNombre: string;
  marcaId?: string;
  marcaNombre?: string;
  unidadMedida: string;
  existencias: number;
  stockMinimo?: number;
  vendePorPeso?: boolean;
  descuentoPorcentaje?: number | null;
  precioOferta?: number | null;
  imagenUrl?: string;
  imagenes: ImagenProducto[];
  favoritoPos?: boolean;
  activo?: boolean;
  ingredientes?: string;
  infoNutricional?: InfoNutricional;
  peso?: number;
  pesoUnidad?: string;
}

export interface Categoria {
  id: string;
  nombre: string;
}

export interface Marca {
  id: string;
  nombre: string;
}
