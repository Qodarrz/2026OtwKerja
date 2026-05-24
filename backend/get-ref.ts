import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const app = await prisma.permitApplication.findFirst();
    console.log(app?.referenceNumber);
}
main().catch(console.error).finally(() => prisma.$disconnect());
