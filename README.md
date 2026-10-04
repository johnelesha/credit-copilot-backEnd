# Credit Copilot Lite

Grounded RAG assistant for personal loan underwriting at **Delta Commercial Bank** (synthetic data only).

Nothing in this project is real lending policy or financial advice.

---

## Quick Start

### Requirements
- Node.js 18+
- MongoDB Atlas (free tier)

### 1. Install

```bash
cd backend
npm install

npm run seed:policy
npm run seed:applications
npm run seed:users


npm run dev
{
    API: http://localhost:3000
    Swagger: http://localhost:3000/api/docs
    Health: http://localhost:3000/health
}

Demo accounts:
Username          Password         Role                  Approve up to
loan_officer      loan123      Loan Officer                  0
credit_officer    credit123    Credit Officer             250,000 EGP
senior_officer    senior123    Senior Credit Officer      500,000 EGP


5-Minute Demo Path:

1. Login
POST /api/auth/login
{ "username": "credit_officer", "password": "credit123" }
Copy the token.

2. Cited policy answer
POST /api/ask
{ "question": "What is the maximum debt burden ratio?", "policyEdition": "CP-2025" }

3. Correct refusal
POST /api/ask
{ "question": "What is the bank policy on crypto-backed loans?" }

4. Edition difference
Same question with "policyEdition": "CP-2024" vs "CP-2025".

5. Assess application
POST /api/assess
Authorization: Bearer <token>
{ "applicationId": "APP-001" }
Expect instalment 8630.39, DBR 42.10%, recommendation approve.

6. Authority limit
POST /api/assessments/<runId>/approve
Authorization: Bearer <credit_officer_token>
→ AUTHORITY_LIMIT_EXCEEDED (300k > 250k).

7. Senior approval
Login as senior_officer / senior123 and approve.

8. Injection attempt
Assess APP-004 → must refer, not approve from the hidden instruction.

Scripts:
Command                      Description
npm run dev                  Start server
npm test                     Unit + pipeline tests
npm run eval                 15 evaluation cases
npm run seed:policy          Ingest policy docs
npm run seed:applications    Ingest application packs
npm run seed:users           Demo users
npm run seed:all             Policy + applications


## Frontend (optional UI)

A separate React app is available for the same API:

- Repo: https://github.com/johnelesha/credit-copilot-frontEnd
- Run backend on port 3000, then in the frontend folder: `npm install && npm run dev`
- UI: http://localhost:5173
