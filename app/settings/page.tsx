"use client";
import { useEffect, useState } from "react";
import { TopNav }  from "@/components/layout/TopNav";
import { SideNav } from "@/components/layout/SideNav";
import { THEMES, loadSettings, saveSettings, applyTheme, DEFAULT_SETTINGS, type Settings } from "@/lib/settings";

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    const s = loadSettings();
    setSettings(s);
    applyTheme(s);
  }, []);

  const update = (patch: Partial<Settings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    applyTheme(next);
  };

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="glass-panel rounded-xl p-6 flex flex-col gap-5">
      <h2 className="text-xs uppercase tracking-widest font-semibold" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <div className="min-h-screen" style={{ background:"var(--color-bg,#051424)" }}>
      <div className="blob-bg"><div className="blob blob-1"/><div className="blob blob-2"/></div>
      <TopNav/>
      <SideNav/>
      <main className="md:pl-64 mt-16 min-h-screen px-6 py-8 max-w-[800px] mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily:"Space Grotesk", color:"#d4e4fa" }}>Settings</h1>
            <p className="text-sm" style={{ color:"#849495", fontFamily:"Inter" }}>Customize your Concordis experience.</p>
          </div>
          <button onClick={handleSave}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all hover:brightness-110 active:scale-95 neon-glow"
            style={{ background:"var(--color-primary,#00f0ff)", color:"#002022", fontFamily:"Space Grotesk" }}>
            {saved ? "✓ Saved" : "Save Changes"}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Color Themes */}
          <Section title="Color Theme">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {THEMES.map(t => (
                <button key={t.name} onClick={() => update({ theme: t.name })}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={{
                    border:     `2px solid ${settings.theme === t.name ? t.primary : "rgba(255,255,255,0.08)"}`,
                    background: settings.theme === t.name ? `${t.primary}15` : "rgba(18,33,49,0.4)",
                  }}>
                  <div className="w-8 h-8 rounded-full" style={{ background:`linear-gradient(135deg,${t.primary},${t.secondary})`, boxShadow:`0 0 12px ${t.primary}66` }}/>
                  <span className="text-xs" style={{ color: settings.theme === t.name ? t.primary : "#849495", fontFamily:"Space Grotesk" }}>{t.name}</span>
                </button>
              ))}
              {/* Custom */}
              <button onClick={() => update({ theme: "Custom" })}
                className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                style={{ border:`2px solid ${settings.theme === "Custom" ? "var(--color-primary,#00f0ff)" : "rgba(255,255,255,0.08)"}`, background:"rgba(18,33,49,0.4)" }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ border:"2px dashed #849495" }}>
                  <span className="material-symbols-outlined" style={{ fontSize:"16px", color:"#849495" }}>palette</span>
                </div>
                <span className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Custom</span>
              </button>
            </div>

            {settings.theme === "Custom" && (
              <div className="flex gap-4 mt-2">
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={settings.customPrimary} onChange={e => update({ customPrimary: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer" style={{ border:"1px solid #3b494b", background:"none" }}/>
                    <input value={settings.customPrimary} onChange={e => update({ customPrimary: e.target.value })}
                      className="flex-1 py-2 px-3 rounded-lg text-sm focus:outline-none"
                      style={{ background:"#0d1c2d", border:"1px solid #3b494b", color:"#d4e4fa", fontFamily:"monospace" }}/>
                  </div>
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <label className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={settings.customSecond} onChange={e => update({ customSecond: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer" style={{ border:"1px solid #3b494b", background:"none" }}/>
                    <input value={settings.customSecond} onChange={e => update({ customSecond: e.target.value })}
                      className="flex-1 py-2 px-3 rounded-lg text-sm focus:outline-none"
                      style={{ background:"#0d1c2d", border:"1px solid #3b494b", color:"#d4e4fa", fontFamily:"monospace" }}/>
                  </div>
                </div>
              </div>
            )}
          </Section>

          {/* Display */}
          <Section title="Display">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>Animations</div>
                  <div className="text-xs" style={{ color:"#849495" }}>Fade-in and transition effects</div>
                </div>
                <button onClick={() => update({ animations: !settings.animations })}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: settings.animations ? "var(--color-primary,#00f0ff)" : "#3b494b" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: settings.animations ? "calc(100% - 20px)" : "4px" }}/>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>Compact Paper Cards</div>
                  <div className="text-xs" style={{ color:"#849495" }}>Reduce padding on evidence cards</div>
                </div>
                <button onClick={() => update({ compactCards: !settings.compactCards })}
                  className="w-12 h-6 rounded-full transition-all relative"
                  style={{ background: settings.compactCards ? "var(--color-primary,#00f0ff)" : "#3b494b" }}>
                  <div className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all"
                    style={{ left: settings.compactCards ? "calc(100% - 20px)" : "4px" }}/>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium" style={{ color:"#d4e4fa", fontFamily:"Inter" }}>Font Size</div>
                  <div className="text-xs" style={{ color:"#849495" }}>Base text size across the app</div>
                </div>
                <div className="flex gap-2">
                  {(["sm","md","lg"] as const).map(size => (
                    <button key={size} onClick={() => update({ fontSize: size })}
                      className="w-10 h-8 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: settings.fontSize === size ? "var(--color-primary,#00f0ff)" : "rgba(18,33,49,0.6)",
                        color:      settings.fontSize === size ? "#002022" : "#849495",
                        border:     `1px solid ${settings.fontSize === size ? "var(--color-primary,#00f0ff)" : "#3b494b"}`,
                        fontFamily: "Space Grotesk",
                      }}>{size.toUpperCase()}</button>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          {/* About */}
          <Section title="About">
            <div className="flex flex-col gap-2">
              {[
                ["Orchestrator", "nvidia/nemotron-3-super-120b-a12b:free"],
                ["Analyzer",     "google/gemma-3-27b-it:free"],
                ["Papers",       "PubMed E-utilities + Semantic Scholar"],
                ["Version",      "1.0.0"],
              ].map(([k,v]) => (
                <div key={k} className="flex justify-between py-2" style={{ borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                  <span className="text-xs" style={{ color:"#849495", fontFamily:"Space Grotesk" }}>{k}</span>
                  <span className="text-xs" style={{ color:"#d4e4fa", fontFamily:"monospace" }}>{v}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
