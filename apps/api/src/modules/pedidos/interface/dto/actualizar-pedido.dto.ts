import { IsISO8601, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class ActualizarPedidoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  clienteNombre?: string;

  @IsOptional()
  @IsString()
  clienteTelefono?: string | null;

  @IsOptional()
  @IsString()
  @MinLength(3)
  descripcion?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  fechaEntrega?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  anticipo?: number;

  @IsOptional()
  @IsString()
  notas?: string | null;
}
