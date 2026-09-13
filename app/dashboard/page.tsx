import React from 'react';
import { MetricCard } from '../../components/ui/MetricCard';
import { Button } from '../../components/ui/Button';
import Link from 'next/link';

export default function DashboardHomePage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 text-white font-sans flex flex-col">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white font-sans mb-3">
          Centro de Operaciones EcoStream
        </h1>
        <p className="text-gray-400 text-sm max-w-3xl leading-relaxed">
          Bienvenido al centro de mando. Desde aquí puedes monitorear el estado global de la liquidez, revisar transacciones pendientes y gestionar el riesgo de tus clientes.
        </p>
      </div>

      {/* Vista General */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Vista General</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <MetricCard 
            title="Línea de Crédito Activa" 
            value="$10M MXN" 
            className="border-gray-800"
          />
          <MetricCard 
            title="Facturas en Revisión" 
            value="12" 
            className="border-gray-800"
          />
          <MetricCard 
            title="Nivel de Riesgo Promedio" 
            value="Bajo" 
            className="border-secondary/30 [&_p.font-mono]:!text-secondary shadow-[0_0_30px_rgba(16,185,129,0.15)]"
          />
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-xl font-semibold text-gray-100 mb-6">Acciones Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Card Acción 1 */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            {/* Specular highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            
            <h3 className="text-lg font-semibold text-white mb-2">Evaluar Nueva Factura</h3>
            <p className="text-sm text-gray-400 mb-8">
              Inicia el motor de simulación para validar cumplimiento fiscal (SAT 69-B, OFAC) y estructurar una oferta de factoraje.
            </p>
            <Link href="/dashboard/cumplimiento">
              <Button variant="primary" className="w-full sm:w-auto">
                Evaluar Factura
              </Button>
            </Link>
          </div>

          {/* Card Acción 2 */}
          <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden group">
            {/* Specular highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-secondary/60 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
            
            <h3 className="text-lg font-semibold text-white mb-2">Ver Matriz de Decisión</h3>
            <p className="text-sm text-gray-400 mb-8">
              Modela el costo financiero, los niveles de aforo y el score crediticio interactuando con el simulador de capital.
            </p>
            <Link href="/dashboard/matriz">
              <Button variant="outlined" className="w-full sm:w-auto">
                Abrir Matriz
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
