import { Signal, Wifi, Battery } from 'lucide-react';

interface StatusBarProps {
  time: string;
  battery: number;
  isDark: boolean;
}

export default function StatusBar({ time, battery, isDark }: StatusBarProps) {
  return (
    <div className={`absolute top-0 left-0 right-0 h-11 flex items-center justify-between px-6 z-[1000] text-xs font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
      <div className="flex-1">{time}</div>
      <div className="flex items-center gap-1.5">
        <Signal size={14} />
        <Wifi size={14} />
        <div className="flex items-center gap-1">
          <span>{battery}%</span>
          <Battery size={14} />
        </div>
      </div>
    </div>
  );
}
