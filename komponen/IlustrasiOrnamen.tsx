// Semua ornamen di sini adalah SVG inline buatan sendiri.
// Tidak ada foto stok dan tidak ada ilustrasi orbs acak: tiap bentuk punya
// fungsi, yaitu membingkai nama, menandai jenis acara, atau memberi jeda visual.

// Garis parang yang halus untuk templat tradisional.
export function OrnamenParang({ idUnik }: { idUnik: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 60" className="h-10 w-full text-emas-500" fill="none">
      <defs>
        <pattern id={idUnik} width="40" height="20" patternUnits="userSpaceOnUse">
          <path d="M0 20 Q10 0 20 20 T40 20" stroke="currentColor" strokeWidth="1.4" opacity="0.55" />
        </pattern>
      </defs>
      <rect width="200" height="60" fill={`url(#${idUnik})`} />
    </svg>
  );
}

// Bunga melati kecil untuk templat islami: lima kelopak sederhana.
export function OrnamenMelati() {
  return (
    <svg aria-hidden="true" viewBox="0 0 120 40" className="mx-auto h-10 w-32 text-daun-500" fill="currentColor">
      {[0, 1, 2].map((indeks) => (
        <g key={indeks} transform={`translate(${20 + indeks * 40} 20)`}>
          {[0, 72, 144, 216, 288].map((sudut) => (
            <ellipse key={sudut} cx="0" cy="-9" rx="4.5" ry="8" transform={`rotate(${sudut})`} opacity="0.85" />
          ))}
          <circle r="3.5" fill="#C08A2B" />
        </g>
      ))}
    </svg>
  );
}

// Garis senja dan titik-titik hangat untuk templat modern.
export function OrnamenGarisSenja() {
  return (
    <svg aria-hidden="true" viewBox="0 0 200 40" className="h-8 w-full text-terakota-500" fill="none">
      <line x1="10" y1="20" x2="75" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="100" cy="20" r="5" fill="currentColor" stroke="none" />
      <line x1="125" y1="20" x2="190" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Ikon garis sederhana untuk kartu jenis acara dan fitur.
// Sengaja tanpa emoji supaya tampilannya rapi dan mudah dibaca.
export function IkonCentang() {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0 text-daun-700" fill="none">
      <circle cx="10" cy="10" r="9" fill="#E6EFE3" />
      <path d="M6 10.5 8.8 13 14 7.5" stroke="#33573F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IkonKalender() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="8" y1="3" x2="8" y2="7" />
      <line x1="16" y1="3" x2="16" y2="7" />
    </svg>
  );
}

export function IkonLokasi() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

export function IkonWhatsApp() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
      <path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm5.2 13.9c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5s.8 1.9.8 2c.1.1.1.3 0 .5l-.4.6c-.1.2-.3.4-.1.7.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.4 2.4 1.5.3.1.5.1.7-.1l.8-.9c.2-.3.4-.2.7-.1l1.9.9c.3.1.5.2.5.3.1.1.1.7-.2 1.2Z" />
    </svg>
  );
}
