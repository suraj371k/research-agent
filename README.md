# Research Agent

A CLI research agent built with LangGraph. It answers questions using an internal-docs RAG search, live web search, and a calculator, then saves the final report to disk (and optionally Notion) via MCP.

## Stack

- **LLM**: Ollama (local), currently `qwen2.5:7b`
- **Orchestration**: LangGraph.js (`createReactAgent`)
- **Web search**: Tavily API
- **RAG**: local embeddings (`@xenova/transformers`) + FAISS vector store
- **MCP tools**: `@modelcontextprotocol/server-filesystem` (save/read/list reports), and optionally `notion-mcp-server` for saving reports as Notion pages

## Prerequisites

- Node.js 20+
- [Ollama](https://ollama.com) installed and running locally, with the model pulled:
  ```
  ollama pull qwen2.5:7b
  ```
- A free [Tavily](https://tavily.com) API key

## Setup

1. Install dependencies:
   ```
   npm install
   ```
2. Copy `.env.example` to `.env` and fill in `TAVILY_API_KEY`.
3. Add reference material to `docs/`, then build the RAG index:
   ```
   npm run ingest
   ```
4. Start the agent:
   ```
   npm start
   ```

## Notion integration (optional)

To let the agent save reports straight to a Notion page:

1. Create an integration at [notion.so/profile/integrations](https://www.notion.so/profile/integrations) and copy its secret.
2. Share the target Notion page with that integration (page → "..." → Connections).
3. Add to `.env`:
   ```
   NOTION_TOKEN=...
   NOTION_PARENT_PAGE_ID=...
   TAVILY_API_KEY=...
   ```

Leave these blank and the agent runs filesystem-only.

## How it works

1. You ask a question in the CLI.
2. The agent decides which tools to use: `search_internal_docs` (RAG), `web_search` (Tavily), and/or `calculator`.
3. It drafts an answer and saves it as a markdown report via `mcp_write_file` under `output/reports/`, and to Notion via `notion_save_report` if configured and requested.
4. It replies in the chat with the filename (and/or Notion link) it saved.

## Project structure

```
src/
├── index.js         CLI entry point
├── graph.js         Agent, system prompt, tool registration
├── llm.js           Ollama client
├── config.js        Env var loading
├── tools/           search_internal_docs, web_search, calculator, mcp_write_file, mcp_read_file, mcp_list_files, notion_save_report
├── rag/             Embeddings, FAISS vector store, doc ingestion
└── mcp/             MCP stdio clients for the filesystem and Notion servers
```

## Debugging MCP

Check what tools each MCP server exposes on your machine:
```
node src/mcp/filesystemClient.js
node src/mcp/notionClient.js
```
