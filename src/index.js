import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { HumanMessage } from "@langchain/core/messages";
import { assertRequiredEnv } from "./config.js";
import { buildAgent } from "./graph.js";

async function main() {
  assertRequiredEnv();

  console.log("Type a research question, or 'exit' to quit.\n");

  const agent = await buildAgent();
  const rl = readline.createInterface({ input, output });

  while (true) {
    const question = await rl.question("You: ");
    if (["exit", "quit"].includes(question.trim().toLowerCase())) break;
    if (!question.trim()) continue;

    try {
      const result = await agent.invoke({
        messages: [new HumanMessage(question)],
      });
      const last = result.messages[result.messages.length - 1];
      console.log(`\nAgent: ${last.content}\n`);
    } catch (err) {
      console.error("Error:", err.message);
    }
  }

  rl.close();
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
