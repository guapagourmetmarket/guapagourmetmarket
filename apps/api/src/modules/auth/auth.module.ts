import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JWT_SECRET } from '../../env';
import { AuthController } from './interface/auth.controller';
import { LoginUseCase } from './application/login.use-case';
import { ActualizarPerfilUseCase } from './application/actualizar-perfil.use-case';
import { ObtenerPerfilUseCase } from './application/obtener-perfil.use-case';
import { UsuariosRepositoryPg } from './infrastructure/usuarios.repository.pg';
import { JwtStrategy } from './infrastructure/jwt.strategy';
import { USUARIOS_REPOSITORY } from './domain/usuarios.repository';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: JWT_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    LoginUseCase,
    ActualizarPerfilUseCase,
    ObtenerPerfilUseCase,
    JwtStrategy,
    { provide: USUARIOS_REPOSITORY, useClass: UsuariosRepositoryPg },
  ],
})
export class AuthModule {}
