import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding, generateReply } from "./gemini";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(express.json());

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error(
    "Supabase URL and Anon Key must be provided in environment variables"
  );
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Gmail Reply Assistant API ready" });
});

app.post("/api/ingest", async (req, res) => {
  try {
    const { companyName, emails } = req.body;

    const rows = [];
    for (const email of emails) {
      const emb = await generateEmbedding(email);
      rows.push({
        company_name: companyName,
        text_snippet: email,
        embedding: emb,
      });
    }

    const { data, error } = await supabase
      .from("company_emails")
      .insert(rows)
      .select();
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {
      return res
        .status(500)
        .json({ error: "db_insert_failed", details: error });
    }

    return res.json({ ok: true, inserted: data.length });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

app.post("/api/generate-reply", async (req, res) => {
  try {
    const { companyName, body } = req.body;

    if (!companyName || !body) {
      return res
        .status(400)
        .json({ error: "companyName and bodyText are required" });
    }

    // 1. embed incoming
    const queryEmbedding = await generateEmbedding(body);

    // 2. call RPC to get top-K similar examples
    // Supabase RPC signature: match_company_emails(c_name text, q_embedding vector, k int)

    const { data: neighbors, error: rpcErr } = await supabase.rpc(
      "match_company_emails",
      {
        c_name: companyName,
        q_embedding: queryEmbedding,
        k: 5,
      }
    );

    if (rpcErr) {
      return res.status(500).json({ error: "rpc_failed", details: rpcErr });
    }

    // neighbors: array of { id, text_snippet, distance }
    const snippets: string[] = (neighbors || []).map(
      (n: any) => n.text_snippet
    );

    // 3. call LLM with examples
    const reply = await generateReply(body, companyName, snippets);

    // 4. return reply + optionally the snippets used
    return res.json({ reply, snippets });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Gmail Reply Assistant API ready`);
});
