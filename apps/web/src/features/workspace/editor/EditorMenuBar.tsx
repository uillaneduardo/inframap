import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FolderOpen,
  Save,
  FileDown,
  FileUp,
  Image,
  XCircle,
  Undo2,
  Redo2,
  Copy,
  Clipboard,
  Trash2,
  CheckSquare,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Layers as LayersIcon,
  SlidersHorizontal,
  Sun,
  Moon,
  Contrast,
  Square,
  Circle as CircleIcon,
  Minus,
  Type,
  Lock,
  Unlock,
  HelpCircle,
  Keyboard,
  Info,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Monitor,
} from 'lucide-react';
import { validateAndParseProjectJson, serializeProjectDocument } from '@inframap/project-schema';
import { CanvasObject } from '@inframap/domain';
import { useProjectStore } from '../../../stores/useProjectStore';
import { useEditorStore } from '../../../stores/useEditorStore';
import { useThemeStore } from '../../../stores/useThemeStore';

interface EditorMenuBarProps {
  showLeftPanel: boolean;
  setShowLeftPanel: React.Dispatch<React.SetStateAction<boolean>>;
  showRightPanel: boolean;
  setShowRightPanel: React.Dispatch<React.SetStateAction<boolean>>;
  onOpenNewProjectModal: () => void;
}

