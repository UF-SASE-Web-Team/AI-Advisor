-- already enabled earlier:
create extension if not exists vector;

-- 1) RAG chunks (policies, advising docs, FAQ, etc.)
create table if not exists rag_chunks (
  id uuid primary key default gen_random_uuid(),
  doc_id text not null,
  chunk_index int not null,
  content text not null,
  metadata jsonb default '{}'::jsonb,
  embedding vector(1536) not null,     -- match your embed dim
  created_at timestamptz default now()
);

create or replace function rag_search_cosine(query_vec vector, match_count int, jfilter jsonb default '{}'::jsonb)
returns table(id uuid, doc_id text, chunk_index int, content text, metadata jsonb, score float)
language sql
stable
as $$
  select c.id, c.doc_id, c.chunk_index, c.content, c.metadata,
         1 - (c.embedding <=> query_vec) as score
  from rag_chunks c
  where (jfilter ? 'program'  is false or c.metadata->>'program'  = jfilter->>'program')
    and (jfilter ? 'campus'   is false or c.metadata->>'campus'   = jfilter->>'campus')
    and (jfilter ? 'catalog'  is false or c.metadata->>'catalog'  = jfilter->>'catalog')
  order by c.embedding <=> query_vec
  limit match_count;
$$;

-- 2) Courses table (each row = a course)
create table if not exists courses (
  id uuid primary key default gen_random_uuid(),
  code text not null,               -- e.g., "CS 225"
  title text not null,
  description text not null,
  credits int not null default 3,
  level text default 'undergrad',   -- 'undergrad' | 'grad'
  tags text[] default '{}',         -- e.g., {'systems','theory'}
  prerequisites jsonb default '[]'::jsonb, -- e.g., [{"all_of":["CS 125"]},{"any_of":["MATH 231","MATH 241"]}]
  offered_terms text[] default '{fall,spring}', -- e.g., {'fall','spring'}
  program text default 'CS',
  campus text default 'main',
  catalog text default '2024-2025',
  embedding vector(1536) not null
);

create index if not exists idx_courses_code on courses(code);
create index if not exists idx_courses_embedding on courses using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create or replace function course_search(query_vec vector, match_count int, jfilter jsonb default '{}'::jsonb)
returns table(id uuid, code text, title text, description text, credits int, tags text[], prerequisites jsonb, offered_terms text[], program text, campus text, catalog text, score float)
language sql
stable
as $$
  select c.id, c.code, c.title, c.description, c.credits, c.tags, c.prerequisites, c.offered_terms,
         c.program, c.campus, c.catalog,
         1 - (c.embedding <=> query_vec) as score
  from courses c
  where (jfilter ? 'program' is false or c.program = jfilter->>'program')
    and (jfilter ? 'campus'  is false or c.campus  = jfilter->>'campus')
    and (jfilter ? 'catalog' is false or c.catalog = jfilter->>'catalog')
    and (jfilter ? 'level'   is false or c.level   = jfilter->>'level')
  order by c.embedding <=> query_vec
  limit match_count;
$$;
