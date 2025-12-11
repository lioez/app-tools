import React, { useState, useEffect, useMemo, useRef } from 'react'
import Sidebar from './components/Sidebar'
import BookmarkGrid from './components/BookmarkGrid'
import ImportModal from './components/ImportModal'
import AboutModal from './components/AboutModal'
import { Bookmark, Category, ALL_BOOKMARKS, UNCATEGORIZED } from './types'
import { categorizeBookmarks } from './services/geminiService'
import { generateBookmarkHtml } from './utils/parser'
import { Search, Download, Trash2, FolderInput, X } from 'lucide-react'

const STORAGE_KEY = 'edge_bookmarks_v1'

const App: React.FC = () => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [manualCategories, setManualCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<Category>(ALL_BOOKMARKS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false)

  const [isOrganizing, setIsOrganizing] = useState(false)
  const [organizeProgress, setOrganizeProgress] = useState(0)
  const [organizeStatus, setOrganizeStatus] = useState('')

  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' } | null>(null)

  const progressTimerRef = useRef<number | null>(null)

  // 初始化加载
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        setBookmarks(data.bookmarks || [])
        setManualCategories(data.manualCategories || [])
      } catch (e) {
        console.error("加载数据失败", e)
      }
    }
  }, [])

  // 持久化存储
  useEffect(() => {
    if (bookmarks.length > 0 || manualCategories.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ bookmarks, manualCategories }))
    }
  }, [bookmarks, manualCategories])

  const handleImport = (newBookmarks: Bookmark[]) => {
    setBookmarks(prev => {
      const existingUrls = new Set(prev.map(b => b.url))
      const filtered = newBookmarks.filter(b => !existingUrls.has(b.url))
      return [...prev, ...filtered]
    })
    showNotification(`已导入 ${newBookmarks.length} 个书签`, 'success')
  }

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除这个书签吗？')) {
      setBookmarks(prev => prev.filter(b => b.id !== id))
      setSelectedIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
      showNotification('已删除', 'success')
    }
  }

  const handleDeleteCategory = (catName: string) => {
    const choice = window.confirm(`确定要删除分类 "${catName}" 吗？\n删除后，该分类下的书签将变为"未分类"。`)
    if (choice) {
      setBookmarks(prev => prev.map(b => b.category === catName ? { ...b, category: UNCATEGORIZED } : b))
      setManualCategories(prev => prev.filter(c => c !== catName))
      if (selectedCategory === catName) setSelectedCategory(ALL_BOOKMARKS)
      showNotification('分类已移除', 'success')
    }
  }

  const handleBatchDelete = () => {
    if (window.confirm(`确定要删除选中的 ${selectedIds.size} 个书签吗？`)) {
      setBookmarks(prev => prev.filter(b => !selectedIds.has(b.id)))
      setSelectedIds(new Set())
      showNotification('批量删除成功', 'success')
    }
  }

  const handleBatchMove = (targetCategory: string) => {
    setBookmarks(prev => prev.map(b =>
      selectedIds.has(b.id) ? { ...b, category: targetCategory } : b
    ))
    setSelectedIds(new Set())
    showNotification(`已移动到 ${targetCategory}`, 'success')
  }

  const handleCreateCategory = (name: string) => {
    if (!manualCategories.includes(name)) {
      setManualCategories(prev => [...prev, name].sort())
    }
  }

  const getOrganizeStatusText = (progress: number) => {
    if (progress < 15) return "🔍 正在扫描书签结构与索引..."
    if (progress < 40) return "🧠 正在提取网页语义特征..."
    if (progress < 70) return "🤖 Gemini 正在构思分类方案..."
    if (progress < 90) return "📁 正在优化分类层级关系..."
    if (progress < 100) return "⏳ 正在生成最终归类报告..."
    return "✅ 整理完成！"
  }

  const handleAutoOrganize = async () => {
    if (bookmarks.length === 0) return

    setIsOrganizing(true)
    setOrganizeProgress(0)
    setOrganizeStatus(getOrganizeStatusText(0))

    // 使用引用的方式在定时器中共享结果
    let finalMapping: Map<string, string> | null = null
    let isDataReady = false

    const toProcessCount = Math.min(bookmarks.length, 300)
    const estimatedTotalSeconds = 8 + (toProcessCount * 0.35)
    const updateFrequencyMs = 100 // 提高频率让“冲刺”更顺滑
    const totalSteps = (estimatedTotalSeconds * 1000) / updateFrequencyMs

    let currentStep = 0
    let currentProgress = 0

    const startSimulatingProgress = () => {
      progressTimerRef.current = window.setInterval(() => {
        if (!isDataReady) {
          // 预估阶段：非线性平滑增长
          currentStep++
          const normalizedStep = currentStep / totalSteps
          if (normalizedStep < 0.85) {
            currentProgress = normalizedStep * 85
          } else {
            // 85% 以后极慢，趋向 99
            const subStep = (currentStep - (totalSteps * 0.85)) / (totalSteps * 3)
            currentProgress = 85 + (14 * (1 - Math.exp(-subStep * 5)))
          }
        } else {
          // 冲刺阶段：AI 已返回，快速推进到 100%
          currentProgress += 5 // 每 100ms 增加 5%，约 0.3 秒冲完
        }

        const p = Math.floor(Math.min(100, currentProgress))
        setOrganizeProgress(p)
        setOrganizeStatus(getOrganizeStatusText(p))

        // 当进度条真正到达 100 时
        if (p >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current)

          // 如果数据已准备好，立即应用更新
          if (finalMapping) {
            const mapping = finalMapping
            setBookmarks(prev => prev.map(b => ({
              ...b,
              category: mapping.get(b.id) || b.category
            })))
            showNotification(`AI 整理完成！已处理 ${toProcessCount} 个书签。`, 'success')
          }

          // 延迟一点关闭状态，让用户看一眼 100% 的成功态
          setTimeout(() => {
            setIsOrganizing(false)
            setOrganizeProgress(0)
            setOrganizeStatus('')
          }, 800)
        }
      }, updateFrequencyMs)
    }

    startSimulatingProgress()

    try {
      const toProcess = bookmarks // 处理全部书签
      const mapping = await categorizeBookmarks(toProcess)

      // 标记数据已准备好，让定时器开始冲刺
      finalMapping = mapping
      isDataReady = true

    } catch (error: any) {
      console.error(error)
      if (progressTimerRef.current) clearInterval(progressTimerRef.current)
      setIsOrganizing(false)
      const errorMsg = error.message?.includes("JSON")
        ? "AI 输出过于庞大被截断，请尝试分批整理。"
        : "AI 整理失败：网络连接异常或 API 额度不足"
      showNotification(errorMsg, 'error')
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 4000)
  }

  const categories = useMemo(() => {
    const catsInBookmarks = new Set(bookmarks.map(b => b.category))
    manualCategories.forEach(c => catsInBookmarks.add(c))
    catsInBookmarks.delete(UNCATEGORIZED)
    return Array.from(catsInBookmarks).sort()
  }, [bookmarks, manualCategories])

  const bookmarkCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    bookmarks.forEach(b => {
      counts[b.category] = (counts[b.category] || 0) + 1
    })
    return counts
  }, [bookmarks])

  const filteredBookmarks = useMemo(() => {
    let result = bookmarks
    if (selectedCategory !== ALL_BOOKMARKS) {
      result = result.filter(b => b.category === selectedCategory)
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
      )
    }
    return result
  }, [bookmarks, selectedCategory, searchQuery])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        totalBookmarks={bookmarks.length}
        bookmarkCounts={bookmarkCounts}
        onAutoOrganize={handleAutoOrganize}
        isOrganizing={isOrganizing}
        organizeProgress={organizeProgress}
        organizeStatus={organizeStatus}
        onOpenImport={() => setIsImportModalOpen(true)}
        onOpenAbout={() => setIsAboutModalOpen(true)}
        onCreateCategory={handleCreateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-gray-800">
              {selectedCategory}
              <span className="ml-2 text-sm font-normal text-gray-400">
                ({filteredBookmarks.length})
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="搜索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-gray-100 border-transparent focus:bg-white border focus:border-blue-500 rounded-lg text-sm w-48 transition-all outline-none"
              />
            </div>

            <button
              onClick={() => {
                const html = generateBookmarkHtml(bookmarks)
                const blob = new Blob([html], { type: 'text/html' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `bookmarks_export.html`
                a.click()
              }}
              disabled={bookmarks.length === 0}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            >
              <Download size={18} />
              导出
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <BookmarkGrid
            bookmarks={filteredBookmarks}
            selectedIds={selectedIds}
            onSelect={toggleSelect}
            onDelete={handleDelete}
          />
        </div>

        {selectedIds.size > 0 && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl px-6 py-4 flex items-center gap-6 z-50 animate-in slide-in-from-bottom-8">
            <div className="flex items-center gap-3 pr-4 border-r border-gray-200">
              <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedIds.size}</span>
              <span className="text-sm font-semibold">项已选</span>
              <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative group/menu">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold flex items-center gap-2">
                  <FolderInput size={16} /> 移动到
                </button>
                <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-xl shadow-xl hidden group-hover/menu:block max-h-60 overflow-y-auto p-1">
                  <button onClick={() => handleBatchMove(UNCATEGORIZED)} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg">{UNCATEGORIZED}</button>
                  {categories.map(cat => (
                    <button key={cat} onClick={() => handleBatchMove(cat)} className="w-full text-left px-3 py-2 text-xs hover:bg-blue-50 rounded-lg">{cat}</button>
                  ))}
                </div>
              </div>
              <button onClick={handleBatchDelete} className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Trash2 size={16} /> 删除
              </button>
            </div>
          </div>
        )}

        {notification && (
          <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-2xl text-white text-sm font-medium z-[100] ${notification.type === 'success' ? 'bg-gray-900' : 'bg-red-600'}`}>
            {notification.message}
          </div>
        )}
      </main>

      <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onImport={handleImport} />
      <AboutModal isOpen={isAboutModalOpen} onClose={() => setIsAboutModalOpen(false)} />
    </div>
  )
}

export default App