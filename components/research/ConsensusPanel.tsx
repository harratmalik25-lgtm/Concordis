import React, { useState } from 'react';
import type { ConsensusAnswer } from '@/lib/types/research.types';
import { EvidenceGradeBadge } from '@/components/research/EvidenceGradeBadge';

type Props = { consensus: ConsensusAnswer };

export const ConsensusPanel: React.FC<Props> = ({ consensus }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${consensus.consensusStatement}\n\nRecommendation: ${consensus.practicalRecommendation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const topics = consensus.searchTermsUsed.slice(0, 3);

  return (
    <section className="glass-panel rounded-xl p-8 relative overflow-hidden animate-fade-in-up" style={{ transition:'transform 0.3s' }}>
      <div className="absolute top-0 left-0 w-full h-1" style={{ background:'linear-gradient(to right,#00f0ff,#571bc1,transparent)', opacity:0.5 }} />

      <div className="flex items-center justify-between mb-6 pb-4" style={{ borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-semibold" style={{ color:'#00f0ff', fontFamily:'Space Grotesk' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'18px', fontVariationSettings:"'FILL' 1" }}>check_circle</span>
          Synthesis Complete
        </div>
        <div className="flex gap-2">
          <button onClick={handleCopy} className="transition-colors" style={{ color: copied ? '#34d399' : '#849495' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'20px' }}>{copied ? 'check' : 'content_copy'}</span>
          </button>
          <button className="transition-colors hover:text-cyan-400" style={{ color:'#849495' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'20px' }}>bookmark</span>
          </button>
        </div>
      </div>

      <p className="text-lg leading-relaxed mb-6" style={{ color:'#d4e4fa', fontFamily:'Inter' }}>{consensus.consensusStatement}</p>

      <div className="mb-6 flex flex-wrap gap-3 items-center">
        <EvidenceGradeBadge grade={consensus.confidenceLevel} />
        {consensus.dissent && (
          <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background:'rgba(251,191,36,0.1)', border:'1px solid rgba(251,191,36,0.3)', color:'#fbbf24', fontFamily:'Space Grotesk' }}>
            ⚠ Contested findings
          </span>
        )}
      </div>

      {consensus.keyFindings.length > 0 && (
        <div className="mb-6">
          <div className="text-xs uppercase tracking-widest mb-3 font-semibold" style={{ color:'#849495', fontFamily:'Space Grotesk' }}>Key Findings</div>
          <ul className="flex flex-col gap-2">
            {consensus.keyFindings.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-sm" style={{ color:'#b9cacb', fontFamily:'Inter' }}>
                <span className="shrink-0 mt-0.5" style={{ color:'#00f0ff' }}>▸</span>{f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {consensus.dissent && (
        <div className="mb-6 p-4 rounded-lg" style={{ background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.25)', borderLeft:'3px solid #fbbf24' }}>
          <div className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color:'#fbbf24', fontFamily:'Space Grotesk' }}>Dissenting View</div>
          <p className="text-sm" style={{ color:'#b9cacb', fontFamily:'Inter' }}>{consensus.dissent}</p>
        </div>
      )}

      <div className="p-4 rounded-r-lg" style={{ background:'rgba(1,15,31,0.6)', borderLeft:'2px solid #00f0ff', borderRadius:'0 8px 8px 0' }}>
        <strong className="text-sm font-semibold" style={{ color:'#d4e4fa', fontFamily:'Space Grotesk' }}>Recommendation: </strong>
        <span className="text-sm" style={{ color:'#b9cacb', fontFamily:'Inter' }}>{consensus.practicalRecommendation}</span>
      </div>

      <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {topics.map(t => (
            <span key={t} className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs" style={{ background:'rgba(44,58,76,0.5)', border:'1px solid rgba(255,255,255,0.08)', color:'#b9cacb', fontFamily:'Space Grotesk' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'12px' }}>tag</span>{t}
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          {['thumb_up','share'].map(icon => (
            <button key={icon} className="p-2 rounded-lg transition-colors hover:bg-white/10" style={{ background:'rgba(39,54,71,0.8)', color:'#b9cacb' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>{icon}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
