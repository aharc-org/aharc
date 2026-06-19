// aharc-pagefind.js
const URL_SERIES_RE = /^(?:\/archive\/\d{4}-\d{2}-)?(.+)-[Pp]art-(\d+)\/?$/;

function extractSeries(result) {
  const m = result.url.match(URL_SERIES_RE);
  if (!m) return null;
  return { key: m[1].toLowerCase(), part: parseInt(m[2], 10) };
}

// Matches any path segment containing "Vicar" (case-insensitive).
// Grouping key is that segment; sort key is the first 8 chars of the
// result's own leaf folder (so dated leaf folders sort chronologically
// even when the Vicar segment itself is a shared parent folder).
function extractVicarGroup(result) {
  const segments = result.url.split('/').filter(Boolean);
  const vicarSeg = segments.find(seg => /vicar/i.test(seg));
  if (!vicarSeg) return null;
  const leaf = segments[segments.length - 1] || vicarSeg;
  return {
    key: 'vicar', // every vicar-tagged entry shares this key, regardless of name
    sortKey: leaf.slice(0, 8).toLowerCase()
  };
}

function groupAndSort(rawResults) {
  // Pass 1: collect every Vicar-folder match, regardless of count
  const vicarMap = {};
  rawResults.forEach(r => {
    const v = extractVicarGroup(r);
    if (!v) return;
    (vicarMap[v.key] ??= []).push({ ...r, _vicarSort: v.sortKey });
  });

  // Only folders with 2+ results actually become a "vicar" group;
  // a lone match falls through to series/single handling below.
  const validVicarKeys = new Set(
    Object.keys(vicarMap).filter(k => vicarMap[k].length >= 2)
  );

  // Pass 2: build the series map, skipping anything claimed by a valid
  // vicar group, since vicar grouping takes priority over series.
  const seriesMap = {};
  rawResults.forEach(r => {
    const v = extractVicarGroup(r);
    if (v && validVicarKeys.has(v.key)) return;
    const s = extractSeries(r);
    if (!s) return;
    (seriesMap[s.key] ??= []).push({ ...r, _part: s.part });
  });

  const output = [];
  const seenVicar = new Set();
  const seenSeries = new Set();

  rawResults.forEach(r => {
    const v = extractVicarGroup(r);
    if (v && validVicarKeys.has(v.key)) {
      if (seenVicar.has(v.key)) return;
      seenVicar.add(v.key);
      const sorted = vicarMap[v.key].sort((a, b) => a._vicarSort.localeCompare(b._vicarSort));
      output.push({ type: 'vicar', items: sorted });
      return;
    }

    const s = extractSeries(r);
    if (!s) { output.push({ type: 'single', result: r }); return; }
    if (seenSeries.has(s.key)) return;
    seenSeries.add(s.key);
    const sorted = seriesMap[s.key].sort((a, b) => a._part - b._part);
    output.push({ type: 'series', items: sorted });
  });

  // Debug logging — remove when satisfied
   console.group('aharc-pagefind: grouped results');
   output.forEach((g, i) => {
     if (g.type === 'single') {
       console.log(`[${i}] single —`, g.result.meta.title);
     } else {
       console.group(`[${i}] ${g.type} (${g.items.length} parts)`);
       g.items.forEach(item => console.log(`  —`, item.meta.title, item.url));
       console.groupEnd();
     }
   });
  console.groupEnd();

  return output;
}

function renderCard(r, groupType) {
  const publication = r.meta?.publication || r.excerpt || '';
  const thumb = r.meta?.image || '';
  const groupClass = groupType ? ` pf-${groupType}` : '';
  return `
    <li class="pagefind-ui__result${groupClass}">
      ${thumb ? `<a href="${r.url}"><img class="pagefind-ui__result-thumb" src="${thumb}" alt="" loading="lazy"></a>` : ''}
      <div class="pagefind-ui__result-inner">
        <h3 class="pagefind-ui__result-title">
          <a class="pagefind-ui__result-link" href="${r.url}">${r.meta.title}</a>
        </h3>
        <p class="pagefind-ui__result-excerpt">${publication}</p>
      </div>
    </li>`;
}

async function runSearch(query, listEl, pagefind) {
  if (!query.trim()) { listEl.innerHTML = ''; return; }
  const search = await pagefind.search(query);
  const data = await Promise.all(search.results.slice(0, 20).map(r => r.data()));
  const groups = groupAndSort(data);
  listEl.innerHTML = groups.map(g => {
    if (g.type === 'single') return renderCard(g.result, null);
    if (g.type === 'vicar') return g.items.map(item => renderCard(item, 'vicar')).join('');
    return g.items.map(item => renderCard(item, 'series')).join('');
  }).join('');
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('search');
  container.innerHTML = `
    <div class="pagefind-ui">
      <input class="pagefind-ui__search-input" type="text" placeholder="Search archives…" autocomplete="off" />
      <ul class="pagefind-ui__results"></ul>
    </div>
  `;
  const pagefind = await import('/archive/pagefind/pagefind.js');
  await pagefind.init();
  const input = container.querySelector('.pagefind-ui__search-input');
  const listEl = container.querySelector('.pagefind-ui__results');
  let debounce;
  input.addEventListener('input', () => {
    clearTimeout(debounce);
    debounce = setTimeout(() => runSearch(input.value, listEl, pagefind), 150);
  });
  console.log('aharc-pagefind: ready');
});
