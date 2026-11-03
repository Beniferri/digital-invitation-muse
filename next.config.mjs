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
  // Header keamanan untuk semua jalur. SENGAJA tanpa Content-Security-Policy
  // ketat: Next memakai skrip inline untuk RSC, dan CSP yang salah justru
  // merusak aplikasi — itu pekerjaan lanjutan yang butuh uji halaman per
  // halaman, bukan satu baris di sini. HSTS tanpa includeSubDomains dan
  // tanpa preload supaya aman di shared hosting cPanel.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Strict-Transport-Security", value: "max-age=31536000" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
export default konfigurasiNext;
