export type ColorTheme = {
  name:      string;
  primary:   string;
  secondary: string;
  bg:        string;
};

export const THEMES: ColorTheme[] = [
  { name: "Aether",    primary: "#00f0ff", secondary: "#571bc1", bg: "#051424" },
  { name: "Plasma",   primary: "#ff6b9d", secondary: "#c44dff", bg: "#0f0416" },
  { name: "Solar",    primary: "#ffb700", secondary: "#ff4d00", bg: "#140900" },
  { name: "Forest",   primary: "#00e887", secondary: "#007a5e", bg: "#031410" },
  { name: "Crimson",  primary: "#ff4545", secondary: "#8b0000", bg: "#120404" },
  { name: "Arctic",   primary: "#7df4ff", secondary: "#3b82f6", bg: "#020d1a" },
];

export type Settings = {
  theme:         string;
  customPrimary: string;
  customSecond:  string;
  fontSize:      "sm" | "md" | "lg";
  animations:    boolean;
  compactCards:  boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  theme:         "Aether",
  customPrimary: "#00f0ff",
  customSecond:  "#571bc1",
  fontSize:      "md",
  animations:    true,
  compactCards:  false,
};

export function loadSettings(): Settings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem("concordis_settings");
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) as Partial<Settings> } : DEFAULT_SETTINGS;
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(s: Settings) {
  if (typeof window !== "undefined") localStorage.setItem("concordis_settings", JSON.stringify(s));
}

export function applyTheme(s: Settings) {
  const theme = THEMES.find(t => t.name === s.theme);
  const primary   = s.theme === "Custom" ? s.customPrimary : (theme?.primary   ?? "#00f0ff");
  const secondary = s.theme === "Custom" ? s.customSecond  : (theme?.secondary ?? "#571bc1");
  const bg        = theme?.bg ?? "#051424";
  document.documentElement.style.setProperty("--color-primary",   primary);
  document.documentElement.style.setProperty("--color-secondary", secondary);
  document.documentElement.style.setProperty("--color-bg",        bg);
  document.body.style.backgroundColor = bg;
}
