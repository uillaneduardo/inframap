import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PanelResizerProps {
  side: 'left' | 'right';
  defaultWidth: number;
  minWidth?: number;
  maxWidth?: number;
  isVisible: boolean;
  onToggleVisible: () => void;
  children: React.ReactNode;
}

export const PanelResizer: React.FC<PanelResizerProps> = ({
  side,
  defaultWidth,
  minWidth = 180,
  maxWidth = 360,
  isVisible,
  onToggleVisible,
  children,
}) => {
  const [width, setWidth] = useState<number>(defaultWidth);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(defaultWidth);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsResizing(true);
      startXRef.current = e.clientX;
      startWidthRef.current = width;

      const handleMouseMove = (mouseEvent: MouseEvent) => {
        const deltaX = mouseEvent.clientX - startXRef.current;
        const newWidth = side === 'left' ? startWidthRef.current + deltaX : startWidthRef.current - deltaX;
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth);
        }
      };

      const handleMouseUp = () => {
        setIsResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [side, width, minWidth, maxWidth]
  );

  if (!isVisible) {
    return (
      <button
        onClick={onToggleVisible}
        className={`absolute top-2 z-30 p-1.5 theme-bg-surface border theme-border rounded-md shadow-md theme-text-main hover:bg-[var(--bg-surface-hover)] transition-all ${
          side === 'left' ? 'left-2' : 'right-2'
        }`}
        title={side === 'left' ? 'Exibir painel de camadas' : 'Exibir painel de propriedades'}
      >
        {side === 'left' ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    );
  }

  return (
    <div
      className={`relative flex flex-col h-full theme-bg-surface border-slate-700/50 z-20 shrink-0 ${
        side === 'left' ? 'border-r theme-border' : 'border-l theme-border'
      }`}
      style={{ width: `${width}px` }}
    >
      {/* Collapse button header icon */}
      <button
        onClick={onToggleVisible}
        className={`absolute top-2.5 z-30 p-1 theme-text-muted hover:theme-text-main hover:bg-[var(--bg-surface-hover)] rounded transition-colors ${
          side === 'left' ? 'right-2' : 'left-2'
        }`}
        title="Recolher painel"
      >
        {side === 'left' ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{children}</div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`absolute top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500/50 transition-colors z-40 ${
          isResizing ? 'bg-blue-500' : 'bg-transparent'
        } ${side === 'left' ? 'right-0 -mr-0.75' : 'left-0 -ml-0.75'}`}
      />
    </div>
  );
};
