import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class SongsService {
  constructor(private prisma: PrismaService) {}

  async getAllSongs() {
    return this.prisma.song.findMany();
  }

  async searchSongs(query: string) {
    return this.prisma.song.findMany({
      where: { title: { contains: query, mode: 'insensitive' } },
    });
  }

  async toggleFavorite(songId: string, userId: string) {
    const song = await this.prisma.song.findUnique({ where: { id: songId } });
    if (!song) throw new Error("Song not found");

    return this.prisma.song.update({
      where: { id: songId },
      data: { isFavorite: !song.isFavorite, userId },
    });
  }
}
