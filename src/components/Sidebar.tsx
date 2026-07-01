import React from 'react';
import { X, Plus, Users, History, Settings } from 'lucide-react';

export default function Sidebar({ sidebarOpen, setSidebarOpen, navigate, selectedPatientId, currentScreen, settings, saveSettings }: any) {
  return (
    <>
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-[#38302A]/20 backdrop-blur-[2px] z-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-[#FDF9F7] shadow-2xl shadow-[#38302A]/10 z-50 transform transition-transform duration-300 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 border-b border-[#EEDFCD] flex items-center justify-between px-6">
          <span className="font-serif italic text-xl text-[#38302A]">Menu</span>
          <button onClick={() => setSidebarOpen(false)} className="text-[#8A7E76] hover:text-[#38302A] transition-colors">
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>
        
        <div className="mt-6 px-6 mb-2">
          <span className="text-[10px] font-bold text-[#C28C86] uppercase tracking-[0.2em]">Navigate</span>
        </div>
        <button 
          onClick={() => navigate('newVisit')}
          className={`h-12 w-full px-6 flex items-center text-left transition-colors ${currentScreen === 'newVisit' ? 'bg-[#F2E8DF] text-[#38302A] font-semibold' : 'text-[#8A7E76] hover:bg-[#F9F1EB] hover:text-[#38302A]'}`}
        >
          <Plus size={18} strokeWidth={currentScreen === 'newVisit' ? 2 : 1.5} className="mr-3" />
          <span className="text-sm">New Visit</span>
        </button>
        <button 
          onClick={() => navigate('patients')}
          className={`h-12 w-full px-6 flex items-center text-left transition-colors ${currentScreen === 'patients' ? 'bg-[#F2E8DF] text-[#38302A] font-semibold' : 'text-[#8A7E76] hover:bg-[#F9F1EB] hover:text-[#38302A]'}`}
        >
          <Users size={18} strokeWidth={currentScreen === 'patients' ? 2 : 1.5} className="mr-3" />
          <span className="text-sm">Patients</span>
        </button>
        <button 
          onClick={() => {
            if (selectedPatientId) navigate('history');
          }}
          disabled={!selectedPatientId}
          className={`h-12 w-full px-6 flex items-center text-left transition-colors ${!selectedPatientId ? 'opacity-40 cursor-not-allowed text-[#AFA199]' : ''} ${currentScreen === 'history' ? 'bg-[#F2E8DF] text-[#38302A] font-semibold' : 'text-[#8A7E76] hover:bg-[#F9F1EB] hover:text-[#38302A]'}`}
        >
          <History size={18} strokeWidth={currentScreen === 'history' ? 2 : 1.5} className="mr-3" />
          <span className="text-sm">History</span>
        </button>

        <div className="border-t border-[#EEDFCD] mt-6 pt-6 px-6 mb-2">
          <span className="text-[10px] font-bold text-[#C28C86] uppercase tracking-[0.2em]">Settings</span>
        </div>
        <div className="px-6 py-2">
          <div className="text-sm text-[#38302A] font-medium mb-2">Temperature Unit</div>
          <div className="flex gap-2">
            <button 
              onClick={() => saveSettings({ ...settings, tempUnit: 'C' })}
              className={`w-12 h-9 text-sm font-semibold rounded-lg transition-all ${settings.tempUnit === 'C' ? 'bg-[#8C6D62] text-white shadow-md' : 'bg-[#F2E8DF] text-[#8A7E76] hover:bg-[#EEDFCD]'}`}
            >°C</button>
            <button 
              onClick={() => saveSettings({ ...settings, tempUnit: 'F' })}
              className={`w-12 h-9 text-sm font-semibold rounded-lg transition-all ${settings.tempUnit === 'F' ? 'bg-[#8C6D62] text-white shadow-md' : 'bg-[#F2E8DF] text-[#8A7E76] hover:bg-[#EEDFCD]'}`}
            >°F</button>
          </div>
          <div className="text-[10px] text-[#AFA199] mt-2">Default: °C (Nigerian standard)</div>
        </div>
        
        <div className="px-6 py-4">
          <div className="text-sm text-[#38302A] font-medium mb-2">Blood Sugar Unit</div>
          <div className="flex gap-2">
            <button 
              onClick={() => saveSettings({ ...settings, bsUnit: 'mmol/L' })}
              className={`px-4 h-9 text-sm font-semibold rounded-lg transition-all ${settings.bsUnit === 'mmol/L' ? 'bg-[#8C6D62] text-white shadow-md' : 'bg-[#F2E8DF] text-[#8A7E76] hover:bg-[#EEDFCD]'}`}
            >mmol/L</button>
            <button 
              onClick={() => saveSettings({ ...settings, bsUnit: 'mg/dL' })}
              className={`px-4 h-9 text-sm font-semibold rounded-lg transition-all ${settings.bsUnit === 'mg/dL' ? 'bg-[#8C6D62] text-white shadow-md' : 'bg-[#F2E8DF] text-[#8A7E76] hover:bg-[#EEDFCD]'}`}
            >mg/dL</button>
          </div>
          <div className="text-[10px] text-[#AFA199] mt-2">Default: mmol/L (Nigerian standard)</div>
        </div>

        <div className="mt-auto py-6 px-6">
          <div className="text-[10px] text-[#AFA199] font-medium text-center tracking-widest uppercase mb-1">MaternaAI v1.0</div>
          <div className="text-[10px] text-[#AFA199] text-center leading-relaxed">Maternal risk assessment tool for Nigerian primary healthcare clinics</div>
        </div>
      </div>
    </>
  );
}
