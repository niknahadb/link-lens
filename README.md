# Link Lens

A Chrome extension that brings AI-powered “preview before you click” functionality to your browsing. Hover any link to see the most relevant snippets, highlighted in context, and ask for a two-bullet AI summary right in the panel—no tab switching required.

---

## Basic Usage

1. Click the **Link Lens** icon in your toolbar.  
2. Enter your intent or keyword (for example, “return policy” or “API limits”) and save.  
3. Browse any page and hover over a hyperlink.  
4. A sleek preview panel will pop up showing up to three semantically matched snippets from the target page, with your keyword highlighted.  
5. Click **Ask** in the panel to get a concise, two-point answer generated by GPT-3.5 Turbo, focused only on those snippets.

---

## Learnings & Takeaways

Building Link Lens taught me how powerful it can be to combine lightweight on-device processing with cloud AI. Moving from simple keyword counts to semantic search—using vector embeddings—meant the extension could surface relevant content even when the exact words didn’t match. That shift alone transformed the user experience from “fancy Ctrl+F” into something that really feels magical.

I discovered that perceived speed matters just as much as actual speed. Streaming the first few matching snippets into the panel as soon as they’re available created an “instant” feel, even when the full analysis was still running in the background. Debouncing hover events and caching results locally stopped redundant work in its tracks, so hovers stayed snappy no matter how many links you moused over.

Design turned out to be more than just aesthetics. A glass-morphic panel, subtle “swoop-in” animations, and a clear **Ask** button gave the tool an approachable, playful interface—something users actually want to interact with, instead of ignoring it. And crafting a tight prompt for the AI (“Return two concise bullet points…”) kept token costs down and answers sharply focused.

Finally, laying the project out as separate layers—popup UI, content script, and service worker—made it easy to extend. Next on my list: keyboard navigation through links, feedback-driven personalization, and form preview actions.
