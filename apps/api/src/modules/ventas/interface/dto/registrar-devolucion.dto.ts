import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RegistrarDevolucionDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  cantidad!: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}
