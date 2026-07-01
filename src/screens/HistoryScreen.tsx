import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import db from '../db';
import RiskBadge from '../components/RiskBadge';
import SHAPBar from '../components/SHAPBar';

export default function HistoryScreen({ patientId, navigate }: any) {
  const [visits, setVisits] = useState<any[]>([]);
  const [expandedVisitId, setExpandedVisitId] = useState<number | null>(null);

  useEffect(() => {
    if (patientId) {
      db.getVisitsForPatient(patientId).then(data => {
        setVisits(data);
      });
    }
  }, [patientId]);

  if (!patientId) {
    return (
      <div className="max-w-md mx-auto text-center py-10 px-4">
        <p className="text-gray-500 mb-4">No patient selected.</p>
        <button 
          onClick={() => navigate('patients')}
          className="rounded-lg py-2 px-4 text-sm font-semibold border border-green-600 text-green-600"
        >
          Browse Patients
        </button>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4">
        <button 
          onClick={() => navigate('patients')}
          className="text-sm text-gray-500 mb-4 flex items-center"
        >
          ← Back to Patients
        </button>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <p className="text-gray-500 text-sm">No visits recorded for this patient yet.</p>
        </div>
      </div>
    );
  }

  const chartData = visits.map(v => ({
    time: new Date(v.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
    risk: v.riskClass
  }));

  const reversedVisits = [...visits].reverse();

  return (
    <div className="max-w-md mx-auto px-4 pb-6">
      <button 
        onClick={() => navigate('patients')}
        className="text-sm text-gray-500 mb-4 flex items-center"
      >
        ← Back to Patients
      </button>

      <div className="flex justify-between items-end mb-4 mt-2">
        <h2 className="text-lg font-semibold text-gray-900">Patient History</h2>
        <span className="text-sm font-mono text-gray-500">{patientId}</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-base font-bold text-gray-800 mb-4">Risk Trend</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="time" tick={{fontSize: 12, fill: '#6B7280'}} axisLine={false} tickLine={false} dy={10} />
            <YAxis 
              domain={[0, 2]} 
              ticks={[0, 1, 2]} 
              tickFormatter={(v) => ['Low','Medium','High'][v]} 
              tick={{fontSize: 12, fill: '#6B7280'}} 
              axisLine={false} 
              tickLine={false} 
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
              formatter={(value: number) => [ ['Low','Medium','High'][value], 'Risk' ]}
            />
            <ReferenceLine y={1} stroke="#f59e0b" strokeDasharray="4 4" label={{ position: 'top', value: 'Monitor threshold', fill: '#d97706', fontSize: 10 }} />
            <Line type="monotone" dataKey="risk" stroke="#16a34a" strokeWidth={2} dot={{ fill: '#16a34a', r: 5 }} activeDot={{ r: 7 }} />
          </LineChart>
        </ResponsiveContainer>
        {visits.length === 1 && (
          <p className="text-xs text-gray-500 text-center mt-4">Return for next visit to see risk trend</p>
        )}
      </div>

      <h3 className="text-base font-bold text-gray-800 mb-3">Visit History</h3>
      <div className="space-y-3">
        {reversedVisits.map((v, i) => {
          const isExpanded = expandedVisitId === v.visitId;
          const topFlag = v.flags && v.flags.length > 0 ? v.flags[0].label : null;
          
          return (
            <div key={v.visitId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div 
                className="flex justify-between items-center cursor-pointer"
                onClick={() => setExpandedVisitId(isExpanded ? null : v.visitId)}
              >
                <div>
                  <p className="text-sm font-bold text-gray-900">
                    {new Date(v.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <RiskBadge riskLabel={v.riskLabel || 'Pending'} />
                  <span className="text-gray-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                </div>
              </div>
              
              {!isExpanded && topFlag && (
                <div className="mt-3 text-xs text-red-600 truncate flex items-center bg-red-50 px-2 py-1 rounded w-fit">
                  {topFlag}
                </div>
              )}

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  {v.topFactors && v.topFactors.length > 0 && (
                    <div className="mb-4">
                      {v.topFactors.map((f: any, idx: number) => (
                        <SHAPBar key={idx} factor={f} />
                      ))}
                    </div>
                  )}
                  {v.recommendation && (
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-800">
                      <span className="font-semibold block mb-1 text-xs text-gray-500 uppercase tracking-wider">Recommendation</span>
                      {v.recommendation}
                    </div>
                  )}
                  {(!v.topFactors || v.topFactors.length === 0) && !v.recommendation && (
                    <p className="text-sm text-gray-500 italic text-center">No detailed analysis available for this visit.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
