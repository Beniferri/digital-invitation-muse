import Link from "next/link";

// Halaman 404 khusus tautan tamu. Rute /u/[kode] memanggil notFound()
// untuk tiga keadaan yang dari sisi tamu tidak bisa dibedakan: kode
// tidak ada, undangan masih Draft (belum diaktifkan), atau templatnya
// hilang. Pesannya sengaja tidak menebak-nebak penyebabnya dan tidak
// membocorkan data undangan apa pun — hanya langkah berikutnya: periksa
// tautan dari pengirim, atau hubungi penyelenggara. Tanpa halaman ini,
// tamu hanya melihat 404 generik Next.js yang terasa seperti situs rusak.
export default function UndanganTidakDitemukan() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 py-16 text-center">
      <p className="flex h-20 w-20 items-center justify-center rounded-full bg-krem-200 font-serif text-4xl text-tanah-700">
        ?
      </p>
      <h1 className="mt-6 font-serif text-3xl font-bold text-tinta">
        Tautan ini belum bisa dibuka
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-tintaLembut">
        Undangan mungkin belum diaktifkan oleh penyelenggara, atau tautan
        yang kamu terima salah maupun sudah tidak berlaku.
      </p>
      <p className="mt-3 text-[15px] leading-relaxed text-tintaLembut">
        Periksa kembali tautan dari pengirim acara. Kalau kamu yakin
        tautannya benar, hubungi penyelenggara acara.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link
          href="/"
          className="inline-flex min-h-[48px] items-center rounded-full bg-tanah-600 px-6 text-sm font-bold text-white hover:bg-tanah-700"
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/bantuan"
          className="inline-flex min-h-[48px] items-center rounded-full border-2 border-tanah-600/30 px-6 text-sm font-bold text-tanah-700 hover:bg-krem-100"
        >
          Buka Bantuan
        </Link>
      </div>
    </div>
  );
}
