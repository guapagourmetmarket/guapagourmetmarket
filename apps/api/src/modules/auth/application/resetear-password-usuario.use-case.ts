import { randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';
import { RegistrarAuditoriaUseCase } from '../../auditoria/application/registrar-auditoria.use-case';

@Injectable()
export class ResetearPasswordUsuarioUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
    private readonly registrarAuditoriaUseCase: RegistrarAuditoriaUseCase,
  ) {}

  async ejecutar(id: string, usuarioActualId: string) {
    const passwordProvisional = randomBytes(6).toString('base64url');
    const passwordHash = await bcrypt.hash(passwordProvisional, 10);
    await this.usuariosRepository.establecerPassword(id, passwordHash);
    await this.registrarAuditoriaUseCase.ejecutar({
      usuarioId: usuarioActualId,
      accion: 'resetear_password_usuario',
      entidadTipo: 'usuario',
      entidadId: id,
    });
    return { passwordProvisional };
  }
}
