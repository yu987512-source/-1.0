import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Cpu, 
  User, 
  Bell, 
  Shield, 
  Moon, 
  Sun, 
  Wallpaper, 
  Info, 
  RefreshCw, 
  Save, 
  Trash2,
  Check,
  Plus,
  Palette,
  Lock,
  AppWindow,
  Code,
  Sparkles,
  Eye,
  EyeOff,
  Play,
  Volume2,
  Settings2,
  Loader2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ApiConfig, UserProfile, ApiPreset } from '../types';
import { getZodiacSign } from '../lib/utils';
import { synthesizeSpeech } from '../services/ttsService';

interface SettingsAppProps {
  onClose: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  apiConfig: ApiConfig;
  onUpdateApiConfig: (config: Partial<ApiConfig>) => void;
  userProfile: UserProfile;
  onUpdateUserProfile: (profile: Partial<UserProfile>) => void;
  notificationsEnabled: boolean;
  onToggleNotifications: () => void;
  lockScreenWallpaper: string;
  homeScreenWallpaper: string;
  onUpdateWallpaper: (type: 'lock' | 'home', url: string) => void;
  lockPassword?: string;
  onUpdateLockPassword: (pass: string) => void;
  appIcons: Record<string, string>;
  onUpdateAppIcon: (appId: string, icon: string) => void;
  customCss: string;
  onUpdateCustomCss: (css: string) => void;
}

