import React, { useState } from 'react';
import type { PaperAnalysis } from '@/lib/types/research.types';
import { EvidenceGradeBadge } from './EvidenceGradeBadge';

type Props = { paper: PaperAnalysis; index: number };

const STUDY_ICONS: Record<string, string> = {
  'RCT': 'science', 'Meta-Analysis': 'account_balance',
  'Cohort': 'group', 'Case-Control': 'compare_arrows',
  'Cross-Sectional': 'dataset', 'Case-Report': 'article', 'Expert-Opinion': 'psychology',
};

export const PaperCard: React.FC<Props> = ({ paper, index }) => {
  const [expanded, setExpanded] = useState(false);
  const icon = STUDY_ICONS[paper.studyType] ?? 'article';
  const relevancePct = Math.round(paper.relevanceScore * 100);

  return (
    <article
      className={`transition-all duration-300 rounded-2xl animate-fade-in-up ${expanded ? 'glass-panel card-top-glow' : ''}`}
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both',
        ...(expanded ? {} : { background:'rgba(18,33,49,0.4)', border:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(12px)' }) }}>
      <div className="p-4">
        <div className="flex justify-between items-start gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center border"
              style={{ background: expanded ? 'rgba(0,240,255,0.1)' : 'rgba(87,27,193,0.2)', borderColor: expanded ? 'rgba(0,240,255,0.3)' : 'rgba(208,188,255,0.2)' }}>
              <span className="material-symbols-outlined" style={{ fontSize:'20px', color: expanded ? '#00f0ff' : '#d0bcff' }}>{icon}</span>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <h4 className="font-medium text-sm leading-snug" style={{ color:'#d4e4fa', fontFamily:'Inter' }}>{paper.title}</h4>
              <div className="text-xs" style={{ color:'#849495' }}>{paper.year} · {paper.studyType} · {paper.journal}</div>
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all hover:bg-white/10" style={{ color:'#849495' }}>
            <span className="material-symbols-outlined" style={{ fontSize:'18px' }}>{expanded ? 'expand_less' : 'expand_more'}</span>
          </button>
        </div>

        {expanded && (
          <div className="mt-4 flex flex-col gap-3 animate-fade-in-up">
            <p className="text-xs leading-relaxed" style={{ color:'#b9cacb' }}>{paper.primaryClaim}</p>

            <div className="flex flex-wrap items-center gap-3">
              <EvidenceGradeBadge grade={paper.grade} size="sm" />
              {paper.sampleSize && (
                <span className="text-xs" style={{ color:'#849495' }}>n={paper.sampleSize.toLocaleString()}</span>
              )}
              {paper.effectSize && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background:'rgba(255,255,255,0.05)', color:'#7df4ff', fontFamily:'monospace' }}>{paper.effectSize}</span>
              )}
              <span className="text-xs" style={{ color:'#849495' }}>Relevance: {relevancePct}%</span>
              {paper.conflictOfInterest && (
                <span className="text-xs flex items-center gap-1" style={{ color:'#fbbf24' }}>
                  <span className="material-symbols-outlined" style={{ fontSize:'13px' }}>warning</span> COI flagged
                </span>
              )}
            </div>

            {paper.limitations.length > 0 && (
              <div>
                <div className="text-xs mb-1 font-semibold" style={{ color:'#849495', fontFamily:'Space Grotesk', letterSpacing:'0.06em', textTransform:'uppercase' }}>Limitations</div>
                <ul className="flex flex-col gap-0.5">
                  {paper.limitations.map((l, i) => (
                    <li key={i} className="text-xs flex items-start gap-1.5" style={{ color:'#b9cacb' }}>
                      <span className="shrink-0 mt-0.5" style={{ color:'#849495' }}>·</span>{l}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs rounded-lg px-3 py-2" style={{ background:'rgba(1,15,31,0.6)', border:'1px solid rgba(255,255,255,0.05)' }}>
              <span className="font-semibold" style={{ color:'#849495', fontFamily:'Space Grotesk' }}>GRADE Rationale: </span>
              <span style={{ color:'#b9cacb' }}>{paper.gradeRationale}</span>
            </div>

            {paper.doi && paper.doi !== 'N/A' && (
              <a href={`https://doi.org/${paper.doi}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs hover:underline w-fit" style={{ color:'#00f0ff' }}>
                <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>open_in_new</span>
                View DOI
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
