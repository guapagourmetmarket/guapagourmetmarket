export interface Proveedor {
  id: string;
  nombre: string;
  nit: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  condicionesPago: string | null;
  activo: boolean;
}

export interface NuevoProveedor {
  nombre: string;
  nit?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  condicionesPago?: string;
}

export type CambiosProveedor = Partial<NuevoProveedor>;
