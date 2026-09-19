import 'dotenv/config';

import prisma from '../src/config/db.js';
import { PERMISSIONS } from '../src/config/permissions.catalog.js';

async function main() {
    console.log('Seeding permission catalog...');

    for (const permission of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { key: permission.key },
            update: { description: permission.description },
            create: { key: permission.key, description: permission.description },
        });
    }

    console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

main()
    .catch((err) => {
        console.error('Seed failed:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });