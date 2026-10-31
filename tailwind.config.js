/** @type {import('tailwindcss').Config} */
// Konfigurasi Tailwind untuk prototipe ini.
// Palet sengaja hangat: krem, emas, merah tanah, dan terakota.
// Tidak ada gradasi ungu-biru generik di seluruh proyek.
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./komponen/**/*.{js,ts,jsx,tsx,mdx}",
    "./data/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        krem: {
          50: "#FFFBF3",
          100: "#FFF6E6",
          200: "#FDEED3",
          300: "#F7E0B8",
        },
        emas: {
          300: "#E3B95A",
          500: "#C08A2B",
          600: "#9C6E1D",
          700: "#7A5616",
        },
        tanah: {
          500: "#A44A2A",
          600: "#8A3620",
          700: "#6E2A18",
          900: "#2B1A12",
        },
        daun: {
          100: "#E6EFE3",
          500: "#4E7A5A",
          700: "#33573F",
        },
        terakota: {
          100: "#FBE8DC",
          500: "#C96F4A",
          600: "#A85433",
        },
        tinta: "#2B1A12",
        tintaLembut: "#5C4638",
      },
      fontFamily: {
        sans: ["var(--huruf-sans)", "system-ui", "sans-serif"],
        serif: ["var(--huruf-serif)", "Georgia", "serif"],
      },
      boxShadow: {
        kaca: "0 18px 45px rgba(110, 42, 24, 0.14)",
        kacaLembut: "0 10px 30px rgba(110, 42, 24, 0.10)",
      },
    },
  },
  plugins: [],
};
