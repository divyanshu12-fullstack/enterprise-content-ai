import { z } from "zod";

export const GeneratePayloadSchema = z.object({
	topic: z.string().min(2),
	audience: z.string().min(2),
	content_type: z.string().max(80).optional(),
	tone: z.string().max(80).optional(),
	additional_context: z.string().optional(),
	policy_text: z.string().optional(),
	enforce_twitter_limit: z.boolean().optional(),
});

export const FinalContentOutputSchema = z.object({
	linkedin_post: z.string().min(1),
	twitter_post: z.string().min(1),
	image_prompt: z.string().min(1),
	compliance_status: z.enum(["APPROVED", "REJECTED"]),
	compliance_notes: z.string().min(1),
});

export const GenerationSchema = z.object({
	id: z.string(),
	topic: z.string(),
	audience: z.string(),
	content_type: z.string().nullable().optional(),
	tone: z.string().nullable().optional(),
	additional_context: z.string().nullable().optional(),
	linkedin_post: z.string().nullable().optional(),
	twitter_post: z.string().nullable().optional(),
	image_prompt: z.string().nullable().optional(),
	compliance_status: z.string(),
	compliance_notes: z.string().nullable().optional(),
	status: z.string(),
	error_message: z.string().nullable().optional(),
	duration_ms: z.number().nullable().optional(),
	created_at: z.string(),
	completed_at: z.string().nullable().optional(),
});

export const GenerationListSchema = z.object({
	items: z.array(GenerationSchema),
	total: z.number(),
});

export const GenerationMetricsSchema = z.object({
	total_runs: z.number(),
	approved_runs: z.number(),
	rejected_runs: z.number(),
	pass_rate: z.number(),
	rejection_rate: z.number(),
	median_duration_ms: z.number().nullable(),
});

export type GeneratePayload = z.infer<typeof GeneratePayloadSchema>;
export type FinalContentOutput = z.infer<typeof FinalContentOutputSchema>;
export type Generation = z.infer<typeof GenerationSchema>;
export type GenerationList = z.infer<typeof GenerationListSchema>;
export type GenerationMetrics = z.infer<typeof GenerationMetricsSchema>;
