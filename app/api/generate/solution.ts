import axios from "axios"
import { withTimeout, type ProblemInfo } from "../config"

// Helper function to clean markdown code blocks from response
function cleanCodeFromMarkdown(content: string): string {
  // Remove markdown code blocks if present
  return content.replace(/^```[\w]*\n/, "").replace(/\n```$/, "")
}

export async function generateSolution(
  problemInfo: ProblemInfo,

  openaiApiKey?: string
): Promise<string> {
  if (!openaiApiKey) {
    throw new Error("OpenAI API key is required")
  }

  console.log("Starting OpenAI solution generation...")

  const promptContent = `You are a Python code generator. Your task is to generate a valid Python solution for the following problem.
IMPORTANT: Return ONLY the Python code solution. No explanations, no markdown formatting, no additional text.

PROBLEM DETAILS:
---------------
Problem Statement:
${problemInfo.problem_statement ?? "None"}

Input Format:
${problemInfo.input_format?.description ?? "None"}

Parameters:
${
  problemInfo.input_format?.parameters
    ?.map((p) => {
      let typeStr = p.type
      if (p.subtype) typeStr += ` of ${p.subtype}`
      typeStr += p.nullable ? " | None" : " (required)"
      return `- ${p.name}: ${typeStr}`
    })
    .join("\n") ?? "No parameters"
}

Output Format:
${problemInfo.output_format?.description ?? "None"}
Returns: ${problemInfo.output_format?.type ?? "None"}${
    problemInfo.output_format?.subtype
      ? ` of ${problemInfo.output_format.subtype}`
      : ""
  }${problemInfo.output_format?.nullable ? " | None" : " (never None)"}

Constraints:
${
  problemInfo.constraints
    ?.map((c) => {
      let constraintStr = `- ${c.description}`
      if (c.range) {
        constraintStr += ` (${c.parameter}: ${c.range.min} to ${c.range.max})`
      }
      if (c.nullable !== undefined) {
        constraintStr += c.nullable ? " (can be None)" : " (cannot be None)"
      }
      return constraintStr
    })
    .join("\n") ?? "No constraints"
}

Test Cases:
${JSON.stringify(problemInfo.test_cases ?? [], null, 2)}`

  const response = await withTimeout(
    axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "o1-mini",
        messages: [
          {
            role: "user",
            content:
              "You are a Python code generator that only outputs valid Python code solutions. You should use a minimal amount of external libraries, and you should be writing code that is legible and the optimal solution in terms of time and space complexity. It is very important that this code is legible and understandable, so add comments next to relevant places in the code that explain what the code does. Absolutely no markdown. Write your answer in the style of a solution to a Leetcode problem." +
              promptContent
          }
        ]
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiApiKey}`
        }
      }
    )
  )

  if (!response.data?.choices?.[0]?.message?.content) {
    throw new Error("Invalid response from OpenAI API")
  }

  return cleanCodeFromMarkdown(response.data.choices[0].message.content)
}
