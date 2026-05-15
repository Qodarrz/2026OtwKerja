"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Send, Mail, MapPin, Phone, Building2 } from "lucide-react";

export function ContactForm() {
  return (
    <section className="py-24 px-6 bg-muted/50" id="contact">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-12">
            <div>
               <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-black uppercase tracking-widest text-primary mb-4">
                 Hubungi Kami
               </div>
               <h2 className="text-4xl font-black tracking-tight text-foreground mb-6">Butuh Informasi Lebih Lanjut?</h2>
               <p className="text-lg text-muted-foreground font-medium leading-relaxed max-w-lg">
                 Tim kami siap membantu instansi pemerintah atau pelaku usaha yang ingin mengintegrasikan layanan dengan platform FlowGov.
               </p>
            </div>

            <div className="space-y-8">
               <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <MapPin className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Kantor Pusat</p>
                    <p className="font-bold text-foreground">G-Gov Tower, Jl. Jend. Sudirman No. 1, Jakarta</p>
                  </div>
               </div>
               
               <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Email Dukungan</p>
                    <p className="font-bold text-foreground">support@flowgov.id</p>
                  </div>
               </div>

               <div className="flex items-center gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-card shadow-sm border border-border flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                    <Phone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Telepon</p>
                    <p className="font-bold text-foreground">(021) 555-0123</p>
                  </div>
               </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            className="bg-card p-10 rounded-[2.5rem] shadow-lg shadow-sm border border-border"
          >
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full h-14 px-6 rounded-2xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Email</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full h-14 px-6 rounded-2xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Instansi / Perusahaan</label>
                <input 
                  type="text" 
                  placeholder="PT. Sukses Maju"
                  className="w-full h-14 px-6 rounded-2xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Pesan</label>
                <textarea 
                  placeholder="Bagaimana kami bisa membantu Anda?"
                  rows={4}
                  className="w-full p-6 rounded-2xl bg-muted border border-border focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-bold resize-none"
                />
              </div>
              <Button className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-lg shadow-md shadow-sm group transition-all active:scale-95">
                Kirim Pesan
                <Send className="ml-2 w-5 h-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
