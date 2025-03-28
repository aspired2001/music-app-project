import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './database/prisma.module';
import { SongsService } from './songs/songs.service';
import { AuthService } from './auth/auth.service';
import { SpotifyService } from './songs/spotify.service';
import { SpotifyController } from './songs/spotify.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    AppController,
    SpotifyController
  ],
  providers: [
    AppService,
    SongsService,
    AuthService,
    SpotifyService
  ],
})
export class AppModule { }