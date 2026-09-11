import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";
import path from "node:path";
import { callMcpTool, REPORTS_DIR } from "../mcp/filesystemClient.js";

function extractText(result) {
  return result?.content?.[0]?.text ?? JSON.stringify(result);
}
function toAbsolute(filename) {
  return path.join(REPORTS_DIR, filename);
}

export const mcpWriteFileTool = new DynamicStructuredTool({
  name: "mcp_write_file",
  description:
    "Save text content to a file in the reports output directory via the MCP filesystem server. " +
    "Use this to save the final drafted research report (e.g. filename 'report.md').",
  schema: z.object({
    filename: z.string().describe("File name, e.g. report.md"),
    content: z.string().describe("Full text content to write"),
  }),
  func: async ({ filename, content }) => {
    await callMcpTool("write_file", { path: toAbsolute(filename), content });
    return `Saved '${filename}' via MCP filesystem server.`;
  },
});

export const mcpReadFileTool = new DynamicStructuredTool({
  name: "mcp_read_file",
  description:
    "Read a previously saved report file from the reports output directory via the MCP filesystem server.",
  schema: z.object({
    filename: z.string().describe("File name to read, e.g. report.md"),
  }),
  func: async ({ filename }) => {
    const result = await callMcpTool("read_text_file", {
      path: toAbsolute(filename),
    });
    return extractText(result);
  },
});

export const mcpListFilesTool = new DynamicStructuredTool({
  name: "mcp_list_files",
  description:
    "List files currently saved in the reports output directory via the MCP filesystem server.",
  schema: z.object({}),
  func: async () => {
    const result = await callMcpTool("list_directory", { path: REPORTS_DIR });
    return extractText(result);
  },
});
