import { IsNumber, IsOptional, Min } from 'class-validator';

export class InfoNutricionalDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  calorias?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  proteinaG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  grasaG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  carbohidratosG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  azucaresG?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  sodioMg?: number;
}
