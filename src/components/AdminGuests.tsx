import React, { useState } from 'react';
import { Convidado, CadastroInput } from '../types.ts';
import { 
  cadastrarConvidado, 
  removerConvidado, 
  editarConvidado, 
  alterarStatusConvite,
  aplicarMascaraCPF,
  aplicarMascaraTelefone,
  validarCPF
} from '../dbStore.ts';
import { Search, Plus, Trash2, Edit, Ban, Check, Send, X, FileText, UserPlus, Sliders } from 'lucide-react';

interface AdminGuestsProps {
  convidados: Convidado[];
  onRefresh: () => void;
  onToast: (text: string, type: 'sucesso' | 'erro' | 'info') => void;
}

export function AdminGuests({ convidados, onRefresh, onToast }: AdminGuestsProps) {
  const [filtro, setFiltro] = useState('');
  
  // Modais / Formulários
  const [mostrandoAdd, setMostrandoAdd] = useState(false);
  const [mostrandoEdit, setMostrandoEdit] = useState(false);
  const [convidadoEditando, setConvidadoEditando] = useState<Convidado | null>(null);

  // States de Inputs (Cadastro / Edição)
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [cpf, setCpf] = useState('');
  const [pais, setPais] = useState('Brasil');
  const [cidade, setCidade] = useState('Porto Alegre');
  const [ilha, setIlha] = useState('Santiago');
  const [documentoBase64, setDocumentoBase64] = useState<string | null>(null);

  // Handle Photo/Document upload
  const handleUploadedFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setDocumentoBase64(reader.result as string);
        onToast('Documento carregado no formulário!', 'sucesso');
      };
      reader.readAsDataURL(file);
    }
  };

  const limparFormulario = () => {
    setNome('');
    setEmail('');
    setTelefone('');
    setCpf('');
    setPais('Brasil');
    setCidade('Porto Alegre');
    setIlha('Santiago');
    setDocumentoBase64(null);
  };

  const handleManualAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validarCPF(cpf)) {
      onToast('CPF fornecido é inválido.', 'erro');
      return;
    }

    const input: CadastroInput = {
      nome,
      email,
      telefone,
      cpf,
      paisResidencia: pais,
      cidadeAtual: cidade,
      ilhaOrigem: ilha,
      documento: documentoBase64
    };

    const result = cadastrarConvidado(input);
    if (result.sucesso) {
      onToast(result.mensagem, 'sucesso');
      limparFormulario();
      setMostrandoAdd(false);
      onRefresh();
    } else {
      onToast(result.mensagem, 'erro');
    }
  };

  const arirEditarConvidado = (conv: Convidado) => {
    setConvidadoEditando(conv);
    setNome(conv.nome);
    setEmail(conv.email);
    setTelefone(conv.telefone);
    setCpf(conv.cpf);
    setPais(conv.paisResidencia || 'Brasil');
    setCidade(conv.cidadeAtual || 'Porto Alegre');
    setIlha(conv.ilhaOrigem || 'Santiago');
    setDocumentoBase64(conv.documento || null);
    setMostrandoEdit(true);
  };

  const handleManualEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convidadoEditando) return;

    const dadosAtualizados: Partial<Convidado> = {
      nome: nome.trim(),
      email: email.trim().toLowerCase(),
      telefone: aplicarMascaraTelefone(telefone),
      cpf: aplicarMascaraCPF(cpf),
      paisResidencia: pais,
      cidadeAtual: cidade,
      ilhaOrigem: ilha,
      documento: documentoBase64
    };

    editarConvidado(convidadoEditando.uuid, dadosAtualizados);
    onToast('Cadastro do convidado atualizado com sucesso!', 'sucesso');
    limparFormulario();
    setConvidadoEditando(null);
    setMostrandoEdit(false);
    onRefresh();
  };

  const handleExcluir = (uuid: string, nome: string) => {
    if (window.confirm(`Deseja realmente EXCLUIR permanentemente o cadastro de "${nome}"?`)) {
      removerConvidado(uuid);
      onToast(`Cadastro de "${nome}" deletado com sucesso.`, 'info');
      onRefresh();
    }
  };

  const handleRevogar = (uuid: string, nome: string) => {
    if (window.confirm(`Revogar / Cancelar convite de "${nome}"? Ele terá o acesso negado na portaria.`)) {
      alterarStatusConvite(uuid, 'Cancelado');
      onToast(`Convite de "${nome}" revogado!`, 'info');
      onRefresh();
    }
  };

  const handleAprovar = (uuid: string, nome: string) => {
    alterarStatusConvite(uuid, 'Ativo');
    onToast(`Convite de "${nome}" aprovado e reativado com sucesso!`, 'sucesso');
    onRefresh();
  };

  const handleReenviar = (email: string) => {
    onToast(`Convite reemitido por canais consulares eletrônicos para: ${email}`, 'sucesso');
  };

  const convidadosFiltrados = convidados.filter(c => {
    const q = filtro.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      c.telefone.includes(q) ||
      c.codigoAntifraude.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* HEADER BAR AND TOOLS */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0B1224] p-5 rounded-2xl border border-white/5">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Pesquise por nome, CPF, e-mail, telefone..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-black/35 text-xs text-slate-100 placeholder:text-slate-550 rounded-xl border border-white/10 focus:outline-none focus:ring-1 focus:ring-[#003893] transition-all"
          />
        </div>

        <button
          onClick={() => { limparFormulario(); setMostrandoAdd(true); }}
          className="w-full sm:w-auto px-4 py-2.5 bg-[#003893] hover:bg-[#0047bd] text-white text-xs font-semibold rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Convidado</span>
        </button>
      </div>

      {/* MANUAL REGISTER FORM MODAL (ADD) */}
      {mostrandoAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-[#050B1F] border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#0B1224] px-6 py-4 border-b border-white/5 flex items-center justify-between text-white">
              <h4 className="font-display font-bold text-sm uppercase tracking-wide">Novo Cadastro Solene</h4>
              <button onClick={() => setMostrandoAdd(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleManualAdd} className="p-6 space-y-4 text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Nome Completo</label>
                  <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">CPF (Mascara Automática)</label>
                  <input type="text" required placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(aplicarMascaraCPF(e.target.value))} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">E-mail</label>
                  <input type="email" required placeholder="convidado@diáspora.gov" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Telefone</label>
                  <input type="text" required placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">País de Residência</label>
                  <input type="text" required value={pais} onChange={(e) => setPais(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Cidade de Acolhimento</label>
                  <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Ilha de Origem em Cabo Verde</label>
                  <select value={ilha} onChange={(e) => setIlha(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white">
                    {['Santiago', 'São Vicente', 'Santo Antão', 'Fogo', 'Sal', 'Boa Vista', 'Brava', 'Maio', 'São Nicolau'].map(i => (
                      <option key={i} value={i} className="bg-[#050B1F] text-slate-205">{i}</option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2 space-y-1 pt-1.5">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Foto do Documento (Upload simulado)</label>
                  <input type="file" accept="image/*" onChange={handleUploadedFile} className="w-full text-xs text-slate-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-xl file:border file:border-white/15 file:bg-white/5 file:text-white file:text-[10px] file:font-semibold hover:file:bg-white/10" />
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5 justify-end">
                <button type="button" onClick={() => setMostrandoAdd(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-300">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#003893] hover:bg-[#0047bd] text-xs font-semibold rounded-xl text-white">Salvar Inscrição</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANUAL REGISTER FORM MODAL (EDIT) */}
      {mostrandoEdit && convidadoEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="bg-[#050B1F] border border-white/10 w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-[#0B1224] px-6 py-4 border-b border-white/5 flex items-center justify-between text-white">
              <h4 className="font-display font-bold text-sm uppercase tracking-wide">Editar Cadastro</h4>
              <button onClick={() => setMostrandoEdit(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            
            <form onSubmit={handleManualEdit} className="p-6 space-y-4 text-slate-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Nome Completo</label>
                  <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">CPF</label>
                  <input type="text" required value={cpf} onChange={(e) => setCpf(aplicarMascaraCPF(e.target.value))} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">E-mail</label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Telefone</label>
                  <input type="text" required value={telefone} onChange={(e) => setTelefone(aplicarMascaraTelefone(e.target.value))} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white font-mono" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">País de Residência</label>
                  <input type="text" required value={pais} onChange={(e) => setPais(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Cidade de Acolhimento</label>
                  <input type="text" required value={cidade} onChange={(e) => setCidade(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-455 uppercase block">Ilha de Origem</label>
                  <select value={ilha} onChange={(e) => setIlha(e.target.value)} className="w-full bg-black/25 border border-white/10 rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-[#003893] focus:outline-none text-white">
                    {['Santiago', 'São Vicente', 'Santo Antão', 'Fogo', 'Sal', 'Boa Vista', 'Brava', 'Maio', 'São Nicolau'].map(i => (
                      <option key={i} value={i} className="bg-[#050B1F] text-slate-205">{i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-white/5 justify-end">
                <button type="button" onClick={() => setMostrandoEdit(false)} className="px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl text-slate-300">Fechar</button>
                <button type="submit" className="px-5 py-2 bg-[#003893] hover:bg-[#0047bd] text-xs font-semibold rounded-xl text-white">Confirmar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GUEST MATRIX TABLE */}
      <div className="bg-[#050B1F] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-xs text-slate-300">
            <thead>
              <tr className="bg-[#0B1224] border-b border-white/10 text-slate-400 font-bold uppercase select-none">
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Convidado</th>
                <th className="px-6 py-4">Contacto / Diáspora</th>
                <th className="px-6 py-4 font-mono">CPF</th>
                <th className="px-6 py-4">Status Convite</th>
                <th className="px-6 py-4">Status Entrada</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {convidadosFiltrados.length > 0 ? (
                convidadosFiltrados.map(c => (
                  <tr key={c.uuid} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500">#{c.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-display font-semibold text-white leading-tight">{c.nome}</div>
                      <div className="text-[10px] text-amber-400 font-mono mt-0.5 font-bold">Código: {c.codigoAntifraude}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-205">{c.email}</div>
                      <div className="text-[10px] text-slate-450 mt-0.5">{c.telefone} • {c.paisResidencia} ({c.ilhaOrigem})</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-300">{c.cpf}</td>
                    <td className="px-6 py-4">
                      {c.statusConvite === 'Ativo' ? (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                          Aprovado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-rose-500/10 text-rose-450 text-[10px] font-semibold border border-rose-500/20">
                          Revogado
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {c.statusEntrada === 'Utilizado' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">Checked-in</span>
                          {c.horaEntrada && (
                            <div className="text-[9px] text-slate-450 font-mono italic">
                              {new Date(c.horaEntrada).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-white/5 text-slate-400 text-[10px] font-semibold border border-white/10">Aguardando</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleReenviar(c.email)} className="p-1 px-1.5 border border-white/10 hover:bg-white/10 rounded text-slate-300 hover:text-white shrink-0 transition-all font-semibold uppercase text-[9px] flex items-center gap-0.5" title="Reemitir email"><Send className="w-3 h-3" /></button>
                        <button onClick={() => arirEditarConvidado(c)} className="p-1 px-1.5 border border-white/10 hover:bg-white/10 rounded text-slate-300 hover:text-white shrink-0 transition-all font-semibold uppercase text-[9px] flex items-center gap-0.5"><Edit className="w-3 h-3" /></button>
                        
                        {c.statusConvite === 'Ativo' ? (
                          <button onClick={() => handleRevogar(c.uuid, c.nome)} className="p-1 px-1.5 border border-rose-500/20 hover:bg-rose-500/10 rounded text-rose-455 hover:text-rose-300 shrink-0 transition-all font-semibold uppercase text-[9px] flex items-center gap-0.5" title="Revogar acesso"><Ban className="w-3 h-3" /></button>
                        ) : (
                          <button onClick={() => handleAprovar(c.uuid, c.nome)} className="p-1 px-1.5 border border-emerald-500/20 hover:bg-emerald-500/10 rounded text-emerald-400 hover:text-emerald-305 shrink-0 transition-all font-semibold uppercase text-[9px] flex items-center gap-0.5" title="Autorizar novamente"><Check className="w-3 h-3" /></button>
                        )}

                        <button onClick={() => handleExcluir(c.uuid, c.nome)} className="p-1 px-1.5 border border-rose-600/30 hover:bg-rose-650/15 rounded text-rose-400 hover:text-rose-300 shrink-0 transition-all font-semibold uppercase text-[9px] flex items-center gap-0.5" title="Excluir cadastro"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500 text-xs">Instalação de inscritos vazia. Nenhum convidado localizado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
