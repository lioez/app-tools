import React, { useState, useEffect } from 'react';
import { 
  Download, 
  SlidersHorizontal, 
  Layers, 
  RefreshCw, 
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ImageState, ExportSettings, FileFormat } from '../types';
import { resizeAndExport, processBackgroundRemoval } from '../utils/imageProcessor';
import { downloadBlob } from '../utils/converter';

interface StepEditorProps {
  imageState: ImageState;
  onUpdateState: (updates: Partial<ImageState>) => void;
  onReset: () => void;
}

const PRESET_SIZES = [16, 32, 48, 64, 128, 256, 512, 1024];

const StepEditor: React.FC<StepEditorProps> = ({ imageState, onUpdateState, onReset }) => {
  const [settings, setSettings] = useState<ExportSettings>({
    width: 512,
    height: 512,
    format: FileFormat.PNG,
    keepAspectRatio: true
  });
  const [isExporting, setIsExporting] = useState(false);

  // Auto-process background removal on mount
  useEffect(() => {
    const processImage = async () => {
      if (imageState.processedUrl || imageState.isProcessing || !imageState.originalFile) return;

      onUpdateState({ isProcessing: true, error: null });
      try {
        const processedBlob = await processBackgroundRemoval(imageState.originalFile);
        const url = URL.createObjectURL(processedBlob);
        onUpdateState({ processedUrl: url, isProcessing: false });
      } catch (err) {
        onUpdateState({ 
          isProcessing: false, 
          error: err instanceof Error ? err.message : "处理失败" 
        });
      }
    };

    processImage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleExport = async () => {
    if (!imageState.processedUrl) return;
    setIsExporting(true);
    try {
      const blob = await resizeAndExport(
        imageState.processedUrl,
        settings.width,
        settings.height,
        settings.format
      );
      
      const fileName = `iconcraft_${settings.width}x${settings.height}.${settings.format}`;
      downloadBlob(blob, fileName);
    } catch (err) {
      console.error(err);
      alert("导出失败，请重试");
    } finally {
      setIsExporting(false);
    }
  };

  const updateSize = (dim: 'width' | 'height', val: number) => {
    const newSettings = { ...settings, [dim]: val };
    if (settings.keepAspectRatio) {
      // Simple aspect ratio logic - assuming square for icons usually, 
      // but strictly we should calculate based on original ratio.
      // For icons, forcing square is often desired behavior.
      if (dim === 'width') newSettings.height = val;
      if (dim === 'height') newSettings.width = val;
    }
    setSettings(newSettings);
  };

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col lg:flex-row gap-8 animate-fade-in">
      
      {/* Left Column: Preview Area */}
      <div className="flex-1 space-y-6">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-6 shadow-xl overflow-hidden relative min-h-[400px] flex items-center justify-center">
          
          {/* Checkerboard Background for transparency */}
          <div className="absolute inset-0 z-0 opacity-20" 
               style={{ 
                 backgroundImage: 'linear-gradient(45deg, #374151 25%, transparent 25%), linear-gradient(-45deg, #374151 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #374151 75%), linear-gradient(-45deg, transparent 75%, #374151 75%)',
                 backgroundSize: '20px 20px',
                 backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
               }} 
          />

          <div className="relative z-10 w-full h-full flex items-center justify-center p-8">
             {imageState.isProcessing ? (
               <div className="text-center space-y-4">
                 <div className="relative w-16 h-16 mx-auto">
                   <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full"></div>
                   <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                 </div>
                 <p className="text-indigo-300 font-medium animate-pulse">正在智能去除背景...</p>
                 <p className="text-xs text-gray-500">首次运行可能需要下载模型 (约50MB)</p>
               </div>
             ) : imageState.error ? (
               <div className="text-center text-red-400 space-y-2">
                 <AlertCircle className="w-12 h-12 mx-auto" />
                 <p>{imageState.error}</p>
                 <button onClick={onReset} className="text-sm underline hover:text-red-300">重试</button>
               </div>
             ) : (
               <img 
                 src={imageState.processedUrl || imageState.originalUrl || ''} 
                 alt="Preview" 
                 className="max-w-full max-h-[400px] object-contain drop-shadow-2xl transition-all duration-300"
                 style={{ width: `${Math.min(settings.width, 400)}px` }}
               />
             )}
          </div>
          
          {/* Comparison Toggle (could be added here, keeping it simple for now) */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center text-xs text-gray-400">
             <span>预览尺寸: {settings.width}x{settings.height}</span>
             {imageState.processedUrl && <span className="flex items-center text-green-400"><CheckCircle2 className="w-3 h-3 mr-1"/> 已去底</span>}
          </div>
        </div>
      </div>

      {/* Right Column: Controls */}
      <div className="w-full lg:w-80 space-y-6">
        
        {/* Panel: Settings */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-6">
          <div className="flex items-center space-x-2 text-indigo-400 border-b border-gray-700 pb-3">
            <SlidersHorizontal className="w-5 h-5" />
            <span className="font-semibold">导出设置</span>
          </div>

          {/* Size Presets */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">常用尺寸</label>
            <div className="grid grid-cols-4 gap-2">
              {PRESET_SIZES.map(size => (
                <button
                  key={size}
                  onClick={() => {
                    setSettings(s => ({ ...s, width: size, height: size }));
                  }}
                  className={`px-2 py-1.5 text-xs rounded border transition-colors ${
                    settings.width === size 
                      ? 'bg-indigo-600 border-indigo-500 text-white' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Size */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs text-gray-400">宽度 (px)</label>
              <input 
                type="number" 
                value={settings.width}
                onChange={(e) => updateSize('width', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-gray-400">高度 (px)</label>
              <input 
                type="number" 
                value={settings.height}
                onChange={(e) => updateSize('height', parseInt(e.target.value) || 0)}
                className="w-full bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Format */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">导出格式</label>
            <div className="grid grid-cols-3 gap-2">
              {[FileFormat.PNG, FileFormat.ICO, FileFormat.SVG].map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setSettings(s => ({ ...s, format: fmt }))}
                  className={`flex items-center justify-center space-x-1 py-2 rounded border text-sm font-medium uppercase transition-all ${
                    settings.format === fmt
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Panel: Actions */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5 space-y-4">
          <button
            onClick={handleExport}
            disabled={!imageState.processedUrl || isExporting || imageState.isProcessing}
            className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isExporting ? (
               <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
               <Download className="w-5 h-5" />
            )}
            <span>{isExporting ? '处理中...' : '下载图标'}</span>
          </button>

          <button
            onClick={onReset}
            className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-sm font-medium transition-colors border border-gray-600"
          >
            开始新图片
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepEditor;