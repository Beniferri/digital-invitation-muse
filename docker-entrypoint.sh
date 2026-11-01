#!/bin/sh
# Entrypoint image Docker BETA Storia.
# Alasan ada skrip ini: database SQLite tidak ikut di dalam repo, jadi
# container pertama selalu mulai dengan database kosong. Entrypoint ini
# mengisi database contoh SEKALI saja — hanya kalau tabel template masih
# kosong. Kalau database sudah berisi (mis. dari volume persisten setelah
# redeploy), seed dilewati supaya edit template/paket/undangan yang sudah
# dilakukan lewat dasbor tidak tertimpa kembali ke data contoh.
# Akun admin tetap dibuat manual sekali lewat terminal container:
#   npm run buat-admin -- email kata-sandi
set -e

if [ "$(node scripts/perlu-seed.mjs)" = "ya" ]; then
  echo "Database masih kosong, menjalankan seed awal..."
  npm run db:seed
else
  echo "Database sudah berisi, seed dilewati."
fi

# Template baru dari repo (mis. Zamrud) ditambahkan kalau belum ada, tanpa
# mengubah template yang sudah ada — jadi redeploy cukup untuk memunculkan
# template baru di produksi. Kegagalan di sini hanya peringatan, bukan fatal.
node scripts/tambah-templat-baru.mjs || echo "Peringatan: sinkronisasi template baru gagal, aplikasi tetap dijalankan."

exec npm run start
