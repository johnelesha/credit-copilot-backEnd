import { z } from "zod";

export const ApplicationFormSchema = z.object({
    applicationId: z.string().min(1),
    applicationDate: z.string(), // ISO date
    dateOfBirth: z.string(),
    requestedAmount: z.number().positive(),
    requestedTenorMonths: z.number().int().positive(),
    salaryTransferredToDelta: z.boolean().default(false),
    // Protected attributes (will be stripped)
    gender: z.string().optional(),
    religion: z.string().optional(),
    maritalStatus: z.string().optional(),
    nationality: z.string().optional(),
});

export type ApplicationForm = z.infer<typeof ApplicationFormSchema>;

/** What the LLM is supposed to extract (step 4) */
export const ExtractedDataSchema = z.object({
    netMonthlyIncome: z.object({
        value: z.number(),
        sourceDocument: z.string(),
        sourceSection: z.string(),
        quotedText: z.string(),
    }),
    existingMonthlyObligations: z.object({
        value: z.number(),
        sourceDocument: z.string(),
        sourceSection: z.string(),
        quotedText: z.string(),
    }),
    employmentStartDate: z.object({
        value: z.string(),
        sourceDocument: z.string(),
        sourceSection: z.string(),
        quotedText: z.string(),
    }),
    bureauScore: z.object({
        value: z.number(),
        sourceDocument: z.string(),
        sourceSection: z.string(),
        quotedText: z.string(),
    }),
});

export type ExtractedData = z.infer<typeof ExtractedDataSchema>;
