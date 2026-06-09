import React, { useState, useEffect } from 'react';
import { Fiscal } from '../types.ts';
import { 
  obterFiscais, 
  cadastrarFiscal, 
  removerFiscal, 
  alterarStatusFiscal 
} from '../dbStore.ts';
import { Shield, Plus, Ban, Check, Trash2, ShieldCheck, UserCheck, Eye, EyeOff, Radio } from 'lucide-react';

interface AdminFiscaisProps {
  onToast: (text: string, type: 'sucesso' | 'erro' | 'info') => void;
}

export function AdminFiscais({ onToast }: AdminFiscaisProps) {
  const [fiscais, setFiscais] = useState<Fiscal[]>([]);
  
  // States do formulário
  const [nome, setNome] = useState('');
  const [badge, setBadge] = useState('');
  const [setor, setSetor] = useState('Portaria Principal');
  const [mostrandoAdd, setMostrandoAdd] = useState(false);

  useEffect(() => {
    carregarFiscais();
    const timer = setInterval(carregarFiscais, 1500);
    return () => clearInterval(timer);
  }, []);

  const carregarFiscais = () => {
    setFiscais(obterFiscais());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || !badge) {
      onToast('Preencha os campos obrigatórios.', 'erro');
      return;
    }
    
    cadastrarFiscal(nome.trim(), badge.trim().toUpperCase(), setor);
    onToast(`Fiscal "${nome}" cadastrado com sucesso com distintivo ${badge}!`, 'sucesso');
    setNome('');
    setBadge('');
    setSetor('Portaria Principal');
    setMostrandoAdd(false);
    carregarFiscais();
  };

  const handleExcluir = (id: string, nome: string) => {
    if (window.confirm(`Deseja revogar as credenciais e excluir permanentemente o Fiscal "${nome}"?`)) {
      removerFiscal(id);
      onToast(`Fiscal "${nome}" removido do sistema de portaria.`, 'info');
      carregarFiscais();
    }
  };

  const handleToggleStatus = (id: string, nome: string, statusAtual: 'Ativo' | 'Suspenso') => {
    const novoStatus = statusAtual === 'Ativo' ? 'Suspenso' : 'Ativo';
    alterarStatusFiscal(id, novoStatus);
    onToast(
      `Fiscal "${nome}" foi ${novoStatus === 'Ativo' ? 'reativado com sucesso!' : 'suspenso e bloqueado de validar ingressos.'}`, 
      novoStatus === 'Ativo' ? 'sucesso' : 'info'
    );
    carregarFiscais();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B1224] p-5 rounded-2xl border border-white/5">
        <div>
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Pessoal de Fiscalização</h4>
          <p className="text-xs text-slate-450 mt-1">Supervisione e credencie fiscais de portaria encarregados de escanear ingressos na entrada.</p>
        </div>

        <button
          onClick={() => setMostrandoAdd(!mostrandoAdd)}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#003893] hover:bg-[#0047bd] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Fiscal</span>
        </button>
      </div>

      {/* NEW FISCAL FORM */}
      {mostrandoAdd && (
        <form onSubmit={handleCreate} className="bg-[#050B1F] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 max-w-lg mx-auto text-slate-300">
          <div className="space-y-1">
            <h5 className="text-white font-display font-bold text-xs uppercase tracking-wide">Credenciar Novo Operador</h5>
            <p className="text-[10px] text-slate-450">Fiscais ativos recebem a permissão de ler QR Codes e autenticar bilhetes.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Nome Completo do Fiscal</label>
              <input type="text" required placeholder="Insira o nome do operador..." value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Código do Crachá / Distintivo</label>
              <input type="text" required placeholder="ex: FIS-502" value={badge} onChange={(e) => setBadge(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Setor de Alocação</label>
              <select value={setor} onChange={(e) => setSetor(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white">
                {['Portaria Principal', 'Acesso VIP', 'Portaria Cultural', 'Área de Imprensa', 'Estacionamento Diplomatas'].map(s => (
                  <option key={s} value={s} className="bg-[#050B1F] text-slate-205">{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
            <button type="button" onClick={() => setMostrandoAdd(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-300">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[#003893] hover:bg-[#0047bd] text-xs font-semibold rounded-xl text-white">Salvar e Registrar</button>
          </div>
        </form>
      )}

      {/* FISCAIS CARDS MATRIX */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fiscais.length > 0 ? (
          fiscais.map(f => (
            <div key={f.id} className={`bg-[#050B1F] p-5 rounded-3xl border shadow-lg flex flex-col justify-between space-y-4 transition-all relative overflow-hidden ${f.status === 'Suspenso' ? 'border-rose-500/20 opacity-75' : 'border-white/15 hover:border-white/20'}`}>
              
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${f.status === 'Suspenso' ? 'bg-rose-500/10 border-rose-500/20 text-rose-455' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="font-display font-medium text-white leading-tight">{f.nome}</h5>
                    <span className="text-[10px] text-slate-450 mt-0.5 tracking-wider block font-mono">DISTINTIVO: {f.badge} • {f.setor}</span>
                  </div>
                </div>

                {f.status === 'Ativo' ? (
                  <span className="text-[9px] font-bold text-emerald-450 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5 uppercase tracking-wide">Ativo</span>
                ) : (
                  <span className="text-[9px] font-bold text-rose-450 bg-rose-500/10 border border-rose-500/20 rounded-full px-2 py-0.5 uppercase tracking-wide">Suspenso</span>
                )}
              </div>

              {/* TIMELINE STATISTICS OF THIS MARSHAL */}
              <div className="bg-black/20 p-3 rounded-2xl border border-white/5 space-y-2 text-[11px] font-mono select-none">
                <div className="flex justify-between">
                  <span className="text-slate-450">Validações realizadas:</span>
                  <span className="text-emerald-400 font-bold">{f.checkinsCount} check-ins</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1.5">
                  <span className="text-slate-450">Último check-in ativo:</span>
                  <span className="text-slate-205">{f.ultimoAcesso || 'Nunca operou'}</span>
                </div>
              </div>

              {/* ACTION TOGGLERS */}
              <div className="flex gap-2 pt-2 border-t border-white/5">
                <button
                  onClick={() => handleToggleStatus(f.id, f.nome, f.status)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all border flex items-center justify-center gap-1 cursor-pointer ${f.status === 'Ativo' ? 'bg-rose-500/5 border-rose-500/15 text-rose-300 hover:bg-rose-500/15' : 'bg-emerald-500/5 border-emerald-500/15 text-emerald-400 hover:bg-emerald-500/15'}`}
                >
                  {f.status === 'Ativo' ? (
                    <>
                      <Ban className="w-3.5 h-3.5" />
                      <span>Suspender</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Ativar</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleExcluir(f.id, f.nome)}
                  className="px-2.5 py-1.5 rounded-lg border border-rose-650/30 text-rose-400 hover:bg-white/5 transition-all text-xs"
                  title="Deletar Fiscal"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12 text-slate-500 text-xs">Nenhum oficial de fiscalização credenciado.</div>
        )}
      </div>

    </div>
  );
}
