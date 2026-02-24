import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | Nulumbung",
  description: "Kebijakan Privasi Portal Berita Nahdlatul Ulama.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="font-serif text-4xl md:text-5xl font-bold text-foreground mb-4">
          Kebijakan Privasi
        </h1>
        <div className="w-24 h-1 bg-accent mx-auto rounded-full" />
      </div>

      <div className="prose prose-lg max-w-none bg-card p-8 md:p-12 rounded-2xl border border-border shadow-xl text-black prose-headings:text-black prose-p:text-black prose-li:text-black prose-strong:text-black prose-a:text-black">
        <p>
          Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <h3>1. Pendahuluan</h3>
        <p>
          Selamat datang di Nulumbung. Kami menghargai privasi Anda dan berkomitmen untuk melindungi informasi pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda ketika Anda mengunjungi website kami.
        </p>

        <h3>2. Informasi yang Kami Kumpulkan</h3>
        <p>
          Kami dapat mengumpulkan informasi pribadi yang Anda berikan secara sukarela, seperti nama, alamat email, dan nomor telepon ketika Anda mendaftar newsletter, berpartisipasi dalam survei, atau menghubungi kami. Kami juga mengumpulkan informasi non-pribadi secara otomatis, seperti alamat IP, jenis browser, dan data penggunaan melalui cookies.
        </p>

        <h3>3. Penggunaan Informasi</h3>
        <p>
          Informasi yang kami kumpulkan digunakan untuk:
        </p>
        <ul>
          <li>Menyediakan dan meningkatkan layanan kami.</li>
          <li>Mengirimkan newsletter dan informasi terkait kegiatan NU.</li>
          <li>Menganalisis tren penggunaan untuk meningkatkan pengalaman pengguna.</li>
          <li>Menanggapi pertanyaan dan masukan Anda.</li>
        </ul>

        <h3>4. Keamanan Data</h3>
        <p>
          Kami menerapkan langkah-langkah keamanan yang wajar untuk melindungi informasi pribadi Anda dari akses, penggunaan, atau pengungkapan yang tidak sah. Namun, perlu diingat bahwa tidak ada metode transmisi data melalui internet yang 100% aman.
        </p>

        <h3>5. Tautan ke Situs Lain</h3>
        <p>
          Situs kami mungkin berisi tautan ke situs web lain yang tidak dioperasikan oleh kami. Kami tidak bertanggung jawab atas kebijakan privasi atau konten situs web pihak ketiga tersebut.
        </p>

        <h3>6. Perubahan Kebijakan Privasi</h3>
        <p>
          Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan akan diberitahukan dengan memperbarui tanggal &quot;Terakhir diperbarui&quot; di bagian atas halaman ini.
        </p>

        <h3>7. Hubungi Kami</h3>
        <p>
          Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami melalui email di redaksi@nulumbung.id.
        </p>
      </div>
    </div>
  );
}
