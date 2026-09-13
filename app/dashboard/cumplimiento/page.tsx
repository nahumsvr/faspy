import React from 'react';
import { MetricCard } from '../../../components/ui/MetricCard';
import { BadgeStatus } from '../../../components/ui/BadgeStatus';
import { Button } from '../../../components/ui/Button';

// Mock data para las facturas (simulado)
const recentInvoices = [
  { id: 'F-2023-001', rfc: 'XAXX010101000', amount: '$45,000.00', date: '2023-10-25', status: 'success', statusLabel: 'Validado', ofac: 'success', ofacLabel: 'Cleared' },
  { id: 'F-2023-002', rfc: 'BARD950101AAA', amount: '$12,500.00', date: '2023-10-24', status: 'error', statusLabel: '69-B Definitivo', ofac: 'success', ofacLabel: 'Cleared' },
  { id: 'F-2023-003', rfc: 'CUPU800825569', amount: '$8,200.00', date: '2023-10-23', status: 'warning', statusLabel: 'Revisión', ofac: 'warning', ofacLabel: 'Flagged' },
  { id: 'F-2023-004', rfc: 'GOMM901012XXX', amount: '$120,000.00', date: '2023-10-23', status: 'success', statusLabel: 'Validado', ofac: 'success', ofacLabel: 'Cleared' },
];

export default function CumplimientoPage() {
  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 text-white font-sans">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white font-sans">Centro de Cumplimiento</h1>
          <p className="text-gray-400 mt-2 text-sm">Monitoreo en tiempo real de validaciones fiscales y prevención de lavado de dinero (PLD).</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outlined" className="px-4 py-2 text-sm">Exportar Reporte</Button>
          <Button variant="primary" className="px-4 py-2 text-sm">Nueva Validación</Button>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
        <MetricCard title="Tasa de Aprobación Fiscal" value="94.2%" trend={1.2} />
        <MetricCard title="Alertas 69-B (Mes)" value="3" trend={-0.5} />
        <MetricCard title="Verificación OFAC" value="100%" />
        <MetricCard title="Tiempo de Resolución" value="1.2s" trend={-0.2} />
      </div>

      {/* Data Rows - Listado de Facturas */}
      <div className="bg-gray-900/60 backdrop-blur-xl border border-gray-800/80 rounded-2xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle top specular highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-semibold text-gray-100">Validaciones Recientes</h2>
          <Button variant="secondary" className="px-4 py-1.5 text-xs">Ver Todas</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wider">
                <th className="pb-4 font-semibold px-4">ID Factura</th>
                <th className="pb-4 font-semibold px-4">RFC Emisor</th>
                <th className="pb-4 font-semibold px-4">Monto</th>
                <th className="pb-4 font-semibold px-4">Fecha</th>
                <th className="pb-4 font-semibold px-4">Estado SAT</th>
                <th className="pb-4 font-semibold px-4">Estado OFAC</th>
                <th className="pb-4 font-semibold px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/50">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-4 font-mono text-sm text-gray-200">{inv.id}</td>
                  <td className="py-4 px-4 font-mono text-sm text-gray-400">{inv.rfc}</td>
                  <td className="py-4 px-4 font-mono text-sm font-medium text-white">{inv.amount}</td>
                  <td className="py-4 px-4 text-sm text-gray-400">{inv.date}</td>
                  <td className="py-4 px-4">
                    <BadgeStatus status={inv.status as 'success' | 'error' | 'warning'}>{inv.statusLabel}</BadgeStatus>
                  </td>
                  <td className="py-4 px-4">
                    <BadgeStatus status={inv.ofac as 'success' | 'error' | 'warning'}>{inv.ofacLabel}</BadgeStatus>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Button variant="outlined" className="!px-3 !py-1 text-xs">Detalle</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
