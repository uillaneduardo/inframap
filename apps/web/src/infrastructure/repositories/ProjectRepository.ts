import { ProjectDocument, ProjectSummary } from '@inframap/domain';

export interface ProjectRepository {
  list(): Promise<ProjectSummary[]>;
  findById(id: string): Promise<ProjectDocument | null>;
  save(project: ProjectDocument): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<ProjectDocument>;
  import(project: ProjectDocument): Promise<ProjectDocument>;
}
