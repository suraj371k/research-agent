import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { CONFIG, notionConfigured } from "../config.js";

let clientInstance = null;

// Resolve the locally installed package's entry point directly instead of
// going through `npx` (same fix as filesystemClient.js -- npx does a
// registry check + npx.cmd shell resolution on every cold start on Windows,
// which is slow and was a source of "stuck" requests).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const NOTION_SERVER_ENTRY = path.resolve(
  __dirname,
  "../../node_modules/notion-mcp-server/build/index.js",
);

export async function getNotionMcpClient() {
  if (!notionConfigured()) {
    throw new Error(
      "Notion is not configured. Set NOTION_TOKEN and NOTION_PARENT_PAGE_ID in .env first.",
    );
  }

  if (clientInstance) return clientInstance;

  if (!fs.existsSync(NOTION_SERVER_ENTRY)) {
    throw new Error(
      `Notion MCP server not found at ${NOTION_SERVER_ENTRY}. ` +
        `Run "npm install" to make sure notion-mcp-server is installed.`,
    );
  }

  const transport = new StdioClientTransport({
    command: process.execPath, // absolute path to the current node binary
    args: [NOTION_SERVER_ENTRY],
    env: {
      ...process.env,
      NOTION_TOKEN: CONFIG.notionToken,
    },
  });

  const client = new Client(
    { name: "research-agent", version: "1.0.0" },
    { capabilities: {} },
  );
  await client.connect(transport);

  clientInstance = client;
  return client;
}

export async function listMcpTools() {
  const client = await getNotionMcpClient();
  const { tools } = await client.listTools();
  return tools;
}

export async function callMcpTool(name, args) {
  const client = await getNotionMcpClient();
  const result = await client.callTool({ name, arguments: args });
  if (result?.isError) {
    const text = result?.content?.[0]?.text ?? "Unknown MCP error";
    throw new Error(`MCP tool '${name}' failed: ${text}`);
  }
  return result;
}

if (process.argv[1] && process.argv[1].endsWith("notionClient.js")) {
  const tools = await listMcpTools();
  console.log(JSON.stringify(tools, null, 2));
  process.exit(0);
}
