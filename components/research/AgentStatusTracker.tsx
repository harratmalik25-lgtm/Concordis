import React from 'react';
import type { AgentStep } from '@/lib/types/research.types';

type Props = {
  step: AgentStep;
  papersTotal: number;
  papersAnalyzed: number;
  elapsedSeconds: number;
};

const STEPS: { key: AgentStep; label: string }[] = [
  { key: 'orchestrating', label: 'Orchestrating' },
  { key: 'fetching',      label: 'Fetching Papers' },
  { key: 'analyzing',     label: 'Analyzing' },
  { key: 'synthesizing',  label: 'Synthesizing' },
];

export const AgentStatusTracker: React.FC<Props> = ({ step, papersTotal, papersAnalyzed, elapsedSeconds }) => {

  const stepOrder = ['orchestrating','fetching','analyzing','synthesizing','complete'];
  const currentIdx = stepOrder.indexOf(step);

  return (
    <div className="glass-panel rounded-xl p-4 flex items-center gap-3">
      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse-dot" style={{ background: step === 'complete' ? '#34d399' : '#00f0ff', boxShadow: `0 0 8px ${step === 'complete' ? '#34d399' : '#00f0ff'}` }} />
      <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap flex-1" style={{ fontSize: '11px', letterSpacing: '0.08em', fontFamily: 'Space Grotesk', textTransform: 'uppercase' }}>
        {STEPS.map((s, i) => {
          const idx = stepOrder.indexOf(s.key);
          const isActive = step === s.key;
          const isDone = currentIdx > idx;
          return (
            <React.Fragment key={s.key}>
              {i > 0 && <span style={{ color: '#3b494b' }}>→</span>}
              <span style={{ color: isActive ? '#00f0ff' : isDone ? '#34d399' : '#849495', opacity: isActive || isDone ? 1 : 0.5 }}>
                {s.key === 'analyzing' && step === 'analyzing' ? `Analyzing ${papersAnalyzed}/${papersTotal}` : s.label}
              </span>
            </React.Fragment>
          );
        })}
      </div>
      <span className="shrink-0 text-xs" style={{ color: '#849495', fontFamily: 'Space Grotesk' }}>{elapsedSeconds}s</span>
    </div>
  );
};
