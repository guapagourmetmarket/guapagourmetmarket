import { IsEmail, IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class CrearClienteDto {
  @IsString()
  @MinLength(2)
  nombre!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  fechaNacimiento?: string;
}
