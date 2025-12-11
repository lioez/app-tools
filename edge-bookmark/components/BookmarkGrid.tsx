import React from 'react';
import { Bookmark, UNCATEGORIZED } from '../types';
import { ExternalLink, Globe, Trash2, Tag, CheckCircle2, Circle } from 'lucide-react';
import { getFaviconUrl } from '../utils/parser';

interface BookmarkGridProps {
  bookmarks: Bookmark[];
  selectedIds: Set<string>;
  onSelect: (id: string, multi: boolean) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({ bookmarks, selectedIds, onSelect, onDelete, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-gray-400">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <Globe size={48} className="text-gray-300" />
        </div>
        <p className="text-lg font-medium">暂无书签</p>
        <p className="text-sm">点击左侧 "导入" 按钮开始使用</p>
      </div>
    );
  }

  const handleCardClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleToggleSelect = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation(); // 阻止触发卡片的跳转逻辑
    onSelect(id, e.ctrlKey || e.metaKey);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-32">
      {bookmarks.map((bookmark) => {
        const isSelected = selectedIds.has(bookmark.id);
        return (
          <div 
            key={bookmark.id} 
            onClick={() => handleCardClick(bookmark.url)}
            className={`
              group relative bg-white rounded-xl border transition-all duration-200 flex flex-col p-4 cursor-pointer select-none
              ${isSelected ? 'border-blue-500 ring-2 ring-blue-50 shadow-md' : 'border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 hover:border-blue-200'}
            `}
          >
            {/* 独立的选择热区 */}
            <div 
              onClick={(e) => handleToggleSelect(e, bookmark.id)}
              className={`
                absolute top-2 left-2 z-20 p-2 rounded-full transition-all
                ${isSelected ? 'opacity-100 text-blue-500 scale-110' : 'opacity-0 group-hover:opacity-100 text-gray-300 hover:bg-gray-100'}
              `}
              title={isSelected ? "取消选择" : "选择书签以批量整理"}
            >
              {isSelected ? <CheckCircle2 size={18} fill="white" /> : <Circle size={18} />}
            </div>

            <div className="flex items-start justify-between mb-3 pl-7">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-9 h-9 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                   <img 
                     src={bookmark.icon || getFaviconUrl(bookmark.url)} 
                     alt="" 
                     className="w-5 h-5 object-contain"
                     loading="lazy"
                     onError={(e) => {
                       (e.target as HTMLImageElement).src = `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}`; 
                       (e.target as HTMLImageElement).style.opacity = "0.5";
                     }}
                   />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <h3 className="font-semibold text-gray-800 truncate text-sm leading-tight group-hover:text-blue-600 transition-colors" title={bookmark.title}>
                    {bookmark.title}
                  </h3>
                  <span className="text-[10px] text-gray-400 truncate mt-0.5">{new URL(bookmark.url).hostname}</span>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDelete(bookmark.id);
                }}
                className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 -mt-1 -mr-1"
                title="删除书签"
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="mt-auto pt-3 flex items-center justify-between border-t border-gray-50">
              <span className={`
                text-[10px] px-2 py-0.5 rounded-md font-medium flex items-center gap-1 max-w-[140px] truncate
                ${bookmark.category === UNCATEGORIZED 
                  ? 'bg-gray-100 text-gray-500' 
                  : 'bg-blue-50 text-blue-600'}
              `}>
                <Tag size={10} />
                {bookmark.category}
              </span>
              
              <div className="text-gray-300 group-hover:text-blue-400 transition-colors">
                <ExternalLink size={14} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default BookmarkGrid;