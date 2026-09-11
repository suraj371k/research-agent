import fs from "node:fs";
import path from "node:path";
import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { LocalEmbeddings } from "./embeddings.js";
import { CONFIG } from "../config.js";

// Returns null if no index has been built yet (caller should prompt to run `npm run ingest`)
export async function loadOrCreateVectorStore() {
  const embeddings = new LocalEmbeddings();
  const indexFile = path.join(CONFIG.faissIndexDir, "faiss.index");

  if (fs.existsSync(indexFile)) {
    return FaissStore.load(CONFIG.faissIndexDir, embeddings);
  }
  return null;
}

export async function saveVectorStore(store) {
  fs.mkdirSync(CONFIG.faissIndexDir, { recursive: true });
  await store.save(CONFIG.faissIndexDir);
}
