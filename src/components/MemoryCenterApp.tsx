import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  ChevronLeft, 
  Trash2, 
  Clock, 
  Calendar, 
  History, 
  ArrowUpCircle, 
  ArrowRightCircle, 
  ArrowDownCircle,
  Brain,
  Info,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Memory {
  id: string;
  personaId: string;
  content: string;
  type: 'short' | 'mid' | 'long';
  importance: 'low' | 'medium' | 'high';
  timestamp: number;
  image?: string;
}

interface Persona {
  id: string;
  name: string;
  avatar: string;
}

const PERSONAS: Persona[] = [
  { id: "char-1", name: "小云 💕", avatar: "https://picsum.photos/seed/xiaoyun/200/200" },
  { id: "char-2", name: "严厉导师", avatar: "https://picsum.photos/seed/mentor/200/200" },
];

interface MemoryCenterAppProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function MemoryCenterApp({ onClose, theme }: MemoryCenterAppProps) {
  const [memories, setMemories] = useState<Memory[]>(() => {
    const saved = localStorage.getItem('memory_center_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'short' | 'mid' | 'long'>('all');

  useEffect(() => {
    localStorage.setItem('memory_center_data', JSON.stringify(memories));
  }, [memories]);

  const selectedPersona = PERSONAS.find(p => p.id === selectedPersonaId);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoClassify = (content: string): 'short' | 'mid' | 'long' => {
    const text = content.toLowerCase();
    const longTerms = ['永远', '一生', '童年', '生日', '历史', '根本', '核心', '原则', '总是', 'forever', 'always', 'life', 'history', '重要', '父母', '家', '爱情'];
    const midTerms = ['计划', '项目', '月', '周', '目标', '习惯', '技能', '学习', '工作', 'plan', 'project', 'month', 'week', 'target', 'learn', 'work'];
    
    if (longTerms.some(term => text.includes(term))) return 'long';
    if (midTerms.some(term => text.includes(term))) return 'mid';
    
    if (content.length > 100) return 'mid';
    return 'short';
  };

  const handleAddMemory = () => {
    if ((!newContent.trim() && !image) || !selectedPersonaId) return;

    const type = autoClassify(newContent);
    const newMemory: Memory = {
      id: Date.now().toString(),
      personaId: selectedPersonaId,
      content: newContent,
      type,
      importance: 'medium',
      timestamp: Date.now(),
      image: image || undefined
    };

    setMemories(prev => [newMemory, ...prev]);
    setNewContent("");
    setImage(null);
    setShowAddModal(false);
  };

  const deleteMemory = (id: string) => {
    setMemories(prev => prev.filter(m => m.id !== id));
  };

  const updateImportance = (id: string, importance: 'low' | 'medium' | 'high') => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, importance } : m));
  };

  const updateType = (id: string, type: 'short' | 'mid' | 'long') => {
    setMemories(prev => prev.map(m => m.id === id ? { ...m, type } : m));
  };

  const filteredMemories = memories.filter(m => 
    m.personaId === selectedPersonaId && 
    (activeTab === 'all' || m.type === activeTab)
  );

  const getImportanceColor = (imp: string) => {
    switch (imp) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-amber-500 bg-amber-50';
      case 'low': return 'text-blue-500 bg-blue-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'long': return <History size={16} />;
      case 'mid': return <Calendar size={16} />;
      case 'short': return <Clock size={16} />;
      default: return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'long': return '长期记忆';
      case 'mid': return '中期记忆';
      case 'short': return '短期记忆';
      default: return '';
    }
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      theme === 'light' ? 'bg-[#F0F4F8]' : 'bg-[#1A1A1A] text-white'
    )}>
      {/* Header */}
      <div className="h-22 flex items-end px-4 pb-2 gap-3 shrink-0 relative">
        <button 
          onClick={selectedPersonaId ? () => setSelectedPersonaId(null) : onClose} 
          className="p-1 text-[#4A90E2] active:opacity-50"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 flex flex-col items-center pb-1">
          <span className="text-sm font-semibold">{selectedPersona ? selectedPersona.name : "记忆中枢"}</span>
          <span className="text-[10px] opacity-50">{selectedPersona ? "记忆管理" : "AI 辅助记忆管理"}</span>
        </div>
        <div className="w-10">
          {selectedPersona && (
            <img 
              src={selectedPersona.avatar} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-white shadow-sm"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      </div>

      {!selectedPersonaId ? (
        /* Dashboard View */
        <div className="flex-1 p-6 flex flex-col gap-6">
          <div className="flex flex-col items-center gap-2 mb-4">
            <div className="w-20 h-20 bg-[#4A90E2] rounded-3xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Brain size={44} />
            </div>
            <h2 className="text-xl font-bold">选择 AI 人格</h2>
            <p className="text-xs opacity-50 text-center">点击头像以开始导入或管理专属记忆</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {PERSONAS.map((persona) => {
              const count = memories.filter(m => m.personaId === persona.id).length;
              return (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  key={persona.id}
                  onClick={() => setSelectedPersonaId(persona.id)}
                  className={cn(
                    "p-5 rounded-[32px] flex flex-col items-center gap-3 transition-all border border-black/5",
                    theme === 'light' ? 'bg-white shadow-sm' : 'bg-[#2C2C2E]'
                  )}
                >
                  <div className="relative">
                    <img 
                      src={persona.avatar} 
                      alt={persona.name} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-white shadow-md"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-green-500 w-5 h-5 rounded-full border-2 border-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="font-bold text-sm">{persona.name}</h3>
                    <p className="text-[10px] opacity-40">{count} 条记忆</p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className={cn(
            "mt-auto p-4 rounded-2xl flex items-center gap-3 opacity-60",
            theme === 'light' ? 'bg-white/50' : 'bg-[#2C2C2E]/50'
          )}>
            <Info size={16} className="text-[#4A90E2]" />
            <p className="text-[10px] leading-relaxed">
              不同的 AI 将根据其实际性格特征，通过你导入的记忆来进化交互逻辑。
            </p>
          </div>
        </div>
      ) : (
        /* Memory List View for Selected Persona */
        <>
          {/* Tabs */}
          <div className="flex px-4 gap-2 mb-4 shrink-0">
            {['all', 'short', 'mid', 'long'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={cn(
                  "flex-1 py-1.5 px-2 rounded-lg text-xs font-medium transition-all",
                  activeTab === tab 
                    ? "bg-[#4A90E2] text-white shadow-md"
                    : "bg-white/50 text-gray-500"
                )}
              >
                {tab === 'all' ? '全部' : getTypeLabel(tab)}
              </button>
            ))}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto px-4 pb-24 flex flex-col gap-3">
            {filteredMemories.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-30 mt-20">
                <Brain size={64} className="mb-4" />
                <p className="text-sm">暂无专属记忆</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 text-xs text-[#4A90E2] font-medium"
                >
                  点击下方按钮添加
                </button>
              </div>
            ) : (
              filteredMemories.map((memory) => (
                <motion.div
                  layout
                  key={memory.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "p-4 rounded-2xl shadow-sm border border-black/5 flex flex-col gap-3",
                    theme === 'light' ? 'bg-white' : 'bg-[#2C2C2E]'
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        memory.type === 'long' ? 'bg-purple-100 text-purple-600' :
                        memory.type === 'mid' ? 'bg-green-100 text-green-600' :
                        'bg-blue-100 text-blue-600'
                      )}>
                        {getTypeIcon(memory.type)}
                      </div>
                      <span className="text-xs font-medium opacity-70">
                        {getTypeLabel(memory.type)}
                      </span>
                      <span className="text-[10px] opacity-40">
                        {new Date(memory.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteMemory(memory.id)}
                      className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {memory.image && (
                    <div className="w-full h-32 rounded-xl overflow-hidden mb-1">
                      <img src={memory.image} alt="Memory" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}

                  <p className="text-sm leading-relaxed">{memory.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-black/5">
                    <div className="flex gap-2">
                      <select 
                        value={memory.importance}
                        onChange={(e) => updateImportance(memory.id, e.target.value as any)}
                        className={cn(
                          "text-[10px] px-2 py-0.5 rounded-full border-none focus:ring-0",
                          getImportanceColor(memory.importance)
                        )}
                      >
                        <option value="low">低重要性</option>
                        <option value="medium">中重要性</option>
                        <option value="high">高重要性</option>
                      </select>

                      <select 
                        value={memory.type}
                        onChange={(e) => updateType(memory.id, e.target.value as any)}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                      >
                        <option value="short">短期</option>
                        <option value="mid">中期</option>
                        <option value="long">长期</option>
                      </select>
                    </div>
                    
                    {memory.importance === 'high' && (
                      <ArrowUpCircle size={14} className="text-red-500 animate-pulse" />
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* FAB */}
          <button
            onClick={() => setShowAddModal(true)}
            className="absolute bottom-10 right-6 w-14 h-14 bg-[#4A90E2] text-white rounded-full flex items-center justify-center shadow-xl z-20 active:scale-95 transition-transform"
          >
            <Plus size={32} />
          </button>
        </>
      )}

      {/* Add Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="absolute inset-0 z-[1001] flex items-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={cn(
                "w-full rounded-t-[32px] p-6 pb-12 relative z-10 shadow-2xl",
                theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'
              )}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  {selectedPersona && (
                    <img src={selectedPersona.avatar} className="w-10 h-10 rounded-full" alt="" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold">导入记忆</h3>
                    <p className="text-[10px] opacity-50">存储为 {selectedPersona?.name} 的专属记忆</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAddModal(false)}
                  className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="flex flex-col gap-4 mb-6">
                <div className="relative">
                  <textarea
                    autoFocus
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="导入或输入你想让 AI 记住的事情..."
                    className={cn(
                      "w-full h-32 p-4 rounded-2xl resize-none text-sm outline-none",
                      theme === 'light' ? 'bg-gray-50 focus:bg-gray-100' : 'bg-gray-800 focus:bg-gray-700'
                    )}
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-30">
                    <Info size={12} />
                    <span className="text-[10px]">AI 将自动根据内容分析持久性</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <label className={cn(
                    "flex-1 h-20 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all",
                    image ? "border-[#4A90E2] bg-[#4A90E2]/5" : "border-gray-200 hover:border-gray-300"
                  )}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    {image ? (
                      <div className="flex items-center gap-2">
                        <img src={image} className="w-10 h-10 rounded-lg object-cover" alt="Preview" />
                        <span className="text-xs text-[#4A90E2] font-medium">已选择图片</span>
                      </div>
                    ) : (
                      <>
                        <ImageIcon size={20} className="text-gray-400" />
                        <span className="text-[10px] text-gray-400">导入相关图片</span>
                      </>
                    )}
                  </label>
                  {image && (
                    <button 
                      onClick={() => setImage(null)}
                      className="p-3 bg-red-50 text-red-500 rounded-2xl active:scale-95"
                    >
                      <Trash2 size={20} />
                    </button>
                  )}
                </div>
              </div>

              <button
                disabled={!newContent.trim() && !image}
                onClick={handleAddMemory}
                className="w-full py-4 bg-[#4A90E2] text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              >
                存入大脑
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
