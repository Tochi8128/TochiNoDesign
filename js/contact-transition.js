// js/contact-transition.js
const contactBtn = document.getElementById("contactBtn");
const insideIframe = document.querySelector(".laptop-screen iframe");

if (!contactBtn || !insideIframe) {
  console.warn("[contact-transition] required elements not found");
} else {
  // 切り替え先（とりあえず仮ファイル名。後で作る）
  const CONTACT_SRC = "./contact-flow.html";
  const HOME_SRC = "./inside.html";

  contactBtn.addEventListener("click", () => {
    // 1) 画面切替
    insideIframe.src = CONTACT_SRC;

    // 2) PCを右にスライド（bodyに状態クラス付与）
    document.body.classList.add("is-contact");

    // 3) 付箋(about/contact)位置が追従しない時用：再計算させる
    // postit-position.js は resize 時に再配置するので、resizeイベントを疑似発火
    window.dispatchEvent(new Event("resize"));
  });

  window.addEventListener("message", (ev) => {
    if (ev.data?.type !== "CONTACT_BACK") return;

    document.body.classList.remove("is-contact");
    const iframe = document.querySelector(".laptop-screen iframe");
    if (iframe) iframe.src = "./inside.html";

    // 付箋など再計算が必要なら
    window.dispatchEvent(new Event("resize"));
  });
}
