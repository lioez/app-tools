import React, { useState } from 'react';
import { Category, UNCATEGORIZED, ALL_BOOKMARKS } from '../types';
import { LayoutGrid, Folder, Star, Hash, Sparkles, Info, Plus, FolderPlus, Trash2, X } from 'lucide-react';

interface SidebarProps {
  categories: Category[];
  selectedCategory: Category;
  onSelectCategory: (cat: Category) => void;
  totalBookmarks: number;
  bookmarkCounts: Record<string, number>;
  onAutoOrganize: () => void;
  isOrganizing: boolean;
  organizeProgress: number;
  organizeStatus: string;
  onOpenImport: () => void;
  onOpenAbout: () => void;
  onCreateCategory: (name: string) => void;
  onDeleteCategory: (name: string) => void;
}

const NavItem = ({ cat, icon: Icon, label, count, isSelected, onClick, onDelete }: any) => (
  <div className="group flex items-center mb-1 pr-2">
    <button
      onClick={() => onClick(cat)}
      className={`
        flex-1 flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
        ${isSelected
          ? 'bg-white text-blue-600 shadow-sm border border-gray-100' 
          : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
      `}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <Icon size={18} className={isSelected ? 'text-blue-600' : 'text-gray-400'} />
        <span className="truncate">{label}</span>
      </div>
      {count !== undefined && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
          {count}
        </span>
      )}
    </button>
    {onDelete && (
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(cat); }}
        className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-500 transition-all ml-1"
        title="删除分类"
      >
        <Trash2 size={14} />
      </button>
    )}
  </div>
);

const Sidebar: React.FC<SidebarProps> = ({ 
  categories, 
  selectedCategory, 
  onSelectCategory, 
  totalBookmarks,
  bookmarkCounts,
  onAutoOrganize,
  isOrganizing,
  organizeProgress,
  organizeStatus,
  onOpenImport,
  onOpenAbout,
  onCreateCategory,
  onDeleteCategory
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  const handleCreate = () => {
    if (newCatName.trim()) {
      onCreateCategory(newCatName.trim());
      setNewCatName('');
      setIsCreating(false);
    }
  };

  return (
    <div className="w-64 bg-slate-50 border-r border-gray-200 h-screen flex flex-col shrink-0">
      <div className="p-5 flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md">
            <Star size={18} fill="currentColor" />
          </div>
          <h1 className="font-bold text-gray-800 text-lg tracking-tight">Edge Sync</h1>
        </div>

        <button 
          onClick={onOpenImport}
          className="w-full bg-gray-900 hover:bg-black text-white rounded-xl py-2.5 px-4 font-medium text-sm transition-colors flex items-center justify-center gap-2 shadow-sm mb-6"
        >
          <Folder size={16} />
          导入书签
        </button>

        <nav className="space-y-6 overflow-y-auto custom-scrollbar flex-1 pr-1">
          <div>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">概览</h3>
            <NavItem 
              cat={ALL_BOOKMARKS} 
              label={ALL_BOOKMARKS} 
              icon={LayoutGrid} 
              count={totalBookmarks}
              isSelected={selectedCategory === ALL_BOOKMARKS}
              onClick={onSelectCategory}
            />
            <NavItem 
              cat={UNCATEGORIZED} 
              label={UNCATEGORIZED} 
              icon={Hash} 
              count={bookmarkCounts[UNCATEGORIZED] || 0}
              isSelected={selectedCategory === UNCATEGORIZED}
              onClick={onSelectCategory}
            />
          </div>

          <div>
             <div className="flex items-center justify-between px-3 mb-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">分类清单</h3>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button 
                    onClick={onAutoOrganize}
                    disabled={isOrganizing || totalBookmarks === 0}
                    className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-2 py-1 rounded border border-indigo-200 flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <Sparkles size={10} />
                    AI 整理
                  </button>
                </div>
             </div>

            {isCreating && (
              <div className="px-3 mb-3">
                <div className="flex items-center gap-1 bg-white border border-blue-200 p-1 rounded-lg">
                  <input 
                    autoFocus
                    type="text"
                    placeholder="分类名..."
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                    className="w-full text-xs px-2 py-1 outline-none"
                  />
                  <button onClick={handleCreate} className="p-1 text-blue-600">
                    <FolderPlus size={14} />
                  </button>
                  <button onClick={() => setIsCreating(false)} className="p-1 text-gray-400">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}
            
            {categories.map((cat) => (
              <NavItem 
                key={cat} 
                cat={cat} 
                label={cat} 
                icon={Folder} 
                count={bookmarkCounts[cat] || 0}
                isSelected={selectedCategory === cat}
                onClick={onSelectCategory}
                onDelete={onDeleteCategory}
              />
            ))}
          </div>
        </nav>
      </div>

      <div className="p-4 border-t border-gray-200 bg-white space-y-3">
        {isOrganizing && (
          <div className="px-1 mb-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between text-[10px] font-bold mb-1.5 transition-colors duration-500">
              <span className={`flex items-center gap-1 ${organizeProgress === 100 ? 'text-green-600' : 'text-indigo-600'}`}>
                <Sparkles size={10} className={organizeProgress < 100 ? 'animate-spin' : ''} />
                {organizeProgress === 100 ? '整理已就绪' : '智能整理中...'}
              </span>
              <span className={organizeProgress === 100 ? 'text-green-600' : 'text-indigo-600'}>{organizeProgress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full transition-all duration-300 ease-out relative ${organizeProgress === 100 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]' : 'bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500 bg-[length:200%_100%] animate-shimmer'}`}
                style={{ width: `${organizeProgress}%` }}
              />
            </div>
            <p className={`text-[10px] italic text-center min-h-[1rem] transition-colors duration-500 ${organizeProgress === 100 ? 'text-green-600 font-bold' : 'text-gray-400 animate-pulse'}`}>
              {organizeStatus}
            </p>
          </div>
        )}
        <button 
          onClick={onOpenAbout}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
        >
          <Info size={18} />
          关于与隐私
        </button>
      </div>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};

export default Sidebar;