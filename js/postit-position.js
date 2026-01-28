function positionAbout() {
  const pcFrame = document.getElementById('PCimage');
  const about = document.querySelector('.about');

  if (!pcFrame || !about) return;

  const rect = pcFrame.getBoundingClientRect();

  // 右上を基準に、少し内側＆下にずらす
  const offsetX = -80; // 右から左へ
  const offsetY = 0;  // 上から下へ

  about.style.left = `${rect.left + offsetX}px`;
  about.style.top  = `${rect.top + offsetY}px`;
}

function positionContact() {
  const pcFrame = document.getElementById('PCimage');
  const contact = document.querySelector('.contact');

  if (!pcFrame || !contact) return;
  const rect = pcFrame.getBoundingClientRect();

  // 右上を基準に、少し内側＆下にずらす
  const offsetX = -150; // 右から左へ
  const offsetY = 350;  // 上から下へ

  contact.style.left = `${rect.right + offsetX}px`;
  contact.style.top  = `${rect.top + offsetY}px`;
}

// 初期表示
positionAbout();
positionContact();

// リサイズ時も追従
window.addEventListener('resize', positionAbout);
window.addEventListener('resize', positionContact);

const laptop = document.querySelector(".pc-frame .laptop");

function updatePostits() {
  positionAbout();
  positionContact();
}

if (laptop) {
  // スライド開始/終了で再計算
  laptop.addEventListener("transitionrun", updatePostits);
  laptop.addEventListener("transitionend", updatePostits);
}

// contact切替直後にも呼ぶ（class付与直後に位置計算し直す）
const mo = new MutationObserver(() => updatePostits());
mo.observe(document.body, { attributes: true, attributeFilter: ["class"] });