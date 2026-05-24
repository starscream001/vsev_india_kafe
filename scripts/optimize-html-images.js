#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const TARGETS = ["index.html", "bronirovaniye.html", "privacypolicy.html"];

function injectPreloadIndex(html) {
  const preload = '<link rel="preload" as="image" href="images/_1_4.jpg">';
  if (html.includes(preload)) return html;
  return html.replace("</head>", `${preload}</head>`);
}

function optimizeImgTags(html) {
  let imgIndex = 0;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let t = tag;
    const hasLoading = /\bloading=/.test(t);
    const hasDecoding = /\bdecoding=/.test(t);
    const hasFetchpriority = /\bfetchpriority=/.test(t);

    if (!hasDecoding) {
      t = t.replace(/>$/, ' decoding="async">');
    }

    if (!hasLoading) {
      if (imgIndex < 2) {
        t = t.replace(/>$/, ' loading="eager">');
        if (!hasFetchpriority) {
          t = t.replace(/>$/, ' fetchpriority="high">');
        }
      } else {
        t = t.replace(/>$/, ' loading="lazy">');
      }
    }

    imgIndex += 1;
    return t;
  });
}

for (const file of TARGETS) {
  const fullPath = path.join(ROOT, file);
  if (!fs.existsSync(fullPath)) continue;
  let html = fs.readFileSync(fullPath, "utf8");

  if (file === "index.html") {
    html = injectPreloadIndex(html);
  }
  html = optimizeImgTags(html);

  fs.writeFileSync(fullPath, html, "utf8");
  console.log(`Optimized ${file}`);
}
