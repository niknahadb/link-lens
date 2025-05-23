const BOX_ID = "__link_lens_box";

let keyword = "";
chrome.storage.local.get("keyword").then((d) => (keyword = d.keyword || ""));

chrome.storage.onChanged.addListener((chg) => {
  if (chg.keyword) keyword = chg.keyword.newValue || "";
});

document.addEventListener("mouseover", handleHover, { passive: true });

let hoverTimer = null;
function handleHover(e) {
  const a = e.target.closest("a[href]");
  if (!a || !keyword) return;

  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => analyseLink(a), 350);
}

function analyseLink(anchor) {
  const url = anchor.href;
  chrome.runtime
    .sendMessage({ type: "ANALYSE", url, keyword })
    .then((res) => showBox(anchor, res))
    .catch(console.error);
}

function showBox(anchor, { count, summary }) {
  removeBox();
  const box = document.createElement("div");
  box.id = BOX_ID;
  box.style.cssText = `
    position: fixed;
    z-index: 2147483647;
    max-width: 320px;
    padding: 8px 10px;
    background: ${
      matchMedia("(prefers-color-scheme: dark)").matches ? "#222" : "#fff"
    };
    color: inherit;
    font: 13px/1.4 system-ui,sans-serif;
    border: 1px solid #999;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,.15);
    pointer-events: auto;
  `;
  box.innerHTML = `
    <div>🔍 ${count} mention${
    count === 1 ? "" : "s"
  } of '<b>${keyword}</b>'</div>
    ${
      summary
        ? `<div style="margin-top:6px">${summary}</div>`
        : `<button id="ll-ai">Preview with AI</button>`
    }`;
  document.body.appendChild(box);

  // position near mouse
  const { clientX: x, clientY: y } = window.linkLensLastMove || { x: 0, y: 0 };
  box.style.left = x + 12 + "px";
  box.style.top = y + 12 + "px";

  box.addEventListener("mouseleave", removeBox);
  box.querySelector("#ll-ai")?.addEventListener("click", () => {
    chrome.runtime
      .sendMessage({ type: "AI_SUMMARY", url: anchor.href, keyword })
      .then((s) => {
        box.querySelector("#ll-ai").remove();
        box.insertAdjacentHTML(
          "beforeend",
          `<div style="margin-top:6px">${s}</div>`
        );
      });
  });
}

function removeBox() {
  document.getElementById(BOX_ID)?.remove();
}

// store last mouse coordinates
document.addEventListener("mousemove", (e) => {
  window.linkLensLastMove = { clientX: e.clientX, clientY: e.clientY };
});
