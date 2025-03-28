import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    // Seeding Users
    await prisma.user.createMany({
        data: [
            { email: "john@example.com", password: "securepassword123" },
            { email: "jane@example.com", password: "anothersecurepass" },
        ],
    });

    // Seeding Songs
    await prisma.song.createMany({
        data: [
            { title: "Song 1", artist: "Artist 1" },
            { title: "Song 2", artist: "Artist 2", isFavorite: true },
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
