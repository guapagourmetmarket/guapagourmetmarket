import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';
import type { NuevoUsuario } from '../domain/usuario.entity';

@Injectable()
export class CrearUsuarioUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
  ) {}

  async ejecutar(datos: NuevoUsuario) {
    const passwordProvisional = randomBytes(6).toString('base64url');
    const passwordHash = await bcrypt.hash(passwordProvisional, 10);
    const usuario = await this.usuariosRepository.crear(datos, passwordHash);
    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
      activo: usuario.activo,
      passwordProvisional,
    };
  }
}
