import { IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class AgregarItemCuentaDto {
  @IsOptional()
  @IsUUID()
  productoId?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  descripcionLibre?: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioUnitario?: number;
}
