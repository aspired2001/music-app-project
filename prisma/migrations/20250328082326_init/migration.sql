/*
  Warnings:

  - A unique constraint covering the columns `[spotifyId]` on the table `Song` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Song" ADD COLUMN     "albumName" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "duration" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "spotifyId" TEXT NOT NULL DEFAULT 'unknown_spotify_id',
ADD COLUMN     "spotifyUrl" TEXT NOT NULL DEFAULT 'https://open.spotify.com/';

-- CreateIndex
CREATE UNIQUE INDEX "Song_spotifyId_key" ON "Song"("spotifyId");
