import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';

export interface CambiosPerfil {
  passwordActual: string;
  email?: string;
  passwordNueva?: string;
}

@Injectable()
export class ActualizarPerfilUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async ejecutar(usuarioId: string, cambios: CambiosPerfil) {
    if (!cambios.email && !cambios.passwordNueva) {
      throw new BadRequestException('No hay ningún cambio para guardar.');
    }

    const usuario = await this.usuariosRepository.buscarPorId(usuarioId);
    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const claveValida = await bcrypt.compare(cambios.passwordActual, usuario.passwordHash);
    if (!claveValida) {
      throw new UnauthorizedException('La contraseña actual no es correcta.');
    }

    const nuevoHash = cambios.passwordNueva ? await bcrypt.hash(cambios.passwordNueva, 10) : undefined;

    const actualizado = await this.usuariosRepository.actualizarCredenciales(usuarioId, {
      email: cambios.email,
      passwordHash: nuevoHash,
    });

    return { id: actualizado.id, nombre: actualizado.nombre, email: actualizado.email, rol: actualizado.rol };
  }
}
