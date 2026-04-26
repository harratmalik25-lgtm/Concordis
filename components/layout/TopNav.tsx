import React from 'react';

type TopNavProps = {
  onNavClick?: (tab: string) => void;
  activeTab?: string;
};

export const TopNav: React.FC<TopNavProps> = ({ activeTab = 'Research' }) => {
  const links = ['Research', 'Library', 'Models', 'Settings'];
  return (
    <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-8 h-16"
      style={{ background:'rgba(5,20,36,0.7)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
      <div className="text-2xl font-bold tracking-tighter text-cyan-400 neon-text-glow" style={{fontFamily:'Space Grotesk'}}>Concordis</div>
      <nav className="hidden md:flex gap-8">
        {links.map(l => (
          <a key={l} className={`text-sm uppercase tracking-widest pb-1 transition-all duration-200 cursor-pointer ${
            activeTab === l
              ? 'text-cyan-400 border-b-2 border-cyan-400'
              : 'text-slate-400 hover:text-slate-200'
          }`} style={{fontFamily:'Space Grotesk'}}>{l}</a>
        ))}
      </nav>
      <div className="flex gap-3 text-cyan-400">
        <button className="hover:bg-white/5 p-2 rounded-full transition-all">
          <span className="material-symbols-outlined" style={{fontSize:'22px'}}>notifications</span>
        </button>
        <button className="hover:bg-white/5 p-2 rounded-full transition-all">
          <span className="material-symbols-outlined" style={{fontSize:'22px'}}>account_circle</span>
        </button>
      </div>
    </header>
  );
};
