export interface Negocio {
  id: string;
  nombre: string;
  nit: string;
  direccion: string | null;
  telefono: string | null;
}

export interface CambiosNegocio {
  nombre?: string;
  nit?: string;
  direccion?: string;
  telefono?: string;
}
