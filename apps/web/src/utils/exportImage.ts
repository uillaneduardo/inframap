import Konva from 'konva';

export function exportStageToPng(stage: Konva.Stage, fileName: string): void {
  const pixelRatio = 2; // high resolution export
  const dataUrl = stage.toDataURL({ pixelRatio });

  const link = document.createElement('a');
  link.download = `${fileName.replace(/\s+/g, '_').toLowerCase()}_inframap.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
