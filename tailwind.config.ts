import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "background":"#051424","surface":"#051424","surface-dim":"#051424",
        "surface-container-lowest":"#010f1f","surface-container-low":"#0d1c2d",
        "surface-container":"#122131","surface-container-high":"#1c2b3c",
        "surface-container-highest":"#273647","surface-bright":"#2c3a4c",
        "surface-variant":"#273647","surface-tint":"#00dbe9",
        "on-background":"#d4e4fa","on-surface":"#d4e4fa","on-surface-variant":"#b9cacb",
        "primary":"#dbfcff","on-primary":"#00363a","primary-container":"#00f0ff",
        "on-primary-container":"#006970","primary-fixed":"#7df4ff","primary-fixed-dim":"#00dbe9",
        "secondary":"#d0bcff","on-secondary":"#3c0091","secondary-container":"#571bc1",
        "on-secondary-container":"#c4abff","secondary-fixed":"#e9ddff","secondary-fixed-dim":"#d0bcff",
        "tertiary":"#f4f5fe","on-tertiary":"#2e3037","tertiary-container":"#d7d9e2",
        "error":"#ffb4ab","on-error":"#690005","error-container":"#93000a","on-error-container":"#ffdad6",
        "outline":"#849495","outline-variant":"#3b494b",
      },
    },
  },
  plugins: [],
};

export default config;
