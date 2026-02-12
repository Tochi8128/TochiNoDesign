// ===== Detail Panel 制御 =====

function initDetailPanel() {
  try {
    // messageリスナーを最初に登録（これが最優先）
    window.addEventListener("message", (e) => {
      if (e.data?.type === "OPEN_WORK") {
        openDetail(e.data.id);
      }
    });

    // DOM要素を取得
    const detailOverlay = document.querySelector(".detailOverlay");
    const detailPanel = document.querySelector(".detailPanel");
    const detailClose = document.querySelector(".detailClose");
    const detailHero = document.querySelector(".detailHero");
    const detailCategory = document.querySelector(".detailCategory");
    const detailTitle = document.querySelector(".detailTitle");
    const detailBody = document.querySelector(".detailBody");

    // イベントリスナー登録
    if (detailClose) {
      detailClose.addEventListener("click", closeDetail);
    }

    if (detailOverlay) {
      detailOverlay.addEventListener("click", closeDetail);
    }

    // ESCキーで閉じる
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeDetail();
      }
    });

  } catch (err) {
    console.error("[work-detail] initialization error:", err);
  }
}

// DOMContentLoadedを待つ、またはすでに読み込まれていた場合はすぐ実行
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initDetailPanel);
} else {
  initDetailPanel();
}

async function openDetail(id) {
  try {
    // ★ 先に SITE_BASE を作る（ここが超重要）
    const path = location.pathname;
    const m = path.match(/^\/([^\/]+)\//);
    const SITE_BASE = m ? `/${m[1]}` : "";

    const url = `${SITE_BASE}/content/works/${encodeURIComponent(id)}.md`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.warn(`[work-detail] md not found: ${url} (status: ${res.status})`);
      return;
    }

    const raw = await res.text();
    const { data, body } = parseFrontmatter(raw);

    function withBase(p) {
      if (!p) return "";
      if (/^https?:\/\//.test(p)) return p;
      if (p.startsWith(SITE_BASE + "/")) return p;
      if (p.startsWith("/")) return SITE_BASE + p;
      return SITE_BASE + "/" + p; // 相対も一応補正
    }

    const heroUrl = withBase(data.thumbnail ?? "");
    const category = escapeHTML(data.category ?? "");
    const title = escapeHTML(data.title ?? id);

    const htmlBody = await markdownToHtml(body, SITE_BASE);

    // 以下、あなたの既存のDOM反映処理はそのままでOK
    const detailOverlay = document.querySelector(".detailOverlay");
    const detailPanel = document.querySelector(".detailPanel");
    const detailHero = document.querySelector(".detailHero");
    const detailCategory = document.querySelector(".detailCategory");
    const detailTitle = document.querySelector(".detailTitle");
    const detailBody = document.querySelector(".detailBody");

    if (detailHero) detailHero.src = heroUrl;
    if (detailCategory) detailCategory.textContent = category;
    if (detailTitle) detailTitle.textContent = title;
    if (detailBody) detailBody.innerHTML = htmlBody;

    if (detailOverlay) {
      detailOverlay.classList.add("is-visible");
      detailOverlay.hidden = false;
    }
    if (detailPanel) {
      detailPanel.classList.add("is-open");
    }

    document.body.style.overflow = "hidden";
    window.dispatchEvent(new Event("detailPanelOpened"));
  } catch (err) {
    console.error(`[detail] failed to open detail: ${id}`, err);
  }
}

function closeDetail() {
  const detailOverlay = document.querySelector(".detailOverlay");
  const detailPanel = document.querySelector(".detailPanel");

  if (detailOverlay) {
    detailOverlay.classList.remove("is-visible");
    detailOverlay.hidden = true;
  }
  if (detailPanel) {
    detailPanel.classList.remove("is-open");
  }
  
  // cursor-indicatorに再計算を指示
  window.dispatchEvent(new Event("detailPanelClosed"));

  // スクロール許可
  document.body.style.overflow = "";
}

async function markdownToHtml(md, SITE_BASE) {
  let src = String(md ?? "");

  // 1) Markdownの「行末 \」(ハード改行) を消す（改行自体は残す）
  src = src.replace(/\\\s*\n/g, "\n");

  // 2) まずHTMLエスケープ（ここから先は安全な置換だけでHTMLを作る）
  let html = escapeHTML(src);

  // 3) 画像: ![alt](src)
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => {
    const fixed =
      /^https?:\/\//.test(src) || src.startsWith(SITE_BASE)
        ? src
        : src.startsWith("/")
          ? SITE_BASE + src
          : SITE_BASE + "/" + src;
    return `<img src="${escapeAttr(fixed)}" alt="${escapeAttr(alt)}" class="detail-img">`;
  });

  // 4) リンク: [text](url) ※textが空でもOKにする（*）
  html = html.replace(/\[([^\]]*)\]\(([^)]+)\)/g, (_, text, url) => {
    const label = (text && text.trim()) ? text : url; // 空ならURLを表示名に
    return `<a href="${escapeAttr(url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(label)}</a>`;
  });

  // 5) 強調: **text**
  html = html.replace(/\*\*([^*]+)\*\*/g, (_, text) => {
    return `<strong>${escapeHTML(text)}</strong>`;
  });

  // 6) イタリック: *text*
  html = html.replace(/\*([^*]+)\*/g, (_, text) => {
    return `<em>${escapeHTML(text)}</em>`;
  });

  // 7) 段落化（最後にやるのが重要）
  const paragraphs = html.split(/\n{2,}/);
  html = paragraphs
    .map((para) => `<p>${para.replace(/\n/g, "<br>")}</p>`)
    .join("");

  return html;
}

// ===== ヘルパー関数 =====

function parseFrontmatter(text) {
  // 超軽量 frontmatter パーサ（YAMLの一部だけ対応）
  // ---\nkey: value\n---\nbody
  if (!text.startsWith("---")) return { data: {}, body: text };

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };

  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n+/, "");

  const data = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();

    // クォートを剥がす（"..." or '...')
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    data[key] = coerce(val);
  }

  return { data, body };
}

function coerce(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (v === "undefined") return undefined;
  if (v !== "" && isFinite(v)) return Number(v);
  return v;
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\\_", "_")  // マークダウンのエスケープシーケンスを解除
    .replaceAll("\\*", "*")
    .replaceAll("'", "&#39;");
}

function escapeAttr(s) {
  // 属性値用（基本はHTMLエスケープと同じでOK）
  return escapeHTML(s);
}