"use client";

// Tombol hapus undangan dengan konfirmasi bawaan browser. Formulirnya
// sama persis dengan sebelumnya (aksi server + id tersembunyi) — yang
// berubah hanya: ketukan yang tidak sengaja tidak langsung menghapus,
// karena pengguna harus menekan "OK" dulu di dialog konfirmasi.
export default function HapusUndangan({
  aksi,
  id,
  nama,
}: {
  aksi: (formulir: FormData) => Promise<void>;
  id: string;
  nama: string;
}) {
  const konfirmasi = (acara: React.MouseEvent<HTMLButtonElement>) => {
    if (!window.confirm(`Hapus undangan ${nama}? Tindakan ini tidak bisa dibatalkan.`)) {
      acara.preventDefault();
    }
  };

  return (
    <form action={aksi}>
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        onClick={konfirmasi}
        className="min-h-[44px] rounded-full bg-terakota-100 px-4 text-sm font-bold text-tanah-700"
      >
        Hapus
      </button>
    </form>
  );
}
