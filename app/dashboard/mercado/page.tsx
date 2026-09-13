import React from 'react';
import { MetricCard } from '../../../components/ui/MetricCard';
import { BadgeStatus } from '../../../components/ui/BadgeStatus';

export default function MercadoPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 text-white font-sans flex flex-col">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans mb-3">
          Dimensionamiento de Mercado (TAM / SAM / SOM)
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl leading-relaxed">
          Proyección estratégica del mercado de factoraje en México y la oportunidad de penetración comercial para EcoStream.
        </p>
      </div>

      {/* Main Grid TAM / SAM / SOM */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
        {/* TAM */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-800 to-gray-700 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <MetricCard 
            title="Mercado Total B2B (TAM)" 
            value="$500B MXN" 
            className="relative h-full"
          />
        </div>

        {/* SAM */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-700 to-gray-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-500"></div>
          <MetricCard 
            title="PyMEs con facturación electrónica (SAM)" 
            value="$150B MXN" 
            className="relative h-full"
          />
        </div>

        {/* SOM */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-secondary/50 to-primary/50 rounded-2xl blur opacity-40 group-hover:opacity-70 transition duration-500"></div>
          <MetricCard 
            title="Objetivo EcoStream Año 1 (SOM)" 
            value="$5B MXN" 
            className="relative h-full border-secondary/30 [&_p.font-mono]:!text-secondary"
          />
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-4 flex items-center border-t border-gray-800/60 pt-6">
        <BadgeStatus status="success">
          Fuente: Datos INEGI / SAT 2025
        </BadgeStatus>
      </div>
    </div>
  );
}
