import { IsISO8601, IsNumber, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class CrearPedidoDto {
  @IsString()
  @MinLength(2)
  clienteNombre!: string;

  @IsOptional()
  @IsString()
  clienteTelefono?: string;

  @IsString()
  @MinLength(3)
  descripcion!: string;

  @IsISO8601({ strict: true })
  fechaEntrega!: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  valor?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  anticipo?: number;

  @IsOptional()
  @IsString()
  notas?: string;
}
