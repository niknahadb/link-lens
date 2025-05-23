const $ = (sel) => document.querySelector(sel);
chrome.storage.local.get("keyword").then(({ keyword }) => {
  if (keyword) $("#keyword").value = keyword;
});
$("#save").addEventListener("click", async () => {
  const kv = $("#keyword").value.trim();
  await chrome.storage.local.set({ keyword: kv });
  window.close();
});
