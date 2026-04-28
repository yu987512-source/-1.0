import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  MessageSquare, 
  Users, 
  Compass, 
  User as UserIcon,
  ChevronRight,
  Wallet,
  Smile,
  Mic,
  Volume2,
  Video,
  MapPin,
  Heart,
  FileText,
  UserPlus,
  House,
  Camera,
  RotateCcw,
  Phone,
  PhoneOff,
  MicOff,
  VideoOff,
  Trash2,
  Settings,
  Reply,
  Undo2,
  Image as ImageIcon,
  X,
  MoreHorizontal,
  Zap,
  CheckCircle2,
  Copy,
  WifiOff,
  Edit3,
  Check
} from 'lucide-react';
import { ApiConfig, UserProfile, Message, GroupChat } from '../types';
import { getAiResponse } from '../services/aiService';
import { cn } from '../lib/utils';
import { addMemory } from '../lib/memoryUtils';

const compressImage = (base64: string, maxWidth = 1024, maxHeight = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
  });
};

interface WeChatAppProps {
  onClose: () => void;
  apiConfig: ApiConfig;
  userProfile: UserProfile;
  onUpdateProfile: (profile: Partial<UserProfile>) => void;
  onNewAssistantMessage: (message: Message) => void;
  ttsEnabled: boolean;
  onUpdateTtsEnabled: (val: boolean) => void;
  intenseReminder: boolean;
  onUpdateIntenseReminder: (val: boolean) => void;
  reminderFrequency: 'always' | 'once';
  onUpdateReminderFrequency: (val: 'always' | 'once') => void;
  intenseReminderRingtone: string;
  onUpdateIntenseReminderRingtone: (val: string) => void;
  chatBackground: string | null;
  onUpdateChatBackground: (url: string | null) => void;
  persistentContext: string;
  onUpdatePersistentContext: (val: string) => void;
  onStartVideoCall: (data: any) => void;
  onStartAudioCall: (data: any) => void;
  lastCallResult: { mode: 'audio' | 'video'; duration: number; timestamp: number } | null;
  onClearCallResult: () => void;
  onUpdateApiConfig: (config: Partial<ApiConfig>) => void;
  forwardContent: string | null;
  onClearForward: () => void;
}

