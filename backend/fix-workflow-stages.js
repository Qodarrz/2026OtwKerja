const { PrismaClient, PermitType, WorkflowStage, Role } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = [
    {
      permitType: PermitType.BUILDING_PERMIT,
      stages: [
        { stage: WorkflowStage.DOCUMENT_CHECK, order: 1, requiredRoles: [Role.DOCUMENT_VALIDATOR], slaDurationHours: 24 },
        { stage: WorkflowStage.FIELD_INSPECTION, order: 2, requiredRoles: [Role.FIELD_INSPECTOR], slaDurationHours: 48 },
        { stage: WorkflowStage.ASSESSMENT, order: 3, requiredRoles: [Role.ADMIN], slaDurationHours: 12 },
        { stage: WorkflowStage.WAITING_FOR_PAYMENT, order: 4, requiredRoles: [Role.ADMIN], slaDurationHours: 72 },
        { stage: WorkflowStage.LEGALIZATION, order: 5, requiredRoles: [Role.LEGALIZER], slaDurationHours: 24 },
        { stage: WorkflowStage.APPROVED, order: 6, requiredRoles: [], slaDurationHours: 0 },
      ]
    },
    {
      permitType: PermitType.BUSINESS_LICENSE,
      stages: [
        { stage: WorkflowStage.DOCUMENT_CHECK, order: 1, requiredRoles: [Role.DOCUMENT_VALIDATOR], slaDurationHours: 12 },
        { stage: WorkflowStage.ASSESSMENT, order: 2, requiredRoles: [Role.ADMIN], slaDurationHours: 12 },
        { stage: WorkflowStage.WAITING_FOR_PAYMENT, order: 3, requiredRoles: [Role.ADMIN], slaDurationHours: 72 },
        { stage: WorkflowStage.LEGALIZATION, order: 4, requiredRoles: [Role.LEGALIZER], slaDurationHours: 12 },
        { stage: WorkflowStage.APPROVED, order: 5, requiredRoles: [], slaDurationHours: 0 },
      ]
    }
  ];

  for (const t of templates) {
    const template = await prisma.workflowTemplate.findUnique({
      where: { permitType: t.permitType }
    });
    if (template) {
      await prisma.workflowTemplateStage.deleteMany({
        where: { templateId: template.id }
      });
      for (const stage of t.stages) {
        await prisma.workflowTemplateStage.create({
          data: {
            templateId: template.id,
            ...stage
          }
        });
      }
      console.log(`Updated stages for ${t.permitType}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
