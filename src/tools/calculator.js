import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod";

export const calculatorTool = new DynamicStructuredTool({
  name: "calculator",
  description:
    "Evaluate a basic arithmetic expression. Use this for any math (percentages, totals, averages) " +
    "found while researching, instead of doing it in your head.",
  schema: z.object({
    expression: z
      .string()
      .describe("A math expression using only numbers and + - * / ( )"),
  }),
  func: async ({ expression }) => {
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
      return "Error: expression contains disallowed characters.";
    }
    try {
      const result = Function(`"use strict"; return (${expression});`)();
      return String(result);
    } catch (err) {
      return `Error evaluating expression: ${err.message}`;
    }
  },
});
