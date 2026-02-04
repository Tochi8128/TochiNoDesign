// inside.html 側：カーソル位置（iframe内のclient座標）を親に送る

const send = (payload) => {
  window.parent?.postMessage({ source: "inside", ...payload }, "*");
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
    isInside = true;

    // iframe内の「見えてる範囲」基準の座標を送る（スクロールの影響を受けない）
    send({
      type: "CURSOR_POS",
      x: e.clientX,
      y: e.clientY,
      vw: window.innerWidth,
      vh: window.innerHeight,
    });
  },
  { passive: true }
);

document.addEventListener("pointerleave", leave, { passive: true });
window.addEventListener("blur", leave);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) leave();
});