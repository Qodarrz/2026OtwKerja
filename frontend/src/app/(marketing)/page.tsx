"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ShieldCheck,
  Eye,
  Clock,
  CheckCircle2,
  Globe,
  Users,
  Target,
  Building2,
  Scale,
  Sparkles,
  Zap,
  Shield,
  Activity
} from "lucide-react";
import Link from "next/link";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import { IntroLoader } from "@/components/landing/IntroLoader";
import Image from "next/image";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, ease: "easeOut" }
} as const;

const staggerContainer = {
  initial: { opacity: 0 },
  whileInView: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  },
  viewport: { once: true }
} as const;

export default function LandingPage() {
  type PopupKey = "pusat-bantuan" | "kebijakan-privasi" | "syarat-ketentuan" | null;
  const [activePopup, setActivePopup] = useState<PopupKey>(null);

  return (
    <main className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/20">
      <IntroLoader />
      {/* Hero Section */}
      <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center pt-32 pb-20 lg:pt-36 lg:pb-36 px-6">
        {/* Subtle Background Elements (No heavy glow) */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-size-[32px_32px] mask-[radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10" />

        {/* Floating Building Assets - More subtle and integrated */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 0.25, x: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute left-[-2%] top-[30%] w-60 lg:w-95 xl:w-112.5 h-auto hidden lg:block pointer-events-none select-none grayscale hover:grayscale-0 transition-all duration-1000"
        >
          <Image
            src="/skyscrape.png"
            alt=""
            width={600}
            height={800}
            className="w-full h-auto mix-blend-multiply scale-150 pt-5 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 0.25, x: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="absolute right-[-2%] top-[30%] w-70 lg:w-105 xl:w-125 h-auto hidden lg:block pointer-events-none select-none grayscale hover:grayscale-0 transition-all duration-1000"
        >
          <Image
            src="/pngegg.png"
            alt=""
            width={1200}
            height={1400}
            priority={true}
            className="w-full h-auto mix-blend-multiply scale-200 pt-10 [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"
          />
        </motion.div>

        <div className="w-full max-w-none px-6 md:px-16 lg:px-24 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/5 text-primary text-xs font-bold mb-8 border border-primary/10">
              <Sparkles className="w-3.5 h-3.5" />
              Sistem Monitoring Birokrasi Berbasis ERP
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold tracking-tight mb-8 leading-[1.1] text-foreground">
              Transformasi Digital <br />
              <span className="text-primary">Pelayanan Publik.</span>
            </h1>
            <p className="text-lg lg:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              FlowGov mengeliminasi hambatan internal birokrasi dengan transparansi real-time, kontrol SLA otomatis, dan akuntabilitas berbasis data terpadu.
            </p>
            <div className="flex flex-row items-center justify-center gap-3 sm:gap-5 w-full">
              <Link href="/register" className="flex-1 sm:flex-none">
                <Button size="lg" className="w-full rounded-xl px-2 sm:px-10 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-lg shadow-primary/10 bg-primary hover:bg-primary/90 transition-all">
                  Mulai <span className="hidden sm:inline ml-1">Sekarang</span>
                  <ArrowRight className="ml-1 sm:ml-2 w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              </Link>
              <Link href="/public-tracking" className="flex-1 sm:flex-none">
                <Button size="lg" variant="outline" className="w-full rounded-xl px-2 sm:px-10 h-12 sm:h-14 text-[13px] sm:text-base font-bold border-border hover:bg-background transition-all">
                  Lacak <span className="hidden sm:inline ml-1">Izin Publik</span>
                  <span className="sm:hidden ml-1">Izin</span>
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/40 bg-muted/20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            {...staggerContainer}
            className="grid grid-cols-4 gap-2 sm:gap-6 md:gap-10"
          >
            {[
              { label: "Efisiensi Proses", value: "40%" },
              { label: "Kepatuhan SLA", value: "98%" },
              { label: "Akuntabilitas", value: "100%" },
              { label: "Monitoring", value: "24/7" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="flex flex-col items-center text-center justify-center"
              >
                <div className="flex items-center justify-center gap-1 sm:gap-2.5 mb-1 sm:mb-1.5">
                  <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                </div>
                <p className="text-[7px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-tight">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            {...fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Keunggulan Strategis</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto font-medium">Solusi cerdas untuk tantangan birokrasi masa kini.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            viewport={{ once: true }}
            className="flex md:grid md:grid-cols-3 gap-6 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-8 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            {[
              {
                title: "End-to-End Visibility",
                desc: "Pantau setiap tahapan internal birokrasi secara transparan dari awal hingga akhir proses.",
                color: "bg-primary"
              },
              {
                title: "Real-Time SLA Control",
                desc: "Sistem otomatis yang memastikan setiap proses selesai sesuai standar pelayanan prima.",
                color: "bg-primary"
              },
              {
                title: "Accountability by Design",
                desc: "Jejak digital permanen yang menjamin akuntabilitas setiap individu pelaksana organisasi.",
                color: "bg-primary"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="min-w-[85vw] sm:min-w-[320px] md:min-w-0 snap-center group p-8 md:p-10 rounded-3xl bg-card border border-border/60 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed font-medium">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-32 px-6 bg-muted/10" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="relative">
                <Image
                  src="/about.png"
                  alt="FlowGov Transformation"
                  width={1000}
                  height={1000}
                  className="w-full h-auto object-cover [mask-image:linear-gradient(to_bottom,black_80%,transparent_100%)]"
                />
              </div>
              <div className="absolute -bottom-8 -right-8 bg-card p-8 rounded-3xl shadow-xl border border-border hidden md:block">
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                    <Target className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Misi Utama</p>
                    <p className="font-bold text-lg text-foreground leading-tight">Digitalisasi Birokrasi<br />Tanpa Celah</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              {...fadeInUp}
              className="space-y-4"
            >
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-foreground mb-6 leading-tight">Membangun Kepercayaan Melalui Teknologi</h2>
                <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                  FlowGov lahir untuk menciptakan ekosistem pemerintahan yang transparan. Kami percaya setiap warga berhak mendapatkan pelayanan publik yang <span className="text-primary">cepat, pasti, dan akuntabel</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Globe, title: "Akses Inklusif", desc: "Menjangkau seluruh lapisan masyarakat dengan antarmuka yang ramah dan mudah digunakan." },
                  { icon: Shield, title: "Keamanan Terjamin", desc: "Melindungi data privasi Anda dengan infrastruktur enkripsi berskala enterprise." },
                  { icon: Zap, title: "Akselerasi Proses", desc: "Memangkas jalur birokrasi konvensional, menghadirkan layanan publik yang lebih responsif." },
                  { icon: Scale, title: "Transparansi Penuh", desc: "Standar kepastian hukum dan SOP yang setara, menghapus zona abu-abu dalam pelayanan." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-card border border-border/60 hover:bg-background transition-all">
                    <item.icon className="w-5 h-5 text-primary mb-4" />
                    <h4 className="font-bold text-base text-foreground mb-2">{item.title}</h4>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.div {...fadeInUp}>
        <FAQ />
      </motion.div>

      <motion.div {...fadeInUp}>
        <ContactForm />
      </motion.div>

      {/* Footer Section */}
      <footer className="pt-24 pb-12 bg-card border-t border-border/50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 mb-16 md:mb-20 text-left">
            <div className="col-span-2 md:col-span-1 space-y-4 md:space-y-6">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tighter">FlowGov</span>
              </div>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed max-w-sm">
                Transformasi digital pelayanan publik untuk Indonesia yang lebih transparan dan akuntabel.
              </p>
              <div className="flex items-center gap-3">
                {[Target, Target, Target, Target].map((Icon, i) => (
                  <Link key={i} href="#" className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center hover:bg-primary/10 hover:text-primary transition-all shadow-sm">
                    <Icon className="w-5 h-5" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-base mb-6">Layanan</h4>
              <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                <li><Link href="/public-tracking" className="hover:text-primary transition-colors">Pelacakan Izin</Link></li>
                <li><Link href="/register" className="hover:text-primary transition-colors">Pendaftaran Usaha</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Konsultasi Tata Ruang</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Verifikasi OCR</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-6">Perusahaan</h4>
              <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                <li><Link href="#about" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Karir</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Berita</Link></li>
                <li><Link href="#contact" className="hover:text-primary transition-colors">Kontak</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-base mb-6">Bantuan</h4>
              <ul className="space-y-4 text-muted-foreground font-medium text-sm">
                <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                <li>
                  <button onClick={() => setActivePopup("pusat-bantuan")} className="hover:text-primary transition-colors text-left">
                    Pusat Bantuan
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePopup("kebijakan-privasi")} className="hover:text-primary transition-colors text-left">
                    Kebijakan Privasi
                  </button>
                </li>
                <li>
                  <button onClick={() => setActivePopup("syarat-ketentuan")} className="hover:text-primary transition-colors text-left">
                    Syarat &amp; Ketentuan
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-10 md:pt-12 border-t border-border/40 text-center">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 mb-10 md:mb-12">
              <div className="flex items-center">
                <Image src="/dinas-pupr.png" alt="Dinas PUPR" width={100} height={40} className="object-contain md:w-[120px]" />
              </div>
              <div className="flex items-center">
                <Image src="/bpn-ri.png" alt="BPN RI" width={100} height={40} className="object-contain md:w-[120px]" />
              </div>
              <div className="flex items-center">
                <Image src="/ombudsman.png" alt="Ombudsman RI" width={100} height={40} className="object-contain md:w-[120px]" />
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-medium">
              &copy; 2026 FlowGov - Team 2026OtwKerja. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>

      {/* ── Popup: Pusat Bantuan ── */}
      <Dialog open={activePopup === "pusat-bantuan"} onOpenChange={(o) => !o && setActivePopup(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Pusat Bantuan</DialogTitle>
            <DialogDescription className="sr-only">
              Informasi bantuan dan kontak layanan FlowGov.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p>Selamat datang di Pusat Bantuan FlowGov. Kami siap membantu Anda dalam setiap tahap proses perizinan.</p>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Cara Mengajukan Permohonan</h3>
              <ol className="list-decimal list-inside space-y-1">
                <li>Daftarkan akun Anda melalui halaman Pendaftaran.</li>
                <li>Lengkapi data profil dan verifikasi KTP.</li>
                <li>Pilih jenis izin yang ingin diajukan.</li>
                <li>Unggah dokumen persyaratan yang diperlukan.</li>
                <li>Pantau status permohonan secara daring.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Hubungi Kami</h3>
              <ul className="space-y-1">
                <li>📧 Email: bantuan@flowgov.id</li>
                <li>📞 Telepon: (0251) 123-4567</li>
                <li>🕐 Jam Layanan: Senin–Jumat, 08.00–16.00 WIB</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Pertanyaan Umum</h3>
              <p>Untuk pertanyaan yang sering diajukan, silakan kunjungi bagian <strong>FAQ</strong> di halaman utama kami.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Popup: Kebijakan Privasi ── */}
      <Dialog open={activePopup === "kebijakan-privasi"} onOpenChange={(o) => !o && setActivePopup(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Kebijakan Privasi</DialogTitle>
            <DialogDescription className="sr-only">
              Kebijakan privasi dan perlindungan data FlowGov.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="text-xs text-muted-foreground">Terakhir diperbarui: 1 Januari 2026</p>
            <p>FlowGov berkomitmen untuk melindungi privasi dan keamanan data pribadi Anda sesuai dengan ketentuan peraturan perundang-undangan yang berlaku di Indonesia.</p>
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Data yang Kami Kumpulkan</h3>
              <p>Kami mengumpulkan data yang Anda berikan secara langsung, meliputi nama lengkap, alamat surel, nomor induk kependudukan (NIK), dan dokumen pendukung perizinan.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Penggunaan Data</h3>
              <p>Data Anda digunakan semata-mata untuk keperluan pemrosesan permohonan izin, verifikasi identitas, serta penyampaian notifikasi terkait status permohonan Anda.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Keamanan Data</h3>
              <p>Kami menerapkan enkripsi dan langkah-langkah keamanan teknis untuk melindungi data Anda dari akses, pengungkapan, atau perubahan yang tidak sah.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4. Berbagi Data</h3>
              <p>Data Anda tidak akan dijual atau dibagikan kepada pihak ketiga, kecuali kepada instansi pemerintah yang berwenang dalam rangka proses perizinan.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">5. Hak Pengguna</h3>
              <p>Anda berhak mengakses, memperbarui, atau meminta penghapusan data pribadi Anda dengan menghubungi kami melalui alamat surel bantuan@flowgov.id.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Popup: Syarat & Ketentuan ── */}
      <Dialog open={activePopup === "syarat-ketentuan"} onOpenChange={(o) => !o && setActivePopup(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Syarat &amp; Ketentuan</DialogTitle>
            <DialogDescription className="sr-only">
              Syarat dan ketentuan penggunaan layanan FlowGov.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
            <p className="text-xs text-muted-foreground">Berlaku sejak: 1 Januari 2026</p>
            <p>Dengan menggunakan layanan FlowGov, Anda menyatakan telah membaca, memahami, dan menyetujui syarat dan ketentuan berikut.</p>
            <div>
              <h3 className="font-semibold text-foreground mb-2">1. Ketentuan Umum</h3>
              <p>FlowGov adalah platform perizinan daring yang dikelola untuk memfasilitasi proses pengajuan izin mendirikan bangunan dan izin usaha secara elektronik.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">2. Kewajiban Pengguna</h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Memberikan informasi yang benar, lengkap, dan akurat.</li>
                <li>Tidak menyalahgunakan layanan untuk tujuan yang melanggar hukum.</li>
                <li>Menjaga kerahasiaan kata sandi akun Anda.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">3. Tanggung Jawab Layanan</h3>
              <p>FlowGov bertanggung jawab atas ketersediaan layanan dan keamanan data, namun tidak bertanggung jawab atas keterlambatan yang disebabkan oleh faktor di luar kendali sistem.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">4. Perubahan Ketentuan</h3>
              <p>Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diberitahukan melalui surel atau notifikasi dalam aplikasi.</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">5. Hukum yang Berlaku</h3>
              <p>Syarat dan ketentuan ini tunduk pada hukum Republik Indonesia dan segala sengketa diselesaikan melalui jalur musyawarah atau pengadilan yang berwenang.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}


