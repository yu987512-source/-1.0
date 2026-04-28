import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  Mail, 
  Music, 
  Camera, 
  Map, 
  Calendar, 
  Image as ImageIcon, 
  Clock, 
  Settings, 
  BookOpen,
  Database,
  TrendingUp,
  User,
  X,
  Plus,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  Folder
} from 'lucide-react';
import { Butterfly } from './Butterfly';

interface AppIcon {
  id: string;
  name: string;
  icon: any; 
  color: string;
  iconColor?: string;
  type?: 'app' | 'widget' | 'folder';
  size?: '1x1' | '2x2' | '4x1' | '4x2' | '4x3';
  imageUrl?: string;
  page?: number;
  apps?: AppIcon[];
}

const DEFAULT_APPS: AppIcon[] = [
  { id: "sms", name: "短信", icon: Mail, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "camera", name: "相机", icon: Camera, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "calendar", name: "日历", icon: Calendar, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "phone", name: "电话", icon: Phone, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "clock", name: "时钟", icon: Clock, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "music", name: "音乐", icon: Music, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "map", name: "地图", icon: Map, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "wechat", name: "微信", icon: User, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "memory-center", name: "记忆中枢", icon: Database, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "settings", name: "设置", icon: Settings, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "weibo", name: "微博热搜", icon: TrendingUp, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "photos", name: "相册", icon: ImageIcon, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
  { id: "notes", name: "备忘录", icon: BookOpen, color: "icon-star-bg", iconColor: "text-[#F8C8DC]" },
];

interface HomeScreenProps {
  onOpenApp: (appId: string) => void;
  wallpaper: string;
  customIcons?: Record<string, string>;
}

export default function HomeScreen({ onOpenApp, wallpaper, customIcons }: HomeScreenProps) {
  const [apps, setApps] = useState<AppIcon[]>(() => {
    const saved = localStorage.getItem('app-order-data');
    if (saved) {
      try {
        const savedApps = JSON.parse(saved);
        if (Array.isArray(savedApps)) {
          const restoreIcons = (items: any[]): AppIcon[] => {
            return items.map(item => {
              if (typeof item === 'string') {
                const app = DEFAULT_APPS.find(a => a.id === item);
                return app ? { ...app, page: 0 } : null;
              }
              
              let icon = item.icon;
              if (item.type === 'widget') {
                if (item.name.includes('时间')) icon = Clock;
                else if (item.name === '热搜') icon = TrendingUp;
                else if (item.name.includes('音') || item.name.includes('CD') || item.name.includes('Music')) icon = Music;
                else icon = Database;
              } else if (item.type === 'folder') {
                icon = Folder;
                if (item.apps) item.apps = restoreIcons(item.apps);
              } else {
                const defaultApp = DEFAULT_APPS.find(a => a.id === item.id);
                if (defaultApp) icon = defaultApp.icon;
              }
              
              return { ...item, icon, page: item.page ?? 0 };
            }).filter(Boolean);
          };

          const loadedApps = restoreIcons(savedApps);
          
          // Ensure "相册" and "微信" are restored if missing from both grid and dock
          // Note: WeChat is in Dock by default, but user wants it back on the main grid if "误删"
          ['photos', 'wechat'].forEach(id => {
            if (!loadedApps.some(a => a.id === id)) {
              const app = DEFAULT_APPS.find(a => a.id === id);
              if (app) loadedApps.push({ ...app, page: 0 });
            }
          });
          
          if (!loadedApps.some(a => a.id === 'memory-center')) {
            const memoryApp = DEFAULT_APPS.find(a => a.id === 'memory-center');
            if (memoryApp) loadedApps.push({ ...memoryApp, page: 0 });
          }
          return loadedApps;
        }
      } catch (e) {
        console.error("Failed to parse saved apps:", e);
      }
    }
    return DEFAULT_APPS.map(app => ({ ...app, page: 0 }));
  });

  const [isEditing, setIsEditing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AppIcon['size'] | null>(null);
  const [editingWidgetId, setEditingWidgetId] = useState<string | null>(null);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [folderHoverId, setFolderHoverId] = useState<string | null>(null);
  const [openedFolderId, setOpenedFolderId] = useState<string | null>(null);
  const [editingFolderNameId, setEditingFolderNameId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  const [edgeTimer, setEdgeTimer] = useState<NodeJS.Timeout | null>(null);
  
  const totalPages = Math.max(0, ...apps.map(a => a.page), currentPage) + 1;
  
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const dragRaf = useRef<number | null>(null);

  // Grid Constants
  const COLS = 4;
  const CELL_SIZE = 85; // Refined for 375px screen (375-32)/4 ≈ 85
  const SPACING = 24; // Matches gap-y-6
  const GRID_PT = 64; // pt-16
  const GRID_PX = 16; // px-4

  useEffect(() => {
    const cleanForSync = (items: AppIcon[]): any[] => {
      return items.map(({ icon, apps: folderApps, ...rest }) => ({
        ...rest,
        apps: folderApps ? cleanForSync(folderApps) : undefined
      }));
    };
    
    const dataToSave = cleanForSync(apps);
    localStorage.setItem('app-order-data', JSON.stringify(dataToSave));
    localStorage.setItem('app-order', JSON.stringify(apps.map(a => a.id))); // Backward compatibility
  }, [apps]);

  const removeApp = (e: React.MouseEvent, appId: string) => {
    e.stopPropagation();
    setConfirmDeleteId(appId);
  };

  const handleConfirmDelete = () => {
    if (confirmDeleteId) {
      setApps(prev => prev.filter(app => app.id !== confirmDeleteId));
      setConfirmDeleteId(null);
    }
  };

  const updateWidgetImage = (id: string, url: string) => {
    setApps(prev => prev.map(app => app.id === id ? { ...app, imageUrl: url } : app));
    setEditingWidgetId(null);
    setCustomImageUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, size: AppIcon['size'] | null, id?: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (id) {
          updateWidgetImage(id, result);
        } else if (size) {
          addWidget('自定义图片', size, result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const addWidget = (type: string, size: AppIcon['size'], imageUrl?: string) => {
    const newWidget: AppIcon = {
      id: `widget-${Date.now()}`,
      name: type,
      icon: (type.includes('时间') || type.includes('Time')) ? Clock : (type.includes('音') || type.includes('Music')) ? Music : type === '热搜' ? TrendingUp : Database,
      color: (type.includes('iOS') || type.includes('网易云') || type.includes('Music') || type === '音乐' || type === 'QQ音乐') ? 'bg-pink-100/30' : type === '半屏' ? 'bg-gradient-to-br from-pink-100 to-pink-300' : 'bg-white/10',
      type: 'widget',
      size: size,
      imageUrl: imageUrl,
      page: currentPage
    };
    setApps(prev => [...prev, newWidget]);
    setIsMenuOpen(false);
    setSelectedCategory(null);
    setCustomImageUrl('');
  };

  // Clean empty pages and handle current page bounds
  useEffect(() => {
    if (draggedId) return;
    
    const pageIndices = Array.from(new Set(apps.map(a => a.page ?? 0))).sort((a: number, b: number) => a - b);
    const emptyPages = pageIndices.filter(p => p !== 0 && !apps.some(a => (a.page ?? 0) === p));
    
    if (emptyPages.length > 0) {
      const remainingPages = pageIndices.filter(p => !emptyPages.includes(p));
      const pageMap = new Map<number, number>();
      remainingPages.forEach((oldP, newP) => pageMap.set(oldP, newP));
      
      setApps(prev => prev.map(a => ({ ...a, page: pageMap.get(a.page ?? 0) ?? 0 })));
    }

    // Ensure current page is valid
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [apps, draggedId, totalPages]);

  const startLongPress = (appId: string) => {
    if (isEditing) return;
    longPressTimer.current = setTimeout(() => {
      setIsEditing(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 200);
  };

  const mergeToFolder = (sourceId: string, targetId: string) => {
    setApps(prev => {
      const source = prev.find(a => a.id === sourceId);
      const target = prev.find(a => a.id === targetId);
      
      if (!source || !target || sourceId === targetId) return prev;
      if (source.type === 'widget') return prev; // Widgets don't go in folders usually

      const newApps = [...prev];
      const targetIdx = newApps.findIndex(a => a.id === targetId);

      if (target.type === 'folder') {
        // Add to existing folder
        newApps[targetIdx] = {
          ...target,
          apps: [...(target.apps || []), source]
        };
        return newApps.filter(a => a.id !== sourceId);
      } else {
        // Create new folder
        const newFolder: AppIcon = {
          id: `folder-${Date.now()}`,
          name: "新建文件夹",
          icon: Folder,
          color: "bg-white/20 backdrop-blur-md", // Pinkish glass look
          type: 'folder',
          size: '2x2',
          page: target.page,
          apps: [target, source]
        };
        const filtered = newApps.filter(a => a.id !== sourceId && a.id !== targetId);
        const finalApps = [...filtered];
        // Insert where target was
        const actualTargetIndex = prev.findIndex(a => a.id === targetId);
        // Need to compensate for source removal if it was before target
        const sourceIdx = prev.findIndex(a => a.id === sourceId);
        let insertAt = actualTargetIndex;
        if (sourceIdx < actualTargetIndex) insertAt--;
        
        finalApps.splice(Math.max(0, insertAt), 0, newFolder);
        return finalApps;
      }
    });
  };

  const removeFromFolder = (folderId: string, appId: string) => {
    setApps(prev => {
      const folder = prev.find(a => a.id === folderId);
      if (!folder || !folder.apps) return prev;
      
      const appToExtract = folder.apps.find(a => a.id === appId);
      if (!appToExtract) return prev;

      const remainingApps = folder.apps.filter(a => a.id !== appId);
      
      if (remainingApps.length === 0) {
        // Folder is empty now, remove it
        return prev.filter(a => a.id !== folderId).concat({ ...appToExtract, page: currentPage });
      }

      if (remainingApps.length === 1) {
        // Only one left, disband folder
        const lastApp = remainingApps[0];
        return prev.map(a => a.id === folderId ? { ...lastApp, page: folder.page } : a).concat({ ...appToExtract, page: currentPage });
      }

      // Update folder and move app to current page
      return prev.map(a => a.id === folderId ? { ...a, apps: remainingApps } : a).concat({ ...appToExtract, page: currentPage });
    });
  };

  const handlePointerDown = (e: React.PointerEvent, app: AppIcon, index: number) => {
    if (isEditing) {
      setDraggedId(app.id);
      setTargetIndex(index);
      setDragPosition({ x: e.clientX, y: e.clientY });
    } else {
      startLongPress(app.id);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedId || !isEditing || !containerRef.current) return;

    if (dragRaf.current) cancelAnimationFrame(dragRaf.current);

    dragRaf.current = requestAnimationFrame(() => {
      setDragPosition({ x: e.clientX, y: e.clientY });

      const rect = containerRef.current!.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const relY = e.clientY - rect.top;

      // Edge detection for page switching (Visual position based - 10% threshold)
      const edgeThreshold = window.innerWidth * 0.1;
      const atLeftEdge = e.clientX < edgeThreshold;
      const atRightEdge = e.clientX > window.innerWidth - edgeThreshold;

      if (atLeftEdge && currentPage > 0) {
        if (!edgeTimer) {
          const timer = setTimeout(() => {
            setCurrentPage(prev => {
              const next = prev - 1;
              setApps(appsPrev => {
                const updated = appsPrev.map(a => a.id === draggedId ? { ...a, page: next } : a);
                const item = updated.find(a => a.id === draggedId);
                const others = updated.filter(a => a.id !== draggedId);
                if (!item) return updated;
                const nextPageItems = others.filter(a => (a.page ?? 0) === next);
                const nonNextPageItems = others.filter(a => (a.page ?? 0) !== next);
                // Insert at the beginning of the next page for predictable snap
                return [...nonNextPageItems, item, ...nextPageItems];
              });
              return next;
            });
            setEdgeTimer(null);
          }, 200); // Faster trigger
          setEdgeTimer(timer);
        }
        return; // Skip grid calculation while switching pages
      } else if (atRightEdge) {
        if (!edgeTimer) {
          const timer = setTimeout(() => {
            setCurrentPage(prev => {
              const next = prev + 1;
              setApps(appsPrev => {
                const updated = appsPrev.map(a => a.id === draggedId ? { ...a, page: next } : a);
                const item = updated.find(a => a.id === draggedId);
                const others = updated.filter(a => a.id !== draggedId);
                if (!item) return updated;
                const nextPageItems = others.filter(a => (a.page ?? 0) === next);
                const nonNextPageItems = others.filter(a => (a.page ?? 0) !== next);
                // Insert at the beginning of the next page for predictable snap
                return [...nonNextPageItems, item, ...nextPageItems];
              });
              return next;
            });
            setEdgeTimer(null);
          }, 200);
          setEdgeTimer(timer);
        }
        return; // Skip grid calculation while switching pages
      } else {
        if (edgeTimer) {
          clearTimeout(edgeTimer);
          setEdgeTimer(null);
        }
      }

      // Calculate grid position (aware of filtered apps for current page)
      const pageApps = apps.filter(a => (a.page ?? 0) === currentPage);
      const col = Math.max(0, Math.min(COLS - 1, Math.floor((relX - GRID_PX) / (CELL_SIZE))));
      const row = Math.max(0, Math.floor((relY - GRID_PT) / (CELL_SIZE + SPACING)));
      const newTargetIndex = Math.max(0, Math.min(pageApps.length - 1, row * COLS + col));

      // Overlap detection for folders
      const targetApp = pageApps[newTargetIndex];
      if (targetApp && targetApp.id !== draggedId && targetApp.type !== 'widget') {
        const targetCenterX = GRID_PX + (col + 0.5) * CELL_SIZE;
        const targetCenterY = GRID_PT + (row + 0.5) * (CELL_SIZE + SPACING);
        const dist = Math.hypot(relX - targetCenterX, relY - targetCenterY);
        
        if (dist < 40) { // Merging threshold
          setFolderHoverId(targetApp.id);
          return; // Don't reorder while hovering for merge
        }
      }
      
      setFolderHoverId(null);

      if (newTargetIndex !== targetIndex) {
        setTargetIndex(newTargetIndex);
        
        // Reorder apps array within the current page
        setApps(prev => {
          const pageItems = prev.filter(a => (a.page ?? 0) === currentPage);
          const otherItems = prev.filter(a => (a.page ?? 0) !== currentPage);
          
          const oldIndex = pageItems.findIndex(a => a.id === draggedId);
          if (oldIndex === -1) return prev; // Should handle if draggedId moved pages
          
          const newPageItems = [...pageItems];
          const [removed] = newPageItems.splice(oldIndex, 1);
          newPageItems.splice(newTargetIndex, 0, removed);
          
          return [...otherItems, ...newPageItems];
        });
      }
    });
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (dragRaf.current) cancelAnimationFrame(dragRaf.current);
    if (edgeTimer) {
      clearTimeout(edgeTimer);
      setEdgeTimer(null);
    }

    if (draggedId && folderHoverId) {
      mergeToFolder(draggedId, folderHoverId);
    }

    setDraggedId(null);
    setTargetIndex(null);
    setFolderHoverId(null);
  };

  return (
    <motion.div 
      className="relative w-full h-full overflow-hidden phone-screen select-none touch-none"
      onClick={() => isEditing && setIsEditing(false)}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPanEnd={(_, info) => {
        if (draggedId) return;
        const threshold = 50;
        if (info.offset.x > threshold && currentPage > 0) {
          setCurrentPage(prev => prev - 1);
        } else if (info.offset.x < -threshold && currentPage < totalPages - 1) {
          setCurrentPage(prev => prev + 1);
        }
      }}
    >
      <div className="absolute inset-0 bg-star-pattern opacity-40 pointer-events-none"></div>
      <Butterfly />

      {/* Edit Mode Controls */}
      <AnimatePresence>
        {isEditing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-12 right-6 z-[100]"
          >
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(true);
              }}
              className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-[14px] flex items-center justify-center text-pink-300 shadow-lg border border-white/20 cursor-pointer"
            >
              <Plus size={24} strokeWidth={2.5} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Selection Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => {
                setIsMenuOpen(false);
                setSelectedCategory(null);
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-white/10 backdrop-blur-3xl rounded-[32px] p-6 border border-white/20 shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-white text-lg font-semibold">
                  {selectedCategory ? `${selectedCategory} 小组件` : '添加小组件'}
                </h3>
                {selectedCategory && (
                  <button 
                    onClick={() => setSelectedCategory(null)}
                    className="text-pink-300 text-sm font-medium"
                  >
                    返回
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 py-2 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {!selectedCategory ? (
                  // Category List (Sizes)
                  <div className="grid grid-cols-2 gap-3">
                    {(['1x1', '2x2', '4x1', '4x2', '4x3'] as const).map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedCategory(size)}
                        className="flex flex-col items-center justify-center gap-3 p-6 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors"
                      >
                        <div className={`
                          rounded-lg bg-pink-400/20 border border-pink-400/30
                          ${size === '1x1' ? 'w-4 h-4' : size === '2x2' ? 'w-8 h-8' : size === '4x1' ? 'w-16 h-4' : size === '4x2' ? 'w-16 h-8' : 'w-16 h-12'}
                        `} />
                        <span className="text-white text-sm font-medium">{size} 分类</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  // Widget List for Selected Size
                  <div className="flex flex-col gap-3">
                    {/* Custom Image Option at the top of every category */}
                    <button 
                      onClick={() => setEditingWidgetId('new')}
                      className="flex items-center gap-4 p-4 bg-pink-400/10 rounded-2xl border border-pink-400/20 hover:bg-pink-400/20 transition-colors text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-pink-400/20 flex items-center justify-center text-pink-300">
                        <Plus size={24} />
                      </div>
                      <div>
                        <div className="text-white font-medium">自定义小组件 ({selectedCategory})</div>
                        <div className="text-pink-200/60 text-xs mt-0.5">上传图片或输入链接作为背景</div>
                      </div>
                    </button>

                    <div className="h-px bg-white/5 my-1" />

                    {selectedCategory === '1x1' && (
                      <button 
                        onClick={() => addWidget('迷你时间', '1x1')}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-pink-100/10 flex items-center justify-center text-pink-200">
                          <Clock size={24} />
                        </div>
                        <div>
                          <div className="text-white font-medium">迷你时钟</div>
                          <div className="text-white/40 text-xs mt-0.5">1×1 图标大小组件</div>
                        </div>
                      </button>
                    )}
                    {selectedCategory === '4x1' && (
                      <button 
                        onClick={() => addWidget('快速启动', '4x1')}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-green-400/20 flex items-center justify-center text-green-200">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <div className="text-white font-medium">快捷工具栏</div>
                          <div className="text-white/40 text-xs mt-0.5">横向 4×1 基础布局</div>
                        </div>
                      </button>
                    )}
                    {selectedCategory === '4x2' && (
                      <button 
                        onClick={() => addWidget('热搜', '4x2')}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-orange-400/20 flex items-center justify-center text-orange-200">
                          <TrendingUp size={24} />
                        </div>
                        <div>
                          <div className="text-white font-medium">微博热搜</div>
                          <div className="text-white/40 text-xs mt-0.5">实时更新社交媒体热门话题</div>
                        </div>
                      </button>
                    )}
                    {selectedCategory === '2x2' && (
                      <>
                        <button 
                          onClick={() => addWidget('网易云CD', '2x2')}
                          className="flex items-center gap-4 p-4 bg-pink-100/10 rounded-2xl border border-pink-100/20 hover:bg-pink-100/20 transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-pink-400/20 flex items-center justify-center text-pink-200">
                             <Music size={24} />
                          </div>
                          <div>
                            <div className="text-white font-medium">播放器</div>
                            <div className="text-white/40 text-xs mt-0.5">基础 2×2 娱乐组件</div>
                          </div>
                        </button>

                        <button 
                          onClick={() => addWidget('时间', '2x2')}
                          className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-left"
                        >
                          <div className="w-12 h-12 rounded-xl bg-pink-100/10 flex items-center justify-center text-pink-200">
                            <Clock size={24} />
                          </div>
                          <div>
                            <div className="text-white font-medium">圆形时钟</div>
                            <div className="text-white/40 text-xs mt-0.5">基础 2×2 时间组件</div>
                          </div>
                        </button>
                      </>
                    )}
                    {selectedCategory === '4x3' && (
                      <button 
                        onClick={() => addWidget('信息面板', '4x3')}
                        className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors text-left"
                      >
                        <div className="w-12 h-12 rounded-xl bg-indigo-400/20 flex items-center justify-center text-indigo-200">
                          <Database size={24} />
                        </div>
                        <div>
                          <div className="text-white font-medium">多功能面板</div>
                          <div className="text-white/40 text-xs mt-0.5">4×3 扩展内容展示区</div>
                        </div>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Widget Settings Modal */}
      <AnimatePresence>
        {editingWidgetId && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xl"
              onClick={() => {
                setEditingWidgetId(null);
                setCustomImageUrl('');
              }}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-white/10 backdrop-blur-3xl rounded-[32px] p-8 border border-white/20 shadow-2xl"
            >
              <h3 className="text-white text-xl font-semibold mb-6">设置自定义小组件</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">图片链接</label>
                  <input 
                    type="text"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    placeholder="请输入图片 URL..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-pink-400/50 transition-all font-mono text-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-transparent px-2 text-white/20">或</span>
                  </div>
                </div>

                <div>
                  <label className="block text-white/60 text-xs font-medium mb-3 uppercase tracking-wider">本地照片</label>
                  <label className="flex flex-col items-center justify-center gap-2 w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/10 hover:border-pink-400/20 transition-all group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleFileUpload(e, selectedCategory, editingWidgetId === 'new' ? undefined : editingWidgetId!)} 
                    />
                    <Plus size={24} className="text-white/40 group-hover:text-pink-300 transition-colors" />
                    <span className="text-sm text-white/40 group-hover:text-white transition-colors">选择照片上传</span>
                  </label>
                </div>

                <div className="flex gap-4 pt-2">
                  <button 
                    onClick={() => {
                      setEditingWidgetId(null);
                      setCustomImageUrl('');
                    }}
                    className="flex-1 px-4 py-3 bg-white/5 text-white font-medium rounded-xl border border-white/10 hover:bg-white/10 transition-all"
                  >
                    取消
                  </button>
                  <button 
                    disabled={!customImageUrl.trim()}
                    onClick={() => {
                      if (editingWidgetId === 'new' && selectedCategory) {
                        addWidget('自定义图片', selectedCategory, customImageUrl);
                      } else if (editingWidgetId) {
                        updateWidgetImage(editingWidgetId, customImageUrl);
                      }
                    }}
                    className="flex-1 px-4 py-3 bg-pink-400/80 text-white font-medium rounded-xl shadow-lg shadow-pink-500/20 hover:bg-pink-400 transition-all disabled:opacity-40"
                  >
                    确认
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* App Grid Slider */}
      <div className="flex-1 overflow-visible relative">
        <motion.div 
          key={currentPage}
          initial={{ opacity: 0, x: draggedId ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: draggedId ? 0 : -20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          ref={containerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="relative z-10 pt-[58px] px-4 grid grid-cols-4 auto-rows-[85px] gap-y-6 min-h-[500px]"
        >
          <AnimatePresence mode="popLayout">
            {apps.filter(app => (app.page ?? 0) === currentPage).map((app, index) => (
              <motion.div 
              key={app.id}
              layout
              onPointerDown={(e) => handlePointerDown(e, app, index)}
              style={{
                visibility: draggedId === app.id ? 'hidden' : 'visible'
              }}
              animate={isEditing && draggedId !== app.id ? {
                rotate: index % 2 === 0 ? [-1.2, 1.2, -1.2] : [1.2, -1.2, 1.2],
                transition: { rotate: { repeat: Infinity, duration: 0.3 } }
              } : { rotate: 0 }}
              onClick={(e) => {
                if (isEditing) {
                  e.stopPropagation();
                  if (app.type === 'widget' && (app.name === '自定义图片' || app.imageUrl)) {
                    setEditingWidgetId(app.id);
                    setCustomImageUrl(app.imageUrl || '');
                  }
                  return;
                }
                onOpenApp(app.id);
              }}
              className={`flex flex-col items-center gap-1 cursor-pointer relative z-10 ${
                (app.type === 'widget' || app.type === 'folder') 
                  ? app.size === '1x1' ? 'col-span-1 row-span-1'
                  : app.size === '2x2' ? 'col-span-2 row-span-2' 
                  : app.size === '4x1' ? 'col-span-4 row-span-1'
                  : app.size === '4x2' ? 'col-span-4 row-span-2'
                  : app.size === '4x3' ? 'col-span-4 row-span-3'
                  : '' 
                  : ''
              }`}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 35,
                mass: 1
              }}
            >
              {/* Target Placeholder Highlight */}
              {(draggedId && targetIndex === index) && (
                <div className="absolute inset-0 -m-1 bg-[#FFD6E0]/40 rounded-[20px] pointer-events-none ring-2 ring-[#FFD6E0]/60 z-0" />
              )}
              
              {/* Folder Merge Preview */}
              {folderHoverId === app.id && (
                <div className="absolute inset-0 -m-2 bg-pink-400/30 rounded-[24px] pointer-events-none ring-4 ring-pink-400/40 z-0 scale-110" />
              )}

              {(() => {
                const getWidgetStyle = (s: string) => {
                  switch(s) {
                    case '1x1': return { width: '32px', height: '32px' };
                    case '2x2': return { width: '64px', height: '64px' };
                    case '4x1': return { width: '256px', height: '32px' };
                    case '4x2': return { width: '256px', height: '64px' };
                    case '4x3': return { width: '256px', height: '96px' };
                    default: return { width: '32px', height: '32px' };
                  }
                };
                const widgetStyle = (app.type === 'widget' || app.type === 'folder') ? getWidgetStyle(app.size || '2x2') : { width: '32px', height: '32px' };
                
                return (
                  <div 
                    style={widgetStyle}
                    className={`rounded-[16px] ${app.color} flex items-center justify-center overflow-hidden transition-all duration-300 ${isEditing ? 'ring-2 ring-white/40 shadow-lg' : ''} relative`}
                  >
                    {app.imageUrl && (
                      <img src={app.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none" referrerPolicy="no-referrer" />
                    )}
                    
                    {app.type === 'folder' ? (
                      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 p-2 w-full h-full">
                        {app.apps?.slice(0, 4).map((innerApp) => (
                          <div key={innerApp.id} className={`rounded-[6px] ${innerApp.color} flex items-center justify-center overflow-hidden`}>
                             {customIcons?.[innerApp.id] || typeof innerApp.icon === 'string' ? (
                               <img src={customIcons?.[innerApp.id] || innerApp.icon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             ) : (
                               <innerApp.icon size={12} className={innerApp.iconColor} />
                             )}
                          </div>
                        ))}
                      </div>
                    ) : app.type === 'widget' ? (
                      <div className={`w-full h-full p-0 flex flex-col justify-between text-white/90 ${app.imageUrl ? 'bg-black/10 backdrop-blur-[1px]' : ''} ${app.name === 'iOS时间' ? 'backdrop-blur-md bg-white/10' : ''} relative z-10`}>
                        {app.size === '1x1' && !app.imageUrl && (
                          <div className="flex items-center justify-center w-full h-full">
                            <app.icon size={24} className="text-white/80" />
                          </div>
                        )}
                        {app.size === '2x2' && !app.imageUrl && (
                          <div className="flex flex-col items-center justify-center gap-1 w-full h-full">
                            <app.icon size={28} className="text-white/80" />
                          </div>
                        )}
                        {(app.size === '4x1' || app.size === '4x2' || app.size === '4x3') && !app.imageUrl && (
                          <div className="flex flex-col items-center justify-center w-full h-full gap-0">
                            <app.icon size={24} className="text-white/60" />
                            <span className="text-[10px] font-bold opacity-40 uppercase tracking-tight leading-none">{app.name}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      customIcons?.[app.id] || typeof app.icon === 'string' ? (
                        <img src={customIcons?.[app.id] || app.icon} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <app.icon className={app.iconColor || "text-white"} size={24} strokeWidth={1.5} />
                      )
                    )}
                  </div>
                );
              })()}
              {app.type !== 'widget' && (
                <div className="w-full flex justify-center px-1 overflow-hidden">
                  {editingFolderNameId === app.id ? (
                    <input
                      autoFocus
                      className="text-[10px] text-white bg-black/40 rounded px-1 outline-none w-full text-center"
                      value={app.name}
                      onClick={(e) => e.stopPropagation()}
                      onBlur={() => setEditingFolderNameId(null)}
                      onKeyDown={(e) => e.key === 'Enter' && setEditingFolderNameId(null)}
                      onChange={(e) => {
                         const newName = e.target.value;
                         setApps(prev => prev.map(a => a.id === app.id ? { ...a, name: newName } : a));
                      }}
                    />
                  ) : (
                    <span 
                      className="text-[10px] text-white font-medium text-shadow whitespace-nowrap truncate"
                      onClick={(e) => {
                        if (app.type === 'folder' && isEditing) {
                          e.stopPropagation();
                          setEditingFolderNameId(app.id);
                        }
                      }}
                    >
                      {app.name}
                    </span>
                  )}
                </div>
              )}
              
              {isEditing && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 1.2 }}
                  onClick={(e) => removeApp(e, app.id)}
                  className="absolute -top-1.5 -left-1.5 w-6 h-6 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 z-[100] shadow-sm cursor-pointer"
                >
                  <X size={14} strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Pagination Dots */}
      {totalPages > 1 && (
        <div className="absolute bottom-[-70px] left-0 right-0 flex justify-center gap-2 z-20 pointer-events-none">
          {Array.from({ length: totalPages }).map((_, i) => (
            <div 
              key={i}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 shadow-sm ${
                i === currentPage ? 'bg-white scale-125' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}

      {/* Folder Expanded View */}
      <AnimatePresence>
        {openedFolderId && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="absolute inset-0 bg-black/40 backdrop-blur-xl"
               onClick={() => setOpenedFolderId(null)}
            />
            <motion.div 
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.8, opacity: 0 }}
               className="relative w-full max-w-[320px] min-h-[320px] bg-white/10 backdrop-blur-3xl rounded-[40px] p-8 border border-white/20 shadow-2xl flex flex-col"
            >
               {(() => {
                 const folder = apps.find(a => a.id === openedFolderId);
                 if (!folder) return null;
                 return (
                   <>
                     <div className="flex flex-col mb-8 px-4">
                        {editingFolderNameId === folder.id ? (
                          <input
                            autoFocus
                            className="text-2xl font-bold text-white bg-white/10 rounded-xl px-3 py-1 outline-none text-center"
                            value={folder.name}
                            onBlur={() => setEditingFolderNameId(null)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingFolderNameId(null)}
                            onChange={(e) => {
                               const newName = e.target.value;
                               setApps(prev => prev.map(a => a.id === folder.id ? { ...a, name: newName } : a));
                            }}
                          />
                        ) : (
                          <h2 
                            className="text-2xl font-bold text-white text-center cursor-pointer hover:opacity-80"
                            onClick={() => setEditingFolderNameId(folder.id)}
                          >{folder.name}</h2>
                        )}
                        <span className="text-[10px] text-white/40 uppercase tracking-widest text-center mt-2">App Container</span>
                     </div>
                     
                     <div className="grid grid-cols-4 gap-x-4 gap-y-6 flex-1">
                        {folder.apps?.map((innerApp) => (
                           <motion.div 
                             key={innerApp.id}
                             whileTap={{ scale: 0.9 }}
                             className="flex flex-col items-center gap-1 group"
                             onClick={() => {
                               setOpenedFolderId(null);
                               onOpenApp(innerApp.id);
                             }}
                           >
                              <div className={`w-8 h-8 rounded-lg ${innerApp.color} flex items-center justify-center relative shadow-lg group-hover:ring-2 ring-white/40 transition-all`}>
                                 {customIcons?.[innerApp.id] || typeof innerApp.icon === 'string' ? (
                                   <img src={customIcons?.[innerApp.id] || innerApp.icon} alt="" className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                                 ) : (
                                   <innerApp.icon className={innerApp.iconColor} size={24} />
                                 )}

                                 {isEditing && (
                                    <button 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeFromFolder(folder.id, innerApp.id);
                                      }}
                                      className="absolute -top-1 -left-1 w-5 h-5 bg-black/80 rounded-full flex items-center justify-center border border-white/20 text-white"
                                    >
                                      <Plus size={12} className="rotate-45" />
                                    </button>
                                 )}
                              </div>
                              <span className="text-[10px] text-white/80 font-medium truncate w-14 text-center">{innerApp.name}</span>
                           </motion.div>
                        ))}
                     </div>
                   </>
                 );
               })()}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>

      {/* Decoupled Dragging Overlay */}
      <AnimatePresence>
        {draggedId && (
          <motion.div
            initial={{ scale: 1, opacity: 0 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            exit={{ scale: 1, opacity: 0 }}
            style={{
              position: 'fixed',
              top: dragPosition.y,
              left: dragPosition.x,
              transform: 'translate(-50%, -50%)',
              pointerEvents: 'none',
              zIndex: 9999,
            }}
            className="flex flex-col items-center gap-1"
          >
            {(() => {
              const app = apps.find(a => a.id === draggedId);
              if (!app) return null;
              
              const isWidget = app.type === 'widget';
              const size = app.size || '2x2';
              
              // Correct physical dimensions considering USER specified values
              const getGhostSize = (s: string) => {
                switch(s) {
                  case '1x1': return { width: 32, height: 32 };
                  case '2x2': return { width: 64, height: 64 };
                  case '4x1': return { width: 256, height: 32 };
                  case '4x2': return { width: 256, height: 64 };
                  case '4x3': return { width: 256, height: 96 };
                  default: return { width: 32, height: 32 };
                }
              };

              const { width, height } = (isWidget || app.type === 'folder') ? getGhostSize(size) : { width: 32, height: 32 };
              const ghostStyle = (isWidget || app.type === 'folder') ? { width: `${width}px`, height: `${height}px` } : { width: '32px', height: '32px' };

              return (
                <motion.div 
                  style={ghostStyle}
                  className={`rounded-[20px] ${app.color} flex items-center justify-center overflow-hidden shadow-2xl ring-2 ring-white/50 bg-white/20 backdrop-blur-md relative`}
                >
                  {app.imageUrl && (
                    <img src={app.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover z-0" referrerPolicy="no-referrer" />
                  )}
                  {app.type === 'folder' ? (
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 p-2 w-full h-full">
                      {app.apps?.slice(0, 4).map((innerApp) => (
                        <div key={innerApp.id} className={`rounded-[6px] ${innerApp.color} flex items-center justify-center overflow-hidden`}>
                           {customIcons?.[innerApp.id] || typeof innerApp.icon === 'string' ? (
                             <img src={customIcons?.[innerApp.id] || innerApp.icon} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                           ) : (
                             <innerApp.icon size={12} className={innerApp.iconColor} />
                           )}
                        </div>
                      ))}
                    </div>
                  ) : isWidget ? (
                    <div className={`flex flex-col items-center gap-2 relative z-10 ${app.imageUrl ? 'bg-black/20 w-full h-full justify-center' : 'opacity-60'}`}>
                      <app.icon size={app.size === '1x1' ? 24 : 32} />
                      <span className="text-xs font-bold">{app.name}</span>
                    </div>
                  ) : (
                    customIcons?.[app.id] || typeof app.icon === 'string' ? (
                      <img src={customIcons?.[app.id] || app.icon} alt={app.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <app.icon className={app.iconColor || "text-white"} size={24} strokeWidth={1.5} />
                    )
                  )}
                </motion.div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dock */}
      <div className="absolute bottom-[100px] left-4 right-4 h-[84px] bg-white/20 backdrop-blur-2xl rounded-[26px] flex items-center justify-around px-4 border border-white/10 z-20">
        {["wechat", "weibo", "phone", "sms"].map(id => {
          const app = DEFAULT_APPS.find(a => a.id === id);
          if (!app) return null;
          return (
            <motion.div 
              key={`dock-${app.id}`}
              whileTap={{ scale: 0.95 }}
              animate={isEditing ? {
                rotate: [0.8, -0.8, 0.8],
                transition: { rotate: { repeat: Infinity, duration: 0.35 } }
              } : { rotate: 0 }}
              onClick={() => {
                if (isEditing) return;
                onOpenApp(app.id);
              }}
              className={`w-8 h-8 rounded-lg ${app.color} flex items-center justify-center cursor-pointer overflow-visible relative transition-transform shadow-md`}
            >
              {customIcons?.[app.id] || typeof app.icon === 'string' ? (
                <img src={customIcons?.[app.id] || app.icon} alt={app.name} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
              ) : (
                <app.icon className={app.iconColor || "text-white"} size={24} strokeWidth={1.5} />
              )}
              
              {isEditing && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  whileTap={{ scale: 1.2 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    // For dock icons, we just stop editing or warn they are persistent
                  }}
                  className="absolute -top-1.5 -left-1.5 w-5 h-5 bg-black/70 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 z-[100] shadow-sm cursor-default"
                >
                  <X size={12} strokeWidth={2.5} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-md"
              onClick={() => setConfirmDeleteId(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-[280px] bg-white/20 backdrop-blur-3xl rounded-[28px] p-6 border border-white/20 shadow-2xl overflow-hidden text-center"
            >
              <div className="mb-6">
                <h3 className="text-white text-lg font-semibold mb-2">是否删除该应用/组件？</h3>
                <p className="text-white/60 text-xs">删除后将从当前桌面移除。</p>
              </div>
              
              <div className="flex flex-col gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleConfirmDelete}
                  className="w-full py-3.5 bg-red-500/80 hover:bg-red-500 text-white font-bold rounded-2xl transition-colors shadow-lg shadow-red-500/20"
                >
                  确认删除
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setConfirmDeleteId(null)}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/20 text-white/80 font-medium rounded-2xl transition-colors"
                >
                  取消
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

