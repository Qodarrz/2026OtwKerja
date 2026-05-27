import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const activeCounts = await prisma.permitApplication.groupBy({
    by: ['currentStage'],
    where: { currentStage: { in: ['DOCUMENT_CHECK'] } },
    _count: true
  });
  console.log(activeCounts);
  await prisma.$disconnect();
}
main();
