import { GoogleGenerativeAI } from "@google/generative-ai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

const genAi = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "demo_key");

export const generateEmbedding = async (text: string): Promise<number[]> => {
  const model = genAi.getGenerativeModel({ model: "embedding-001" });
  const result = await model.embedContent(text);
  return result.embedding.values;
};

export const generateReply = async (
  incomingText: string,
  companyName: string,
  companyExamples: string[]
): Promise<string> => {
  const examplesContext =
    companyExamples.length > 0
      ? companyExamples
          .map((example, index) => `${index + 1}. ${example}`)
          .join("\n")
      : "";

  const promptTemplate = PromptTemplate.fromTemplate(`
        You are an email assistant for {companyName}. Write a professional reply that matches the company's communication style.
        
        INCOMING EMAIL:
        "{incomingText}"
        
        COMPANY EMAIL EXAMPLES (match this tone and style):
        {examplesContext}
        
        INSTRUCTIONS:
        - Write a professional, helpful reply
        - Match the tone and style from the company examples above
        - Keep it concise (2-3 sentences)
        - Be helpful and solution-oriented
        - Use similar language patterns and phrases from the examples
        - Don't copy exactly, but capture the same professional tone
        
        REPLY:`);

  const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash",
    temperature: 0.7,
    maxOutputTokens: 200,
  });

  const chain = promptTemplate.pipe(model).pipe(new StringOutputParser());

  const result = await chain.invoke({
    incomingText,
    companyName,
    examplesContext,
  });

  return result || "Thank you for your email. I will get back to you shortly.";
};
