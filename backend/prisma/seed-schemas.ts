import { PrismaClient, PermitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding PermitFormSchemas...');
  
  const buildingPermitSchema = await prisma.permitFormSchema.upsert({
    where: { permitType: PermitType.BUILDING_PERMIT },
    update: {},
    create: {
      permitType: PermitType.BUILDING_PERMIT,
      title: 'Izin Mendirikan Bangunan (IMB)',
      description: 'Izin untuk mendirikan, memperbaiki, menambah, atau mengubah bangunan.',
      requiresMap: true,
      fields: [
        {
          name: 'projectName',
          label: 'Nama Proyek',
          type: 'text',
          placeholder: 'Contoh: Rumah Tinggal Bp. Budi',
          required: true,
        },
        {
          name: 'buildingType',
          label: 'Tipe Bangunan',
          type: 'select',
          options: ['Residensial', 'Komersial', 'Industri', 'Sosial & Budaya'],
          required: true,
        },
        {
          name: 'estimatedArea',
          label: 'Luas Perkiraan (m²)',
          type: 'number',
          placeholder: 'Contoh: 100',
          required: true,
        },
        {
          name: 'locationAddress',
          label: 'Alamat Lokasi',
          type: 'text',
          placeholder: 'Jl. Thamrin No. 1, Jakarta Pusat',
          required: true,
        }
      ],
      requiredDocuments: [
        { id: 'ktp', label: 'KTP Pemohon', required: true, maxFileSize: 5000000 },
        { id: 'sertifikat', label: 'Sertifikat Tanah', required: true, maxFileSize: 10000000 },
        { id: 'denah', label: 'Denah Bangunan', required: true, maxFileSize: 10000000 },
      ]
    }
  });

  const businessPermitSchema = await prisma.permitFormSchema.upsert({
    where: { permitType: PermitType.BUSINESS_LICENSE },
    update: {},
    create: {
      permitType: PermitType.BUSINESS_LICENSE,
      title: 'Izin Usaha',
      description: 'Izin untuk mendirikan dan menjalankan usaha komersial.',
      requiresMap: false,
      fields: [
        {
          name: 'businessName',
          label: 'Nama Badan Usaha / Toko',
          type: 'text',
          placeholder: 'Contoh: PT. Maju Jaya',
          required: true,
        },
        {
          name: 'businessType',
          label: 'Jenis Usaha',
          type: 'select',
          options: ['Perdagangan', 'Jasa', 'Manufaktur', 'Kuliner', 'Lainnya'],
          required: true,
        },
        {
          name: 'businessLocation',
          label: 'Alamat Usaha',
          type: 'text',
          placeholder: 'Alamat lengkap tempat usaha',
          required: true,
        },
        {
          name: 'estimatedEmployees',
          label: 'Estimasi Jumlah Karyawan',
          type: 'number',
          placeholder: 'Contoh: 15',
          required: true,
        }
      ],
      requiredDocuments: [
        { id: 'ktp', label: 'KTP Pemilik', required: true, maxFileSize: 5000000 },
        { id: 'npwp', label: 'NPWP Perusahaan', required: true, maxFileSize: 5000000 },
        { id: 'akta', label: 'Akta Pendirian', required: true, maxFileSize: 10000000 },
      ]
    }
  });

  console.log('Seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
