import { IsNumber, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class RegistrarAjusteDto {
  @IsUUID()
  productoId!: string;

  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  cantidadNueva!: number;

  @IsString()
  @MinLength(3)
  motivo!: string;
}
