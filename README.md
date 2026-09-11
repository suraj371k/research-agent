# Research Agent

An LLM agent that combines internal-knowledge RAG, live web search, a calculator
tool, and MCP-based file/Notion persistence, orchestrated with LangGraph.

## Stack
- **LLM**: Ollama with qwen2.5
- **Orchestration**: LangGraph.js (`createReactAgent`)
- **Web search tool**: Tavily API — free tier
- **RAG**: local embeddings (`@xenova/transformers`, all-MiniLM-L6-v2, no API key)
  + FAISS vector store (`faiss-node`)
- **MCP**: official `@modelcontextprotocol/server-filesystem`, scoped to
  `output/reports`, exposing `write_file` / `read_text_file` / `list_directory`
  as agent tools
- **MCP (optional)**: official `notion-mcp-server` (v3, consolidated
  `notion_read` / `notion_write` / `notion_describe` tools), wrapped as a single
  `notion_save_report` tool that calls the `create_page` operation with
  markdown content. Only registered if `NOTION_TOKEN` + `NOTION_PARENT_PAGE_ID`
  are set in `.env`.

## Folder structure
```
research-agent/
├── src/
│   ├── index.js           CLI entry point (chat loop)
│   ├── graph.js            LangGraph agent + system prompt + tool list
│   ├── llm.js               Gemini client
│   ├── config.js            env var loading
│   ├── tools/
│   │   ├── ragTool.js        search_internal_docs
│   │   ├── webSearch.js      web_search (Tavily)
│   │   ├── calculator.js     calculator
│   │   ├── mcpTools.js       mcp_write_file / mcp_read_file / mcp_list_files
│   │   └── notionTools.js    notion_save_report (optional)
│   ├── rag/
│   │   ├── embeddings.js     local embedding wrapper
│   │   ├── vectorStore.js    load/save FAISS index
│   │   └── ingest.js         builds the index from /docs
│   └── mcp/
│       ├── filesystemClient.js   MCP client -> filesystem server (stdio)
│       └── notionClient.js       MCP client -> notion-mcp-server (stdio, optional)
├── docs/                 put your fake/sample knowledge docs here (.md/.txt/.pdf)
├── data/faiss_index/     generated FAISS index (gitignored)
├── output/reports/       agent-saved reports land here via MCP (gitignored)
├── .env.example
└── package.json
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in:
   ```
   GEMINI_API_KEY=...
   TAVILY_API_KEY=...
   ```
   Get a free Gemini key at aistudio.google.com/apikey and a free Tavily key
   at tavily.com.

3. Add documents to `docs/` (markdown, txt, or PDF — you'll add your fake docs here).

4. Build the RAG index:
   ```
   npm run ingest
   ```

5. Run the agent:
   ```
   npm start
   ```

## Notion integration (optional)

The agent can save a finished report straight to a Notion page via MCP, using
the official `notion-mcp-server` (installed locally as a dependency; spawned
on demand through `npx`, same pattern as the filesystem MCP server).

1. Create an integration at https://www.notion.so/profile/integrations
   and copy its "Internal Integration Secret" (starts with `ntn_` or `secret_`).
2. Open the Notion page you want reports saved under, click **"..." → Connections**,
   and add your integration so it has access. This step is required — a valid
   token alone is not enough, the target page must be explicitly shared.
3. Copy that page's ID: it's the 32-character string in the page URL
   (with or without dashes both work).
4. Fill in `.env`:
   ```
   NOTION_TOKEN=your_notion_integration_token_here
   NOTION_PARENT_PAGE_ID=your_notion_page_id_here
   ```
5. (Optional) inspect the exact tools/operations this MCP server exposes on
   your machine:
   ```
   node src/mcp/notionClient.js
   ```

With both env vars set, `graph.js` automatically registers the `notion_save_report`
tool and the agent will use it whenever you ask it to save/send a report to Notion.
Leave them blank and the agent runs exactly as before, filesystem-only.

## How it works

1. You ask a question in the CLI.
2. The LLM (via LangGraph's ReAct loop) decides which tool(s) to call:
   - `search_internal_docs` for anything that might be in your internal docs (RAG/FAISS)
   - `web_search` for current/external info (Tavily)
   - `calculator` for any math
3. Once it has enough information, it drafts an answer/report and calls
   `mcp_write_file` (via the MCP filesystem server) to save it under
   `output/reports/`, and `notion_save_report` too if Notion is configured
   and the user asked for it.
4. It replies in the chat and tells you the filename (and/or Notion page) it saved.

## Debugging MCP

To see exactly what tools/schemas the filesystem MCP server exposes on your
machine:
```
node src/mcp/filesystemClient.js
```

To do the same for the Notion MCP server (requires `NOTION_TOKEN` set):
```
node src/mcp/notionClient.js
```
