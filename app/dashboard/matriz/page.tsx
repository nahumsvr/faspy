"use client";

import React, { useState } from 'react';
import { BadgeStatus } from '../../../components/ui/BadgeStatus';
import { Button } from '../../../components/ui/Button';
import { TactileSlider } from '../../../components/ui/TactileSlider';
import { SegmentedControl } from '../../../components/ui/SegmentedControl';

export default function MatrizDecisionPage() {
  const [monto, setMonto] = useState(1500000);
  const [necesidad, setNecesidad] = useState('capital');

  const necesidadesOptions = [
    { label: 'Capital de Trabajo', value: 'capital' },
    { label: 'Capex', value: 'capex' },
    { label: 'Gestión AR', value: 'gestion_ar' },
  ];

  // Cálculos simulados basados en el slider
  const liquidezInmediata = (monto * 0.92).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  const costoFinanciero = (monto * 0.08).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 text-white font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Matriz de Decisión & Underwriting</h1>
        <p className="text-gray-400 mt-2 text-sm">Simulador de motor de riesgo y estructuración de oferta financiera.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna 1: Entrada de Datos */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden flex flex-col gap-8">
          {/* Subtle top specular highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          <div>
            <h2 className="text-xl font-semibold text-gray-100 mb-8">Parámetros de Evaluación</h2>
            
            <div className="mb-10">
              <label className="block text-sm font-medium text-gray-400 mb-4">Tipo de Necesidad</label>
              <SegmentedControl 
                options={necesidadesOptions} 
                value={necesidad} 
                onChange={setNecesidad}
                className="w-full flex" 
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-4">Monto Anual Solicitado (MXN)</label>
              <TactileSlider 
                min={100000} 
                max={5000000} 
                value={monto} 
                onChange={setMonto} 
                unit=" MXN"
              />
            </div>
          </div>
          
          <div className="mt-auto pt-6 flex flex-col sm:flex-row gap-4">
            <Button variant="outlined" className="flex-1 text-sm">Simular otra empresa</Button>
            <Button variant="primary" className="flex-1 text-sm">Recalcular</Button>
          </div>
        </div>

        {/* Columna 2: Recomendación del Motor */}
        <div className="bg-gray-900/60 backdrop-blur-xl border border-primary/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,73,119,0.15)] relative overflow-hidden flex flex-col">
          {/* Direct specular highlight for Primary color */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/80 to-transparent" />
          
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-xl font-semibold text-white">Dictamen del Motor</h2>
            <BadgeStatus status="success">EcoStream Aprobado</BadgeStatus>
          </div>

          <div className="bg-gray-950/60 rounded-xl border border-gray-800 p-6 mb-8">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Producto Estructurado Recomendado</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Basado en un requerimiento para <strong className="text-white">{necesidadesOptions.find(o => o.value === necesidad)?.label}</strong> por un volumen anual de <strong className="text-white font-mono">{(monto).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</strong>, el motor aprueba una línea de factoraje revolvente en esquema <strong className="text-primary font-bold">EcoStream</strong>.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1">Liquidez Inmediata (Aforo 92%)</p>
              <p className="text-2xl font-mono font-bold text-secondary">{liquidezInmediata}</p>
            </div>
            <div className="bg-gray-800/40 rounded-xl p-5 border border-gray-700/50">
              <p className="text-xs text-gray-400 mb-1">Costo Financiero Estimado</p>
              <p className="text-2xl font-mono font-bold text-red-400">{costoFinanciero}</p>
            </div>
          </div>

          <div className="mt-auto">
            <div className="bg-secondary/10 border border-secondary/20 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Score Crediticio</p>
                <p className="text-xs text-secondary mt-1">Tier A - Riesgo Muy Bajo</p>
              </div>
              <div className="text-4xl font-mono font-bold text-white tracking-tight">92</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
