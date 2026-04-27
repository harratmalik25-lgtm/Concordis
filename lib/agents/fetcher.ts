export type RawPaper = {
  pmid:      string;
  title:     string;
  abstract:  string;
  year:      number;
  journal:   string;
  doi:       string;
  citations?: number;
  fullText?: string;
};

const PUBMED_BASE = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
const OA_BASE     = "https://api.openalex.org/works";
const WIKI_BASE   = "https://en.wikipedia.org/api/rest_v1/page/summary";
const UNPAYWALL   = "https://api.unpaywall.org/v2";
const TOOL_PARAM  = `tool=concordis&email=${process.env.PUBMED_EMAIL ?? "app@concordis.ai"}`;
const DELAY_MS    = 400;

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function invertedIndexToText(index: Record<string, number[]> | null): string {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const pos of positions) words[pos] = word;
  }
  return words.filter(Boolean).join(" ");
}

function extractKeywords(text: string): string[] {
  const stopwords = new Set([
    "does","what","are","how","why","when","should","the","evidence","for",
    "on","about","backed","by","rcts","rct","trial","study","studies","effect",
    "effects","reduce","reducing","and","with","from","that","this","have","has",
    "been","are","was","were","not","but","its","their","review","systematic",
    "meta","analysis","clinical","randomized","controlled","quality","sleep",
    "night","before","bed","timing","efficacy","outcomes","management","treatment",
  ]);
  return text.toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
}

function isTitleRelevant(paper: RawPaper, coreKeywords: string[]): boolean {
  if (coreKeywords.length === 0) return true;
  const title = paper.title.toLowerCase();
  return coreKeywords.some(k => title.includes(k));
}

export async function fetchWikiContext(query: string): Promise<string> {
  try {
    const topic = query
      .replace(/does|is|what|are|how|why|when|should|the|evidence|for|on|about|backed|by|rcts?|i|me|my/gi, "")
      .trim().split(" ").filter((w: string) => w.length > 2).slice(0, 3).join(" ");
    const res = await fetch(`${WIKI_BASE}/${encodeURIComponent(topic)}`,
      { headers: { "User-Agent": "Concordis/1.0 (app@concordis.ai)" } });
    if (!res.ok) return "";
    const data = await res.json() as { extract?: string; title?: string };
    return data.extract ? `Wikipedia background on "${data.title}":\n${data.extract.slice(0, 600)}` : "";
  } catch { return ""; }
}

async function fetchFullText(doi: string): Promise<string | undefined> {
  if (!doi || doi === "N/A") return undefined;
  try {
    const email = process.env.PUBMED_EMAIL ?? "app@concordis.ai";
    const res = await fetch(`${UNPAYWALL}/${encodeURIComponent(doi)}?email=${email}`,
      { headers: { "User-Agent": "Concordis/1.0" } });
    if (!res.ok) return undefined;
    const data = await res.json() as { is_oa: boolean; best_oa_location?: { url_for_pdf?: string | null } };
    if (!data.is_oa || !data.best_oa_location?.url_for_pdf) return undefined;
    const pdfRes = await fetch(data.best_oa_location.url_for_pdf, { headers: { "User-Agent": "Concordis/1.0" } });
    if (!pdfRes.ok) return undefined;
    const text = await pdfRes.text();
    const readable = text.replace(/[^\x20-\x7E\n]/g, " ").replace(/\s+/g, " ").trim();
    return readable.length > 200 ? readable.slice(0, 3000) : undefined;
  } catch { return undefined; }
}

