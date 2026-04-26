# Concordis — Scientific Evidence Engine

Multi-agent evidence synthesis: Nemotron orchestrates, Gemma analyzes, PubMed supplies papers.

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Add your keys
cp .env.local.example .env.local
# Edit .env.local — add OPENROUTER_API_KEY and PUBMED_EMAIL

# 3. Run
pnpm dev
# → http://localhost:3000
```

## Stack
| Role | Model |
|---|---|
| Orchestrator | `nvidia/nemotron-3-super-120b-a12b:free` via OpenRouter |
| Analyzer | `google/gemma-4-31b-it:free` via OpenRouter |
| Papers | PubMed E-utilities + Semantic Scholar (both free, no key) |

## Get Keys
- **OpenRouter** (free): https://openrouter.ai/keys
- **PubMed email**: any email — required by NCBI policy, not verified
