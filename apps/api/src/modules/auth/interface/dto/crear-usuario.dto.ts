import { IsEmail, IsIn, IsString, MinLength } from 'class-validator';
import type { RolUsuario } from '../../domain/usuario.entity';

const ROLES: RolUsuario[] = ['administrador', 'cajero', 'contador', 'supervisor'];

export class CrearUsuarioDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsEmail()
  email!: string;

  @IsIn(ROLES)
  rol!: RolUsuario;
}
