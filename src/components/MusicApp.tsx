import { useState } from 'react';
import { ChevronLeft, Music, SkipBack, SkipForward, Play, Pause } from 'lucide-react';

interface MusicAppProps {
  onClose: () => void;
  theme: 'light' | 'dark';
}

export default function MusicApp({ onClose, theme }: MusicAppProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className={`flex flex-col h-full ${theme === 'light' ? 'bg-white' : 'bg-black text-white'}`}>
      {/* Header */}
      <div className="h-22 flex items-end px-4 pb-2 gap-3 shrink-0">
        <button onClick={onClose} className="p-1 text-gray-500">
          <ChevronLeft size={28} />
        </button>
        <div className="flex-1 text-center pb-1">
          <h1 className="text-[17px] font-semibold">正在播放</h1>
        </div>
        <div className="w-10"></div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-12">
        {/* Album Art */}
        <div className="w-64 h-64 rounded-2xl bg-[#F2F2F7] shadow-xl flex items-center justify-center text-gray-300">
          <Music size={120} />
        </div>

        {/* Info */}
        <div className="text-center">
          <h2 className="text-2xl font-bold">遇见</h2>
          <p className="text-lg opacity-60">孙燕姿</p>
        </div>

        {/* Progress */}
        <div className="w-full flex flex-col gap-2">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="w-1/3 h-full bg-gray-400"></div>
          </div>
          <div className="flex justify-between text-xs opacity-40">
            <span>1:24</span>
            <span>4:02</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-12">
          <SkipBack size={32} className="fill-current" />
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-black active:scale-95 transition-transform"
          >
            {isPlaying ? <Pause size={40} className="fill-current" /> : <Play size={40} className="fill-current ml-1" />}
          </button>
          <SkipForward size={32} className="fill-current" />
        </div>
      </div>
    </div>
  );
}
