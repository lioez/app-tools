import React from 'react';
import { X, ShieldCheck, Database, Zap, Info } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-250">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Info size={20} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">关于项目 & 隐私说明</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-3 text-blue-700">
              <ShieldCheck size={24} />
              <h3 className="text-lg font-semibold">隐私与安全 (Privacy First)</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              本工具专为注重隐私的用户设计。您的所有书签数据均存储在<b>您的浏览器本地 (LocalStorage)</b>。
              我们没有后端服务器，不会持久化存储您的任何敏感信息。
            </p>
            <ul className="mt-4 space-y-2 list-disc list-inside text-gray-500 text-sm">
              <li>数据流向：您的电脑 ↔ 浏览器本地存储。</li>
              <li>AI 整理：仅在您主动点击“AI 整理”时，书签的标题和 URL 会发送至 Google Gemini 进行语义分析。</li>
              <li>安全性：代码完全透明，不采集个人上网轨迹。</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3 text-indigo-700">
              <Database size={24} />
              <h3 className="text-lg font-semibold">本地存储机制</h3>
            </div>
            <p className="text-gray-600 leading-relaxed">
              数据保存于当前浏览器的缓存中。如果您清除浏览器缓存或更换浏览器，数据将会重置。建议定期从 Edge 导出备份。
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Zap size={24} />
              <h3 className="text-lg font-semibold">快速使用指南</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-2">1. 导出书签</h4>
                <p className="text-xs text-gray-500">在 Edge 浏览器中访问 <code className="bg-gray-200 px-1">edge://favorites/</code>，点击右上角 "..." 选择 "导出书签"。</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-gray-100">
                <h4 className="font-bold text-gray-700 mb-2">2. 导入与整理</h4>
                <p className="text-xs text-gray-500">上传 HTML 文件后，点击侧边栏的 "AI 整理"，Gemini 将自动根据网页内容为您分类。</p>
              </div>
            </div>
          </section>
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <span className="text-xs text-gray-400">Version 1.0.0 · Build with ❤️ & Gemini API</span>
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
          >
            我明白了
          </button>
        </div>
      </div>
    </div>
  );
};

export default AboutModal;