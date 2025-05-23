const BOX_ID = "__link_lens_box";

let keyword = "";
chrome.storage.local.get("keyword").then((d) => (keyword = d.keyword || ""));
chrome.storage.onChanged.addListener((c) => {
  if (c.keyword) keyword = c.keyword.newValue || "";
});

let hoverTimer = null;
document.addEventListener("mouseover", (e) => {
  const a = e.target.closest("a[href]");
  if (!a || !keyword) return;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(() => analyse(a), 350);
});

function analyse(anchor) {
  chrome.runtime
    .sendMessage({ type: "ANALYSE", url: anchor.href, keyword })
    .then((res) => showBox(anchor, res));
}

function showBox(anchor, { count, snippets }) {
  removeBox();
  const host = document.createElement("div");
  host.id = BOX_ID;
  document.body.appendChild(host);

  const root = host.attachShadow({ mode: "open" });
  root.innerHTML = `
    <style>
      .panel{border-radius:10px;backdrop-filter:blur(12px);
        background:rgba(30,30,30,.82);color:#eaeaea;
        font:13px/1.4 system-ui,sans-serif;padding:8px 10px;max-width:320px;
        box-shadow:0 2px 8px rgba(0,0,0,.2);}
      hr{border:none;border-top:1px solid #444;margin:6px 0}
      mark{padding:0 2px;border-radius:3px;background:#ffeb3b87}
      button{width:100%;margin-top:6px;padding:4px 0;border:none;
        border-radius:6px;background:#3b82f6;color:#fff;cursor:pointer}
    </style>
    <div class="panel">
      <div>🟢 ${count} relevant section${count === 1 ? "" : "s"}</div>
      <div style="margin-top:6px;max-height:160px;overflow:auto">
        ${snippets
          .map((s) =>
            s.replace(new RegExp(keyword, "gi"), (m) => `<mark>${m}</mark>`)
          )
          .join("<hr/>")}
      </div>
      <button id="ask">Ask</button>
    </div>
  `;

  const { clientX: x, clientY: y } = window.__ll_last || { x: 0, y: 0 };
  host.style.cssText = `position:fixed;left:${x + 12}px;top:${
    y + 12
  }px;z-index:2147483647`;

  root.getElementById("ask").addEventListener("click", () => {
    root.getElementById("ask").disabled = true;
    chrome.runtime
      .sendMessage({ type: "AI_SUMMARY", url: anchor.href, keyword })
      .then((txt) => {
        root.getElementById("ask").remove();
        root
          .querySelector(".panel")
          .insertAdjacentHTML(
            "beforeend",
            `<div style="margin-top:6px">${txt}</div>`
          );
      });
  });

  host.addEventListener("mouseleave", removeBox, { once: true });
}

function removeBox() {
  document.getElementById(BOX_ID)?.remove();
}

document.addEventListener(
  "mousemove",
  (e) => (window.__ll_last = { x: e.clientX, y: e.clientY }),
  { passive: true }
);
