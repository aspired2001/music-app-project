import { PrismaClient } from "@prisma/client";
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    // Hash passwords before seeding
    const hashedPassword1 = await bcrypt.hash("securepassword123", 10);
    const hashedPassword2 = await bcrypt.hash("anothersecurepass", 10);

    // Seeding Users with hashed passwords
    const user1 = await prisma.user.create({
        data: {
            email: "john@example.com",
            password: hashedPassword1
        }
    });

    const user2 = await prisma.user.create({
        data: {
            email: "jane@example.com",
            password: hashedPassword2
        }
    });

    // Seeding Songs with full details
    await prisma.song.createMany({
        data: [
            {
                title: "Song 1",
                artist: "Artist 1",
                spotifyId: "spotify1",
                spotifyUrl: "https://open.spotify.com/track/spotify1",
                duration: 180,
                userId: user1.id
            },
            {
                title: "Song 2",
                artist: "Artist 2",
                isFavorite: true,
                spotifyId: "spotify2",
                spotifyUrl: "https://open.spotify.com/track/spotify2",
                duration: 200,
                userId: user2.id
            },
        ],
    });

    console.log("Seeding completed.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });