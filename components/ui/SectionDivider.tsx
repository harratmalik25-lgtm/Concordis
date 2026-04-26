import React from 'react';

type Props = { label: string };

export const SectionDivider: React.FC<Props> = ({ label }) => (
  <div className="flex items-center gap-4 px-2 py-1">
    <div className="h-px flex-1" style={{ background:'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)' }} />
    <h3 className="text-xs uppercase tracking-widest whitespace-nowrap" style={{ color:'#849495', fontFamily:'Space Grotesk' }}>{label}</h3>
    <div className="h-px flex-1" style={{ background:'linear-gradient(to right,transparent,rgba(255,255,255,0.08),transparent)' }} />
  </div>
);
