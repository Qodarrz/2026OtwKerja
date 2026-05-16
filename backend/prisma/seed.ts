import { PrismaClient, WorkflowStage, Role, PermitType, LandType, AuthProvider } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting Seed Process ---');


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
  console.log('✅ SLA Rules seeded.');

  console.log('Seeding Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [
    {
      email: 'admin@flowgov.id',
      name: 'Super Admin',
      roles: [Role.ADMIN],
    },
    {
      email: 'validator@flowgov.id',
      name: 'Andi Validator',
      roles: [Role.DOCUMENT_VALIDATOR],
    },
    {
      email: 'inspector@flowgov.id',
      name: 'Budi Inspector',
      roles: [Role.FIELD_INSPECTOR],
    },
    {
      email: 'legalizer@flowgov.id',
      name: 'Citra Legalizer',
      roles: [Role.LEGALIZER],
    },
    {
      email: 'user@flowgov.id',
      name: 'Heidar Arrizqie',
      roles: [Role.USER],
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const userData of users) {
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: {
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        roles: userData.roles,
        verify_gmail: true,
        isKtpVerified: true,
        provider: AuthProvider.LOCAL,
        userDetail: {
          create: {
            nik: '3273' + Math.floor(Math.random() * 1000000000000),
            phone: '08123456789',
            address: 'Kota Bogor, Jawa Barat',
          },
        },
      },
    });
    seededUsers[userData.email] = user;
  }
  console.log('✅ Users seeded.');

  console.log('Seeding Permit Applications...');
  const applicant = seededUsers['user@flowgov.id'];

  const applications = [
    {
      referenceNumber: 'BP/2026/04/00001',
      permitType: PermitType.BUILDING_PERMIT,
      status: WorkflowStage.APPROVED,
      currentStage: WorkflowStage.APPROVED,
      locationAddress: 'Jl. Pajajaran No. 123, Bogor',
      landSize: 250,
      landType: LandType.RESIDENTIAL,
      buildingHeight: 8,
      njopValue: 5000000,
      totalCost: 12500000,
      submittedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    },
    {
      referenceNumber: 'BL/2026/04/00002',
      permitType: PermitType.BUSINESS_LICENSE,
      status: WorkflowStage.DOCUMENT_CHECK,
      currentStage: WorkflowStage.DOCUMENT_CHECK,
      businessName: 'Coffee Shop OtwKerja',
      businessType: 'Kuliner',
      businessLocation: 'Botani Square, Bogor',
      estimatedEmployees: 5,
      totalCost: 2500000,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
    {
      referenceNumber: 'BP/2026/04/00003',
      permitType: PermitType.BUILDING_PERMIT,
      status: WorkflowStage.FIELD_INSPECTION,
      currentStage: WorkflowStage.FIELD_INSPECTION,
      locationAddress: 'Jl. Juanda No. 45, Bogor',
      landSize: 1000,
      landType: LandType.COMMERCIAL,
      buildingHeight: 15,
      njopValue: 12000000,
      totalCost: 45000000,
      submittedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
    {
      referenceNumber: 'BP/2026/04/00004',
      permitType: PermitType.BUILDING_PERMIT,
      status: WorkflowStage.REJECTED,
      currentStage: WorkflowStage.REJECTED,
      locationAddress: 'Area Rawan Longsor, Bogor',
      landSize: 150,
      landType: LandType.RESIDENTIAL,
      buildingHeight: 6,
      njopValue: 2000000,
      totalCost: 5000000,
      rejectionReason: 'Lokasi berada di zona merah rawan bencana alam.',
      submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
    },
  ];

  for (const app of applications) {
    const existing = await prisma.permitApplication.findUnique({
      where: { referenceNumber: app.referenceNumber },
    });

    if (!existing) {
      const createdApp = await prisma.permitApplication.create({
        data: {
          ...app,
          applicantId: applicant.id,
        },
      });

      // Create initial stage history
      await prisma.stageHistory.create({
        data: {
          applicationId: createdApp.id,
          toStage: app.currentStage,
          transitionedAt: app.submittedAt,
        },
      });
    }
  }
  console.log('✅ Permit Applications seeded.');

  console.log('Seeding Workflow Templates...');

  const workflowTemplates = [
    {
      name: 'Building Permit Workflow',
      description: 'Default workflow for building permit applications',
      permitType: PermitType.BUILDING_PERMIT,
      stages: [
        {
          stage: WorkflowStage.DOCUMENT_CHECK,
          order: 0,
          requiredRoles: [Role.DOCUMENT_VALIDATOR],
          slaDurationHours: 48,
          slaWarningPercent: 0.8,
          isRequired: true,
        },
        {
          stage: WorkflowStage.FIELD_INSPECTION,
          order: 1,
          requiredRoles: [Role.FIELD_INSPECTOR],
          slaDurationHours: 72,
          slaWarningPercent: 0.8,
          isRequired: true,
        },
        {
          stage: WorkflowStage.LEGALIZATION,
          order: 2,
          requiredRoles: [Role.LEGALIZER],
          slaDurationHours: 24,
          slaWarningPercent: 0.8,
          isRequired: true,
        },
      ],
    },
    {
      name: 'Business License Workflow',
      description: 'Default workflow for business license applications',
      permitType: PermitType.BUSINESS_LICENSE,
      stages: [
        {
          stage: WorkflowStage.DOCUMENT_CHECK,
          order: 0,
          requiredRoles: [Role.DOCUMENT_VALIDATOR],
          slaDurationHours: 24,
          slaWarningPercent: 0.8,
          isRequired: true,
        },
        {
          stage: WorkflowStage.LEGALIZATION,
          order: 1,
          requiredRoles: [Role.LEGALIZER],
          slaDurationHours: 12,
          slaWarningPercent: 0.8,
          isRequired: true,
        },
      ],
    },
  ];

  for (const templateData of workflowTemplates) {
    const existing = await prisma.workflowTemplate.findUnique({
      where: { permitType: templateData.permitType },
    });

    if (!existing) {
      const created = await prisma.workflowTemplate.create({
        data: {
          name: templateData.name,
          description: templateData.description,
          permitType: templateData.permitType,
          isActive: true,
          stages: {
            create: templateData.stages,
          },
        },
      });
      console.log(`✅ Workflow Template seeded: ${created.name}`);
    } else {
      console.log(`✅ Workflow Template already exists: ${templateData.name}`);
    }
  }
  console.log('✅ Workflow Templates seeded.');

  console.log('Seeding Bottleneck Thresholds...');
  // Create default global threshold configuration
  // Check if global default already exists
  const existingGlobalThreshold = await prisma.bottleneckThreshold.findFirst({
    where: { stage: null },
  });

  if (!existingGlobalThreshold) {
    const defaultThreshold = await prisma.bottleneckThreshold.create({
      data: {
        queueLengthThreshold: 10,
        processingTimeMultiplier: 1.5,
        slaViolationPercentage: 20.0,
        workloadPerStaff: 5.0,
        bottleneckScoreThreshold: 60,
        createdBy: 'SYSTEM',
      },
    });
    console.log('✅ Default Bottleneck Threshold seeded:', defaultThreshold.id);
  } else {
    console.log('✅ Default Bottleneck Threshold already exists:', existingGlobalThreshold.id);
  }

  console.log('--- Seed Process Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
