export type RolUsuario = 'administrador' | 'cajero' | 'contador' | 'supervisor';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface NuevoUsuario {
  nombre: string;
  email: string;
  rol: RolUsuario;
}

export interface CambiosUsuario {
  nombre?: string;
  rol?: RolUsuario;
  activo?: boolean;
}
