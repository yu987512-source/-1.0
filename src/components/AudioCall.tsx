import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneOff, Mic, MicOff, Volume2, User, Wifi, WifiOff, Loader2, Keyboard, Send } from 'lucide-react';
import { GoogleGenAI, Modality } from "@google/genai";
import { getPersonaMemories } from '../lib/memoryUtils';
import { UserProfile, ApiConfig } from '../types';

interface AudioCallProps {
  data: {
    partnerName: string;
    partnerAvatar: string;
    userAvatar: string;
    personaId: string;
    isFirstCall?: boolean;
  };
  onEnd: (duration: number) => void;
  theme: 'light' | 'dark';
  apiConfig: ApiConfig;
  userProfile: UserProfile;
}

export default function AudioCall({ data, onEnd, theme, apiConfig, userProfile }: AudioCallProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [duration, setDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const isMutedRef = useRef(isMuted);
  useEffect(() => { isMutedRef.current = isMuted; }, [isMuted]);
  
  const connectionStatusRef = useRef(connectionStatus);
  useEffect(() => { connectionStatusRef.current = connectionStatus; }, [connectionStatus]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputValue, setTextInputValue] = useState("");
  const [lastAiMessage, setLastAiMessage] = useState("");
  const [isAiTalking, setIsAiTalking] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);

  const [isEnding, setIsEnding] = useState(false);

  const handleEnd = () => {
    if (isEnding) return;
    setIsEnding(true);
    cleanup();
    onEnd(duration);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      if (connectionStatusRef.current === 'connected') {
        setDuration(prev => prev + 1);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    startHandshake();
    return () => cleanup();
  }, []);

  const startHandshake = async () => {
    try {
      setConnectionStatus('connecting');
      const customUrl = apiConfig.baseUrl?.trim().replace(/\/$/, "");
      console.log(`[AudioCall] Starting handshake... Destination: ${customUrl || "Gemini Default"}`);
      
      const apiKey = apiConfig.apiKey || process.env.GEMINI_API_KEY || "";
      
      const ai = new GoogleGenAI({ apiKey });

      // 1. Request Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // 2. Setup Audio Processing for outgoing stream (PCM)
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // 3. Connect to Gemini Live API
      const liveSession = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        callbacks: {
          onopen: () => {
            console.log("[AudioCall] Connection opened.");
            setConnectionStatus('connected');
            if (audioContextRef.current) {
              nextAudioStartTimeRef.current = audioContextRef.current.currentTime;
            }
          },
          onmessage: async (message: any) => {
            if (!message) return;

            // Handle interruption
            if (message.serverContent?.interrupted) {
              console.log("[AudioCall] Model interrupted.");
              setIsAiTalking(false);
              if (audioContextRef.current) {
                nextAudioStartTimeRef.current = audioContextRef.current.currentTime;
              }
            }

            // Handle audio output if TTS is enabled
            if (apiConfig.ttsEnabled) {
              const audioPart = message.serverContent?.modelTurn?.parts?.find((p: any) => p.inlineData);
              if (audioPart?.inlineData?.data) {
                playReceivedAudio(audioPart.inlineData.data);
              }
            }

            // Handle text (transcription or text parts)
            let textAccumulated = "";
            const textParts = message.serverContent?.modelTurn?.parts?.filter((p: any) => p.text);
            if (textParts && textParts.length > 0) {
              textAccumulated = textParts.map((p: any) => p.text).join("");
            }
            
            if (textAccumulated) {
              setLastAiMessage(prev => prev + textAccumulated);
            }
          },
          onerror: (err: any) => {
            console.error("[AudioCall] Handshake Error:", err);
            setConnectionStatus('error');
            setErrorMessage(`Connection Error: ${err.message || "Please check your network and API key"}`);
          },
          onclose: () => {
            console.log("[AudioCall] Connection closed.");
            setConnectionStatus('disconnected');
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: apiConfig.ttsEnabled ? {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: userProfile.selectedPersonaId === 'char-2' ? 'Aoife' : 'Zephyr' } },
          } : undefined,
          systemInstruction: (() => {
            const currentUserPersona = userProfile.personaGroups
              .flatMap(g => g.personas)
              .find(p => p.id === userProfile.selectedPersonaId);
            
            const userInfo = currentUserPersona ? `
【对方（当前用户）个人档案】
 - 姓名：${currentUserPersona.name}
 - TA的人设内容：${currentUserPersona.personaDescription || '无'}
 ` : "";

            return `You are currently in a voice call with the user. Act natural, concise, and helpful. Use spoken Chinese naturally.
【输出规范】${apiConfig.ttsEnabled ? "当前启用了语音输出（AUDIO）。请以语音方式回复，同时你会自动发送文字转录。" : "虽然当前是语音通话模式，但你可以配合文字进行交流。"}
 【建议】根据“对方（当前用户）个人档案”调整你的态度。
 ${userInfo}
 ${data.isFirstCall ? "This is the very first time you are talking to this user. You do not know who they are. You should be cautious, curious, or formal depending on your persona, and ask them who they are." : ""}
 ${getPersonaMemories(data.personaId)}`;
          })(),
        } as any
      });

      sessionRef.current = liveSession;

      // Start sending audio data
      processor.onaudioprocess = (e) => {
        if (isMutedRef.current || connectionStatusRef.current !== 'connected' || !sessionRef.current) return;
        try {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
          }
          const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
          
          sessionRef.current.sendRealtimeInput({
            audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        } catch (err) {
          console.error("[AudioCall] Error sending audio chunk:", err);
        }
      };

      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

    } catch (err: any) {
      console.error("[AudioCall] Handshake Initialization Failed:", err);
      setConnectionStatus('error');
      setErrorMessage(err.message || "Failed to access microphone.");
    }
  };

  const playReceivedAudio = (base64: string) => {
    if (!audioContextRef.current || !isSpeakerOn) return;
    
    try {
      // Decode base64 to binary
      const binary = atob(base64);
      const bytes = new Int16Array(binary.length / 2);
      for (let i = 0; i < bytes.length; i++) {
        const index = i * 2;
        bytes[i] = (binary.charCodeAt(index + 1) << 8) | binary.charCodeAt(index);
      }
      
      // Convert Int16 PCM to Float32 for Web Audio API
      const float32 = new Float32Array(bytes.length);
      for (let i = 0; i < bytes.length; i++) {
        float32[i] = bytes[i] / 32768;
      }

      const buffer = audioContextRef.current.createBuffer(1, float32.length, 16000);
      buffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);
      
      // Handle playback timing to avoid gaps/jitter
      const startTime = Math.max(audioContextRef.current.currentTime, nextAudioStartTimeRef.current);
      source.start(startTime);
      nextAudioStartTimeRef.current = startTime + buffer.duration;
      
      setIsAiTalking(true);
      source.onended = () => {
        if (audioContextRef.current && audioContextRef.current.currentTime >= nextAudioStartTimeRef.current - 0.1) {
          setIsAiTalking(false);
        }
      };
    } catch (e) {
      console.error("[AudioCall] Play audio error:", e);
    }
  };

  const sendTextInput = () => {
    if (!textInputValue.trim() || !sessionRef.current || connectionStatus !== 'connected') return;
    
    try {
      console.log("[AudioCall] Sending text input:", textInputValue);
      sessionRef.current.sendRealtimeInput({
        text: textInputValue.trim()
      });
      setTextInputValue("");
      setShowTextInput(false);
    } catch (e) {
      console.error("[AudioCall] Send text error:", e);
    }
  };

  const cleanup = () => {
    nextAudioStartTimeRef.current = 0;
    if (sessionRef.current) {
      try { sessionRef.current.close(); } catch (e) {}
      sessionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      try { processorRef.current.disconnect(); } catch (e) {}
      processorRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const WaveIcon = () => (
    <div className="flex items-center gap-1 h-8">
      {[1, 2, 3, 4, 5].map((i) => (
        <motion.div
          key={i}
          animate={{
            height: (connectionStatus === 'connected' && (isAiTalking || (!isMuted && connectionStatus === 'connected'))) ? [8, 20, 12, 24, 8] : 2,
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.1,
            ease: "easeInOut"
          }}
          className={`w-1 rounded-full ${(connectionStatus === 'connected' && (isAiTalking || (!isMuted && connectionStatus === 'connected'))) ? 'bg-[#07C160]' : 'bg-white/20'}`}
        />
      ))}
    </div>
  );

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute inset-0 z-[3000] bg-[#1a1a1a] flex flex-col items-center justify-between py-24 px-6 overflow-hidden"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl relative">
          <img src={data.partnerAvatar} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <div className="text-center space-y-2 w-full">
          <h2 className="text-white text-2xl font-bold tracking-tight">{data.partnerName}</h2>
          <div className="flex items-center justify-center gap-3">
             <WaveIcon />
             <span className={`text-sm font-medium ${connectionStatus === 'connected' ? 'text-[#07C160]' : 'text-white/40'}`}>
               {connectionStatus === 'connecting' ? '正在握手...' : 
                connectionStatus === 'connected' ? '正在通话' : 
                connectionStatus === 'error' ? '握手失败' : '已断开'}
             </span>
          </div>
          {lastAiMessage && (
            <div className="mt-4 px-6 py-3 bg-white/5 rounded-2xl border border-white/10 max-w-xs mx-auto">
              <p className="text-white/90 text-sm leading-relaxed">{lastAiMessage}</p>
            </div>
          )}
          {errorMessage && (
            <p className="text-red-400 text-xs px-4 text-center mt-2 opacity-80">{errorMessage}</p>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        {connectionStatus === 'connecting' && (
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 className="text-white/20" size={32} />
          </motion.div>
        )}
        <div className="text-white/60 font-mono text-xl tracking-wider">
          {formatDuration(duration)}
        </div>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-12">
        <AnimatePresence>
          {showTextInput && (
            <motion.form 
              onSubmit={(e) => {
                e.preventDefault();
                sendTextInput();
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="w-full bg-white/10 backdrop-blur-md rounded-2xl p-4 flex gap-2 border border-white/10 mb-4"
            >
              <input 
                type="text" 
                value={textInputValue}
                onChange={(e) => setTextInputValue(e.target.value)}
                placeholder="在此输入文字..."
                className="flex-1 bg-transparent text-white outline-none text-sm placeholder:text-white/30"
                autoFocus
              />
              <button 
                type="submit"
                disabled={!textInputValue.trim()}
                className="p-2 bg-[#07C160] text-white rounded-lg active:scale-95 transition-transform disabled:opacity-30 disabled:grayscale"
              >
                <Send size={18} />
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-3 w-full gap-4">
          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setShowTextInput(!showTextInput)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${showTextInput ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'}`}
            >
              <Keyboard size={28} />
            </button>
            <span className="text-white/50 text-xs">{showTextInput ? '收起键盘' : '文字输入'}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${isMuted ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'}`}
            >
              {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
            </button>
            <span className="text-white/50 text-xs">{isMuted ? '解除静音' : '静音'}</span>
          </div>

          <div className="flex flex-col items-center gap-3">
            <button 
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all active:scale-95 ${!isSpeakerOn ? 'bg-white text-black shadow-lg' : 'bg-white/10 text-white border border-white/10 backdrop-blur-md'}`}
            >
              <Volume2 size={28} className={isSpeakerOn ? 'opacity-100' : 'opacity-40'} />
            </button>
            <span className="text-white/50 text-xs">扬声器</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 items-center">
          <button 
            onClick={handleEnd}
            className="w-20 h-20 bg-[#FA5151] rounded-full flex items-center justify-center text-white shadow-2xl active:scale-90 transition-all hover:bg-[#D9363E]"
          >
            <PhoneOff size={36} />
          </button>
          
          {connectionStatus === 'error' && (
            <button 
              onClick={startHandshake}
              className="text-white/40 text-xs underline active:text-white"
            >
              重试握手
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
