import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    try {
        const res = await prisma.permitApplication.groupBy({
            by: ['currentStage'],
            where: { currentStage: { in: ['DOCUMENT_CHECK', 'FIELD_INSPECTION', 'LEGALIZATION'] } },
            _count: true
        });
        console.log(res);
    } catch(e) {
        console.error(e.message);
    }
}
main().finally(() => prisma.$disconnect());
