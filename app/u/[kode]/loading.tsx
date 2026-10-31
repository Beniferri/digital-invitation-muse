// Kerangka muat halaman tamu: meniru sampul Zamrud (panel zamrud gelap,
// lingkaran monogram + baris teks berdenyut) supaya tamu tidak melihat
// layar kosong saat data undangan dimuat. Teks "Memuat undangan…" selalu
// tampil (bukan hanya animasi) agar pembaca layar pun mendapat statusnya.
export default function MemuatHalamanTamu() {
  return (
    <div
      role="status"
      aria-label="Memuat undangan"
      className="flex min-h-[85vh] flex-col items-center justify-center bg-emerald-950 px-6 text-center text-krem-50"
    >
      <div className="h-24 w-24 animate-pulse rounded-full border-2 border-emas-300/50" />
      <p className="mt-8 text-sm font-bold uppercase tracking-[0.25em] text-emas-300">
        Memuat undangan…
      </p>
      <div className="mt-6 h-4 w-56 animate-pulse rounded-full bg-white/15" />
      <div className="mt-3 h-4 w-40 animate-pulse rounded-full bg-white/15" />
    </div>
  );
}
