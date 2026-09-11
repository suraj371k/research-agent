import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { CONFIG } from "../config.js";

let clientInstance = null;

export const REPORTS_DIR = path.resolve(CONFIG.reportsDir);

// Resolve the locally installed package's entry point directly instead of
// going through `npx`. `npx` does a registry check + shell resolution
// (npx.cmd on Windows) on every cold start, which was slow and, combined
// with the local Ollama model taking a while to respond, made the very
// first tool call in a session look "stuck". Spawning `node` on the file
// directly skips all of that.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FILESYSTEM_SERVER_ENTRY = path.resolve(
  __dirname,
  "../../node_modules/@modelcontextprotocol/server-filesystem/dist/index.js",
);

export async function getFilesystemMcpClient() {
  if (clientInstance) return clientInstance;

  fs.mkdirSync(REPORTS_DIR, { recursive: true });

  if (!fs.existsSync(FILESYSTEM_SERVER_ENTRY)) {
    throw new Error(
      `MCP filesystem server not found at ${FILESYSTEM_SERVER_ENTRY}. ` +
        `Run "npm install" to make sure @modelcontextprotocol/server-filesystem is installed.`,
    );
  }

  const transport = new StdioClientTransport({
    command: process.execPath, // absolute path to the current node binary
    args: [FILESYSTEM_SERVER_ENTRY, REPORTS_DIR],
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
  const client = await getFilesystemMcpClient();
  const { tools } = await client.listTools();
  return tools;
}

export async function callMcpTool(name, args) {
  const client = await getFilesystemMcpClient();
  const result = await client.callTool({ name, arguments: args });
  if (result?.isError) {
    const text = result?.content?.[0]?.text ?? "Unknown MCP error";
    throw new Error(`MCP tool '${name}' failed: ${text}`);
  }
  return result;
}

if (process.argv[1] && process.argv[1].endsWith("filesystemClient.js")) {
  const tools = await listMcpTools();
  console.log(JSON.stringify(tools, null, 2));
  process.exit(0);
}
