import React, { useState } from 'react';
import { LogAuditoria } from '../types.ts';
import { ShieldAlert, ShieldCheck, HelpCircle, Server, Activity, Radio, Signal, MapPin } from 'lucide-react';

interface AdminSecurityProps {
  logs: LogAuditoria[];
  onToast: (text: string, type: 'sucesso' | 'erro' | 'info') => void;
}

export function AdminSecurity({ logs, onToast }: AdminSecurityProps) {
  const [monitorVirtual, setMonitorVirtual] = useState<'OK' | 'ALERT'>('OK');

  // Filter out critical attempts
  const tentativasFraude = logs.filter(
    l => l.resultado === 'Não Oficial / Adulterado' || l.resultado === 'Já Utilizado'
  );

  // Security nodes locations stats
  const portariaNodes = [
    { name: 'Terminal Norte (Palácio)', status: 'Online', lat: '14.9126', lng: '-23.5113', ping: '12ms', load: '12%' },
    { name: 'Portal Sul (Assemléia Nacional)', status: 'Online', lat: '14.9189', lng: '-23.5097', ping: '18ms', load: '24%' },
    { name: 'Acesso VIP & Dignidades', status: 'Online', lat: '14.9142', lng: '-23.5135', ping: '8ms', load: '8%' },
    { name: 'Entrada Estaleiro Cultural', status: 'Online', lat: '14.9165', lng: '-23.5055', ping: '22ms', load: '42%' },
  ];

  return (
    <div className="space-y-6">

      {/* RADAR METADATA ACCENT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* RADAR FLASHER PANEL */}
        <div className="md:col-span-4 bg-gradient-to-br from-[#060D25] to-[#010515] p-6 rounded-3xl border border-red-500/25 shadow-2xl flex flex-col justify-between space-y-4 text-center items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.06),transparent_60%)] pointer-events-none" />
          
          <div className="space-y-1">
            <Radio className="w-8 h-8 text-rose-500 animate-pulse mx-auto" />
            <h5 className="font-display font-black text-rose-400 text-xs uppercase tracking-widest mt-1">SISTEMA ANTIFRAUDE ATIVO</h5>
            <p className="text-[10px] text-slate-450">Filtro de integridade criptográfica cripto-XOR habilitado</p>
          </div>

          <div className="relative w-28 h-28 border border-white/5 bg-black/45 rounded-full flex items-center justify-center">
            {/* Spinning radar hand */}
            <div className="absolute inset-0 bg-transparent rounded-full border-t border-rose-500/40 animate-spin" style={{ animationDuration: '4s' }} />
            <div className="absolute inset-2 border border-white/5 rounded-full" />
            <div className="absolute inset-6 border border-rose-500/10 rounded-full" />
            
            {/* Flashing target node */}
            {tentativasFraude.length > 0 && (
              <div className="absolute right-6 top-8 w-2 h-2 bg-red-500 rounded-full animate-ping" />
            )}
            
            <ShieldAlert className="w-10 h-10 text-rose-500/60" />
          </div>

          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-display font-bold text-white block">
              {tentativasFraude.length}
            </span>
            <span className="text-[9px] font-bold text-slate-400 tracking-wider block uppercase">Fraudes Interceptadas</span>
          </div>
        </div>

        {/* SECURITY TELEMETRY NODES */}
        <div className="md:col-span-8 bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">Nós de Validação Operacionais</h4>
            <p className="text-xs text-slate-450 mt-1">Mapeamento dinâmico e resposta do ping dos coletores de dados fotográficos e GPS instalados nas portarias.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            {portariaNodes.map((node, i) => (
              <div key={i} className="bg-black/20 p-3.5 rounded-2xl border border-white/5 flex items-center justify-between">
                <div className="flex gap-2.5">
                  <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                    <Server className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-slate-205 text-xs">{node.name}</h5>
                    <span className="text-[10px] text-slate-450 block font-mono">LAT: {node.lat} | LNG: {node.lng}</span>
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono whitespace-nowrap">
                  <span className="text-emerald-400 font-bold block">● {node.status}</span>
                  <span className="text-slate-455">Latência: {node.ping}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* DETAILED FRAUD ATTEMPTS LOG */}
      <div className="bg-[#050B1F] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-4 bg-[#0B1224] border-b border-white/10 flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Últimas Tentativas de Furto / Crachá Adulterado</span>
          </h4>
          <span className="text-[10px] font-mono text-slate-450 bg-black/25 border border-white/5 px-2.5 py-1 rounded-full">{tentativasFraude.length} ameaças registradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-black/15 font-bold text-slate-450 uppercase border-b border-white/5 select-none">
                <th className="px-6 py-3.5">Data / Hora</th>
                <th className="px-6 py-3.5 font-mono">Dispositivo Portaria</th>
                <th className="px-6 py-3.5">Assinatura de Retorno</th>
                <th className="px-6 py-3.5">Diagnóstico Técnico</th>
                <th className="px-6 py-3.5 text-right">Grau de Alerta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tentativasFraude.length > 0 ? (
                tentativasFraude.map((log) => (
                  <tr key={log.id} className="hover:bg-red-500/5 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-rose-455 font-bold block">{log.dataLeitura}</span>
                      <span className="text-[10px] text-slate-455 font-mono">{log.horaLeitura}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-350">{log.localValidacao}</td>
                    <td className="px-6 py-4">
                      {log.convidadoNome && log.convidadoNome !== 'Desconhecido' ? (
                        <div>
                          <div className="font-semibold text-white">{log.convidadoNome}</div>
                          <div className="text-[9px] text-slate-450 font-mono mt-0.5">CPF: {log.convidadoCpf}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-455 bg-rose-500/5 border border-rose-500/10 px-2 py-0.5 rounded">QR FALSO DETECTADO</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.resultado === 'Já Utilizado' ? (
                        <span className="font-mono text-amber-400 text-[10.5px]">CÓDIGO JÁ COMPUTADO: Multi-entrada bloqueada.</span>
                      ) : (
                        <span className="font-mono text-rose-450 text-[10.5px]">FALHA CRIPTO-XOR: Assinatura inválida (Adulteração).</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.resultado === 'Já Utilizado' ? (
                        <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 uppercase">MÉDIO</span>
                      ) : (
                        <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase">CRÍTICO</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-505">Nenhuma anomalia cibernética ou falsificação de QR Code identificada. Integridade e morabeza 100% garantidos.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
