import { IsBoolean, IsIn, IsOptional, IsString, MinLength } from 'class-validator';
import type { RolUsuario } from '../../domain/usuario.entity';

const ROLES: RolUsuario[] = ['administrador', 'cajero', 'contador', 'supervisor'];

export class ActualizarUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  nombre?: string;

  @IsOptional()
  @IsIn(ROLES)
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
