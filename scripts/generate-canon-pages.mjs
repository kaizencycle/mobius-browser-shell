#!/usr/bin/env node
/**
 * C-368: Generate static canon HTML pages and JSON endpoints for crawler-visible canon.
 * Run before `vite build`. Output lands in public/ for Vercel static serving.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SOURCES = path.join(ROOT, 'canon-sources');
const PUBLIC = path.join(ROOT, 'public');
const ORIGIN = 'https://mobius-substrate.com';
const GENERATED = '2026-07-11T02:00:00Z';

const PAGES = [
  {
    slug: 'canon',
    source: 'mobius.md',
    title: 'Mobius Canon: Constitutional machine interface for civic integrity',
    description:
      'Constitutional orientation for Mobius Substrate — integrity infrastructure, primary systems, and core law. Mirror of MOBIUS.md.',
    jsonLdType: 'WebPage',
  },
  {
    slug: 'canon/glossary',
    source: 'glossary.md',
    title: 'Mobius Glossary: Canonical definitions for GI, MII, MIC, EPICON, and surfaces',
    description:
      'Canonical glossary of Mobius terms — do not redefine these in downstream docs. Mirror of CANONICAL_DEFINITIONS.md.',
    jsonLdType: 'DefinedTermSet',
  },
  {
    slug: 'canon/misinterpretations',
    source: 'misinterpretations.md',
    title: 'Mobius Misinterpretations: Corrections for Shell, Terminal, GI, and EPICON confusion',
    description:
      'Frequent misreadings of Mobius terminology and authority order — Shell vs Substrate, GI vs MII, EPICON vs MEC.',
    jsonLdType: 'TechArticle',
  },
  {
    slug: 'canon/source-of-truth',
    source: 'source-of-truth.md',
    title: 'Mobius Source of Truth: Canon → Ledger → UI authority hierarchy',
    description:
      'Fixed authority order for Mobius — Substrate canon, CPC ledger, and UI surfaces. Retrieval rules for machines.',
    jsonLdType: 'TechArticle',
  },
];

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mdToHtml(md) {
  const lines = md.split('\n');
  const out = [];
  let inTable = false;
  let tableRows = [];

  const flushTable = () => {
    if (!tableRows.length) return;
    out.push('<table>');
    tableRows.forEach((row, i) => {
      const tag = i === 0 ? 'th' : 'td';
      out.push('<tr>' + row.map((c) => `<${tag}>${inline(c)}</${tag}>`).join('') + '</tr>');
    });
    out.push('</table>');
    tableRows = [];
    inTable = false;
  };

  const inline = (text) => {
    let t = escapeHtml(text);
    t = t.replace(/`([^`]+)`/g, '<code>$1</code>');
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    return t;
  };

  for (const line of lines) {
    if (line.startsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      if (cells.every((c) => /^-+$/.test(c))) continue;
      inTable = true;
      tableRows.push(cells);
      continue;
    }
    if (inTable) flushTable();

    if (line.startsWith('### ')) {
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (line.startsWith('- ')) {
      if (out[out.length - 1] !== '<ul>') out.push('<ul>');
      out.push(`<li>${inline(line.slice(2))}</li>`);
    } else if (line.trim() === '') {
      if (out[out.length - 1] === '<ul>') out.push('</ul>');
      else if (out[out.length - 1]?.startsWith('<li>')) out.push('</ul>');
    } else if (line.startsWith('> ')) {
      out.push(`<blockquote><p>${inline(line.slice(2))}</p></blockquote>`);
    } else if (line.trim() === '---') {
      out.push('<hr />');
    } else if (line.startsWith('```')) {
      continue;
    } else {
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  if (inTable) flushTable();
  if (out[out.length - 1] === '<ul>' || out[out.length - 1]?.startsWith('<li>')) out.push('</ul>');
  return out.join('\n');
}

function canonNav(active) {
  const links = [
    ['/canon', 'Canon'],
    ['/canon/glossary', 'Glossary'],
    ['/canon/misinterpretations', 'Misinterpretations'],
    ['/canon/source-of-truth', 'Source of Truth'],
  ];
  return links
    .map(([href, label]) => {
      const cls = href === active ? ' class="active"' : '';
      return `<a href="${href}"${cls}>${label}</a>`;
    })
    .join('\n      ');
}

function renderPage(page, bodyHtml) {
  const url = `${ORIGIN}/${page.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': page.jsonLdType,
    name: page.title.split(':')[0].trim(),
    headline: page.title,
    description: page.description,
    url,
    isPartOf: {
      '@type': 'WebSite',
      name: 'Mobius Substrate',
      url: ORIGIN,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${ORIGIN}/#organization`,
      name: 'Mobius Substrate',
    },
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(page.title)}</title>
<meta name="description" content="${escapeHtml(page.description)}">
<link rel="canonical" href="${url}">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:type" content="article">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${ORIGIN}/og-image.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@kaizencycle">
<script type="application/ld+json">
${JSON.stringify(jsonLd, null, 2)}
</script>
<style>
  :root { --ink:#0f0e0d; --muted:#5c574f; --ground:#f7f5f1; --rule:#d4cfc7; --accent:#1a3a2a; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { font-family: Inter, system-ui, sans-serif; background:var(--ground); color:var(--ink); line-height:1.65; }
  nav { display:flex; flex-wrap:wrap; gap:12px; padding:16px 24px; border-bottom:1px solid var(--rule); background:#fff; }
  nav a { color:var(--accent); text-decoration:none; font-size:0.9rem; }
  nav a.active { font-weight:600; text-decoration:underline; }
  main { max-width:48rem; margin:0 auto; padding:32px 24px 64px; }
  .disclaimer { font-size:0.85rem; color:var(--muted); background:#fff; border:1px solid var(--rule); padding:12px 16px; margin-bottom:24px; border-radius:6px; }
  h1 { font-size:1.75rem; margin:1.5rem 0 0.75rem; }
  h2 { font-size:1.25rem; margin:1.5rem 0 0.5rem; }
  h3 { font-size:1.05rem; margin:1rem 0 0.5rem; }
  p, ul { margin:0.75rem 0; }
  ul { padding-left:1.25rem; }
  table { width:100%; border-collapse:collapse; margin:1rem 0; font-size:0.92rem; }
  th, td { border:1px solid var(--rule); padding:8px 10px; text-align:left; vertical-align:top; }
  th { background:#eeeae3; }
  code { font-family: ui-monospace, monospace; font-size:0.88em; background:#eeeae3; padding:1px 4px; border-radius:3px; }
  blockquote { border-left:3px solid var(--accent); padding-left:12px; color:var(--muted); margin:1rem 0; }
  a { color:var(--accent); }
  footer { max-width:48rem; margin:0 auto; padding:0 24px 48px; font-size:0.85rem; color:var(--muted); }
</style>
</head>
<body>
<nav>
  <a href="/">← School of Chambers</a>
  ${canonNav(`/${page.slug}`)}
</nav>
<main>
  <p class="disclaimer"><strong>Browser Shell surface</strong> — canonical text lives in <a href="https://github.com/kaizencycle/Mobius-Substrate">Mobius-Substrate</a>. This page is a crawler-visible mirror (C-368).</p>
  ${bodyHtml}
</main>
<footer>
  <p>Generated ${GENERATED} · <a href="/llms.txt">llms.txt</a> · <a href="/canon/index.json">canon/index.json</a></p>
</footer>
</body>
</html>`;
}

function writeJson(relPath, data) {
  const full = path.join(PUBLIC, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, JSON.stringify(data, null, 2) + '\n');
}

function extractGlossaryTerms(md) {
  const terms = [];
  const rowRe = /\|\s*\*\*([^*]+)\*\*\s*\|\s*([^|]+)\|/g;
  let m;
  while ((m = rowRe.exec(md)) !== null) {
    terms.push({ term: m[1].trim(), definition: m[2].trim() });
  }
  return terms;
}

for (const page of PAGES) {
  const md = fs.readFileSync(path.join(SOURCES, page.source), 'utf8');
  const html = renderPage(page, mdToHtml(md));
  const outDir = path.join(PUBLIC, page.slug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'index.html'), html);
  console.log(`✓ ${page.slug}/index.html`);
}

const routes = PAGES.map((p) => ({
  path: `/${p.slug}`,
  title: p.title,
  description: p.description,
}));

writeJson('.well-known/mobius-canon.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  authority: 'Mobius-Substrate',
  source_repo: 'https://github.com/kaizencycle/Mobius-Substrate',
  browser_shell_policy: {
    browser_shell_is_canon: false,
    browser_shell_is_surface: true,
  },
  html_routes: routes,
  json_endpoints: [
    '/.well-known/mobius-canon.json',
    '/canon/index.json',
    '/canon/current.json',
    '/canon/glossary.json',
    '/canon/deprecations.json',
    '/canon/citations.json',
  ],
});
console.log('✓ .well-known/mobius-canon.json');

writeJson('canon/index.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  pages: routes.map((r) => ({ ...r, url: `${ORIGIN}${r.path}` })),
});
console.log('✓ canon/index.json');

writeJson('canon/current.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  note: 'Current canon surface index — not a seal attestation.',
  authority_order: ['canon', 'ledger', 'ui'],
  active_pages: routes.map((r) => r.path),
  substrate_repo: 'https://github.com/kaizencycle/Mobius-Substrate',
});
console.log('✓ canon/current.json');

const glossaryMd = fs.readFileSync(path.join(SOURCES, 'glossary.md'), 'utf8');
writeJson('canon/glossary.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  source: 'https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/00-START-HERE/CANONICAL_DEFINITIONS.md',
  terms: extractGlossaryTerms(glossaryMd),
});
console.log('✓ canon/glossary.json');

writeJson('canon/deprecations.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  source: 'https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/org/REPO_DEPRECATION_INDEX.md',
  deprecations: [
    {
      repository: 'mobius-civic-ai-terminal-main',
      canonical_successor: 'mobius-civic-ai-terminal',
      status: 'readme_merged_archive_pending',
    },
    {
      repository: 'hive',
      canonical_successor: 'mobius-hive',
      status: 'template_ready',
    },
  ],
});
console.log('✓ canon/deprecations.json');

writeJson('canon/citations.json', {
  schema_version: '1.0',
  generated_at: GENERATED,
  rules: [
    'MEC points at EPICON and sealed history — never replaces EPICON.',
    'Prefer Substrate raw files over Shell HTML for constitutional claims.',
    'Do not infer canonical truth from Terminal UI alone.',
    'Corrections mint the next seal; no letter-suffix amendments.',
  ],
  specs: [
    { name: 'MEC', url: 'https://github.com/kaizencycle/Mobius-Substrate/blob/main/specs/MEC_SPEC_v0.1.md' },
    { name: 'EPICON-02', url: 'https://github.com/kaizencycle/Mobius-Substrate/blob/main/docs/epicon/EPICON-02.md' },
  ],
});
console.log('✓ canon/citations.json');

console.log('\nCanon pages and JSON endpoints generated.');
