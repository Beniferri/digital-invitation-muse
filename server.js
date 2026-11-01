// Server kustom Next.js untuk hosting cPanel (Passenger).
// Alasan berkas ini ada: panel Node.js App cPanel membutuhkan berkas
// startup JavaScript, sementara `next start` adalah perintah CLI, bukan
// berkas. Berkas ini melakukan hal yang sama seperti `next start`:
// menyiapkan aplikasi produksi lalu meneruskan semua permintaan ke
// penangan Next.js. Port diambil dari environment (Passenger yang
// mengaturnya), dengan cadangan 3000 untuk jalan lokal.
// Berkas ini TIDAK dipakai Coolify (Coolify tetap memakai `npm run start`
// yang menjalankan `next start` langsung).
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const port = parseInt(process.env.PORT, 10) || 3000;
const aplikasi = next({ dev: false });
const tangani = aplikasi.getRequestHandler();

aplikasi.prepare().then(() => {
  createServer((permintaan, tanggapan) => {
    const urlTerurai = parse(permintaan.url, true);
    tangani(permintaan, tanggapan, urlTerurai);
  }).listen(port, () => {
    console.log(`BETA Storia siap di port ${port}`);
  });
});
