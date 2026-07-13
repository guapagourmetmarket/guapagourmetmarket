import { Usuario } from './usuario.entity';

export interface CambiosCredenciales {
  email?: string;
  passwordHash?: string;
}

export interface UsuariosRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  actualizarCredenciales(id: string, cambios: CambiosCredenciales): Promise<Usuario>;
}

export const USUARIOS_REPOSITORY = 'USUARIOS_REPOSITORY';
