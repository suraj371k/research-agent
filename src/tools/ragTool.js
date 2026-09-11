import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { loadOrCreateVectorStore } from "../rag/vectorStore.js";

let cachedStore = null;

export const ragSearchTool = new DynamicStructuredTool({
  name: "search_internal_docs",
  description:
    "Search internal knowledge base documents (past reports, meeting notes, specs) for relevant context. " +
    "Use this FIRST for anything that might relate to internal/past knowledge, before reaching for web search.",
  schema: z.object({
    query: z.string().describe("What to look up in the internal knowledge base"),
    k: z.number().optional().describe("Number of chunks to retrieve, default 4"),
  }),
  func: async ({ query, k = 4 }) => {
    if (!cachedStore) {
      cachedStore = await loadOrCreateVectorStore();
    }
    if (!cachedStore) {
      return "No internal knowledge base found yet. Add files to /docs and run `npm run ingest`.";
    }
    const results = await cachedStore.similaritySearch(query, k);
    if (results.length === 0) return "No relevant internal documents found for that query.";
    return results
      .map((doc, i) => `[${i + 1}] (source: ${doc.metadata.source}) ${doc.pageContent}`)
      .join("\n\n");
  },
});
