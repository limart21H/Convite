import React, { useState, useEffect } from 'react';
import { MensagemMural } from '../types.ts';
import { 
  obterMural, 
  cadastrarNoMural, 
  alterarStatusMural, 
  removerMensagemMural 
} from '../dbStore.ts';
import { Play, Check, X, Plus, Trash2, Sliders, PlayCircle, Minimize2, Radio, Heart } from 'lucide-react';

interface AdminMuralProps {
  onToast: (text: string, type: 'sucesso' | 'erro' | 'info') => void;
}

export function AdminMural({ onToast }: AdminMuralProps) {
  const [mensagens, setMensagens] = useState<MensagemMural[]>([]);
  
  // Create message state
  const [autor, setAutor] = useState('');
  const [origem, setOrigem] = useState('Lisboa');
  const [mens, setMens] = useState('');
  const [mostrandoAdd, setMostrandoAdd] = useState(false);

  // Projection Screen Wall Mode State (fullscreen style overlay)
  const [modoTelao, setModoTelao] = useState(false);

  useEffect(() => {
    carregarMural();
    const interval = setInterval(carregarMural, 2000);
    return () => clearInterval(interval);
  }, []);

  const carregarMural = () => {
    setMensagens(obterMural());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autor || !mens) {
      onToast('Preencha os campos obrigatórios.', 'erro');
      return;
    }
    cadastrarNoMural(autor.trim(), origem.trim(), mens.trim());
    onToast('Mensagem enviada com sucesso para a fila de moderação!', 'sucesso');
    setAutor('');
    setOrigem('Praia');
    setMens('');
    setMostrandoAdd(false);
    carregarMural();
  };

  const handleAprovar = (id: string) => {
    alterarStatusMural(id, 'Aprovado');
    onToast('Mensagem aprovada e enviada para o telão oficial do Palácio!', 'sucesso');
    carregarMural();
  };

  const handleRejeitar = (id: string) => {
    alterarStatusMural(id, 'Rejeitado');
    onToast('Mensagem rejeitada e ocultada do telão.', 'info');
    carregarMural();
  };

  const handleExcluir = (id: string) => {
    if (window.confirm('Excluir permanentemente este depoimento?')) {
      removerMensagemMural(id);
      onToast('Mensagem excluída com sucesso.', 'info');
      carregarMural();
    }
  };

  // Only approved sentiments scroll on the giant live projection screen
  const aprovadas = mensagens.filter(m => m.status === 'Aprovado');

  return (
    <div className="space-y-6">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B1224] p-5 rounded-2xl border border-white/5 select-none no-print">
        <div>
          <h4 className="font-display font-bold text-sm text-white uppercase tracking-wider">Mural da Independência & Telão</h4>
          <p className="text-xs text-slate-450 mt-1">Modere mensagens de felicitações enviadas pela comunidade cabo-verdiana da diáspora.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={() => setModoTelao(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-450 to-[#FFD100] text-neutral-950 text-xs font-black rounded-xl hover:shadow-[0_0_15px_rgba(255,209,0,0.3)] transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <PlayCircle className="w-4 h-4" />
            <span>EXIBIR EM MODO TELÃO</span>
          </button>

          <button
            onClick={() => setMostrandoAdd(!mostrandoAdd)}
            className="px-4 py-2.5 bg-[#003893] hover:bg-[#0047bd] text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Mensagem</span>
          </button>
        </div>
      </div>

      {/* QUICK SUBMIT SENTIMENT FORM */}
      {mostrandoAdd && (
        <form onSubmit={handleCreate} className="bg-[#050B1F] p-5 rounded-2xl border border-white/10 shadow-xl space-y-4 max-w-lg mx-auto text-slate-350 select-none no-print">
          <h5 className="font-display font-bold text-xs uppercase text-white">Adicionar Novo Depoimento</h5>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Autor do Envio</label>
              <input type="text" required placeholder="Ex: Lucas Semedo" value={autor} onChange={(e) => setAutor(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Origem / Cidade de Residência</label>
              <input type="text" required placeholder="Ex: Boston, EUA" value={origem} onChange={(e) => setOrigem(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-[10px] font-bold text-slate-455 uppercase block">Frase de Soberania (Mensagem)</label>
              <textarea required rows={3} placeholder="Escreva o depoimento sobre orgulho nacional..." value={mens} onChange={(e) => setMens(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
            <button type="button" onClick={() => setMostrandoAdd(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-305">Cancelar</button>
            <button type="submit" className="px-5 py-2 bg-[#003893] hover:bg-[#0047bd] text-xs font-bold rounded-xl text-white font-display">Enviar para Avaliação</button>
          </div>
        </form>
      )}

      {/* MODERATION GRID QUEUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 no-print">
        {mensagens.length > 0 ? (
          mensagens.map(m => (
            <div key={m.id} className={`bg-[#050B1F] p-5 rounded-3xl border shadow-lg flex flex-col justify-between space-y-4 relative overflow-hidden transition-all duration-300 ${m.status === 'Pendente' ? 'border-amber-500/20' : m.status === 'Aprovado' ? 'border-emerald-500/20' : 'border-rose-500/15 opacity-60'}`}>
              
              <div className="space-y-1.5">
                <blockquote className="text-slate-100 font-medium italic text-xs leading-relaxed">
                  "{m.texto}"
                </blockquote>
                
                <div className="flex justify-between items-center text-[10px] pt-1.5">
                  <span className="font-display font-bold text-slate-300">{m.autor} — <span className="text-[#FFD100]">{m.origem}</span></span>
                  <span className="text-slate-450 font-mono italic">{m.dataEnvio}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div>
                  {m.status === 'Pendente' ? (
                    <span className="text-[10px] font-bold text-amber-450 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Moderação Pendente</span>
                  ) : m.status === 'Aprovado' ? (
                    <span className="text-[10px] font-bold text-emerald-450 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Aprovado p/ Telão</span>
                  ) : (
                    <span className="text-[10px] font-bold text-rose-455 bg-rose-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">Rejeitado</span>
                  )}
                </div>

                <div className="flex gap-1.5">
                  {m.status !== 'Aprovado' && (
                    <button onClick={() => handleAprovar(m.id)} className="p-1 px-1.5 border border-[#003893]/40 hover:bg-[#003893]/15 text-sky-400 rounded transition-all text-[9.5px] font-bold uppercase" title="Autorizar e projetar">Aprovar</button>
                  )}
                  {m.status !== 'Rejeitado' && (
                    <button onClick={() => handleRejeitar(m.id)} className="p-1 px-1.5 border border-rose-500/20 hover:bg-rose-500/10 rounded text-rose-400 transition-all text-[9.5px] font-bold uppercase" title="Ocultar do telão">Recusar</button>
                  )}
                  <button onClick={() => handleExcluir(m.id)} className="p-1 px-1.5 border border-rose-600/20 hover:bg-rose-600/15 text-rose-350 rounded transition-all text-[9.5px] font-bold uppercase" title="Excluir do banco"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>

            </div>
          ))
        ) : (
          <p className="col-span-full text-center text-slate-500 text-xs py-8">Nenhum depoimento carregado.</p>
        )}
      </div>

      {/* FULLSCREEN TEÃO CINEMATIC OVERLAY */}
      {modoTelao && (
        <div className="fixed inset-0 z-50 bg-[#000412] text-white p-6 sm:p-12 flex flex-col justify-between select-none overflow-hidden animate-fade-in font-sans">
          
          {/* TOP CONTROLS */}
          <div className="flex justify-between items-center z-10">
            <div className="flex items-center gap-3">
              <div className="w-3.5 h-3.5 rounded-full bg-[#003893] animate-ping" />
              <div>
                <p className="text-sm font-display font-extrabold tracking-tighter text-white uppercase">MURAL CULTURAL DIGITAL • EM PROJEÇÃO</p>
                <p className="text-[10px] text-slate-450 tracking-wider">Festa de Independência Nacional de Cabo Verde 2026</p>
              </div>
            </div>

            <button
              onClick={() => setModoTelao(false)}
              className="p-2 border border-white/10 hover:bg-white/15 rounded-full text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Fechar Projeção</span>
            </button>
          </div>

          {/* FLUID HORIZONTAL OR VERTICAL ROTATOR WALL CENTER */}
          <div className="flex-1 flex flex-col justify-center items-center max-w-4xl mx-auto space-y-12">
            
            {aprovadas.length > 0 ? (
              <div className="space-y-8 text-center animate-pulse">
                <Heart className="w-16 h-16 text-[#CE1126] mx-auto animate-bounce" />
                
                {/* Scroll through first approved item or list them dynamically */}
                <div className="space-y-5">
                  <p className="text-2xl sm:text-4xl md:text-5xl font-display font-semibold italic text-slate-100 leading-snug tracking-tight">
                    "{aprovadas[0].texto}"
                  </p>
                  <p className="text-lg sm:text-2xl font-black text-amber-400">
                    — {aprovadas[0].autor}, residindo em {aprovadas[0].origem}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <Radio className="w-12 h-12 text-[#FFD100] animate-spin mx-auto" />
                <p className="text-lg text-slate-400">Aguardando aprovação de mensagens pelo Centro de Comando...</p>
              </div>
            )}

          </div>

          {/* BOTTOM COPYRIGHT PORTAL BANNER */}
          <div className="border-t border-white/5 pt-4 text-center text-slate-505 select-none z-10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono">
            <span>Soberania e Soberba • 51 Anos Nacional</span>
            <span>Palácio da Assembleia Nacional — Praia</span>
          </div>

        </div>
      )}

    </div>
  );
}
