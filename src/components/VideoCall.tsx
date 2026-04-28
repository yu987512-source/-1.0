import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, RotateCcw } from 'lucide-react';

interface VideoCallProps {
  data: {
    partnerName: string;
    partnerAvatar: string;
    userAvatar: string;
    personaId: string;
  };
  onEnd: (duration: number) => void;
  theme: 'light' | 'dark';
}

export default function VideoCall({ data, onEnd, theme }: VideoCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [duration, setDuration] = useState(0);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isEnding, setIsEnding] = useState(false);

  const handleEnd = () => {
    if (isEnding) return;
    setIsEnding(true);
    onEnd(duration);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!data) return null;

  const mainAvatar = isSwapped ? data.userAvatar : data.partnerAvatar;
  const miniAvatar = isSwapped ? data.partnerAvatar : data.userAvatar;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-[3000] bg-black overflow-hidden"
    >
      {/* Main View (Full Screen) */}
      <div className="absolute inset-0">
        <img 
          src={mainAvatar} 
          className={`w-full h-full object-cover transition-all duration-700 ${isVideoOff && !isSwapped ? 'blur-2xl scale-110' : ''}`}
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/30"></div>
        
        {/* Info Overlay */}
        {!isSwapped && (
          <div className="absolute top-24 left-0 right-0 flex flex-col items-center pointer-events-none">
            <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-white/20 mb-4 shadow-2xl">
              <img src={data.partnerAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <h2 className="text-white text-2xl font-bold tracking-tight drop-shadow-lg">{data.partnerName}</h2>
            <p className="text-white/90 text-base mt-2 font-medium drop-shadow-md">{formatDuration(duration)}</p>
          </div>
        )}
      </div>

      {/* Mini View (Draggable & Swappable) */}
      <motion.div 
        drag
        dragConstraints={{ left: -250, right: 0, top: 0, bottom: 500 }}
        onClick={() => setIsSwapped(!isSwapped)}
        className="absolute top-16 right-4 w-28 h-40 bg-gray-900 rounded-xl overflow-hidden border border-white/20 shadow-2xl z-20 cursor-pointer active:scale-95 transition-transform"
      >
        <img src={miniAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        {isSwapped && (
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-end pb-2">
            <span className="text-white text-[10px] font-medium drop-shadow-md">{data.partnerName}</span>
          </div>
        )}
        <div className="absolute bottom-2 right-2 p-1 bg-black/40 rounded-full text-white pointer-events-none">
          <RotateCcw size={12} />
        </div>
      </motion.div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center justify-center gap-6 pb-12 z-30">
        {isSwapped && (
          <div className="mb-2 text-center">
            <h2 className="text-white text-lg font-bold drop-shadow-lg">{data.partnerName}</h2>
            <p className="text-white/80 text-sm font-medium drop-shadow-md">{formatDuration(duration)}</p>
          </div>
        )}
        
        <div className="flex gap-10 items-center">
          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isMuted ? 'bg-white text-black' : 'bg-white/20 text-white backdrop-blur-md'}`}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>
            <span className="text-white/70 text-[11px] font-medium">静音</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={handleEnd}
              className="w-18 h-18 bg-red-500 rounded-full flex items-center justify-center text-white shadow-xl active:scale-90 transition-all hover:bg-red-600"
            >
              <PhoneOff size={36} />
            </button>
            <span className="text-white/70 text-[11px] font-medium">挂断</span>
          </div>

          <div className="flex flex-col items-center gap-2">
            <button 
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all active:scale-90 ${isVideoOff ? 'bg-white text-black' : 'bg-white/20 text-white backdrop-blur-md'}`}
            >
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
            </button>
            <span className="text-white/70 text-[11px] font-medium">摄像头</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
