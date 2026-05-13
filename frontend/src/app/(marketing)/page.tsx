"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { 
  FileText, 
  Map as MapIcon, 
  ShieldCheck, 
  Zap, 
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Building2,
  Scale,
  Eye,
  Clock,
  CheckCircle2,
  Globe,
  Users,
  Target
} from "lucide-react";
import Link from "next/link";
import { FAQ } from "@/components/landing/FAQ";
import { ContactForm } from "@/components/landing/ContactForm";
import Image from "next/image";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background overflow-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
        {/* Background Orbs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-sky-500/5 rounded-full blur-[100px] -z-10" />

        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-bold mb-6 border border-primary/20">
              <ShieldCheck className="w-4 h-4" />
              Sistem Monitoring Kinerja Birokrasi Berbasis ERP
            </span>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
              Transformasi Digital <br />
              <span className="text-primary">Pelayanan Publik Masa Depan.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed font-medium">
              FlowGov mengeliminasi "Internal Black Box" birokrasi dengan transparansi real-time, kontrol SLA otomatis, dan akuntabilitas berbasis data.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <Button size="lg" className="rounded-xl px-8 h-14 font-bold shadow-xl shadow-primary/20 group">
                  Mulai Sekarang
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/public-tracking">
                <Button size="lg" variant="outline" className="rounded-xl px-8 h-14 font-bold">
                  Lacak Izin Publik
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Features Grid */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { 
                icon: Eye, 
                title: "End-to-End Visibility", 
                desc: "Pantau setiap tahapan internal birokrasi secara transparan dari awal hingga akhir.",
                color: "bg-sky-500"
              },
              { 
                icon: Clock, 
                title: "Real-Time SLA Control", 
                desc: "Sistem otomatis yang memastikan setiap proses diselesaikan tepat waktu sesuai standar pelayanan.",
                color: "bg-blue-600"
              },
              { 
                icon: CheckCircle2, 
                title: "Accountability by Design", 
                desc: "Jejak digital yang tidak dapat dimanipulasi menjamin akuntabilitas setiap individu pelaksana.",
                color: "bg-sky-400"
              },
            ].map((feature, i) => (
              <div 
                key={i}
                className="group p-8 rounded-3xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left"
              >
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg shadow-primary/20", feature.color)}>
                  <feature.icon className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* About Us Section */}
      <section className="py-24 px-6 relative overflow-hidden" id="about">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
             <motion.div 
               initial={{ opacity: 0, x: -30 }}
               whileInView={{ opacity: 1, x: 0 }}
               className="relative"
             >
                <div className="absolute -inset-4 bg-primary/20 rounded-[3rem] blur-2xl -z-10" />
                <div className="relative rounded-[2.5rem] overflow-hidden border border-border/50 shadow-2xl">
                   <Image 
                     src="/about-bg.png" 
                     alt="FlowGov Transformation" 
                     width={800} 
                     height={800}
                     className="w-full h-auto object-cover transform hover:scale-105 transition-transform duration-700"
                   />
                </div>
                <div className="absolute -bottom-10 -right-10 bg-white p-8 rounded-3xl shadow-2xl border border-slate-100 hidden md:block">
                   <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white">
                         <Target className="w-6 h-6" />
                      </div>
                      <div>
                         <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Misi Utama</p>
                         <p className="font-bold text-slate-900 leading-tight">Digitalisasi Birokrasi<br />Tanpa Celah</p>
                      </div>
                   </div>
                </div>
             </motion.div>

             <div className="space-y-8">
                <div>
                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                     Tentang FlowGov
                   </div>
                   <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-6">Membangun Kepercayaan Melalui Teknologi</h2>
                   <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                     FlowGov lahir dari visi untuk menciptakan ekosistem pemerintahan yang transparan dan akuntabel. Kami percaya bahwa setiap warga negara berhak mendapatkan pelayanan publik yang cepat, pasti, dan bebas dari hambatan birokrasi yang tidak perlu.
                   </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   {[
                     { icon: Globe, title: "Akses Inklusif", desc: "Menjangkau seluruh lapisan masyarakat dengan antarmuka yang ramah pengguna." },
                     { icon: Users, title: "Kolaborasi Tim", desc: "Memfasilitasi koordinasi antar dinas secara seamless dan terintegrasi." }
                   ].map((item, i) => (
                     <div key={i} className="p-6 rounded-2xl bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 transition-all group">
                        <item.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                        <h4 className="font-bold text-slate-900 mb-2">{item.title}</h4>
                        <p className="text-sm text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
                     </div>
                   ))}
                </div>

                <div className="pt-4">
                   <Button className="rounded-xl font-bold px-8 h-12 shadow-lg shadow-primary/20">Pelajari Selengkapnya</Button>
                </div>
             </div>
          </div>
        </div>
      </section>

      <FAQ />
      
      <ContactForm />

      {/* Trust/Footer Section */}
      <footer className="pt-24 pb-12 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 text-center md:text-left">
            <div className="md:col-span-1 space-y-6">
               <div className="flex items-center justify-center md:justify-start gap-2">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                  <span className="text-2xl font-black tracking-tighter">FlowGov</span>
               </div>
               <p className="text-slate-400 font-medium leading-relaxed">
                 Transformasi digital pelayanan publik untuk Indonesia yang lebih transparan dan akuntabel.
               </p>
               <div className="flex items-center justify-center md:justify-start gap-4">
                  {[Target, Target, Target, Target].map((Icon, i) => (
                    <Link key={i} href="#" className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center hover:bg-primary hover:text-white transition-all group">
                       <Icon className="w-5 h-5" />
                    </Link>
                  ))}
               </div>
            </div>
            
            <div>
               <h4 className="font-bold text-lg mb-6">Layanan</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><Link href="/public-tracking" className="hover:text-primary transition-colors">Pelacakan Izin</Link></li>
                  <li><Link href="/register" className="hover:text-primary transition-colors">Pendaftaran Usaha</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Konsultasi Tata Ruang</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Verifikasi OCR</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-lg mb-6">Perusahaan</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><Link href="#about" className="hover:text-primary transition-colors">Tentang Kami</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Karir</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Berita</Link></li>
                  <li><Link href="#contact" className="hover:text-primary transition-colors">Kontak</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-lg mb-6">Bantuan</h4>
               <ul className="space-y-4 text-slate-400 font-medium">
                  <li><Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Pusat Bantuan</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Kebijakan Privasi</Link></li>
                  <li><Link href="#" className="hover:text-primary transition-colors">Syarat & Ketentuan</Link></li>
               </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-slate-800 text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-slate-600 mb-8">
              Standar Akuntabilitas Tinggi
            </p>
            <div className="flex flex-wrap justify-center items-center gap-12 opacity-30 grayscale hover:grayscale-0 transition-all cursor-default mb-12">
              <div className="flex items-center gap-2 font-bold text-xl">
                <Building2 className="w-6 h-6" /> DINAS PUPR
              </div>
              <div className="flex items-center gap-2 font-bold text-xl">
                <ShieldCheck className="w-6 h-6" /> BPN RI
              </div>
              <div className="flex items-center gap-2 font-bold text-xl">
                <Scale className="w-6 h-6" /> OMBUDSMAN
              </div>
            </div>
            <p className="text-slate-500 text-sm font-medium">
              &copy; 2026 FlowGov - Team 2026OtwKerja. Seluruh hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
