import React from 'react';

export interface TactileSliderProps {
  min: number;
  max: number;
  value: number;
  onChange: (val: number) => void;
  label?: string;
  unit?: string;
  className?: string;
}

export const TactileSlider: React.FC<TactileSliderProps> = ({
  min,
  max,
  value,
  onChange,
  label,
  unit = '',
  className = '',
}) => {
  // Asegurar que el porcentaje siempre esté entre 0 y 100
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));

  return (
    <div className={`flex flex-col gap-3 w-full ${className}`}>
      {/* Encabezado: Etiqueta y Valor */}
      <div className="flex justify-between items-center">
        {label ? (
          <span className="font-sans text-sm font-medium text-gray-400">
            {label}
          </span>
        ) : (
          <div /> // Espaciador si no hay etiqueta
        )}
        <span className="font-mono text-lg font-bold text-white tracking-tight">
          {value}{unit}
        </span>
      </div>

      {/* Contenedor del Slider */}
      <div className="relative h-8 flex items-center group">
        {/* Riel hundido (Sunken Track) */}
        <div className="absolute w-full h-3 rounded-full bg-gray-950 shadow-[inset_0_2px_6px_rgba(0,0,0,0.8)] border border-gray-800/80 overflow-hidden">
          {/* Parte activa del riel (Fill) usando Secondary */}
          <div
            className="absolute top-0 left-0 h-full bg-secondary shadow-[0_0_8px_rgba(16,185,129,0.3)]"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input Range Nativo (Invisible, para manejar eventos y accesibilidad) */}
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Thumb (Pill Extruded - Claymorphic) */}
        <div
          className="absolute h-6 w-6 rounded-full bg-gray-200 border border-white/60 pointer-events-none z-0 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.6),inset_0_-2px_4px_rgba(0,0,0,0.15),inset_0_3px_5px_rgba(255,255,255,1)] flex items-center justify-center transition-transform duration-75 group-active:scale-95"
          style={{
            left: `calc(${percentage}% - 12px)`, // -12px para centrar el thumb (w-6 = 24px)
          }}
        >
          {/* Detalle interno del thumb (grip) */}
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400/40 shadow-inner" />
        </div>
      </div>
    </div>
  );
};
