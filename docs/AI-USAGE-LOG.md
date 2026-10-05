# AI Usage Log – Credit Copilot Lite

## Rules
- Record every significant use of AI tools.
- Note what the AI suggested, what I accepted, and any mistakes the AI made.

---

### 2026-09-29

**Tool:** Grok / Copilot 
**What I asked:**  
Help bootstrap Node + Express + MongoDB Atlas project structure and calculation engine.

**What AI provided:**  
- Project folder structure  
- Calculation formulas (instalment, DBR, max eligible amount)  
- Policy edition selector  
- Rules engine skeleton  
- Unit tests for the worked example

**What I wrote / changed myself:**  
- Connected and debugged MongoDB Atlas connection (DNS / Legacy URI issues)  
- Verified all calculation numbers match the brief  
- Adjusted file locations and ran tests

**AI mistakes found:**  
- Initially suggested a complex monorepo + many folders that caused confusion.  
- Had to switch to Legacy connection string because of Windows DNS (querySrv) problem.

**Lesson:**  
Always test the real Atlas connection early. Keep the first version minimal.



### 2026-10-01

**Tool:** Grok  
**What I asked:**  
Day 3–4 pipeline, JWT auth, approval authority limits, evaluation runner, README/DESIGN structure.

**What AI provided:**  
- Assessment pipeline skeleton with FakeExtractor  
- Approval routes and authority limits  
- JWT login/middleware pattern  
- Evaluation test-case list and runner  
- Draft README and DESIGN outlines  

**What I wrote / changed myself:**  
- Debugged MongoDB Atlas connection (Legacy URI)  
- Fixed exactOptionalPropertyTypes issues throughout  
- Verified calculation numbers against the brief  
- Ran and interpreted evaluation (9/15), wrote failure analysis  
- Merged feature branches to main  

**AI mistakes found:**  
- Suggested Google `text-embedding-004` / `embedding-001` which returned 404 on this API key  
- Initial max-eligible expectation used 50% DBR for a 2025 application (should be 45% → 330000)  
- Some route/middleware placement examples needed adjustment for Express mounting  

**Lesson:**  
Always validate provider model availability early; keep domain math in pure tested functions; record real eval numbers honestly.



### 2026-10-03 / 2026-10-04

**Tool:** Grok  
**What I asked:**  
React + Vite + Tailwind frontend structure; login, assess, ask pages; shared layout.

**What AI provided:**  
- Folder layout and API client pattern  
- Auth context split (provider / hook)  
- Assess page with rules, steps, approval actions  
- Ask page with citations and refusal display  

**What I wrote / changed myself:**  
- Wired pages to the real backend  
- Verified APP-001 / APP-003 / authority limit / senior approve in the UI  
- Replaced free-text application id with a fixed dropdown  
- Extracted shared Header + Layout  
- Confirmed only FakeExtractor apps return full calculations (others correctly refer)  

**AI mistakes found:**  
- Early FormEvent typing warning on React types  
- Suggested optional form components (LoginForm/AskForm) that were unnecessary for this size of app  

**Lesson:**  
Keep the UI thin over a working API; fixed demo data (APP-001…005) is clearer than free text for the assessment task.