import { PrismaClient, WorkflowStage } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SLA Rules...');

  const slaRules = [
    {
      stage: WorkflowStage.DOCUMENT_CHECK,
      maxDurationHours: 24, // 1 day
      warningThreshold: 0.8, // 80% (19.2h)
    },
    {
      stage: WorkflowStage.FIELD_INSPECTION,
      maxDurationHours: 48, // 2 days
      warningThreshold: 0.75, // 75% (36h)
    },
    {
      stage: WorkflowStage.LEGALIZATION,
      maxDurationHours: 24, // 1 day
      warningThreshold: 0.8, // 80% (19.2h)
    },
  ];

  for (const rule of slaRules) {
    await prisma.sLARule.upsert({
      where: { stage: rule.stage },
      update: rule,
      create: rule,
    });
  }

  console.log('SLA Rules seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
