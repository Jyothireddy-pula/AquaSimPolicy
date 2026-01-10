
import React from 'react';
import { EcosystemStatus } from '../types';

interface RiverVisualizerProps {
  status: EcosystemStatus;
  pollution: number;
}

const RiverVisualizer: React.FC<RiverVisualizerProps> = ({ status, pollution }) => {
  const getRiverColor = () => {
    if (status === EcosystemStatus.COLLAPSED) return '#020617'; // slate-950
    if (pollution > 70) return '#422006'; // toxic brown
    if (pollution > 40) return '#164e63'; // stressed cyan
    return '#1e40af'; // healthy blue
  };

  const riverColor = getRiverColor();
  const fishSpeed = Math.max(0.4, (100 - pollution) / 20); 
  const particleCount = Math.floor(pollution / 2);

  return (
    <div className="relative w-full h-[400px] bg-slate-950 rounded-[4.5rem] overflow-hidden border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] group transition-all duration-1000 no-print">
      <svg className="w-full h-full" viewBox="0 0 800 250" preserveAspectRatio="none">
        <defs>
          <linearGradient id="riverGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={riverColor} stopOpacity="0.6" />
            <stop offset="100%" stopColor={riverColor} stopOpacity="0.95" />
          </linearGradient>
          <filter id="glow">
             <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
             </feMerge>
          </filter>
        </defs>

        {/* Dynamic Wave Layer */}
        <path d="M0 80 Q 200 20 400 80 T 800 80 L 800 250 L 0 250 Z" fill="url(#riverGradient)">
          <animate attributeName="d" dur="12s" repeatCount="indefinite" values="M0 80 Q 200 20 400 80 T 800 80 L 800 250 L 0 250 Z; M0 80 Q 200 140 400 80 T 800 80 L 800 250 L 0 250 Z; M0 80 Q 200 20 400 80 T 800 80 L 800 250 L 0 250 Z" />
        </path>
        
        {/* Toxicity Particles */}
        {pollution > 15 && [...Array(particleCount)].map((_, i) => (
          <circle key={i} r="1.5" fill={pollution > 60 ? "#713f12" : "#fff"} opacity="0.3">
             <animate attributeName="cx" from="-20" to="820" dur={`${5 + Math.random() * 8}s`} repeatCount="indefinite" begin={`${Math.random() * 10}s`} />
             <animate attributeName="cy" from="120" to="240" dur="4s" repeatCount="indefinite" values={`${120+Math.random()*60}; ${140+Math.random()*60}; ${120+Math.random()*60}`} />
          </circle>
        ))}

        {/* Aquatic Life Simulation */}
        <g className="transition-opacity duration-1000">
          {status !== EcosystemStatus.COLLAPSED && [...Array(status === EcosystemStatus.HEALTHY ? 8 : 4)].map((_, i) => (
            <text key={i} x="-40" y={130 + (i * 15)} fontSize="24" opacity={status === EcosystemStatus.HEALTHY ? 0.95 : 0.4} filter="url(#glow)">
              🐟
              <animate attributeName="x" from="-60" to="860" dur={`${18 / fishSpeed + Math.random() * 5}s`} repeatCount="indefinite" begin={`${i * 4}s`} />
            </text>
          ))}
          {status === EcosystemStatus.COLLAPSED && (
             <text x="50%" y="160" textAnchor="middle" fontSize="64" className="grayscale opacity-20">💀</text>
          )}
        </g>
      </svg>
      
      {/* Floating Status Indicator */}
      <div className="absolute top-12 left-12 flex flex-col gap-4">
         <div className="bg-slate-900/60 backdrop-blur-3xl px-8 py-4 rounded-[2rem] border border-white/10 shadow-2xl flex items-center gap-5">
            <div className={`w-4 h-4 rounded-full ${status === EcosystemStatus.HEALTHY ? 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]' : status === EcosystemStatus.STRESSED ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.6)]' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.7)]'} animate-pulse`}></div>
            <span className="text-[12px] font-black uppercase tracking-[0.4em] text-white">Biological State: {status}</span>
         </div>
      </div>
    </div>
  );
};

export default RiverVisualizer;
