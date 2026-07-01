import React from 'react';

export default function RiskBadge({ riskLabel }: { riskLabel: string }) {
  let bgClass = 'bg-[#F2E8DF] text-[#8A7E76]'; // Pending/Unknown
  if (riskLabel === 'Low') bgClass = 'bg-[#E1EAE1] text-[#698B75]'; // Soft sage green
  if (riskLabel === 'Medium') bgClass = 'bg-[#F9E8D1] text-[#9A7642]'; // Warm ochre
  if (riskLabel === 'High') bgClass = 'bg-[#F2D7D3] text-[#A65B54]'; // Soft terra cotta

  return (
    <span className={`text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-md ${bgClass}`}>
      {riskLabel}
    </span>
  );
}
