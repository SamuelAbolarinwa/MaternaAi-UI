import React, { useEffect, useState } from 'react';
import db from '../db';
import RiskBadge from '../components/RiskBadge';

export default function PatientsScreen({ navigate, apiBase }: any) {
  const [enrichedPatients, setEnrichedPatients] = useState<any[]>([]);
  const [unsyncedVisits, setUnsyncedVisits] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [showUnsynced, setShowUnsynced] = useState(false);

  const loadData = async () => {
    try {
      const allPatients = await db.getAllPatients();
      const unsynced = await db.getUnsyncedVisits();
      setUnsyncedVisits(unsynced);
      
      const enriched = await Promise.all(allPatients.map(async (p: any) => {
        const visits = await db.getVisitsForPatient(p.patientId);
        const lastVisit = visits.length > 0 ? visits[visits.length - 1] : null;
        return {
          ...p,
          visitCount: visits.length,
          lastRiskLabel: lastVisit ? lastVisit.riskLabel : null
        };
      }));
      
      enriched.sort((a, b) => b.createdAt - a.createdAt);
      setEnrichedPatients(enriched);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await db.flushQueue(apiBase);
      await loadData();
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const filtered = enrichedPatients.filter(p => p.patientId.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="max-w-md mx-auto px-6 pb-6">
      <h2 className="text-2xl font-serif italic text-[#38302A] mb-6 tracking-wide mt-2">Patient Directory</h2>

      {unsyncedVisits.length > 0 && (
        <div className="bg-[#F9F1EB] border border-[#EEDFCD] rounded-2xl mb-6 shadow-sm overflow-hidden transition-all">
          <div className="p-4 flex justify-between items-center">
            <button 
              onClick={() => setShowUnsynced(!showUnsynced)}
              className="flex items-center text-[#8C6D62] text-xs font-bold uppercase tracking-widest hover:text-[#72554B] transition-colors"
            >
              ⚠ {unsyncedVisits.length} Pending Sync
              <svg className={`ml-2 w-4 h-4 transition-transform ${showUnsynced ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className="text-[10px] bg-[#8C6D62] text-white px-3 py-2 rounded-lg font-bold uppercase tracking-wider hover:bg-[#72554B] transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {showUnsynced && (
            <div className="border-t border-[#EEDFCD] bg-white/40 p-4 max-h-48 overflow-y-auto">
              {unsyncedVisits.map((visit: any) => (
                <div key={visit.visitId} className="mb-3 last:mb-0 p-3 bg-white rounded-xl border border-[#EEDFCD] text-xs text-[#8A7E76] shadow-sm">
                  <div className="font-semibold text-[#38302A] mb-1 tracking-wide">Patient: <span className="font-mono">{visit.patientId}</span></div>
                  <div className="text-[10px] uppercase tracking-widest text-[#AFA199] mb-2">{new Date(visit.timestamp).toLocaleString()}</div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2">
                    {Object.entries(visit.inputData || {}).map(([k, v]) => (
                      <div key={k}><span className="font-medium text-[#8C6D62]">{k}:</span> <span className="font-serif italic text-sm text-[#38302A]">{String(v)}</span></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <input 
          type="text" 
          placeholder="Search by name or ID" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-white/60 border border-[#EEDFCD] rounded-2xl px-5 py-4 text-base font-serif italic text-[#38302A] placeholder-[#D5C9C0] focus:outline-none focus:ring-2 focus:ring-[#8C6D62] focus:border-transparent transition-all shadow-sm"
        />
      </div>

      <div className="space-y-4">
        {filtered.map(p => (
          <div 
            key={p.patientId} 
            onClick={() => navigate('history', { patientId: p.patientId })}
            className="bg-white/60 rounded-2xl shadow-sm border border-[#EEDFCD] p-5 flex justify-between items-center cursor-pointer hover:bg-white transition-all"
          >
            <div>
              <p className="font-serif text-lg text-[#38302A] leading-tight mb-1">{p.patientName || p.patientId}</p>
              <div className="flex items-center gap-2">
                {p.patientName && <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-[#AFA199]">{p.patientId}</span>}
              </div>
              <div className="mt-2 text-[10px] uppercase tracking-widest font-semibold text-[#8C6D62]">
                First visit: {new Date(p.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              {p.lastRiskLabel && (
                <RiskBadge riskLabel={p.lastRiskLabel} />
              )}
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#AFA199]">
                {p.visitCount} visit{p.visitCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 bg-white/40 rounded-2xl border border-[#EEDFCD] border-dashed">
            <p className="text-[#AFA199] text-sm font-medium tracking-wide">No patients found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
