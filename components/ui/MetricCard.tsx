import React from 'react';

export interface MetricCardProps {
  title: string;
  value: string | number;
  trend?: number;
  className?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  className = '',
}) => {
  const isPositive = trend !== undefined && trend > 0;
  const isNegative = trend !== undefined && trend < 0;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gray-900/80 backdrop-blur-md border border-neutral/40 p-6 shadow-xl ${className}`}
    >
      {/* Direct specular highlight simulación */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="flex flex-col gap-1">
        <h3 className="font-sans text-sm font-medium text-gray-400">
          {title}
        </h3>
        
        <div className="flex items-baseline gap-3 mt-1">
          <p className="font-mono text-3xl font-semibold text-white tracking-tight">
            {value}
          </p>
          
          {trend !== undefined && (
            <span
              className={`font-sans text-sm font-semibold ${
                isPositive ? 'text-secondary' : isNegative ? 'text-red-400' : 'text-neutral'
              }`}
            >
              {isPositive ? '+' : ''}{trend}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
