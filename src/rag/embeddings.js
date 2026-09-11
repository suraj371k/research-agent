import { pipeline } from "@xenova/transformers";

let embedderPromise = null;

function getEmbedder() {
  if (!embedderPromise) {
    embedderPromise = pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedderPromise;
}

// Implements the LangChain Embeddings interface (embedQuery / embedDocuments)
export class LocalEmbeddings {
  async embedQuery(text) {
    const embedder = await getEmbedder();
    const output = await embedder(text, { pooling: "mean", normalize: true });
    return Array.from(output.data);
  }

  async embedDocuments(texts) {
    const embedder = await getEmbedder();
    const vectors = [];
    for (const text of texts) {
      const output = await embedder(text, { pooling: "mean", normalize: true });
      vectors.push(Array.from(output.data));
    }
    return vectors;
  }
}
