import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class ActualizarPerfilDto {
  @IsString()
  @MinLength(6)
  passwordActual!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  passwordNueva?: string;
}
