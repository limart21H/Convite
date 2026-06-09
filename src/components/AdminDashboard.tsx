import React, { useState, useEffect } from 'react';
import { DashboardStats, LogAuditoria } from '../types.ts';
import { Users, TicketCheck, FileClock, BookX, Radio, Clock, ShieldAlert, Sliders } from 'lucide-react';
import { motion } from 'motion/react';

interface AdminDashboardProps {
  stats: DashboardStats;
  logs: LogAuditoria[];
}

export function AdminDashboard({ stats, logs }: AdminDashboardProps) {
  const [tempoRegressivo, setTempoRegressivo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });

  // Calculate Countdown to Independence Celebration (July 5, 2026 21:00 UTC)
  useEffect(() => {
    const dataAlvo = new Date('2026-07-05T21:00:00Z').getTime();
    
    const atualizarCronometro = () => {
      const agora = new Date().getTime();
      const diferenca = dataAlvo - agora;

      if (diferenca > 0) {
        setTempoRegressivo({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        });
      } else {
        setTempoRegressivo({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
      }
    };

    atualizarCronometro();
    const timer = setInterval(atualizarCronometro, 1000);
    return () => clearInterval(timer);
  }, []);

  // Generate mock statistics hourly stream
  const checkinsPorHora = [
    { hora: '18h-19h', qtd: 24, percentual: '20%' },
    { hora: '19h-20h', qtd: 45, percentual: '38%' },
    { hora: '20h-21h', qtd: 98, percentual: '82%' },
    { hora: '21h-22h', qtd: 120, percentual: '100%' },
    { hora: '22h-23h', qtd: 64, percentual: '53%' },
    { hora: '23h-00h', qtd: 15, percentual: '12%' },
  ];

  return (
    <div className="space-y-6">
      
      {/* COUNTDOWN BANNER */}
      <div className="bg-gradient-to-r from-[#003893] via-[#051138] to-[#0A1A4A] p-5 sm:p-6 rounded-3xl border border-white/15 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden select-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-1 z-10 text-center md:text-left">
          <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase bg-amber-400/10 px-2.5 py-1 rounded-full border border-amber-400/20">
            SOLENIDADE DE INDEPENDÊNCIA 2026
          </span>
          <h3 className="text-xl sm:text-2xl font-display font-black tracking-tight mt-1">
            Festa da Independência Nacional de Cabo Verde
          </h3>
          <p className="text-xs text-slate-350 max-w-lg">
            Solenidade oficial e festival de acolhimento em Praia, Ilha de Santiago. Celebrando 51 anos de histórias e livre soberania.
          </p>
        </div>
        
        {/* TIMER DISPLAY */}
        <div className="grid grid-cols-4 gap-3 text-center shrink-0 z-10">
          {[
            { label: 'DIAS', val: tempoRegressivo.dias },
            { label: 'HORAS', val: tempoRegressivo.horas },
            { label: 'MINUTOS', val: tempoRegressivo.minutos },
            { label: 'SEGUNDOS', val: tempoRegressivo.segundos },
          ].map((t, idx) => (
            <div key={idx} className="bg-black/35 rounded-2xl p-2.5 sm:p-3.5 border border-white/10 w-16 sm:w-20 shadow-md">
              <span className="text-xl sm:text-2xl font-display font-black text-amber-400 tracking-tight block">
                {String(t.val).padStart(2, '0')}
              </span>
              <span className="text-[9px] font-bold text-slate-400 tracking-wider block mt-0.5">
                {t.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {[
          { label: 'Cadastros', val: stats.totalCadastrados, icon: Users, desc: 'Inscrições Totais', color: 'text-amber-400 bg-amber-400/10' },
          { label: 'Emitidos', val: stats.totalCadastrados, icon: Sliders, desc: 'Convites Gerados', color: 'text-blue-400 bg-blue-400/10' },
          { label: 'Presenças', val: stats.totalUtilizados, icon: TicketCheck, desc: 'Participantes Ativos', color: 'text-emerald-400 bg-emerald-500/10' },
          { label: 'Pendentes', val: stats.totalPendentes, icon: FileClock, desc: 'Check-ins Aguardados', color: 'text-indigo-400 bg-indigo-400/10' },
          { label: 'Revogados', val: stats.totalCancelados, icon: BookX, desc: 'Acessos Bloqueados', color: 'text-rose-450 bg-rose-500/10' },
          { label: 'Fraudes', val: stats.totalFraudes, icon: ShieldAlert, desc: 'Auditorias Rejeitadas', color: 'text-rose-400 bg-rose-600/10' },
          { label: 'Fiscais', val: stats.totalFiscaisAtivos, icon: Radio, desc: 'Operadores Ativos', color: 'text-cyan-400 bg-cyan-400/10' },
          { label: 'Acessos', val: stats.totalAcessos, icon: Clock, desc: 'Visitas ao Painel', color: 'text-slate-400 bg-white/5' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-[#050B1F] p-4 rounded-2xl border border-white/10 shadow-md flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-slate-450 uppercase tracking-wider block">{kpi.label}</span>
              <div className={`p-1.5 rounded ${kpi.color}`}>
                <kpi.icon className="w-3.5 h-3.5" />
              </div>
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-display font-extrabold text-white block leading-none">
                {kpi.val}
              </span>
              <span className="text-[9px] text-slate-450 truncate block mt-1">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* CHARTS CONTAINER */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* PROGRESS RING */}
        <div className="lg:col-span-4 bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">Comparecimento</h4>
            <p className="text-[11px] text-slate-450 mt-1 leading-relaxed">
              Indica a taxa global de ingressos que realizaram check-in na portaria do Palácio em relação aos aprovados.
            </p>
          </div>

          <div className="flex items-center justify-center p-2 relative">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" 
                  stroke="#FFD100" 
                  strokeWidth="3" 
                  strokeDasharray={`${stats.taxaComparecimento} ${100 - stats.taxaComparecimento}`} 
                  strokeDashoffset="0" 
                  strokeLinecap="round"
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-display font-black text-white tracking-tighter">
                  {stats.taxaComparecimento}%
                </span>
                <span className="text-[8px] font-bold text-slate-450 uppercase tracking-widest mt-0.5">CHECK-IN</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-[10px] bg-black/20 p-2.5 rounded-xl border border-white/5 font-mono">
            <div>
              <span className="text-emerald-400 font-bold block">{stats.totalUtilizados}</span>
              <span className="text-slate-450">Presenças</span>
            </div>
            <div className="border-l border-white/10">
              <span className="text-amber-400 font-bold block">{stats.totalPendentes}</span>
              <span className="text-slate-450">Faltas</span>
            </div>
          </div>
        </div>

        {/* TIME GRAPH SCHEDULER SIMULATION */}
        <div className="lg:col-span-8 bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-display font-bold text-white uppercase tracking-wider">Fluxo de Entradas por Horas</h4>
            <p className="text-[11px] text-slate-450 mt-1">
              Volume estatístico de acessos validados na portaria principal por faixa de horário.
            </p>
          </div>

          <div className="h-44 flex items-end gap-3 sm:gap-4 md:gap-5 px-2 pt-6">
            {checkinsPorHora.map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                <div className="text-[9px] font-mono font-semibold text-slate-450 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {bar.qtd}
                </div>
                
                {/* Dynamically sizing bar */}
                <div 
                  style={{ height: bar.percentual }} 
                  className="w-full bg-gradient-to-t from-[#003893] to-amber-400 rounded-t-md hover:from-sky-500 hover:to-amber-300 transition-all duration-1000 min-h-[4px] relative"
                >
                  <div className="absolute inset-x-0 top-0 h-[2px] bg-white/20" />
                </div>

                <div className="text-[9px] scroll-none whitespace-nowrap font-mono text-slate-400 font-medium select-none">
                  {bar.hora}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
