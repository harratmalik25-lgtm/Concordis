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
const WIKI_BASE   = "https://en.wikipedia.org/api/rest_v1/page/summary";
const TOOL_PARAM  = `tool=concordis&email=${process.env.PUBMED_EMAIL ?? "app@concordis.ai"}`;
const DELAY_MS    = 400;

const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

function topicWords(query: string): string[] {
  const noise = new Set([
    "does","what","are","how","why","when","should","the","evidence","for","on",
    "about","backed","by","rct","rcts","trial","study","studies","effect","effects",
    "reduce","reducing","and","with","from","that","this","have","has","been","was",
    "were","not","but","its","their","review","analysis","clinical","randomized",
    "controlled","outcomes","management","treatment","night","before","bed","timing",
    "efficacy","take","taking","use","using","can","could","would","into","any",
  ]);
  return query.toLowerCase()
    .replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(w => w.length > 2 && !noise.has(w));
}

function titleMatches(title: string, keywords: string[]): boolean {
  if (!keywords.length) return true;
  const t = title.toLowerCase();
  return keywords.some(k => t.includes(k));
}

export async function fetchWikiContext(query: string): Promise<string> {
  try {
    const topic = topicWords(query).slice(0, 3).join(" ");
    if (!topic) return "";
    const res = await fetch(`${WIKI_BASE}/${encodeURIComponent(topic)}`,
      { headers: { "User-Agent": "Concordis/1.0 (app@concordis.ai)" } });
    if (!res.ok) return "";
    const data = await res.json() as { extract?: string; title?: string };
    return data.extract ? `Wikipedia on "${data.title}":\n${data.extract.slice(0, 500)}` : "";
  } catch { return ""; }
}

async function searchPubMed(query: string, limit = 6): Promise<RawPaper[]> {
  try {
    const searchRes = await fetch(
      `${PUBMED_BASE}/esearch.fcgi?db=pubmed&retmax=${limit}&retmode=json&sort=relevance&term=${encodeURIComponent(query)}&${TOOL_PARAM}`
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
  const keywords = topicWords(query);
  const queries = [query, ...meshTerms.slice(0, 4)];

  const allResults = await Promise.all(queries.map(q => searchPubMed(q, 6)));
  const all = deduplicate(allResults.flat());

  const filtered = all.filter(p => titleMatches(p.title, keywords));
  const candidates = filtered.length >= 2 ? filtered : all;

  return candidates
    .sort((a, b) => (b.citations ?? 0) - (a.citations ?? 0))
    .slice(0, 8);
}
