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
ENTRYPOINT ["./docker-entrypoint.sh"]
