# Dockerfile UndanganKita — dipakai Coolify dengan Build Pack Dockerfile
# (bukan Railpack), supaya versi Node, proses build, dan proses jalan
# semuanya eksplisit dan tidak tergantung tebakan builder.
# Database SQLite tinggal di /data (lihat VOLUME + DATABASE_URL di bawah)
# dan harus dipasangi volume persisten di Coolify; kalau tidak, redeploy
# akan mengosongkan database lagi. Entrypoint mengisi database contoh
# otomatis hanya kalau database masih kosong (lihat docker-entrypoint.sh).

# syntax=docker/dockerfile:1

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Aset biner Zamrud (gambar + musik) disimpan di repo sebagai .b64
# karena tool push GitHub di sini hanya menerima berkas teks UTF-8.
# Di sinilah mereka dikembalikan ke bentuk biner, sebelum disalin ke
# image runner — jadi /templat/zamrud/*.jpg dan /musik/zamrud.mp3
# tetap tersaji normal di produksi. Kalau decode gagal, build gagal
# dengan jelas (bukan menghasilkan berkas kosong).
RUN for f in public/templat/zamrud/*.jpg.b64 public/musik/*.mp3.b64; do \
      if [ -f "$f" ]; then base64 -d "$f" > "${f%.b64}" || exit 1; rm "$f"; fi; \
    done
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
# Lokasi database di dalam volume persisten. Di Coolify, pasang volume
# ke /data dan biarkan variabel ini apa adanya; kalau volume dipasang di
# tempat lain, ubah variabel ini di pengaturan Coolify (bukan di sini).
ENV DATABASE_URL=file:/data/dev.db
# Folder foto unggahan (Tahap 4): di dalam volume yang sama dengan
# database, supaya foto tidak hilang saat redeploy. Jalur publiknya tetap
# /unggahan/<nama> lewat route /api/unggahan (lihat next.config.mjs).
ENV UNGGAHAN_DIR=/data/unggahan
# Cadangan database (Tahap 4) default ke folder yang sama persistennya.
ENV CADANGAN_DIR=/data/cadangan
# node_modules ikut disalin lengkap (termasuk tsx) supaya perintah
# `npm run db:seed` dan `npm run buat-admin` tetap bisa jalan dari
# terminal container setelah deploy.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/lib ./lib
COPY --from=builder /app/data ./data
COPY --from=builder /app/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh
VOLUME /data
EXPOSE 3000
# Healthcheck (Tahap 4): Coolify/Docker menganggap container tidak sehat
# kalau endpoint ini tidak menjawab 200. wget tersedia di image Alpine.
HEALTHCHECK --interval=60s --timeout=5s --start-period=15s CMD wget -q -O /dev/null http://localhost:3000/api/sehat || exit 1
ENTRYPOINT ["./docker-entrypoint.sh"]
