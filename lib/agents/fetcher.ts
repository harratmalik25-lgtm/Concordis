import type { PaperAnalysis } from "../types/research.types";

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const SS_BASE     = "https://api.semanticscholar.org/graph/v1";
const TOOL_PARAM  = `tool=concordis&email=${process.env.PUBMED_EMAIL ?? "app@concordis.ai"}`;
const DELAY_MS    = 350;

export type RawPaper = {
  pmid:     string;
  title:    string;
  abstract: string;
  year:     number;
  journal:  string;
  doi:      string;
};

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

/**
 * Fetches top papers from PubMed for the given search terms.
 * Falls back to Semantic Scholar if PubMed returns 0 results.
 * @param terms  Array of MeSH / keyword search terms
 * @returns      Array of raw paper metadata with abstracts
 */
export async function fetchPapers(terms: string[]): Promise<RawPaper[]> {
  const q = terms.slice(0, 5).join(" ");
  const papers = await fetchPubMed(q);
  if (papers.length > 0) return papers;
  return fetchSemanticScholar(q);
}

async function fetchPubMed(query: string): Promise<RawPaper[]> {
  const searchUrl = `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmax=8&retmode=json&sort=relevance&term=${encodeURIComponent(query)}&${TOOL_PARAM}`;
  const searchRes = await fetch(searchUrl, { next: { revalidate: 0 } });
  if (!searchRes.ok) return [];

  const sd = await searchRes.json() as { esearchresult: { idlist: string[] } };
  const ids = sd.esearchresult?.idlist ?? [];
  if (!ids.length) return [];

  await delay(DELAY_MS);

  const summaryUrl = `${PUBMED_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}&${TOOL_PARAM}`;
  const summaryRes = await fetch(summaryUrl, { next: { revalidate: 0 } });
  if (!summaryRes.ok) return [];

  const sum = await summaryRes.json() as {
    result: Record<string, { title: string; pubdate: string; fulljournalname: string; elocationid: string }>
  };

  const papers: RawPaper[] = ids.map(id => {
    const doc  = sum.result[id];
    const year = doc?.pubdate?.match(/\d{4}/)?.[0];
    return {
      pmid:     id,
      title:    doc?.title    ?? "",
      abstract: "",
      year:     year ? parseInt(year, 10) : new Date().getFullYear(),
      journal:  doc?.fulljournalname ?? "Unknown Journal",
      doi:      doc?.elocationid?.replace("doi: ", "") ?? "N/A",
    };
  }).filter(p => p.title.length > 5);

  await delay(DELAY_MS);

  const fetchUrl = `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.join(",")}&rettype=abstract&retmode=xml&${TOOL_PARAM}`;
  const fetchRes = await fetch(fetchUrl, { next: { revalidate: 0 } });
  if (fetchRes.ok) {
    const xml       = await fetchRes.text();
    const abstracts = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)];
    papers.forEach((p, i) => {
      p.abstract = abstracts[i]?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";
    });
  }

  return papers;
}

async function fetchSemanticScholar(query: string): Promise<RawPaper[]> {
  const fields = "title,abstract,year,citationCount,journal,externalIds";
  const url    = `${SS_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=8&fields=${fields}`;
  const res    = await fetch(url, { next: { revalidate: 0 } });
  if (!res.ok) return [];

  const data = await res.json() as {
    data: Array<{
      paperId:      string;
      title:        string;
      abstract:     string | null;
      year:         number | null;
      journal:      { name: string } | null;
      externalIds:  { DOI?: string } | null;
    }>
  };

  return (data.data ?? []).map(p => ({
    pmid:     p.paperId,
    title:    p.title    ?? "",
    abstract: p.abstract ?? "",
    year:     p.year     ?? new Date().getFullYear(),
    journal:  p.journal?.name ?? "Unknown Journal",
    doi:      p.externalIds?.DOI ?? "N/A",
  })).filter(p => p.title.length > 5);
}
