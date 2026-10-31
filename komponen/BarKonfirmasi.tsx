import React from "react";

// Impor React eksplisit: di bawah Next (runtime otomatis) tidak
// diperlukan, tapi pengujian renderToString lewat tsx memakai transform
// klasik sehingga JSX di berkas ini butuh React di scope.
// Bar ajakan bertindak yang selalu terlihat di halaman tamu: satu tombol
// emas "Konfirmasi Kehadiran" yang menempel di bawah layar dan mengarah
// ke formulir RSVP (#rsvp). Tanpa bar ini, tamu harus menggulir seluruh
// undangan (8 seksi di Zamrud) sebelum menemukan tindakan utamanya.
//
// Komponen ini sengaja murni presentasi: tanpa hook, tanpa impor next/*,
// sehingga bisa dirender di server, di komponen klien (Zamrud), maupun
// di pengujian renderToString. Yang mengontrol tampil/tidaknya adalah
// pemiliknya: statusAktif saja, di kedua jalur. Di Zamrud, bar tidak
// bocor selama intro/sampul karena sampul (z-70) menutupi bar (z-40)
// secara visual sampai sampul di-unmount.
//
// Di desktop, bar hanya selebar kolom konten (lg:left-[42%]) supaya tidak
// menutupi panel hero tetap Zamrud. Pemiliknya wajib memberi bantalan
// bawah (mis. pb-28) pada konten saat bar tampil, supaya penutup tidak
// tertutup bar.
export default function BarKonfirmasi({ tampil, href = "#rsvp" }: { tampil: boolean; href?: string }) {
  if (!tampil) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 lg:left-[42%]">
      <a
        href={href}
        className="mx-auto flex min-h-[52px] max-w-md items-center justify-center rounded-full bg-emas-500 px-6 text-sm font-bold text-emerald-950 shadow-kaca hover:bg-emas-300"
      >
        Konfirmasi Kehadiran
      </a>
    </div>
  );
}
