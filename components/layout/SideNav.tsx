import React from 'react';

type SideNavProps = {
  activeItem?: string;
  onNewQuery?: () => void;
};

const navItems = [
  { icon: 'analytics',    label: 'Workspace' },
  { icon: 'history',      label: 'History' },
  { icon: 'verified',     label: 'Verified Sources' },
  { icon: 'query_stats',  label: 'Analytics' },
];

export const SideNav: React.FC<SideNavProps> = ({ activeItem = 'Workspace', onNewQuery }) => (
  <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] z-40 w-64 py-6 hidden md:flex flex-col"
    style={{ background:'rgba(5,20,36,0.7)', backdropFilter:'blur(24px)', borderRight:'1px solid rgba(255,255,255,0.08)' }}>
    <div className="px-6 mb-8 flex items-center gap-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center border border-white/10" style={{background:'#1c2b3c'}}>
        <span className="material-symbols-outlined text-slate-400" style={{fontSize:'20px'}}>person</span>
      </div>
      <div>
        <div className="text-cyan-400 text-sm font-semibold" style={{fontFamily:'Space Grotesk'}}>Nexus-7</div>
        <div className="text-xs" style={{color:'#b9cacb'}}>Pro Researcher</div>
      </div>
    </div>
    <div className="px-4 mb-6">
      <button onClick={onNewQuery} className="w-full py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold neon-glow transition-all hover:brightness-110 active:scale-95"
        style={{background:'linear-gradient(to right,#00f0ff,#571bc1)',color:'#002022',fontFamily:'Space Grotesk',letterSpacing:'0.04em'}}>
        <span className="material-symbols-outlined" style={{fontSize:'18px'}}>add</span> New Exploration
      </button>
    </div>
    <nav className="flex-1 flex flex-col gap-1 px-2">
      {navItems.map(item => (
        <a key={item.label} className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all cursor-pointer rounded-l-lg ${
          activeItem === item.label
            ? 'text-cyan-400 bg-cyan-500/10 border-r-4 border-cyan-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
        }`} style={{fontFamily:'Space Grotesk'}}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>{item.icon}</span>
          {item.label}
        </a>
      ))}
    </nav>
    <div className="px-2 pt-4" style={{borderTop:'1px solid rgba(255,255,255,0.08)'}}>
      {['help','logout'].map(icon => (
        <a key={icon} className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-all cursor-pointer rounded-lg" style={{fontFamily:'Space Grotesk'}}>
          <span className="material-symbols-outlined" style={{fontSize:'20px'}}>{icon}</span>
          {icon.charAt(0).toUpperCase() + icon.slice(1)}
        </a>
      ))}
    </div>
  </aside>
);
