import React from 'react';
import { Convidado } from '../types.ts';
import { Globe, Compass, Home, MapPin, Building2 } from 'lucide-react';

interface AdminDiasporaProps {
  convidados: Convidado[];
}

export function AdminDiaspora({ convidados }: AdminDiasporaProps) {
  
  // Calculate Diaspora country metrics
  const totalInscritosAtivos = convidados.filter(c => c.statusConvite === 'Ativo').length;
  
  const diasporaContadores: Record<string, number> = {};
  const ilhasContadores: Record<string, number> = {};

  convidados.forEach(c => {
    if (c.statusConvite === 'Ativo') {
      const pais = c.paisResidencia || 'Não informado';
      const ilha = c.ilhaOrigem || 'Santiago';
      diasporaContadores[pais] = (diasporaContadores[pais] || 0) + 1;
      ilhasContadores[ilha] = (ilhasContadores[ilha] || 0) + 1;
    }
  });

  const diasporaOrdenada = Object.entries(diasporaContadores)
    .map(([pais, qtd]) => ({
      pais,
      qtd,
      percentage: totalInscritosAtivos > 0 ? Math.round((qtd / totalInscritosAtivos) * 100) : 0
    }))
    .sort((a, b) => b.qtd - a.qtd);

  const ilhasOrdenadas = Object.entries(ilhasContadores)
    .map(([ilha, qtd]) => ({
      ilha,
      qtd,
      percentage: totalInscritosAtivos > 0 ? Math.round((qtd / totalInscritosAtivos) * 100) : 0
    }))
    .sort((a, b) => b.qtd - a.qtd);

  return (
    <div className="space-y-6">
      
      <div className="bg-[#0B1224] p-5 rounded-2xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Demografia dos Integrantes da Diáspora</h4>
          <p className="text-xs text-slate-450 mt-1">Monitore de onde vêm os cabo-verdianos do estrangeiro que confirmaram presença e suas raízes nas ilhas do país.</p>
        </div>
        <div className="bg-[#003893]/15 text-sky-400 border border-sky-500/20 px-3.5 py-1.5 rounded-xl font-mono text-xs font-bold shrink-0">
          Ativos na diáspora: {totalInscritosAtivos} convidados
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* COUNTRY OF RESIDENCE PROGRESS */}
        <div className="bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <h5 className="font-display font-bold text-sm text-white uppercase tracking-wider">País de Residência (Acolhimento)</h5>
          </div>

          <div className="space-y-3.5 pt-2">
            {diasporaOrdenada.length > 0 ? (
              diasporaOrdenada.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs select-none">
                    <span className="font-semibold text-slate-205 flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-[10px]">#{idx+1}</span>
                      {item.pais}
                    </span>
                    <span className="text-slate-400 font-mono font-bold">{item.qtd} ({item.percentage}%)</span>
                  </div>
                  {/* Custom progress bar */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-sky-500 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%` }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs text-center py-4">Sem dados demográficos carregados.</p>
            )}
          </div>
        </div>

        {/* ISLAND ARCHIPELAGO OF ORIGIN */}
        <div className="bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg space-y-4">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h5 className="font-display font-bold text-sm text-white uppercase tracking-wider">Raízes / Ilha de Origem em Cabo Verde</h5>
          </div>

          <div className="space-y-3.5 pt-2">
            {ilhasOrdenadas.length > 0 ? (
              ilhasOrdenadas.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-xs select-none">
                    <span className="font-semibold text-slate-205 flex items-center gap-1.5">
                      <span className="text-slate-500 font-mono text-[10px]">#{idx+1}</span>
                      Ilha de {item.ilha}
                    </span>
                    <span className="text-slate-400 font-mono font-bold">{item.qtd} ({item.percentage}%)</span>
                  </div>
                  {/* Custom progress bar in golden-yellow */}
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-amber-405 h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${item.percentage}%`, backgroundColor: '#FFD100' }} 
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-500 text-xs text-center py-4">Sem dados demográficos listados.</p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
