import { ChatOllama } from "@langchain/ollama";

export function createLLM() {
  return new ChatOllama({
    model: "qwen2.5:7b",
    temperature: 0.3,
  });
}