export default function SettingsApp({
  onClose,
  theme,
  onToggleTheme,
  apiConfig,
  onUpdateApiConfig,
  userProfile,
  onUpdateUserProfile,
  notificationsEnabled,
  onToggleNotifications,
  lockScreenWallpaper,
  homeScreenWallpaper,
  onUpdateWallpaper,
  lockPassword,
  onUpdateLockPassword,
  appIcons,
  onUpdateAppIcon,
  customCss,
  onUpdateCustomCss
}: SettingsAppProps) {
  const THEME_PRESETS = [
    {
      id: 'gothic',
      name: '黑白哥特风',
      css: `/* 黑白哥特风 - 极致暗黑十字架 */
#phone-container { border-color: #000 !important; background: #000 !important; filter: grayscale(1) contrast(1.5); }
#phone-container * { border-radius: 2px !important; font-family: "Georgia", serif !important; }
.bg-white, .bg-[#95EC69], .bg-[#EDEDED], .bg-[#F2F2F7] { background-color: #000 !important; color: #fff !important; border: 1px solid #444 !important; }
.text-black, .text-gray-500, .text-gray-400 { color: #aaa !important; }
/* 十字架气泡实现 */
[class*="chat-bubble-shadow"] { 
  background: #111 !important; 
  border: 1px solid #666 !important;
  position: relative;
  min-width: 80px;
  /* 墓碑/十字外形 */
  clip-path: polygon(10% 0%, 90% 0%, 100% 10%, 100% 90%, 90% 100%, 10% 100%, 0% 90%, 0% 10%);
  padding: 15px 25px !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
[class*="chat-bubble-shadow"]::before {
  content: "";
  position: absolute;
  top: 0; left: 50%; bottom: 0; width: 1px;
  background: rgba(255,255,255,0.1);
  z-index: -1;
}
[class*="chat-bubble-shadow"]::after {
  content: "†";
  position: absolute;
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  color: #fff;
  opacity: 0.8;
}
/* 线条化处理 */
img, .w-14, .w-12, .w-10 { 
  filter: grayscale(1) contrast(200%) brightness(0.8) !important; 
  border: 1px solid #fff !important; 
  background: #000 !important;
}
#os-root { background: #0a0a0a !important; }
#home-indicator { background: #666 !important; }`
    },
    {
      id: 'fairy',
      name: '梦幻童话风',
      css: `/* 梦幻童话风 - 糖果云朵 */
#phone-container { border-color: #ffdae0 !important; background: linear-gradient(180deg, #fff5f7 0%, #f0f4ff 100%) !important; }
.rounded-xl, .w-14, .w-12, .rounded-lg { border-radius: 24px !important; }
.bg-[#007AFF], .bg-blue-500 { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%) !important; border: none !important; }
.bg-[#95EC69] { background: linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%) !important; }
.text-[#007AFF] { color: #ff6b81 !important; }
[class*="chat-bubble-shadow"] { border-radius: 20px 20px 0 20px !important; box-shadow: 0 4px 15px rgba(255,182,193,0.3) !important; border: 2px solid #fff !important; }
#os-root { background: #fff0f3 !important; }
@keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-5px); } 100% { transform: translateY(0px); } }
.w-14.h-14 { animation: float 3s ease-in-out infinite; }`
    },
    {
      id: 'jelly',
      name: '毛玻璃果冻风格',
      css: `/* 毛玻璃果冻风格 - 极简透明 */
#phone-container { border-color: rgba(255,255,255,0.4) !important; background: rgba(255,255,255,0.1) !important; }
.bg-white, .bg-[#EDEDED], .bg-[#F2F2F7] { 
  background: rgba(255, 255, 255, 0.4) !important; 
  backdrop-filter: blur(20px) saturate(180%) !important; 
  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
}
.bg-[#95EC69] { background: rgba(149, 236, 105, 0.6) !important; backdrop-filter: blur(10px) !important; border: 1px solid rgba(255,255,255,0.3) !important; }
.bg-[#007AFF] { background: rgba(0, 122, 255, 0.7) !important; box-shadow: 0 4px 15px rgba(0, 122, 255, 0.3) !important; }
.rounded-xl { border-radius: 22px !important; }
#os-root { background: linear-gradient(45deg, #ee9ca7 0%, #ffdde1 100%) !important; }`
    }
  ];

  const [view, setView] = useState<'main' | 'api' | 'appleid' | 'persona-edit' | 'notifications' | 'beautify' | 'tts'>('main');
  const [testTtsText, setTestTtsText] = useState("你好，我是你的 AI 助手。很高兴为你服务。");
  const [isTestingTts, setIsTestingTts] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [showBeautifyPreview, setShowBeautifyPreview] = useState(false);
  const [draftBeautify, setDraftBeautify] = useState<{
    lockScreenWallpaper: string;
    homeScreenWallpaper: string;
    lockPassword?: string;
    appIcons: Record<string, string>;
    customCss: string;
  }>({
    lockScreenWallpaper,
    homeScreenWallpaper,
    lockPassword,
    appIcons,
    customCss
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingPersonaId, setEditingPersonaId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<'user' | 'ai'>('user');
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showManualModel, setShowManualModel] = useState(false);
  const [isTestingModel, setIsTestingModel] = useState(false);
  const [manualModelId, setManualModelId] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingApiConfig, setPendingApiConfig] = useState<Partial<ApiConfig>>({
    apiKey: apiConfig.apiKey,
    baseUrl: apiConfig.baseUrl,
    minimaxApiKey: apiConfig.minimaxApiKey,
    minimaxUrl: apiConfig.minimaxUrl,
    minimaxGroupId: apiConfig.minimaxGroupId
  });
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [swipePersonaId, setSwipePersonaId] = useState<string | null>(null);

  // Sync pending config if apiConfig changes externally (e.g. from App)
  React.useEffect(() => {
    setPendingApiConfig({
      apiKey: apiConfig.apiKey,
      baseUrl: apiConfig.baseUrl,
      minimaxApiKey: apiConfig.minimaxApiKey,
      minimaxUrl: apiConfig.minimaxUrl,
      minimaxGroupId: apiConfig.minimaxGroupId
    });
  }, [apiConfig.apiKey, apiConfig.baseUrl, apiConfig.minimaxApiKey, apiConfig.minimaxUrl, apiConfig.minimaxGroupId]);

  const selectedUserPersona = userProfile.personaGroups.flatMap(g => g.personas).find(p => p.id === userProfile.selectedPersonaId);

  const fetchModels = async (providedConfig?: Partial<ApiConfig>) => {
    const targetApiKey = providedConfig?.apiKey || apiConfig.apiKey;
    const targetBaseUrl = providedConfig?.baseUrl || apiConfig.baseUrl;

    if (!targetApiKey) {
      setFetchError("请先输入 API Key");
      setTimeout(() => setFetchError(null), 3000);
      return;
    }

    setIsFetchingModels(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/models", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          apiKey: targetApiKey,
          baseUrl: targetBaseUrl
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.data)) {
          const ids = data.data.map((m: any) => m.id);
          const currentModels = Array.isArray(apiConfig.availableModels) ? apiConfig.availableModels : [];
          const newModels = Array.from(new Set([...ids, ...currentModels]));
          onUpdateApiConfig({ availableModels: newModels });
          
          // [Protocol: Automation Feedback]
          console.log(`[Action: Show_Model_List | Data: "${ids.join(", ")}"]`);
          setSuccessToast("API 设置成功，模型列表已更新");
          setTimeout(() => setSuccessToast(null), 3000);
        } else {
          setFetchError("返回数据格式不正确");
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const status = response.status;
        const msg = errorData.error?.message || "";
        
        if (status === 401 || status === 403) {
          setFetchError("API 密钥无效或已过期，请检查后重试");
        } else if (status === 402 || msg.includes("insufficient_quota") || msg.includes("balance")) {
          setFetchError("当前 API 账户余额不足，请充值后重试");
        } else if (status === 429) {
          setFetchError("请求过于频繁，请稍后再试 (Rate Limited)");
        } else if (status === 404) {
          setFetchError("接口地址 (Base URL) 错误，未找到模型拉取路径");
        } else {
          setFetchError(msg || `请求失败: ${status}`);
        }
      }
    } catch (error) {
      console.error("Fetch models error:", error);
      setFetchError("网络请求失败，请检查 Base URL 是否正确");
    } finally {
      setIsFetchingModels(false);
      setTimeout(() => setFetchError(null), 5000);
    }
  };

  const handleTestTts = async () => {
    if (!testTtsText.trim()) return;
    
    setIsTestingTts(true);
    setTtsError(null);
    
    try {
      const audioBuffer = await synthesizeSpeech(testTtsText, {
        ...apiConfig,
        minimaxApiKey: pendingApiConfig.minimaxApiKey,
        minimaxGroupId: pendingApiConfig.minimaxGroupId,
        minimaxUrl: pendingApiConfig.minimaxUrl
      } as ApiConfig);
      
      const blob = new Blob([audioBuffer], { type: 'audio/mp3' });
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      
      setSuccessToast("TTS 合成成功，正在播放");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (error: any) {
      console.error("TTS Test Error:", error);
      setTtsError(error.message || "未知错误");
      setErrorToast(error.message || "合成失败");
      setTimeout(() => setErrorToast(null), 5000);
    } finally {
      setIsTestingTts(false);
    }
  };

  const handleConfirmSave = () => {
    // [Protocol: Force Overwrite & Save]
    const trimmed = {
      apiKey: (pendingApiConfig.apiKey || "").trim(),
      baseUrl: (pendingApiConfig.baseUrl || "").trim(),
      minimaxApiKey: (pendingApiConfig.minimaxApiKey || "").trim(),
      minimaxUrl: (pendingApiConfig.minimaxUrl || "").trim(),
      minimaxGroupId: (pendingApiConfig.minimaxGroupId || "").trim()
    };
    onUpdateApiConfig(trimmed);
    
    // Immediate Model Fetch
    fetchModels(trimmed);
    
    setShowConfirmModal(false);
    setView('main');
  };

  const handleSaveBeautify = () => {
    onUpdateWallpaper('lock', draftBeautify.lockScreenWallpaper);
    onUpdateWallpaper('home', draftBeautify.homeScreenWallpaper);
    onUpdateLockPassword(draftBeautify.lockPassword || "");
    onUpdateCustomCss(draftBeautify.customCss);
    
    // For app icons, we need to update each one OR modify the parent to accept a full object
    // Since onUpdateAppIcon updates one by one, we'll sync them
    Object.entries(draftBeautify.appIcons).forEach(([id, icon]) => {
      onUpdateAppIcon(id, icon as string);
    });

    setSuccessToast("系统美化设置已成功应用");
    setTimeout(() => setSuccessToast(null), 3000);
    setView('main');
  };

  const handleDraftWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'lock' | 'home') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDraftBeautify(p => ({ ...p, [type === 'lock' ? 'lockScreenWallpaper' : 'homeScreenWallpaper']: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>, personaId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updatePersona(personaId, { avatar: reader.result as string }, 'user');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBack = () => {
    if (view === 'beautify') {
      // Check for changes (simplified check)
      const hasChanges = draftBeautify.lockScreenWallpaper !== lockScreenWallpaper ||
                        draftBeautify.homeScreenWallpaper !== homeScreenWallpaper ||
                        draftBeautify.lockPassword !== lockPassword ||
                        draftBeautify.customCss !== customCss ||
                        JSON.stringify(draftBeautify.appIcons) !== JSON.stringify(appIcons);
      
      if (hasChanges) {
        if (confirm("您有未保存的修改，确定要返回吗？")) {
          setView('main');
        }
        return;
      }
    }
    
    if (view === 'api' && (
      pendingApiConfig.apiKey !== apiConfig.apiKey || 
      pendingApiConfig.baseUrl !== apiConfig.baseUrl ||
      pendingApiConfig.minimaxApiKey !== apiConfig.minimaxApiKey ||
      pendingApiConfig.minimaxUrl !== apiConfig.minimaxUrl ||
      pendingApiConfig.minimaxGroupId !== apiConfig.minimaxGroupId
    )) {
      setShowConfirmModal(true);
      return;
    }
    
    if (view === 'persona-edit') {
      setView('appleid');
    }
    else if (view !== 'main') setView('main');
    else onClose();
  };

  const handleWallpaperChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'lock' | 'home') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateWallpaper(type, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updatePersona = (id: string, data: any, type: 'user' | 'ai') => {
    if (type === 'user') {
      const newGroups = userProfile.personaGroups.map(group => ({
        ...group,
        personas: group.personas.map(p => p.id === id ? { ...p, ...data } : p)
      }));
      onUpdateUserProfile({ personaGroups: newGroups });
    } else {
      const newGroups = apiConfig.characterGroups.map(group => ({
        ...group,
        personas: group.personas.map(p => p.id === id ? { ...p, ...data } : p)
      }));
      onUpdateApiConfig({ characterGroups: newGroups });
    }
  };

  const addPersona = (groupId: string, type: 'user' | 'ai') => {
    const newPersona = {
      id: `persona-${Date.now()}`,
      name: "新角色",
      avatar: "https://picsum.photos/seed/new/200/200",
      description: "角色描述..."
    };

    if (type === 'user') {
      const newGroups = userProfile.personaGroups.map(g => g.id === groupId ? { ...g, personas: [...g.personas, newPersona] } : g);
      onUpdateUserProfile({ personaGroups: newGroups });
    } else {
      const newGroups = apiConfig.characterGroups.map(g => g.id === groupId ? { ...g, personas: [...g.personas, newPersona] } : g);
      onUpdateApiConfig({ characterGroups: newGroups });
    }
  };

  const [personaToDelete, setPersonaToDelete] = useState<{ id: string, type: 'user' | 'ai', name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const deletePersona = (id: string, type: 'user' | 'ai') => {
    console.log(`[Persona Management] Attempting to delete persona: ID=${id}, Type=${type}`);
    
    if (type === 'user') {
      const allUserPersonas = userProfile.personaGroups.flatMap(g => g.personas);
      if (allUserPersonas.length <= 1) {
        console.warn("[Persona Management] Delete blocked: At least one user persona must remain.");
        alert("至少需要保留一个身份");
        return;
      }
      
      const newGroups = userProfile.personaGroups.map(group => ({
        ...group,
        personas: group.personas.filter(p => p.id !== id)
      }));

      onUpdateUserProfile({ personaGroups: newGroups });
      console.log(`[Persona Management] User persona deleted. Remaining count: ${allUserPersonas.length - 1}`);
      
      if (userProfile.selectedPersonaId === id) {
        const remaining = newGroups.flatMap(g => g.personas);
        if (remaining.length > 0) {
          onUpdateUserProfile({ selectedPersonaId: remaining[0].id });
        }
      }
    } else {
      const allAiPersonas = apiConfig.characterGroups.flatMap(g => g.personas);
      if (allAiPersonas.length <= 1) {
        console.warn("[Persona Management] Delete blocked: At least one AI persona must remain.");
        alert("至少需要保留一个 AI 角色");
        return;
      }

      const newGroups = apiConfig.characterGroups.map(group => ({
        ...group,
        personas: group.personas.filter(p => p.id !== id)
      }));
      
      onUpdateApiConfig({ characterGroups: newGroups });
      console.log(`[Persona Management] AI persona deleted. Remaining count: ${allAiPersonas.length - 1}`);

      if (apiConfig.selectedCharacterId === id) {
        const remaining = newGroups.flatMap(g => g.personas);
        if (remaining.length > 0) {
          onUpdateApiConfig({ selectedCharacterId: remaining[0].id });
        }
      }
    }

    // [Cleanup associated data]
    localStorage.removeItem(`wechat_messages_${id}`);
    console.log(`[Persona Management] Cleanup: Local messages for ${id} removed.`);

    try {
      const savedMemories = localStorage.getItem('memory_center_data');
      if (savedMemories) {
        const memories = JSON.parse(savedMemories);
        const filteredMemories = memories.filter((m: any) => m.personaId !== id);
        localStorage.setItem('memory_center_data', JSON.stringify(filteredMemories));
        console.log(`[Persona Management] Cleanup: Memories for ${id} filtered.`);
      }
    } catch (e) {
      console.error("[Persona Management] Failed to cleanup memories:", e);
    }

    try {
      const savedMoments = localStorage.getItem('wechat_moments');
      if (savedMoments) {
        const moments = JSON.parse(savedMoments);
        const filteredMoments = moments.filter((m: any) => m.personaId !== id);
        localStorage.setItem('wechat_moments', JSON.stringify(filteredMoments));
        console.log(`[Persona Management] Cleanup: Moments for ${id} filtered.`);
      }
    } catch (e) {
      console.error("[Persona Management] Failed to cleanup moments:", e);
    }

    setSwipePersonaId(null);
    setPersonaToDelete(null);
  };

  const savePreset = () => {
    if (!presetName.trim()) return;
    const newPreset: ApiPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      apiKey: apiConfig.apiKey,
      baseUrl: apiConfig.baseUrl,
      model: apiConfig.model,
      temperature: apiConfig.temperature
    };
    onUpdateApiConfig({ presets: [...apiConfig.presets, newPreset] });
    setPresetName("");
    setShowPresetInput(false);
  };

  const handleTestModel = async () => {
    if (!apiConfig.apiKey) {
      setSuccessToast("错误: 请先配置 API Key");
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }

    setIsTestingModel(true);
    try {
      const resp = await fetch("/api/test-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: apiConfig })
      });
      const data = await resp.json();
      if (resp.ok) {
        alert(`✅ 链接正常！\n\n测试模型: ${apiConfig.model}\n响应内容: "${data.text}"`);
      } else {
        alert(`❌ 测试失败\n\n原因: ${data.error || "未知网络错误"}`);
      }
    } catch (e: any) {
      alert(`❌ 网络请求失败\n\n详情: ${e.message}`);
    } finally {
      setIsTestingModel(false);
    }
  };

  const applyPreset = (preset: ApiPreset) => {
    onUpdateApiConfig({
      apiKey: preset.apiKey,
      baseUrl: preset.baseUrl,
      model: preset.model,
      temperature: preset.temperature
    });
  };

  const deletePreset = (id: string) => {
    onUpdateApiConfig({ presets: apiConfig.presets.filter(p => p.id !== id) });
  };

  return (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-[#F2F2F7]' : 'bg-black text-white'}`}>
      {/* Persona Delete Confirmation Modal */}
      <AnimatePresence>
        {personaToDelete && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[6000] bg-black/40 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`rounded-2xl w-full max-w-[280px] overflow-hidden shadow-2xl ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E] text-white'}`}
            >
              <div className="p-6 text-center border-b border-gray-100/10">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trash2 size={24} />
                </div>
                <h3 className="font-bold text-lg mb-2">删除身份</h3>
                <p className="text-sm opacity-60">确定要删除身份 <span className="font-bold text-red-500">"{personaToDelete.name}"</span> 吗？此操作将清空所有相关的通话、聊天记录和记忆，且不可恢复。</p>
              </div>
              <div className="flex">
                <button 
                  onClick={() => setPersonaToDelete(null)}
                  className="flex-1 py-3 text-sm font-medium opacity-60 active:bg-gray-500/10 border-r border-gray-100/10"
                >
                  取消
                </button>
                <button 
                  onClick={() => deletePersona(personaToDelete.id, personaToDelete.type)}
                  className="flex-1 py-3 text-sm font-bold text-red-500 active:bg-red-500/10"
                >
                  确定删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="h-22 flex items-end px-4 pb-2 gap-3 shrink-0">
        <button onClick={handleBack} className="p-1 text-[#007AFF] flex items-center">
          <ChevronLeft size={28} />
          {view !== 'main' && <span className="text-[17px]">设置</span>}
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">
            {view === 'api' ? 'AI 模型设置' : 
             view === 'wallpaper' ? '墙纸' : 
             view === 'appleid' ? 'Apple ID' :
             view === 'persona-edit' ? '编辑人设' :
             view === 'tts' ? '语音与 TTS' :
             view === 'notifications' ? '通知' :
             view === 'beautify' ? '系统美化' : '设置'}
          </h1>
        </div>
        <div className="w-12 flex justify-end">
          {view === 'beautify' && (
            <button onClick={handleSaveBeautify} className="text-[#007AFF] font-semibold text-[17px] pr-1 active:opacity-50">
              储存
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-2 flex flex-col gap-6">
        {view === 'main' ? (
          <>
            <h2 className="text-3xl font-bold px-1">设置</h2>
            
            {/* Apple ID Section */}
            <div 
              onClick={() => setView('appleid')}
              className={`rounded-xl p-3 flex items-center gap-3 cursor-pointer active:opacity-70 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-200">
                {selectedUserPersona?.avatar ? (
                  <img src={selectedUserPersona.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-blue-400 to-purple-500">
                    <User size={32} />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-lg">{selectedUserPersona?.name || "未设置"}</div>
                <div className="text-xs opacity-60">Apple ID、iCloud+、媒体与购买项目</div>
              </div>
              <ChevronRight size={20} className="opacity-30" />
            </div>

            {/* AI Settings Section */}
            <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div onClick={() => setView('api')}>
                <SettingItem 
                  icon={<Cpu size={20} />} 
                  label="AI 模型设置" 
                  value={apiConfig.model}
                  color="bg-[#8E8E93]" 
                  theme={theme} 
                />
              </div>
              <div className={`h-[1px] ml-12 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
              <div onClick={() => setView('tts')}>
                <SettingItem 
                  icon={<Volume2 size={20} />} 
                  label="语音与 TTS 设置" 
                  color="bg-[#34C759]" 
                  theme={theme} 
                  last
                />
              </div>
            </div>

            {/* General Settings */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">通用</h3>
              <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                <div onClick={() => setView('notifications')}>
                  <SettingItem icon={<Bell size={20} />} label="通知" color="bg-[#C7C7CC]" theme={theme} />
                </div>
                <SettingItem icon={<Shield size={20} />} label="隐私与安全" color="bg-[#D1D1D6]" theme={theme} />
                <div className={`h-[1px] ml-12 ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                <div onClick={onToggleTheme} className="flex items-center gap-3 p-3 cursor-pointer active:opacity-50">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center text-white bg-gray-600">
                    {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                  </div>
                  <span className="flex-1">{theme === 'light' ? '深色模式' : '浅色模式'}</span>
                  <div className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${theme === 'dark' ? 'left-6.5' : 'left-0.5'}`}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Other Settings */}
            <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div onClick={() => setView('beautify')}>
                <SettingItem icon={<Palette size={20} />} label="系统美化" color="bg-[#AF52DE]" theme={theme} />
              </div>
              <SettingItem icon={<Info size={20} />} label="关于本机" color="bg-[#F2F2F7]" theme={theme} last />
            </div>
          </>
        ) : view === 'appleid' ? (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 shadow-sm">
                {selectedUserPersona?.avatar ? (
                  <img src={selectedUserPersona.avatar} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white bg-gradient-to-br from-blue-400 to-purple-500">
                    <User size={48} />
                  </div>
                )}
              </div>
              <div className="text-center">
                <h2 className="text-2xl font-bold">{selectedUserPersona?.name || "未设置"}</h2>
                <p className="text-xs opacity-50">Apple ID</p>
              </div>
            </div>

            {userProfile.personaGroups.map(group => (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-xs font-medium uppercase opacity-50">{group.name}</h3>
                  <button onClick={() => addPersona(group.id, 'user')} className="text-[#007AFF] text-xs active:opacity-50">添加</button>
                </div>
                <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                  <AnimatePresence initial={false}>
                    {group.personas.map((persona, idx) => {
                      return (
                        <motion.div 
                          key={persona.id} 
                          layout
                          initial={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="relative overflow-hidden"
                        >
                          {/* Background Delete Button */}
                          <div className="absolute inset-y-0 right-0 w-20 flex z-0">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setPersonaToDelete({ id: persona.id, type: 'user', name: persona.name });
                                setSwipePersonaId(null);
                              }}
                              className="w-full h-full bg-red-500 text-white flex flex-col items-center justify-center gap-1 active:opacity-80"
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
                                onUpdateUserProfile({ selectedPersonaId: persona.id });
                              }
                            }}
                            className={`flex items-center gap-3 p-3 cursor-pointer relative z-10 transition-colors ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'} ${userProfile.selectedPersonaId === persona.id ? (theme === 'light' ? '!bg-blue-50/60' : '!bg-[#2C2C2E]') : ''}`}
                          >
                            <img src={persona.avatar} alt={persona.name} className="w-10 h-10 rounded-full object-cover shrink-0 pointer-events-none" referrerPolicy="no-referrer" />
                            <div className="flex-1 pointer-events-none">
                              <div className="font-medium">{persona.name}</div>
                              <div className="text-xs opacity-50 truncate max-w-[200px]">{persona.description}</div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPersonaId(persona.id);
                                setEditingType('user');
                                setView('persona-edit');
                                setSwipePersonaId(null);
                              }}
                              className="p-2 text-[#007AFF] active:opacity-50 relative z-20"
                            >
                              编辑
                            </button>
                            {idx < group.personas.length - 1 && (
                              <div className={`absolute bottom-0 left-16 right-0 h-[1px] ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                            )}
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            ))}
          </div>
        ) : view === 'persona-edit' ? (
          <div className="flex flex-col gap-6">
            {(() => {
              const allPersonas = editingType === 'user' 
                ? userProfile.personaGroups.flatMap(g => g.personas)
                : apiConfig.characterGroups.flatMap(g => g.personas);
              const persona = allPersonas.find(p => p.id === editingPersonaId);
              if (!persona) return null;
              return (
                <div className={`rounded-xl p-4 flex flex-col gap-5 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold opacity-60">名称</label>
                    <input 
                      value={persona.name} 
                      onChange={(e) => updatePersona(persona.id, { name: e.target.value }, editingType)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold opacity-60">国家/地区</label>
                      <select 
                        value={persona.countryCode || "+86"} 
                        onChange={(e) => updatePersona(persona.id, { countryCode: e.target.value }, editingType)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
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
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold opacity-60">电话号码</label>
                      <input 
                        type="tel"
                        value={persona.phoneNumber || ""} 
                        onChange={(e) => updatePersona(persona.id, { phoneNumber: e.target.value }, editingType)}
                        placeholder="138 **** ****"
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold opacity-60">性别</label>
                      <select 
                        value={persona.gender || "other"} 
                        onChange={(e) => updatePersona(persona.id, { gender: e.target.value }, editingType)}
                        className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                      >
                        <option value="male">男</option>
                        <option value="female">女</option>
                        <option value="other">其他</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold opacity-60">生日</label>
                      <input 
                        type="date"
                        value={persona.birthday || ""} 
                        onChange={(e) => updatePersona(persona.id, { birthday: e.target.value }, editingType)}
                        className={`w-full px-3 py-2 rounded-lg border text-[13px] outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold opacity-60">星座 (自动读取)</label>
                    <div className={`w-full px-3 py-2 rounded-lg border text-sm opacity-60 ${theme === 'light' ? 'bg-gray-100 border-gray-200' : 'bg-gray-900 border-gray-800'}`}>
                      {persona.birthday ? getZodiacSign(persona.birthday) : "请选择生日"}
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-semibold opacity-60">头像</label>
                      <label className="text-[#007AFF] text-xs cursor-pointer active:opacity-50">
                        上传图片
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleAvatarUpload(e, persona.id)}
                        />
                      </label>
                    </div>
                    <input 
                      value={persona.avatar} 
                      onChange={(e) => updatePersona(persona.id, { avatar: e.target.value }, editingType)}
                      placeholder="输入图片 URL..."
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold opacity-60">一句话简介 (Description)</label>
                    <input 
                      value={persona.description || ""} 
                      onChange={(e) => updatePersona(persona.id, { description: e.target.value }, editingType)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                      placeholder="对外显示的简单介绍..."
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold opacity-60">核心人设 (Persona Prompt)</label>
                    <textarea 
                      value={persona.personaDescription || ""} 
                      onChange={(e) => updatePersona(persona.id, { personaDescription: e.target.value }, editingType)}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none h-32 resize-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                      placeholder="详细描述这个身份的性格、背景、说话习惯等，用于 AI 驱动对话..."
                    />
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100/10">
                    <button 
                      onClick={() => setPersonaToDelete({ id: persona.id, type: editingType, name: persona.name })}
                      className="w-full py-3 rounded-xl bg-red-500/10 text-red-500 font-bold text-sm flex items-center justify-center gap-2 active:bg-red-500/20"
                    >
                      <Trash2 size={18} />
                      删除此身份
                    </button>
                    <p className="text-[10px] text-center opacity-40 mt-2">删除身份将无法找回对话记忆与历史记录</p>
                  </div>
                </div>
              );
            })()}
          </div>
        ) : view === 'api' ? (
          <div className="flex flex-col gap-6">
            <div className={`rounded-xl overflow-hidden p-4 flex flex-col gap-4 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-60">API Key</label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={pendingApiConfig.apiKey || ""} 
                    onChange={(e) => setPendingApiConfig(prev => ({ ...prev, apiKey: e.target.value.trim() }))}
                    placeholder="sk-..."
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 active:opacity-100"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-60">Base URL</label>
                <input 
                  type="text" 
                  value={pendingApiConfig.baseUrl || ""} 
                  onChange={(e) => setPendingApiConfig(prev => ({ ...prev, baseUrl: e.target.value.trim() }))}
                  placeholder="https://api.openai.com/v1"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                />
              </div>

              <div className="flex justify-center mt-2">
                <button 
                  onClick={() => setShowConfirmModal(true)}
                  disabled={!pendingApiConfig.apiKey}
                  className="w-full py-2.5 bg-[#007AFF] text-white rounded-xl text-[15px] font-semibold active:opacity-80 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  保存并应用配置
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold opacity-60">选择模型</label>
                  <div className="flex gap-2">
                    <button onClick={() => setShowManualModel(!showManualModel)} className="text-[#007AFF] text-xs active:opacity-50">
                      {showManualModel ? "取消" : "手动添加"}
                    </button>
                    <button 
                      onClick={() => fetchModels(pendingApiConfig)} 
                      disabled={isFetchingModels}
                      className="text-[#007AFF] text-xs flex items-center gap-1 active:opacity-50 disabled:opacity-30"
                    >
                      <RefreshCw size={12} className={isFetchingModels ? 'animate-spin' : ''} />
                      {isFetchingModels ? "拉取中..." : "拉取模型"}
                    </button>
                  </div>
                </div>
                
                {fetchError && (
                  <div className="text-[10px] text-red-500 bg-red-50 p-1.5 rounded border border-red-100 mb-1">
                    {fetchError}
                  </div>
                )}

                {showManualModel ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={manualModelId} 
                      onChange={(e) => setManualModelId(e.target.value)}
                      placeholder="输入模型 ID (如: gpt-4o)"
                      className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                    />
                    <button 
                      onClick={() => {
                        if (manualModelId.trim()) {
                          const currentModels = Array.isArray(apiConfig.availableModels) ? apiConfig.availableModels : [];
                          const newModels = Array.from(new Set([manualModelId.trim(), ...currentModels]));
                          onUpdateApiConfig({ 
                            availableModels: newModels,
                            model: manualModelId.trim() 
                          });
                          setManualModelId("");
                          setShowManualModel(false);
                        }
                      }}
                      className="px-3 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium active:opacity-80"
                    >
                      添加
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <select 
                      value={apiConfig.model} 
                      onChange={(e) => onUpdateApiConfig({ model: e.target.value })}
                      className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors appearance-none ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                    >
                      {/* Ensure current model is ALWAYS in the list and handle non-iterable apiConfig.availableModels */}
                      {Array.from(new Set([apiConfig.model, ...(Array.isArray(apiConfig.availableModels) ? apiConfig.availableModels : [])])).filter(Boolean).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">
                      <ChevronRight size={14} className="rotate-90" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold opacity-60">模型温度 (Temperature)</label>
                  <span className="text-xs font-mono text-[#007AFF]">{apiConfig.temperature.toFixed(1)}</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="2" step="0.1" 
                  value={apiConfig.temperature}
                  onChange={(e) => onUpdateApiConfig({ temperature: parseFloat(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
                />
                <div className="flex justify-between text-[10px] opacity-40">
                  <span>精确 (0.0)</span>
                  <span>平衡 (1.0)</span>
                  <span>创意 (2.0)</span>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold opacity-60">最小回复数量 (Min Replies)</label>
                  <span className="text-xs font-mono text-[#007AFF]">{apiConfig.minAiReplies || 1} 条</span>
                </div>
                <input 
                  type="range" 
                  min="1" max="10" step="1" 
                  value={apiConfig.minAiReplies || 1}
                  onChange={(e) => onUpdateApiConfig({ minAiReplies: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#007AFF]"
                />
                <div className="flex justify-between text-[10px] opacity-40">
                  <span>单条回复 (1)</span>
                  <span>多条连发 (10)</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button 
                  onClick={handleTestModel}
                  disabled={isTestingModel}
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all active:scale-[0.98] ${isTestingModel ? 'opacity-50' : 'active:opacity-80'} ${theme === 'light' ? 'bg-[#F2F2F7] text-[#007AFF]' : 'bg-[#2C2C2E] text-[#0A84FF]'}`}
                >
                  {isTestingModel ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
                  {isTestingModel ? "测试中..." : "测试当前模型配置"}
                </button>
                <p className="text-[10px] opacity-40 text-center">点击发送一段简单的测试消息，验证 API 密钥与模型是否可用。</p>
              </div>
            </div>

            <p className="text-xs opacity-40 px-1">配置完成后，返回微信即可使用选定的模型进行对话。</p>

            {/* Presets Section */}
            <div className="flex flex-col gap-4 mt-4">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-medium uppercase opacity-50">模型预设</h3>
                <button 
                  onClick={() => setShowPresetInput(!showPresetInput)} 
                  className="text-[#007AFF] text-xs flex items-center gap-1 active:opacity-50"
                >
                  <Save size={14} />
                  保存当前为预设
                </button>
              </div>

              {showPresetInput && (
                <div className={`rounded-xl p-3 flex flex-col gap-3 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                  <input 
                    type="text" 
                    value={presetName} 
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="预设名称 (如: 办公、创意...)"
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-black border-gray-800'}`}
                  />
                  <div className="flex gap-2">
                    <button onClick={savePreset} className="flex-1 py-2 bg-[#007AFF] text-white rounded-lg text-sm font-medium active:opacity-80">确认保存</button>
                    <button onClick={() => setShowPresetInput(false)} className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm font-medium active:opacity-80">取消</button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {apiConfig.presets.length === 0 ? (
                  <div className={`rounded-xl p-8 text-center opacity-30 text-sm ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>暂无预设</div>
                ) : (
                  <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                    {apiConfig.presets.map((preset, idx) => {
                      const isActive = apiConfig.apiKey === preset.apiKey && apiConfig.baseUrl === preset.baseUrl && apiConfig.model === preset.model && apiConfig.temperature === preset.temperature;
                      return (
                        <div key={preset.id} className={`flex items-center gap-3 p-3 active:bg-gray-100/50 relative ${isActive ? 'bg-blue-50/50' : ''}`}>
                          <div onClick={() => applyPreset(preset)} className="flex-1 cursor-pointer">
                            <div className="font-medium text-sm flex items-center gap-2">
                              {preset.name}
                              {isActive && <Check size={14} className="text-[#007AFF]" />}
                            </div>
                            <div className="text-[10px] opacity-40 truncate max-w-[200px]">{preset.model} · {preset.baseUrl}</div>
                          </div>
                          <button onClick={() => deletePreset(preset.id)} className="p-2 text-red-500 active:opacity-50">
                            <Trash2 size={16} />
                          </button>
                          {idx < apiConfig.presets.length - 1 && (
                            <div className={`absolute bottom-0 left-3 right-0 h-[1px] ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : view === 'notifications' ? (
          <div className="flex flex-col gap-6">
            <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div onClick={onToggleNotifications} className="flex items-center gap-3 p-3 cursor-pointer active:opacity-50">
                <div className="w-7 h-7 rounded-md flex items-center justify-center text-white bg-red-500">
                  <Bell size={18} />
                </div>
                <span className="flex-1">消息弹窗</span>
                <div className={`w-12 h-6 rounded-full relative transition-colors ${notificationsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${notificationsEnabled ? 'left-6.5' : 'left-0.5'}`}></div>
                </div>
              </div>
            </div>
            <p className="text-xs opacity-40 px-1">开启后，当 AI 发送消息时，弹窗将出现在锁屏以及主页上。</p>
          </div>
        ) : view === 'beautify' ? (
          <div className="flex flex-col gap-8 pb-10">
            {/* Wallpapers */}
            <div className="flex flex-col gap-4">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">壁纸设置</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className={`rounded-xl p-3 flex flex-col items-center gap-2 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                  <div className="w-full aspect-[9/16] rounded-lg overflow-hidden border border-black/5">
                    <img src={draftBeautify.lockScreenWallpaper} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <label className="text-[11px] text-[#007AFF] font-medium cursor-pointer active:opacity-50">
                    更换锁屏壁纸
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftWallpaperChange(e, 'lock')} />
                  </label>
                </div>
                <div className={`rounded-xl p-3 flex flex-col items-center gap-2 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                  <div className="w-full aspect-[9/16] rounded-lg overflow-hidden border border-black/5">
                    <img src={draftBeautify.homeScreenWallpaper} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <label className="text-[11px] text-[#007AFF] font-medium cursor-pointer active:opacity-50">
                    更换主页壁纸
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDraftWallpaperChange(e, 'home')} />
                  </label>
                </div>
              </div>
            </div>

            {/* Lock Password */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">安全</h3>
              <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                <div className="p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="opacity-50" />
                    <span className="text-[15px] flex-1">锁屏密码</span>
                  </div>
                  <input 
                    type="password"
                    value={draftBeautify.lockPassword || ""}
                    onChange={(e) => setDraftBeautify(p => ({ ...p, lockPassword: e.target.value }))}
                    placeholder="设置 4-6 位数字密码"
                    maxLength={6}
                    className={`w-full px-3 py-2 rounded-lg border text-sm outline-none ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-black border-gray-800'}`}
                  />
                  <p className="text-[10px] opacity-40">留空则不启用密码锁。</p>
                </div>
              </div>
            </div>

            {/* App Icons */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">应用图标</h3>
              <div className={`rounded-xl overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                {['wechat', 'music', 'memory-center', 'weibo', 'settings'].map((appId, idx, arr) => (
                  <div key={appId} className="relative p-3 flex items-center gap-3">
                    <AppWindow size={16} className="opacity-50" />
                    <span className="text-[15px] flex-1 capitalize">{appId.replace('-', ' ')}</span>
                    <label className="text-[11px] text-[#007AFF] font-medium cursor-pointer active:opacity-50">
                      更换
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setDraftBeautify(p => ({ ...p, appIcons: { ...p.appIcons, [appId]: reader.result as string } }));
                            reader.readAsDataURL(file);
                          }
                        }} 
                      />
                    </label>
                    {draftBeautify.appIcons[appId] && (
                      <button onClick={() => setDraftBeautify(p => ({ ...p, appIcons: { ...p.appIcons, [appId]: "" } }))} className="text-[11px] text-red-500 font-medium">重置</button>
                    )}
                    {idx < arr.length - 1 && (
                      <div className={`absolute bottom-0 left-12 right-0 h-[1px] ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Theme (CSS) */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">预设主题</h3>
              <div className="grid grid-cols-3 gap-2">
                {THEME_PRESETS.map(t => (
                  <button
                    key={t.id}
                    onClick={() => {
                      if (confirm(`是否应用"${t.name}"预设？这将覆盖您当前的美化配置。`)) {
                        let updates: any = { customCss: t.css };
                        if (t.id === 'gothic') {
                          updates.lockScreenWallpaper = "https://images.unsplash.com/photo-1509248961158-e54f6934749c?auto=format&fit=crop&w=1000&q=80";
                          updates.homeScreenWallpaper = "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80";
                        } else if (t.id === 'fairy') {
                          updates.lockScreenWallpaper = "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=1000&q=80";
                          updates.homeScreenWallpaper = "https://images.unsplash.com/photo-1518133910546-b6c2fb7d79e3?auto=format&fit=crop&w=1000&q=80";
                        } else if (t.id === 'jelly') {
                          updates.lockScreenWallpaper = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=1000&q=80";
                          updates.homeScreenWallpaper = "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80";
                        }
                        setDraftBeautify(p => ({ ...p, ...updates }));
                      }
                    }}
                    className={`p-2 rounded-xl text-[10px] font-bold text-center border transition-all active:scale-95 ${
                      draftBeautify.customCss === t.css 
                        ? 'bg-[#007AFF] text-white border-[#007AFF]' 
                        : (theme === 'light' ? 'bg-white border-gray-100' : 'bg-black border-gray-800')
                    }`}
                  >
                    <Sparkles size={14} className="mx-auto mb-1" />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-medium uppercase opacity-50 px-1">自定义主题 (CSS)</h3>
              <div className={`rounded-xl overflow-hidden p-3 flex flex-col gap-3 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                <div className="flex items-center gap-2">
                  <Code size={16} className="opacity-50" />
                  <span className="text-[15px]">CSS 注入</span>
                </div>
                <textarea 
                  value={draftBeautify.customCss}
                  onChange={(e) => setDraftBeautify(p => ({ ...p, customCss: e.target.value }))}
                  placeholder="/* 输入自定义 CSS 代码，例如：\n#phone-container { border-color: pink; } */"
                  className={`w-full px-3 py-2 rounded-lg border text-[12px] font-mono outline-none h-32 resize-none ${theme === 'light' ? 'bg-gray-50 border-gray-100' : 'bg-black border-gray-800'}`}
                />
                <p className="text-[10px] opacity-40">警告：错误的代码可能会导致界面显示异常。</p>
              </div>
            </div>

            {/* Preview Action */}
            <div className={`p-4 rounded-xl flex items-center justify-between ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div className="flex items-center gap-3">
                <Palette className="text-[#AF52DE]" size={24} />
                <span className="font-semibold">效果预览</span>
              </div>
              <button 
                onClick={() => setShowBeautifyPreview(true)}
                className="px-4 py-1.5 bg-[#007AFF] text-white rounded-full text-xs font-bold active:opacity-80"
              >
                查看效果
              </button>
            </div>
          </div>
        ) : view === 'tts' ? (
          <div className="flex flex-col gap-6">
            <div className={`rounded-xl overflow-hidden p-4 flex flex-col gap-4 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                   <Sparkles size={18} className="text-purple-500" />
                   MiniMax 语音配置
                </h3>
                <label className="text-xs font-semibold opacity-60">API Key</label>
                <div className="relative">
                  <input 
                    type={showApiKey ? "text" : "password"} 
                    value={pendingApiConfig.minimaxApiKey || ""} 
                    onChange={(e) => setPendingApiConfig(prev => ({ ...prev, minimaxApiKey: e.target.value.trim() }))}
                    placeholder="MiniMax API Key"
                    className={`w-full pl-3 pr-10 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                  />
                  <button 
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30 active:opacity-100"
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-60">Group ID</label>
                <input 
                  type="text" 
                  value={pendingApiConfig.minimaxGroupId || ""} 
                  onChange={(e) => setPendingApiConfig(prev => ({ ...prev, minimaxGroupId: e.target.value.trim() }))}
                  placeholder="MiniMax Group ID"
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold opacity-60">API URL (可选)</label>
                <input 
                  type="text" 
                  value={pendingApiConfig.minimaxUrl || ""} 
                  onChange={(e) => setPendingApiConfig(prev => ({ ...prev, minimaxUrl: e.target.value.trim() }))}
                  placeholder="https://api.minimax.chat/v1/..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                />
                <p className="text-[10px] opacity-40">如果不填写，将使用默认的 MiniMax T2A V2 接口地址。</p>
              </div>

              <div className="flex justify-center mt-2">
                <button 
                  onClick={handleConfirmSave}
                  className="w-full py-2.5 bg-[#007AFF] text-white rounded-xl text-[15px] font-semibold active:opacity-80 disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  保存并应用配置
                </button>
              </div>
            </div>

            <div className={`rounded-xl overflow-hidden p-4 flex flex-col gap-4 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
              <div className="flex flex-col gap-1.5">
                <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
                   <Volume2 size={18} className="text-blue-500" />
                   语音合成测试 (TTS Test)
                </h3>
                <textarea 
                  value={testTtsText} 
                  onChange={(e) => setTestTtsText(e.target.value)}
                  placeholder="输入测试文本..."
                  className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors h-20 resize-none ${theme === 'light' ? 'bg-gray-50 border-gray-200 focus:border-[#007AFF]' : 'bg-black border-gray-800 focus:border-[#007AFF]'}`}
                />
                {ttsError && (
                  <p className="text-xs text-red-500 bg-red-100/10 p-2 rounded border border-red-500/20">{ttsError}</p>
                )}
              </div>

              <button 
                onClick={handleTestTts}
                disabled={isTestingTts || !pendingApiConfig.minimaxApiKey || !pendingApiConfig.minimaxGroupId}
                className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-[13px] font-medium rounded-lg active:opacity-70 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isTestingTts ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
                开始合成并试听
              </button>
            </div>

            <div className={`rounded-xl overflow-hidden p-4 flex flex-col gap-4 ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}>
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px]">启用语音 TTS</span>
                  <span className="text-[11px] opacity-40">开启后微信聊天将自动触发语音朗读 (需配置 MiniMax)</span>
                </div>
                <div 
                  onClick={() => onUpdateApiConfig({ ...apiConfig, ttsEnabled: !apiConfig.ttsEnabled } as any)}
                  className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${apiConfig.ttsEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${apiConfig.ttsEnabled ? 'left-6.5' : 'left-0.5'}`}></div>
                </div>
              </div>

            <p className="text-xs opacity-40 px-1">MiniMax 提供高质量的拟人语音合成服务。配置完成后，您可以在角色管理中为每个角色指定不同的语音 ID。</p>
          </div>
        ) : null}
      </div>

      {/* Preview Overlay */}
      <AnimatePresence>
        {showBeautifyPreview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[2500] bg-black/90 flex flex-col items-center justify-center p-6"
          >
            {/* [Protocol: Draft Style Injection] */}
            <style>{draftBeautify.customCss.replace(/#phone-container/g, '.preview-phone-mock')}</style>
            
            <div className="text-white mb-6 text-center">
              <h3 className="text-xl font-bold mb-1">预览效果</h3>
              <p className="text-xs opacity-60">滑动查看锁屏与桌面</p>
            </div>
            
            <div className="flex gap-4 w-full h-[400px] overflow-x-auto snap-x no-scrollbar pb-4">
              {/* Lock Screen Preview */}
              <div className="preview-phone-mock min-w-full h-full snap-center rounded-3xl overflow-hidden shadow-2xl relative border-4 border-gray-800">
                <img src={draftBeautify.lockScreenWallpaper} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-x-0 top-12 flex flex-col items-center text-white drop-shadow-lg">
                  <div className="text-4xl font-light">19:30</div>
                  <div className="text-xs opacity-80">4月26日 星期日</div>
                </div>
                {draftBeautify.lockPassword && (
                  <div className="absolute bottom-10 inset-x-0 flex flex-col items-center gap-2">
                    <Lock size={16} className="text-white" />
                    <span className="text-[10px] text-white bg-black/20 px-2 py-0.5 rounded-full">已启用密码锁</span>
                  </div>
                )}
                <div className="absolute inset-0 border-[10px] border-black rounded-3xl pointer-events-none opacity-20"></div>
              </div>

              {/* Home Screen Preview */}
              <div className="preview-phone-mock min-w-full h-full snap-center rounded-3xl overflow-hidden shadow-2xl relative border-4 border-gray-800">
                <img src={draftBeautify.homeScreenWallpaper} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 p-4 grid grid-cols-4 grid-rows-6 gap-3">
                  {['wechat', 'music', 'memory-center', 'weibo', 'settings'].map((id) => (
                    <div key={id} className="flex flex-col items-center gap-1">
                      <div className="w-10 h-10 rounded-lg bg-gray-200 overflow-hidden shadow-md">
                        {draftBeautify.appIcons[id] ? (
                          <img src={draftBeautify.appIcons[id]} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-gray-400 to-gray-600"></div>
                        )}
                      </div>
                      <div className="w-8 h-1.5 bg-black/30 rounded-full"></div>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 border-[10px] border-black rounded-3xl pointer-events-none opacity-20"></div>
              </div>
            </div>

            <button 
              onClick={() => setShowBeautifyPreview(false)}
              className="mt-8 px-8 py-3 bg-white text-black rounded-full font-bold active:opacity-80"
            >
              返回编辑
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* [Protocol: Modal Confirmation] */}
      {showConfirmModal && (
        <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-[280px] rounded-2xl p-6 shadow-2xl ${theme === 'light' ? 'bg-white' : 'bg-[#1C1C1E]'}`}
          >
            <h3 className="text-center font-semibold text-[17px] mb-2">保存配置</h3>
            <p className="text-center text-[13px] opacity-60 mb-6 leading-relaxed">
              [Modal: 是否确认保存并应用此配置？]
            </p>
            <div className="flex flex-col gap-2">
              <button 
                onClick={handleConfirmSave}
                className="w-full py-3 bg-[#007AFF] text-white rounded-xl text-[15px] font-semibold active:opacity-80"
              >
                确认应用
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className={`w-full py-3 rounded-xl text-[15px] font-medium active:opacity-50 ${theme === 'light' ? 'text-gray-400' : 'text-gray-500'}`}
              >
                取消
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000]">
          <div className="bg-black/80 text-white text-xs px-4 py-2 rounded-full backdrop-blur-md border border-white/10 text-center">
            [Toast: {successToast}]
          </div>
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000]">
          <div className="bg-red-600 text-white text-xs px-4 py-2 rounded-full shadow-xl border border-red-400/30 text-center min-w-[200px]">
            {errorToast}
          </div>
        </div>
      )}
    </div>
  );
}

function SettingItem({ icon, label, value, color, theme, last }: { icon: any, label: string, value?: string, color: string, theme: string, last?: boolean }) {
  return (
    <div className="relative flex items-center gap-3 p-3 cursor-pointer active:opacity-50">
      <div className={`w-7 h-7 rounded-md flex items-center justify-center text-white ${color}`}>
        {icon}
      </div>
      <div className="flex-1 flex flex-col">
        <span className="text-[15px]">{label}</span>
        {value && <span className="text-[11px] opacity-40 truncate max-w-[200px]">{value}</span>}
      </div>
      <ChevronRight size={20} className="opacity-30" />
      {!last && (
        <div className={`absolute bottom-0 left-12 right-0 h-[1px] ${theme === 'light' ? 'bg-gray-100' : 'bg-gray-800'}`}></div>
      )}
    </div>
  );
}
