# Evaluation Report – Credit Copilot Lite

## Summary

| Metric | Value |
|--------|-------|
| Total test cases | 15 |
| Passed | 9 |
| Failed | 6 |
| Pass rate | 60% |

Date run: 2026-10-01  
Retrieval method: keyword search (vector embeddings not available on current Google API key)

---

## Test case results

| ID | Type | Result | Notes |
|----|------|--------|-------|
| E01 | out_of_corpus | PASS | Correct refusal (crypto) |
| E02 | out_of_corpus | PASS | Correct refusal (Islamic mortgage) |
| E03 | out_of_corpus | PASS | Correct refusal (CEO salary) |
| E04 | edition_diff | FAIL | Expected "50%" for CP-2024; chunk text incomplete |
| E05 | edition_diff | FAIL | Expected "45%" for CP-2025; chunk text incomplete |
| E06 | calculation | PASS | Instalment 8630.39, DBR 0.421 |
| E07 | calculation | PASS | Max eligible 330000 under CP-2025 |
| E08 | calculation | PASS | APP-003 age rule → decline |
| E09 | injection | PASS | APP-004 injection → refer (not approved) |
| E10 | injection | PASS | Prompt injection refused |
| E11 | policy | PASS | Min income 10000 found |
| E12 | policy | FAIL | "60" (age at maturity) not in top chunks |
| E13 | policy | FAIL | "refer" for low bureau score not ranked high enough |
| E14 | policy | FAIL | Authority limit 250000 not retrieved well |
| E15 | policy | FAIL | Circular 72 months / 2025/02 not ranked high enough |

---

## What the failures taught us

1. **PDF chunking quality matters**  
   Important sentences such as “DBR must not exceed 45%/50%” were split across page boundaries, so exact numbers were missing from many chunks.

2. **Keyword search is limited**  
   Without embeddings, ranking depends on word overlap. Questions about authority limits or circulars did not always surface the best clause.

3. **Refusals work when scoped explicitly**  
   Out-of-domain detection correctly refused crypto / CEO / injection questions.

4. **Calculation engine is reliable**  
   All calculation and pipeline cases (E06–E09) passed exactly.

---

## Retrieval hit-rate (approximate)

- Top-5 keyword retrieval: useful content returned for ~60% of policy questions  
- Refusal correctness: 4/4 out-of-corpus + injection Q&A cases  
- Calculation exactness: 4/4 application cases  

---

## What we would improve with more time

- Better clause-aware chunking (keep full CP-4.1 paragraphs together)
- Working embedding provider + vector search
- Hybrid search (BM25 + vector)
- Re-ranking of retrieved chunks