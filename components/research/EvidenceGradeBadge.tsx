import React from 'react';
import type { EvidenceGrade } from '@/lib/types/research.types';

const gradeConfig: Record<EvidenceGrade, { bg: string; border: string; text: string; dot: string; label: string }> = {
  'High':     { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.4)',  text: '#34d399', dot: '#34d399', label: 'High Evidence' },
  'Moderate': { bg: 'rgba(0,240,255,0.12)',  border: 'rgba(0,240,255,0.3)',   text: '#00f0ff', dot: '#00f0ff', label: 'Moderate Evidence' },
  'Low':      { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.4)',  text: '#fbbf24', dot: '#fbbf24', label: 'Low Evidence' },
  'Very Low': { bg: 'rgba(255,180,171,0.15)',border: 'rgba(255,180,171,0.35)',text: '#ffb4ab', dot: '#ffb4ab', label: 'Very Low Evidence' },
};

type Props = {
  grade: EvidenceGrade;
  showLabel?: boolean;
  size?: 'sm' | 'md';
};

export const EvidenceGradeBadge: React.FC<Props> = ({ grade, showLabel = true, size = 'md' }) => {
  const cfg = gradeConfig[grade];
  const px = size === 'sm' ? '10px' : '14px';
  const py = size === 'sm' ? '3px' : '6px';
  const fs = size === 'sm' ? '11px' : '13px';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full font-semibold"
      style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.text, padding: `${py} ${px}`, fontSize: fs, letterSpacing: '0.04em', fontFamily: 'Space Grotesk' }}>
      <span className="rounded-full shrink-0" style={{ width: size === 'sm' ? '6px' : '8px', height: size === 'sm' ? '6px' : '8px', background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }} />
      {showLabel ? cfg.label : grade}
    </span>
  );
};
