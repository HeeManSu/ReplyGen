-- Ensure the pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;


-- Table to store company text snippets + embeddings
create table if not exists company_emails (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  text_snippet text not null,
  embedding vector(768),
  created_at timestamptz default now()
);


-- Index to speed up similarity searches
CREATE INDEX IF NOT EXISTS company_emails_hnsw_idx ON company_emails USING hnsw (embedding vector_cosine_ops);

-- Helper RPC to fetch top-k similar snippets for a company
create or replace function match_company_emails(c_name text, q_embedding vector, k int)
returns table(id uuid, text_snippet text, distance float) as $$
  select id, text_snippet, embedding <-> q_embedding as distance
  from company_emails
  where company_name = c_name
  order by distance
  limit k;
$$ language sql stable;





