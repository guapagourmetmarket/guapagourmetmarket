export type RolUsuario = 'administrador' | 'cajero' | 'contador' | 'supervisor';

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  passwordHash: string;
  rol: RolUsuario;
  activo: boolean;
}
