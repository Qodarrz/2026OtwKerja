# FlowGov - Integrated Governance System

## Pendahuluan
**FlowGov** adalah platform manajemen birokrasi berbasis ERP (Enterprise Resource Planning) yang dirancang secara spesifik untuk mentransformasi ekosistem pelayanan publik menjadi lebih efisien, transparan, dan akuntabel. Fokus utama sistem ini adalah mengeliminasi *"Internal Black Box"* birokrasi melalui pelacakan alur perizinan secara *real-time* dan penerapan kontrol *Service Level Agreement* (SLA) yang ketat di setiap tahapan kerja.

## Fitur Utama
Sistem FlowGov dilengkapi dengan berbagai modul strategis, antara lain:
- **Real-time Permit Tracking:** Memungkinkan pemohon dan pihak internal memantau progres pengajuan secara instan dan transparan.
- **Dynamic SLA Management:** Sistem peringatan otomatis dan eskalasi jika pemrosesan berkas melewati batas waktu yang ditentukan.
- **Role-Based Dashboards:** Antarmuka yang dioptimalkan untuk berbagai peran (Admin, Validator Dokumen, Inspektur Lapangan, dan Legalizer).
- **Bottleneck & Performance Analytics:** Visualisasi data mendalam untuk mengidentifikasi unit kerja yang mengalami hambatan pemrosesan.
- **Secure Audit Trail:** Pencatatan setiap tindakan dalam sistem dengan integritas data tinggi untuk keperluan audit dan transparansi.

## Arsitektur Teknologi
Sistem ini dibangun dengan menggunakan teknologi modern untuk memastikan skalabilitas dan performa maksimal:
- **Frontend:** Next.js 15 (App Router), Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend:** NestJS (Node.js Framework), Prisma ORM.
- **Database:** PostgreSQL.
- **Authentication:** JSON Web Token (JWT) dengan sistem Role-Based Access Control (RBAC).
- **Validation:** Terintegrasi dengan OCR (Tesseract.js) untuk verifikasi identitas (KTP).

## Struktur Repositori
Repositori ini terdiri dari dua bagian utama:
- `/backend`: Berisi logika bisnis, API endpoints, manajemen database, dan cron jobs untuk pemantauan SLA.
- `/frontend`: Berisi antarmuka pengguna, manajemen state, dan integrasi API.

## Pedoman Instalasi

### 1. Persiapan Lingkungan
Pastikan perangkat Anda telah terpasang:
- Node.js (Versi 18 atau lebih tinggi)
- PostgreSQL Database
- npm atau yarn

### 2. Pengaturan Backend
1. Masuk ke direktori backend: `cd backend`
2. Instal dependensi: `npm install`
3. Konfigurasi variabel lingkungan: Salin `.env.example` menjadi `.env` dan sesuaikan `DATABASE_URL`.
4. Jalankan migrasi database: `npx prisma migrate dev`
5. Isi data awal (seeding): `npx prisma db seed`
6. Jalankan server: `npm run start:dev`

### 3. Pengaturan Frontend
1. Masuk ke direktori frontend: `cd frontend`
2. Instal dependensi: `npm install`
3. Jalankan aplikasi: `npm run dev`

## Kontribusi & Tim Pengembang
Proyek ini dikembangkan oleh **Team 2026OtwKerja** dari **SMK Negeri 4 Kota Bogor**:
- **Muhammad Heidar Arrizqie**
- **Mochammad Zidane Abiansyah Putera**
- **Tanzil Muhammad Zibril**

---
© 2026 FlowGov - Future of Public Service. Transformasi Digital untuk Pelayanan Publik yang Lebih Baik.
