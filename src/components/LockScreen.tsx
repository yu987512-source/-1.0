import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flashlight, Camera, Delete } from 'lucide-react';
import { Butterfly } from './Butterfly';

interface LockScreenProps {
  onUnlock: () => void;
  wallpaper: string;
  time: string;
  date: string;
  password?: string;
}

export default function LockScreen({ onUnlock, wallpaper, time, date, password }: LockScreenProps) {
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [isError, setIsError] = useState(false);
  const correctPasscode = password || "";

  const handleNumberClick = (num: string) => {
    if (passcode.length < correctPasscode.length) {
      const newPasscode = passcode + num;
      setPasscode(newPasscode);
      
      if (newPasscode.length === correctPasscode.length) {
        if (newPasscode === correctPasscode) {
          onUnlock();
        } else {
          setIsError(true);
          setTimeout(() => {
            setPasscode("");
            setIsError(false);
          }, 400);
        }
      }
    }
  };

  const handleDelete = () => {
    setPasscode(prev => prev.slice(0, -1));
  };

  return (
    <div 
      className="absolute inset-0 z-[900] overflow-hidden cursor-pointer phone-screen" 
      onClick={() => {
        if (!correctPasscode) {
          onUnlock();
        } else if (!showPasscode) {
          setShowPasscode(true);
        }
      }}
    >
      {/* Wallpaper - Disabled for global gradient */}
      {/* 
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-500"
        style={{ 
          backgroundImage: wallpaper.startsWith('linear-gradient') ? wallpaper : `url(${wallpaper})` 
        }}
      ></div>
      */}

      {/* Star Texture Overlay */}
      <div className="absolute inset-0 bg-star-pattern opacity-40 pointer-events-none"></div>

      {/* Butterfly Silhouette */}
      <Butterfly />

      {/* Time and Date */}
      <AnimatePresence>
        {!showPasscode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-0 right-0 flex flex-col items-center z-10 text-white"
          >
            <div className="text-[19px] font-medium mb-1 drop-shadow-sm">{date}</div>
            <div className="text-[82px] font-light tracking-tighter leading-none drop-shadow-md">{time}</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Buttons */}
      <AnimatePresence>
        {!showPasscode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-[120px] left-0 right-0 flex justify-between px-12 z-10"
          >
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
              <Flashlight size={20} />
            </div>
            <div className="w-12 h-12 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center text-white">
              <Camera size={20} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Passcode View */}
      <AnimatePresence>
        {showPasscode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black/20 backdrop-blur-[25px] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`text-center mb-8 transition-transform ${isError ? 'animate-shake' : ''}`}>
              <h2 className="text-white text-lg font-normal mb-5">请输入密码</h2>
              <div className="flex gap-5">
                {[...Array(correctPasscode.length)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`w-3.5 h-3.5 rounded-full border-1.5 border-white transition-colors duration-200 ${i < passcode.length ? 'bg-white' : ''}`}
                  ></div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-6 gap-y-4 mt-12 w-[280px]">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                <button 
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="w-20 h-20 rounded-full bg-white/10 flex flex-col items-center justify-center text-white active:bg-white/30 transition-colors"
                >
                  <span className="text-3xl font-light">{num}</span>
                  <span className="text-[10px] tracking-widest opacity-60">
                    {num === 2 ? "ABC" : num === 3 ? "DEF" : num === 4 ? "GHI" : num === 5 ? "JKL" : num === 6 ? "MNO" : num === 7 ? "PQRS" : num === 8 ? "TUV" : num === 9 ? "WXYZ" : ""}
                  </span>
                </button>
              ))}
              <div />
              <button 
                onClick={() => handleNumberClick("0")}
                className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center text-white active:bg-white/30 transition-colors"
              >
                <span className="text-3xl font-light">0</span>
              </button>
              <button 
                onClick={handleDelete}
                className="w-20 h-20 rounded-full flex items-center justify-center text-white active:bg-white/10 transition-colors"
              >
                <Delete size={24} />
              </button>
            </div>

            <button 
              onClick={() => { setShowPasscode(false); setPasscode(""); }}
              className="mt-10 text-white opacity-80 hover:opacity-100 transition-opacity"
            >
              取消
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
