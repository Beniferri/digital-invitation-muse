// Alamat publik situs (Tahap 5, SEO). Dipakai metadataBase, sitemap,
// robots, dan pratinjau Open Graph halaman tamu — semuanya butuh URL
// absolut. Di Coolify, pasang SITUS_URL ke domain produksi; kalau tidak
// dipasang, fallback-nya domain produksi yang dipakai saat ini. Jangan
// memakai localhost di sini: URL ini muncul di hasil pencarian dan
// pratinjau tautan yang dibagikan.

export function urlSitus(): string {
  const dariEnv = process.env.SITUS_URL?.trim().replace(/\/+$/, "");
  return dariEnv ? dariEnv : "https://inv.benifin.my.id";
}

/** Mengubah jalur relatif (/unggahan/...) menjadi URL absolut. URL yang
 * sudah absolut (mis. foto sampul dari picsum) dikembalikan apa adanya. */
export function urlAbsolut(jalur: string): string {
  if (jalur.startsWith("http://") || jalur.startsWith("https://")) return jalur;
  return `${urlSitus()}${jalur.startsWith("/") ? jalur : `/${jalur}`}`;
}
