import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan | Nulumbung",
  description: "Syarat dan Ketentuan Penggunaan Portal Berita Nahdlatul Ulama.",
};

export default function TermsConditionsPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          Syarat & Ketentuan
        </h1>
        <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
      </div>

      <div className="prose prose-lg max-w-none bg-card p-8 md:p-12 rounded-2xl border border-border shadow-xl text-black prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black prose-a:text-black">
        <p>
          Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h3>1. Penerimaan Syarat</h3>
        <p>
          Dengan mengakses dan menggunakan situs web Nulumbung, Anda setuju untuk terikat oleh Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat ini, Anda tidak diperkenankan menggunakan layanan kami.
        </p>

        <h3>2. Penggunaan Konten</h3>
        <p>
          Semua konten yang tersedia di situs ini, termasuk teks, gambar, grafik, logo, dan video, adalah milik Nulumbung atau pemberi lisensinya dan dilindungi oleh hukum hak cipta. Anda diperbolehkan untuk mengakses dan menggunakan konten untuk keperluan pribadi dan non-komersial. Penggunaan ulang, reproduksi, atau distribusi konten tanpa izin tertulis dilarang.
        </p>

        <h3>3. Etika Pengguna</h3>
        <p>
          Saat menggunakan situs kami, Anda setuju untuk:
        </p>
        <ul>
          <li>Tidak memposting konten yang melanggar hukum, menyinggung, atau SARA.</li>
          <li>Tidak melakukan tindakan yang dapat merusak atau mengganggu kinerja situs.</li>
          <li>Menghormati hak kekayaan intelektual orang lain.</li>
        </ul>

        <h3>4. Penafian (Disclaimer)</h3>
        <p>
          Informasi yang disajikan di situs ini disediakan &quot;sebagaimana adanya&quot; tanpa jaminan apa pun. Kami berusaha menyajikan informasi yang akurat, namun tidak menjamin kelengkapan atau keakuratan materi. Kami tidak bertanggung jawab atas kerugian yang timbul dari penggunaan informasi di situs ini.
        </p>

        <h3>5. Perubahan Layanan</h3>
        <p>
          Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan atau fitur apa pun di situs ini kapan saja tanpa pemberitahuan sebelumnya.
        </p>

        <h3>6. Hukum yang Berlaku</h3>
        <p>
          Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan di pengadilan yang berwenang di Indonesia.
        </p>

        <h3>7. Kontak</h3>
        <p>
          Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini, silakan hubungi kami di redaksi@nulumbung.id.
        </p>
      </div>
    </div>
  );
}
