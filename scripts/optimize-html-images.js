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
  let boostedRaster = false;

  return html.replace(/<img\b[^>]*>/gi, (tag) => {
    let t = tag;
    const hasLoading = /\bloading=/.test(t);
    const hasDecoding = /\bdecoding=/.test(t);
    const hasFetchpriority = /\bfetchpriority=/.test(t);
    const srcMatch = t.match(/\bsrc="([^"]+)"/i);
    const src = (srcMatch ? srcMatch[1] : "").toLowerCase();
    const isRaster = /\.(png|jpe?g|webp|avif|gif)(\?|#|$)/i.test(src);
    const isLikelyIcon = src.includes("fonts/") || src.endsWith(".svg");

    if (!hasDecoding) {
      t = t.replace(/>$/, ' decoding="async">');
    }

    const shouldBoost = !boostedRaster && isRaster && !isLikelyIcon;
    if (!hasLoading) {
      if (shouldBoost) {
        t = t.replace(/>$/, ' loading="eager">');
      } else {
        t = t.replace(/>$/, ' loading="lazy">');
      }
    } else if (isLikelyIcon) {
      t = t.replace(/\bloading="eager"/gi, 'loading="lazy"');
    }

    if (shouldBoost) {
      boostedRaster = true;
      if (!hasFetchpriority) {
        t = t.replace(/>$/, ' fetchpriority="high">');
      }
    } else {
      t = t.replace(/\sfetchpriority="high"/gi, "");
    }

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
