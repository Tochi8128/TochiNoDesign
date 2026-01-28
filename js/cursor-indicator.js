// index.html 側：受信した正規化カーソル(nx,ny)をトラックパッド座標へマッピングして表示

const indicator = document.querySelector("#trackpad-indicator");
const trackpad = document.querySelector("#trackpad"); // トラックパッド領域（基準）

// ここはあなたの「合わせたい位置」補正（必要ならそのまま維持）
const ANCHOR_X = 64.8935 / 935.8223;
const ANCHOR_Y = 114.8562 / 759.2879;

let lastNorm = null;     // {nx, ny}
let lastAt = 0;
let overlayOpen = false;

function hide() {
  if (!indicator) return;
  indicator.style.opacity = "0";
}

function show() {
  if (!indicator) return;
  indicator.style.opacity = "1";
}

function ensureIndicator() {
  if (!indicator) return;
  // base.cssで display:none なので、JS側で表示可能状態にする
  indicator.style.display = "block";
  indicator.style.opacity = "0";
  indicator.style.willChange = "transform";
}

function render() {
  if (!indicator || !trackpad) return;

  // 詳細表示中は強制で隠す
  if (overlayOpen) {
    hide();
    return;
  }

  // 受信が途切れたら消す（iframe外に出た/止まった扱い）
  const now = performance.now();
  if (!lastNorm || now - lastAt > 120) {
    hide();
    return;
  }

  const base = indicator.offsetParent || document.body;
  const baseRect = base.getBoundingClientRect();

  // trackpadの画面座標
  const rect = trackpad.getBoundingClientRect();
  const x = rect.left + rect.width * lastNorm.nx;
  const y = rect.top  + rect.height * lastNorm.ny;

  // indicatorのサイズ
  const w = indicator.offsetWidth || 1;
  const h = indicator.offsetHeight || 1;

  // ★ここで baseRect を引く（親基準にする）
  const left = (x - baseRect.left) - w * ANCHOR_X;
  const top  = (y - baseRect.top)  - h * ANCHOR_Y;

  indicator.style.left = `${left}px`;
  indicator.style.top  = `${top}px`;

  show();
}

ensureIndicator();

// inside.html から受信
window.addEventListener("message", (e) => {
  const d = e.data;
  if (!d || d.source !== "inside") return;

  if (d.type === "CURSOR_NORM") {
    lastNorm = { nx: d.nx, ny: d.ny };
    lastAt = performance.now();
    render();
    return;
  }

  if (d.type === "CURSOR_LEAVE") {
    lastNorm = null;
    lastAt = 0;
    hide();
    return;
  }
});

// work-detail.js が投げてるイベントを拾う（←これが「作品詳細でも消えない」の解決）
window.addEventListener("detailPanelOpened", () => {
  overlayOpen = true;
  hide();
});
window.addEventListener("detailPanelClosed", () => {
  overlayOpen = false;
  // 復帰は次のCURSOR_NORMで自然に出る（勝手に出るのを防ぐ）
});