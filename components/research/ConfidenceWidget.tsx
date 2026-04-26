import React from 'react';
import type { EvidenceGrade } from '@/lib/types/research.types';

type Props = { percent: number; level: EvidenceGrade };

const CIRCUMFERENCE = 2 * Math.PI * 40;

export const ConfidenceWidget: React.FC<Props> = ({ percent, level }) => {
  const offset = CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE;
  const color = level === 'High' ? '#34d399' : level === 'Moderate' ? '#00f0ff' : level === 'Low' ? '#fbbf24' : '#ffb4ab';

  return (
    <div className="glass-panel rounded-xl p-6 relative overflow-hidden flex flex-col items-center justify-center gap-4">
      <div className="absolute top-0 right-0 p-4 pointer-events-none" style={{ opacity: 0.06 }}>
        <span className="material-symbols-outlined" style={{ fontSize:'72px' }}>radar</span>
      </div>
      <h3 className="text-xs uppercase tracking-widest text-center" style={{ color:'#b9cacb', fontFamily:'Space Grotesk' }}>Confidence Level</h3>
      <div className="relative w-32 h-32 flex items-center justify-center">
        <svg className="w-full h-full" viewBox="0 0 100 100" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          <circle cx="50" cy="50" r="40" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
            style={{ filter:`drop-shadow(0 0 10px ${color})`, transition:'stroke-dashoffset 1s ease' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-bold" style={{ fontSize:'32px', color:'#00f0ff', fontFamily:'Space Grotesk', lineHeight:1 }}>
            {percent}<span style={{ fontSize:'18px' }}>%</span>
          </span>
        </div>
      </div>
      <div className="w-full">
        <div className="h-2 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,0.06)' }}>
          <div className="h-full rounded-full" style={{
            width: `${percent}%`,
            background: `linear-gradient(to right, ${color}, #571bc1)`,
            boxShadow: `0 0 10px ${color}`,
            transition: 'width 1s ease'
          }} />
        </div>
        <div className="flex justify-between mt-2" style={{ fontSize:'11px', color:'#849495', fontFamily:'Space Grotesk' }}>
          <span>Low</span><span>High</span>
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs font-semibold" style={{ color, fontFamily:'Space Grotesk' }}>{level} Confidence</div>
      </div>
    </div>
  );
};
