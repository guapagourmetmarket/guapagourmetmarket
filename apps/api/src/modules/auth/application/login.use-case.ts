import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { USUARIOS_REPOSITORY } from '../domain/usuarios.repository';
import type { UsuariosRepository } from '../domain/usuarios.repository';

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIOS_REPOSITORY) private readonly usuariosRepository: UsuariosRepository,
    private readonly jwtService: JwtService,
  ) {}

  async ejecutar(email: string, password: string) {
    const usuario = await this.usuariosRepository.buscarPorEmail(email);
    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const claveValida = await bcrypt.compare(password, usuario.passwordHash);
    if (!claveValida) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos.');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: usuario.id,
      email: usuario.email,
      rol: usuario.rol,
    });

    return {
      accessToken,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    };
  }
}
