import fs from "node:fs";
import path from "node:path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Document } from "@langchain/core/documents";
import { LocalEmbeddings } from "./embeddings.js";
import { CONFIG } from "../config.js";

function chunkText(text, chunkSize = 800, overlap = 100) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end === text.length) break;
    start += chunkSize - overlap;
  }
  return chunks;
}

async function loadFileText(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".pdf") {
    // NOTE: import "pdf-parse" (its index.js) directly and it throws
    // ENOENT looking for test/data/05-versions-space.pdf -- that's a known
    // upstream bug where a leftover self-test block at the top of index.js
    // runs whenever Node's CJS/ESM interop leaves `module.parent` unset.
    // Importing the inner lib file skips that debug block entirely.
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    return data.text;
  }
  return fs.readFileSync(filePath, "utf-8");
}

async function main() {
  const docsDir = CONFIG.docsDir;

  if (!fs.existsSync(docsDir)) {
    console.error(`Docs directory not found: ${docsDir}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(docsDir)
    .filter((f) => !f.startsWith(".") && f.toLowerCase() !== "readme.md")
    .filter((f) =>
      [".md", ".txt", ".pdf"].includes(path.extname(f).toLowerCase()),
    );

  if (files.length === 0) {
    console.error(
      `No .md, .txt, or .pdf files found in ${docsDir}. Add some documents first.`,
    );
    process.exit(1);
  }

  const documents = [];
  for (const file of files) {
    const filePath = path.join(docsDir, file);
    console.log(`Loading ${file}...`);
    const text = await loadFileText(filePath);
    const chunks = chunkText(text);
    chunks.forEach((chunk, i) => {
      documents.push(
        new Document({
          pageContent: chunk,
          metadata: { source: file, chunk: i },
        }),
      );
    });
  }

  console.log(
    `Embedding ${documents.length} chunks locally (first run downloads the embedding model, ~90MB)...`,
  );
  const embeddings = new LocalEmbeddings();
  const store = await FaissStore.fromDocuments(documents, embeddings);

  fs.mkdirSync(CONFIG.faissIndexDir, { recursive: true });
  await store.save(CONFIG.faissIndexDir);

  console.log(
    `Done. FAISS index saved to ${CONFIG.faissIndexDir} (${documents.length} chunks from ${files.length} files).`,
  );
}

main().catch((err) => {
  console.error("Ingest failed:", err);
  process.exit(1);
});
