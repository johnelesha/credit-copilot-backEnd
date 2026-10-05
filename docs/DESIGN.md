# Design – Credit Copilot Lite

This document explains the main design decisions for the backend.

## Architecture

Client (Postman / Swagger / React UI)
│
▼
Express API
(/api/ask, /api/assess, /api/assessments/..., /api/auth/login)
│
├── Auth (JWT + roles)
│
├── Application layer
│     ├── askQuestion
│     └── assessApplication (fixed 8-step pipeline)
│
├── Domain (pure – no Express/Mongoose/LLM imports)
│     ├── calculations (instalment, DBR, max eligible)
│     ├── rules
│     ├── policyEdition
│     └── protected attributes stripper
│
└── Infrastructure
├── MongoDB (policy_chunks, applications, assessments, users)
├── Ingestion (PDF/MD → clause chunks)
├── Retrieval (keyword search; vector interface ready)
└── LLM adapters (FakeExtractor; real provider later)


Domain code does not import Express, Mongoose, or LLM libraries.

---

## Chunking choice

- Split mainly on clause markers: `CP-4.1`, `PM-2`, `C-1`, `PS-3`, …
- Each chunk stores: `chunkId`, `sourceFile`, `clauseId`, `policyEdition`, `effectiveFrom`, `content`
- Idempotent upsert by `chunkId`

**Why:** answers must cite stable policy clauses, not arbitrary character windows.

**Limitation:** some PDF page breaks split important sentences (e.g. exact 45%/50% DBR text), which reduced retrieval quality for a few evaluation cases.

---

## Policy edition selection

Pure function on application date (no LLM):

- Before 1 March 2025 → `CP-2024` (DBR ≤ 50%, min income 8,000)
- On/after 1 March 2025 → `CP-2025` (DBR ≤ 45%, min income 10,000)

---

## Keeping the LLM away from arithmetic

- Instalment, DBR, and maximum eligible amount are computed only in `domain/calculations.ts`
- Unit tests lock the worked example numbers (instalment 8630.39, DBR 0.4210, max eligible under 50% DBR = 382,000)
- Extracted values are verified against cited text; failure → `UnverifiedExtraction` → refer to human

---

## Protected attributes

- Removed in code before rules or any LLM call
- Fields: gender, religion, marital_status / maritalStatus, nationality
- Fairness test proves changing only these fields does not change recommendation or numbers

---

## How applications enter the system

The five packs are loaded by `npm run seed:applications` into an untrusted store.  
The API/UI selects an existing `applicationId` (APP-001 … APP-005).  
Application text is never indexed as policy.

---

## Current LLM usage

- **Live assessment extraction:** `FakeExtractor` (deterministic, no API key, used in tests and demo).
- **Memo:** built in code from rule results and calculated numbers (not free-form LLM prose).
- **Embeddings / vector search:** interface exists; live path is keyword search because the free Google key did not expose embedding models (see EVALUATION.md).
- A real extractor (e.g. Google / OpenAI) would implement the same interface and be selected via env; domain and pipeline code stay unchanged.

---

## Switching the LLM / embedding provider

1. Implement the existing interface in `infrastructure/llm/`
2. Add one new adapter class
3. Change env/config only — no domain or pipeline edits

---

## What was left out on purpose

- Production vector search (provider limitation; keyword search is the live path)
- Docker Compose and formal SQL-style migrations (MongoDB + seed scripts instead)
- Hybrid BM25 + vector and re-ranking (stretch)
- Fancy free-form credit-memo wording (structured memo from code is enough)
- Token/cost tracking per user

## What we would add with more time

- Better PDF clause reconstruction so exact policy numbers stay in one chunk
- Working embeddings + hybrid retrieval, with before/after eval numbers
- Real LLM extractor behind the same interface (keep FakeExtractor for offline tests)
- Token and cost tracking per user
- Optional: offer letter PDF after status becomes Issued