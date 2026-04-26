import React from 'react';

export const PaperCardSkeleton: React.FC = () => (
  <div className="rounded-2xl p-4 animate-fade-in-up" style={{ background:'rgba(18,33,49,0.4)', border:'1px solid rgba(255,255,255,0.06)' }}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full shrink-0 shimmer" style={{ background:'#1c2b3c' }} />
      <div className="flex-1 flex flex-col gap-2 pt-1">
        <div className="h-3.5 rounded shimmer" style={{ background:'#1c2b3c', width:'85%' }} />
        <div className="h-3 rounded shimmer" style={{ background:'#1c2b3c', width:'55%' }} />
      </div>
    </div>
  </div>
);

export const ConsensusSkeleton: React.FC = () => (
  <div className="glass-panel rounded-xl p-8 animate-fade-in-up">
    <div className="flex gap-2 mb-6 pb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-4 w-4 rounded shimmer" style={{ background:'#1c2b3c' }} />
      <div className="h-4 rounded shimmer" style={{ background:'#1c2b3c', width:'150px' }} />
    </div>
    {[100, 85, 70, 90].map((w, i) => (
      <div key={i} className="h-4 rounded shimmer mb-3" style={{ background:'#1c2b3c', width:`${w}%` }} />
    ))}
    <div className="mt-6 h-16 rounded-lg shimmer" style={{ background:'#1c2b3c' }} />
  </div>
);
