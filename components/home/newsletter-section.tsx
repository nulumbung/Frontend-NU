'use client';

import { Mail, Send } from 'lucide-react';

export function NewsletterSection() {
  return (
    <section className="py-24 bg-gradient-to-br from-primary to-primary-foreground/10 text-primary-foreground relative overflow-hidden">
      {/* Abstract Shapes */}
      <div className="absolute inset-0 bg-[url('/patterns/abstract-waves.svg')] opacity-[0.15] mix-blend-overlay pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse" />

      <div className="container mx-auto px-4 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        
        <div className="max-w-xl text-center md:text-left">
          <div className="flex items-center gap-4 mb-4 justify-center md:justify-start">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            <span className="font-sans font-bold uppercase tracking-widest text-sm text-accent">Newsletter</span>
          </div>
          <h2 className="font-serif text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Berita Terkini Langsung ke Kotak Masuk Anda
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-lg mx-auto md:mx-0">
            Dapatkan informasi terbaru seputar Nahdlatul Ulama, kajian keislaman, dan agenda kegiatan penting setiap minggunya.
          </p>

          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto md:mx-0">
            <input 
              type="email" 
              placeholder="Alamat Email Anda" 
              className="flex-1 px-6 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder:text-white/70 focus:outline-none focus:border-accent focus:bg-white/20 transition-all shadow-inner"
            />
            <button 
              type="submit"
              className="px-8 py-4 rounded-full bg-accent text-accent-foreground font-bold hover:bg-white hover:text-primary transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20 group"
            >
              <span>Langganan</span>
              <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>
          <p className="text-xs text-primary-foreground/50 mt-4">
            *Kami menghargai privasi Anda. Berhenti berlangganan kapan saja.
          </p>
        </div>

        {/* Illustration Placeholder (can be replaced with actual illustration) */}
        <div className="hidden lg:block relative w-1/3 aspect-square">
           <div className="absolute inset-0 bg-gradient-to-tr from-accent to-transparent rounded-full opacity-20 blur-3xl animate-pulse" />
           <div className="absolute inset-0 flex items-center justify-center">
             <div className="w-64 h-64 border border-white/10 rounded-full flex items-center justify-center relative animate-spin-slow">
               <div className="absolute top-0 w-4 h-4 bg-accent rounded-full shadow-[0_0_20px_#D4AF37]" />
               <div className="w-48 h-48 border border-white/20 rounded-full flex items-center justify-center animate-reverse-spin">
                 <div className="w-32 h-32 bg-white/5 backdrop-blur-xl rounded-full border border-white/30 flex items-center justify-center shadow-2xl">
                    <Mail className="w-12 h-12 text-accent" />
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </section>
  );
}
