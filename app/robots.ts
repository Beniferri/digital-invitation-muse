// Robots (Tahap 5, SEO). Mesin pencari boleh mengindeks halaman publik,
// tapi tidak boleh mengindeks area login, API, dan undangan tamu
// (privasi: tautan tamu dibagikan langsung, bukan dicari).

import type { MetadataRoute } from "next";
import { urlSitus } from "@/lib/situs";

export default function robots(): MetadataRoute.Robots {
  const dasar = urlSitus();
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/akun", "/api", "/u"],
      },
    ],
    sitemap: `${dasar}/sitemap.xml`,
  };
}
