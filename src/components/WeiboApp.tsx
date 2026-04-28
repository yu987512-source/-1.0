import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, RefreshCw, TrendingUp, Search, Heart, Share2, Send, X, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface HotSearchItem {
  word: string;
  category?: string;
  label_name?: string;
  num?: number;
  rank?: number;
}

interface WeiboAppProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  apiConfig: any;
  onForwardToAi: (content: string, targetPersonaId?: string) => void;
}

export default function WeiboApp({ onClose, theme, apiConfig, onForwardToAi }: WeiboAppProps) {
  const [hotList, setHotList] = useState<HotSearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<HotSearchItem | null>(null);
  const [topicDetail, setTopicDetail] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showSharePicker, setShowSharePicker] = useState(false);

  const allPersonas = apiConfig?.characterGroups?.flatMap((g: any) => g.personas) || [];

  const fetchHotSearch = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/weibo-hot');
      if (!response.ok) throw new Error('Failed to fetch hot search');
      const result = await response.json();
      
      if (result.data && result.data.realtime) {
        setHotList(result.data.realtime);
      } else {
        throw new Error('Invalid data format');
      }
    } catch (err) {
      console.error(err);
      setError('无法获取热搜数据，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopicDetail = async (topic: string) => {
    setLoadingDetail(true);
    setTopicDetail(null);
    try {
      const response = await fetch(`/api/weibo-detail?topic=${encodeURIComponent(topic)}`);
      if (!response.ok) throw new Error('Failed to fetch detail');
      const result = await response.json();
      
      // Handle mobile API structure (data.cards -> card_group -> mblog)
      let statuses: any[] = [];
      if (result.data && result.data.cards) {
        result.data.cards.forEach((card: any) => {
          if (card.mblog) {
            statuses.push(card.mblog);
          } else if (card.card_group) {
            card.card_group.forEach((group: any) => {
              if (group.mblog) statuses.push(group.mblog);
            });
          }
        });
      }
      
      if (statuses.length > 0) {
        setTopicDetail(statuses.slice(0, 10));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchHotSearch();
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetchTopicDetail(selectedTopic.word);
    }
  }, [selectedTopic]);

  const handleShareToAi = (content: string, personaId?: string) => {
    onForwardToAi(content, personaId);
    setSelectedTopic(null);
    setShowSharePicker(false);
  };

  return (
    <div className={cn(
      "flex flex-col h-full overflow-hidden",
      theme === 'light' ? 'bg-[#F2F2F2] text-[#333]' : 'bg-[#121212] text-white'
    )}>
      {/* Header */}
      <div className={cn(
        "h-22 flex items-end px-4 pb-2 gap-3 shrink-0 relative",
        theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E] border-b border-white/5'
      )}>
        <button onClick={onClose} className="p-1 text-[#E6162D] active:opacity-50">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 flex flex-col items-center pb-1">
          <span className="text-sm font-bold flex items-center gap-1">
            微博热搜
            <TrendingUp size={14} className="text-[#E6162D]" />
          </span>
          <span className="text-[10px] opacity-50">实时更新 24/7</span>
        </div>
        <button onClick={fetchHotSearch} disabled={loading} className="p-2 text-[#E6162D] active:rotate-180 transition-transform">
          <RefreshCw size={20} className={cn(loading && "animate-spin")} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading && hotList.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 opacity-50">
            <div className="w-10 h-10 border-4 border-[#E6162D] border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-xs">加载实时热点...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-64 px-10 text-center opacity-50">
            <p className="text-sm mb-4">{error}</p>
            <button 
              onClick={fetchHotSearch}
              className="px-4 py-2 bg-[#E6162D] text-white rounded-full text-xs font-bold"
            >
              重新加载
            </button>
          </div>
        ) : (
          <div className={cn(
            "flex flex-col",
            theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'
          )}>
            {hotList.map((item, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedTopic(item)}
                className={cn(
                  "flex items-center gap-3 px-4 py-4 border-b active:bg-black/5 transition-colors cursor-pointer",
                  theme === 'light' ? 'border-gray-50' : 'border-white/5'
                )}
              >
                <div className={cn(
                  "w-6 flex justify-center text-sm font-bold italic",
                  index < 3 ? "text-[#FF9E0F]" : "text-gray-400"
                )}>
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{item.word}</span>
                    {item.label_name && (
                      <span className={cn(
                        "text-[9px] px-1 rounded-sm text-white font-bold",
                        item.label_name === '新' ? 'bg-[#FF9E0F]' :
                        item.label_name === '热' ? 'bg-[#FF4500]' :
                        item.label_name === '爆' ? 'bg-[#E6162D]' :
                        'bg-blue-400'
                      )}>
                        {item.label_name}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] opacity-40 mt-0.5">
                    {item.num ? `${(item.num / 10000).toFixed(1)}万` : ''} 
                    {item.category && ` · ${item.category}`}
                  </div>
                </div>
                <div className="p-1 opacity-20">
                  <Search size={14} />
                </div>
              </motion.div>
            ))}
            <div className="py-10 text-center text-[10px] opacity-30">
              数据源自微博官方实时热搜
            </div>
          </div>
        )}
      </div>

      {/* Detail View */}
      <AnimatePresence>
        {selectedTopic && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={cn(
              "absolute inset-0 z-[110] flex flex-col",
              theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'
            )}
          >
            {/* Detail Header */}
            <div className="h-22 flex items-end px-4 pb-2 gap-3 shrink-0 border-b border-black/5 dark:border-white/5">
              <button onClick={() => setSelectedTopic(null)} className="p-1 text-[#E6162D]">
                <ChevronLeft size={28} />
              </button>
              <div className="flex-1 text-center font-bold truncate px-6 pb-1">
                话题详情
              </div>
              <button onClick={() => setShowSharePicker(true)} className="p-1 text-[#E6162D]">
                <Share2 size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-[#E6162D] font-bold text-lg">#</span>
                  <h2 className="text-xl font-bold">{selectedTopic.word}</h2>
                </div>

                <div className="space-y-6">
                  {loadingDetail ? (
                    <div className="flex items-center justify-center py-10 opacity-50">
                      <RefreshCw size={20} className="animate-spin" />
                    </div>
                  ) : topicDetail && topicDetail.length > 0 ? (
                    topicDetail.map((status: any, idx: number) => (
                      <div key={idx} className="bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-4 shadow-sm border border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-3">
                          <img 
                            src={status.user.profile_image_url} 
                            className="w-8 h-8 rounded-full" 
                            alt="avatar" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold truncate">{status.user.screen_name}</div>
                            <div className="text-[10px] opacity-40">{status.created_at}</div>
                          </div>
                        </div>
                        <div className="text-sm leading-relaxed mb-3 whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: status.text }}></div>
                        {status.pics && status.pics.length > 0 && (
                          <div className={cn(
                            "grid gap-1 mb-3",
                            status.pics.length === 1 ? "grid-cols-1" : 
                            status.pics.length === 2 ? "grid-cols-2" : 
                            "grid-cols-3"
                          )}>
                            {status.pics.map((pic: any, pIdx: number) => (
                              <img 
                                key={pIdx}
                                src={pic.large?.url || pic.url} 
                                className="w-full aspect-square object-cover rounded-lg" 
                                alt="Weibo pic" 
                                referrerPolicy="no-referrer"
                              />
                            ))}
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-black/5 dark:border-white/5">
                          <div className="flex gap-4 opacity-40">
                            <span className="text-[10px] flex items-center gap-1"><Share2 size={12} /> {status.reposts_count}</span>
                            <span className="text-[10px] flex items-center gap-1"><MessageSquare size={12} /> {status.comments_count}</span>
                            <span className="text-[10px] flex items-center gap-1"><Heart size={12} /> {status.attitudes_count}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl text-sm leading-relaxed">
                      <p className="opacity-80">
                        实时热点摘要：该话题目前在微博引起广泛关注。用户正在积极讨论关于“{selectedTopic.word}”的最新动态。
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Share Picker Modal */}
            <AnimatePresence>
              {showSharePicker && (
                <div className="absolute inset-0 z-[120] flex items-end justify-center p-4">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSharePicker(false)}
                    className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                  />
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    className="w-full bg-white dark:bg-[#1C1C1E] rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-base font-bold">选择转发至 AI 队友</h3>
                      <button onClick={() => setShowSharePicker(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-y-6 gap-x-2 mb-8 max-h-[40vh] overflow-y-auto pt-2">
                       {allPersonas.map((persona: any) => (
                        <button 
                          key={persona.id}
                          onClick={() => {
                            const firstMsg = topicDetail?.[0];
                            const statusText = firstMsg?.text_raw || firstMsg?.text || "暂无最新内容";
                            // Strip HTML tags if present in text
                            const cleanText = statusText.replace(/<[^>]*>?/gm, '');
                            handleShareToAi(`【微博转发】话题：#${selectedTopic.word}#\n最新动态：${cleanText.slice(0, 300)}...`, persona.id);
                          }}
                          className="flex flex-col items-center gap-2 group"
                        >
                          <div className="relative">
                            <img 
                              src={persona.avatar} 
                              className="w-14 h-14 rounded-2xl object-cover shadow-md active:scale-95 transition-transform" 
                              alt={persona.name}
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#07C160] border-2 border-white dark:border-[#1C1C1E] rounded-full" />
                          </div>
                          <span className="text-[10px] font-medium truncate w-full px-1 text-center">{persona.name}</span>
                        </button>
                       ))}

                       {allPersonas.length === 0 && (
                         <div className="col-span-4 py-10 text-center opacity-40 text-xs text-balance">
                           未找到 AI 角色，请先在设置中配置你的 AI 团队。
                         </div>
                       )}
                    </div>
                    <p className="text-[10px] text-center opacity-30">发送后将自动切换至该角色的对话窗口</p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
