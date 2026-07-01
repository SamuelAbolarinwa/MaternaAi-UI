import React, { useState, useEffect, useRef } from 'react';
import db from '../db';

export default function PatientDropdown({ onPatientSelected, apiBase }: any) {
  const [inputValue, setInputValue] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [mode, setMode] = useState<'search' | 'create'>('search');
  
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientIdTouched, setNewPatientIdTouched] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientNameTouched, setNewPatientNameTouched] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);

  const fetchResults = async (val: string) => {
    try {
      const all = await db.getAllPatients();
      const filtered = all.filter((p: any) => 
        p.patientId.toLowerCase().includes(val.toLowerCase()) || 
        (p.patientName && p.patientName.toLowerCase().includes(val.toLowerCase()))
      );
      setResults(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    setDropdownOpen(true);
    setMode('search');
    fetchResults(val);
  };

  const handleFocus = () => {
    setDropdownOpen(true);
    fetchResults(inputValue);
  };

  const newPatientIdValid = /^ANC-\d{5}$/.test(newPatientId);
  const newPatientNameValid = newPatientName.trim().length > 0;
  const canRegister = newPatientIdValid && newPatientNameValid;

  const handleRegister = async () => {
    if (!canRegister) return;
    
    try {
      await db.upsertPatient(newPatientId, newPatientName);
      try {
        await fetch(`${apiBase}/patients`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patient_id: newPatientId }),
        });
      } catch (e) {
        // Offline
      }
      onPatientSelected({ patientId: newPatientId, patientName: newPatientName });
      setDropdownOpen(false);
      setInputValue('');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <div className={`border-b-2 bg-transparent flex items-center py-2 cursor-text transition-colors ${dropdownOpen ? 'border-[#8C6D62]' : 'border-[#EEDFCD]'}`}>
        <span className="text-[#AFA199] mr-3 text-sm">🔍</span>
        <input 
          type="text" 
          className="flex-1 text-lg font-serif italic text-[#38302A] placeholder:text-[#D5C9C0] outline-none bg-transparent"
          placeholder="Search patient..."
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
        />
        <span className="text-[#AFA199] text-xs ml-2">{dropdownOpen ? '▲' : '▼'}</span>
      </div>

      {dropdownOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-[#FDF9F7] border border-[#EEDFCD] rounded-xl shadow-lg z-50 max-h-64 overflow-y-auto">
          {mode === 'search' && (
            <>
              {results.length > 0 ? (
                results.map(p => (
                  <div 
                    key={p.patientId}
                    onClick={() => {
                      onPatientSelected(p);
                      setDropdownOpen(false);
                      setInputValue('');
                    }}
                    className="h-14 px-5 flex items-center justify-between hover:bg-[#F2E8DF] cursor-pointer transition-colors"
                  >
                    <span className="text-sm font-medium text-[#38302A]">{p.patientName || 'Unknown'}</span>
                    <span className="text-xs text-[#AFA199] font-mono tracking-wide">{p.patientId}</span>
                  </div>
                ))
              ) : (
                inputValue ? (
                  <div className="text-sm text-[#AFA199] px-5 py-4">No patients found</div>
                ) : (
                  <div className="text-sm text-[#AFA199] px-5 py-4">No patients registered yet</div>
                )
              )}
              
              {(!results.length && inputValue) || results.length > 0 ? <div className="border-t border-[#EEDFCD]" /> : null}
              
              {(inputValue || results.length > 0) && (
                <div 
                  onClick={() => {
                    setMode('create');
                    setNewPatientName(inputValue);
                    setNewPatientId('');
                    setNewPatientIdTouched(false);
                    setNewPatientNameTouched(false);
                  }}
                  className="text-sm text-[#8C6D62] font-semibold tracking-wide px-5 py-4 hover:bg-[#F2E8DF] cursor-pointer flex items-center transition-colors"
                >
                  <span className="mr-2 text-lg leading-none">+</span> Create new patient
                </div>
              )}
            </>
          )}

          {mode === 'create' && (
            <div className="p-0">
              <div className="text-sm font-bold text-[#38302A] uppercase tracking-widest px-5 pt-5 pb-3">Register Patient</div>
              <div className="px-5 py-2">
                <label className="block text-[10px] text-[#AFA199] uppercase tracking-widest font-bold mb-1.5">Patient ID</label>
                <input 
                  type="text" 
                  value={newPatientId}
                  onChange={e => setNewPatientId(e.target.value.toUpperCase())}
                  onBlur={() => setNewPatientIdTouched(true)}
                  placeholder="ANC-00123"
                  className="w-full bg-[#F2E8DF] border border-transparent rounded-lg px-3 py-2.5 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D62] focus:border-transparent uppercase transition-all"
                />
                {newPatientIdTouched && !newPatientIdValid && (
                  <div className="text-[10px] text-[#C28C86] font-bold uppercase tracking-wider mt-1.5">Format: ANC-00001 to ANC-99999</div>
                )}
              </div>
              <div className="px-5 py-2">
                <label className="block text-[10px] text-[#AFA199] uppercase tracking-widest font-bold mb-1.5">Full Name</label>
                <input 
                  type="text" 
                  value={newPatientName}
                  onChange={e => setNewPatientName(e.target.value)}
                  onBlur={() => setNewPatientNameTouched(true)}
                  placeholder="e.g. Amina Yusuf"
                  className="w-full bg-[#F2E8DF] border border-transparent rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8C6D62] focus:border-transparent transition-all"
                />
                {newPatientNameTouched && !newPatientNameValid && (
                  <div className="text-[10px] text-[#C28C86] font-bold uppercase tracking-wider mt-1.5">Required</div>
                )}
              </div>
              <div className="flex justify-end gap-4 px-5 py-4 border-t border-[#EEDFCD] mt-3">
                <button 
                  onClick={() => setMode('search')}
                  className="text-xs font-semibold text-[#8A7E76] uppercase tracking-widest hover:text-[#38302A] transition-colors"
                >Cancel</button>
                <button 
                  onClick={handleRegister}
                  disabled={!canRegister}
                  className={`text-xs font-bold uppercase tracking-widest transition-colors ${canRegister ? 'text-[#8C6D62] hover:text-[#72554B]' : 'text-[#D5C9C0] cursor-not-allowed'}`}
                >Register</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
