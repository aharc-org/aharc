// aharc-pagefind.js

const URL_SERIES_RE = /^(?:\/archive\/\d{4}-\d{2}-)?(.+)-[Pp]art-(\d+)\/?$/;

function extractSeries(result) {
  const m = result.url.match(URL_SERIES_RE);
  if (!m) return null;
  return { key: m[1].toLowerCase(), part: parseInt(m[2], 10) };
}

function groupAndSort(rawResults) {
  const seriesMap = {};
  const output = [];
  const seen = new Set();

  rawResults.forEach(r => {
    const s = extractSeries(r);
    if (!s) return;
    (seriesMap[s.key] ??= []).push({ ...r, _part: s.part });
  });

  rawResults.forEach(r => {
    const s = extractSeries(r);
    if (!s) { output.push({ type: 'single', result: r }); return; }
    if (seen.has(s.key)) return;
    seen.add(s.key);
    const sorted = seriesMap[s.key].sort((a, b) => a._part - b._part);
    output.push({ type: 'series', items: sorted });
  });

  // Debug logging — remove when satisfied
  console.group('aharc-pagefind: grouped results');
  output.forEach((g, i) => {
    if (g.type === 'single') {
      console.log(`[${i}] single —`, g.result.meta.title);
    } else {
      console.group(`[${i}] series (${g.items.length} parts)`);
      g.items.forEach(item => console.log(`  Part ${item._part} —`, item.meta.title, item.url));
      console.groupEnd();
    }
  });
  console.groupEnd();

  return output;
}

function renderCard(r, isSeries) {
  const publication = r.meta?.publication || r.excerpt || '';
  const thumb = r.meta?.image || '';
  return `
    <li class="pagefind-ui__result${isSeries ? ' pf-series' : ''}">
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
    if (g.type === 'single') return renderCard(g.result, false);
    return g.items.map(item => renderCard(item, true)).join('');
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
