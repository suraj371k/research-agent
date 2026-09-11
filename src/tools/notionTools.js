// LangChain tool wrapper around the official Notion MCP server (v3.x)'s
// consolidated write tool.
//
// notion-mcp-server v3 exposes just 3 tools -- notion_read, notion_write,
// notion_describe -- dispatched by an `operation` name in the payload, rather
// than one tool per Notion API operation (that was the older v1-style server,
// which used names like "API-post-page"). Confirmed on this install via:
//     node src/mcp/notionClient.js
// followed by:
//     node -e "..." calling notion_describe({ operation: "create_page" })
// which returned the schema below (parent / title / markdown).
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import { callMcpTool } from "../mcp/notionClient.js";
import { CONFIG } from "../config.js";

export const notionCreatePageTool = new DynamicStructuredTool({
  name: "notion_save_report",
  description:
    "Save a research report as a new page in Notion, under the configured parent page. " +
    "Use this instead of (or in addition to) mcp_write_file when the user wants the report in Notion.",
  schema: z.object({
    title: z.string().describe("Title of the Notion page, e.g. 'Q3 Pilot Research Report'"),
    content: z
      .string()
      .describe("The report content as GitHub-flavored markdown (headings, lists, bold, etc. are all preserved)."),
  }),
  func: async ({ title, content }) => {
    const result = await callMcpTool("notion_write", {
      operation: "create_page",
      payload: {
        parent: { type: "page_id", page_id: CONFIG.notionParentPageId },
        title,
        markdown: content,
      },
    });

    // Response text is a JSON string of the (slimmed) created page object,
    // which normally includes a "url". Surface it if present so the agent
    // can hand the user a clickable link.
    let url;
    try {
      const parsed = JSON.parse(result?.content?.[0]?.text ?? "{}");
      url = parsed?.url;
    } catch {
      // fall through -- not fatal, just means we can't surface a direct link
    }

    return url
      ? `Saved '${title}' as a new Notion page: ${url}`
      : `Saved '${title}' as a new Notion page under the configured parent page.`;
  },
});
