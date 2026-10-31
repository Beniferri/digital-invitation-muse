// Sitemap (Tahap 5, SEO). Hanya halaman publik yang memang layak
// diindeks: beranda, katalog, editor, masuk, daftar, dan halaman teks.
// SENGAJA TIDAK ADA: /akun, /admin (area login), /api, dan /u/[kode]
// (undangan tamu bersifat pribadi — tautannya dibagikan langsung, bukan
// dicari lewat mesin pencari).

import type { MetadataRoute } from "next";
import { urlSitus } from "@/lib/situs";

export default function sitemap(): MetadataRoute.Sitemap {
  const dasar = urlSitus();
  const halaman = ["", "/katalog", "/editor", "/masuk", "/daftar", "/syarat", "/privasi", "/bantuan"];
  return halaman.map((jalur) => ({
    url: `${dasar}${jalur}`,
    lastModified: new Date(),
  }));
}
