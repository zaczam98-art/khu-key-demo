import { z } from 'zod';

// ChatKHU 구조화 출력의 zod 검증과, response_format(json_schema, strict)에 보내는 JSON 스키마를 짝으로 둡니다.
// strict 모드는 모든 속성이 required 이고 additionalProperties: false 여야 합니다.

// ---------- 직무 탐색 (/api/extract) ----------
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
        properties: { name: { type: 'string' }, summary: { type: 'string' }, tags: { type: 'array', items: { type: 'string' } }, why: { type: 'string' } },
      },
    },
  },
} as const;

// ---------- 경험 카드 (/api/extract-experience) ----------
export const CATEGORIES = ['동아리', '학회', '학생회', '봉사', '아르바이트', '인턴십', '공모전', '자격증·교육', '기타'] as const;
export const ExperienceCardSchema = z.object({
  title: z.string().min(1),
  category: z.enum(CATEGORIES),
  period: z.object({ from: z.string(), to: z.string() }),
  role: z.string(),
  activities: z.array(z.string().min(1)).min(1).max(6),
  achievements: z.array(z.string()).max(6),
  learned: z.array(z.string()).max(6),
  skills: z.array(z.string()).max(8),
  missing: z.array(z.string()).max(5),
});
export type ExperienceCard = z.infer<typeof ExperienceCardSchema>;
const strArr = { type: 'array', items: { type: 'string' } } as const;
export const experienceCardJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['title', 'category', 'period', 'role', 'activities', 'achievements', 'learned', 'skills', 'missing'],
  properties: {
    title: { type: 'string' },
    category: { type: 'string', enum: [...CATEGORIES] },
    period: { type: 'object', additionalProperties: false, required: ['from', 'to'], properties: { from: { type: 'string' }, to: { type: 'string' } } },
    role: { type: 'string' },
    activities: strArr,
    achievements: strArr,
    learned: strArr,
    skills: strArr,
    missing: strArr,
  },
} as const;

// ---------- 공고 분석 (/api/extract-post) ----------
export const PostExtractSchema = z.object({
  keywords: z.array(z.string().min(1)).min(1).max(10),
  values: z.string(),
  deadline: z.string().nullable(),
  questions: z.array(z.object({ text: z.string().min(1), limit: z.number().int().positive() })).max(8),
});
export type PostExtract = z.infer<typeof PostExtractSchema>;
export const postExtractJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['keywords', 'values', 'deadline', 'questions'],
  properties: {
    keywords: strArr,
    values: { type: 'string' },
    deadline: { type: ['string', 'null'] },
    questions: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['text', 'limit'], properties: { text: { type: 'string' }, limit: { type: 'integer' } } },
    },
  },
} as const;

// ---------- 자소서 초안·피드백 (/api/essay-draft) ----------
export const EssayDraftSchema = z.object({ body: z.string().min(1), feedback: z.string() });
export type EssayDraft = z.infer<typeof EssayDraftSchema>;
export const essayDraftJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['body', 'feedback'],
  properties: { body: { type: 'string' }, feedback: { type: 'string' } },
} as const;

// ---------- 면접 채점 (/api/score) ----------
const score = z.number().min(0).max(100);
export const ScoreSchema = z.object({
  scores: z.object({ logic: score, jobFit: score, concreteness: score, delivery: score }),
  evidence: z.array(z.object({ item: z.string().min(1), quote: z.string(), comment: z.string().min(1) })).min(1).max(8),
  summary: z.string(),
});
export type ScoreResult = z.infer<typeof ScoreSchema>;
const num = { type: 'number' } as const;
export const scoreJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['scores', 'evidence', 'summary'],
  properties: {
    scores: {
      type: 'object',
      additionalProperties: false,
      required: ['logic', 'jobFit', 'concreteness', 'delivery'],
      properties: { logic: num, jobFit: num, concreteness: num, delivery: num },
    },
    evidence: {
      type: 'array',
      items: { type: 'object', additionalProperties: false, required: ['item', 'quote', 'comment'], properties: { item: { type: 'string' }, quote: { type: 'string' }, comment: { type: 'string' } } },
    },
    summary: { type: 'string' },
  },
} as const;
