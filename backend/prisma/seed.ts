import { PrismaClient, WorkflowStage, Role, PermitType, LandType, AuthProvider, ActionType, SLAStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('--- 🚀 Starting Comprehensive Demo Seed Process ---');

  // 1. Clear existing dynamic data to avoid conflicts and ensure clean demo
  console.log('🧹 Cleaning existing data...');
  await prisma.validationAction.deleteMany();
  await prisma.stageHistory.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.document.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.permitApplication.deleteMany();
  // Note: We keep Users, SLA Rules, and Templates but will upsert them
  console.log('✅ Data cleaned.');

  // 2. Seed SLA Rules
  console.log('⏲️ Seeding SLA Rules...');
  const slaRules = [
    { stage: WorkflowStage.DOCUMENT_CHECK, maxDurationHours: 24, warningThreshold: 0.8 },
    { stage: WorkflowStage.FIELD_INSPECTION, maxDurationHours: 48, warningThreshold: 0.75 },
    { stage: WorkflowStage.LEGALIZATION, maxDurationHours: 24, warningThreshold: 0.8 },
  ];
  for (const rule of slaRules) {
    await prisma.sLARule.upsert({
      where: { stage: rule.stage },
      update: rule,
      create: rule,
    });
  }

  // 3. Seed Users
  console.log('👥 Seeding Staff and Demo Users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const staffData = [
    { email: 'admin@flowgov.id', name: 'Super Admin', roles: [Role.ADMIN] },
    { email: 'andi.validator@flowgov.id', name: 'Andi Pratama', roles: [Role.DOCUMENT_VALIDATOR] },
    { email: 'budi.validator@flowgov.id', name: 'Budi Santoso', roles: [Role.DOCUMENT_VALIDATOR] },
    { email: 'candra.inspector@flowgov.id', name: 'Candra Wijaya', roles: [Role.FIELD_INSPECTOR] },
    { email: 'dedi.inspector@flowgov.id', name: 'Dedi Kurniawan', roles: [Role.FIELD_INSPECTOR] },
    { email: 'eka.legalizer@flowgov.id', name: 'Eka Putri', roles: [Role.LEGALIZER] },
    { email: 'fani.legalizer@flowgov.id', name: 'Fani Ramadhani', roles: [Role.LEGALIZER] },
    { email: 'cs@flowgov.id', name: 'Customer Service', roles: [Role.CS] },
  ];

  const applicantsData = [
    { email: 'user@flowgov.id', name: 'Heidar Arrizqie' },
    { email: 'citizen1@gmail.com', name: 'Siti Aminah' },
    { email: 'citizen2@gmail.com', name: 'Joko Widodo' },
    { email: 'citizen3@gmail.com', name: 'Rina Nose' },
    { email: 'citizen4@gmail.com', name: 'Bambang Pamungkas' },
  ];

  const allUsers: Record<string, any> = {};

  for (const u of [...staffData, ...applicantsData]) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { roles: (u as any).roles || [Role.USER] },
      create: {
        email: u.email,
        name: u.name,
        password: hashedPassword,
        roles: (u as any).roles || [Role.USER],
        verify_gmail: true,
        isKtpVerified: true,
        userDetail: {
          create: {
            nik: '3273' + Math.floor(Math.random() * 1000000000000),
            phone: '0812' + Math.floor(Math.random() * 100000000),
            address: 'Kota Bogor, Jawa Barat',
          },
        },
      },
    });
    allUsers[u.email] = user;
  }

  // 4. Seed Workflow Templates
  console.log('📋 Seeding Workflow Templates...');
  const templates = [
    {
      permitType: PermitType.BUILDING_PERMIT,
      name: 'Izin Mendirikan Bangunan (IMB)',
      stages: [
        { stage: WorkflowStage.DOCUMENT_CHECK, order: 1, requiredRoles: [Role.DOCUMENT_VALIDATOR], slaDurationHours: 24 },
        { stage: WorkflowStage.FIELD_INSPECTION, order: 2, requiredRoles: [Role.FIELD_INSPECTOR], slaDurationHours: 48 },
        { stage: WorkflowStage.LEGALIZATION, order: 3, requiredRoles: [Role.LEGALIZER], slaDurationHours: 24 },
      ]
    },
    {
      permitType: PermitType.BUSINESS_LICENSE,
      name: 'Izin Usaha Mikro (IUMK)',
      stages: [
        { stage: WorkflowStage.DOCUMENT_CHECK, order: 1, requiredRoles: [Role.DOCUMENT_VALIDATOR], slaDurationHours: 12 },
        { stage: WorkflowStage.LEGALIZATION, order: 2, requiredRoles: [Role.LEGALIZER], slaDurationHours: 12 },
      ]
    }
  ];

  for (const t of templates) {
    await prisma.workflowTemplate.upsert({
      where: { permitType: t.permitType },
      update: { name: t.name },
      create: {
        permitType: t.permitType,
        name: t.name,
        isActive: true,
        stages: { create: t.stages }
      }
    });
  }

  // 4b. Seed Permit Form Schemas (Dynamic UI)
  console.log('📝 Seeding Permit Form Schemas...');
  await prisma.permitFormSchema.upsert({
    where: { permitType: PermitType.BUILDING_PERMIT },
    update: {},
    create: {
      permitType: PermitType.BUILDING_PERMIT,
      title: 'Izin Mendirikan Bangunan (IMB)',
      description: 'Izin untuk mendirikan, memperbaiki, menambah, atau mengubah bangunan.',
      requiresMap: true,
      fields: [
        { name: 'projectName', label: 'Nama Proyek', type: 'text', placeholder: 'Contoh: Rumah Tinggal Bp. Budi', required: true },
        { name: 'buildingType', label: 'Tipe Bangunan', type: 'select', options: ['Residensial', 'Komersial', 'Industri', 'Sosial & Budaya'], required: true },
        { name: 'locationAddress', label: 'Alamat Lokasi', type: 'text', placeholder: 'Jl. Thamrin No. 1, Jakarta Pusat', required: true }
      ],
      requiredDocuments: [
        { id: 'ktp', label: 'KTP Pemohon', required: true, maxFileSize: 5000000 },
        { id: 'sertifikat', label: 'Sertifikat Tanah', required: true, maxFileSize: 10000000 },
        { id: 'denah', label: 'Denah Bangunan', required: true, maxFileSize: 10000000 },
      ]
    }
  });

  await prisma.permitFormSchema.upsert({
    where: { permitType: PermitType.BUSINESS_LICENSE },
    update: {},
    create: {
      permitType: PermitType.BUSINESS_LICENSE,
      title: 'Izin Usaha Mikro (IUMK)',
      description: 'Izin untuk mendirikan dan menjalankan usaha komersial.',
      requiresMap: false,
      fields: [
        { name: 'businessName', label: 'Nama Badan Usaha / Toko', type: 'text', placeholder: 'Contoh: PT. Maju Jaya', required: true },
        { name: 'businessType', label: 'Jenis Usaha', type: 'select', options: ['Perdagangan', 'Jasa', 'Manufaktur', 'Kuliner', 'Lainnya'], required: true },
        { name: 'businessLocation', label: 'Alamat Usaha', type: 'text', placeholder: 'Alamat lengkap tempat usaha', required: true },
        { name: 'estimatedEmployees', label: 'Estimasi Jumlah Karyawan', type: 'number', placeholder: 'Contoh: 15', required: true }
      ],
      requiredDocuments: [
        { id: 'ktp', label: 'KTP Pemilik', required: true, maxFileSize: 5000000 },
        { id: 'npwp', label: 'NPWP Perusahaan', required: true, maxFileSize: 5000000 },
        { id: 'akta', label: 'Akta Pendirian', required: true, maxFileSize: 10000000 },
      ]
    }
  });

  // 5. Seed Logical Applications with History (for Analytics)
  console.log('📑 Skipping Logical Applications Seeding...');

  if (false) {
    // Helper to create full application life cycle
    const createFullApp = async (
      ref: string,
      type: PermitType,
      applicantEmail: string,
      finalStatus: WorkflowStage,
      daysAgo: number
    ) => {
      const applicant = allUsers[applicantEmail];
      const submittedAt = new Date();
      submittedAt.setDate(submittedAt.getDate() - daysAgo);

      const app = await prisma.permitApplication.create({
        data: {
          referenceNumber: ref,
          permitType: type,
          applicantId: applicant.id,
          status: finalStatus,
          currentStage: finalStatus,
          locationAddress: 'Jl. Ahmad Yani No. ' + Math.floor(Math.random() * 100),
          landSize: 150,
          landType: LandType.RESIDENTIAL,
          totalCost: type === PermitType.BUILDING_PERMIT ? 15000000 : 2500000,
          submittedAt: submittedAt,
        }
      });
      
      const docCheckStart = new Date(submittedAt);
      const docCheckEnd = new Date(docCheckStart);
      docCheckEnd.setHours(docCheckEnd.getHours() + 4); // Fast check

      await prisma.stageHistory.create({
        data: {
          applicationId: app.id,
          fromStage: WorkflowStage.DRAFT,
          toStage: WorkflowStage.DOCUMENT_CHECK,
          transitionedAt: docCheckStart,
          completedAt: docCheckEnd,
          durationHours: 4,
          slaStatus: SLAStatus.ON_TIME,
          transitionedBy: applicant.id
        }
      });

      await prisma.validationAction.create({
        data: {
          applicationId: app.id,
          actionType: ActionType.APPROVE,
          stage: WorkflowStage.DOCUMENT_CHECK,
          performedById: allUsers['andi.validator@flowgov.id'].id,
          performedAt: docCheckEnd,
          notes: 'Dokumen lengkap dan valid.'
        }
      });

      if (finalStatus === WorkflowStage.REJECTED && daysAgo > 10) {
          // If rejected at doc check
          await prisma.permitApplication.update({
              where: { id: app.id },
              data: { status: WorkflowStage.REJECTED, currentStage: WorkflowStage.REJECTED, rejectionReason: 'Dokumen KTP tidak jelas.' }
          });
          return;
      }

      // Stage 2: Field Inspection (if IMB)
      let nextStart = new Date(docCheckEnd);
      if (type === PermitType.BUILDING_PERMIT) {
          const inspectionEnd = new Date(nextStart);
          inspectionEnd.setHours(inspectionEnd.getHours() + 30); // 30 hours later

          await prisma.stageHistory.create({
              data: {
                  applicationId: app.id,
                  fromStage: WorkflowStage.DOCUMENT_CHECK,
                  toStage: WorkflowStage.FIELD_INSPECTION,
                  transitionedAt: nextStart,
                  completedAt: inspectionEnd,
                  durationHours: 30,
                  slaStatus: SLAStatus.ON_TIME,
              }
          });

          await prisma.validationAction.create({
              data: {
                  applicationId: app.id,
                  actionType: ActionType.APPROVE,
                  stage: WorkflowStage.FIELD_INSPECTION,
                  performedById: allUsers['candra.inspector@flowgov.id'].id,
                  performedAt: inspectionEnd,
                  notes: 'Lokasi sesuai dengan dokumen permohonan.'
              }
          });
          nextStart = inspectionEnd;
      }

      // Stage 3: Legalization
      if (finalStatus === WorkflowStage.APPROVED) {
          const legalEnd = new Date(nextStart);
          legalEnd.setHours(legalEnd.getHours() + 10);

          await prisma.stageHistory.create({
              data: {
                  applicationId: app.id,
                  fromStage: type === PermitType.BUILDING_PERMIT ? WorkflowStage.FIELD_INSPECTION : WorkflowStage.DOCUMENT_CHECK,
                  toStage: WorkflowStage.LEGALIZATION,
                  transitionedAt: nextStart,
                  completedAt: legalEnd,
                  durationHours: 10,
                  slaStatus: SLAStatus.ON_TIME,
              }
          });

          await prisma.validationAction.create({
              data: {
                  applicationId: app.id,
                  actionType: ActionType.APPROVE,
                  stage: WorkflowStage.LEGALIZATION,
                  performedById: allUsers['eka.legalizer@flowgov.id'].id,
                  performedAt: legalEnd,
                  notes: 'Izin telah disahkan secara digital.'
              }
          });

          // Add Feedback for approved app
          await prisma.feedback.create({
            data: {
              applicationId: app.id,
              userId: applicant.id,
              rating: 5,
              comment: 'Proses sangat cepat dan transparan. Terima kasih FlowGov!',
              type: 'APPRECIATION'
            }
          });
      }
    };

    // Create several approved apps
    await createFullApp('IMB-2026-001', PermitType.BUILDING_PERMIT, 'citizen1@gmail.com', WorkflowStage.APPROVED, 20);
    await createFullApp('IMB-2026-002', PermitType.BUILDING_PERMIT, 'citizen2@gmail.com', WorkflowStage.APPROVED, 15);
    await createFullApp('IUMK-2026-001', PermitType.BUSINESS_LICENSE, 'citizen3@gmail.com', WorkflowStage.APPROVED, 5);
    
    // Create an app waiting in Document Check (for Andi)
    const appWaiting1 = await prisma.permitApplication.create({
      data: {
          referenceNumber: 'IMB-2026-NEW-01',
          permitType: PermitType.BUILDING_PERMIT,
          applicantId: allUsers['citizen4@gmail.com'].id,
          status: WorkflowStage.DOCUMENT_CHECK,
          currentStage: WorkflowStage.DOCUMENT_CHECK,
          locationAddress: 'Jl. Semeru No. 12',
          landSize: 200,
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // make it overdue for real
      }
    });
    await prisma.stageHistory.create({
      data: { applicationId: appWaiting1.id, toStage: WorkflowStage.DOCUMENT_CHECK, transitionedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    });

    // Create an app waiting in Legalization
    const appWaiting2 = await prisma.permitApplication.create({
      data: {
          referenceNumber: 'IUMK-2026-WAIT-01',
          permitType: PermitType.BUSINESS_LICENSE,
          applicantId: allUsers['user@flowgov.id'].id,
          status: WorkflowStage.LEGALIZATION,
          currentStage: WorkflowStage.LEGALIZATION,
          businessName: 'Toko Heidar',
          submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      }
    });
    // Add history for doc check (already completed)
    const wait2DocEnd = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    await prisma.stageHistory.create({
      data: { 
          applicationId: appWaiting2.id, 
          toStage: WorkflowStage.DOCUMENT_CHECK, 
          transitionedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          completedAt: wait2DocEnd,
          durationHours: 24,
          slaStatus: SLAStatus.ON_TIME
      }
    });
    await prisma.validationAction.create({
      data: {
          applicationId: appWaiting2.id,
          actionType: ActionType.APPROVE,
          stage: WorkflowStage.DOCUMENT_CHECK,
          performedById: allUsers['budi.validator@flowgov.id'].id,
          performedAt: wait2DocEnd,
          notes: 'Data usaha valid.'
      }
    });
    await prisma.stageHistory.create({
      data: { applicationId: appWaiting2.id, toStage: WorkflowStage.LEGALIZATION, transitionedAt: wait2DocEnd }
    });
  }

  // 6. Seed Bottleneck Thresholds
  console.log('⚙️ Seeding Bottleneck Thresholds...');
  const existingGlobalThreshold = await prisma.bottleneckThreshold.findFirst({
    where: { stage: null }
  });

  if (!existingGlobalThreshold) {
    await prisma.bottleneckThreshold.create({
      data: {
        queueLengthThreshold: 10,
        processingTimeMultiplier: 1.5,
        slaViolationPercentage: 20.0,
        workloadPerStaff: 5.0,
        bottleneckScoreThreshold: 60,
        createdBy: 'SYSTEM'
      }
    });
  }

  console.log('--- 🏁 Demo Seed Process Completed! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
