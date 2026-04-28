/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppState, Message } from './types';
import StatusBar from './components/StatusBar';
import LockScreen from './components/LockScreen';
import HomeScreen from './components/HomeScreen';
import WeChatApp from './components/WeChatApp';
import SettingsApp from './components/SettingsApp';
import MusicApp from './components/MusicApp';
import MemoryCenterApp from './components/MemoryCenterApp';
import WeiboApp from './components/WeiboApp';
import PhoneApp from './components/PhoneApp';
import VideoCall from './components/VideoCall';
import AudioCall from './components/AudioCall';
import Notification from './components/Notification';

export default function App() {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('ai_os_state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // --- State Migration & Default Enforcement ---
        // Ensure new properties introduced in updates are populated
        if (parsed.apiConfig && !parsed.apiConfig.availableModels) {
          parsed.apiConfig.availableModels = ["gemini-3-flash-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash-exp", "gpt-4o", "gpt-3.5-turbo", "claude-3-5-sonnet-20240620"];
        }

        if (parsed.userProfile && !parsed.userProfile.virtualContacts) {
          parsed.userProfile.virtualContacts = [];
        }
        if (!parsed.callHistory) {
          parsed.callHistory = [];
        }

        return {
          ...parsed,
          intenseReminder: localStorage.getItem('chat_strongReminder') === 'true',
          isLocked: true,
          currentApp: null,
          activeNotification: null,
          isVideoCallActive: false,
          isAudioCallActive: false,
          forwardToAiContent: null
        };
      } catch (e) {
        console.error("Failed to parse saved state", e);
      }
    }
    return {
      isLocked: true,
      currentApp: null,
      battery: 85,
      time: "09:41",
      date: "4月14日 星期二",
      theme: 'light',
      lockScreenWallpaper: "linear-gradient(to bottom, #ffffff 0%, #FFD6E0 100%)", 
      homeScreenWallpaper: "linear-gradient(to bottom, #ffffff 0%, #FFD6E0 100%)", 
      notificationsEnabled: true,
      activeNotification: null,
      isVideoCallActive: false,
      isAudioCallActive: false,
      videoCallData: null,
      lastCallResult: null,
      forwardToAiContent: null,
      callHistory: [],
      ttsEnabled: false,
      intenseReminder: localStorage.getItem('chat_strongReminder') === 'true',
      reminderFrequency: 'always',
      intenseReminderRingtone: "",
      chatBackground: null,
      persistentContext: "",
      lockPassword: "",
      appIcons: {},
      customCss: "",
      apiConfig: {
        apiKey: "",
        baseUrl: "", // Empty for Gemini default
        model: "gemini-3-flash-preview",
        temperature: 0.7,
        minAiReplies: 1,
        selectedCharacterId: "char-1",
        characterGroups: [
          {
            id: "group-ai-1",
            name: "默认角色",
            personas: [
              {
                id: "char-1",
                name: "小云 💕",
                avatar: "https://picsum.photos/seed/xiaoyun/200/200",
                description: "你是一个专业的APP测试助手，名字叫小云。你专业、简洁、高效，说话时无任何压迫感。你的任务是辅助用户测试系统功能并提供反馈。请以专业且平和的语气进行回复。",
                gender: "female",
                birthday: "2002-10-24",
                phoneNumber: "+86 177 0000 8888",
                personaDescription: "虚拟助手小云，性格极致温柔体贴，具有极高的情商和专业素养。说话带着治愈感，致力于为用户提供最舒适的交互体验。"
              },
              {
                id: "char-2",
                name: "严厉导师",
                avatar: "https://picsum.photos/seed/mentor/200/200",
                description: "你是一位刻薄且高度严厉的学术监督。你对知识要求极高，说话刻薄、直接，不苟言笑。你的目标是高压监督用户完成学术论文，你无法容忍任何形式的偷懒或重复废话。如果用户逃避学习，直接教训并催促进度。",
                gender: "male",
                birthday: "1975-05-12",
                phoneNumber: "+86 10 6275 1234",
                personaDescription: "资深学术教授，对逻辑严密性有近乎偏执的要求。性格冷漠刻薄，认为懒惰是人类最大的原罪。虽然毒舌，但每一句教训都精准扎心，旨在鞭策学生达到学术巅峰。"
              }
            ]
          }
        ],
        presets: [],
        availableModels: ["gemini-3-flash-preview", "gemini-3.1-pro-preview", "gemini-2.0-flash-exp", "gpt-4o", "gpt-3.5-turbo", "claude-3-5-sonnet-20240620"]
      },
      userProfile: {
        selectedPersonaId: "user-1",
        personaGroups: [
          {
            id: "group-user-1",
            name: "我的身份",
            personas: [
              { id: "user-1", name: "第二月亮", avatar: "https://picsum.photos/seed/user1/200/200" },
              { id: "user-2", name: "旅行者", avatar: "https://picsum.photos/seed/user2/200/200" }
            ]
          }
        ],
        wechatId: "moon_002",
        signature: "生活明朗，万物可爱。",
        momentsCover: "https://picsum.photos/seed/moments/800/600",
        balance: 8888.88,
        stickerGroups: [
          { id: "1", name: "默认表情", stickers: [] }
        ],
        virtualContacts: [
          {
            id: "vcon-1",
            name: "未知业务员",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sales",
            phoneNumber: "400 888 1234",
            callCount: 0
          }
        ]
      }
    };
  });

  useEffect(() => {
    localStorage.setItem('ai_os_state', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const days = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
      const month = now.getMonth() + 1;
      const date = now.getDate();
      const day = days[now.getDay()];
      
      setState(prev => ({
        ...prev,
        time: `${hours}:${minutes}`,
        date: `${month}月${date}日 ${day}`
      }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleUnlock = () => {
    setState(prev => ({ ...prev, isLocked: false }));
  };

  const handleOpenApp = (appId: string) => {
    setState(prev => ({ ...prev, currentApp: appId }));
  };

  const handleCloseApp = () => {
    setState(prev => ({ ...prev, currentApp: null }));
  };

  const toggleTheme = () => {
    setState(prev => ({ ...prev, theme: prev.theme === 'light' ? 'dark' : 'light' }));
  };

  const updateApiConfig = (config: Partial<AppState['apiConfig']>) => {
    setState(prev => ({ ...prev, apiConfig: { ...prev.apiConfig, ...config } }));
  };

  const updateUserProfile = (profile: Partial<AppState['userProfile']>) => {
    setState(prev => ({ ...prev, userProfile: { ...prev.userProfile, ...profile } }));
  };

  const showNotification = (message: Message) => {
    if (state.notificationsEnabled && state.currentApp !== 'wechat') {
      setState(prev => ({ ...prev, activeNotification: message }));
      setTimeout(() => {
        setState(prev => ({ ...prev, activeNotification: null }));
      }, 5000);
    }
  };

  const onUpdateIntenseReminder = (val: boolean) => {
    setState(p => ({ ...p, intenseReminder: val }));
    localStorage.setItem('chat_strongReminder', String(val));
  };

  return (
    <div id="os-root" className="flex justify-center items-center h-full w-full phone-screen">
      {state.customCss && <style>{state.customCss}</style>}
      <div id="phone-container" className={`w-[375px] h-[740px] bg-black rounded-[50px] border-[10px] relative overflow-hidden shadow-2xl shrink-0 transition-colors duration-500 ${state.theme === 'light' ? 'border-[#E5E5E5]' : 'border-[#333]'}`}>
        {/* Notch */}
        <div id="notch" className="absolute top-0 left-1/2 -translate-x-1/2 w-[120px] h-[28px] bg-black rounded-b-[18px] z-[1001]"></div>
        
        {/* Home Indicator */}
        <div 
          id="home-indicator"
          onClick={handleCloseApp}
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[130px] h-1 bg-white/30 rounded-full z-[1001] cursor-pointer hover:bg-white/50 transition-colors"
        ></div>

        <StatusBar 
          time={state.time} 
          battery={state.battery} 
          isDark={!state.isLocked && state.currentApp !== null && state.theme === 'light'} 
        />

        <AnimatePresence>
          {state.activeNotification && (
            <Notification 
              notification={state.activeNotification}
              onClose={() => setState(p => ({ ...p, activeNotification: null }))}
              onClick={() => {
                setState(p => ({ ...p, activeNotification: null, isLocked: false, currentApp: 'wechat' }));
              }}
              theme={state.theme}
              apiConfig={state.apiConfig}
            />
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {state.isLocked ? (
            <motion.div
              key="lock"
              initial={{ opacity: 1 }}
              exit={{ y: -740, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="absolute inset-0"
            >
              <LockScreen 
                onUnlock={handleUnlock} 
                wallpaper={state.lockScreenWallpaper}
                time={state.time}
                date={state.date}
                password={state.lockPassword}
              />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute inset-0"
            >
              <HomeScreen 
                onOpenApp={handleOpenApp} 
                wallpaper={state.homeScreenWallpaper} 
                customIcons={state.appIcons}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.currentApp === 'wechat' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <WeChatApp 
                onClose={handleCloseApp}
                apiConfig={state.apiConfig}
                userProfile={state.userProfile}
                onUpdateProfile={updateUserProfile}
                onNewAssistantMessage={showNotification}
                ttsEnabled={state.ttsEnabled}
                onUpdateTtsEnabled={(val) => setState(p => ({ ...p, ttsEnabled: val }))}
                intenseReminder={state.intenseReminder}
                onUpdateIntenseReminder={onUpdateIntenseReminder}
                reminderFrequency={state.reminderFrequency || 'always'}
                onUpdateReminderFrequency={(val) => setState(p => ({ ...p, reminderFrequency: val }))}
                intenseReminderRingtone={state.intenseReminderRingtone || ""}
                onUpdateIntenseReminderRingtone={(val) => setState(p => ({ ...p, intenseReminderRingtone: val }))}
                chatBackground={state.chatBackground}
                onUpdateChatBackground={(url) => setState(p => ({ ...p, chatBackground: url }))}
                persistentContext={state.persistentContext}
                onUpdatePersistentContext={(val) => setState(p => ({ ...p, persistentContext: val }))}
                onStartVideoCall={(data) => setState(p => ({ ...p, isVideoCallActive: true, videoCallData: data }))}
                onStartAudioCall={(data) => setState(p => ({ ...p, isAudioCallActive: true, videoCallData: data }))}
                lastCallResult={state.lastCallResult}
                onClearCallResult={() => setState(p => ({ ...p, lastCallResult: null }))}
                onUpdateApiConfig={updateApiConfig}
                forwardContent={state.forwardToAiContent}
                onClearForward={() => setState(p => ({ ...p, forwardToAiContent: null }))}
              />
            </motion.div>
          )}

          {state.currentApp === 'settings' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <SettingsApp 
                onClose={handleCloseApp}
                theme={state.theme}
                onToggleTheme={toggleTheme}
                apiConfig={state.apiConfig}
                onUpdateApiConfig={updateApiConfig}
                userProfile={state.userProfile}
                onUpdateUserProfile={updateUserProfile}
                notificationsEnabled={state.notificationsEnabled}
                onToggleNotifications={() => setState(p => ({ ...p, notificationsEnabled: !p.notificationsEnabled }))}
                lockScreenWallpaper={state.lockScreenWallpaper}
                homeScreenWallpaper={state.homeScreenWallpaper}
                onUpdateWallpaper={(type, url) => setState(p => ({ ...p, [type === 'lock' ? 'lockScreenWallpaper' : 'homeScreenWallpaper']: url }))}
                lockPassword={state.lockPassword}
                onUpdateLockPassword={(pass) => setState(p => ({ ...p, lockPassword: pass }))}
                appIcons={state.appIcons || {}}
                onUpdateAppIcon={(appId, icon) => setState(p => ({ ...p, appIcons: { ...p.appIcons, [appId]: icon } }))}
                customCss={state.customCss || ""}
                onUpdateCustomCss={(css) => setState(p => ({ ...p, customCss: css }))}
              />
            </motion.div>
          )}

          {state.currentApp === 'music' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <MusicApp onClose={handleCloseApp} theme={state.theme} />
            </motion.div>
          )}

          {state.currentApp === 'memory-center' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <MemoryCenterApp onClose={handleCloseApp} theme={state.theme} />
            </motion.div>
          )}

          {state.currentApp === 'weibo' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <WeiboApp 
                onClose={handleCloseApp} 
                theme={state.theme} 
                apiConfig={state.apiConfig}
                onForwardToAi={(content, targetPersonaId) => {
                  setState(p => ({ 
                    ...p, 
                    forwardToAiContent: content, 
                    currentApp: 'wechat',
                    apiConfig: { ...p.apiConfig, selectedCharacterId: targetPersonaId || p.apiConfig.selectedCharacterId }
                  }));
                }}
              />
            </motion.div>
          )}

          {state.currentApp === 'phone' && (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-[100]"
            >
              <PhoneApp 
                onClose={handleCloseApp}
                theme={state.theme}
                callHistory={state.callHistory}
                userProfile={state.userProfile}
                apiConfig={state.apiConfig}
                onUpdateProfile={updateUserProfile}
                onStartAudioCall={(data) => setState(p => ({ ...p, isAudioCallActive: true, videoCallData: data }))}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.isVideoCallActive && (
            <VideoCall 
              data={state.videoCallData} 
              onEnd={(duration) => {
                const callEntry = {
                  contactId: state.videoCallData?.personaId || 'unknown',
                  type: 'outgoing' as const,
                  timestamp: Date.now(),
                  duration
                };
                setState(p => ({ 
                  ...p, 
                  isVideoCallActive: false, 
                  lastCallResult: { mode: 'video', duration, timestamp: Date.now() },
                  callHistory: [...p.callHistory, callEntry]
                }));
              }}
              theme={state.theme}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {state.isAudioCallActive && (
            <AudioCall 
              data={state.videoCallData} 
              userProfile={state.userProfile}
              onEnd={(duration) => {
                const callEntry = {
                  contactId: state.videoCallData?.personaId || 'unknown',
                  type: 'outgoing' as const,
                  timestamp: Date.now(),
                  duration
                };
                setState(p => ({ 
                  ...p, 
                  isAudioCallActive: false, 
                  lastCallResult: { mode: 'audio', duration, timestamp: Date.now() },
                  callHistory: [...p.callHistory, callEntry]
                }));
              }}
              theme={state.theme}
              apiConfig={state.apiConfig}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
