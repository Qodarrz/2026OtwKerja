"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "Apa itu FlowGov?",
    answer: "FlowGov adalah platform ERP (Enterprise Resource Planning) untuk birokrasi pemerintah yang dirancang untuk meningkatkan transparansi, akuntabilitas, dan efisiensi dalam proses perizinan dan pelayanan publik."
  },
  {
    question: "Bagaimana cara melacak izin saya?",
    answer: "Anda dapat melacak izin Anda melalui fitur 'Public Tracking' dengan memasukkan nomor referensi pengajuan Anda, atau login ke dashboard untuk melihat detail progres setiap tahapan."
  },
  {
    question: "Berapa lama waktu yang dibutuhkan untuk proses perizinan?",
    answer: "Waktu proses bervariasi tergantung jenis izin. Namun, sistem kami dilengkapi dengan SLA (Service Level Agreement) otomatis yang memastikan setiap tahapan diselesaikan dalam waktu yang telah ditentukan."
  },
  {
    question: "Apakah data saya aman?",
    answer: "Keamanan data adalah prioritas utama kami. FlowGov menggunakan enkripsi tingkat tinggi dan sistem audit log yang tidak dapat diubah (immutable) untuk menjamin integritas data Anda."
  },
  {
    question: "Apakah saya bisa berkonsultasi sebelum mengajukan izin?",
    answer: "Ya, kami menyediakan layanan bantuan dan konsultasi ahli untuk membantu Anda memverifikasi dokumen teknis sebelum diajukan ke sistem."
  }
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-24 px-6 relative overflow-hidden" id="faq">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight text-foreground mb-4">Pertanyaan Sering Diajukan</h2>
          <p className="text-muted-foreground font-medium max-w-lg mx-auto">
            Temukan jawaban cepat untuk pertanyaan umum seputar layanan FlowGov.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "border rounded-3xl transition-all duration-300 overflow-hidden bg-card",
                openIndex === i ? "border-primary/30 shadow-md shadow-sm" : "border-border"
              )}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full p-6 flex items-center justify-between text-left group"
              >
                <span className={cn(
                  "text-lg font-bold transition-colors",
                  openIndex === i ? "text-primary" : "text-foreground"
                )}>
                  {faq.question}
                </span>
                <div className={cn(
                  "w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                  openIndex === i ? "bg-primary text-primary-foreground rotate-180" : "bg-muted text-muted-foreground group-hover:bg-secondary"
                )}>
                  <ChevronDown className="w-5 h-5" />
                </div>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="px-6 pb-6 text-muted-foreground font-medium leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
