import React from 'react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  description: string;
  scoreType?: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, icon, color, trend, description, scoreType }) => {
  const getScoreColor = (val: number) => {
    if (val < 40) return 'text-rose-600 bg-rose-50 border-rose-200';
    if (val < 70) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const scoreLabel = (val: number) => {
    if (val < 40) return 'Critical Risk';
    if (val < 70) return 'Monitor';
    return 'Sustainable';
  };

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${scoreType ? 'ring-1 ring-slate-200' : 'border-slate-100'}`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${color} bg-opacity-10 text-${color.split('-')[1]}-600`}>
          {icon}
        </div>
        {scoreType ? (
          <span className={`text-[10px] font-bold px-3 py-1 rounded-full border shadow-sm ${getScoreColor(Number(value))}`}>
            {scoreLabel(Number(value))}
          </span>
        ) : trend && (
           <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black tracking-tighter ${
             trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 
             trend === 'down' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-500'
           }`}>
             {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trend.toUpperCase()}
           </div>
        )}
      </div>
      <div className="space-y-0.5">
        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">{label}</p>
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          {unit && <span className="text-slate-400 font-bold text-xs">{unit}</span>}
        </div>
        <p className="text-[11px] text-slate-500 leading-snug pt-2 font-medium border-t border-slate-50 mt-2">{description}</p>
      </div>
    </div>
  );
};

export default MetricCard;