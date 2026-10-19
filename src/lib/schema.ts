import { z } from 'zod';

// /api/extract 응답 (CLAUDE.md 12절 7번 화면 데이터)
export const JobSchema = z.object({
  name: z.string().min(1),
  summary: z.string().min(1),
  tags: z.array(z.string().min(1)).min(1).max(6),
  why: z.string().min(1),
});
export const ExploreResultSchema = z.object({
  keywords: z.array(z.string().min(1)).min(3).max(8),
  traits: z.array(z.string().min(1)).min(2).max(6),
  jobs: z.array(JobSchema).min(1).max(5),
});
export type ExploreResult = z.infer<typeof ExploreResultSchema>;

// ChatKHU chat/completions 의 response_format(json_schema, strict) 에 보내는 스키마
export const exploreResultJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['keywords', 'traits', 'jobs'],
  properties: {
    keywords: { type: 'array', items: { type: 'string' } },
    traits: { type: 'array', items: { type: 'string' } },
    jobs: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'summary', 'tags', 'why'],
        properties: {
          name: { type: 'string' },
          summary: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          why: { type: 'string' },
        },
      },
    },
  },
} as const;
