import { IsNumber, IsString, Max, Min, MinLength } from 'class-validator';

export class CrearCuponDto {
  @IsString()
  @MinLength(3)
  codigo!: string;

  @IsNumber()
  @Min(0.01)
  @Max(100)
  porcentaje!: number;
}
