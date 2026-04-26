import React, { useState, useRef, useEffect } from 'react';

const EXAMPLES = [
  "Should I take magnesium at night?",
  "Does sauna use reduce cardiovascular risk?",
  "Is time-restricted eating backed by RCTs?",
  "What does evidence say about cold exposure and testosterone?",
  "When is the optimal time to apply tretinoin?",
];

type Props = {
  onSubmit: (query: string) => void;
  isLoading?: boolean;
  initialValue?: string;
};

export const SearchBar: React.FC<Props> = ({ onSubmit, isLoading = false, initialValue = '' }) => {
  const [query, setQuery] = useState(initialValue);
  const [placeholder, setPlaceholder] = useState(EXAMPLES[0]!);
  const inputRef = useRef<HTMLInputElement>(null);
  const exIdx = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      exIdx.current = (exIdx.current + 1) % EXAMPLES.length;
      setPlaceholder(EXAMPLES[exIdx.current]!);
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    const trimmed = query.trim();
    if (trimmed && !isLoading) onSubmit(trimmed);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <div className="relative w-full group">
      <div className="absolute -inset-0.5 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500"
        style={{ background:'linear-gradient(to right, transparent, rgba(0,240,255,0.2), transparent)' }} />
      <div className="relative flex items-center rounded-xl overflow-hidden shadow-lg transition-all duration-300"
        style={{ background:'#0d1c2d', border:'1px solid rgba(59,73,75,0.6)' }}
        onFocus={() => {}} onBlur={() => {}}>
        <div className="pl-5 pr-2" style={{ color:'#00f0ff' }}>
          <span className="material-symbols-outlined" style={{ fontSize:'26px', fontVariationSettings:"'wght' 300" }}>
            {isLoading ? 'hourglass_top' : 'search'}
          </span>
        </div>
        <input
          ref={inputRef}
          className="w-full bg-transparent border-none focus:ring-0 focus:outline-none py-5 px-2 text-lg"
          style={{ color:'#d4e4fa', fontFamily:'Inter', caretColor:'#00f0ff' }}
          placeholder={placeholder}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKey}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading}
          className="mr-3 px-5 py-3 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background:'#00f0ff', color:'#006970', fontFamily:'Space Grotesk', letterSpacing:'0.05em' }}>
          {isLoading ? (
            <>
              <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" />
              Analyzing
            </>
          ) : (
            <>Analyze <span className="material-symbols-outlined" style={{ fontSize:'14px' }}>send</span></>
          )}
        </button>
      </div>
    </div>
  );
};
