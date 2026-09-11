import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { CONFIG } from "../config.js";

export const webSearchTool = new DynamicStructuredTool({
  name: "web_search",
  description:
    "Search the live web for current, up-to-date, or external information using Tavily. " +
    "Use this when the internal docs don't have the answer or the question needs recent information.",
  schema: z.object({
    query: z.string().describe("The search query"),
  }),
  func: async ({ query }) => {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: CONFIG.tavilyApiKey,
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Tavily search failed (${res.status}): ${errText}`);
    }

    const data = await res.json();
    const sources = (data.results || [])
      .map((r, i) => `[${i + 1}] ${r.title}\n${r.url}\n${r.content}`)
      .join("\n\n");

    return `Quick answer: ${data.answer || "N/A"}\n\nSources:\n${sources}`;
  },
});
