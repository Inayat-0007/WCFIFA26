'use client';

import React, { useState } from 'react';
import { useTheme } from '@/context/ThemeContext';

interface MatchPerformance {
  id: string;
  fantasyPoints: number;
  goals: number;
  assists: number;
  cleanSheet: boolean;
  match: {
    id: string;
    homeTeam: string;
    awayTeam: string;
    kickoffTime: string;
    status: string;
  };
}

interface PlayerPerformanceChartProps {
  matchPlayers: MatchPerformance[];
  playerCountry: string;
}

export function PlayerPerformanceChart({ matchPlayers, playerCountry }: PlayerPerformanceChartProps) {
  const { theme } = useTheme();
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);

  // Filter out matches that are not scheduled (status DRAFT or not played yet can have 0 points, but let's sort chronologically)
  const sortedPerformances = [...matchPlayers]
    .filter(p => p.match.status === 'COMPLETED' || p.match.status === 'LIVE')
    .sort((a, b) => new Date(a.match.kickoffTime).getTime() - new Date(b.match.kickoffTime).getTime());

  if (sortedPerformances.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 rounded-xl bg-white/[0.02] border border-white/5 text-center p-4">
        <span className="text-2xl mb-1">📊</span>
        <p className="text-xs text-gray-400">No match data available yet for this tournament.</p>
      </div>
    );
  }

  // Chart configuration
  const width = 500;
  const height = 180;
  const paddingX = 40;
  const paddingY = 30;

  const points = sortedPerformances.map(p => p.fantasyPoints);
  const maxPoints = Math.max(10, ...points);
  const minPoints = Math.min(0, ...points);
  const range = maxPoints - minPoints;

  const getX = (index: number) => {
    if (sortedPerformances.length === 1) return width / 2;
    return paddingX + (index * (width - 2 * paddingX)) / (sortedPerformances.length - 1);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minPoints) * (height - 2 * paddingY)) / range;
  };

  // Build SVG path
  let pathD = '';
  sortedPerformances.forEach((perf, idx) => {
    const x = getX(idx);
    const y = getY(perf.fantasyPoints);
    if (idx === 0) {
      pathD += `M ${x} ${y}`;
    } else {
      // Smooth curve or straight line. Let's do a smooth cubic bezier.
      const prevX = getX(idx - 1);
      const prevY = getY(sortedPerformances[idx - 1].fantasyPoints);
      const cpX1 = prevX + (x - prevX) / 2;
      const cpY1 = prevY;
      const cpX2 = prevX + (x - prevX) / 2;
      const cpY2 = y;
      pathD += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${x} ${y}`;
    }
  });

  // Theme colors
  const strokeColor = theme === 'dark' ? '#10B981' : '#059669'; // Emerald
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-slate-500';
  const tooltipBg = theme === 'dark' ? 'bg-[var(--bg-subtle)] border-primary-500/30' : 'bg-white border-slate-200 shadow-md';
  const tooltipText = theme === 'dark' ? 'text-white' : 'text-slate-900';

  return (
    <div className="relative w-full overflow-hidden">
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-1.5">
        📈 Performance Trend (Fantasy Points)
      </h3>

      <div className="w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-[400px] relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full overflow-visible">
            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const val = minPoints + r * range;
              const y = getY(val);
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={width - paddingX}
                    y2={y}
                    stroke={gridColor}
                    strokeDasharray="4 4"
                  />
                  <text
                    x={paddingX - 10}
                    y={y + 4}
                    textAnchor="end"
                    fontSize="9"
                    className={`fill-current ${labelColor} font-semibold`}
                  >
                    {Math.round(val)}
                  </text>
                </g>
              );
            })}

            {/* Area under curve */}
            {sortedPerformances.length > 1 && (
              <path
                d={`${pathD} L ${getX(sortedPerformances.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`}
                fill={theme === 'dark' ? 'url(#area-grad-dark)' : 'url(#area-grad-light)'}
                opacity="0.15"
              />
            )}

            {/* Main Curve Line */}
            <path
              d={pathD}
              fill="none"
              stroke={`url(#line-grad)`}
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Gradient Definitions */}
            <defs>
              <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="50%" stopColor="#059669" />
                <stop offset="100%" stopColor="#06B6D4" />
              </linearGradient>
              <linearGradient id="area-grad-dark" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="area-grad-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Interactive Data Points */}
            {sortedPerformances.map((perf, idx) => {
              const x = getX(idx);
              const y = getY(perf.fantasyPoints);
              const isHovered = hoveredPoint === idx;

              return (
                <g key={perf.id} className="cursor-pointer">
                  {/* Invisible capture area */}
                  <circle
                    cx={x}
                    cy={y}
                    r="12"
                    fill="transparent"
                    onMouseEnter={() => setMounted(idx)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  {/* Visible glowing point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? '7' : '4'}
                    fill={isHovered ? '#E63946' : strokeColor}
                    stroke={theme === 'dark' ? '#0B0B0C' : '#FAF9F6'}
                    strokeWidth="1.5"
                    className="transition-all duration-150"
                  />
                  {isHovered && (
                    <circle
                      cx={x}
                      cy={y}
                      r="12"
                      fill="none"
                      stroke="#E63946"
                      strokeWidth="1"
                      opacity="0.4"
                      className="animate-ping"
                    />
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Tooltip Overlay */}
      {hoveredPoint !== null && sortedPerformances[hoveredPoint] && (
        <div
          className={`absolute top-1 right-2 p-2.5 rounded-lg border text-[11px] leading-snug z-20 ${tooltipBg} ${tooltipText} transition-opacity duration-200`}
        >
          <div className="font-bold border-b pb-1 mb-1 border-white/10 flex justify-between gap-4">
            <span>Vs {sortedPerformances[hoveredPoint].match.homeTeam === playerCountry 
              ? sortedPerformances[hoveredPoint].match.awayTeam 
              : sortedPerformances[hoveredPoint].match.homeTeam}
            </span>
            <span className="text-primary font-black">⭐ {sortedPerformances[hoveredPoint].fantasyPoints} pts</span>
          </div>
          <div className="space-y-0.5 font-semibold text-gray-400">
            {sortedPerformances[hoveredPoint].goals > 0 && (
              <p className="text-emerald-400">⚽ Goals: {sortedPerformances[hoveredPoint].goals}</p>
            )}
            {sortedPerformances[hoveredPoint].assists > 0 && (
              <p className="text-emerald-400">👟 Assists: {sortedPerformances[hoveredPoint].assists}</p>
            )}
            {sortedPerformances[hoveredPoint].cleanSheet && (
              <p className="text-blue-400">🛡️ Clean Sheet: Yes</p>
            )}
            {!sortedPerformances[hoveredPoint].goals && !sortedPerformances[hoveredPoint].assists && (
              <p>Minutes played, key stats only</p>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Setter helper
  function setMounted(idx: number) {
    setHoveredPoint(idx);
  }
}
