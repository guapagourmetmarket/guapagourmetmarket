import { IsBoolean } from 'class-validator';

export class CambiarFavoritoDto {
  @IsBoolean()
  favoritoPos!: boolean;
}