export const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  showLeftPanel,
  setShowLeftPanel,
  showRightPanel,
  setShowRightPanel,
  onOpenNewProjectModal,
}) => {
  const navigate = useNavigate();

  const {
    activeProject,
    saveProject,
    importProject,
    updateActiveProject,
    closeActiveProject,
  } = useProjectStore();

  const {
    setActiveTool,
    selectedIds,
    setSelectedIds,
    clearSelection,
    canUndo,
    canRedo,
    undo,
    redo,
    pushHistory,
    zoomIn,
    zoomOut,
    resetZoom,
    showGrid,
    toggleShowGrid,
    snapToGrid,
    toggleSnapToGrid,
  } = useEditorStore();

  const { themeMode, setThemeMode } = useThemeStore();

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Dialog states for Help
  const [helpModal, setHelpModal] = useState<'shortcuts' | 'instructions' | 'about' | null>(null);

  // Clipboard for Copy / Paste
  const clipboardRef = useRef<CanvasObject[]>([]);

  const menuContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close menus on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
        setActiveSubmenu(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveMenu(null);
        setActiveSubmenu(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (!activeProject) return null;

  const toggleMenu = (menuName: string) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
      setActiveSubmenu(null);
    } else {
      setActiveMenu(menuName);
      setActiveSubmenu(null);
    }
  };

  // Actions implementation
  const handleExportJson = () => {
    const jsonStr = serializeProjectDocument(activeProject);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_inframap.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActiveMenu(null);
  };

  const handleExportPng = () => {
    const stageContainer = document.querySelector('.konvajs-content canvas') as HTMLCanvasElement;
    if (stageContainer) {
      const dataUrl = stageContainer.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${activeProject.name.replace(/\s+/g, '_').toLowerCase()}_inframap.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setActiveMenu(null);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = validateAndParseProjectJson(content, false);
      if (res.success) {
        await importProject(res.document);
      } else {
        alert(res.error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setActiveMenu(null);
  };

  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    const selectedObjs = activeProject.objects.filter((o) => selectedIds.includes(o.id));
    clipboardRef.current = JSON.parse(JSON.stringify(selectedObjs));
    setActiveMenu(null);
  };

  const handlePaste = () => {
    if (clipboardRef.current.length === 0) return;
    pushHistory(activeProject.objects);
    const newIds: string[] = [];

    const pastedObjects: CanvasObject[] = clipboardRef.current.map((obj) => {
      const newId = crypto.randomUUID();
      newIds.push(newId);
      return {
        ...obj,
        id: newId,
        x: obj.x + 10,
        y: obj.y + 10,
        name: `${obj.name} (cópia)`,
      };
    });

    updateActiveProject((doc) => ({
      ...doc,
      objects: [...doc.objects, ...pastedObjects],
    }));
    setSelectedIds(newIds);
    setActiveMenu(null);
  };

  const handleDuplicate = () => {
    if (selectedIds.length === 0) return;
    handleCopy();
    handlePaste();
  };

  const handleDelete = () => {
    if (selectedIds.length === 0) return;
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.filter((o) => !selectedIds.includes(o.id)),
    }));
    clearSelection();
    setActiveMenu(null);
  };

  const handleSelectAll = () => {
    setSelectedIds(activeProject.objects.map((o) => o.id));
    setActiveMenu(null);
  };

  const handleBringToFront = () => {
    if (selectedIds.length === 0) return;
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => {
      const selected = doc.objects.filter((o) => selectedIds.includes(o.id));
      const unselected = doc.objects.filter((o) => !selectedIds.includes(o.id));
      return {
        ...doc,
        objects: [...unselected, ...selected],
      };
    });
    setActiveMenu(null);
  };

  const handleSendToBack = () => {
    if (selectedIds.length === 0) return;
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => {
      const selected = doc.objects.filter((o) => selectedIds.includes(o.id));
      const unselected = doc.objects.filter((o) => !selectedIds.includes(o.id));
      return {
        ...doc,
        objects: [...selected, ...unselected],
      };
    });
    setActiveMenu(null);
  };

  const handleMoveToLayer = (layerId: string) => {
    if (selectedIds.length === 0) return;
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) =>
        selectedIds.includes(o.id) && !o.locked ? { ...o, layerId } : o
      ),
    }));
    setActiveMenu(null);
  };

  const handleToggleLockSelected = (lockState: boolean) => {
    if (selectedIds.length === 0) return;
    pushHistory(activeProject.objects);
    updateActiveProject((doc) => ({
      ...doc,
      objects: doc.objects.map((o) =>
        selectedIds.includes(o.id) ? { ...o, locked: lockState } : o
      ),
    }));
    setActiveMenu(null);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
    setActiveMenu(null);
  };

  return (
    <div
      ref={menuContainerRef}
      className="h-8 theme-bg-menu border-b theme-border flex items-center justify-between px-2 text-xs theme-text-main z-40 shrink-0 select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportJson}
      />

      <div className="flex items-center gap-1">
        {/* App Title / Logo */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 font-bold tracking-tight text-blue-500 mr-1">
          <Monitor className="w-4 h-4 text-blue-500" />
          <span>InfraMap</span>
        </div>

        {/* Arquivo Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('file')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'file' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Arquivo
          </button>
          {activeMenu === 'file' && (
            <div className="absolute top-full left-0 mt-0.5 w-52 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setActiveMenu(null);
                  onOpenNewProjectModal();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5" /> Novo projeto
                </span>
              </button>
              <button
                onClick={() => {
                  setActiveMenu(null);
                  navigate('/workspace/projects');
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <FolderOpen className="w-3.5 h-3.5" /> Abrir projeto
                </span>
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                onClick={() => {
                  saveProject();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Save className="w-3.5 h-3.5" /> Salvar
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+S</span>
              </button>
              <button
                onClick={handleExportJson}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <FileDown className="w-3.5 h-3.5" /> Exportar JSON
                </span>
              </button>
              <button
                onClick={() => {
                  fileInputRef.current?.click();
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <FileUp className="w-3.5 h-3.5" /> Importar JSON
                </span>
              </button>
              <button
                onClick={handleExportPng}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Image className="w-3.5 h-3.5" /> Exportar PNG
                </span>
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                onClick={() => {
                  closeActiveProject();
                  navigate('/workspace/projects');
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-red-500 hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5" /> Fechar projeto
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Editar Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('edit')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'edit' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Editar
          </button>
          {activeMenu === 'edit' && (
            <div className="absolute top-full left-0 mt-0.5 w-52 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                disabled={!canUndo}
                onClick={() => {
                  if (canUndo) {
                    const prev = undo(activeProject.objects);
                    if (prev) updateActiveProject((doc) => ({ ...doc, objects: prev }));
                  }
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Undo2 className="w-3.5 h-3.5" /> Desfazer
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+Z</span>
              </button>
              <button
                disabled={!canRedo}
                onClick={() => {
                  if (canRedo) {
                    const next = redo(activeProject.objects);
                    if (next) updateActiveProject((doc) => ({ ...doc, objects: next }));
                  }
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Redo2 className="w-3.5 h-3.5" /> Refazer
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+Y</span>
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                disabled={selectedIds.length === 0}
                onClick={handleCopy}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5" /> Copiar
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+C</span>
              </button>
              <button
                disabled={clipboardRef.current.length === 0}
                onClick={handlePaste}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Clipboard className="w-3.5 h-3.5" /> Colar
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+V</span>
              </button>
              <button
                disabled={selectedIds.length === 0}
                onClick={handleDuplicate}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Copy className="w-3.5 h-3.5" /> Duplicar
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+D</span>
              </button>
              <button
                disabled={selectedIds.length === 0}
                onClick={handleDelete}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between text-red-500 hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Trash2 className="w-3.5 h-3.5" /> Excluir
                </span>
                <span className="theme-text-subtle text-[10px]">Del</span>
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                onClick={handleSelectAll}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <CheckSquare className="w-3.5 h-3.5" /> Selecionar tudo
                </span>
                <span className="theme-text-subtle text-[10px]">Ctrl+A</span>
              </button>
              <button
                onClick={() => {
                  clearSelection();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <XCircle className="w-3.5 h-3.5" /> Limpar seleção
                </span>
                <span className="theme-text-subtle text-[10px]">Esc</span>
              </button>
            </div>
          )}
        </div>

        {/* Visualizar Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('view')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'view' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Visualizar
          </button>
          {activeMenu === 'view' && (
            <div className="absolute top-full left-0 mt-0.5 w-56 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  zoomIn();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <ZoomIn className="w-3.5 h-3.5" /> Aumentar zoom
                </span>
              </button>
              <button
                onClick={() => {
                  zoomOut();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <ZoomOut className="w-3.5 h-3.5" /> Diminuir zoom
                </span>
              </button>
              <button
                onClick={() => {
                  resetZoom();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Maximize className="w-3.5 h-3.5" /> Redefinir zoom (100%)
                </span>
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                onClick={() => {
                  toggleShowGrid();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" /> Exibir grade
                </span>
                {showGrid && <span className="text-emerald-500 font-bold">✓</span>}
              </button>
              <button
                onClick={() => {
                  toggleSnapToGrid();
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Grid className="w-3.5 h-3.5" /> Encaixar na grade
                </span>
                {snapToGrid && <span className="text-emerald-500 font-bold">✓</span>}
              </button>
              <div className="my-1 border-t theme-border" />
              <button
                onClick={() => {
                  setShowLeftPanel((prev) => !prev);
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <LayersIcon className="w-3.5 h-3.5" /> Painel de camadas
                </span>
                {showLeftPanel && <span className="text-emerald-500 font-bold">✓</span>}
              </button>
              <button
                onClick={() => {
                  setShowRightPanel((prev) => !prev);
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Painel de propriedades
                </span>
                {showRightPanel && <span className="text-emerald-500 font-bold">✓</span>}
              </button>
              <div className="my-1 border-t theme-border" />

              {/* Tema Submenu */}
              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu('theme')}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <div className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] cursor-pointer">
                  <span className="flex items-center gap-2">
                    <Sun className="w-3.5 h-3.5" /> Tema
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                {activeSubmenu === 'theme' && (
                  <div className="absolute top-0 left-full ml-1 w-44 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
                    <button
                      onClick={() => {
                        setThemeMode('light');
                        setActiveMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
                    >
                      <span className="flex items-center gap-2">
                        <Sun className="w-3.5 h-3.5 text-amber-500" /> Claro
                      </span>
                      {themeMode === 'light' && <span className="text-blue-500 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setThemeMode('dark');
                        setActiveMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
                    >
                      <span className="flex items-center gap-2">
                        <Moon className="w-3.5 h-3.5 text-blue-400" /> Escuro
                      </span>
                      {themeMode === 'dark' && <span className="text-blue-500 font-bold">✓</span>}
                    </button>
                    <button
                      onClick={() => {
                        setThemeMode('high-contrast');
                        setActiveMenu(null);
                      }}
                      className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
                    >
                      <span className="flex items-center gap-2">
                        <Contrast className="w-3.5 h-3.5 text-yellow-400" /> Alto contraste
                      </span>
                      {themeMode === 'high-contrast' && <span className="text-yellow-400 font-bold">✓</span>}
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={handleFullscreen}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Maximize className="w-3.5 h-3.5" /> Tela cheia
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Inserir Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('insert')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'insert' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Inserir
          </button>
          {activeMenu === 'insert' && (
            <div className="absolute top-full left-0 mt-0.5 w-48 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setActiveTool('rectangle');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Square className="w-3.5 h-3.5 text-blue-500" /> Retângulo
                </span>
                <span className="theme-text-subtle text-[10px]">R</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('circle');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <CircleIcon className="w-3.5 h-3.5 text-emerald-500" /> Círculo
                </span>
                <span className="theme-text-subtle text-[10px]">C</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('line');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Minus className="w-3.5 h-3.5 text-amber-500" /> Linha
                </span>
                <span className="theme-text-subtle text-[10px]">L</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('dashed-line');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-3.5 h-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 3">
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                  Linha pontilhada
                </span>
                <span className="theme-text-subtle text-[10px]">D</span>
              </button>
              <button
                onClick={() => {
                  setActiveTool('text');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)]"
              >
                <span className="flex items-center gap-2">
                  <Type className="w-3.5 h-3.5 text-pink-500" /> Texto
                </span>
                <span className="theme-text-subtle text-[10px]">T</span>
              </button>
            </div>
          )}
        </div>

        {/* Organizar Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('organize')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'organize' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Organizar
          </button>
          {activeMenu === 'organize' && (
            <div className="absolute top-full left-0 mt-0.5 w-56 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                disabled={selectedIds.length === 0}
                onClick={handleBringToFront}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <ArrowUp className="w-3.5 h-3.5" /> Trazer para frente
                </span>
              </button>
              <button
                disabled={selectedIds.length === 0}
                onClick={handleSendToBack}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <ArrowDown className="w-3.5 h-3.5" /> Enviar para trás
                </span>
              </button>
              <div className="my-1 border-t theme-border" />

              {/* Mover para camada Submenu */}
              <div
                className="relative"
                onMouseEnter={() => setActiveSubmenu('move-layer')}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <div
                  className={`w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] cursor-pointer ${
                    selectedIds.length === 0 ? 'opacity-40 pointer-events-none' : ''
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <LayersIcon className="w-3.5 h-3.5" /> Mover para camada
                  </span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </div>
                {activeSubmenu === 'move-layer' && selectedIds.length > 0 && (
                  <div className="absolute top-0 left-full ml-1 w-48 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
                    {activeProject.layers.map((ly) => (
                      <button
                        key={ly.id}
                        onClick={() => handleMoveToLayer(ly.id)}
                        className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)] truncate"
                      >
                        <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                        <span className="truncate">{ly.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="my-1 border-t theme-border" />
              <button
                disabled={selectedIds.length === 0}
                onClick={() => handleToggleLockSelected(true)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> Bloquear
                </span>
              </button>
              <button
                disabled={selectedIds.length === 0}
                onClick={() => handleToggleLockSelected(false)}
                className="w-full px-3 py-1.5 text-left flex items-center justify-between hover:bg-[var(--bg-surface-hover)] disabled:opacity-40"
              >
                <span className="flex items-center gap-2">
                  <Unlock className="w-3.5 h-3.5" /> Desbloquear
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Ajuda Menu */}
        <div className="relative">
          <button
            onClick={() => toggleMenu('help')}
            className={`px-2.5 py-1 rounded transition-colors ${
              activeMenu === 'help' ? 'bg-[var(--bg-surface-active)] font-medium' : 'hover:bg-[var(--bg-surface-hover)]'
            }`}
          >
            Ajuda
          </button>
          {activeMenu === 'help' && (
            <div className="absolute top-full left-0 mt-0.5 w-48 theme-bg-surface border theme-border rounded-md shadow-xl py-1 z-50 text-xs">
              <button
                onClick={() => {
                  setHelpModal('shortcuts');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)]"
              >
                <Keyboard className="w-3.5 h-3.5" /> Atalhos de teclado
              </button>
              <button
                onClick={() => {
                  setHelpModal('instructions');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)]"
              >
                <HelpCircle className="w-3.5 h-3.5" /> Instruções do editor
              </button>
              <button
                onClick={() => {
                  setHelpModal('about');
                  setActiveMenu(null);
                }}
                className="w-full px-3 py-1.5 text-left flex items-center gap-2 hover:bg-[var(--bg-surface-hover)]"
              >
                <Info className="w-3.5 h-3.5" /> Sobre o InfraMap
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right side info / project title */}
      <div className="flex items-center gap-3">
        <span className="font-semibold text-xs theme-text-main truncate max-w-[180px]">
          {activeProject.name}
        </span>
      </div>

      {/* Help Modals */}
      {helpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="theme-bg-surface border theme-border rounded-lg shadow-2xl p-5 max-w-md w-full theme-text-main text-xs space-y-4">
            {helpModal === 'shortcuts' && (
              <>
                <h3 className="text-sm font-bold flex items-center gap-2 border-b theme-border pb-2">
                  <Keyboard className="w-4 h-4 text-blue-500" /> Atalhos de Teclado
                </h3>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">V</kbd> Selecionar</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">M</kbd> Mover objeto</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">H</kbd> Mover tela (Pan)</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">R</kbd> Retângulo</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">C</kbd> Círculo</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">L</kbd> Linha contínua</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">D</kbd> Linha pontilhada</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">T</kbd> Texto</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Enter</kbd> Finalizar polilinha</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Backspace</kbd> Remover último ponto</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Ctrl+Z</kbd> Desfazer</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Ctrl+Y</kbd> Refazer</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Ctrl+1</kbd> Painel Camadas</div>
                  <div><kbd className="px-1.5 py-0.5 border rounded theme-bg-app font-mono">Ctrl+2</kbd> Painel Propriedades</div>
                </div>
              </>
            )}

            {helpModal === 'instructions' && (
              <>
                <h3 className="text-sm font-bold flex items-center gap-2 border-b theme-border pb-2">
                  <HelpCircle className="w-4 h-4 text-blue-500" /> Instruções do Editor
                </h3>
                <div className="space-y-2 text-[11px] leading-relaxed">
                  <p>• <strong>Formas geométricas:</strong> Clique e arraste no canvas para desenhar Retângulos ou Círculos.</p>
                  <p>• <strong>Linhas (Polilinhas):</strong> Clique sequencialmente no canvas para adicionar vértices. Use Enter ou duplo-clique para concluir.</p>
                  <p>• <strong>Texto:</strong> Selecione a ferramenta Texto e clique no canvas para abrir a edição inline instantânea.</p>
                  <p>• <strong>Camadas:</strong> Arraste objetos entre camadas no painel esquerdo ou reordene camadas para ajustar o empilhamento visual.</p>
                </div>
              </>
            )}

            {helpModal === 'about' && (
              <>
                <h3 className="text-sm font-bold flex items-center gap-2 border-b theme-border pb-2">
                  <Info className="w-4 h-4 text-blue-500" /> Sobre o InfraMap
                </h3>
                <div className="space-y-2 text-[11px]">
                  <p className="font-semibold">InfraMap v0.1.0</p>
                  <p className="theme-text-muted">Plataforma PWA desktop e web para documentação e diagramação visual técnica de infraestrutura de TI.</p>
                </div>
              </>
            )}

            <div className="flex justify-end pt-2 border-t theme-border">
              <button
                onClick={() => setHelpModal(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
