const cache = new Map();
const OPENAI_KEY = "";

chrome.runtime.onMessage.addListener((msg, _, send) => {
  if (msg.type === "ANALYSE") {
    analyse(msg.url, msg.keyword).then(send);
    return true;
  }
  if (msg.type === "AI_SUMMARY") {
    summarise(msg.url, msg.keyword).then(send);
    return true;
  }
});

async function analyse(url, intent) {
  const key = url + "|" + intent;
  if (cache.has(key)) return cache.get(key);

  const html = await fetchRaw(url);
  const chunks = sliceHTML(html, 600);
  const intentVec = await embed(intent);
  const scored = await Promise.all(
    chunks.map(async (c) => ({
      slice: c,
      score: cosine(await embed(c), intentVec),
    }))
  );
  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3).map((x) => x.slice);
  const res = { count: top.length, snippets: top, summary: null, html };
  cache.set(key, res);
  trim();
  return { count: res.count, snippets: res.snippets };
}

async function summarise(url, intent) {
  const key = url + "|" + intent;
  const entry = cache.get(key) || (await analyse(url, intent));
  if (entry.summary) return entry.summary;

  try {
    const promptChunks = entry.snippets.join("\n\n");
    const summary = await callGPT(promptChunks, intent);
    entry.summary = summary;
    return summary;
  } catch (e) {
    console.error("AI error", e);
    throw new Error("ai-failed");
  }
}

function sliceHTML(html, len) {
  const arr = [];
  for (let i = 0; i < html.length; i += len) arr.push(html.slice(i, i + len));
  return arr;
}

async function fetchRaw(url) {
  const r = await fetch(url, { credentials: "omit", mode: "cors" });
  return r.text();
}

async function embed(text) {
  const r = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text.slice(0, 2048),
    }),
  });
  const d = await r.json();
  return d.data[0].embedding;
}

function cosine(a, b) {
  let s = 0,
    na = 0,
    nb = 0;
  for (let i = 0; i < a.length; i++) {
    s += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return s / (Math.sqrt(na) * Math.sqrt(nb) + 1e-8);
}

async function callGPT(text, intent) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      temperature: 0,
      max_tokens: 120,
      messages: [
        {
          role: "system",
          content: `Return two concise bullet points answering "${intent}". If not covered say "Not found."`,
        },
        { role: "user", content: text },
      ],
    }),
  });
  const d = await r.json();
  return d.choices?.[0]?.message?.content?.trim() || "";
}

function trim(max = 60) {
  while (cache.size > max) cache.delete(cache.keys().next().value);
}
