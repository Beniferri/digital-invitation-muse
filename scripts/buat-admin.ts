// Membuat atau menaikkan akun menjadi admin.
// Penggunaan: npm run buat-admin -- admin@contoh.id kata-sandi-minimal-8-karakter
// Kata sandi diterima dari argumen terminal saja, tidak pernah ditulis ke berkas
// proyek, dan langsung di-hash sebelum disimpan.

import { idBaru, jalankan, satuBaris, sekarangIso, type Baris } from "../lib/db";
import { hashKataSandi } from "../lib/kataSandi";

async function utama() {
  const [, , emailMentah, kataSandi] = process.argv;
  const email = (emailMentah ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Email tidak valid. Contoh: npm run buat-admin -- admin@contoh.id kata-sandi");
    process.exit(1);
  }
  if (!kataSandi || kataSandi.length < 8) {
    console.error("Kata sandi minimal 8 karakter.");
    process.exit(1);
  }
  const sudahAda = await satuBaris<Baris>("SELECT id FROM pengguna WHERE email = ?", email);
  if (sudahAda) {
    await jalankan(
      "UPDATE pengguna SET kata_sandi_hash = ?, peran = ? WHERE email = ?",
      hashKataSandi(kataSandi),
      "admin",
      email,
    );
  } else {
    await jalankan(
      "INSERT INTO pengguna (id, email, nama, kata_sandi_hash, peran, dibuat_pada) VALUES (?, ?, ?, ?, ?, ?)",
      idBaru(),
      email,
      null,
      hashKataSandi(kataSandi),
      "admin",
      sekarangIso(),
    );
  }
  console.log(`Akun admin siap: ${email} (peran: admin). Masuk lewat /admin/login.`);
}

utama().catch((galat) => {
  console.error(galat);
  process.exit(1);
});
