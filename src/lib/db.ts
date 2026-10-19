import Dexie, { type Table } from 'dexie';

// CLAUDE.md 5절의 데이터 모델. 실명·학번·전화·이메일 필드는 두지 않습니다.
export type TargetJob = { name: string; source: 'explore' | 'manual'; confidence: '상' | '중' | '하'; reason: string };
export interface Profile {
  id: 'me';
  nickname?: string;
  grade?: string;
  major?: string;
  targetJobs: TargetJob[];
  strengths: string[];
  exploreKeywords: string[];
  createdAt: string;
  updatedAt: string;
}
export type ExperienceCategory = '동아리' | '학회' | '학생회' | '봉사' | '아르바이트' | '인턴십' | '공모전' | '자격증·교육' | '기타';
export interface Experience {
  id: string;
  title: string;
  category: ExperienceCategory;
  period: { from: string; to: string };
  role: string;
  activities: string[];
  achievements: string[];
  learned: string[];
  skills: string[];
  sourceTurns: number[];
  missing: string[];
  confirmed: boolean;
  createdAt: string;
}
export type Stage = '관심' | '작성중' | '제출' | '서류합격' | '서류불합격' | '면접' | '최종';
export interface Application {
  id: string;
  company: string;
  job: string;
  postUrl?: string;
  postText?: string;
  keywords: string[];
  values?: string;
  deadline?: string;
  stage: Stage;
  questions: {
    qid: string;
    text: string;
    limit: number;
    expIds: string[];
    status: string;
    versions: { ver: number; body: string; model: string; createdAt: string }[];
    feedback?: string;
  }[];
  checklist: { item: string; done: boolean }[];
}
export interface Task {
  id: string;
  appId?: string;
  type: '자소서' | '서류제출' | '인적성' | '면접' | '기타';
  title: string;
  dueAt: string;
  estMin: number;
  done: boolean;
  priority: number;
  lastNudgedAt?: string;
}
export interface MockSession {
  id: string;
  appId?: string;
  mode: 'text' | 'voice';
  type: '실무' | '임원' | 'PT' | 'AI화상';
  turns: { n: number; kind: '기본' | '꼬리'; q: string; basis: string; a: string; audioSec?: number }[];
  scores: { logic: number; jobFit: number; concreteness: number; delivery: number };
  evidence: { item: string; quote: string; comment: string }[];
  createdAt: string;
}
export type ChatTurn = { role: 'user' | 'assistant'; content: string; at: string };
export interface ChatLog {
  id: string;
  module: string;
  turns: ChatTurn[];
}

class KhuKeyDB extends Dexie {
  profile!: Table<Profile, string>;
  experiences!: Table<Experience, string>;
  applications!: Table<Application, string>;
  tasks!: Table<Task, string>;
  mockSessions!: Table<MockSession, string>;
  chatLogs!: Table<ChatLog, string>;

  constructor() {
    super('khu-key');
    this.version(1).stores({
      profile: 'id',
      experiences: 'id, category, createdAt',
      applications: 'id, company, stage, deadline',
      tasks: 'id, appId, dueAt, done',
      mockSessions: 'id, appId, createdAt',
      chatLogs: 'id, module',
    });
  }
}

export const db = new KhuKeyDB();
