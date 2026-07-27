import Dexie, { Table } from 'dexie';
import { ProjectDocument, ProjectSummary } from '@inframap/domain';

export class InfraMapDexieDB extends Dexie {
  projects!: Table<ProjectSummary, string>;
  documents!: Table<ProjectDocument, string>;

  constructor() {
    super('InfraMapDatabase');
    this.version(1).stores({
      projects: 'id, organizationId, ownerId, name, updatedAt',
      documents: 'id, schemaVersion, updatedAt',
    });
  }
}

export const dbInstance = new InfraMapDexieDB();
