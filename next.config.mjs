/** @type {import('next').NextConfig} */
// Rewrite beforeFiles untuk foto unggahan (Tahap 4): permintaan
// /unggahan/<nama> diarahkan ke route /api/unggahan/<nama> SEBELUM
// pengecekan public/, supaya foto yang tersimpan di UNGGAHAN_DIR (di
// luar public/, mis. volume persisten Coolify) tetap bisa dibuka lewat
// jalur publik yang sama seperti dulu. Gambar editor hanya pratinjau
// lokal, jadi tidak ada domain gambar jarak jauh yang perlu diizinkan.
const konfigurasiNext = {
  async rewrites() {
    return {
      beforeFiles: [{ source: "/unggahan/:nama", destination: "/api/unggahan/:nama" }],
    };
  },
};
export default konfigurasiNext;
