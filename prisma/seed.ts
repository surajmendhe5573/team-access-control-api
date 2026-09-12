import prisma from '../src/config/db.js';
import { PERMISSIONS } from '../src/modules/permissions/permission.constants.js';

async function main() {
    for (const key of Object.values(PERMISSIONS)) {
        await prisma.permission.upsert({
            where: { key },
            update: {},
            create: { key },
        });
    }
    console.log('Permissions seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });