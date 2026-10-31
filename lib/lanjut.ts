// Tujuan kembali setelah masuk/daftar yang diizinkan dari formulir.
// Daftar putih ketat (bukan sembarang path dari formulir) supaya nilai
// lanjut tidak bisa dipakai mengarahkan pengguna ke situs luar atau ke
// halaman admin. Dipakai bersama oleh aksi otentikasi dan halaman
// masuk/daftar — satu sumber kebenaran, jangan duplikasi daftarnya.

export const LANJUT_DIIZINKAN = ["/editor", "/akun/paket"] as const;

export function lanjutAman(nilai: string | null | undefined): string | null {
  if (!nilai) return null;
  return (LANJUT_DIIZINKAN as readonly string[]).includes(nilai) ? nilai : null;
}
