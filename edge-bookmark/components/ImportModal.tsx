import React, { useRef, useState } from 'react';
import { Upload, X, FileText, AlertCircle, HelpCircle } from 'lucide-react';
import { parseBookmarkHtml } from '../utils/parser';
import { Bookmark } from '../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (bookmarks: Bookmark[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError(null);
    if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
      setError('请上传有效的 HTML 书签文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const bookmarks = parseBookmarkHtml(content);
        if (bookmarks.length === 0) {
          setError('未能识别到书签，请检查文件格式。');
        } else {
          onImport(bookmarks);
          onClose();
        }
      } catch (err) {
        setError('解析文件时出错。');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative animate-in fade-in zoom-in duration-200">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">导入书签</h2>
        <p className="text-gray-500 mb-6 text-sm">
          上传从 Edge 或 Chrome 导出的 HTML 书签文件。我们将解析并由 AI 帮助你整理。
        </p>

        {!showGuide ? (
          <>
            <div 
              className={`
                border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-colors cursor-pointer
                ${isDragging ? 'border-edge-500 bg-edge-50' : 'border-gray-300 hover:border-edge-400 hover:bg-gray-50'}
              `}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="bg-blue-100 p-4 rounded-full mb-4 text-blue-600">
                <Upload size={32} />
              </div>
              <p className="font-medium text-gray-700">点击上传 或 拖拽文件到这里</p>
              <p className="text-xs text-gray-400 mt-2">支持 Edge/Chrome 导出的 bookmarks.html</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".html" 
                onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              />
            </div>

            <button 
              onClick={() => setShowGuide(true)}
              className="mt-6 w-full py-2 flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors border border-gray-100 rounded-lg hover:bg-blue-50"
            >
              <HelpCircle size={16} />
              不知道如何获取 HTML 文件？查看导出指南
            </button>
          </>
        ) : (
          <div className="bg-slate-50 p-5 rounded-xl border border-gray-200 animate-in slide-in-from-right-4 duration-200">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px]">!</div>
              如何导出 Edge 书签
            </h3>
            <ol className="space-y-4 text-sm text-gray-600">
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">01</span>
                在浏览器地址栏输入 <code className="bg-white border px-1.5 py-0.5 rounded text-blue-700">edge://favorites/</code> 并回车。
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">02</span>
                点击页面右上角的 <span className="font-bold">更多选项 (...)</span> 图标。
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">03</span>
                在菜单中选择 <span className="font-bold text-gray-800">导出书签</span>。
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-blue-600">04</span>
                将下载到的 <code className="bg-white border px-1.5 py-0.5 rounded italic">bookmarks.html</code> 文件上传至本站。
              </li>
            </ol>
            <button 
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              返回上传界面
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2 text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportModal;