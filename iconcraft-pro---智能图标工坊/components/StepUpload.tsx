import React, { useCallback } from 'react';
import { Upload, Image as ImageIcon, FileUp } from 'lucide-react';

interface StepUploadProps {
  onFileSelect: (file: File) => void;
}

const StepUpload: React.FC<StepUploadProps> = ({ onFileSelect }) => {
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="relative group cursor-pointer"
      >
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
        <div className="relative bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 hover:border-indigo-400 transition-colors duration-300 p-12 text-center">
          <input
            type="file"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleInput}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-gray-700/50 rounded-full group-hover:scale-110 transition-transform duration-300">
              <Upload className="w-10 h-10 text-indigo-400" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-white">点击或拖拽图片到这里</h3>
              <p className="text-gray-400 text-sm max-w-xs mx-auto">
                支持 PNG, JPG, WEBP 格式。建议上传主体清晰的图片以获得最佳抠图效果。
              </p>
            </div>

            <div className="pt-4 flex items-center space-x-2 text-xs text-gray-500 uppercase tracking-wider">
              <FileUp className="w-4 h-4" />
              <span>本地极速处理 · 隐私安全</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        {['智能抠图', '尺寸调整', '格式转换'].map((feature, i) => (
          <div key={i} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
            <span className="text-gray-300 font-medium">{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StepUpload;