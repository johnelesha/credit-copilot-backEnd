# Design – Credit Copilot Lite

This document explains the main design decisions for the backend.

Client (Postman / Swagger)
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
- Unit tests lock the worked example numbers
- Extracted values are verified against cited text; failure → `UnverifiedExtraction` → refer to human

---

## Protected attributes

- Removed in code before rules or any LLM call
- Fields: gender, religion, marital_status / maritalStatus, nationality
- Fairness test proves changing only these fields does not change recommendation or numbers

---

## Switching the LLM / embedding provider

1. Implement the existing interface in `infrastructure/llm/`
2. Add one new adapter class
3. Change env/config only — no domain or pipeline edits

Vector search is implemented behind an interface. The current Google API key does not expose embedding models, so the live path uses improved keyword search.

---

## What was left out on purpose

- Production vector search (provider limitation)
- Polished UI (API + Swagger first)
- Fancy credit-memo wording (structured memo from code is enough)
- Hybrid BM25 + vector, re-ranking (stretch)

## What we would add with more time

- Better PDF clause reconstruction
- Working embeddings + hybrid retrieval
- Full OpenAPI coverage for every route
- Minimal web UI for assess / approve
- Token and cost tracking per user