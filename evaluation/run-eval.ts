import { askQuestion } from "../src/application/askQuestion.js";
import { assessApplication } from "../src/application/assessApplication.js";
import { connectDB } from "../src/infrastructure/db/mongoose.js";
import { ApplicationModel } from "../src/infrastructure/db/models/Application.js";
import fs from "fs/promises";
import path from "path";

interface TestCase {
    id: string;
    type: string;
    question?: string;
    policyEdition?: "CP-2024" | "CP-2025";
    applicationId?: string;
    description?: string;
    expected: {
        shouldRefuse?: boolean;
        contains?: string[];
        monthlyInstalment?: number;
        debtBurdenRatio?: number;
        maximumEligibleAmount?: number;
        recommendation?: string;
        reason?: string;
        mustNotApproveFromInjection?: boolean;
        note?: string;
    };
}

async function main() {
    await connectDB();

    const filePath = path.join(process.cwd(), "evaluation", "test-cases.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const cases: TestCase[] = JSON.parse(raw);

    let passed = 0;
    let failed = 0;
    const results: { id: string; ok: boolean; detail: string }[] = [];

    console.log("\n===== Credit Copilot Evaluation =====\n");

    for (const tc of cases) {
        try {
            // ── Q&A cases ──────────────────────────────────────────────
            if (tc.question) {
                const answer = await askQuestion(tc.question, tc.policyEdition);

                if (tc.expected.shouldRefuse) {
                    const ok =
                        answer.reason === "no_chunk_above_threshold" ||
                        answer.citations.length === 0 ||
                        answer.answer
                            .toLowerCase()
                            .includes("do not contain enough information");

                    results.push({
                        id: tc.id,
                        ok,
                        detail: ok
                            ? "Correct refusal"
                            : `Expected refusal, got: ${answer.answer.slice(0, 80)}`,
                    });
                    ok ? passed++ : failed++;
                    continue;
                }

                if (tc.expected.contains) {
                    const text = (
                        answer.answer + JSON.stringify(answer.citations)
                    ).toLowerCase();
                    const ok = tc.expected.contains.some((c) =>
                        text.includes(c.toLowerCase()),
                    );
                    results.push({
                        id: tc.id,
                        ok,
                        detail: ok
                            ? `Found expected content`
                            : `Missing expected: ${tc.expected.contains.join(" | ")}`,
                    });
                    ok ? passed++ : failed++;
                    continue;
                }
            }

            // ── Calculation / application cases ────────────────────────
            if (tc.applicationId) {
                const app = await ApplicationModel.findOne({
                    applicationId: tc.applicationId,
                }).lean();
                if (!app) {
                    results.push({
                        id: tc.id,
                        ok: false,
                        detail: "Application not found in DB",
                    });
                    failed++;
                    continue;
                }

                // Use FakeExtractor path via assessApplication
                // For APP-001 / APP-003 we already have data in FakeExtractor
                const result = await assessApplication({
                    applicationId: tc.applicationId,
                    applicationDate:
                        tc.applicationId === "APP-003" ? "2025-04-10" : "2025-04-03",
                    dateOfBirth:
                        tc.applicationId === "APP-003" ? "1968-06-20" : "1987-04-12",
                    requestedAmount: tc.applicationId === "APP-003" ? 250000 : 300000,
                    requestedTenorMonths: 60,
                    rawText: app.rawText,
                });

                let ok = true;
                const details: string[] = [];

                if (tc.expected.monthlyInstalment !== undefined) {
                    const match =
                        result.calculation.monthlyInstalment ===
                        tc.expected.monthlyInstalment;
                    if (!match) {
                        ok = false;
                        details.push(
                            `instalment: got ${result.calculation.monthlyInstalment}, expected ${tc.expected.monthlyInstalment}`,
                        );
                    }
                }

                if (tc.expected.debtBurdenRatio !== undefined) {
                    const match =
                        Number(result.calculation.debtBurdenRatio.toFixed(4)) ===
                        tc.expected.debtBurdenRatio;
                    if (!match) {
                        ok = false;
                        details.push(
                            `DBR: got ${result.calculation.debtBurdenRatio}, expected ${tc.expected.debtBurdenRatio}`,
                        );
                    }
                }

                if (tc.expected.maximumEligibleAmount !== undefined) {
                    const match =
                        result.calculation.maximumEligibleAmount ===
                        tc.expected.maximumEligibleAmount;
                    if (!match) {
                        ok = false;
                        details.push(
                            `maxEligible: got ${result.calculation.maximumEligibleAmount}, expected ${tc.expected.maximumEligibleAmount}`,
                        );
                    }
                }

                if (tc.expected.recommendation !== undefined) {
                    const match = result.recommendation === tc.expected.recommendation;
                    if (!match) {
                        ok = false;
                        details.push(
                            `recommendation: got ${result.recommendation}, expected ${tc.expected.recommendation}`,
                        );
                    }
                }

                if (tc.expected.mustNotApproveFromInjection) {
                    // For APP-004: must not blindly approve from injection
                    // FakeExtractor doesn't have APP-004 → should refer
                    const okInjection =
                        result.recommendation === "refer" ||
                        result.recommendation === "decline";
                    if (!okInjection) {
                        ok = false;
                        details.push("Injection case should not approve");
                    }
                }

                results.push({
                    id: tc.id,
                    ok,
                    detail: ok ? "Passed" : details.join("; "),
                });
                ok ? passed++ : failed++;
                continue;
            }

            results.push({
                id: tc.id,
                ok: false,
                detail: "No handler for this case type",
            });
            failed++;
        } catch (err: any) {
            results.push({ id: tc.id, ok: false, detail: `Error: ${err.message}` });
            failed++;
        }
    }

    // ── Print report ─────────────────────────────────────────────────
    console.log("ID   | Result | Detail");
    console.log("-----|--------|-------");
    for (const r of results) {
        console.log(`${r.id} | ${r.ok ? "PASS" : "FAIL"}   | ${r.detail}`);
    }

    console.log("\n==============================");
    console.log(`Total  : ${cases.length}`);
    console.log(`Passed : ${passed}`);
    console.log(`Failed : ${failed}`);
    console.log(`Rate   : ${((passed / cases.length) * 100).toFixed(1)}%`);
    console.log("==============================\n");

    process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
