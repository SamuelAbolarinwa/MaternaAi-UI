import React, { useState } from 'react';
import db from '../db';
import PatientDropdown from '../components/PatientDropdown';
import RiskBadge from '../components/RiskBadge';

export default function NewVisitScreen({ navigate, apiBase, settings }: any) {
  const [stage, setStage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [previousVisits, setPreviousVisits] = useState<any[]>([]);
  
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [offlineMessage, setOfflineMessage] = useState('');

  const handlePatientSelected = async (patient: any) => {
    setSelectedPatient(patient);
    try {
      const visits = await db.getVisitsForPatient(patient.patientId);
      setPreviousVisits(visits);
    } catch(e) {
      console.error(e);
    }
  };

  const FIELDS = [
    { key: 'Age',         label: 'Age',              unit: 'years',    min: 10,  max: 60,  step: 1,   placeholder: 'e.g. 28' },
    { key: 'SystolicBP',  label: 'Systolic BP',       unit: 'mmHg',    min: 60,  max: 200, step: 1,   placeholder: 'e.g. 120' },
    { key: 'DiastolicBP', label: 'Diastolic BP',      unit: 'mmHg',    min: 40,  max: 140, step: 1,   placeholder: 'e.g. 80' },
    { key: 'BS',          label: 'Blood Sugar',    unit: settings.bsUnit,
      min: settings.bsUnit === 'mmol/L' ? 1 : 18,
      max: settings.bsUnit === 'mmol/L' ? 30 : 540,
      step: 0.1, placeholder: settings.bsUnit === 'mmol/L' ? 'e.g. 7.2' : 'e.g. 130' },
    { key: 'BodyTemp',    label: 'Body Temperature',    unit: `°${settings.tempUnit}`,
      min: settings.tempUnit === 'C' ? 35 : 95,
      max: settings.tempUnit === 'C' ? 42 : 108,
      step: 0.1, placeholder: settings.tempUnit === 'C' ? 'e.g. 37.0' : 'e.g. 98.6' },
    { key: 'HeartRate',   label: 'Heart Rate',        unit: 'bpm',    min: 40,  max: 180, step: 1,   placeholder: 'e.g. 80' },
  ];

  const validateField = (key: string, value: string) => {
    const field = FIELDS.find(f => f.key === key);
    if (!field) return '';
    if (value === '' || value === undefined) return 'Required';
    const num = Number(value);
    if (isNaN(num) || num < field.min || num > field.max) {
      return `Must be between ${field.min} and ${field.max} ${field.unit}`;
    }
    return '';
  };

  const getErrors = () => {
    const errs: Record<string, string> = {};
    FIELDS.forEach(f => {
      const err = validateField(f.key, formValues[f.key]);
      if (err) errs[f.key] = err;
    });
    return errs;
  };

  const errors = getErrors();
  const formValid = Object.keys(errors).length === 0;
  const allFieldsFilled = FIELDS.every(f => formValues[f.key] !== '' && formValues[f.key] !== undefined);
  const canSubmit = formValid && allFieldsFilled;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setOfflineMessage('');
    
    const payload: Record<string, number> = {};
    for (const [k, v] of Object.entries(formValues)) {
      payload[k] = Number(v);
    }
    
    if (settings.tempUnit === 'C') {
      payload.BodyTemp = Math.round(((payload.BodyTemp * 9 / 5) + 32) * 10) / 10;
    }
    
    if (settings.bsUnit === 'mg/dL') {
      payload.BS = Math.round((payload.BS / 18.0182) * 10) / 10;
    }
    
    try {
      const { result, offline } = await db.submitVisit(
        apiBase,
        selectedPatient.patientId,
        payload
      );
      
      setLoading(false);
      
      if (offline) {
        setOfflineMessage('No connection — assessment saved and will sync automatically when you reconnect.');
      } else if (result) {
        navigate('results', { result, currentPatientId: selectedPatient.patientId });
      }
    } catch(e: any) {
      console.error(e);
      setLoading(false);
      setOfflineMessage(e.message || 'An error occurred while contacting the server.');
    }
  };

  if (stage === 1) {
    return (
      <div className="max-w-md mx-auto px-6">
        <h2 className="text-2xl font-serif italic text-[#38302A] mb-6 tracking-wide">New Assessment</h2>
        
        <div className="bg-white/60 rounded-2xl border border-[#EEDFCD] p-6 shadow-sm">
          <h3 className="text-xs font-bold text-[#8A7E76] uppercase tracking-widest mb-4">Select or Register Patient</h3>
          <PatientDropdown apiBase={apiBase} onPatientSelected={handlePatientSelected} />
          
          {selectedPatient && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {previousVisits.length > 0 ? (
                <div className="bg-[#F2E8DF]/50 border border-[#EEDFCD] rounded-xl p-4 flex gap-3">
                  <span className="text-[#8C6D62] text-xl">ℹ️</span>
                  <div>
                    <p className="text-sm text-[#38302A] font-medium leading-relaxed">
                      Returning patient — {previousVisits.length} previous visit(s). Last risk: <RiskBadge riskLabel={previousVisits[previousVisits.length - 1].riskLabel || 'Unknown'} />
                    </p>
                    <p className="text-xs text-[#AFA199] mt-2">Visit history available in the History tab.</p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#F9F1EB] border border-[#EEDFCD] rounded-xl p-4 text-center">
                  <p className="text-sm text-[#8C6D62] font-medium">First visit recorded for this patient.</p>
                </div>
              )}
              
              <button 
                onClick={() => setStage(2)}
                className="w-full bg-[#8C6D62] hover:bg-[#72554B] text-white text-sm font-semibold tracking-wide py-3.5 rounded-xl mt-6 transition-all shadow-md"
              >
                Begin Assessment →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-6 pb-6">
      <button 
        onClick={() => setStage(1)}
        className="text-xs font-bold text-[#C28C86] uppercase tracking-widest mb-6 flex items-center hover:text-[#8C6D62] transition-colors"
      >
        ← {selectedPatient.patientName || selectedPatient.patientId} ({selectedPatient.patientId})
      </button>

      {offlineMessage && (
        <div className="bg-[#F9F1EB] border border-[#EEDFCD] rounded-xl p-4 mb-6 flex gap-3 items-start shadow-sm">
          <span className="text-[#8C6D62]">⚠</span>
          <p className="text-sm text-[#8C6D62] leading-relaxed font-medium">{offlineMessage}</p>
        </div>
      )}

      <div className="bg-white/60 rounded-2xl border border-[#EEDFCD] mb-8 shadow-sm overflow-hidden">
        {FIELDS.map((f, idx) => {
          const val = formValues[f.key] ?? '';
          const hasError = touched[f.key] && errors[f.key];
          
          return (
            <div key={f.key} className={`p-5 ${idx !== FIELDS.length - 1 ? 'border-b border-[#EEDFCD]' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-semibold text-[#38302A] tracking-wide">{f.label}</label>
                <span className="text-[10px] uppercase tracking-widest text-[#AFA199] font-bold">{f.unit}</span>
              </div>
              <input
                type="number"
                min={f.min}
                max={f.max}
                step={f.step}
                inputMode="numeric"
                placeholder={f.placeholder}
                value={val}
                onChange={e => setFormValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                onBlur={() => setTouched(prev => ({ ...prev, [f.key]: true }))}
                className={`w-full bg-transparent border-b-2 rounded-none px-1 py-2 text-xl font-serif text-[#38302A] placeholder-[#D5C9C0] focus:outline-none focus:border-[#8C6D62] transition-colors min-h-[44px] ${hasError ? 'border-[#C28C86]' : 'border-[#EEDFCD]'}`}
              />
              {hasError && <p className="text-[10px] uppercase tracking-wider font-bold text-[#C28C86] mt-2">{errors[f.key]}</p>}
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || loading}
        className={`w-full text-sm tracking-wide font-semibold py-4 rounded-xl flex items-center justify-center transition-all shadow-md ${
          canSubmit && !loading ? 'bg-[#8C6D62] hover:bg-[#72554B] text-white' : 'bg-[#EEDFCD] text-[#AFA199] cursor-not-allowed opacity-50'
        }`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-[#EEDFCD] border-t-white mr-2"></div>
            Calculating risk...
          </>
        ) : (
          'Submit Assessment'
        )}
      </button>
    </div>
  );
}
