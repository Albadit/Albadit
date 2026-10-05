// Generates the profile's SVG components into ./assets
const fs = require("fs");
const si = require("simple-icons");
const path = require("path");
const OUT = path.join(__dirname, "..", "assets");
fs.mkdirSync(OUT, { recursive: true });

const font = (pkg, w) =>
  fs.readFileSync(require.resolve(`@fontsource/${pkg}/files/${pkg}-latin-${w}-normal.woff2`)).toString("base64");
const FACES = {
  sans400: ["IBM Plex Sans", 400, font("ibm-plex-sans", 400)],
  sans500: ["IBM Plex Sans", 500, font("ibm-plex-sans", 500)],
  sans600: ["IBM Plex Sans", 600, font("ibm-plex-sans", 600)],
  mono400: ["IBM Plex Mono", 400, font("ibm-plex-mono", 400)],
  mono500: ["IBM Plex Mono", 500, font("ibm-plex-mono", 500)],
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Shared tokens: GitHub-native neutrals, switched by the browser's color scheme.
function style(faces, extra = "") {
  const ff = faces.map((k) => {
    const [fam, w, b64] = FACES[k];
    return `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join("");
  return `<style>${ff}
:root{--fg:#1f2328;--muted:#59636e;--faint:#6e7781;--line:#d1d9e0;--panel:#f6f8fa;--chip:#ffffff;--on:#1f2328;--off:#d1d9e0;--live:#1a7f37;}
@media (prefers-color-scheme: dark){:root{--fg:#e6edf3;--muted:#9198a1;--faint:#848d97;--line:#30363d;--panel:#151b23;--chip:#0d1117;--on:#e6edf3;--off:#3d444d;--live:#3fb950;}}
.sans{font-family:'IBM Plex Sans',system-ui,sans-serif}.mono{font-family:'IBM Plex Mono',ui-monospace,monospace}
.fg{fill:var(--fg)}.muted{fill:var(--muted)}.faint{fill:var(--faint)}
${extra}</style>`;
}
// Drawn at GitHub's README column width so text renders ~1:1 instead of being scaled down.
const W = 840;
const svg = (w, h, body, title) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${body}</svg>\n`;

// ---------- brand icon tile ----------
const ICONS = new Set();
function mix(hex, t) { const n = parseInt(hex, 16); const c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(v + (255 - v) * t)); return "#" + c.map(v => v.toString(16).padStart(2, "0")).join(""); }
// per-icon colours: brand colour, but lifted on dark / swapped to text colour where it would vanish
function iconCss() {
  let light = "", dark = "";
  for (const e of ICONS) { const [slug, hex] = e.split(":"); const L = lum(hex);
    light += `.ic-${slug}{fill:${L > 0.8 ? "var(--fg)" : "#" + hex}}`;
    dark += `.ic-${slug}{fill:${L < 0.12 ? "var(--fg)" : L < 0.45 ? mix(hex, 0.45) : "#" + hex}}`; }
  ICONS.clear();
  return light + `@media (prefers-color-scheme: dark){${dark}}`;
}
function lum(hex) { const n = parseInt(hex, 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function icon(slug, mono, x, y, s = 26) {
  const i = slug && si["si" + slug[0].toUpperCase() + slug.slice(1)];
  const tile = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="7" style="fill:var(--panel);stroke:var(--line)"/>`;
  if (!i) {
    const fs_ = mono.length > 2 ? 9.5 : 11.5;
    return tile + `<text x="${x + s / 2}" y="${y + s / 2 + fs_ * 0.36}" text-anchor="middle" class="mono fg" font-size="${fs_}" font-weight="500">${esc(mono)}</text>`;
  }
  ICONS.add(slug + ":" + i.hex);
  const fill = null;
  const p = 6, k = (s - p * 2) / 24;
  return tile + `<g transform="translate(${x + p} ${y + p}) scale(${k})"><path d="${i.path}" class="ic-${slug}"/></g>`;
}

// ---------- header ----------
function header() {
  const H = 290;
  const sites = [
    ["dnnmanager.local", "DnnManager.NET", "running"],
    ["dotnetforge.local", "DotNetForge", "running"],
    ["livemocap.local", "LiveMocap", "running"],
    ["you.local", "next project", "idle"],
  ];
  const px = 400, py = 40, pw = W - px - 1, rowH = 46;
  let rows = "";
  sites.forEach(([host, name, st], i) => {
    const y = py + 52 + i * rowH;
    const live = st === "running";
    rows += `<line x1="${px}" x2="${px + pw}" y1="${y - 14}" y2="${y - 14}" style="stroke:var(--line)"/>`;
    rows += `<circle cx="${px + 20}" cy="${y + 8}" r="4" ${live ? `class="pulse" style="fill:var(--live);animation-delay:${i * 0.35}s"` : `style="fill:var(--faint)"`}/>`;
    rows += `<text x="${px + 36}" y="${y + 13}" class="mono fg" font-size="15">${host}</text>`;
    rows += `<text x="${px + 206}" y="${y + 13}" class="sans muted" font-size="15">${esc(name)}</text>`;
    rows += `<text x="${px + pw - 18}" y="${y + 13}" text-anchor="end" class="mono ${live ? "fg" : "faint"}" font-size="14.5">${st}</text>`;
  });
  const body = style(["sans400", "sans600", "mono400"], `
.pulse{animation:p 2.4s ease-out 1 both}
@keyframes p{0%{opacity:.15}40%{opacity:1}100%{opacity:1}}
.cur{animation:b 1.1s steps(1) infinite}@keyframes b{50%{opacity:0}}
@media (prefers-reduced-motion: reduce){.pulse,.cur{animation:none}}`) +
    `<text x="0" y="100" class="sans fg" font-size="68" font-weight="600" letter-spacing="-2.2">Albadit</text>
<text x="2" y="144" class="sans muted" font-size="20">Software engineer building</text>
<text x="2" y="171" class="sans muted" font-size="20">developer tools, web platforms</text>
<text x="2" y="198" class="sans muted" font-size="20">and the infrastructure under them.</text>
<text x="2" y="246" class="mono faint" font-size="15">.NET · DNN · React · IIS · Azure</text>
<rect x="${px}" y="${py}" width="${pw}" height="${52 + sites.length * rowH - 4}" rx="12" style="fill:var(--panel);stroke:var(--line)"/>
<text x="${px + 20}" y="${py + 30}" class="mono muted" font-size="14.5">sites</text>
<text x="${px + pw - 18}" y="${py + 30}" text-anchor="end" class="mono faint" font-size="14.5">3 of 4 running<tspan class="cur">_</tspan></text>
${rows}`;
  return svg(W, H, body, "Albadit - software engineer building developer tools, web platforms and infrastructure");
}

// ---------- stack (const stack = { ... }) ----------
const STACK = [
  ["languages", "What I write every day.", [
    ["TypeScript", "typescript", 3], ["JavaScript", "javascript", 3], ["C#", "", 3, "C#"], ["HTML", "html5", 3], ["CSS", "css", 3],
    ["SQL", "", 3, "SQL"], ["Python", "python", 2], ["PHP", "php", 2], ["PowerShell", "", 2, "PS"], ["Bash", "gnubash", 2], ["Rust", "rust", 1]]],
  ["frameworks", "My core stack, and what I reach for next.", [
    [".NET", "dotnet", 3], ["DNN Platform", "", 3, "DNN"], ["React", "react", 3], ["Next.js", "nextdotjs", 3], ["Node.js", "nodedotjs", 3],
    ["Vue", "vuedotjs", 2], ["Nuxt", "nuxt", 2], ["WPF", "", 2, "WPF"], [".NET MAUI", "dotnet", 2], ["Django", "django", 1]]],
  ["data", "Databases and ORMs.", [
    ["SQL Server", "", 3, "SQL"], ["PostgreSQL", "postgresql", 3], ["Supabase", "supabase", 2], ["Prisma", "prisma", 2], ["MySQL", "mysql", 2], ["SQLite", "sqlite", 2]]],
  ["cloud", "Hosting, edge and deploys.", [
    ["IIS", "", 3, "IIS"], ["Azure", "", 2, "Az"], ["Vercel", "vercel", 2], ["Cloudflare", "cloudflare", 2], ["GitHub Actions", "githubactions", 2]]],
  ["design", "Styling, motion and visuals.", [
    ["Tailwind CSS", "tailwindcss", 3], ["Framer Motion", "framer", 2], ["Figma", "figma", 2], ["Photoshop", "", 2, "Ps"], ["Blender", "blender", 2]]],
  ["ai", "Models, vision and ML.", [
    ["PyTorch", "pytorch", 1], ["Hugging Face", "huggingface", 1], ["MediaPipe", "mediapipe", 2], ["OpenCV", "opencv", 2]]],
  ["tooling", "Build, ship and tinker.", [
    ["Git", "git", 3], ["Docker", "docker", 3], ["Linux", "linux", 2], ["Arduino", "arduino", 2], ["Raspberry Pi", "raspberrypi", 1], ["Unity", "unity", 1]]],
];
function bars(x, y, lvl) {
  let s = "";
  for (let i = 0; i < 3; i++) {
    const h = 5 + i * 3.5;
    s += `<rect x="${x + i * 5}" y="${y + 13 - h}" width="3" height="${h}" rx="1" style="fill:var(${i < lvl ? "--on" : "--off"})"/>`;
  }
  return s;
}
function stack() {
  const chipH = 40, gap = 10, colX = 36, right = W - 1, fsz = 15, cw = fsz * 0.6;
  let y = 58, out = "";
  out += `<text x="1" y="26" class="mono" font-size="17"><tspan class="muted">const</tspan> <tspan class="fg">stack</tspan> <tspan class="muted">= {</tspan></text>`;
  const top = 44;
  for (const [key, comment, items] of STACK) {
    // key and comment on one line, chips wrap underneath
    out += `<text x="${colX}" y="${y + 14}" class="mono fg" font-size="16" font-weight="500">${key}<tspan class="muted">:</tspan>` +
      `<tspan class="faint" font-size="14.5" font-weight="400" dx="12">// ${esc(comment)}</tspan></text>`;
    let cx = colX, cy = y + 30;
    for (const [name, slug, lvl, mono] of items) {
      const w = 10 + 26 + 10 + name.length * cw + 14 + 13 + 12;
      if (cx + w > right) { cx = colX; cy += chipH + gap; }
      out += `<rect x="${cx}" y="${cy}" width="${w}" height="${chipH}" rx="10" style="fill:var(--chip);stroke:var(--line)"/>`;
      out += icon(slug, mono || name.slice(0, 2), cx + 7, cy + 7);
      out += `<text x="${cx + 46}" y="${cy + 25}" class="mono fg" font-size="${fsz}">${esc(name)}</text>`;
      out += bars(cx + w - 26, cy + 13, lvl);
      cx += w + gap;
    }
    y = cy + chipH + 34;
  }
  out += `<line x1="10" x2="10" y1="${top}" y2="${y - 26}" style="stroke:var(--line)"/>`;
  out += `<text x="1" y="${y - 2}" class="mono muted" font-size="17">}</text>`;
  // legend, under the closing brace
  const legY = y + 44;
  out += `<text x="1" y="${legY}" class="mono faint" font-size="14">// legend:</text>`;
  let lx = 1 + 10 * 14 * 0.6 + 18;
  for (const [label, lvl] of [["used daily", 3], ["comfortable", 2], ["learning", 1]]) {
    out += bars(lx, legY - 13, lvl) + `<text x="${lx + 19}" y="${legY}" class="mono faint" font-size="14">${label}</text>`;
    lx += 19 + label.length * 14 * 0.6 + 20;
  }
  return svg(W, legY + 16,style(["mono400", "mono500"], iconCss()) + out, "Tech stack: languages, frameworks, data, cloud, design, ai and tooling");
}

// ---------- project rows ----------
const PROJECTS = [
  ["dnnmanager", "DnnManager.NET", "Desktop app for DNN developers",
    ["Spin up a working DNN site in one click, with IIS and SQL Server", "configured for you. Batch start, stop and clone, keep-alive,", "Azure SQL import and built-in terminals."],
    [["C#", "", "C#"], [".NET 10", "dotnet"], ["WPF", "", "WPF"], ["IIS", "", "IIS"], ["Docker", "docker"]], "Albadit/DnnManager.NET"],
  ["dotnetforge", "DotNetForge", "Hybrid CMS on ASP.NET Core",
    ["A modular, lightweight CMS that runs as a traditional CMS with a visual admin, a headless CMS", "with a token-secured API, or both at once over the same content."],
    [["C#", "", "C#"], [".NET 10", "dotnet"], ["ASP.NET Core", "dotnet"], ["EF Core", "", "EF"], ["SQLite", "sqlite"], ["PostgreSQL", "postgresql"]], "Albadit/DotNetForge"],
  ["rageguard", "RageGuard", "Discord voice-moderation bot",
    ["Listens to a selected member in voice, classifies the emotion of their speech with a", "wav2vec2 model and applies a timeout on repeated, high-confidence anger."],
    [["Rust", "rust"], ["Python", "python"], ["FastAPI", "fastapi"], ["PyTorch", "pytorch"], ["Hugging Face", "huggingface"], ["Docker", "docker"]], "Albadit/RageGuard"],
  ["madtyping", "MadTyping", "Terminal tool for League of Legends chat",
    ["Pick a .txt or .md file in a searchable terminal UI and it types each line into the League", "chat through the Win32 SendInput API. Preview, hot-reload and cancel with Esc."],
    [["Rust", "rust"], ["crossterm", "", "ct"], ["Win32 API", "", "W32"]], "Albadit/MadTyping"],
  ["livemocap", "LiveMocap", "Real-time webcam motion capture for Blender",
    ["Tracks your body with MediaPipe and retargets it live onto any Blender armature, with auto", "bone mapping, smoothing, foot lock, live recording and bake to action."],
    [["Python", "python"], ["Blender", "blender"], ["MediaPipe", "mediapipe"], ["OpenCV", "opencv"]], "Albadit/LiveMocap"],
];
function project([id, name, kicker, lines, tech, repo]) {
  const pad = 28, descY = 120, lh = 26;
  // rewrap the description to the narrower card
  const wrapped = [];
  let line = "";
  for (const w of lines.join(" ").split(" ")) {
    if ((line + " " + w).trim().length > 94) { wrapped.push(line.trim()); line = ""; }
    line += " " + w;
  }
  wrapped.push(line.trim());
  const sepY = descY + (wrapped.length - 1) * lh + 26, techY = sepY + 18, H = techY + 24 + pad;
  let out = `<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="14" style="fill:var(--panel);stroke:var(--line)"/>`;
  out += `<text x="${pad}" y="56" class="sans fg" font-size="28" font-weight="600" letter-spacing="-0.6">${esc(name)}</text>`;
  out += `<text x="${W - pad}" y="54" text-anchor="end" class="mono faint" font-size="14.5">github.com/${repo}</text>`;
  out += `<text x="${pad}" y="86" class="sans muted" font-size="16.5">${esc(kicker)}</text>`;
  wrapped.forEach((l, i) => out += `<text x="${pad}" y="${descY + i * lh}" class="sans fg" font-size="16.5" opacity=".9">${esc(l)}</text>`);
  // bottom: tech row
  out += `<line x1="${pad}" x2="${W - pad}" y1="${sepY}" y2="${sepY}" style="stroke:var(--line)"/>`;
  let tx = pad;
  tech.forEach(([t, slug, mono]) => {
    out += icon(slug, mono || t.slice(0, 2), tx, techY, 24);
    out += `<text x="${tx + 32}" y="${techY + 17}" class="mono fg" font-size="15">${esc(t)}</text>`;
    tx += 32 + t.length * 15 * 0.6 + 24;
  });
  fs.writeFileSync(`${OUT}/project-${id}.svg`, svg(W, H, style(["sans400", "sans600", "mono400"], iconCss()) + out, `${name}: ${kicker}`));
}

// ---------- section heading ----------
function heading(id, text, note) {
  const H = 64;
  const out = `<text x="0" y="40" class="sans fg" font-size="24" font-weight="600" letter-spacing="-0.4">${esc(text)}</text>` +
    (note ? `<text x="${W}" y="40" text-anchor="end" class="mono faint" font-size="14.5">${esc(note)}</text>` : "") +
    `<line x1="0" x2="${W}" y1="${H - 4}" y2="${H - 4}" style="stroke:var(--line)"/>`;
  fs.writeFileSync(`${OUT}/h-${id}.svg`, svg(W, H, style(["sans600", "mono400"]) + out, text));
}

fs.writeFileSync(`${OUT}/header.svg`, header());
fs.writeFileSync(`${OUT}/stack.svg`, stack());
PROJECTS.forEach(project);
heading("stack", "Stack", "the tools I reach for");
heading("work", "Selected work", "public repositories");
heading("activity", "Activity", "live from GitHub");
console.log(fs.readdirSync(OUT).map(f => f + " " + (fs.statSync(`${OUT}/${f}`).size / 1024).toFixed(0) + "KB").join("\n"));
