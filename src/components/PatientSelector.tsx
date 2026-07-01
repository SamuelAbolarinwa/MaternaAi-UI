import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import db from '../db';

export default function PatientSelector({ onSelect, selectedId, selectedName }: { onSelect: (id: string, name: string) => void, selectedId: string, selectedName: string }) {
  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    db.getAllPatients().then(setPatients);
    
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = patients.filter(p => 
    p.patientId.toLowerCase().includes(query.toLowerCase()) || 
    (p.patientName && p.patientName.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="space-y-6" ref={wrapperRef}>
      <div className="relative">
        <label className="block text-[10px] font-bold text-ink-light uppercase tracking-widest mb-2 ml-1">Search Directory</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light/50" />
          <input 
            type="text" 
            className="w-full pl-11 pr-4 py-4 bg-bg-cream border border-transparent rounded-2xl text-xl font-serif text-ink placeholder:text-ink-light/30 focus:outline-none focus:border-sage focus:bg-bg-cream transition-all"
            placeholder="Search by ID or Name..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>

        {isOpen && query.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-bg-cream border border-surface-hover shadow-xl rounded-2xl overflow-hidden z-10 max-h-60 overflow-y-auto">
            {filtered.length > 0 ? (
              filtered.map(p => (
                <button
                  key={p.patientId}
                  type="button"
                  onClick={() => {
                    onSelect(p.patientId, p.patientName || '');
                    setQuery(p.patientName ? `${p.patientName} (${p.patientId})` : p.patientId);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-5 py-4 hover:bg-surface border-b border-surface-hover last:border-0 flex flex-col transition-colors"
                >
                  <span className="font-serif text-lg text-ink">{p.patientName || 'No Name Provided'}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold text-ink-light opacity-70 mt-1">{p.patientId}</span>
                </button>
              ))
            ) : (
              <div className="px-5 py-6 text-center font-serif text-ink-light">
                No matching patients found.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative flex items-center py-2">
        <div className="flex-grow border-t border-surface-hover"></div>
        <span className="flex-shrink-0 mx-4 text-ink-light/40 text-[10px] uppercase tracking-widest font-bold">Or enter manually</span>
        <div className="flex-grow border-t border-surface-hover"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-ink-light uppercase tracking-widest mb-2 ml-1">Patient ID *</label>
          <input 
            required
            className="w-full px-4 py-4 bg-bg-cream border border-transparent rounded-2xl font-serif text-xl focus:outline-none focus:border-sage focus:bg-bg-cream transition-all placeholder:text-ink-light/30 uppercase"
            placeholder="ANC-00123"
            value={selectedId}
            onChange={(e) => onSelect(e.target.value.toUpperCase(), selectedName)}
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-ink-light uppercase tracking-widest mb-2 ml-1">Full Name</label>
          <input 
            className="w-full px-4 py-4 bg-bg-cream border border-transparent rounded-2xl font-serif text-xl focus:outline-none focus:border-sage focus:bg-bg-cream transition-all placeholder:text-ink-light/30"
            placeholder="Jane Doe"
            value={selectedName}
            onChange={(e) => onSelect(selectedId, e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
