import { IsInt, IsString, IsUUID, Min, MinLength } from 'class-validator';

export class RegistrarAjusteDto {
  @IsUUID()
  productoId!: string;

  @IsInt()
  @Min(0)
  cantidadNueva!: number;

  @IsString()
  @MinLength(3)
  motivo!: string;
}
