import React from 'react';

export default function SHAPBar({ factor }: any) {
  const { feature, value, impact, magnitude_normalised } = factor;
  const isIncrease = impact.includes('increase');
  const widthPercent = Math.max(0, Math.min(100, (magnitude_normalised || 0) * 100));
  
  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="font-bold text-gray-900 text-sm">{feature}</span>
        <span className="text-gray-500 text-sm">({value})</span>
      </div>
      <div className="bg-gray-200 h-3 rounded-full w-full overflow-hidden mb-1">
        <div 
          className={`h-full transition-all duration-500 ${isIncrease ? 'bg-red-400' : 'bg-blue-400'}`} 
          style={{ width: `${widthPercent}%` }} 
        />
      </div>
      <div className={`text-xs ${isIncrease ? 'text-red-500' : 'text-blue-500'}`}>
        {impact}
      </div>
    </div>
  );
}
