import { PrismaClient, WorkflowStage, Role, PermitType, LandType, AuthProvider, ActionType, SLAStatus, BottleneckSeverity, BottleneckStatus, RecommendationType, RecommendationPriority } from '@prisma/client';
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
  console.log('📑 Seeding Realistic Logical Applications...');

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
        locationAddress: 'Jl. ' + ['Ahmad Yani', 'Sudirman', 'Thamrin', 'Gatot Subroto', 'Merdeka'][Math.floor(Math.random() * 5)] + ' No. ' + Math.floor(Math.random() * 100),
        landSize: type === PermitType.BUILDING_PERMIT ? Math.floor(Math.random() * 500) + 100 : null,
        landType: type === PermitType.BUILDING_PERMIT ? LandType.RESIDENTIAL : null,
        totalCost: type === PermitType.BUILDING_PERMIT ? Math.floor(Math.random() * 20000000) + 5000000 : Math.floor(Math.random() * 5000000) + 1000000,
        businessName: type === PermitType.BUSINESS_LICENSE ? 'Usaha ' + ['Maju Jaya', 'Berkah', 'Sentosa', 'Makmur'][Math.floor(Math.random() * 4)] : null,
        submittedAt: submittedAt,
      }
    });
    
    // Simulate DOCUMENT_CHECK stage
    const docCheckStart = new Date(submittedAt);
    let docCheckDuration = Math.floor(Math.random() * 18) + 2; // 2 to 20 hours (mostly ON_TIME or WARNING)
    // Make 1/4 of doc checks completely overdue
    if (Math.random() > 0.75) docCheckDuration = Math.floor(Math.random() * 24) + 25; // 25 to 48 hours
    const docCheckEnd = new Date(docCheckStart);
    docCheckEnd.setHours(docCheckEnd.getHours() + docCheckDuration);
    const docSlaStatus = docCheckDuration > 24 ? SLAStatus.OVERDUE : (docCheckDuration > 19 ? SLAStatus.WARNING : SLAStatus.ON_TIME);

    await prisma.stageHistory.create({
      data: {
        applicationId: app.id,
        toStage: WorkflowStage.DOCUMENT_CHECK,
        transitionedAt: docCheckStart,
        completedAt: finalStatus === WorkflowStage.DOCUMENT_CHECK ? null : docCheckEnd,
        durationHours: finalStatus === WorkflowStage.DOCUMENT_CHECK ? null : docCheckDuration,
        slaStatus: finalStatus === WorkflowStage.DOCUMENT_CHECK ? null : docSlaStatus,
      }
    });

    if (finalStatus === WorkflowStage.REJECTED && daysAgo > 10) {
        // Rejected at doc check
        await prisma.permitApplication.update({
            where: { id: app.id },
            data: { status: WorkflowStage.REJECTED, currentStage: WorkflowStage.REJECTED, rejectionReason: 'Dokumen KTP tidak jelas atau kadaluarsa.' }
        });
        await prisma.validationAction.create({
          data: {
            applicationId: app.id,
            actionType: ActionType.REJECT,
            stage: WorkflowStage.DOCUMENT_CHECK,
            performedById: allUsers['andi.validator@flowgov.id'].id,
            performedAt: docCheckEnd,
            notes: 'Dokumen tidak valid.'
          }
        });
        return;
    }

    if (finalStatus !== WorkflowStage.DOCUMENT_CHECK) {
      await prisma.validationAction.create({
        data: {
          applicationId: app.id,
          actionType: ActionType.APPROVE,
          stage: WorkflowStage.DOCUMENT_CHECK,
          performedById: allUsers['andi.validator@flowgov.id'].id,
          performedAt: docCheckEnd,
          notes: 'Dokumen lengkap dan valid sesuai persyaratan.'
        }
      });
    } else {
      return; // Stop here if stuck in doc check
    }

    // Stage 2: Field Inspection (if IMB)
    let nextStart = new Date(docCheckEnd);
    if (type === PermitType.BUILDING_PERMIT) {
        let inspectionDuration = Math.floor(Math.random() * 30) + 10; // 10 to 40 hours (SLA is 48)
        if (Math.random() > 0.6) inspectionDuration = Math.floor(Math.random() * 48) + 49; // 49 to 96 hours (Overdue)
        const inspectionEnd = new Date(nextStart);
        inspectionEnd.setHours(inspectionEnd.getHours() + inspectionDuration);
        const insSlaStatus = inspectionDuration > 48 ? SLAStatus.OVERDUE : (inspectionDuration > 38 ? SLAStatus.WARNING : SLAStatus.ON_TIME);

        await prisma.stageHistory.create({
            data: {
                applicationId: app.id,
                fromStage: WorkflowStage.DOCUMENT_CHECK,
                toStage: WorkflowStage.FIELD_INSPECTION,
                transitionedAt: nextStart,
                completedAt: finalStatus === WorkflowStage.FIELD_INSPECTION ? null : inspectionEnd,
                durationHours: finalStatus === WorkflowStage.FIELD_INSPECTION ? null : inspectionDuration,
                slaStatus: finalStatus === WorkflowStage.FIELD_INSPECTION ? null : insSlaStatus,
            }
        });

        if (finalStatus !== WorkflowStage.FIELD_INSPECTION) {
          await prisma.validationAction.create({
              data: {
                  applicationId: app.id,
                  actionType: ActionType.APPROVE,
                  stage: WorkflowStage.FIELD_INSPECTION,
                  performedById: allUsers['candra.inspector@flowgov.id'].id,
                  performedAt: inspectionEnd,
                  notes: 'Lokasi dan zonasi sesuai dengan dokumen permohonan.'
              }
          });
        } else {
          return;
        }
        nextStart = inspectionEnd;
    }

    // Stage 3: Legalization
    let legalDuration = Math.floor(Math.random() * 20) + 2; // 2 to 22 hours
    if (Math.random() > 0.8) legalDuration = Math.floor(Math.random() * 24) + 25; // 25 to 48 hours (Overdue)
    const legalEnd = new Date(nextStart);
    legalEnd.setHours(legalEnd.getHours() + legalDuration);
    const legSlaStatus = legalDuration > 24 ? SLAStatus.OVERDUE : (legalDuration > 19 ? SLAStatus.WARNING : SLAStatus.ON_TIME);

    await prisma.stageHistory.create({
        data: {
            applicationId: app.id,
            fromStage: type === PermitType.BUILDING_PERMIT ? WorkflowStage.FIELD_INSPECTION : WorkflowStage.DOCUMENT_CHECK,
            toStage: WorkflowStage.LEGALIZATION,
            transitionedAt: nextStart,
            completedAt: finalStatus === WorkflowStage.LEGALIZATION ? null : legalEnd,
            durationHours: finalStatus === WorkflowStage.LEGALIZATION ? null : legalDuration,
            slaStatus: finalStatus === WorkflowStage.LEGALIZATION ? null : legSlaStatus,
        }
    });

    if (finalStatus === WorkflowStage.APPROVED) {
        await prisma.validationAction.create({
            data: {
                applicationId: app.id,
                actionType: ActionType.APPROVE,
                stage: WorkflowStage.LEGALIZATION,
                performedById: allUsers['eka.legalizer@flowgov.id'].id,
                performedAt: legalEnd,
                notes: 'Izin telah disahkan dan diterbitkan secara digital.'
            }
        });

        // Add Feedback for approved app
        const ratings = [5, 5, 4, 5, 3, 4, 5];
        const randomRating = ratings[Math.floor(Math.random() * ratings.length)];
        const comments = [
          'Proses sangat cepat dan transparan. Terima kasih FlowGov!',
          'Pelayanan memuaskan, sangat membantu.',
          'Sistemnya gampang dipakai.',
          'Bagus, tapi bisa dipercepat lagi di bagian legalisasi.',
          'Luar biasa cepat.',
        ];
        await prisma.feedback.create({
          data: {
            applicationId: app.id,
            userId: applicant.id,
            rating: randomRating,
            comment: comments[Math.floor(Math.random() * comments.length)],
            type: 'APPRECIATION'
          }
        });
    }
  };

  // Generate 20+ realistic applications
  console.log('Generating realistic applications...');
  for (let i = 1; i <= 8; i++) {
    await createFullApp(`IMB-2026-A00${i}`, PermitType.BUILDING_PERMIT, `citizen${(i%4)+1}@gmail.com`, WorkflowStage.APPROVED, 15 + i);
    await createFullApp(`IUMK-2026-A00${i}`, PermitType.BUSINESS_LICENSE, `citizen${(i%4)+1}@gmail.com`, WorkflowStage.APPROVED, 10 + i);
  }
  
  await createFullApp('IMB-2026-R01', PermitType.BUILDING_PERMIT, 'citizen1@gmail.com', WorkflowStage.REJECTED, 25);
  await createFullApp('IUMK-2026-R01', PermitType.BUSINESS_LICENSE, 'citizen2@gmail.com', WorkflowStage.REJECTED, 18);

  // Active Applications (Various stages)
  await createFullApp('IMB-2026-DOC-01', PermitType.BUILDING_PERMIT, 'citizen3@gmail.com', WorkflowStage.DOCUMENT_CHECK, 2);
  await createFullApp('IMB-2026-DOC-02', PermitType.BUILDING_PERMIT, 'user@flowgov.id', WorkflowStage.DOCUMENT_CHECK, 4); // Overdue
  await createFullApp('IUMK-2026-DOC-01', PermitType.BUSINESS_LICENSE, 'citizen1@gmail.com', WorkflowStage.DOCUMENT_CHECK, 1);

  await createFullApp('IMB-2026-INS-01', PermitType.BUILDING_PERMIT, 'citizen2@gmail.com', WorkflowStage.FIELD_INSPECTION, 3);
  await createFullApp('IMB-2026-INS-02', PermitType.BUILDING_PERMIT, 'citizen4@gmail.com', WorkflowStage.FIELD_INSPECTION, 5); // Overdue
  await createFullApp('IMB-2026-INS-03', PermitType.BUILDING_PERMIT, 'user@flowgov.id', WorkflowStage.FIELD_INSPECTION, 2);

  await createFullApp('IMB-2026-LEG-01', PermitType.BUILDING_PERMIT, 'citizen1@gmail.com', WorkflowStage.LEGALIZATION, 4);
  await createFullApp('IUMK-2026-LEG-01', PermitType.BUSINESS_LICENSE, 'citizen3@gmail.com', WorkflowStage.LEGALIZATION, 6); // Overdue

  // Explicit Bottleneck Event Generation
  console.log('Generating active bottlenecks for analytics...');
  await prisma.bottleneckEvent.create({
    data: {
      stage: WorkflowStage.FIELD_INSPECTION,
      score: 85,
      severity: BottleneckSeverity.HIGH,
      queueLength: 15,
      queueWeight: 30.5,
      avgProcessingTime: 52.4, // Overdue SLA (48h max)
      processingWeight: 45.2,
      slaViolationRate: 65.0,
      slaWeight: 15.0,
      staffWorkload: 8.5,
      workloadWeight: 9.3,
      status: BottleneckStatus.ACTIVE,
      detectedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // Detected 5 hours ago
      recommendations: {
        create: [
          { type: RecommendationType.ADD_STAFF, priority: RecommendationPriority.HIGH, description: 'Tambahkan 2 staff ke Field Inspection segera.', specificMetrics: { staffToAdd: 2 }, estimatedImpact: 'HIGH' }
        ]
      }
    }
  });

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
