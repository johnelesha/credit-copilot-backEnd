export interface PolicyChunk {
    chunkId: string; // unique & stable
    sourceFile: string; // e.g. "credit-policy-2025.pdf"
    page?: number;
    clauseId?: string; // e.g. "CP-4.1"
    sectionTitle?: string;
    policyEdition?: "CP-2024" | "CP-2025" | "PM" | "PS" | "CIRCULAR";
    effectiveFrom?: string; // ISO date
    effectiveTo?: string | null;
    content: string;
    embedding?: number[];
    createdAt: Date;
}
