"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
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
  return (
    <main className="min-h-screen bg-background overflow-x-hidden selection:bg-primary/20">
      <IntroLoader />
      {/* Hero Section */}
      <section className="relative min-h-[92vh] lg:min-h-screen flex items-center justify-center pt-32 pb-20 lg:pt-36 lg:pb-36 px-6">
        {/* Subtle Background Elements (No heavy glow) */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 -z-10" />

        {/* Floating Building Assets - More subtle and integrated */}
        <motion.div
          initial={{ opacity: 0, x: -60 }}
          animate={{ opacity: 0.25, x: 0 }}
          transition={{ duration: 1.2, delay: 0.2, ease: "easeOut" }}
          className="absolute left-[-2%] top-[25%] w-[240px] lg:w-[380px] xl:w-[450px] h-auto hidden lg:block pointer-events-none select-none grayscale hover:grayscale-0 transition-all duration-1000"
        >
          <Image
            src="/skyscraper-hero.png"
            alt=""
            width={600}
            height={800}
            className="w-full h-auto mix-blend-multiply scale-150 pt-5"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 0.25, x: 0 }}
          transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }}
          className="absolute right-[-2%] top-[20%] w-[280px] lg:w-[420px] xl:w-[500px] h-auto hidden lg:block pointer-events-none select-none grayscale hover:grayscale-0 transition-all duration-1000"
        >
          <Image
            src="/pngegg.png"
            alt=""
            width={1200}
            height={1400}
            className="w-full h-auto mix-blend-multiply scale-200 pt-10"
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-5">
              <Link href="/register">
                <Button size="lg" className="rounded-xl px-10 h-14 text-base font-bold shadow-lg shadow-primary/10 bg-primary hover:bg-primary/90 transition-all">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/public-tracking">
                <Button size="lg" variant="outline" className="rounded-xl px-10 h-14 text-base font-bold border-border hover:bg-background transition-all">
                  Lacak Izin Publik
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
            className="grid grid-cols-2 md:grid-cols-4 gap-10"
          >
            {[
              { label: "Efisiensi Proses", value: "40%", icon: Zap },
              { label: "Kepatuhan SLA", value: "98%", icon: Shield },
              { label: "Akuntabilitas", value: "100%", icon: CheckCircle2 },
              { label: "Monitoring", value: "24/7", icon: Activity },
            ].map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="flex flex-col items-center text-center justify-center"
              >
                <div className="flex items-center justify-center gap-2.5 mb-1.5">
                  <stat.icon className="w-4 h-4 text-primary/70" />
                  <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                </div>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
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
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              {
                icon: Eye,
                title: "End-to-End Visibility",
                desc: "Pantau setiap tahapan internal birokrasi secara transparan dari awal hingga akhir proses.",
                color: "bg-primary"
              },
              {
                icon: Clock,
                title: "Real-Time SLA Control",
                desc: "Sistem otomatis yang memastikan setiap proses selesai sesuai standar pelayanan prima.",
                color: "bg-primary"
              },
              {
                icon: CheckCircle2,
                title: "Accountability by Design",
                desc: "Jejak digital permanen yang menjamin akuntabilitas setiap individu pelaksana organisasi.",
                color: "bg-primary"
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group p-10 rounded-3xl bg-card border border-border/60 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
              >
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-8 text-primary-foreground shadow-md", feature.color)}>
                  <feature.icon className="w-6 h-6" />
                </div>
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
              <div className="relative rounded-3xl overflow-hidden border border-border/50 shadow-xl">
                <Image
                  src="/about-bg.png"
                  alt="FlowGov Transformation"
                  width={800}
                  height={800}
                  className="w-full h-auto object-cover"
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
                  { icon: Globe, title: "Akses Inklusif", desc: "Menjangkau seluruh lapisan masyarakat dengan sistem ramah pengguna." },
                  { icon: Users, title: "Kolaborasi Tim", desc: "Memfasilitasi koordinasi antar instansi secara terintegrasi." },
                  { icon: Users, title: "Kolaborasi Tim", desc: "Memfasilitasi koordinasi antar instansi secara terintegrasi." },
                  { icon: Users, title: "Kolaborasi Tim", desc: "Memfasilitasi koordinasi antar instansi secara terintegrasi." }
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-center md:text-left">
            <div className="md:col-span-1 space-y-6">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="text-2xl font-bold tracking-tighter">FlowGov</span>
              </div>
              <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                Transformasi digital pelayanan publik untuk Indonesia yang lebih transparan dan akuntabel.
              </p>
              <div className="flex items-center justify-center md:justify-start gap-3">
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
                <li><Link href="#" className="hover:text-primary transition-colors">Pusat Bantuan</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-border/40 text-center">
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500 mb-12">
              <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <Building2 className="w-6 h-6 text-primary" /> DINAS PUPR
              </div>
              <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <ShieldCheck className="w-6 h-6 text-primary" /> BPN RI
              </div>
              <div className="flex items-center gap-2.5 font-bold text-lg tracking-tight">
                <Scale className="w-6 h-6 text-primary" /> OMBUDSMAN
              </div>
            </div>
            <p className="text-muted-foreground text-xs font-medium">
              &copy; 2026 FlowGov - Team 2026OtwKerja. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}


