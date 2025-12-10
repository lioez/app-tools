import React, { useState } from 'react';
import StepUpload from './components/StepUpload';
import StepEditor from './components/StepEditor';
import { AppStep, ImageState } from './types';
import { Layers, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [step, setStep] = useState<AppStep>(AppStep.UPLOAD);
  const [imageState, setImageState] = useState<ImageState>({
    originalFile: null,
    originalUrl: null,
    processedUrl: null,
    isProcessing: false,
    error: null,
    processingProgress: 0,
  });

  const handleFileSelect = (file: File) => {
    const url = URL.createObjectURL(file);
    setImageState({
      ...imageState,
      originalFile: file,
      originalUrl: url,
      processedUrl: null, // Reset previous result
      error: null
    });
    setStep(AppStep.EDITOR);
  };

  const handleUpdateState = (updates: Partial<ImageState>) => {
    setImageState(prev => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    if (imageState.originalUrl) URL.revokeObjectURL(imageState.originalUrl);
    if (imageState.processedUrl) URL.revokeObjectURL(imageState.processedUrl);

    setImageState({
      originalFile: null,
      originalUrl: null,
      processedUrl: null,
      isProcessing: false,
      error: null,
      processingProgress: 0,
    });
    setStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col font-sans">

      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={handleReset}>
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              IconCraft Pro
            </span>
          </div>

          <div className="flex items-center space-x-4">
             <div className="hidden sm:flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-800 border border-gray-700 text-xs font-medium text-gray-300">
                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span>AI Powered</span>
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">

        {step === AppStep.UPLOAD && (
          <div className="w-full flex flex-col items-center">
            <div className="text-center mb-10 space-y-4 max-w-2xl animate-fade-in">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white">
                将图片转换为
                <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                  专业图标素材
                </span>
              </h1>
              <p className="text-lg text-gray-400 max-w-lg mx-auto">
                上传 PNG 或 JPG，自动移除背景，一键生成任意尺寸的 ICO, SVG 或 PNG 图标。
              </p>
            </div>
            <StepUpload onFileSelect={handleFileSelect} />
          </div>
        )}

        {step === AppStep.EDITOR && (
          <StepEditor
            imageState={imageState}
            onUpdateState={handleUpdateState}
            onReset={handleReset}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>© 2025 IconCraft Pro. 本地安全处理，图片不会上传至服务器。</p>
        </div>
      </footer>
    </div>
  );
};

export default App;