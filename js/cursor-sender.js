// inside.html 側：カーソル位置を正規化して親に送る
// 送るイベント:
// - CURSOR_NORM { nx, ny } : 0..1
// - CURSOR_LEAVE            : iframe外に出た/非表示になった

const send = (payload) => {
  window.parent?.postMessage(
    { source: "inside", ...payload },
    "*"
  );
};

let isInside = false;

function leave() {
  if (!isInside) return;
  isInside = false;
  send({ type: "CURSOR_LEAVE" });
}

window.addEventListener(
  "pointermove",
  (e) => {
    const rect = document.documentElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    isInside = true;

    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    send({
      type: "CURSOR_NORM",
      nx: Math.min(1, Math.max(0, nx)),
      ny: Math.min(1, Math.max(0, ny)),
    });
  },
  { passive: true }
);

// ちゃんと「出た」を検知する保険（Chromeで効きます）
document.addEventListener("pointerleave", leave, { passive: true });
window.addEventListener("blur", leave);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) leave();
});