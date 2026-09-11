import "dotenv/config";

export const CONFIG = {
  tavilyApiKey: process.env.TAVILY_API_KEY,
  docsDir: process.env.DOCS_DIR || "./docs",
  faissIndexDir: process.env.FAISS_INDEX_DIR || "./data/faiss_index",
  reportsDir: process.env.REPORTS_DIR || "./output/reports",
  notionToken: process.env.NOTION_TOKEN,
  notionParentPageId: process.env.NOTION_PARENT_PAGE_ID,
};

export function assertRequiredEnv() {
  const missing = [];
  if (!CONFIG.tavilyApiKey) missing.push("TAVILY_API_KEY");
  if (missing.length) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill them in.`,
    );
  }
}

export function notionConfigured() {
  return Boolean(CONFIG.notionToken && CONFIG.notionParentPageId);
}
