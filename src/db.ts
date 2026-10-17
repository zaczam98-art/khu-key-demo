import Dexie, { type Table } from 'dexie';

export interface DemoProfile {
  id: string;
  styleChoices: string[];
  keywords: string[];
  savedRole?: string;
  updatedAt: string;
}

class KhuKeyDatabase extends Dexie {
  profiles!: Table<DemoProfile, string>;

  constructor() {
    super('khu-key-demo');
    this.version(1).stores({ profiles: 'id, updatedAt' });
  }
}

export const db = new KhuKeyDatabase();
