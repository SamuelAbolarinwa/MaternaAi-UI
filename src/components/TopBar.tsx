import React from 'react';

export default function TopBar({ setSidebarOpen, isOnline }: any) {
  return (
    <div className="fixed top-0 left-0 right-0 h-16 bg-[#FDF9F7]/90 backdrop-blur-md border-b border-[#EEDFCD] flex items-center justify-between px-6 z-40 transition-all">
      <div className="flex-1 flex items-center">
        <button 
          onClick={() => setSidebarOpen(true)}
          className="w-10 h-10 flex flex-col justify-center items-start gap-[5px] group"
        >
          <div className="w-[20px] h-[1.5px] bg-[#38302A] transition-all group-hover:w-[24px]"></div>
          <div className="w-[14px] h-[1.5px] bg-[#38302A] transition-all group-hover:w-[20px]"></div>
        </button>
      </div>
      <div className="flex-1 text-center font-serif italic text-2xl text-[#38302A] tracking-wide">
        Materna
      </div>
      <div className="flex-1 flex items-center justify-end gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-[#7E998B]' : 'bg-[#C28C86]'} shadow-sm`}></div>
        <span className="text-[10px] uppercase tracking-widest text-[#8A7E76] font-medium">{isOnline ? 'Online' : 'Offline'}</span>
      </div>
    </div>
  );
}
