import React from 'react';
import { Plus, Users, History } from 'lucide-react';

export default function BottomTabBar({ currentScreen, navigate, selectedPatientId }: any) {
  const historyDisabled = !selectedPatientId;

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-[#FDF9F7]/95 backdrop-blur-md border-t border-[#EEDFCD] flex z-40 pb-4 px-2">
      <button 
        onClick={() => navigate('newVisit')}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 relative transition-colors ${currentScreen === 'newVisit' ? 'text-[#8C6D62]' : 'text-[#AFA199] hover:text-[#8C6D62]'}`}
      >
        <Plus size={22} strokeWidth={currentScreen === 'newVisit' ? 2.5 : 1.5} />
        <span className="text-[10px] tracking-wider uppercase font-semibold">New Visit</span>
      </button>
      <button 
        onClick={() => navigate('patients')}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 relative transition-colors ${currentScreen === 'patients' ? 'text-[#8C6D62]' : 'text-[#AFA199] hover:text-[#8C6D62]'}`}
      >
        <Users size={22} strokeWidth={currentScreen === 'patients' ? 2.5 : 1.5} />
        <span className="text-[10px] tracking-wider uppercase font-semibold">Patients</span>
      </button>
      <button 
        onClick={() => {
          if (!historyDisabled) navigate('history');
        }}
        className={`flex-1 flex flex-col items-center justify-center gap-1.5 relative transition-colors ${
          historyDisabled ? 'opacity-30 cursor-not-allowed text-[#AFA199]' : 
          currentScreen === 'history' ? 'text-[#8C6D62]' : 'text-[#AFA199] hover:text-[#8C6D62]'
        }`}
      >
        <History size={22} strokeWidth={currentScreen === 'history' ? 2.5 : 1.5} />
        <span className="text-[10px] tracking-wider uppercase font-semibold">History</span>
      </button>
    </div>
  );
}
