import React, { useState, useEffect } from 'react';
import { AtividadeProgramacao } from '../types.ts';
import { 
  obterProgramacao, 
  cadastrarAtividade, 
  alterarStatusAtividade, 
  removerAtividade 
} from '../dbStore.ts';
import { Clock, Plus, Trash2, Calendar, UserCheck, AlertTriangle } from 'lucide-react';

interface AdminScheduleProps {
  onToast: (text: string, type: 'sucesso' | 'erro' | 'info') => void;
}

export function AdminSchedule({ onToast }: AdminScheduleProps) {
  const [grade, setGrade] = useState<AtividadeProgramacao[]>([]);
  
  // Create state
  const [titulo, setTitulo] = useState('');
  const [horario, setHorario] = useState('19:00');
  const [responsavel, setResponsavel] = useState('');
  const [mostrandoAdd, setMostrandoAdd] = useState(false);

  useEffect(() => {
    carregarGrade();
  }, []);

  const carregarGrade = () => {
    setGrade(obterProgramacao());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo || !horario || !responsavel) {
      onToast('Preencha todos os campos obrigatórios!', 'erro');
      return;
    }
    cadastrarAtividade(titulo.trim(), horario, responsavel.trim());
    onToast(`Atividade "${titulo}" agendada com sucesso na grade!`, 'sucesso');
    setTitulo('');
    setHorario('19:00');
    setResponsavel('');
    setMostrandoAdd(false);
    carregarGrade();
  };

  const handleStatusChange = (id: string, novoStatus: AtividadeProgramacao['status'], titulo: string) => {
    alterarStatusAtividade(id, novoStatus);
    onToast(`Status da atividade "${titulo}" atualizado para: ${novoStatus}!`, 'sucesso');
    carregarGrade();
  };

  const handleDeletar = (id: string, titulo: string) => {
    if (window.confirm(`Deseja remover a atividade "${titulo}" da grade de programação oficial do Palácio?`)) {
      removerAtividade(id);
      onToast(`Atividade "${titulo}" removida da grade.`, 'info');
      carregarGrade();
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER TOOLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B1224] p-5 rounded-2xl border border-white/5">
        <div>
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Gestão Cronológica de Atividades</h4>
          <p className="text-xs text-slate-450 mt-1 font-sans">Atualize e edite a programação do Palácio da Assembleia Nacional em tempo real para os convidados.</p>
        </div>

        <button
          onClick={() => setMostrandoAdd(!mostrandoAdd)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#003893] hover:bg-[#0047bd] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Atividade</span>
        </button>
      </div>

      {/* FORM AND TIMELINE CARDS */}
      {mostrandoAdd && (
        <form onSubmit={handleCreate} className="bg-[#050B1F] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 max-w-lg mx-auto text-slate-300 select-none">
          <div className="space-y-1">
            <h5 className="text-white font-display font-bold text-xs uppercase block">Adicionar Atração Solene</h5>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block col-span-2">Título da Atividade</label>
              <input type="text" required placeholder="Ex: Solo de Violão: Recordações de Cabo Verde" value={titulo} onChange={(e) => setTitulo(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Horário Estimado</label>
              <input type="text" required placeholder="Ex: 21:30" value={horario} onChange={(e) => setHorario(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Organizador / Responsável</label>
              <input type="text" required placeholder="Ex: Ministra da Cultura" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
            <button type="button" onClick={() => setMostrandoAdd(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-300">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[#003893] hover:bg-[#0047bd] text-xs font-semibold rounded-xl text-white font-display">Salvar Atividade</button>
          </div>
        </form>
      )}

      {/* CHRONOLOGICAL TIMELINE VERTICAL PATH */}
      <div className="space-y-4 max-w-3xl mx-auto">
        {grade.length > 0 ? (
          grade.map((act) => (
            <div key={act.id} className="bg-[#050B1F] p-4 sm:p-5 rounded-2xl border border-white/10 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden transition-all hover:border-white/20">
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 w-full">
                <div className="flex items-center gap-2 text-[#FFD100] bg-[#FFD100]/10 px-3 py-1.5 rounded-xl border border-indigo-500/10 font-mono text-xs font-extrabold shrink-0 select-none">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{act.horario}</span>
                </div>
                
                <div className="space-y-0.5">
                  <h5 className="font-display font-bold text-white text-sm leading-tight">{act.titulo}</h5>
                  <p className="text-[10.5px] text-slate-450">Apresentado por: <span className="font-medium text-slate-300">{act.responsavel}</span></p>
                </div>
              </div>

              {/* TIMELINE CONTROLLER DRAWER */}
              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-white/5">
                
                {/* SELECT STATUS CHANGER */}
                <select
                  value={act.status}
                  onChange={(e) => handleStatusChange(act.id, e.target.value as AtividadeProgramacao['status'], act.titulo)}
                  className={`px-2.5 py-1.5 rounded-lg border text-[10.5px] font-bold bg-black/35 focus:outline-none ${
                    act.status === 'Agendado' 
                      ? 'border-blue-500/25 text-blue-300' 
                      : act.status === 'Em andamento' 
                      ? 'border-emerald-500/25 text-emerald-400 font-extrabold animate-pulse' 
                      : act.status === 'Realizado' 
                      ? 'border-slate-800 text-slate-500 line-through' 
                      : 'border-rose-500/20 text-[#CE1126]'
                  }`}
                >
                  <option value="Agendado">Agendado</option>
                  <option value="Em andamento">Em Andamento</option>
                  <option value="Realizado">Realizado</option>
                  <option value="Atrasado">Atrasado</option>
                </select>

                <button
                  onClick={() => handleDeletar(act.id, act.titulo)}
                  className="p-1.5 border border-rose-500/20 hover:bg-rose-500/15 rounded-lg text-rose-455 hover:text-rose-300 transition-all cursor-pointer shrink-0"
                  title="Apagar Atração"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        ) : (
          <p className="text-center text-slate-505 py-8">Vazio. Nenhuma atividade cadastrada na grade.</p>
        )}
      </div>

    </div>
  );
}
