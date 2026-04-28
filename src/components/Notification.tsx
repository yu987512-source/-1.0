import { motion } from 'motion/react';
import { Message, ApiConfig } from '../types';

interface NotificationProps {
  notification: Message;
  onClose: () => void;
  onClick: () => void;
  theme: 'light' | 'dark';
  apiConfig: ApiConfig;
}

export default function Notification({ notification, onClose, onClick, theme, apiConfig }: NotificationProps) {
  const character = apiConfig.characterGroups
    .flatMap(g => g.personas)
    .find(p => p.id === apiConfig.selectedCharacterId);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      onClick={onClick}
      className={`absolute top-12 left-4 right-4 z-[2000] p-3 rounded-2xl shadow-2xl cursor-pointer backdrop-blur-xl border ${
        theme === 'light' 
          ? 'bg-white/80 border-white/20 text-black' 
          : 'bg-[#1C1C1E]/80 border-white/10 text-white'
      }`}
    >
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img 
            src={character?.avatar || "https://picsum.photos/seed/wechat/200/200"} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <span className="font-bold text-sm truncate">{character?.name || "微信"}</span>
            <span className="text-[10px] opacity-50">现在</span>
          </div>
          <p className="text-sm line-clamp-2 mt-0.5">{notification.content}</p>
        </div>
      </div>
      <div 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="absolute -top-1 -right-1 w-5 h-5 bg-gray-500/50 rounded-full flex items-center justify-center text-white text-[10px]"
      >
        ×
      </div>
    </motion.div>
  );
}
