import React, { useState } from 'react';

export default function ClinicalFlag({ flag }: any) {
  const [expanded, setExpanded] = useState(false);
  
  let bgClass = 'bg-gray-100 text-gray-600';
  if (flag.severity === 'high') bgClass = 'bg-red-100 text-red-700';
  if (flag.severity === 'medium') bgClass = 'bg-amber-100 text-amber-700';

  return (
    <div className="mb-2">
      <button 
        onClick={() => setExpanded(!expanded)}
        className={`w-full text-left rounded-full px-3 py-1.5 flex items-center justify-between text-sm font-medium ${bgClass}`}
      >
        <span>{flag.label}</span>
        <span className="text-xs ml-2">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="pl-4 pr-2 py-1.5 text-xs text-gray-600">
          {flag.description}
        </div>
      )}
    </div>
  );
}
