import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import dotenv from "dotenv";
import { HuggingFaceInferenceEmbeddings } from "@langchain/community/embeddings/hf";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

dotenv.config();
const hfApiKey = process.env.HUGGINGFACE_API_KEY;

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is missing");

export const generateEmbedding = async (text: string): Promise<number[]> => {
  try {
    const embeddings = new HuggingFaceInferenceEmbeddings({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      apiKey: hfApiKey,
      maxRetries: 0,
    });

    console.log("Generating embedding...");
    console.log("Text:", text);
    const result = await embeddings.embedQuery(text);
    console.log("Embedding generated successfully, length:", result.length);
    return result;
  } catch (error: any) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

export const generateReply = async (
  incomingText: string,
  companyName: string,
  companyExamples: string[]
): Promise<string> => {
  if (incomingText.length === 0) {
    return "Thank you for your email. I will get back to you shortly.";
  }

  const examplesContext =
    companyExamples.length > 0
      ? companyExamples.map((example, i) => `${i + 1}. ${example}`).join("\n")
      : "";

  const promptTemplate = PromptTemplate.fromTemplate(`
    You are a professional email assistant for {companyName}.
    Please write a professional email reply to the following email:

    Email: "{incomingText}"

    {examplesBlock}

    INSTRUCTIONS:
    - Keep reply concise (2-3 sentences).
    - Match tone & style of company examples if provided.
    - Be polite, professional, and solution-oriented.

    Reply:`);

  let result: string | null = null;

  const chain = promptTemplate
    .pipe(
      new ChatGoogleGenerativeAI({
        model: "gemini-2.0-flash-exp",
        apiKey: apiKey,
        maxOutputTokens: 200,
        temperature: 0.7,
        maxRetries: 0,
      })
    )
    .pipe(new StringOutputParser());

  const timeoutPromise = new Promise<string>((_, reject) =>
    setTimeout(() => reject(new Error("Request timeout")), 30000)
  );

  result = await Promise.race([
    chain.invoke({
      incomingText,
      companyName,
      examplesBlock: examplesContext
        ? `Here are some examples of our company's communication style:\n${examplesContext}`
        : "",
    }),
    timeoutPromise,
  ]);
  console.log(result);

  if (!result || result.trim().length === 0) {
    // Error or empty result
    return `Thank you for your email. I'll review this and get back to you shortly.\n\nBest regards,\n[Your Name]`;
  }

  return result.trim();
};
