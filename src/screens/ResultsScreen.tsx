import React, { useEffect, useState } from 'react';
import ClinicalFlag from '../components/ClinicalFlag';
import SHAPBar from '../components/SHAPBar';
import db from '../db';

export default function ResultsScreen({ result, patientId, navigate }: any) {
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    if (patientId) {
      db.getAllPatients().then(p => {
        const pFound = p.find((x: any) => x.patientId === patientId);
        if (pFound) setPatientName(pFound.patientName);
      });
    }
  }, [patientId]);

  if (!result) return null;

  const { risk_label, confidence, clinical_flags, top_factors, recommendation } = result;

  let bgClass = 'bg-gray-100 border-gray-500';
  let textClass = 'text-gray-800';
  let recBorderClass = 'border-l-4 border-gray-500';

  if (risk_label === 'Low') {
    bgClass = 'bg-green-100 border-green-500';
    textClass = 'text-green-700';
    recBorderClass = 'border-l-4 border-green-500';
  } else if (risk_label === 'Medium') {
    bgClass = 'bg-amber-100 border-amber-500';
    textClass = 'text-amber-700';
    recBorderClass = 'border-l-4 border-amber-500';
  } else if (risk_label === 'High') {
    bgClass = 'bg-red-100 border-red-500';
    textClass = 'text-red-700';
    recBorderClass = 'border-l-4 border-red-500';
  }

  return (
    <div className="max-w-md mx-auto px-4 space-y-4">
      {patientId && (
        <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 flex justify-between items-center">
          <span className="text-sm font-medium text-gray-900">{patientName || 'Unknown'}</span>
          <span className="text-xs font-mono text-gray-400">{patientId}</span>
        </div>
      )}

      <div className={`w-full rounded-xl border ${bgClass} p-6 text-center shadow-sm`}>
        <h2 className={`text-3xl font-bold ${textClass}`}>{risk_label} RISK</h2>
        <p className="text-gray-500 mt-2 text-base">{(confidence * 100).toFixed(0)}% confidence</p>
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 mb-2 mt-4">Clinical Flags</h3>
        {(!clinical_flags || clinical_flags.length === 0) ? (
          <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center text-sm">
            ✅ <span className="ml-2 font-medium">No clinical flags detected</span>
          </div>
        ) : (
          <div className="space-y-2">
            {clinical_flags.map((flag: any, idx: number) => (
              <ClinicalFlag key={idx} flag={flag} />
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-base font-bold text-gray-900 mb-2 mt-4">Why this score?</h3>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          {top_factors && top_factors.map((factor: any, idx: number) => (
            <SHAPBar key={idx} factor={factor} />
          ))}
        </div>
      </div>

      <div className={`bg-white rounded-xl shadow-sm p-4 border border-gray-200 ${recBorderClass} mt-4`}>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recommended Action</p>
        <p className="text-base text-gray-900 leading-relaxed mb-6">
          {recommendation}
        </p>
        
        <div className="flex space-x-3">
          <button 
            onClick={() => navigate('newVisit')}
            className="flex-1 rounded-lg py-3 text-sm font-semibold border border-green-600 text-green-600 hover:bg-green-50 text-center"
          >
            New Patient
          </button>
          <button 
            onClick={() => navigate('history', { patientId })}
            className="flex-1 rounded-lg py-3 text-sm font-semibold bg-green-600 text-white hover:bg-green-700 text-center"
          >
            View History
          </button>
        </div>
      </div>
    </div>
  );
}
