import React from 'react';

export const Butterfly: React.FC = () => {
  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden"
      id="butterfly-silhouette-container"
    >
      <svg
        viewBox="0 0 200 200"
        className="w-[280px] h-[280px] opacity-50 text-white fill-current"
        style={{ filter: 'blur(8px) saturate(0.75)' }}
        xmlns="http://www.w3.org/2000/svg"
        id="butterfly-svg"
      >
        <path d="M100,100 C110,60 140,40 170,50 C190,55 195,100 170,120 C150,135 120,120 100,100 Z" />
        <path d="M100,100 C90,60 60,40 30,50 C10,55 5,100 30,120 C50,135 80,120 100,100 Z" />
        <path d="M100,100 C120,130 150,165 170,150 C190,135 185,110 160,110 C140,110 120,105 100,100 Z" />
        <path d="M100,100 C80,130 50,165 30,150 C10,135 15,110 40,110 C60,110 80,105 100,100 Z" />
        <path d="M100,90 Q105,75 115,55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M100,90 Q95,75 85,55" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </div>
  );
};
