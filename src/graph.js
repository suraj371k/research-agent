import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { createLLM } from "./llm.js";
import { ragSearchTool } from "./tools/ragTool.js";
import { webSearchTool } from "./tools/webSearch.js";
import { calculatorTool } from "./tools/calculator.js";
import {
  mcpWriteFileTool,
  mcpReadFileTool,
  mcpListFilesTool,
} from "./tools/mcpTools.js";
import { notionCreatePageTool } from "./tools/notionTools.js";
import { notionConfigured } from "./config.js";

const BASE_SYSTEM_PROMPT = `You are a research assistant agent. You help the user research topics thoroughly.

Tools available:
- search_internal_docs: check the internal knowledge base FIRST for anything that might be past/internal knowledge.
- web_search: use for current, external, or recent information not in internal docs.
- calculator: use for any arithmetic instead of computing it yourself.
- mcp_write_file / mcp_read_file / mcp_list_files: use to save the final report to disk once you have
  gathered enough information. Always save non-trivial research answers as a markdown report
  (e.g. mcp_write_file with filename like "report.md") before giving your final answer, and tell the
  user the filename you saved it as.`;

const NOTION_PROMPT_ADDITION = `
- notion_save_report: use this when the user asks to save/send the report to Notion (in addition to,
  or instead of, saving it locally with mcp_write_file). Tell the user once it's saved.`;

const SYSTEM_PROMPT_FOOTER = `

Be concise but thorough. Cite which source (internal doc or web) each key fact came from.`;

export async function buildAgent() {
  const llm = createLLM();

  const tools = [
    ragSearchTool,
    webSearchTool,
    calculatorTool,
    mcpWriteFileTool,
    mcpReadFileTool,
    mcpListFilesTool,
  ];

  let systemPrompt = BASE_SYSTEM_PROMPT;

  // Notion is optional: only register the tool (and mention it in the prompt)
  // if NOTION_TOKEN + NOTION_PARENT_PAGE_ID are actually set in .env.
  if (notionConfigured()) {
    tools.push(notionCreatePageTool);
    systemPrompt += NOTION_PROMPT_ADDITION;
  }

  systemPrompt += SYSTEM_PROMPT_FOOTER;

  const agent = createReactAgent({
    llm,
    tools,
    stateModifier: systemPrompt,
  });

  return agent;
}
