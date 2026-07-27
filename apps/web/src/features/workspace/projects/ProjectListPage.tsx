import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FolderPlus,
  FileDown,
  FileUp,
  Search,
  ExternalLink,
  Copy,
  Trash2,
  Calendar,
  Ruler,
  AlertCircle,
  FolderOpen,
} from 'lucide-react';
import { Button, Dialog, Input, Select, EmptyState, LoadingState, ErrorState } from '@inframap/ui';
import { validateAndParseProjectJson, serializeProjectDocument, CreateProjectFormSchema } from '@inframap/project-schema';
import { formatUnitValue } from '@inframap/editor-core';
import { ProjectUnit, ProjectSummary } from '@inframap/domain';
import { useProjectStore } from '../../../stores/useProjectStore';

export const ProjectListPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const {
    projects,
    isLoading,
    errorMessage,
    fetchProjects,
    createProject,
    deleteProject,
    duplicateProject,
    importProject,
    loadProject,
  } = useProjectStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deleteCandidate, setDeleteCandidate] = useState<ProjectSummary | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: 'Datacenter Principal',
    description: 'Planta baixa da sala segura e disposição dos racks.',
    unit: 'm' as ProjectUnit,
    width: 20,
    height: 15,
    gridSize: 0.5,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [importError, setImportError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filteredProjects = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    const result = CreateProjectFormSchema.safeParse(formData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errors[issue.path[0].toString()] = issue.message;
        }
      });
      setFormErrors(errors);
      return;
    }

    try {
      const newProject = await createProject(result.data);
      setIsCreateModalOpen(false);
      navigate(`/workspace/projects/${newProject.id}`);
    } catch {
      // Handled in store
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    await deleteProject(deleteCandidate.id);
    setDeleteCandidate(null);
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await duplicateProject(id);
    } catch {
      // Handled in store
    }
  };

  const handleExportJson = async (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const doc = await loadProject(id);
    if (doc) {
      const jsonStr = serializeProjectDocument(doc);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${name.replace(/\s+/g, '_').toLowerCase()}_inframap.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseProjectJson(content, true);

      if (res.success) {
        try {
          const imported = await importProject(res.document);
          navigate(`/workspace/projects/${imported.id}`);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : String(err);
          setImportError(`Erro ao salvar projeto importado: ${message}`);
        }
      } else {
        setImportError(res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full flex flex-col gap-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-400" />
            {t('nav.projects')}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gerencie e crie mapas visuais de infraestrutura persistidos no seu navegador.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center justify-center font-medium rounded-lg transition-colors border border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800 px-3.5 py-2 text-sm gap-2 cursor-pointer">
            <FileUp className="w-4 h-4 text-slate-400" />
            <span>{t('workspace.importProject')}</span>
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImportFile}
            />
          </label>

          <Button variant="primary" size="md" onClick={() => setIsCreateModalOpen(true)}>
            <FolderPlus className="w-4 h-4" />
            <span>{t('workspace.newProject')}</span>
          </Button>
        </div>
      </div>

      {/* Search & Alerts */}
      {importError && (
        <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            {importError}
          </span>
          <button
            onClick={() => setImportError(null)}
            className="text-red-400 hover:text-red-200 text-xs font-mono px-2"
          >
            fechar
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('workspace.searchProjects')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Content Grid */}
      {isLoading ? (
        <LoadingState message="Carregando projetos armazenados..." />
      ) : errorMessage ? (
        <ErrorState message={errorMessage} onRetry={() => fetchProjects()} />
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          title={t('workspace.noProjects')}
          description={t('workspace.noProjectsDesc')}
          actionLabel={t('workspace.newProject')}
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/workspace/projects/${p.id}`)}
              className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-xl flex flex-col justify-between transition-all hover:shadow-lg cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-1">
                    {p.name}
                  </h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 uppercase shrink-0">
                    {p.unit}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 line-clamp-2 min-h-[2rem]">
                  {p.description || 'Sem descrição cadastrada.'}
                </p>

                <div className="flex flex-wrap items-center gap-y-2 gap-x-4 mt-4 text-[11px] text-slate-400 font-mono border-t border-slate-800/60 pt-3">
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3.5 h-3.5 text-slate-500" />
                    {formatUnitValue(p.canonicalWidth, p.unit)} × {formatUnitValue(p.canonicalHeight, p.unit)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {new Date(p.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="flex items-center justify-between gap-2 mt-5 pt-3 border-t border-slate-800/80">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e: React.MouseEvent) => {
                    e.stopPropagation();
                    navigate(`/workspace/projects/${p.id}`);
                  }}
                  className="text-blue-400 hover:text-blue-300 hover:bg-blue-950/40"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('workspace.actions.open')}</span>
                </Button>

                <div className="flex items-center gap-1">
                  <button
                    title={t('workspace.actions.duplicate')}
                    onClick={(e: React.MouseEvent) => handleDuplicate(p.id, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  <button
                    title={t('workspace.actions.export')}
                    onClick={(e: React.MouseEvent) => handleExportJson(p.id, p.name, e)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-md transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    title={t('workspace.actions.delete')}
                    onClick={(e: React.MouseEvent) => {
                      e.stopPropagation();
                      setDeleteCandidate(p);
                    }}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-md transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Dialog
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('workspace.createProjectTitle')}
        description="Defina as dimensões e unidade de medida da planta técnica."
      >
        <form onSubmit={handleCreateSubmit} className="flex flex-col gap-4">
          <Input
            label={t('workspace.projectName')}
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
            required
          />

          <Input
            label={t('workspace.description')}
            value={formData.description}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, description: e.target.value })}
            error={formErrors.description}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('workspace.unit')}
              value={formData.unit}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFormData({ ...formData, unit: e.target.value as ProjectUnit })
              }
              options={[
                { value: 'm', label: 'Metros (m)' },
                { value: 'cm', label: 'Centímetros (cm)' },
                { value: 'mm', label: 'Milímetros (mm)' },
              ]}
              error={formErrors.unit}
            />

            <Input
              label={`${t('workspace.gridSize')} (${formData.unit})`}
              type="number"
              step="any"
              value={formData.gridSize}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, gridSize: parseFloat(e.target.value) || 0 })
              }
              error={formErrors.gridSize}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={`${t('workspace.width')} (${formData.unit})`}
              type="number"
              step="any"
              value={formData.width}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, width: parseFloat(e.target.value) || 0 })
              }
              error={formErrors.width}
              required
            />

            <Input
              label={`${t('workspace.height')} (${formData.unit})`}
              type="number"
              step="any"
              value={formData.height}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, height: parseFloat(e.target.value) || 0 })
              }
              error={formErrors.height}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-3 mt-4 pt-3 border-t border-slate-800">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
            >
              {t('workspace.actions.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('workspace.actions.create')}
            </Button>
          </div>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={!!deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        title={t('workspace.deleteConfirmTitle')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-300">
            {t('workspace.deleteConfirmDesc', { name: deleteCandidate?.name })}
          </p>

          <div className="flex items-center justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={() => setDeleteCandidate(null)}>
              {t('workspace.actions.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDeleteConfirm}>
              {t('workspace.actions.delete')}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