async function searchOpenAlex(searchTerm: string, limit = 5): Promise<RawPaper[]> {
  try {
    const email = process.env.PUBMED_EMAIL ?? "app@concordis.ai";
    const url = `${OA_BASE}?search=${encodeURIComponent(searchTerm)}&filter=has_abstract:true,type:article&sort=cited_by_count:desc&per-page=${limit}&select=id,title,abstract_inverted_index,publication_year,primary_location,doi,cited_by_count&mailto=${email}`;
    const res = await fetch(url, { headers: { "User-Agent": "Concordis/1.0" } });
    if (!res.ok) return [];
    const data = await res.json() as {
      results: Array<{
        id: string; title: string;
        abstract_inverted_index: Record<string, number[]> | null;
        publication_year: number | null;
        primary_location: { source?: { display_name?: string } } | null;
        doi: string | null; cited_by_count: number;
      }>
    };
    return (data.results ?? []).map(w => ({
      pmid: w.id, title: w.title ?? "",
      abstract: invertedIndexToText(w.abstract_inverted_index),
      year: w.publication_year ?? new Date().getFullYear(),
      journal: w.primary_location?.source?.display_name ?? "Unknown Journal",
      doi: w.doi?.replace("https://doi.org/", "") ?? "N/A",
      citations: w.cited_by_count,
    })).filter(p => p.title.length > 5 && p.abstract.length > 30);
  } catch { return []; }
}

async function searchPubMed(searchTerm: string, limit = 5): Promise<RawPaper[]> {
  try {
    const searchRes = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmax=${limit}&retmode=json&sort=relevance&term=${encodeURIComponent(searchTerm)}&${TOOL_PARAM}`
    );
    if (!searchRes.ok) return [];
    const sd = await searchRes.json() as { esearchresult: { idlist: string[] } };
    const ids = sd.esearchresult?.idlist ?? [];
    if (!ids.length) return [];
    await delay(DELAY_MS);
    const summaryRes = await fetch(
      `${PUBMED_BASE}/esummary.fcgi?db=pubmed&retmode=json&id=${ids.join(",")}&${TOOL_PARAM}`
    );
    if (!summaryRes.ok) return [];
    const sum = await summaryRes.json() as {
      result: Record<string, { title: string; pubdate: string; fulljournalname: string; elocationid: string }>
    };
    const papers: RawPaper[] = ids.map(id => {
      const doc = sum.result[id];
      const year = doc?.pubdate?.match(/\d{4}/)?.[0];
      return {
        pmid: id, title: doc?.title ?? "", abstract: "",
        year: year ? parseInt(year, 10) : new Date().getFullYear(),
        journal: doc?.fulljournalname ?? "Unknown Journal",
        doi: doc?.elocationid?.replace("doi: ", "") ?? "N/A",
      };
    }).filter(p => p.title.length > 5);
    if (!papers.length) return [];
    await delay(DELAY_MS);
    const fetchRes = await fetch(
      `${PUBMED_BASE}/efetch.fcgi?db=pubmed&id=${ids.slice(0,8).join(",")}&rettype=abstract&retmode=xml&${TOOL_PARAM}`
    );
    if (fetchRes.ok) {
      const xml = await fetchRes.text();
      const abstracts = [...xml.matchAll(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g)];
      papers.forEach((p, i) => { p.abstract = abstracts[i]?.[1]?.replace(/<[^>]+>/g, "").trim() ?? ""; });
    }
    return papers.filter(p => p.abstract.length > 20);
  } catch { return []; }
}

function deduplicate(papers: RawPaper[]): RawPaper[] {
  const seen = new Set<string>();
  return papers.filter(p => {
    const key = p.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function fetchPapers(query: string, meshTerms: string[] = []): Promise<RawPaper[]> {
  const coreKeywords = extractKeywords(query);
  const searchTerms = [query, ...meshTerms.slice(0, 4)];

  const allResults = await Promise.all(
    searchTerms.flatMap(term => [searchOpenAlex(term, 5), searchPubMed(term, 5)])
  );

  const all = deduplicate(allResults.flat());
  const relevant = all.filter(p => isTitleRelevant(p, coreKeywords));
  const candidates = relevant.length >= 3 ? relevant : all;

  return candidates
    .sort((a, b) => (b.citations ?? 0) - (a.citations ?? 0))
    .slice(0, 8);
}
