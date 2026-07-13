import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class CanjearPuntosDto {
  @IsInt()
  @Min(1)
  puntos!: number;

  @IsString()
  @MinLength(2)
  motivo!: string;
}