export default function WeChatApp({
  onClose,
  apiConfig,
  userProfile,
  onUpdateProfile,
  onNewAssistantMessage,
  ttsEnabled,
  onUpdateTtsEnabled,
  intenseReminder,
  onUpdateIntenseReminder,
  reminderFrequency,
  onUpdateReminderFrequency,
  intenseReminderRingtone,
  onUpdateIntenseReminderRingtone,
  chatBackground,
  onUpdateChatBackground,
  persistentContext,
  onUpdatePersistentContext,
  onStartVideoCall,
  onStartAudioCall,
  lastCallResult,
  onClearCallResult,
  onUpdateApiConfig,
  forwardContent,
  onClearForward
}: WeChatAppProps) {
  const [tab, setTab] = useState<'chats' | 'contacts' | 'discover' | 'me'>('chats');
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null);
  const [activePersonaIds, setActivePersonaIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('wechat_active_persona_ids');
    return saved ? JSON.parse(saved) : [apiConfig.selectedCharacterId];
  });
  const [showMoments, setShowMoments] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showService, setShowService] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showAiProfile, setShowAiProfile] = useState(false);
  const [showCallSelect, setShowCallSelect] = useState(false);
  const [showApiHealthModal, setShowApiHealthModal] = useState(false);
  const [apiErrorText, setApiErrorText] = useState("");
  const [isApiBlocked, setIsApiBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSticky, setIsSticky] = useState(false);
  const [isAutoReplyEnabled, setIsAutoReplyEnabled] = useState(() => {
    const saved = localStorage.getItem('wechat_auto_reply_enabled');
    return saved ? JSON.parse(saved) : true; // Default to true
  });
  const [momentsFilter, setMomentsFilter] = useState<{ aiOnly: boolean } | null>(null);

  // Save auto reply state
  useEffect(() => {
    localStorage.setItem('wechat_auto_reply_enabled', JSON.stringify(isAutoReplyEnabled));
  }, [isAutoReplyEnabled]);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  const [showPersonaPicker, setShowPersonaPicker] = useState(false);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [selectedGroupMemberIds, setSelectedGroupMemberIds] = useState<string[]>([]);
  const [showPersonaManager, setShowPersonaManager] = useState(false);
  const [groupEditingId, setGroupEditingId] = useState<string | null>(null);

  const onEditGroupMembers = (groupId: string, currentMemberIds: string[]) => {
    setGroupEditingId(groupId);
    setSelectedGroupMemberIds(currentMemberIds);
    setShowGroupPicker(true);
  };
  const [groupChats, setGroupChats] = useState<GroupChat[]>(() => {
    const saved = localStorage.getItem('wechat_groups');
    return saved ? JSON.parse(saved) : [];
  });

  // Save groups
  useEffect(() => {
    localStorage.setItem('wechat_groups', JSON.stringify(groupChats));
  }, [groupChats]);

  // Save active persona IDs
  useEffect(() => {
    localStorage.setItem('wechat_active_persona_ids', JSON.stringify(activePersonaIds));
  }, [activePersonaIds]);

  const allPersonas = apiConfig.characterGroups.flatMap(g => g.personas);
  const selectedAiPersona = allPersonas.find(p => p.id === (activePersonaId || apiConfig.selectedCharacterId));
  const partnerName = selectedAiPersona?.name || "小芸 💕";

  const postAiMoment = React.useCallback(async (customContent?: string) => {
    if (!selectedAiPersona) return;
    
    try {
      const content = customContent || await getAiResponse([], "请根据你的人设发一条朋友圈动态。内容可以是生活感悟、心情分享、美食或风景等，字数在30字以内。确保内容与你的人设高度契合。不要包含引号。", apiConfig, userProfile);
      
      const savedMoments = localStorage.getItem('wechat_moments');
      const moments = savedMoments ? JSON.parse(savedMoments) : [];
      
      const newMoment = {
        id: Date.now().toString(),
        avatar: selectedAiPersona.avatar || '芸',
        name: selectedAiPersona.name,
        content: content,
        time: '刚刚',
        image: 'https://picsum.photos/seed/' + Date.now() + '/400/300',
        likes: 0,
        isLiked: false,
        comments: [],
        isAi: true,
        personaId: selectedAiPersona.id
      };
      
      localStorage.setItem('wechat_moments', JSON.stringify([newMoment, ...moments]));
      
      // Notify user if not muted
      if (!isMuted) {
        onNewAssistantMessage({
          id: 'moment-notify-' + Date.now(),
          role: 'assistant',
          content: selectedAiPersona.name + '刚刚发了一条朋友圈，快去看看吧~',
          timestamp: Date.now(),
          type: 'system'
        });
      }
    } catch (e) {
      console.error("AI Spontaneous Moment Error:", e);
    }
  }, [selectedAiPersona, apiConfig, isMuted, onNewAssistantMessage]);

  // AI Spontaneous Moments Logic
  useEffect(() => {
    // Initial delay then random intervals
    const timer = setTimeout(() => {
      postAiMoment();
      const interval = setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every 10 minutes
          postAiMoment();
        }
      }, 10 * 60 * 1000);
      return () => clearInterval(interval);
    }, 30000); // Post first one after 30 seconds for demo purposes

    return () => clearTimeout(timer);
  }, [postAiMoment]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const showToast = (msg: string) => {
    // [Protocol: Single Toast Enforcement]
    // 1. Immediately wipe any existing toast state
    setToast(null);
    
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
      toastTimeoutRef.current = null;
    }
    
    // 2. Synchronous DOM cleanup if any residual elements exist (Safety fallback)
    const existingToasts = document.querySelectorAll('.toast-ui-element');
    existingToasts.forEach(el => el.remove());
    
    // 3. Trigger new toast with a slight delay for animation reset
    setTimeout(() => {
      setToast(msg);
      toastTimeoutRef.current = setTimeout(() => {
        setToast(null);
        toastTimeoutRef.current = null;
      }, 2500);
    }, 50);
  };

  const speak = (text: string) => {
    if (!ttsEnabled || typeof window === 'undefined' || !window.speechSynthesis || !window.SpeechSynthesisUtterance) return;
    try {
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      const voices = window.speechSynthesis.getVoices();
      const zhVoice = voices.find(v => v.lang.includes('zh')) || voices[0];
      if (zhVoice) utterance.voice = zhVoice;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS Error:", e);
    }
  };

  const deleteMessage = React.useCallback((id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  }, []);

  const withdrawMessage = React.useCallback((id: string) => {
    setMessages(prev => prev.map(m => 
      m.id === id ? { 
        ...m, 
        content: m.role === 'user' ? "你撤回了一条消息" : "对方撤回了一条消息", 
        isWithdrawn: true 
      } : m
    ));
  }, []);

  const triggerIntenseReminder = React.useCallback(() => {
    if (!intenseReminder) return;

    // Play sound
    const audioUrl = intenseReminderRingtone || "https://assets.mixkit.co/sfx/preview/mixkit-urgent-simple-alarm-loop-2977.mp3"; 
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Ringtone play error:", e));

    if (reminderFrequency === 'once') {
      onUpdateIntenseReminder(false);
    }
  }, [intenseReminder, intenseReminderRingtone, reminderFrequency, onUpdateIntenseReminder]);

  const handleAiResponse = React.useCallback(async (history: Message[], forcePersonaId?: string) => {
    if (isRequestingRef.current) return;
    isRequestingRef.current = true;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    setIsTyping(true);
    try {
      const minRepliesTarget = apiConfig.minAiReplies || 1;
      let totalRepliesSent = 0;
      let currentHistory = [...history];

      while (totalRepliesSent < minRepliesTarget) {
        const isGroup = activeChatId?.startsWith('group-');
        const groupData = isGroup ? groupChats.find(g => g.id === activeChatId) : null;
        
        let respondingPersonaId = forcePersonaId || apiConfig.selectedCharacterId;
        if (isGroup && !forcePersonaId && groupData) {
          respondingPersonaId = groupData.memberIds[Math.floor(Math.random() * groupData.memberIds.length)];
        }

        const activePersona = allPersonas.find(p => p.id === respondingPersonaId);
        const personaName = activePersona?.name || partnerName;

        const lastUserMsg = currentHistory[currentHistory.length - 1]?.role === 'user' ? (currentHistory[currentHistory.length - 1]?.content || "") : "";
        const response = await getAiResponse(
          currentHistory, 
          totalRepliesSent > 0 ? "[系统提示：请继续发送下一条消息，以模拟微信连发的回复风格。保持口吻一致，不要重复上一条已回复的内容，也不要带任何开场白或标签。]" : lastUserMsg, 
          { ...apiConfig, selectedCharacterId: respondingPersonaId }, 
          userProfile, 
          persistentContext, 
          signal
        );
        
        if (abortControllerRef.current?.signal === signal) {
          abortControllerRef.current = null;
        }

        // Split by [消息N] if present
        const messagePattern = /\[消息\d+\]/g;
        let parts: string[] = [];
        if (messagePattern.test(response)) {
          parts = response.split(/\[消息\d+\]/).map(p => p.trim()).filter(p => p.length > 0);
        } else {
          parts = [response.trim()];
        }

        for (const rawPart of parts) {
          if (!rawPart) continue;
          let cleanResponse = rawPart.replace(/\[STOP_GENERATION\]/g, "").trim();
        
        // Post-process deduplication
        const sentences = cleanResponse.split(/[。！？]/);
        const uniqueSentences = Array.from(new Set(sentences.filter(s => s.trim().length > 0)));
        if (uniqueSentences.length < sentences.length - 1) {
           cleanResponse = uniqueSentences.join('。') + (cleanResponse.endsWith('？') ? '？' : '。');
        }

        const momentMatch = cleanResponse.match(/\[MOMENT:\s*(.*?)\]/);
        if (momentMatch) {
          cleanResponse = cleanResponse.replace(momentMatch[0], '').trim();
          postAiMoment(momentMatch[1]);
        }

        let quoteId = undefined;
        let quoteContent = undefined;
        let quoteSender = undefined;
        
        const renderQuoteMatch = cleanResponse.match(/\[Action:\s*Render_Quote\s*\|\s*Content:\s*["'](.*?)["']\s*\]/);
        if (renderQuoteMatch) {
          quoteContent = renderQuoteMatch[1];
          cleanResponse = cleanResponse.replace(renderQuoteMatch[0], '').trim();
          const matchingMsg = currentHistory.find(m => m.content === quoteContent);
          if (matchingMsg) {
            quoteId = matchingMsg.id;
            quoteSender = matchingMsg.role === 'user' ? (userProfile.personaGroups[0]?.personas[0]?.name || "我") : (apiConfig.characterGroups[0]?.personas[0]?.name || partnerName);
          } else {
            quoteSender = "消息";
          }
        }

        const recallMatch = cleanResponse.match(/\[RECALL:\s*(?:\[ID:\s*)?(\d+)(?:\s*\])?\s*\]/);
        if (recallMatch) {
          withdrawMessage(recallMatch[1]);
          cleanResponse = cleanResponse.replace(recallMatch[0], '').trim();
        }

        const deleteMatch = cleanResponse.match(/\[DELETE:\s*(?:\[ID:\s*)?(\d+)(?:\s*\])?\s*\]/);
        if (deleteMatch) {
          deleteMessage(deleteMatch[1]);
          cleanResponse = cleanResponse.replace(deleteMatch[0], '').trim();
        }

        let msgType: Message['type'] = 'text';
        let msgContent = cleanResponse;
        const stickerMatch = cleanResponse.match(/\[STICKER:\s*(.*?)\]/);
        if (stickerMatch) {
          msgType = 'sticker';
          msgContent = stickerMatch[1];
          cleanResponse = cleanResponse.replace(stickerMatch[0], '').trim();
        }

        const transferMatch = cleanResponse.match(/\[TRANSFER:\s*(\d+(?:\.\d+)?)\s*,\s*(.*?)\]/);
        if (transferMatch) {
          msgType = 'transfer';
          msgContent = JSON.stringify({ amount: parseFloat(transferMatch[1]), note: transferMatch[2] });
          cleanResponse = cleanResponse.replace(transferMatch[0], '').trim();
        }

        const selectedUserPersona = userProfile.personaGroups.flatMap(g => g.personas).find(p => p.id === userProfile.selectedPersonaId);

        // --- API Health Check Logic ---
        const billingError = '[Modal: 当前 API 余额不足，请及时充值或更换密钥]';
        const keyError = '[Modal: API 密钥已失效或权限受限，请在设置中重新配置]';
        const timeoutToast = '[Toast: 节点连接超时，请检查 API 地址是否正确]';
        const visionToast = '[Toast: 图片识别额度已用完，请升级 API 套餐]';
        const generalDownToast = "[Toast: 当前 API 节点不可用，正在尝试重连...]";
        const callSelectorModal = '[Modal: 请选择通话模式 | 选项: 语音通话, 视频通话]';

        if (cleanResponse.includes(billingError) || cleanResponse.includes(keyError)) {
          setApiErrorText(cleanResponse.includes(billingError) ? billingError : keyError);
          setShowApiHealthModal(true);
          setIsApiBlocked(true);
        }

        if (cleanResponse.includes(callSelectorModal)) {
          setShowCallSelect(true);
        }
        
        if (cleanResponse.includes(timeoutToast) || cleanResponse.includes(visionToast) || cleanResponse.includes(generalDownToast)) {
          const msg = cleanResponse.includes(timeoutToast) ? "节点连接超时，请检查 API 地址是否正确" : 
                      cleanResponse.includes(visionToast) ? "图片识别额度已用完，请升级 API 套餐" : 
                      "当前 API 节点不可用，正在尝试重连...";
          showToast(msg);
        }

        // --- Tag Isolation & Visible Content Logic ---
        const hasAction = /\[Action:[^\]]+\]/.test(cleanResponse);
        const hasModal = /\[Modal:[^\]]+\]/.test(cleanResponse);
        const hasToast = /\[Toast:[^\]]+\]/.test(cleanResponse);

        // Store pure text for display
        let displayText = cleanResponse.replace(/\[Action:[^\]]+\]/g, '')
                                       .replace(/\[Toast:[^\]]+\]/g, '')
                                       .replace(/\[Modal:[^\]]+\]/g, '')
                                       .replace(/\[STICKER:[^\]]+\]/g, '')
                                       .replace(/\[TRANSFER:[^\]]+\]/g, '')
                                       .trim();

        // Trigger side-effects from tags
        const audioActionMatch = cleanResponse.includes('[Action: Start_Audio_Call]');
        if (audioActionMatch) {
          onStartAudioCall({ 
            partnerName: partnerName, 
            partnerAvatar: selectedAiPersona?.avatar || "", 
            userAvatar: selectedUserPersona?.avatar || "",
            personaId: apiConfig.selectedCharacterId 
          });
        }

        const videoActionMatch = cleanResponse.includes('[Action: Start_Video_Call]');
        if (videoActionMatch) {
          onStartVideoCall({ 
            partnerName: partnerName, 
            partnerAvatar: selectedAiPersona?.avatar || "", 
            userAvatar: selectedUserPersona?.avatar || "",
            personaId: apiConfig.selectedCharacterId 
          });
        }

        // If ONLY meta-tags were returned, we must provide a fallback visible text to prevent "dead" bubbles
        if (!displayText && (hasAction || hasModal || hasToast || msgType !== 'text')) {
           if (hasAction) displayText = "正在执行指令...";
           else if (hasModal) displayText = "弹出交互窗口";
           else if (hasToast) displayText = "正在提醒...";
           else if (msgType === 'sticker') displayText = "发送了表情";
           else if (msgType === 'transfer') displayText = "发起转账";
        }

        if (displayText || msgType !== 'text') {
          const newMessage: Message = {
            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
            role: 'assistant',
            content: msgContent || displayText,
            type: msgType,
            personaId: respondingPersonaId, // Store which AI replied in group
            timestamp: Date.now(),
            quoteId, quoteContent, quoteSender
          };
          
          setMessages(prev => {
            const last = prev[prev.length - 1];
            // Only skip if EXACT same content AND within a very short time (prevents accidental identical replies if the AI loops)
            if (last && last.role === 'assistant' && last.content === newMessage.content && (Date.now() - last.timestamp < 100)) return prev;
            return [...prev, newMessage];
          });
          currentHistory = [...currentHistory, newMessage];

          // --- Selective Memory Integration ---
          if (msgType === 'text' && displayText.length > 5 && !isGroup) {
            setTimeout(() => {
              const memoryKeywords = ['我记得', '关于我', '记住', '约定', '计划', '生日', '喜欢', '讨厌', '职业', '身份'];
              if (memoryKeywords.some(k => displayText.includes(k) || history[history.length-1]?.content.includes(k))) {
                  addMemory(respondingPersonaId, displayText.slice(0, 100), 'mid', 'medium');
              }
            }, 1000);
          }

          if (msgType === 'text') speak(displayText);
          if (intenseReminder) triggerIntenseReminder();
          if (!isMuted) onNewAssistantMessage(newMessage);

          totalRepliesSent++;
          
          if (parts.length > 1 && totalRepliesSent < minRepliesTarget) {
            await new Promise(r => setTimeout(r, 1200));
          }
        }
      }

        if (totalRepliesSent >= minRepliesTarget) break;
        // Delay between separate API calls if needed to fulfill the count
        await new Promise(r => setTimeout(r, 2000));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: "抱歉，我现在有点累了，稍后再聊好吗？",
        timestamp: Date.now(),
        type: 'system'
      }]);
    } finally {
      setIsTyping(false);
      isRequestingRef.current = false;
    }
  }, [apiConfig, persistentContext, selectedAiPersona, partnerName, postAiMoment, messages, userProfile, withdrawMessage, deleteMessage, showToast, onStartAudioCall, onStartVideoCall, isMuted, onNewAssistantMessage, speak, intenseReminder, triggerIntenseReminder]);

  // Load history based on character ID (Isolation)
  useEffect(() => {
    const targetId = activeChatId || activePersonaId || apiConfig.selectedCharacterId;
    const saved = localStorage.getItem(`wechat_messages_${targetId}`);
    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      // Load target default greeting based on character
      const greeting = targetId.startsWith('group-')
        ? "群聊已开启。我是你的APP测试助手，大家可以开始交流了。"
        : (targetId === 'char-2' 
          ? "论文进度到哪了？立即汇报，不要浪费我的时间。"
          : "你好，我是你的APP测试助手小云。请告知你需要测试的具体功能模块。");
      
      setMessages([
        { id: Date.now().toString(), role: "assistant", content: greeting, timestamp: Date.now() }
      ]);
    }
  }, [activeChatId, activePersonaId, apiConfig.selectedCharacterId]);

  // Save history (namespaced)
  useEffect(() => {
    const targetId = activeChatId || activePersonaId || apiConfig.selectedCharacterId;
    if (messages.length > 0) {
      localStorage.setItem(`wechat_messages_${targetId}`, JSON.stringify(messages));
    }
  }, [messages, activeChatId, activePersonaId, apiConfig.selectedCharacterId]);

  const getChatPreview = () => {
    const validMessages = messages.filter(m => !m.isWithdrawn);
    if (validMessages.length === 0) return "";
    
    const lastMsg = validMessages[validMessages.length - 1];
    
    // Requirement 2: System messages
    if (lastMsg.type === 'system') {
      if (lastMsg.content.includes("清空")) return "聊天记录已清空";
      if (lastMsg.content.includes("视频通话结束")) return "[视频通话]";
      return lastMsg.content;
    }

    // Special type handling for list preview
    if (lastMsg.type === 'voice') return "[语音]";
    if (lastMsg.type === 'sticker') return "[表情]";
    
    let content = lastMsg.content || "";
    
    // JSON type check for special messages (red packet/transfer)
    try {
      if (lastMsg.type === 'red-packet' || lastMsg.type === 'transfer') {
        const parsed = JSON.parse(content);
        return lastMsg.type === 'red-packet' ? "[微信红包]" + parsed.note : "[转账]¥" + parsed.amount.toFixed(2);
      }
    } catch(e) {}

    // Requirement 2: Text message (truncate to 20, no tags)
    // The model is already instructed not to output [QUOTE] tags in the content.
    return content.length > 20 ? content.substring(0, 20) + "..." : content;
  };

  const getChatTime = () => {
    const validMessages = messages.filter(m => !m.isWithdrawn);
    if (validMessages.length === 0) return "14:20";
    const lastMsg = validMessages[validMessages.length - 1];
    const date = new Date(lastMsg.timestamp);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleSendMessage = React.useCallback((content: string) => {
    if (!content.trim()) return;
    if (!activePersonaId && !activeChatId) return;

    const targetChatId = activeChatId || activePersonaId;

    const newMessage: Message = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
      role: 'user',
      content: content,
      timestamp: Date.now()
    };
    
    setMessages(prev => {
      const next = [...prev, newMessage];
      return next;
    });
  }, [activePersonaId, activeChatId, messages]);

  const onUpdateGroup = (groupId: string, updates: Partial<GroupChat>) => {
    setGroupChats(prev => prev.map(g => g.id === groupId ? { ...g, ...updates } : g));
  };

  const onDeleteGroup = (groupId: string) => {
    setGroupChats(prev => prev.filter(g => g.id !== groupId));
    localStorage.removeItem(`wechat_messages_${groupId}`);
    setActiveChatId(null);
    setMessages([]);
  };

  const handleSelectChat = React.useCallback((personaId: string) => {
    if (personaId.startsWith('group-')) {
      setActivePersonaId(null);
      setActiveChatId(personaId);
    } else {
      setActivePersonaId(personaId);
      setActiveChatId(personaId);
      onUpdateApiConfig({ selectedCharacterId: personaId });
    }
    setShowCallSelect(false);
    setShowApiHealthModal(false);
    setTab('chats');
  }, [onUpdateApiConfig]);

  // Handle forwarded content
  useEffect(() => {
    if (forwardContent) {
      if (!activePersonaId) {
        handleSelectChat(apiConfig.selectedCharacterId);
      }
      
      const timer = setTimeout(() => {
        handleSendMessage(forwardContent);
        onClearForward();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [forwardContent, activePersonaId, apiConfig.selectedCharacterId, handleSendMessage, onClearForward, handleSelectChat]);

  const renderMainContent = () => {
    if (showMoments) return (
      <MomentsView 
        onBack={() => { setShowMoments(false); setMomentsFilter(null); }} 
        userProfile={userProfile} 
        onUpdateProfile={onUpdateProfile} 
        apiConfig={apiConfig} 
        filter={momentsFilter}
      />
    );

    if (activeChatId) {
      const isGroup = activeChatId.startsWith('group-');
      const groupData = isGroup ? groupChats.find(g => g.id === activeChatId) : null;
      const displayTitle = isGroup ? (groupData?.name || "群聊") : partnerName;

      return (
        <ChatView 
          key={activeChatId}
          contactName={displayTitle} 
          isGroup={isGroup}
          groupChat={groupData}
          groupMembers={isGroup ? allPersonas.filter(p => groupData?.memberIds.includes(p.id)) : []}
          onBack={() => {
            setActiveChatId(null);
            setShowCallSelect(false);
            setShowApiHealthModal(false);
          }} 
          onUpdateGroup={onUpdateGroup}
          onDeleteGroup={onDeleteGroup}
          onEditGroupMembers={onEditGroupMembers}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          apiConfig={apiConfig}
          userProfile={userProfile}
          onNewAssistantMessage={onNewAssistantMessage}
          onUpdateProfile={onUpdateProfile}
          ttsEnabled={ttsEnabled}
          onUpdateTtsEnabled={onUpdateTtsEnabled}
          intenseReminder={intenseReminder}
          onUpdateIntenseReminder={onUpdateIntenseReminder}
          reminderFrequency={reminderFrequency}
          onUpdateReminderFrequency={onUpdateReminderFrequency}
          intenseReminderRingtone={intenseReminderRingtone}
          onUpdateIntenseReminderRingtone={onUpdateIntenseReminderRingtone}
          chatBackground={chatBackground}
          onUpdateChatBackground={onUpdateChatBackground}
          persistentContext={persistentContext}
          onUpdatePersistentContext={onUpdatePersistentContext}
          onStartVideoCall={onStartVideoCall}
          onStartAudioCall={onStartAudioCall}
          lastCallResult={lastCallResult}
          onClearCallResult={onClearCallResult}
          onUpdateApiConfig={onUpdateApiConfig}
          showCallSelect={showCallSelect}
          setShowCallSelect={setShowCallSelect}
          isMuted={isMuted}
          onToggleMute={() => setIsMuted(!isMuted)}
          isSticky={isSticky}
          onToggleSticky={() => setIsSticky(!isSticky)}
          isAutoReplyEnabled={isAutoReplyEnabled}
          onToggleAutoReply={() => setIsAutoReplyEnabled(!isAutoReplyEnabled)}
          onTriggerMoment={postAiMoment}
          onShowMoments={() => { setMomentsFilter({ aiOnly: true }); setShowMoments(true); }}
          messages={messages}
          setMessages={setMessages}
          isTyping={isTyping}
          setIsTyping={setIsTyping}
          handleAiResponse={handleAiResponse}
          deleteMessage={deleteMessage}
          withdrawMessage={withdrawMessage}
          speak={speak}
          isApiBlocked={isApiBlocked}
          setIsApiBlocked={setIsApiBlocked}
          showApiHealthModal={showApiHealthModal}
          setShowApiHealthModal={setShowApiHealthModal}
          apiErrorText={apiErrorText}
          showToast={showToast}
          isRequestingRef={isRequestingRef}
        />
      );
    }

    if (showProfile) return <ProfileView onBack={() => setShowProfile(false)} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />;
    if (showPersonaManager) return (
      <PersonaManagerView 
        onBack={() => setShowPersonaManager(false)} 
        apiConfig={apiConfig} 
        onUpdateApiConfig={onUpdateApiConfig}
        userProfile={userProfile}
        onUpdateProfile={onUpdateProfile}
      />
    );
    if (showService) return <ServiceView onBack={() => setShowService(false)} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />;
    if (showStickers) return <StickersView onBack={() => setShowStickers(false)} userProfile={userProfile} onUpdateProfile={onUpdateProfile} />;

    return (
      <div className="flex flex-col h-full bg-transparent">
        {/* Header */}
        <div className="h-22 bg-[#EDEDED]/60 backdrop-blur-md flex items-end px-4 pb-2 shrink-0 relative">
          <button onClick={onClose} className="absolute left-4 bottom-2 p-1 text-black active:opacity-50">
            <House size={22} />
          </button>
          <div className="flex-1 text-center pb-1">
            <h1 className="text-[17px] font-semibold">
              {tab === 'chats' ? '微信' : tab === 'contacts' ? '通讯录' : tab === 'discover' ? '发现' : '我'}
            </h1>
          </div>
          <div className="absolute right-4 bottom-2 flex gap-4">
            <Search size={20} className="text-black" />
            <button onClick={() => setShowPlusMenu(!showPlusMenu)} className="p-1 active:opacity-50">
              <Plus size={20} className="text-black" />
            </button>
            
            <AnimatePresence>
              {showPlusMenu && (
                <>
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowPlusMenu(false)}
                    className="fixed inset-0 z-[1000]"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -10, x: 10 }}
                    className="absolute right-0 top-10 w-44 bg-[#4C4C4C] rounded-lg shadow-xl z-[1001] py-1 overflow-hidden"
                  >
                    {[
                      { icon: <UserPlus size={18} />, label: "添加朋友 (AI)", action: () => setShowPersonaPicker(true) },
                      { icon: <MessageSquare size={18} />, label: "发起群聊", action: () => setShowGroupPicker(true) },
                      { icon: <Camera size={18} />, label: "扫一扫", action: () => {} },
                      { icon: <Wallet size={18} />, label: "收付款", action: () => {} },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          item.action();
                          if (item.label !== "添加朋友 (AI)") setShowPlusMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-white text-sm active:bg-white/10 transition-colors border-b border-white/10 last:border-0"
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Persona Picker Modal */}
        <AnimatePresence>
          {showPersonaPicker && (
            <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPersonaPicker(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative z-10 p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">选择 AI 联系人</h3>
                  <button onClick={() => setShowPersonaPicker(false)} className="p-2 bg-gray-100 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {allPersonas.map((persona) => (
                    <button
                      key={persona.id}
                      onClick={() => {
                        onUpdateApiConfig({ selectedCharacterId: persona.id });
                        if (!activePersonaIds.includes(persona.id)) {
                          setActivePersonaIds(prev => [...prev, persona.id]);
                        }
                        setActivePersonaId(persona.id);
                        setShowPersonaPicker(false);
                        setShowPlusMenu(false);
                        setActiveChatId(persona.id);
                        setTab('chats');
                      }}
                      className={cn(
                        "flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border-2",
                        apiConfig.selectedCharacterId === persona.id 
                          ? "border-[#07C160] bg-green-50/50" 
                          : "border-transparent bg-gray-50 hover:bg-gray-100"
                      )}
                    >
                      <img src={persona.avatar} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" referrerPolicy="no-referrer" />
                      <span className="font-bold text-sm">{persona.name}</span>
                      {apiConfig.selectedCharacterId === persona.id && (
                        <span className="text-[10px] text-[#07C160] font-medium bg-green-100 px-2 py-0.5 rounded-full">当前通话</span>
                      )}
                    </button>
                  ))}
                </div>
                
                <p className="mt-6 text-center text-[10px] text-gray-400">选择后将切换至对应的 AI 对话界面</p>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Group Picker Modal */}
        <AnimatePresence>
          {showGroupPicker && (
            <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => { setShowGroupPicker(false); setSelectedGroupMemberIds([]); }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="w-full max-w-sm bg-white rounded-t-[32px] sm:rounded-[32px] overflow-hidden relative z-10 flex flex-col shadow-2xl h-[70vh]"
              >
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
                  <h3 className="text-xl font-bold">发起群聊</h3>
                  <button 
                    onClick={() => {
                        if (selectedGroupMemberIds.length < 1) {
                            showToast("请至少选择一个 AI");
                            return;
                        }

                        if (groupEditingId) {
                          onUpdateGroup(groupEditingId, { memberIds: selectedGroupMemberIds });
                          setGroupEditingId(null);
                        } else {
                          const groupName = selectedGroupMemberIds.map(id => allPersonas.find(p => p.id === id)?.name).slice(0, 3).join('、') + (selectedGroupMemberIds.length > 3 ? '...' : '');
                          const newGroup: GroupChat = {
                              id: 'group-' + Date.now(),
                              name: groupName,
                              memberIds: selectedGroupMemberIds
                          };
                          setGroupChats(prev => [...prev, newGroup]);
                          setActiveChatId(newGroup.id);
                          setActivePersonaId(null); 
                          setTab('chats');
                        }

                        setShowGroupPicker(false);
                        setShowPlusMenu(false);
                        setSelectedGroupMemberIds([]);
                    }} 
                    className={cn(
                        "px-4 py-1.5 rounded-full text-sm font-bold transition-colors",
                        selectedGroupMemberIds.length > 0 ? "bg-[#07C160] text-white" : "bg-gray-100 text-gray-300"
                    )}
                  >
                    完成 ({selectedGroupMemberIds.length})
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  <div className="flex flex-col gap-2">
                    {allPersonas.map((persona) => {
                      const isSelected = selectedGroupMemberIds.includes(persona.id);
                      return (
                        <button
                          key={persona.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedGroupMemberIds(prev => prev.filter(id => id !== persona.id));
                            } else {
                              setSelectedGroupMemberIds(prev => [...prev, persona.id]);
                            }
                          }}
                          className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl transition-all border-2 bg-white",
                            isSelected ? "border-[#07C160] shadow-sm" : "border-transparent"
                          )}
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                            isSelected ? "bg-[#07C160] border-[#07C160]" : "border-gray-200"
                          )}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <img src={persona.avatar} alt="" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
                          <span className="font-bold text-gray-800">{persona.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content */}
    <div className="flex-1 overflow-y-auto">
      {tab === 'chats' && (
        <ChatList 
          onSelectChat={handleSelectChat} 
          activePersonaIds={activePersonaIds}
          allPersonas={allPersonas}
          groupChats={groupChats}
          isSticky={isSticky} 
          currentPersonaId={activeChatId || activePersonaId || apiConfig.selectedCharacterId}
          lastAiMsg={getChatPreview()}
          lastAiTime={getChatTime()}
        />
      )}
          {tab === 'contacts' && <ContactList onSelectPersona={handleSelectChat} allPersonas={allPersonas} />}
          {tab === 'discover' && <DiscoverView onOpenMoments={() => setShowMoments(true)} />}
          {tab === 'me' && (
            <MeView 
              userProfile={userProfile} 
              onEdit={() => setShowProfile(true)} 
              onOpenService={() => setShowService(true)}
              onOpenStickers={() => setShowStickers(true)}
              onOpenPersonaManager={() => setShowPersonaManager(true)}
            />
          )}
        </div>

        {/* Tab Bar */}
        <div className="h-20 bg-[#F7F7F7] border-t border-gray-300 flex justify-around items-start pt-2 pb-8 shrink-0">
          <TabItem active={tab === 'chats'} icon={<MessageSquare size={24} />} label="微信" onClick={() => setTab('chats')} />
          <TabItem active={tab === 'contacts'} icon={<Users size={24} />} label="通讯录" onClick={() => setTab('contacts')} />
          <TabItem active={tab === 'discover'} icon={<Compass size={24} />} label="发现" onClick={() => setTab('discover')} />
          <TabItem active={tab === 'me'} icon={<UserIcon size={24} />} label="我" onClick={() => setTab('me')} />
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {renderMainContent()}

      {/* Global Unified Toast Overlay */}
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div 
            key="global-wechat-toast"
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.8 }}
            className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[9999] bg-black/75 backdrop-blur-md text-white px-6 py-3 rounded-2xl text-sm font-medium shadow-2xl toast-ui-element block pointer-events-none"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

function TabItem({ active, icon, label, onClick }: { active: boolean, icon: any, label: string, onClick: () => void }) {
  return (
    <div onClick={onClick} className="flex flex-col items-center gap-1 cursor-pointer">
      <div className={active ? 'text-black font-bold' : 'text-gray-400'}>
        {icon}
      </div>
      <span className={"text-[10px] " + (active ? "text-black font-bold" : "text-gray-400")}>{label}</span>
    </div>
  );
}

function ChatList({ onSelectChat, activePersonaIds, allPersonas, groupChats, isSticky, currentPersonaId, lastAiMsg, lastAiTime }: { 
  onSelectChat: (id: string) => void, 
  activePersonaIds: string[],
  allPersonas: any[],
  groupChats: GroupChat[],
  isSticky?: boolean, 
  currentPersonaId: string,
  lastAiMsg: string, 
  lastAiTime: string 
}) {
  const activePersonas = allPersonas.filter(p => activePersonaIds.includes(p.id));

  const chats = [
    ...activePersonas.map(chat => ({
      id: chat.id,
      name: chat.name,
      avatar: chat.avatar,
      lastMsg: chat.id === currentPersonaId ? (lastAiMsg || '点击开始聊天') : '点击继续对话',
      time: chat.id === currentPersonaId ? lastAiTime : '',
      color: 'bg-pink-100 text-pink-500',
      isAi: true,
      isGroup: false
    })),
    ...groupChats.map(group => ({
      id: group.id,
      name: group.name || "群聊",
      avatar: "群",
      lastMsg: group.id === currentPersonaId ? (lastAiMsg || '群聊已开启') : '查看群聊内容',
      time: group.id === currentPersonaId ? lastAiTime : '',
      color: 'bg-[#EDEDED] text-gray-500',
      isAi: false,
      isGroup: true
    })),
    { id: 'pay', name: '支付凭证', avatar: '支', lastMsg: '微信支付账单明细', time: '昨天', color: 'bg-blue-100 text-blue-500', isAi: false, isGroup: false },
    { id: 'news', name: '腾讯新闻', avatar: '腾', lastMsg: '今日要闻：科技行业新动态', time: '昨天', color: 'bg-blue-500 text-white', isAi: false, isGroup: false },
    { id: 'file', name: '文件传输助手', avatar: '文', lastMsg: '[文件] 工作报告.pdf', time: '星期二', color: 'bg-green-500 text-white', isAi: false, isGroup: false },
  ];

  const sortedChats = isSticky 
    ? [chats.find(c => c.isAi)!, ...chats.filter(c => !c.isAi)]
    : chats;

  return (
    <div className="flex flex-col bg-white">
      {sortedChats.filter(Boolean).map(chat => (
        <div 
          key={chat.id}
          onClick={() => onSelectChat(chat.id)} 
          className={"flex items-center gap-3 p-3 active:bg-gray-100 border-b border-gray-100 " + (chat.isAi && isSticky ? "bg-[#F7F7F7]" : "")}
        >
          {chat.isGroup ? (
            <div className="w-12 h-12 rounded-lg bg-[#EDEDED] p-1 flex flex-wrap gap-0.5 justify-center items-center overflow-hidden shrink-0">
               {groupChats.find(g => g.id === chat.id)?.avatar ? (
                 <img src={groupChats.find(g => g.id === chat.id)?.avatar} className="w-full h-full object-cover rounded-lg" referrerPolicy="no-referrer" />
               ) : (
                 allPersonas.filter(p => groupChats.find(g => g.id === chat.id)?.memberIds.includes(p.id)).slice(0, 4).map(p => (
                   <img key={p.id} src={p.avatar} className="w-[45%] h-[45%] rounded-sm object-cover" referrerPolicy="no-referrer" />
                 ))
               )}
            </div>
          ) : chat.isAi ? (
            <img src={chat.avatar} className="w-12 h-12 rounded-lg object-cover shrink-0" alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className={"w-12 h-12 rounded-lg flex items-center justify-center font-bold overflow-hidden shrink-0 " + chat.color}>
              {chat.avatar}
            </div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center">
              <span className="font-medium">{chat.name}</span>
              <span className="text-[10px] text-gray-400">{chat.time}</span>
            </div>
            <div className="text-xs text-gray-400 truncate">{chat.lastMsg}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ContactList({ onSelectPersona, allPersonas }: { onSelectPersona: (id: string) => void, allPersonas: any[] }) {
  return (
    <div className="flex flex-col bg-white">
      <div className="px-4 py-1 text-[10px] text-gray-500 bg-[#EDEDED]">AI 星标朋友</div>
      {allPersonas.map(persona => (
        <div 
          key={persona.id} 
          onClick={() => onSelectPersona(persona.id)} 
          className="flex items-center gap-3 p-3 active:bg-gray-100 border-b border-gray-100"
        >
          <img src={persona.avatar} className="w-12 h-12 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
          <span className="font-medium">{persona.name}</span>
        </div>
      ))}
    </div>
  );
}

function DiscoverView({ onOpenMoments }: { onOpenMoments: () => void }) {
  return (
    <div className="flex flex-col gap-2 py-2">
      <div onClick={onOpenMoments} className="bg-white flex items-center gap-3 p-4 active:bg-gray-100 cursor-pointer">
        <div className="text-orange-500"><Compass size={24} /></div>
        <span className="flex-1">朋友圈</span>
        <ChevronRight size={18} className="text-gray-300" />
      </div>
      <div className="bg-white flex flex-col">
        <div className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100">
          <div className="text-blue-500"><Search size={24} /></div>
          <span className="flex-1">搜一搜</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
        <div className="flex items-center gap-3 p-4 active:bg-gray-100">
          <div className="text-green-500"><Plus size={24} /></div>
          <span className="flex-1">小程序</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}

function MeView({ userProfile, onEdit, onOpenService, onOpenStickers, onOpenPersonaManager }: { userProfile: UserProfile, onEdit: () => void, onOpenService: () => void, onOpenStickers: () => void, onOpenPersonaManager: () => void }) {
  const selectedPersona = userProfile.personaGroups.flatMap(g => g.personas).find(p => p.id === userProfile.selectedPersonaId);

  return (
    <div className="flex flex-col gap-2">
      <div onClick={onEdit} className="bg-white p-6 flex items-center gap-4 mb-2 cursor-pointer active:bg-gray-50">
        {selectedPersona?.avatar ? (
          <img src={selectedPersona.avatar} alt="Avatar" className="w-16 h-16 rounded-lg object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
            {selectedPersona?.name?.[0] || "?"}
          </div>
        )}
        <div className="flex-1">
          <div className="text-xl font-bold">{selectedPersona?.name || "未设置"}</div>
          <div className="text-sm text-gray-400">微信号: {userProfile.wechatId}</div>
        </div>
        <ChevronRight size={20} className="text-gray-300" />
      </div>

      <div className="bg-white flex flex-col">
        <div onClick={onOpenPersonaManager} className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100 cursor-pointer text-pink-600">
          <Users size={20} />
          <span className="flex-1 text-black">AI 角色管理</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
        <div onClick={onOpenService} className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100 cursor-pointer">
          <div className="text-green-600"><Wallet size={20} /></div>
          <span className="flex-1">服务</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
        <div className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100">
          <div className="text-blue-600"><UserIcon size={20} /></div>
          <span className="flex-1">收藏</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
        <div onClick={onOpenStickers} className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100 cursor-pointer">
          <div className="text-orange-500"><Smile size={20} /></div>
          <span className="flex-1">表情</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
        <div className="flex items-center gap-3 p-4 active:bg-gray-100">
          <div className="text-gray-600"><Settings size={20} /></div>
          <span className="flex-1">设置</span>
          <ChevronRight size={18} className="text-gray-300" />
        </div>
      </div>
    </div>
  );
}

function ChatView({ 
  contactName, 
  isGroup,
  groupChat,
  groupMembers = [],
  onBack, 
  apiConfig, 
  userProfile, 
  onNewAssistantMessage, 
  onUpdateProfile, 
  ttsEnabled, 
  onUpdateTtsEnabled,
  intenseReminder,
  onUpdateIntenseReminder,
  reminderFrequency,
  onUpdateReminderFrequency,
  intenseReminderRingtone,
  onUpdateIntenseReminderRingtone,
  chatBackground,
  onUpdateChatBackground,
  persistentContext,
  onUpdatePersistentContext,
  onStartVideoCall,
  onStartAudioCall,
  lastCallResult,
  onClearCallResult,
  onUpdateApiConfig,
  showCallSelect,
  setShowCallSelect,
  isMuted, 
  onToggleMute,
  isSticky,
  onToggleSticky,
  isAutoReplyEnabled,
  onToggleAutoReply,
  onTriggerMoment,
  onShowMoments,
  onUpdateGroup,
  onDeleteGroup,
  onEditGroupMembers,
  messages,
  setMessages,
  isTyping,
  setIsTyping,
  handleAiResponse,
  activeChatId,
  setActiveChatId,
  deleteMessage,
  withdrawMessage,
  speak,
  isApiBlocked,
  setIsApiBlocked,
  showApiHealthModal,
  setShowApiHealthModal,
  apiErrorText,
  toast,
  showToast,
  isRequestingRef
}: any) {
  const allPersonas = apiConfig.characterGroups.flatMap((g: any) => g.personas);
  const selectedAiPersona = allPersonas.find((p: any) => p.id === apiConfig.selectedCharacterId);
  const selectedUserPersona = userProfile.personaGroups.flatMap((g: any) => g.personas).find((p: any) => p.id === userProfile.selectedPersonaId);

  const [showSearch, setShowSearch] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState(contactName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClearHistory = () => {
    if (window.confirm("确定要清空聊天记录吗？")) {
      const storageKey = `wechat_messages_${activeChatId}`;
      localStorage.removeItem(storageKey);
      setMessages([]);
      showToast("已清空聊天记录");
      setShowGroupSettings(false);
    }
  };

  const handleDeleteGroup = () => {
    if (window.confirm("确定要删除并退出该群聊吗？")) {
      onDeleteGroup(activeChatId);
      showToast("群聊已解散");
    }
  };

  const saveGroupName = () => {
    const newName = prompt("请输入新群名", contactName);
    if (newName && newName.trim()) {
      onUpdateGroup(activeChatId, { name: newName.trim() });
      showToast("群名已更新");
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateGroup(activeChatId, { avatar: reader.result as string });
        showToast("群头像已更新");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnnouncement = () => {
    const newAnnouncement = prompt("发布群公告", groupChat?.announcement || "");
    if (newAnnouncement !== null) {
      onUpdateGroup(activeChatId, { announcement: newAnnouncement.trim() });
      showToast("群公告已发布");
    }
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [showAiProfile, setShowAiProfile] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showRingtoneInput, setShowRingtoneInput] = useState(false);
  const [ringtoneUrl, setRingtoneUrl] = useState("");

  const lastProcessedCallTimestamp = useRef<number>(0);

  // Dual-Call Handle Logic: Capture result and append to history
  useEffect(() => {
    if (lastCallResult && lastCallResult.timestamp > lastProcessedCallTimestamp.current) {
      lastProcessedCallTimestamp.current = lastCallResult.timestamp;
      
      const modeText = lastCallResult.mode === 'audio' ? '语音通话' : '视频通话';
      const toastText = `${modeText}结束，时长 ${lastCallResult.duration}秒`;
      
      // Post-call message archiving (Requirement: Static Position)
      const callRecord: Message = {
        id: 'call-result-' + lastCallResult.timestamp,
        role: 'user', // Technically system-recorded user action
        content: toastText,
        type: 'system',
        timestamp: lastCallResult.timestamp
      };
      
      // Prevent duplicates: Only add if not already in history (timestamp check)
      setMessages((prev: Message[]) => {
        if (prev.some(m => m.id === callRecord.id)) return prev;
        return [...prev, callRecord];
      });
      
      onClearCallResult();
      showToast(toastText);
    }
  }, [lastCallResult, onClearCallResult, showToast, setMessages]);

  const clearHistory = () => {
    console.log("[Action: Confirm_Clear]");
    setIsTyping(false);
    setIsApiBlocked(false);
    setShowApiHealthModal(false);
    
    const clearNotice: Message = { 
      id: Date.now().toString(), 
      role: "assistant", 
      content: "聊天记录已清空。虽然我看不到过去的对话流了，但我依然记得你是谁，也记得我们正在进行的计划。", 
      timestamp: Date.now(),
      type: 'system'
    };

    setMessages([clearNotice]);
    setShowClearConfirm(false);
    localStorage.setItem(`wechat_messages_${apiConfig.selectedCharacterId}`, JSON.stringify([clearNotice]));
    showToast("聊天记录已清空");

    if (messages.length > 2) {
      const currentMessages = [...messages];
      setTimeout(async () => {
        try {
          const summary = await getAiResponse(currentMessages, "请对我们至今为止的对话进行一次核心摘要（用于长期记忆存留）。重点包含：我的身份、论文进度、任何你认为需要记住的关键成果。字数100字以内。", apiConfig, userProfile, persistentContext);
          onUpdatePersistentContext((persistentContext ? persistentContext + "\n" : "") + "【历史摘要】" + summary);
        } catch (e) {}
      }, 0);
    }
  };
  const [inputValue, setInputValue] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [longPressedMessage, setLongPressedMessage] = useState<Message | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [quotedMessage, setQuotedMessage] = useState<Message | null>(null);
  const [showRedPacketModal, setShowRedPacketModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionNote, setTransactionNote] = useState("");

  const handleTransaction = (type: 'red-packet' | 'transfer') => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) return;
    if (amount > userProfile.balance) {
      alert("余额不足");
      return;
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: JSON.stringify({
        amount,
        note: transactionNote || (type === 'red-packet' ? "恭喜发财，大吉大利" : "转账给对方"),
        type
      }),
      type: type === 'red-packet' ? 'red-packet' as any : 'transfer' as any,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    onUpdateProfile({ balance: userProfile.balance - amount });
    
    const aiResponse: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: type === 'red-packet' ? `谢谢宝贝的红包！爱你么么哒~ 🧧` : `收到啦，谢谢亲爱的！💰`,
      timestamp: Date.now()
    };

    if (type === 'red-packet') {
      const systemMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `${contactName}领取了你的红包`,
        type: 'system',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, systemMsg, aiResponse]);
    } else if (type === 'transfer') {
      const systemMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `${contactName}已确认收钱`,
        type: 'system',
        timestamp: Date.now()
      };
      const receiptMsg: Message = {
        id: (Date.now() + 3).toString(),
        role: 'assistant',
        type: 'transfer' as any,
        content: JSON.stringify({ amount, note: '已收钱' }),
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, systemMsg, receiptMsg, aiResponse]);
    } else {
      setMessages(prev => [...prev, aiResponse]);
    }
    if (!isMuted) onNewAssistantMessage(aiResponse);

    setTransactionAmount("");
    setTransactionNote("");
    setShowRedPacketModal(false);
    setShowTransferModal(false);
    setShowTools(false);
  };
  const longPressTimer = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'zh-CN';
      
      recognition.onresult = (event: any) => {
        let interim = '';
        let finalPart = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) finalPart += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        if (finalPart) setInputValue(prev => prev + finalPart);
        setLiveTranscript(interim);
      };

      recognition.onend = () => setLiveTranscript("");
      recognitionRef.current = recognition;
    }
  }, []);

  const startRecording = async () => {
    try {
      setLiveTranscript("");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        setTimeout(async () => {
          if (isRequestingRef.current) return;
          isRequestingRef.current = true;
          
          let textToSend = "";
          setInputValue(currentValue => {
            textToSend = currentValue.trim();
            return "";
          });

          const newMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend || "语音消息",
            type: 'voice',
            duration: Math.max(1, Math.floor((Date.now() - (mediaRecorderRef.current as any).startTime) / 1000)),
            timestamp: Date.now()
          };
          
          setMessages(prev => {
            const next = [...prev, newMessage];
            return next;
          });
          if (textToSend) speak(textToSend);
          
          try {
            // Logic moved to functional update
          } catch (e) {
            console.error("[Action: Voice_Send_Error]", e);
          } finally {
            isRequestingRef.current = false;
          }
        }, 500);
      };

      (recorder as any).startTime = Date.now();
      recorder.start();
      setIsRecording(true);
      if (recognitionRef.current) recognitionRef.current.start();
    } catch (err: any) {
      console.error("Microphone error:", err);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recognitionRef.current) recognitionRef.current.stop();
    }
  };

  const handleSend = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    // 0. Intercept Event Propagation & Defaults
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // 1. Unified Locking & Validation
    if (isRequestingRef.current || isApiBlocked || isTyping) return;
    const text = inputValue.trim();
    if (!text) return;

    const currentTimestamp = Date.now();
    
    // Prevent ultra-fast double sends (e.g. from both keydown and click)
    if ((window as any)._lastSendTime && currentTimestamp - (window as any)._lastSendTime < 300) {
      return;
    }
    (window as any)._lastSendTime = currentTimestamp;

    const newMessage: Message = {
      id: currentTimestamp.toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      ...(quotedMessage && { 
        quoteId: quotedMessage.id, 
        quoteContent: quotedMessage.content,
        quoteSender: quotedMessage.role === 'user' ? (selectedUserPersona?.name || "我") : (selectedAiPersona?.name || contactName)
      })
    };
    
    // 3. Clear UI State immediately
    setInputValue("");
    setQuotedMessage(null);
    
    setMessages(prev => {
      const last = prev[prev.length - 1];
      if (last && last.role === 'user' && last.content === text && (currentTimestamp - last.timestamp < 300)) {
        return prev;
      }
      const next = [...prev, newMessage];
      if (isAutoReplyEnabled) {
        setTimeout(() => handleAiResponse(next), 0);
      }
      return next;
    });

    try {
      // Logic moved into setMessages to ensure correct state sequence
    } catch (error) {
      console.error("[Action: Send_Error]", error);
    } finally {
      // 5. Cleanup
    }
  };

  const handleTouchStart = (e: any, msg: Message) => {
    longPressTimer.current = setTimeout(() => setLongPressedMessage(msg), 500);
  };

  const handleTouchEnd = () => { if (longPressTimer.current) clearTimeout(longPressTimer.current); };

  const onQuote = (msg: Message) => { setQuotedMessage(msg); setLongPressedMessage(null); };

  const onCopy = (msg: Message) => {
    const textToCopy = msg.type === 'transfer' ? `转账: ¥${JSON.parse(msg.content).amount}` : msg.content;
    navigator.clipboard.writeText(textToCopy);
    setLongPressedMessage(null);
  };

  const onEditMessage = (msg: Message) => {
    if (msg.type !== 'text' && msg.type !== undefined) {
      showToast("仅支持编辑文本消息");
      setLongPressedMessage(null);
      return;
    }
    setEditingMessageId(msg.id);
    setInputValue(msg.content);
    setLongPressedMessage(null);
    setIsVoiceMode(false);
  };

  const handleSaveEdit = () => {
    if (!editingMessageId) return;
    const newContent = inputValue.trim();
    if (!newContent) return;

    setMessages(prev => {
      const newMessages = prev.map(m => m.id === editingMessageId ? { ...m, content: newContent } : m);
      localStorage.setItem(`wechat_messages_${apiConfig.selectedCharacterId}`, JSON.stringify(newMessages));
      return newMessages;
    });

    setEditingMessageId(null);
    setInputValue("");
    showToast("消息已修改");
  };

  if (showAiProfile) return (
    <div className="flex flex-col h-full bg-[#EDEDED] relative">
      <AiProfileView 
        onBack={() => setShowAiProfile(false)} 
        apiConfig={apiConfig} 
        onShowMoments={() => { setShowAiProfile(false); onShowMoments(); }}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        isSticky={isSticky}
        onToggleSticky={onToggleSticky}
        isAutoReplyEnabled={isAutoReplyEnabled}
        onToggleAutoReply={onToggleAutoReply}
        ttsEnabled={ttsEnabled}
        onUpdateTtsEnabled={onUpdateTtsEnabled}
        intenseReminder={intenseReminder}
        onUpdateIntenseReminder={async (val: boolean) => {
          onUpdateIntenseReminder(val);
          if (val) {
            setShowRingtoneInput(true);
          } else {
            showToast("强提醒已关闭");
          }
        }}
        reminderFrequency={reminderFrequency}
        onUpdateReminderFrequency={onUpdateReminderFrequency}
        intenseReminderRingtone={intenseReminderRingtone}
        onUpdateIntenseReminderRingtone={onUpdateIntenseReminderRingtone}
        onUpdateChatBackground={async (url: string | null) => {
          onUpdateChatBackground(url);
          if (url) {
            showToast("聊天背景已设置");
          }
        }}
        onClearHistory={() => setShowClearConfirm(true)}
        onUpdateApiConfig={onUpdateApiConfig}
        showToast={showToast}
      />

      {/* Global Overlays for AiProfileView */}
      <AnimatePresence>
        {showRingtoneInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[300px] overflow-hidden shadow-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-2">设置警示音</h3>
              <p className="text-xs text-gray-500 mb-4">请输入专属学术警示音的音频 URL</p>
              <input 
                type="text" 
                value={ringtoneUrl}
                onChange={(e) => setRingtoneUrl(e.target.value)}
                placeholder="https://example.com/alert.mp3"
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#07C160] mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRingtoneInput(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-400 active:bg-gray-50 border border-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (ringtoneUrl.trim()) {
                      setShowRingtoneInput(false);
                      showToast("铃声设置成功");
                    }
                  }}
                  className="flex-1 py-2 text-sm font-bold bg-[#07C160] text-white rounded-lg active:bg-[#06AD56]"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[280px] overflow-hidden shadow-xl"
            >
              <div className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">是否确认清空聊天记录？</h3>
                <p className="text-sm text-gray-500">确定要清空与 {contactName} 的所有聊天记录吗？此操作不可撤销。</p>
              </div>
              <div className="flex border-t border-gray-100">
                <button 
                  onClick={() => {
                    setShowClearConfirm(false);
                    showToast("已取消清空");
                  }}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 active:bg-gray-50 border-r border-gray-100"
                >
                  取消
                </button>
                <button 
                  onClick={clearHistory}
                  className="flex-1 py-3 text-sm font-bold text-red-500 active:bg-gray-50"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] relative">
      {/* Ringtone URL Modal */}
      <AnimatePresence>
        {showRingtoneInput && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[4000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[300px] overflow-hidden shadow-2xl p-6"
            >
              <h3 className="font-bold text-lg mb-2">设置警示音</h3>
              <p className="text-xs text-gray-500 mb-4">请输入专属学术警示音的音频 URL</p>
              <input 
                type="text" 
                value={ringtoneUrl}
                onChange={(e) => setRingtoneUrl(e.target.value)}
                placeholder="https://example.com/alert.mp3"
                className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#07C160] mb-4"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowRingtoneInput(false)}
                  className="flex-1 py-2 text-sm font-medium text-gray-400 active:bg-gray-50 border border-gray-100 rounded-lg"
                >
                  取消
                </button>
                <button 
                  onClick={() => {
                    if (ringtoneUrl.trim()) {
                      setShowRingtoneInput(false);
                      showToast("铃声设置成功");
                    }
                  }}
                  className="flex-1 py-2 text-sm font-bold bg-[#07C160] text-white rounded-lg active:bg-[#06AD56]"
                >
                  确认
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modals */}
      <AnimatePresence>
        {(showRedPacketModal || showTransferModal) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[3000] bg-black/50 flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-[320px] overflow-hidden shadow-2xl"
            >
              <div className={"p-6 text-center " + (showRedPacketModal ? "bg-[#F35543] text-white" : "bg-[#FBFBFB] text-black")}>
                <div className="flex justify-between items-center mb-4">
                  <button onClick={() => { setShowRedPacketModal(false); setShowTransferModal(false); }} className="opacity-70"><X size={20} /></button>
                  <h3 className="font-bold text-lg">{showRedPacketModal ? '发红包' : '转账'}</h3>
                  <div className="w-5"></div>
                </div>
                <div className="flex flex-col items-center gap-4 py-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold">¥</span>
                    <input 
                      type="number" 
                      autoFocus
                      placeholder="0.00"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                      className={'bg-transparent text-5xl font-bold w-40 text-center outline-none border-b border-white/30 pb-2 ' + (showTransferModal ? 'border-black/10' : '')}
                    />
                  </div>
                  <input 
                    type="text"
                    placeholder={showRedPacketModal ? "恭喜发财，大吉大利" : "添加转账说明"}
                    value={transactionNote}
                    onChange={(e) => setTransactionNote(e.target.value)}
                    className={'bg-transparent text-sm w-full text-center outline-none opacity-80 ' + (showTransferModal ? 'text-gray-500' : '')}
                  />
                </div>
              </div>
              <div className="p-6 bg-[#FBFBFB]">
                <div className="flex justify-between text-xs text-gray-400 mb-6">
                  <span>当前余额: ¥{userProfile.balance.toFixed(2)}</span>
                </div>
                <button 
                  onClick={() => handleTransaction(showRedPacketModal ? 'red-packet' : 'transfer')}
                  disabled={!transactionAmount || parseFloat(transactionAmount) <= 0}
                  className={'w-full py-3 rounded-lg font-bold transition-colors ' + (showRedPacketModal ? 'bg-[#F35543] text-white active:bg-[#D44838]' : 'bg-[#07C160] text-white active:bg-[#06AD56]') + ' disabled:opacity-50'}
                >
                  {showRedPacketModal ? '塞钱进红包' : '立即转账'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Header */}
      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          {showSearch ? (
            <div className="flex items-center bg-white rounded-md px-2 py-1 mx-2">
              <Search size={14} className="text-gray-400 mr-1" />
              <input 
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索聊天记录"
                className="flex-1 text-sm outline-none bg-transparent"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400">
                  <X size={14} />
                </button>
              )}
            </div>
          ) : (
            <div 
              className={cn("flex flex-col cursor-pointer active:opacity-70", isGroup && "hover:text-[#576B95]")}
              onClick={() => isGroup && saveGroupName()}
            >
              <h1 className="text-[17px] font-semibold leading-tight">
                {isTyping ? "对方正在输入..." : contactName}
              </h1>
              {isGroup && !isTyping && <span className="text-[10px] text-gray-500">（{groupMembers.length + 1}）</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1">
          {showSearch ? (
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); }} className="text-sm text-[#576B95]">取消</button>
          ) : (
            <>
              <button 
                onClick={() => handleAiResponse(messages)}
                title="触发 AI 回复"
                className={cn(
                  "p-1 active:opacity-50 transition-colors",
                  isTyping ? "text-yellow-500 animate-pulse" : "text-black"
                )}
              >
                <Zap size={20} fill={isTyping ? "currentColor" : "none"} />
              </button>
              <button onClick={() => isGroup ? setShowGroupSettings(true) : setShowAiProfile(true)} className="p-1 text-black active:opacity-50">
                <MoreHorizontal size={24} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Group Settings Modal */}
      <AnimatePresence>
        {showGroupSettings && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[4500] bg-[#F7F3F0] flex flex-col"
          >
            <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 shrink-0 border-b border-gray-200">
              <button 
                onClick={() => setShowGroupSettings(false)}
                className="p-1 text-black active:opacity-50 mb-1"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex-1 text-center pb-2">
                <span className="font-bold text-[17px]">聊天信息({groupMembers.length + 1})</span>
              </div>
              <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                className="hidden" 
                accept="image/*"
              />
              {/* Member Grid */}
              <div className="bg-white p-4 grid grid-cols-5 gap-y-4 mb-3 border-b border-gray-100">
                {/* User Self */}
                <div className="flex flex-col items-center gap-1 overflow-hidden">
                  <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                    {selectedUserPersona?.avatar ? (
                      <img src={selectedUserPersona.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      "我"
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 truncate w-full text-center">我</span>
                </div>
                {/* AI Members */}
                {groupMembers.map((p: any) => (
                  <div key={p.id} className="flex flex-col items-center gap-1 overflow-hidden">
                    <img src={p.avatar} className="w-12 h-12 rounded-lg object-cover shrink-0" referrerPolicy="no-referrer" />
                    <span className="text-[11px] text-gray-500 truncate w-full text-center">{p.name}</span>
                  </div>
                ))}
                {/* Add Member Button */}
                <button 
                  onClick={() => {
                    onEditGroupMembers(activeChatId, groupMembers.map((p: any) => p.id));
                    setShowGroupSettings(false);
                  }}
                  className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-300 active:bg-gray-50"
                >
                  <Plus size={24} />
                </button>
              </div>

              {/* Group Detail Settings */}
              <div className="bg-white border-y border-gray-100 mb-2">
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                  <div className="flex flex-col">
                    <span>AI 主动回复</span>
                    <span className="text-[10px] text-gray-400">开启后 AI 会在收到消息后自动回复</span>
                  </div>
                  <button 
                    onClick={onToggleAutoReply}
                    className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (isAutoReplyEnabled ? 'bg-[#07C160]' : 'bg-gray-200')}
                  >
                    <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (isAutoReplyEnabled ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
                  </button>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50" onClick={saveGroupName}>
                  <span className="text-[15px] font-medium">群聊名称</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[13px] text-gray-400 truncate max-w-[150px]">{contactName}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50" onClick={() => fileInputRef.current?.click()}>
                  <span className="text-[15px] font-medium">群头像</span>
                  <div className="flex items-center gap-1">
                    {groupChat?.avatar && (
                      <img src={groupChat.avatar} className="w-8 h-8 rounded object-cover" referrerPolicy="no-referrer" />
                    )}
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
                <div className="px-4 py-3 flex items-center justify-between border-b border-gray-50">
                  <span className="text-[15px] font-medium">群二维码</span>
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
                <div className="px-4 py-3 flex items-center justify-between" onClick={handleAnnouncement}>
                  <span className="text-[15px] font-medium">群公告</span>
                  <div className="flex items-center gap-1 max-w-[200px]">
                    <span className="text-[13px] text-gray-400 truncate">{groupChat?.announcement || "未设置"}</span>
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </div>
              </div>

              <div className="bg-white border-y border-gray-100 mb-5">
                <button 
                  onClick={handleClearHistory}
                  className="w-full text-left px-4 py-4 text-[15px] active:bg-gray-50"
                >
                  清空聊天记录
                </button>
              </div>

              <div className="bg-white border-y border-gray-100 mb-10">
                <button 
                  onClick={handleDeleteGroup}
                  className="w-full text-center py-4 text-[15px] text-[#FA5151] font-bold active:bg-gray-50"
                >
                  删除并退出
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Clear History Confirmation Modal */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[280px] overflow-hidden shadow-xl"
            >
              <div className="p-6 text-center">
                <h3 className="font-bold text-lg mb-2">是否确认清空聊天记录？</h3>
                <p className="text-sm text-gray-500">确定要清空与 {contactName} 的所有聊天记录吗？此操作不可撤销。</p>
              </div>
              <div className="flex border-t border-gray-100">
                <button 
                  onClick={() => setShowClearConfirm(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 active:bg-gray-50 border-r border-gray-100"
                >
                  取消
                </button>
                <button 
                  onClick={clearHistory}
                  className="flex-1 py-3 text-sm font-bold text-red-500 active:bg-gray-50"
                >
                  清空
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Call Mode Selection Modal */}
      <AnimatePresence>
        {showCallSelect && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
            onClick={() => setShowCallSelect(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl w-full max-w-[280px] overflow-hidden shadow-2xl flex flex-col"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 text-center border-b border-gray-100">
                <h3 className="font-bold text-[17px]">请选择通话模式</h3>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">选项: 语音通话, 视频通话</p>
              </div>
              <div className="flex flex-col">
                <button 
                  onClick={() => {
                    console.log("[Action: Start_Audio_Call]");
                    const startMsg: Message = {
                      id: 'call-start-' + Date.now(),
                      role: 'user',
                      content: "[Action: Start_Audio_Call]",
                      type: 'system',
                      timestamp: Date.now()
                    };
                    setMessages((prev: Message[]) => [...prev, startMsg]);
                    onStartAudioCall({ partnerName: contactName, partnerAvatar: selectedAiPersona?.avatar || "", userAvatar: selectedUserPersona?.avatar || "" });
                    setShowCallSelect(false);
                    setShowTools(false);
                  }}
                  className="flex items-center justify-center gap-3 py-4 active:bg-gray-50 transition-colors border-b border-gray-100 group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#07C160]/10 flex items-center justify-center text-[#07C160] group-active:scale-90 transition-transform">
                    <Mic size={22} />
                  </div>
                  <span className="font-semibold text-gray-800">语音通话</span>
                </button>
                <button 
                  onClick={() => {
                    console.log("[Action: Start_Video_Call]");
                    const startMsg: Message = {
                      id: 'call-start-' + Date.now(),
                      role: 'user',
                      content: "[Action: Start_Video_Call]",
                      type: 'system',
                      timestamp: Date.now()
                    };
                    setMessages((prev: Message[]) => [...prev, startMsg]);
                    onStartVideoCall({ partnerName: contactName, partnerAvatar: selectedAiPersona?.avatar || "", userAvatar: selectedUserPersona?.avatar || "" });
                    setShowCallSelect(false);
                    setShowTools(false);
                  }}
                  className="flex items-center justify-center gap-3 py-4 active:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-full bg-[#07C160]/10 flex items-center justify-center text-[#07C160] group-active:scale-90 transition-transform">
                    <Video size={22} />
                  </div>
                  <span className="font-semibold text-gray-800">视频通话</span>
                </button>
              </div>
              <div className="h-2 bg-[#F7F7F7]"></div>
              <button 
                onClick={() => setShowCallSelect(false)}
                className="py-4 text-gray-500 font-medium active:bg-gray-100 transition-colors"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* API Health Modal */}
      <AnimatePresence>
        {showApiHealthModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[5000] bg-black/60 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-[300px] overflow-hidden shadow-2xl"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <WifiOff size={32} />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">API 状态异常</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {apiErrorText.replace('[Modal: ', '').replace(']', '') || "API 余额不足或密钥无效，请及时充值或更换密钥并重新配置。"} 
                </p>
              </div>
              <button 
                onClick={() => setShowApiHealthModal(false)}
                className="w-full py-4 bg-gray-50 text-gray-900 font-bold active:bg-gray-100 border-t border-gray-100 transition-colors"
              >
                我知道了
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto p-3 flex flex-col gap-4 relative"
        style={chatBackground ? { 
          backgroundImage: `url(${chatBackground})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center',
          backgroundAttachment: 'local'
        } : {}}
        onClick={() => setLongPressedMessage(null)}
      >
        {isRecording && (
          <div className="absolute inset-x-0 top-20 bottom-0 z-[2000] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center p-8">
            <div className="w-24 h-24 bg-[#07C160] rounded-full flex items-center justify-center mb-6 shadow-xl animate-pulse">
              <Mic size={48} className="text-white" />
            </div>
            <div className="bg-white/20 rounded-2xl p-6 text-white text-center min-h-[120px] w-full max-w-[280px] overflow-y-auto flex items-center justify-center">
              <p className="text-[17px] font-medium leading-relaxed drop-shadow-sm italic">
                {liveTranscript || (inputValue ? inputValue : "正在听...")}
              </p>
            </div>
            <p className="text-white/80 text-sm mt-6 font-bold tracking-wider">松开 结束</p>
          </div>
        )}
        {messages.filter(m => !searchQuery || (m.content && m.content.toLowerCase().includes(searchQuery.toLowerCase()))).map((msg, index, filteredArr) => {
          // Time divider logic: Show if more than 5 minutes gap
          const prevMsg = filteredArr[index - 1];
          const showTimeDivider = !prevMsg || (msg.timestamp - prevMsg.timestamp > 5 * 60 * 1000);

          return (
            <React.Fragment key={msg.id}>
              {showTimeDivider && (
                <div className="flex justify-center my-2">
                  <span className="text-[10px] text-gray-400 bg-black/5 px-2 py-0.5 rounded-full">
                    {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
              {msg.isWithdrawn || msg.type === 'system' ? (
                (() => {
                  const isVideoEnd = msg.content.includes("视频通话结束");
                  const cleanContent = msg.content.replace("[UI: Call_Ended_Banner]", "").trim();
                  
                  const messagesAfter = filteredArr.length - 1 - index;
                  const isArchived = isVideoEnd && messagesAfter > 3;

                  return (
                    <motion.div 
                      initial={false}
                      animate={{ opacity: isArchived ? 0.4 : 1 }}
                      {...(isVideoEnd ? { "data-ui": "Call_Ended_Banner" } : {})}
                      className="flex justify-center my-2 relative z-0"
                      style={{ position: 'static' }}
                    >
                      <div className="bg-gray-200/50 text-[11px] text-gray-400 px-3 py-1 rounded-sm flex items-center gap-1.5 transition-all select-none">
                        {isVideoEnd && <Video size={12} className="opacity-60" />}
                        <span>
                          {msg.isWithdrawn ? (msg.role === 'user' ? '你撤回了一条消息' : '对方撤回了一条消息') : cleanContent}
                        </span>
                      </div>
                    </motion.div>
                  );
                })()
              ) : (
                <div 
                  className={"flex gap-2 " + (msg.role === "user" ? "flex-row-reverse" : "flex-row")}
                  onMouseDown={(e) => handleTouchStart(e, msg)}
                  onMouseUp={handleTouchEnd}
                  onTouchStart={(e) => handleTouchStart(e, msg)}
                  onTouchEnd={handleTouchEnd}
                >
                  <div className={"w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-bold overflow-hidden " + (msg.role === "user" ? "bg-blue-500 text-white" : "bg-pink-100 text-pink-500")}>
                    {msg.role === 'user' ? (
                      selectedUserPersona?.avatar ? <img src={selectedUserPersona.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : "我"
                    ) : (
                      (isGroup && msg.personaId) ? (
                        <img src={allPersonas.find((p: any) => p.id === msg.personaId)?.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        selectedAiPersona?.avatar ? <img src={selectedAiPersona.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : contactName[0]
                      )
                    )}
                  </div>
                  <div className={"max-w-[70%] flex flex-col gap-1 " + (msg.role === "user" ? "items-end" : "items-start")}>
                    {isGroup && msg.role === 'assistant' && (
                      <span className="text-[10px] text-gray-400 px-1">
                        {allPersonas.find((p: any) => p.id === msg.personaId)?.name || contactName}
                      </span>
                    )}
                    <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className={"px-3 py-2 rounded-lg text-[15px] leading-relaxed relative chat-bubble-shadow " + (msg.role === "user" ? (msg.type === "red-packet" ? "bg-[#F35543]" : msg.type === "transfer" ? "bg-[#F99D39]" : msg.type === 'image' ? "bg-transparent p-0 overflow-hidden" : "bg-[#95EC69]") : (msg.type === "red-packet" ? "bg-[#F35543]" : msg.type === "transfer" ? "bg-[#F99D39]" : msg.type === 'image' ? "bg-transparent p-0 overflow-hidden" : "bg-white"))}
                >
                      {msg.type === 'image' && msg.image && (
                        <motion.div 
                          layoutId={`img-${msg.id}`}
                          className="max-w-full rounded-lg overflow-hidden border border-gray-100 shadow-sm"
                        >
                          <img 
                            src={msg.image} 
                            alt="Shared image" 
                            className="max-w-full h-auto block"
                            referrerPolicy="no-referrer"
                          />
                        </motion.div>
                      )}
                      {msg.content && msg.type === 'image' && (
                        <div className="mt-2 px-3 py-2 bg-white rounded-lg shadow-sm">
                          {msg.content}
                        </div>
                      )}
                      {/* Context Menu Hooked to Message */}
                      <AnimatePresence>
                        {longPressedMessage?.id === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 10 }}
                            className={"absolute z-[3000] bg-[#4C4C4C] rounded-xl overflow-hidden flex shadow-2xl top-[calc(100%+8px)] " + (msg.role === "user" ? "right-0" : "left-0")}
                          >
                            <button 
                              onClick={(e) => { e.stopPropagation(); onCopy(msg); }}
                              className="px-4 py-2 text-white text-xs flex flex-col items-center gap-1 active:bg-white/10"
                            >
                              <Copy size={16} />
                              <span>复制</span>
                            </button>
                            <div className="w-[1px] bg-white/10 my-2"></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onEditMessage(msg); }}
                              className="px-4 py-2 text-white text-xs flex flex-col items-center gap-1 active:bg-white/10"
                            >
                              <Edit3 size={16} />
                              <span>编辑</span>
                            </button>
                            <div className="w-[1px] bg-white/10 my-2"></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); onQuote(msg); }}
                              className="px-4 py-2 text-white text-xs flex flex-col items-center gap-1 active:bg-white/10"
                            >
                              <Reply size={16} />
                              <span>引用</span>
                            </button>
                            <div className="w-[1px] bg-white/10 my-2"></div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); deleteMessage(msg.id); setLongPressedMessage(null); }}
                              className="px-4 py-2 text-white text-xs flex flex-col items-center gap-1 active:bg-white/10"
                            >
                              <Trash2 size={16} />
                              <span>删除</span>
                            </button>
                            {msg.role === 'user' && !msg.isWithdrawn && (
                              <>
                                <div className="w-[1px] bg-white/10 my-2"></div>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); withdrawMessage(msg.id); setLongPressedMessage(null); }}
                                  className="px-4 py-2 text-white text-xs flex flex-col items-center gap-1 active:bg-white/10"
                                >
                                  <Undo2 size={16} />
                                  <span>撤回</span>
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      {msg.quoteContent && (
                        <div className="mb-1 text-[11px] text-gray-500 bg-black/5 rounded px-2 py-1 border-l-2 border-gray-300">
                          <div className="font-bold opacity-70 mb-0.5">{msg.quoteSender || "我"}:</div>
                          <div className="line-clamp-2 opacity-80">{msg.quoteContent}</div>
                        </div>
                      )}
                      {msg.type === 'voice' ? (
                        <div className="flex items-center gap-2 min-w-[60px]">
                          <Volume2 size={18} className={msg.role === 'user' ? 'rotate-180' : ''} />
                          <span>{msg.duration}"</span>
                        </div>
                      ) : msg.type === 'sticker' ? (
                        <img src={msg.content} className="w-24 h-24 object-contain" referrerPolicy="no-referrer" />
                      ) : msg.type === 'red-packet' ? (
                        <div className="w-56 overflow-hidden active:opacity-90 cursor-pointer -mx-3 -my-2">
                          <div className="p-3 flex gap-3 items-start">
                            <div className="w-10 h-10 bg-[#FCE6B9] rounded flex items-center justify-center text-[#F35543]">
                              <Heart size={24} fill="currentColor" />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-[15px] font-medium leading-tight">
                                {JSON.parse(msg.content).note}
                              </span>
                              <span className="text-white/70 text-[11px] mt-1">查看红包</span>
                            </div>
                          </div>
                          <div className="bg-white/10 px-3 py-1 text-[10px] text-white/60">微信红包</div>
                        </div>
                      ) : msg.type === 'transfer' ? (
                        <div className="w-56 overflow-hidden active:opacity-90 cursor-pointer -mx-3 -my-2">
                          <div className="p-3 flex gap-3 items-start">
                            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white">
                              <CheckCircle2 size={24} />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-white text-[15px] font-medium leading-tight">
                                ¥{JSON.parse(msg.content).amount.toFixed(2)}
                              </span>
                              <span className="text-white/70 text-[11px] mt-1">
                                {msg.role === 'user' ? '已收款' : '已收钱'}
                              </span>
                              <span className="text-white/50 text-[10px] mt-1">明细</span>
                            </div>
                          </div>
                          <div className="bg-white/10 px-3 py-1 text-[10px] text-white/60">微信转账</div>
                        </div>
                      ) : msg.type === 'image' ? null : msg.content}
                      <div className={'absolute top-3 w-2 h-2 rotate-45 ' + (msg.role === 'user' ? '-right-1 ' + (msg.type === 'red-packet' ? 'bg-[#F35543]' : msg.type === 'transfer' ? 'bg-[#F99D39]' : 'bg-[#95EC69]') : '-left-1 ' + (msg.type === 'red-packet' ? 'bg-[#F35543]' : msg.type === 'transfer' ? 'bg-[#F99D39]' : 'bg-white'))}></div>
                    </motion.div>
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
        {isTyping && (
          <div className="flex gap-2">
            <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-500 flex items-center justify-center font-bold overflow-hidden">
              {selectedAiPersona?.avatar ? <img src={selectedAiPersona.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : contactName[0]}
            </div>
            <div className="bg-white px-3 py-2 rounded-lg flex gap-1 items-center">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Input Bar */}
      <div className="bg-[#F7F7F7] border-t border-gray-200 p-2 pb-8 flex flex-col shrink-0">
        {editingMessageId && (
          <div className="px-3 py-1.5 bg-yellow-50 flex items-center justify-between rounded-t-lg mb-1 border-x border-t border-yellow-100">
            <div className="text-[11px] text-yellow-600 flex items-center gap-1">
              <Edit3 size={12} />
              正在编辑消息...
            </div>
            <button onClick={() => { setEditingMessageId(null); setInputValue(""); }} className="text-gray-400">
              <Plus size={14} className="rotate-45" />
            </button>
          </div>
        )}
        {quotedMessage && !editingMessageId && (
          <div className="px-3 py-1.5 bg-gray-200/50 flex items-center justify-between rounded-t-lg mb-1">
            <div className="text-[11px] text-gray-500 truncate flex-1">
              引用: {quotedMessage.content}
            </div>
            <button onClick={() => setQuotedMessage(null)} className="ml-2 text-gray-400">
              <Plus size={14} className="rotate-45" />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button onClick={() => setIsVoiceMode(!isVoiceMode)} className="p-1.5 text-black active:opacity-50">
            {isVoiceMode ? <MessageSquare size={28} /> : <Mic size={28} />}
          </button>
          
          {isVoiceMode ? (
            <button 
              onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
              onMouseUp={(e) => { e.preventDefault(); stopRecording(); }}
              onMouseLeave={(e) => { e.preventDefault(); if (isRecording) stopRecording(); }}
              onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
              onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
              className={"flex-1 h-9 rounded-lg border border-gray-300 font-bold text-[15px] active:bg-gray-200 transition-colors select-none touch-none " + (isRecording ? "bg-gray-300" : "bg-white")}
            >
              {isRecording ? "松开 结束" : "按住 说话"}
            </button>
          ) : (
            <textarea 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onFocus={() => { setShowStickers(false); setShowTools(false); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  handleSend(e);
                }
              }}
              placeholder=""
              className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-[15px] outline-none resize-none max-h-24 min-h-[36px]"
              rows={1}
            />
          )}

          <button onClick={() => { setShowStickers(!showStickers); setShowTools(false); setIsVoiceMode(false); }} className="p-1.5 text-black active:opacity-50">
            <Smile size={28} />
          </button>

          {inputValue.trim() ? (
            <button 
              onClick={(e) => editingMessageId ? handleSaveEdit() : handleSend(e)}
              disabled={isTyping || isApiBlocked}
              className={`w-14 h-9 ${editingMessageId ? 'bg-orange-500' : 'bg-[#07C160]'} rounded-lg flex items-center justify-center text-white text-sm font-medium disabled:opacity-50 transition-opacity`}
            >
              {editingMessageId ? "保存" : "发送"}
            </button>
          ) : (
            <button onClick={() => { setShowTools(!showTools); setShowStickers(false); setIsVoiceMode(false); }} className="p-1.5 text-black active:opacity-50">
              <Plus size={28} />
            </button>
          )}
        </div>

        {/* Stickers Panel */}
        <AnimatePresence>
          {showStickers && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 260 }}
              exit={{ height: 0 }}
              className="overflow-hidden bg-[#F7F7F7]"
            >
              <div className="grid grid-cols-4 gap-4 p-4 h-full overflow-y-auto">
                <div className="aspect-square bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 relative overflow-hidden">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const stickers = [...(userProfile.stickerGroups[0]?.stickers || []), reader.result as string];
                          onUpdateProfile({ stickerGroups: [{ ...userProfile.stickerGroups[0], stickers }] });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Plus size={32} />
                </div>
                {userProfile.stickerGroups[0]?.stickers.length > 0 ? userProfile.stickerGroups[0].stickers.map((sticker, i) => (
                  <div 
                    key={i}
                    onClick={() => {
                      const newMessage: Message = {
                        id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
                        role: 'user',
                        content: sticker,
                        type: 'sticker',
                        timestamp: Date.now()
                      };
                      setMessages(prev => {
                        const next = [...prev, newMessage];
                        return next;
                      });
                      setShowStickers(false);
                    }}
                    className="aspect-square bg-white rounded-lg p-1 active:bg-gray-100 cursor-pointer"
                  >
                    <img src={sticker} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                )) : (
                  <div className="col-span-4 flex flex-col items-center justify-center opacity-30 py-12">
                    <Smile size={48} />
                    <p className="text-sm mt-2">暂无表情包</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tools Panel */}
        <AnimatePresence>
          {showTools && (
            <motion.div 
              initial={{ height: 0 }}
              animate={{ height: 260 }}
              exit={{ height: 0 }}
              className="overflow-hidden bg-[#F7F7F7]"
            >
              <div className="grid grid-cols-4 gap-y-6 p-6">
                <div className="relative overflow-hidden cursor-pointer">
                  <ToolItem 
                    icon={<ImageIcon size={24} />} 
                    label="照片" 
                    color="bg-white" 
                    onClick={() => {
                      const input = document.getElementById('chat-image-input');
                      if (input) (input as HTMLInputElement).click();
                    }}
                  />
                  <input 
                    id="chat-image-input"
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                          const originalBase64 = reader.result as string;
                          const compressedBase64 = await compressImage(originalBase64);
                          
                          const text = inputValue.trim();
                          const newMessage: Message = {
                            id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 4),
                            role: 'user',
                            content: text,
                            image: compressedBase64,
                            type: 'image',
                            timestamp: Date.now()
                          };
                          setMessages(prev => {
                            const next = [...prev, newMessage];
                            return next;
                          });
                          setInputValue("");
                          setShowTools(false);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </div>
                <div onClick={() => {
                  const input = document.getElementById('chat-image-input');
                  if (input) (input as HTMLInputElement).click();
                }}>
                  <ToolItem icon={<Camera size={24} />} label="拍摄" color="bg-white" />
                </div>
                <div onClick={() => setShowCallSelect(true)}>
                  <ToolItem icon={<Video size={24} />} label="视频/语音" color="bg-white" />
                </div>
                <ToolItem icon={<MapPin size={24} />} label="位置" color="bg-white" />
                <div onClick={() => setShowRedPacketModal(true)}>
                  <ToolItem icon={<Heart size={24} />} label="红包" color="bg-white" />
                </div>
                <div onClick={() => setShowTransferModal(true)}>
                  <ToolItem icon={<Wallet size={24} />} label="转账" color="bg-white" />
                </div>
                <ToolItem icon={<FileText size={24} />} label="文件" color="bg-white" />
                <ToolItem icon={<UserPlus size={24} />} label="查手机" color="bg-white" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToolItem({ icon, label, color, onClick }: { icon: any, label: string, color: string, onClick?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 active:opacity-50 cursor-pointer" onClick={onClick}>
      <div className={'w-14 h-14 rounded-2xl flex items-center justify-center text-gray-700 shadow-sm ' + color}>
        {icon}
      </div>
      <span className="text-[11px] text-gray-500">{label}</span>
    </div>
  );
}

function MomentsView({ onBack, userProfile, onUpdateProfile, apiConfig, filter }: any) {
  const selectedPersona = userProfile.personaGroups.flatMap((g: any) => g.personas).find((p: any) => p.id === userProfile.selectedPersonaId);
  const aiPersona = apiConfig.characterGroups.flatMap((g: any) => g.personas).find((p: any) => p.id === apiConfig.selectedCharacterId);
  
  const [showPostModal, setShowPostModal] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image'>('image');
  const [postContent, setPostContent] = useState("");
  const [postImage, setPostImage] = useState<string | null>(null);
  const [moments, setMoments] = useState<any[]>(() => {
    const saved = localStorage.getItem('wechat_moments');
    const initialMoments = [
      { 
        id: '1', 
        avatar: aiPersona?.avatar || '芸', 
        name: aiPersona?.name || '小芸 💕', 
        content: '今天的天气真好，好想和你一起去公园散步 🌸', 
        time: '2小时前', 
        image: 'https://picsum.photos/seed/park/400/300',
        likes: 1,
        isLiked: false,
        comments: [],
        isAi: true,
        personaId: aiPersona?.id
      },
      { 
        id: '2', 
        avatar: '支', 
        name: '支付凭证', 
        content: '生活需要仪式感 ✨', 
        time: '5小时前',
        likes: 0,
        isLiked: false,
        comments: [],
        isAi: false
      }
    ];
    return saved ? JSON.parse(saved) : initialMoments;
  });

  const displayedMoments = filter?.aiOnly 
    ? moments.filter(m => m.isAi || m.personaId === aiPersona?.id) 
    : moments;

  useEffect(() => {
    localStorage.setItem('wechat_moments', JSON.stringify(moments));
  }, [moments]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProfile({ momentsCover: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const longPressTimer = useRef<any>(null);
  const handleCameraMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setPostType('text');
      setPostImage(null);
      setShowPostModal(true);
      longPressTimer.current = null;
    }, 800);
  };

  const handleCameraMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      setPostType('image');
      setShowPostModal(true);
    }
  };

  const handlePostImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAiReaction = async (momentId: string, content: string) => {
    if (!aiPersona) return;
    
    // AI Likes immediately
    setMoments(prev => prev.map(m => {
      if (m.id === momentId) {
        return { ...m, likes: (m.likes || 0) + 1, isLiked: true };
      }
      return m;
    }));

    // AI Comments immediately
    try {
      const aiComment = await getAiResponse([], '用户发了一条朋友圈：“' + content + '”。请根据你的人设给这条朋友圈写一条简短的评论（15字以内）。确保语气和内容符合你的人设。不要包含引号。', apiConfig, userProfile);
      
      setMoments(prev => {
        const updated = prev.map(m => {
          if (m.id === momentId) {
            const newComment = { 
              name: aiPersona.name, 
              content: aiComment, 
              isAi: true,
              timestamp: Date.now()
            };
            return { 
              ...m, 
              comments: [...(m.comments || []), newComment] 
            };
          }
          return m;
        });
        localStorage.setItem('wechat_moments', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      console.error("AI Moment Comment Error:", e);
    }
  };

  const handleAiReply = async (momentId: string, userComment: string, isReplyToAi: boolean) => {
    if (!aiPersona) return;
    
    try {
      const moment = moments.find(m => m.id === momentId);
      const context = moment ? '在朋友圈动态“' + moment.content + '”下，' : "";
      const prompt = isReplyToAi 
        ? context + '用户回复了你的评论：“' + userComment + '”。请根据你的人设回复他，保持互动感（15字以内）。不要包含引号。'
        : context + '用户在你的朋友圈下评论了：“' + userComment + '”。请根据你的人设回复他，保持互动感（15字以内）。不要包含引号。';
        
      const aiReply = await getAiResponse([], prompt, apiConfig, userProfile);
      
      setMoments(prev => prev.map(m => {
        if (m.id === momentId) {
          const newComment = { 
            name: aiPersona.name, 
            content: '回复我: ' + aiReply, 
            isAi: true 
          };
          return { 
            ...m, 
            comments: [...(m.comments || []), newComment] 
          };
        }
        return m;
      }));
    } catch (e) {
      console.error("AI Moment Reply Error:", e);
    }
  };

  const handlePublish = () => {
    if (!postContent.trim() && !postImage) return;
    const momentId = Date.now().toString();
    const newMoment = {
      id: momentId,
      avatar: selectedPersona?.avatar || '',
      name: selectedPersona?.name || '我',
      content: postContent,
      image: postImage,
      time: '刚刚',
      isMe: true,
      likes: 0,
      isLiked: false,
      comments: []
    };
    
    setMoments(prev => {
      const updated = [newMoment, ...prev];
      localStorage.setItem('wechat_moments', JSON.stringify(updated));
      return updated;
    });
    
    setPostContent("");
    setPostImage(null);
    setShowPostModal(false);

    // Trigger AI reaction with a tiny delay to ensure state consistency
    setTimeout(() => {
      handleAiReaction(momentId, postContent);
    }, 500);
  };

  const updateMoment = (id: string, updates: any) => {
    setMoments(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className={'h-22 ' + (filter?.aiOnly ? 'bg-[#EDEDED]' : 'bg-transparent') + ' absolute top-0 left-0 right-0 flex items-end px-4 pb-2 gap-3 z-10'}>
        <button onClick={onBack} className={'p-1 ' + (filter?.aiOnly ? 'text-black' : 'text-white drop-shadow-md')}>
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center">
          <span className={'text-[17px] font-semibold ' + (filter?.aiOnly ? 'text-black' : 'text-white drop-shadow-md')}>
            朋友圈
          </span>
        </div>
        {filter?.aiOnly ? (
          <div className="w-10"></div> /* Placeholder for centering */
        ) : (
          <button 
            onMouseDown={handleCameraMouseDown}
            onMouseUp={handleCameraMouseUp}
            onTouchStart={handleCameraMouseDown}
            onTouchEnd={handleCameraMouseUp}
            className="p-1 text-white drop-shadow-md active:opacity-50 transition-opacity"
          >
            <Camera size={24} />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Cover */}
        <div className="relative h-80 mb-12 group">
          <img 
            src={filter?.aiOnly ? (aiPersona?.avatar || 'https://picsum.photos/seed/cover/800/600') : (userProfile.momentsCover || 'https://picsum.photos/seed/cover/800/600')} 
            alt="Cover" 
            className="w-full h-full object-cover" 
            referrerPolicy="no-referrer" 
          />
          {!filter?.aiOnly && (
            <label className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <span className="text-white text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">更换封面</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
            </label>
          )}
          <div className="absolute -bottom-6 right-4 flex items-end gap-3">
            <span className="text-white font-bold text-lg mb-8 drop-shadow-md">{filter?.aiOnly ? aiPersona?.name : (selectedPersona?.name || "未设置")}</span>
            <div className="w-20 h-20 rounded-lg bg-white p-0.5 shadow-sm">
              <img 
                src={filter?.aiOnly ? aiPersona?.avatar : selectedPersona?.avatar} 
                alt="Avatar" 
                className="w-full h-full rounded-md object-cover" 
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </div>

        {/* Feed */}
        <div className="px-4 flex flex-col gap-8 pb-20">
          {displayedMoments.map(m => (
            <MomentItem 
              key={m.id}
              moment={m}
              onUpdate={(updates: any) => updateMoment(m.id, updates)}
              onUserComment={(comment: string, isReplyToAi: boolean) => {
                if (m.isAi || isReplyToAi) {
                  handleAiReply(m.id, comment, isReplyToAi);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Post Modal */}
      <AnimatePresence>
        {showPostModal && (
          <motion.div 
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="absolute inset-0 z-[2000] bg-white flex flex-col"
          >
            <div className="h-22 bg-[#F7F7F7] flex items-end px-4 pb-3 justify-between border-b border-gray-200">
              <button onClick={() => setShowPostModal(false)} className="text-[16px] text-black">取消</button>
              <button 
                onClick={handlePublish}
                disabled={!postContent.trim() && !postImage}
                className={'px-3 py-1 rounded text-[16px] font-medium ' + ((!postContent.trim() && !postImage) ? 'bg-gray-200 text-gray-400' : 'bg-[#07C160] text-white')}
              >
                发表
              </button>
            </div>
            <div className="flex-1 p-4 flex flex-col gap-4">
              <textarea 
                autoFocus
                placeholder="这一刻的想法..."
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                className="w-full h-32 text-[17px] outline-none resize-none"
              />
              {postType === 'image' && (
                <div className="flex flex-wrap gap-2">
                  {postImage ? (
                    <div className="relative w-24 h-24 rounded overflow-hidden group">
                      <img src={postImage} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      <button 
                        onClick={() => setPostImage(null)}
                        className="absolute top-0 right-0 bg-black/50 text-white p-1 rounded-bl"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center cursor-pointer active:bg-gray-200 transition-colors">
                      <Plus size={32} className="text-gray-400" />
                      <input type="file" accept="image/*" className="hidden" onChange={handlePostImageChange} />
                    </label>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MomentItem({ moment, onUpdate, onUserComment }: any) {
  const { avatar, name, content, time, image, isMe, likes = 0, isLiked = false, comments = [] } = moment;
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTo, setReplyTo] = useState<any>(null);

  const handleLike = () => {
    onUpdate({
      likes: isLiked ? likes - 1 : likes + 1,
      isLiked: !isLiked
    });
  };

  const handleAddComment = () => {
    if (commentText.trim()) {
      const isReplyToAi = replyTo?.isAi || (moment.isAi && !replyTo);
      const newComment = { 
        name: "我", 
        content: replyTo ? '回复' + replyTo.name + ': ' + commentText.trim() : commentText.trim(), 
        isMe: true,
        replyToAi: isReplyToAi
      };
      onUpdate({
        comments: [...comments, newComment]
      });
      onUserComment(commentText.trim(), isReplyToAi);
      setCommentText("");
      setShowCommentInput(false);
      setReplyTo(null);
    }
  };

  const handleCommentClick = (c: any) => {
    // Allow replying to any comment, including AI's own comments
    setReplyTo(c);
    setShowCommentInput(true);
  };

  return (
    <div className="flex gap-3">
      <div className={'w-10 h-10 rounded-lg shrink-0 flex items-center justify-center font-bold overflow-hidden ' + (isMe ? 'bg-blue-500 text-white' : 'bg-pink-100 text-pink-500')}>
        {avatar.startsWith('http') || avatar.startsWith('data:') ? (
          <img src={avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          avatar[0]
        )}
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <div className="text-[#576B95] font-bold text-[15px]">{name}</div>
        <div className="text-[15px] leading-relaxed">{content}</div>
        {image && (
          <div className="w-48 h-32 rounded-md overflow-hidden bg-gray-100">
            <img src={image} alt="Post" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}
        <div className="flex justify-between items-center mt-1">
          <span className="text-xs text-gray-400">{time}</span>
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className={'flex items-center gap-1 text-xs font-medium transition-colors ' + (isLiked ? 'text-red-500' : 'text-[#576B95]')}>
              <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
              {likes > 0 && likes}
            </button>
            <button className="text-[#576B95]" onClick={(e) => { e.stopPropagation(); setReplyTo(null); setShowCommentInput(!showCommentInput); }}>
              <MessageSquare size={14} />
            </button>
          </div>
        </div>

        {showCommentInput && (
          <div className="mt-2 flex gap-2">
            <input 
              autoFocus
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
              placeholder={replyTo ? '回复 ' + replyTo.name + '...' : "评论..."}
              className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs outline-none focus:border-green-500"
            />
            <button onClick={handleAddComment} className="text-xs text-white bg-green-500 px-2 py-1 rounded">发送</button>
          </div>
        )}

        {(likes > 0 || comments.length > 0) && (
          <div className="mt-2 bg-[#F7F7F7] rounded p-2 flex flex-col gap-1">
            {likes > 0 && (
              <div className="flex items-center gap-1 text-xs text-[#576B95] border-b border-gray-200 pb-1 mb-1">
                <Heart size={10} fill="currentColor" />
                <span>{isLiked ? "我" : "赞"}</span>
              </div>
            )}
            {comments.map((c: any, i: number) => (
              <div 
                key={i} 
                className="text-xs leading-tight active:bg-gray-200 rounded px-1 py-0.5 cursor-pointer"
                onClick={() => handleCommentClick(c)}
              >
                <span className="text-[#576B95] font-bold">{c.name}: </span>
                <span className="text-black">{c.content}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AiProfileView({ 
  onBack, 
  apiConfig, 
  onShowMoments, 
  isMuted, 
  onToggleMute, 
  isSticky, 
  onToggleSticky,
  isAutoReplyEnabled,
  onToggleAutoReply,
  ttsEnabled,
  onUpdateTtsEnabled,
  intenseReminder,
  onUpdateIntenseReminder,
  reminderFrequency,
  onUpdateReminderFrequency,
  intenseReminderRingtone,
  onUpdateIntenseReminderRingtone,
  onUpdateChatBackground,
  onClearHistory,
  onUpdateApiConfig,
  showToast
}: any) {
  const selectedAiPersona = apiConfig.characterGroups.flatMap((g: any) => g.personas).find((p: any) => p.id === apiConfig.selectedCharacterId);
  
  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateChatBackground(reader.result as string);
        onBack();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRingtoneUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateIntenseReminderRingtone(reader.result as string);
        showToast("自定义铃声已上传");
      };
      reader.readAsDataURL(file);
    }
  };

  const [showSaveConfirm, setShowSaveConfirm] = React.useState(false);

  const handleSaveSettings = () => {
    // In this implementation, state is already persisted via useEffect in App.tsx
    // But we satisfy the user request for an explicit save confirmation feedback.
    setShowSaveConfirm(false);
    showToast("设置已保存");
    onBack();
  };

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] relative">
      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">聊天详情</h1>
        </div>
        <button 
          onClick={() => setShowSaveConfirm(true)}
          className="text-[#07C160] font-medium px-2 py-1 active:opacity-50"
        >
          保存
        </button>
      </div>

      {/* Save Confirmation Overlay */}
      <AnimatePresence>
        {showSaveConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[5000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[280px] overflow-hidden shadow-xl"
            >
              <div className="p-6 text-center border-b border-gray-100">
                <h3 className="font-bold text-lg mb-2">保存设置</h3>
                <p className="text-sm text-gray-500">是否确认保存当前聊天设置？保存后内容将持久化存储。</p>
              </div>
              <div className="flex">
                <button 
                  onClick={() => setShowSaveConfirm(false)}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 active:bg-gray-50 border-r border-gray-100"
                >
                  取消
                </button>
                <button 
                  onClick={handleSaveSettings}
                  className="flex-1 py-3 text-sm font-bold text-[#07C160] active:bg-gray-50"
                >
                  确定
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 overflow-y-auto flex flex-col gap-4 py-4">
        <div className="bg-white p-4 flex flex-wrap gap-6 text-center">
          <div className="flex flex-col items-center gap-2" onClick={onShowMoments}>
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-pink-100 active:opacity-80 cursor-pointer">
              <img src={selectedAiPersona?.avatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <span className="text-[11px] text-gray-400 max-w-[60px] truncate">{selectedAiPersona?.name}</span>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300">
              <Plus size={24} />
            </div>
            <span className="text-[11px] text-gray-400">添加</span>
          </div>
        </div>

        <div className="bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer" onClick={onShowMoments}>
            <span>朋友圈</span>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
          <div 
            className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer"
            onClick={() => {
              onBack();
              setTimeout(() => {
                const searchBtn = document.querySelector('[data-search-trigger]');
                if (searchBtn) (searchBtn as HTMLElement).click();
              }, 100);
            }}
          >
            <span>查找聊天记录</span>
            <ChevronRight size={20} className="text-gray-300" />
          </div>
        </div>

        <div className="bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex flex-col">
              <span>AI 主动回复</span>
              <span className="text-[10px] text-gray-400">开启后 AI 将根据规则自动回复</span>
            </div>
            <button 
              onClick={onToggleAutoReply}
              className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (isAutoReplyEnabled ? 'bg-[#07C160]' : 'bg-gray-200')}
            >
              <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (isAutoReplyEnabled ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex flex-col">
              <span>语音输出 (TTS)</span>
              <span className="text-[10px] text-gray-400">开启后将自动朗读 AI 回复的文本消息</span>
            </div>
            <button 
              onClick={() => onUpdateTtsEnabled(!ttsEnabled)}
              className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (ttsEnabled ? 'bg-[#07C160]' : 'bg-gray-200')}
            >
              <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (ttsEnabled ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span>消息免打扰</span>
            <button 
              onClick={onToggleMute}
              className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (isMuted ? 'bg-[#07C160]' : 'bg-gray-200')}
            >
              <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (isMuted ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
            </button>
          </div>
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <span>置顶聊天</span>
            <button 
              onClick={onToggleSticky}
              className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (isSticky ? 'bg-[#07C160]' : 'bg-gray-200')}
            >
              <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (isSticky ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
            </button>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex flex-col">
                <span>强提醒</span>
                <span className="text-[10px] text-gray-400">开启后将关联消息铃声设置</span>
              </div>
              <button 
                onClick={() => onUpdateIntenseReminder(!intenseReminder)}
                className={'w-12 h-6 rounded-full relative transition-colors duration-200 ' + (intenseReminder ? 'bg-[#07C160]' : 'bg-gray-200')}
              >
                <div className={'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ' + (intenseReminder ? 'translate-x-6.5' : 'translate-x-0.5')}></div>
              </button>
            </div>
            {intenseReminder && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                className="px-4 pb-4 flex flex-col gap-3"
              >
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">提醒频率</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => onUpdateReminderFrequency('always')}
                      className={cn(
                        "flex-1 py-1.5 text-xs rounded-md border transition-colors",
                        reminderFrequency === 'always' ? "bg-[#07C160] text-white border-[#07C160]" : "bg-white text-gray-500 border-gray-200"
                      )}
                    >
                      每条都提示
                    </button>
                    <button 
                      onClick={() => onUpdateReminderFrequency('once')}
                      className={cn(
                        "flex-1 py-1.5 text-xs rounded-md border transition-colors",
                        reminderFrequency === 'once' ? "bg-[#07C160] text-white border-[#07C160]" : "bg-white text-gray-500 border-gray-200"
                      )}
                    >
                      只提示一条
                    </button>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-gray-400">自定义语音警示音 (MP3)</span>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-500 truncate cursor-pointer active:bg-gray-100">
                      {intenseReminderRingtone ? "已上传自定义音频" : "选择 MP3 文件..."}
                      <input type="file" accept="audio/mpeg" className="hidden" onChange={handleRingtoneUpload} />
                    </label>
                    {intenseReminderRingtone && (
                      <button 
                        onClick={() => onUpdateIntenseReminderRingtone("")}
                        className="p-2 text-red-500 active:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        <div className="bg-white flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex flex-col">
              <span>最小回复数量</span>
              <span className="text-[10px] text-gray-400">设定 AI 每次至少回复的消息条数</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  const val = Math.max(1, (apiConfig.minAiReplies || 1) - 1);
                  onUpdateApiConfig({ minAiReplies: val });
                }}
                className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:bg-gray-100 border border-gray-100"
              >
                <X size={14} className="rotate-45" />
              </button>
              <span className="text-sm font-medium w-4 text-center">{apiConfig.minAiReplies || 1}</span>
              <button 
                onClick={() => {
                  const val = Math.min(10, (apiConfig.minAiReplies || 1) + 1);
                  onUpdateApiConfig({ minAiReplies: val });
                }}
                className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center active:bg-gray-100 border border-gray-100"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>
          <label className="flex items-center justify-between p-4 border-b border-gray-100 active:bg-gray-50 cursor-pointer">
            <span>设置当前聊天背景</span>
            <div className="flex items-center gap-1">
              <span className="text-[14px] text-gray-400">支持JPG, PNG</span>
              <ChevronRight size={20} className="text-gray-300" />
            </div>
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleBackgroundUpload} />
          </label>
        </div>

        <div className="bg-white flex flex-col">
          <div className="p-4 text-red-500 text-center active:bg-gray-100 cursor-pointer font-medium" onClick={onClearHistory}>
            清空聊天记录
          </div>
        </div>

        <div className="bg-white flex flex-col">
          <div className="p-4 text-gray-500 text-center active:bg-gray-100 cursor-pointer">
            投诉
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ onBack, userProfile, onUpdateProfile }: any) {
  const selectedPersona = userProfile.personaGroups.flatMap((g: any) => g.personas).find((p: any) => p.id === userProfile.selectedPersonaId);

  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">个人信息</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-4">
        <div className="bg-white flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <span className="flex-1">头像</span>
            {selectedPersona?.avatar ? (
              <img src={selectedPersona.avatar} alt="Avatar" className="w-12 h-12 rounded-lg object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                <UserIcon size={24} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-3 p-4 border-b border-gray-100">
            <span className="w-20">名字</span>
            <span className="flex-1 text-right text-gray-500">{selectedPersona?.name || "未设置"}</span>
          </div>
          <div className="flex items-center gap-3 p-4 active:bg-gray-100 border-b border-gray-100">
            <span className="w-20">微信号</span>
            <input 
              value={userProfile.wechatId} 
              onChange={(e) => onUpdateProfile({ wechatId: e.target.value })}
              className="flex-1 outline-none text-right text-gray-500 bg-transparent"
            />
          </div>
          <div className="flex items-center gap-3 p-4 active:bg-gray-100">
            <span className="w-20">签名</span>
            <input 
              value={userProfile.signature} 
              onChange={(e) => onUpdateProfile({ signature: e.target.value })}
              className="flex-1 outline-none text-right text-gray-500 bg-transparent"
              placeholder="未填写"
            />
          </div>
        </div>
        <p className="px-4 text-xs text-gray-400">提示：头像和名字已移动至系统“设置” -{">"} “Apple ID”中，作为您的多重身份管理。</p>
      </div>
    </div>
  );
}

function ServiceView({ onBack, userProfile, onUpdateProfile }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBalance, setTempBalance] = useState(userProfile.balance.toString());

  const handleSaveBalance = () => {
    const val = parseFloat(tempBalance);
    if (!isNaN(val)) {
      onUpdateProfile({ balance: val });
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">服务</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="p-4 flex flex-col gap-4">
        <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-4 shadow-sm">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center text-white">
            <Wallet size={32} />
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-1">钱包余额</div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">¥</span>
                <input 
                  autoFocus
                  value={tempBalance}
                  onChange={(e) => setTempBalance(e.target.value)}
                  onBlur={handleSaveBalance}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveBalance()}
                  className="text-3xl font-bold w-32 outline-none border-b-2 border-green-500 text-center"
                />
              </div>
            ) : (
              <div 
                onClick={() => setIsEditing(true)}
                className="text-4xl font-bold cursor-pointer hover:opacity-70 transition-opacity"
              >
                ¥{userProfile.balance.toFixed(2)}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">点击金额可修改</p>
        </div>

        <div className="grid grid-cols-3 gap-0.5 bg-gray-200 rounded-xl overflow-hidden">
          {["收付款", "钱包", "借钱", "信用卡还款", "手机充值", "生活缴费"].map(item => (
            <div key={item} className="bg-white p-4 flex flex-col items-center gap-2 active:bg-gray-50">
              <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
              <span className="text-xs">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StickersView({ onBack, userProfile, onUpdateProfile }: any) {
  const [selectedGroupId, setSelectedGroupId] = useState(userProfile.stickerGroups[0]?.id || "");
  const [newStickerUrl, setNewStickerUrl] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const activeGroup = userProfile.stickerGroups.find((g: any) => g.id === selectedGroupId);

  const handleAddSticker = () => {
    if (newStickerUrl.trim() && selectedGroupId) {
      const newGroups = userProfile.stickerGroups.map((g: any) => 
        g.id === selectedGroupId ? { ...g, stickers: [...g.stickers, newStickerUrl.trim()] } : g
      );
      onUpdateProfile({ stickerGroups: newGroups });
      setNewStickerUrl("");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedGroupId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newGroups = userProfile.stickerGroups.map((g: any) => 
          g.id === selectedGroupId ? { ...g, stickers: [...g.stickers, reader.result as string] } : g
        );
        onUpdateProfile({ stickerGroups: newGroups });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddGroup = () => {
    if (newGroupName.trim()) {
      const newGroup = {
        id: Date.now().toString(),
        name: newGroupName.trim(),
        stickers: []
      };
      onUpdateProfile({ stickerGroups: [...userProfile.stickerGroups, newGroup] });
      setNewGroupName("");
      setIsAddingGroup(false);
      setSelectedGroupId(newGroup.id);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#EDEDED]">
      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">我的表情</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="bg-white border-b border-gray-100 flex overflow-x-auto shrink-0 no-scrollbar">
        {userProfile.stickerGroups.map((group: any) => (
          <button 
            key={group.id}
            onClick={() => setSelectedGroupId(group.id)}
            className={'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ' + (selectedGroupId === group.id ? 'text-[#07C160] border-b-2 border-[#07C160]' : 'text-gray-500')}
          >
            {group.name}
          </button>
        ))}
        <button onClick={() => setIsAddingGroup(true)} className="px-4 py-3 text-gray-400">
          <Plus size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {isAddingGroup && (
          <div className="bg-white p-4 rounded-xl flex flex-col gap-3 shadow-sm">
            <div className="text-sm font-medium">新建分组</div>
            <div className="flex gap-2">
              <input 
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="分组名称..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <button onClick={handleAddGroup} className="bg-[#07C160] text-white px-4 py-2 rounded-lg text-sm font-medium">确定</button>
              <button onClick={() => setIsAddingGroup(false)} className="text-gray-400 px-2">取消</button>
            </div>
          </div>
        )}

        <div className="bg-white p-4 rounded-xl flex flex-col gap-3 shadow-sm">
          <div className="text-sm font-medium">添加表情到「{activeGroup?.name}」</div>
          <div className="flex gap-2">
            <input 
              value={newStickerUrl}
              onChange={(e) => setNewStickerUrl(e.target.value)}
              placeholder="输入图片链接..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#07C160]"
            />
            <button onClick={handleAddSticker} className="bg-[#07C160] text-white px-4 py-2 rounded-lg text-sm font-medium active:bg-[#06AD56]">添加</button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {activeGroup?.stickers.map((sticker: string, i: number) => (
            <div key={i} className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-100 relative group">
              <img src={sticker} alt="Sticker" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              <button 
                onClick={() => {
                  const newGroups = userProfile.stickerGroups.map((g: any) => 
                    g.id === selectedGroupId ? { ...g, stickers: g.stickers.filter((_: any, idx: number) => idx !== i) } : g
                  );
                  onUpdateProfile({ stickerGroups: newGroups });
                }}
                className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={10} />
              </button>
            </div>
          ))}
          <label className="aspect-square bg-white rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 cursor-pointer active:bg-gray-50">
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <Plus size={32} />
          </label>
        </div>
      </div>
    </div>
  );
}

function PersonaManagerView({ onBack, apiConfig, onUpdateApiConfig, userProfile, onUpdateProfile }: any) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [swipePersonaId, setSwipePersonaId] = useState<string | null>(null);
  const [personaToDeleteState, setPersonaToDeleteState] = useState<any>(null);

  const allPersonas = apiConfig.characterGroups.flatMap((g: any) => g.personas);
  const editingPersona = allPersonas.find((p: any) => p.id === editingId);

  const updatePersona = (id: string, updates: any) => {
    const newGroups = apiConfig.characterGroups.map((group: any) => ({
      ...group,
      personas: group.personas.map((p: any) => p.id === id ? { ...p, ...updates } : p)
    }));
    onUpdateApiConfig({ characterGroups: newGroups });
  };

  const deletePersona = (id: string) => {
    console.log(`[WeChat Persona] Attempting to delete persona: ${id}`);
    
    if (allPersonas.length <= 1) {
      console.warn("[WeChat Persona] Delete blocked: Last persona.");
      alert("必须保留至少一个身份条目");
      return;
    }

    const persona = allPersonas.find((p: any) => p.id === id);
    if (!persona) {
      console.error("[WeChat Persona] Persona not found for deletion:", id);
      return;
    }

    const newGroups = apiConfig.characterGroups.map((group: any) => ({
      ...group,
      personas: group.personas.filter((p: any) => p.id !== id)
    }));
    onUpdateApiConfig({ characterGroups: newGroups });
    console.log(`[WeChat Persona] API characterGroups updated.`);

    const remainingPersonas = allPersonas.filter((p: any) => p.id !== id);
    if (apiConfig.selectedCharacterId === id) {
      if (remainingPersonas.length > 0) {
        onUpdateApiConfig({ characterGroups: newGroups, selectedCharacterId: remainingPersonas[0].id });
        console.log(`[WeChat Persona] Switching selectedCharacterId to: ${remainingPersonas[0].id}`);
      }
    }

    if (userProfile.selectedPersonaId === id) {
      if (remainingPersonas.length > 0) {
        onUpdateProfile({ selectedPersonaId: remainingPersonas[0].id });
        console.log(`[WeChat Persona] Switching userProfile.selectedPersonaId to: ${remainingPersonas[0].id}`);
      }
    }

    // [Cleanup associated data]
    localStorage.removeItem(`wechat_messages_${id}`);
    console.log(`[WeChat Persona] Local messages for ${id} cleaned.`);

    try {
      const savedMemories = localStorage.getItem("memory_center_data");
      if (savedMemories) {
        const memories = JSON.parse(savedMemories);
        const filteredMemories = memories.filter((m: any) => m.personaId !== id);
        localStorage.setItem("memory_center_data", JSON.stringify(filteredMemories));
        console.log(`[WeChat Persona] Memories for ${id} cleaned.`);
      }
    } catch (e) {
      console.error("[WeChat Persona] Failed to cleanup memories:", e);
    }

    try {
      const savedMoments = localStorage.getItem("wechat_moments");
      if (savedMoments) {
        const moments = JSON.parse(savedMoments);
        const filteredMoments = moments.filter((m: any) => m.personaId !== id);
        localStorage.setItem("wechat_moments", JSON.stringify(filteredMoments));
        console.log(`[WeChat Persona] Moments for ${id} cleaned.`);
      }
    } catch (e) {
      console.error("[WeChat Persona] Failed to cleanup moments:", e);
    }

    setSwipePersonaId(null);
    setPersonaToDeleteState(null);
  };

  const handleAvatarChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersona(id, { avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#EDEDED] relative">
      {/* Persona Delete Confirmation Modal */}
      <AnimatePresence>
        {personaToDeleteState && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-[280px] overflow-hidden shadow-xl"
            >
              <div className="p-6 text-center border-b border-gray-100">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">删除 AI 角色</h3>
                <p className="text-sm text-gray-500 text-left">确定要彻底删除角色 <span className="font-bold text-red-500">"{personaToDeleteState.name}"</span> 吗？此操作将清空所有相关通话和聊天记录，此操作不可撤销。</p>
              </div>
              <div className="flex">
                <button 
                  onClick={() => setPersonaToDeleteState(null)}
                  className="flex-1 py-3 text-sm font-medium text-gray-500 active:bg-gray-50 border-r border-gray-100"
                >
                  取消
                </button>
                <button 
                  onClick={() => deletePersona(personaToDeleteState.id)}
                  className="flex-1 py-3 text-sm font-bold text-red-500 active:bg-gray-50"
                >
                  确定删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-22 bg-[#EDEDED] flex items-end px-4 pb-2 gap-3 border-b border-gray-200 shrink-0">
        <button onClick={editingId ? () => setEditingId(null) : onBack} className="p-1 text-black">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">{editingId ? '编辑 AI 角色' : 'AI 角色管理'}</h1>
        </div>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-4">
        {!editingId ? (
          <div className="grid grid-cols-1 gap-3">
            <AnimatePresence initial={false}>
              {allPersonas.map((persona: any) => (
                <motion.div 
                  key={persona.id} 
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative overflow-hidden rounded-2xl shadow-sm"
                >
                  {/* Background Delete Button */}
                  <div className="absolute inset-y-0 right-0 w-20 flex">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setPersonaToDeleteState(persona);
                      }}
                      className="w-full h-full bg-red-500 text-white flex flex-col items-center justify-center gap-1 active:opacity-80 transition-opacity"
                    >
                      <Trash2 size={18} />
                      <span className="text-[10px] font-bold">删除</span>
                    </button>
                  </div>

                  <motion.div 
                    drag="x"
                    dragConstraints={{ left: -80, right: 0 }}
                    dragElastic={0.05}
                    animate={{ x: swipePersonaId === persona.id ? -80 : 0 }}
                    onDragStart={() => {
                        if (swipePersonaId !== persona.id) {
                            setSwipePersonaId(null);
                        }
                    }}
                    onDragEnd={(_, info) => {
                      if (info.offset.x < -30) {
                        setSwipePersonaId(persona.id);
                      } else if (info.offset.x > 30) {
                        setSwipePersonaId(null);
                      }
                    }}
                    onClick={() => {
                      if (swipePersonaId === persona.id) {
                        setSwipePersonaId(null);
                      } else {
                        setEditingId(persona.id);
                      }
                    }}
                    className="bg-white p-4 flex items-center gap-4 active:bg-gray-50 cursor-pointer relative z-10"
                  >
                    <img src={persona.avatar} className="w-14 h-14 rounded-xl object-cover shadow-sm pointer-events-none" alt="" referrerPolicy="no-referrer" />
                    <div className="flex-1 pointer-events-none">
                      <div className="font-bold text-lg">{persona.name}</div>
                      <div className="text-xs text-gray-400 line-clamp-1">{persona.personaDescription || persona.description || "未为人设添加详细描述"}</div>
                    </div>
                    <ChevronRight size={20} className="text-gray-300" />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div className="p-4 text-center text-xs text-gray-400 mt-4">
              提示：左滑角色卡片可删除，点击可完善人设。
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center gap-4 shadow-sm">
              <label className="relative cursor-pointer group">
                <img src={editingPersona?.avatar} className="w-24 h-24 rounded-2xl object-cover shadow-lg group-hover:opacity-80 transition-opacity" alt="" referrerPolicy="no-referrer" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={24} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarChange(editingId, e)} />
              </label>
              <span className="text-xs text-gray-400">点击更换头像</span>
            </div>

            <div className="bg-white rounded-2xl flex flex-col overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <span className="w-24 font-medium text-sm">姓名</span>
                <input 
                  value={editingPersona?.name || ""} 
                  onChange={(e) => updatePersona(editingId, { name: e.target.value })}
                  placeholder="请输入姓名"
                  className="flex-1 outline-none text-right text-sm text-gray-600 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <span className="w-24 font-medium text-sm">性别</span>
                <select 
                  value={editingPersona?.gender || ""} 
                  onChange={(e) => updatePersona(editingId, { gender: e.target.value })}
                  className="flex-1 outline-none text-right text-sm text-gray-600 bg-transparent appearance-none"
                >
                  <option value="">未选择</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                  <option value="other">其他</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <span className="w-24 font-medium text-sm">生日</span>
                <input 
                  type="date"
                  value={editingPersona?.birthday || ""} 
                  onChange={(e) => updatePersona(editingId, { birthday: e.target.value })}
                  className="flex-1 outline-none text-right text-sm text-gray-600 bg-transparent"
                />
              </div>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <span className="w-24 font-medium text-sm">国家/地区</span>
                <select 
                  value={editingPersona?.countryCode || "+86"} 
                  onChange={(e) => updatePersona(editingId, { countryCode: e.target.value })}
                  className="flex-1 outline-none text-right text-sm text-gray-600 bg-transparent appearance-none"
                >
                  <option value="+86">中国 (+86)</option>
                  <option value="+1">美国 (+1)</option>
                  <option value="+81">日本 (+81)</option>
                  <option value="+82">韩国 (+82)</option>
                  <option value="+44">英国 (+44)</option>
                  <option value="+7">俄罗斯 (+7)</option>
                  <option value="+49">德国 (+49)</option>
                  <option value="+33">法国 (+33)</option>
                </select>
              </div>
              <div className="flex items-center gap-3 p-4 border-b border-gray-100">
                <span className="w-24 font-medium text-sm">虚拟电话</span>
                <input 
                  value={editingPersona?.phoneNumber || ""} 
                  onChange={(e) => updatePersona(editingId, { phoneNumber: e.target.value })}
                  placeholder="请输入手机号"
                  className="flex-1 outline-none text-right text-sm text-gray-600 bg-transparent"
                />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="font-medium text-sm mb-3">人设描述</div>
              <textarea 
                value={editingPersona?.personaDescription || ""} 
                onChange={(e) => updatePersona(editingId, { personaDescription: e.target.value })}
                placeholder="在此输入 AI 角色的详细背景、性格特征、说话口吻等..."
                className="w-full h-40 outline-none text-sm text-gray-600 bg-gray-50 rounded-xl p-4 resize-none leading-relaxed"
              />
              <p className="mt-2 text-[10px] text-gray-400">详细的人设描述将有助于 AI 提供更符合角色的对话体验。</p>
            </div>
            
            <button 
              onClick={() => setEditingId(null)}
              className="w-full py-4 bg-[#07C160] text-white rounded-2xl font-bold shadow-lg active:scale-[0.98] transition-transform"
            >
              完成保存
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

