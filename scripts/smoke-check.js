#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const PAGES = ["index.html", "bronirovaniye.html", "privacypolicy.html", "pravila.html"];
const DETILDA_BLOCKLIST = [
  "src=\"js/tilda-",
  "cdn.postnikovmd.com/tilda",
];
const CRITICAL = {
  "index.html": [
    "mc.yandex.ru/metrika/tag.js",
    "https://wa.me/79214060607",
    "https://vk.com/bobryhouses",
    "https://t.me/bobry_clamping",
    "tel:+79214060607",
    "mailto:bobry2025@mail.ru",
    "href=\"pravila.html\"",
  ],
  "bronirovaniye.html": [
    "https://homereserve.ru/widget.js",
    "token: \"gDleLbdhMC\"",
    "https://wa.me/79214060607",
    "https://vk.com/bobryhouses",
    "https://t.me/bobry_clamping",
    "tel:+79214060607",
    "mailto:bobry2025@mail.ru",
  ],
  "pravila.html": ["rules.html", "window.location.replace"],
};

function readUtf8(relPath) {
  return fs.readFileSync(path.join(ROOT, relPath), "utf8");
}

function normalizeRef(ref) {
  if (!ref) return null;
  let r = ref.trim().replace(/^['"]|['"]$/g, "");
  if (!r) return null;
  if (
    r.startsWith("#") ||
    r.startsWith("mailto:") ||
    r.startsWith("tel:") ||
    r.startsWith("javascript:") ||
    r.startsWith("data:") ||
    /^https?:\/\//i.test(r) ||
    r.startsWith("//")
  ) {
    return null;
  }
  r = r.split("#")[0].split("?")[0];
  while (r.startsWith("./")) r = r.slice(2);
  while (r.startsWith("../")) r = r.slice(3);
  r = r.replace(/&amp;/g, "&").replace(/&#x27;/g, "").replace(/[;&]+$/g, "");
  return r || null;
}

function collectLocalRefs(html) {
  const refs = new Set();
  const noInlineScript = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  let m;
  const attrRe = /(?:src|href)="([^"]+)"/gi;
  while ((m = attrRe.exec(noInlineScript))) {
    const ref = normalizeRef(m[1]);
    if (ref) refs.add(ref);
  }

  const cssRe = /url\(([^)]+)\)/gi;
  while ((m = cssRe.exec(noInlineScript))) {
    const ref = normalizeRef(m[1]);
    if (ref) refs.add(ref);
  }

  return refs;
}

function checkExists(relPath) {
  return fs.existsSync(path.join(ROOT, relPath));
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

for (const page of PAGES) {
  if (!checkExists(page)) fail(`Missing page: ${page}`);
}

for (const [page, needles] of Object.entries(CRITICAL)) {
  if (!checkExists(page)) continue;
  const content = readUtf8(page);
  for (const needle of needles) {
    if (!content.includes(needle)) fail(`Missing critical marker in ${page}: ${needle}`);
  }

  for (const blocked of DETILDA_BLOCKLIST) {
    if (content.includes(blocked)) fail(`Found blocked legacy dependency in ${page}: ${blocked}`);
  }
}

const cssQueue = [];
const seenCss = new Set();

for (const page of PAGES) {
  if (!checkExists(page)) continue;
  const refs = collectLocalRefs(readUtf8(page));
  for (const ref of refs) {
    if (!checkExists(ref)) fail(`${page} -> missing ${ref}`);
    if (ref.toLowerCase().endsWith(".css")) cssQueue.push(ref);
  }
}

while (cssQueue.length) {
  const cssRel = cssQueue.pop();
  if (seenCss.has(cssRel) || !checkExists(cssRel)) continue;
  seenCss.add(cssRel);
  const css = readUtf8(cssRel);
  let m;
  const re = /url\(([^)]+)\)/gi;
  while ((m = re.exec(css))) {
    const ref = normalizeRef(m[1]);
    if (!ref) continue;
    if (!checkExists(ref)) fail(`${cssRel} -> missing ${ref}`);
    if (ref.toLowerCase().endsWith(".css")) cssQueue.push(ref);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}

console.log("Smoke check passed.");
