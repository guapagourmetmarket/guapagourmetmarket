import { CambiosUsuario, NuevoUsuario, Usuario } from './usuario.entity';

export interface CambiosCredenciales {
  email?: string;
  passwordHash?: string;
}

export interface UsuariosRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  buscarPorId(id: string): Promise<Usuario | null>;
  actualizarCredenciales(id: string, cambios: CambiosCredenciales): Promise<Usuario>;
  crear(usuario: NuevoUsuario, passwordHash: string): Promise<Usuario>;
  listar(): Promise<Usuario[]>;
  actualizar(id: string, cambios: CambiosUsuario): Promise<Usuario>;
  establecerPassword(id: string, passwordHash: string): Promise<void>;
}

export const USUARIOS_REPOSITORY = 'USUARIOS_REPOSITORY';
