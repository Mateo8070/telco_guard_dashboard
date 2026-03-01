import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { SensorReading, SensorType } from '../types';
import { cn } from '../lib/utils';
import { Thermometer, Droplets, Wind, AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { format } from 'date-fns';

interface SensorCardProps {
  type: SensorType;
  current: number;
  unit: string;
  history: SensorReading[];
  threshold: number;
  className?: string;
}

const sensorConfig = {
  temperature: {
    label: 'Temperature',
    icon: Thermometer,
    color: '#ef4444',
    domain: [0, 60],
  },
  humidity: {
    label: 'Humidity',
    icon: Droplets,
    color: '#3b82f6',
    domain: [0, 100],
  },
  smoke: {
    label: 'Smoke / Fire',
    icon: Wind,
    color: '#10b981',
    domain: [0, 100],
  },
};

export const SensorCard: React.FC<SensorCardProps> = ({
  type,
  current,
  unit,
  history,
  threshold,
  className,
}) => {
  const config = sensorConfig[type];
  const Icon = config.icon;
  const isAlert = current > threshold;

  const stats = useMemo(() => {
    if (!history.length) return { min: 0, max: 0, avg: 0, trend: 'stable' };
    const values = history.map(h => h.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;

    const last = values[values.length - 1];
    const prev = values[values.length - 2] || last;
    const trend = last > prev ? 'up' : last < prev ? 'down' : 'stable';

    return { min, max, avg, trend };
  }, [history]);

  return (
    <div className={cn(
      "bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl p-5 flex flex-col gap-4 transition-all hover:border-[var(--border-hover)] shadow-sm duration-300",
      isAlert && "border-red-500/50 bg-red-500/5",
      className
    )}>
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2 rounded-lg bg-[var(--border-subtle)]",
            isAlert && "bg-red-500/20 text-red-500"
          )}>
            <Icon size={20} className={!isAlert ? "text-[var(--text-secondary)]" : ""} />
          </div>
          <div>
            <p className="text-xs font-mono uppercase tracking-wider text-[var(--text-muted)]">{config.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-semibold text-[var(--text-primary)]">
                {current.toFixed(1)}
                <span className="text-sm font-normal text-[var(--text-muted)] ml-1">{unit}</span>
              </h3>
              <div className={cn(
                "flex items-center text-[10px] font-bold",
                stats.trend === 'up' ? "text-red-400" : stats.trend === 'down' ? "text-emerald-400" : "text-gray-400"
              )}>
                {stats.trend === 'up' ? <TrendingUp size={12} /> : stats.trend === 'down' ? <TrendingDown size={12} /> : <Minus size={12} />}
              </div>
            </div>
          </div>
        </div>
        {isAlert && (
          <div className="flex items-center gap-1 text-red-500 animate-pulse">
            <AlertTriangle size={16} />
            <span className="text-[10px] font-bold uppercase">Critical</span>
          </div>
        )}
      </div>

      <div className="h-48 w-full mt-2 -ml-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isAlert ? '#ef4444' : config.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isAlert ? '#ef4444' : config.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
            <XAxis
              dataKey="timestamp"
              hide={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              tickFormatter={(time) => format(time, 'HH:mm')}
              minTickGap={30}
            />
            <YAxis
              hide={false}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 9 }}
              domain={config.domain}
              width={30}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '11px'
              }}
              itemStyle={{ color: 'var(--text-primary)', padding: '2px 0' }}
              labelStyle={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '4px' }}
              labelFormatter={(time) => format(time, 'MMM d, HH:mm:ss')}
              formatter={(value: number) => [`${value.toFixed(2)} ${unit}`, config.label]}
            />
            <ReferenceLine
              y={threshold}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{
                position: 'right',
                value: 'LIMIT',
                fill: '#ef4444',
                fontSize: 8,
                fontWeight: 'bold'
              }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isAlert ? '#ef4444' : config.color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#gradient-${type})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)]">
        <div className="flex flex-col">
          <span className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Min</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">{stats.min.toFixed(1)}{unit}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Avg</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">{stats.avg.toFixed(1)}{unit}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] text-[var(--text-muted)] uppercase font-mono">Max</span>
          <span className="text-xs font-bold text-[var(--text-primary)]">{stats.max.toFixed(1)}{unit}</span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-[10px] text-[var(--text-muted)] uppercase font-mono">Threshold: {threshold}{unit}</span>
        <span className={cn(
          "text-[10px] uppercase font-bold",
          isAlert ? "text-red-500" : "text-emerald-500"
        )}>
          {isAlert ? 'Critical Level' : 'Nominal'}
        </span>
      </div>
    </div>
  );
};
