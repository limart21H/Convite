/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  obterConvidados, 
  alterarStatusConvite, 
  obterEstatisticaDashboard, 
  obterEstadoOnline, 
  definirEstadoOnline, 
  obterFilaOffline, 
  redefinirBancoDeDados,
  obterLogsAuditoria
} from '../dbStore.ts';
import { Convidado, DashboardStats, LogAuditoria } from '../types.ts';
import { 
  Lock, Settings, ShieldCheck, Users, TicketCheck, FileClock, 
  BookX, Search, Download, Printer, ToggleLeft, ToggleRight,
  Database, RefreshCw, AlertCircle, Ban, Check, Send, RotateCcw, ShieldAlert, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelProps {
  adminUser?: { nome: string } | null;
  onLogout?: () => void;
}

export function AdminPanel({ adminUser, onLogout }: AdminPanelProps) {
  const [autenticado, setAutenticado] = useState(false);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  
  // Lista central de Gestão
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [logsAuditoria, setLogsAuditoria] = useState<LogAuditoria[]>([]);
  const [subTab, setSubTab] = useState<'convidados' | 'auditoria'>('convidados');
  const [filtroPesquisa, setFiltroPesquisa] = useState('');
  const [estatisticas, setEstatisticas] = useState<DashboardStats | null>(null);
  
  // Conexão Virtual
  const [onlineVirtual, setOnlineVirtual] = useState(true);
  const [acoesPendentesSync, setAcoesPendentesSync] = useState<any[]>([]);

  // Operador Notificant
  const [notificacao, setNotificacao] = useState<{ texto: string; tipo: 'sucesso' | 'erro' | 'info' } | null>(null);

  // Monitorar prop adminUser do App.tsx
  useEffect(() => {
    if (adminUser) {
      setAutenticado(true);
    } else {
      setAutenticado(false);
    }
  }, [adminUser]);

  // Carregar dados no boot do painel
  useEffect(() => {
    carregarDados();
    const interval = setInterval(() => {
      carregarDados();
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const carregarDados = () => {
    const list = obterConvidados();
    setConvidados(list);
    setEstatisticas(obterEstatisticaDashboard());
    setOnlineVirtual(obterEstadoOnline());
    setAcoesPendentesSync(obterFilaOffline());
    setLogsAuditoria(obterLogsAuditoria());
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha padrão solene: 1975 (Ano da independência de Cabo Verde)
    if (senhaDigitada === '1975') {
      setAutenticado(true);
      setSenhaDigitada('');
      setErroSenha('');
      mostrarToast('Acesso concedido. Bem-vindo(a) ao Painel de Segurança!', 'sucesso');
    } else {
      setErroSenha('Senha de segurança inválida.');
    }
  };

  const mostrarToast = (texto: string, tipo: 'sucesso' | 'erro' | 'info' = 'info') => {
    setNotificacao({ texto, tipo });
    setTimeout(() => {
      setNotificacao(null);
    }, 3800);
  };

  // Alternar rede virtual
  const handleAlternarRede = () => {
    const novoEstado = !onlineVirtual;
    definirEstadoOnline(novoEstado);
    setOnlineVirtual(novoEstado);
    if (novoEstado) {
      mostrarToast('Conectado à Internet! Os dados da fila offline foram sincronizados.', 'sucesso');
    } else {
      mostrarToast('Modo Offline ativo. Alterações de portaria serão mantidas na fila local.', 'info');
    }
    carregarDados();
  };

  // Cancelar convite
  const handleCancelarConvite = (uuid: string, convidadoNome: string) => {
    const ok = window.confirm(`Deseja realmente CANCELAR o convite de "${convidadoNome}"? Ele não poderá acessar o evento.`);
    if (ok) {
      alterarStatusConvite(uuid, 'Cancelado');
      mostrarToast(`Convite de ${convidadoNome} cancelado com sucesso.`, 'info');
      carregarDados();
    }
  };

  // Ativar / Aprovar convite
  const handleReativarConvite = (uuid: string, convidadoNome: string) => {
    alterarStatusConvite(uuid, 'Ativo');
    mostrarToast(`Convite de ${convidadoNome} ativado e aprovado!`, 'sucesso');
    carregarDados();
  };

  // Reenviar e-mail
  const handleReenviarEmail = (email: string, nome: string) => {
    mostrarToast(`Convite digital reenviado com sucesso para ${email}!`, 'sucesso');
  };

  // Reset completo
  const handleResetBanco = () => {
    const ok = window.confirm('Deseja resetar o banco de dados e os logs para o estado inicial padrão? Todos os cadastros extras serão limpos.');
    if (ok) {
      redefinirBancoDeDados();
      mostrarToast('Banco de dados e logs de auditoria redefinidos.', 'sucesso');
      carregarDados();
    }
  };

  // Exportar para Excel CSV
  const handleExportarCSV = () => {
    if (subTab === 'convidados') {
      if (convidados.length === 0) return;
      let csvContent = '\uFEFF'; 
      csvContent += 'ID;Nome Completo;Telefone;E-mail;CPF;Codigo Antifraude;UUID;Data Cadastro;Status Convite;Comparecimento;Hora Entrada\n';
      
      convidados.forEach(c => {
        const horaEntradaStr = c.horaEntrada ? new Date(c.horaEntrada).toLocaleString('pt-BR') : 'N/A';
        csvContent += `${c.id};${c.nome};${c.telefone};${c.email};${c.cpf};${c.codigoAntifraude};${c.uuid};${new Date(c.dataCadastro).toLocaleDateString('pt-BR')};${c.statusConvite};${c.statusEntrada};${horaEntradaStr}\n`;
      });
      
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'CaboVerde_2026_Lista_Inscritos.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      mostrarToast('Planilha Excel (CSV) de inscritos baixada!', 'sucesso');
    } else {
      if (logsAuditoria.length === 0) {
        mostrarToast('Sem logs de auditoria para exportar.', 'info');
        return;
      }
      let csvContent = '\uFEFF';
      csvContent += 'ID;Data Leitura;Hora Leitura;Operador Autenticado;Resultado Validacao;Local Portaria;Nome Convidado;CPF Convidado;Convidado UUID\n';
      
      logsAuditoria.forEach(l => {
        csvContent += `${l.id};${l.dataLeitura};${l.horaLeitura};${l.adminNome};${l.resultado};${l.localValidacao};${l.convidadoNome || 'N/A'};${l.convidadoCpf || 'N/A'};${l.convidadoUuid || 'N/A'}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', 'CaboVerde_2026_Audit_Logs.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      mostrarToast('Planilha Excel (CSV) de auditoria baixada!', 'sucesso');
    }
  };

  // Imprimir relatório
  const handleImprimirRelatorio = () => {
    window.print();
  };

  // Filtrar os dados da pesquisa
  const convidadosFiltrados = convidados.filter(c => {
    const q = filtroPesquisa.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.cpf.includes(q) ||
      c.telefone.includes(q) ||
      c.codigoAntifraude.toLowerCase().includes(q)
    );
  });

  const logsFiltrados = logsAuditoria.filter(l => {
    const q = filtroPesquisa.toLowerCase();
    return (
      l.adminNome.toLowerCase().includes(q) ||
      l.resultado.toLowerCase().includes(q) ||
      (l.convidadoNome && l.convidadoNome.toLowerCase().includes(q)) ||
      (l.convidadoCpf && l.convidadoCpf.includes(q))
    );
  });

  return (
    <div id="admin_panel_section" className="transition-all duration-300">
      
      {/* FORMULÁRIO DE LOGIN DE SEGURANÇA */}
      {!autenticado ? (
        <div className="max-w-md mx-auto bg-[#050B1F] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden">
          <div className="bg-gradient-to-br from-[#003893]/50 to-[#050B1F]/90 text-white p-6 text-center space-y-2 border-b border-white/10">
            <div className="w-12 h-12 bg-[#FFD100]/10 border border-[#FFD100]/25 rounded-full flex items-center justify-center mx-auto mb-1">
              <Lock className="w-6 h-6 text-[#FFD100]" />
            </div>
            <h3 className="text-xl font-display font-bold">Acesso Organizador</h3>
            <p className="text-xs text-slate-400">Credencial reservada para auditores da Festa da Independência 2026</p>
          </div>

          <form onSubmit={handleLogin} className="p-6 space-y-5">
            {erroSenha && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{erroSenha}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="adm_senha" className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                Senha de Acesso Rápido
              </label>
              <input
                id="adm_senha"
                type="password"
                required
                placeholder="Dica: Ano da independência (4 dígitos)"
                value={senhaDigitada}
                onChange={(e) => setSenhaDigitada(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 focus:bg-black/50 text-slate-100 text-sm focus:outline-none focus:ring-1 focus:ring-[#003893] focus:border-[#003893] transition-all text-center font-mono placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-500"
              />
            </div>

            <button
              id="btn_confirmar_login_admin"
              type="submit"
              className="w-full py-2.5 bg-[#003893] hover:bg-[#0047bd] text-white font-display font-semibold rounded-xl text-sm transition-all shadow-md transform active:scale-95"
            >
              Autenticar e Entrar
            </button>
          </form>
        </div>
      ) : (
        
        // PAINEL ADMINISTRATIVO ESTATÍSTICO COMPLETO
        <div className="space-y-6">
          
          {/* TOAST DE SISTEMA */}
          <AnimatePresence>
            {notificacao && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-sm no-print ${
                  notificacao.tipo === 'sucesso' 
                    ? 'bg-emerald-50 text-emerald-950 border-emerald-200' 
                    : notificacao.tipo === 'erro' 
                    ? 'bg-rose-50 text-rose-950 border-rose-200' 
                    : 'bg-blue-50 text-blue-950 border-blue-200'
                }`}
              >
                {notificacao.tipo === 'sucesso' ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                )}
                <span className="font-medium">{notificacao.texto}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CONTROL ROOM: BARRA DE CONFIGURAÇÕES DE REDE (NO-PRINT) */}
          <div className="bg-neutral-900 rounded-3xl p-5 sm:p-6 text-white border border-neutral-800 no-print flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 text-center md:text-left">
              <div className="p-3 bg-white/5 rounded-2xl flex items-center justify-center">
                <Database className="w-6 h-6 text-[#FFD100]" />
              </div>
              <div>
                <h4 className="text-base font-display font-bold flex items-center gap-2">
                  <span>Simulador de Estado de Rede</span>
                  {adminUser && (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded font-mono font-bold">
                      ORG: {adminUser.nome}
                    </span>
                  )}
                </h4>
                <p className="text-xs text-neutral-400 mt-0.5">Use o interruptor para simular a queda de internet no evento.</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {/* Sync queue indicator */}
              {acoesPendentesSync.length > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-[#FFD100] border border-amber-500/20 text-xs font-semibold animate-pulse">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Fila: {acoesPendentesSync.length} offline</span>
                </div>
              )}

              {/* Toggle switch */}
              <button
                onClick={handleAlternarRede}
                className="flex items-center gap-2 p-1.5 pr-4 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-all text-xs"
              >
                {onlineVirtual ? (
                  <>
                    <ToggleRight className="w-9 h-6 text-emerald-400" />
                    <span className="font-bold font-mono text-[10px]">CONEXÃO: NUVEM ONLINE</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-9 h-6 text-amber-500" />
                    <span className="font-bold text-[#FFD100] font-mono text-[10px]">CONEXÃO: OFFLINE Virtual</span>
                  </>
                )}
              </button>

              {/* Botão de Redefinição */}
              <button
                onClick={handleResetBanco}
                className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 rounded-xl border border-rose-500/25 transition-all"
                title="Resetar Banco e Logs"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {onLogout && (
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 border border-[#CE1126]/30 text-rose-300 hover:text-white bg-rose-500/5 hover:bg-rose-600/15 rounded-xl text-xs font-bold transition-all"
                >
                  Sair do Painel
                </button>
              )}
            </div>
          </div>

          {/* GRID DE KPIS E CHAVE GRÁFICA */}
          {estatisticas && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Cartões Estatísticos */}
              <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="bg-[#050B1F] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Inscritos</span>
                    <Users className="w-4 h-4 text-[#FFD100]" />
                  </div>
                  <div>
                    <span className="text-2xl font-display font-extrabold text-white block leading-none">
                      {estatisticas.totalCadastrados}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 select-none block mt-1">Lote de Convidados</span>
                  </div>
                </div>

                <div className="bg-[#050B1F] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Presenças</span>
                    <TicketCheck className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-display font-extrabold text-emerald-400 block leading-none">
                      {estatisticas.totalUtilizados}
                    </span>
                    <span className="text-[10px] text-[#FFD100] bg-[#FFD100]/10 px-1.5 py-0.5 inline-block shrink-0 rounded mt-1 font-mono font-bold text-[9px] uppercase tracking-wider">
                      Compareceram
                    </span>
                  </div>
                </div>

                <div className="bg-[#050B1F] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Ausentes</span>
                    <FileClock className="w-4 h-4 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-display font-extrabold text-blue-400 block leading-none">
                      {estatisticas.totalPendentes}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 select-none block mt-1">Não Utilizados</span>
                  </div>
                </div>

                <div className="bg-[#050B1F] p-4 rounded-2xl border border-white/10 shadow-lg flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Cancelados</span>
                    <BookX className="w-4 h-4 text-rose-450" />
                  </div>
                  <div>
                    <span className="text-2xl font-display font-extrabold text-[#C60C30] block leading-none">
                      {estatisticas.totalCancelados}
                    </span>
                    <span className="text-[10px] text-slate-400 shrink-0 select-none block mt-1">Acesso Bloqueado</span>
                  </div>
                </div>

              </div>

              {/* SVG Ring Chart comparecimento (Visual de Alta Costura) */}
              <div className="lg:col-span-4 bg-[#050B1F] p-5 rounded-3xl border border-white/10 shadow-lg flex flex-row items-center gap-4">
                <div className="relative w-20 sm:w-24 h-20 sm:h-24 flex items-center justify-center shrink-0">
                  <svg className="w-full h-full transform -rotate-95" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.915" fill="none" 
                      stroke="#003893" 
                      strokeWidth="3.2" 
                      strokeDasharray={`${estatisticas.taxaComparecimento} ${100 - estatisticas.taxaComparecimento}`} 
                      strokeDashoffset="0" 
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-lg sm:text-xl font-display font-extrabold text-white tracking-tighter">
                      {estatisticas.taxaComparecimento}%
                    </span>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-display font-bold text-white leading-tight">Taxa de Comparecimento</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Mapeia a eficiência do cerimonial e o comparecimento de participantes ativos em tempo real.
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* TABELA DE GESTÃO GERAL, PESQUISA E BUSCAS */}
          <div className="bg-[#050B1F] rounded-3xl shadow-lg border border-white/10 overflow-hidden">
            
            {/* Cabeçalho da Lista e Ações em Lote */}
            <div className="p-5 sm:p-6 border-b border-white/10 space-y-4 no-print flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-lg font-display font-bold text-white">
                  {subTab === 'convidados' ? 'Configuração de Credenciais de Entrada' : 'Auditoria de Validação Portaria'}
                </h3>
                <p className="text-xs text-slate-400 font-sans">
                  {subTab === 'convidados' 
                    ? 'Consulte, aprove, revogue e reenvie as credenciais com as opções administrativas abaixo.'
                    : 'Lista oficial de leituras fotográficas coletadas pelo aplicativo na portaria do evento.'
                  }
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleExportarCSV}
                  className="flex items-center gap-1.5 px-3 py-2 border border-white/10 hover:bg-white/10 text-slate-200 bg-white/5 rounded-xl text-xs font-semibold shadow-sm transition-all"
                  title="Exportar para Excel (CSV)"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
                <button
                  onClick={handleImprimirRelatorio}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#003893] hover:bg-[#0047bd] text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir Lista</span>
                </button>
              </div>
            </div>

            {/* Sub-Tabs Switcher */}
            <div className="flex bg-[#0B1224]/85 border-b border-white/10 no-print">
              <button
                onClick={() => setSubTab('convidados')}
                className={`py-3.5 px-6 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  subTab === 'convidados' 
                    ? 'border-[#FFD100] text-white bg-[#050B1F]/40' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Inscritos ({convidadosFiltrados.length})
              </button>
              <button
                onClick={() => setSubTab('auditoria')}
                className={`py-3.5 px-6 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer ${
                  subTab === 'auditoria' 
                    ? 'border-[#FFD100] text-white bg-[#050B1F]/40' 
                    : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                Registros de Auditoria ({logsFiltrados.length})
              </button>
            </div>

            {/* Barra de Filtro Local (No-Print) */}
            <div className="px-5 py-4 bg-[#0B1224] border-b border-white/10 no-print">
              <div className="relative max-w-md">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Search className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder={subTab === 'convidados' ? "Pesquise por nome, CPF, telefone ou e-mail..." : "Pesquise por operador, resultado, convidado..."}
                  value={filtroPesquisa}
                  onChange={(e) => setFiltroPesquisa(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-black/25 text-slate-100 placeholder:text-slate-505 rounded-xl border border-white/10 text-xs focus:outline-none focus:ring-1 focus:ring-[#003893] focus:border-[#003893] transition-all"
                />
              </div>
            </div>

            {/* Impressão: Selo Solene de Relatório de Recepção */}
            <div className="hidden print:block p-6 border-b border-neutral-350 text-center bg-white text-neutral-900">
              <p className="text-[#002561] font-display font-extrabold text-2xl uppercase tracking-tighter">
                {subTab === 'convidados' ? 'RELATÓRIO DE INGRESSOS E RECEPÇÃO' : 'RELATÓRIO DE LOGS E AUDITORIA DE SEGURANÇA'}
              </p>
              <p className="text-xs text-neutral-600 mt-1">
                Festa da Independência Nacional de Cabo Verde • Palácio da Assembleia Nacional — Praia, Santiago
              </p>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Emitido em: {new Date().toLocaleString('pt-BR')} • Sistema Antifraude Integrado
              </p>
            </div>

            {/* Corpo da Tabela */}
            <div className="overflow-x-auto">
              
              {subTab === 'convidados' ? (
                // TABELA DE CONVIDADOS
                <table className="w-full min-w-[700px] border-collapse text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-[#0B1224] border-b border-white/10 font-bold text-slate-400 uppercase select-none">
                      <th className="px-6 py-4">ID</th>
                      <th className="px-6 py-4">Convidado</th>
                      <th className="px-6 py-4">E-mail / Contato</th>
                      <th className="px-6 py-4 font-mono">CPF</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Entrada</th>
                      <th className="px-6 py-4 text-right no-print">Opções</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {convidadosFiltrados.length > 0 ? (
                      convidadosFiltrados.map((c) => (
                        <tr key={c.uuid} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-mono text-slate-500">#{c.id}</td>
                          <td className="px-6 py-4">
                            <div className="font-display font-semibold text-white leading-tight">
                              {c.nome}
                            </div>
                            <div className="text-[10px] text-slate-400 mt-0.5 font-mono flex items-center gap-1">
                              <span>Código:</span>
                              <span className="font-bold text-[#FFD100]">{c.codigoAntifraude}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-200">{c.email}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{c.telefone}</div>
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-300">{c.cpf}</td>
                          
                          <td className="px-6 py-4">
                            {c.statusConvite === 'Ativo' ? (
                              <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400"></span>
                                Aprovado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-rose-500/10 text-rose-450 text-[10px] font-semibold border border-rose-500/20">
                                <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                                Cancelado
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4">
                            {c.statusEntrada === 'Utilizado' ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold border border-blue-500/20">
                                  <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                  Utilizado
                                </span>
                                {c.horaEntrada && (
                                  <div className="text-[9px] text-slate-400 leading-none font-mono">
                                    {new Date(c.horaEntrada).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 py-0.5 px-2 rounded-full bg-white/5 text-slate-400 text-[10px] font-semibold border border-white/10">
                                Não utilizado
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right no-print">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleReenviarEmail(c.email, c.nome)}
                                disabled={c.statusConvite === 'Cancelado'}
                                className="p-1 px-1.5 border border-white/10 hover:bg-white/10 rounded text-slate-300 hover:text-white shrink-0 transition-all text-[10px] flex items-center gap-0.5 disabled:opacity-40"
                                title="Reenviar Convite"
                              >
                                <Send className="w-3 h-3" />
                                <span className="hidden sm:inline">E-mail</span>
                              </button>
                              
                              {c.statusConvite === 'Ativo' ? (
                                <button
                                  onClick={() => handleCancelarConvite(c.uuid, c.nome)}
                                  className="p-1 px-1.5 border border-rose-500/20 hover:bg-rose-500/10 rounded text-rose-450 hover:text-rose-300 shrink-0 transition-all text-[10px] flex items-center gap-0.5"
                                  title="Cancelar Convite"
                                >
                                  <Ban className="w-3 h-3" />
                                  <span className="hidden sm:inline">Revogar</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReativarConvite(c.uuid, c.nome)}
                                  className="p-1 px-1.5 border border-emerald-500/20 hover:bg-emerald-500/10 rounded text-emerald-400 hover:text-emerald-305 shrink-0 transition-all text-[10px] flex items-center gap-0.5"
                                  title="Aprovar/Reativar Convite"
                                >
                                  <Check className="w-3 h-3" />
                                  <span className="hidden sm:inline">Aprovar</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-slate-500 text-xs">
                          Nenhum convidado encontrado na pesquisa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : (
                // TABELA DE LOGS DE AUDITORIA DE SEGURANÇA
                <table className="w-full min-w-[700px] border-collapse text-left text-xs text-slate-300">
                  <thead>
                    <tr className="bg-[#0B1224] border-b border-white/10 font-bold text-slate-400 uppercase select-none">
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Operador da Leitura</th>
                      <th className="px-6 py-4">Resultado da Validação</th>
                      <th className="px-6 py-4">Local de Acesso</th>
                      <th className="px-6 py-4">Identificação Detalhada</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {logsFiltrados.length > 0 ? (
                      logsFiltrados.map((log) => (
                        <tr key={log.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4">
                            <span className="text-slate-100 font-semibold">{log.dataLeitura}</span>
                            <div className="text-[10px] text-slate-450 mt-0.5 font-mono">{log.horaLeitura}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-slate-300 font-semibold">{log.adminNome}</div>
                            <div className="text-[9px] text-[#FFD100]/80 font-mono uppercase tracking-wider">Protocolo de Segurança</div>
                          </td>
                          <td className="px-6 py-4">
                            {log.resultado === 'Válido' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20">
                                <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                                Válido / Autorizado
                              </span>
                            ) : log.resultado === 'Já Utilizado' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce"></span>
                                Já Utilizado (Clonagem?)
                              </span>
                            ) : log.resultado === 'Cancelado' ? (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-rose-500/10 text-rose-455 text-[10px] font-bold border border-rose-500/20">
                                <span className="w-1 h-1 rounded-full bg-rose-400"></span>
                                Acesso Revogado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-full bg-rose-600/15 text-rose-400 text-[10px] font-extrabold border border-rose-600/30 uppercase tracking-tighter">
                                ❌ Não Oficial / Adulterado
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-400">{log.localValidacao}</td>
                          <td className="px-6 py-4">
                            {log.convidadoNome && log.convidadoNome !== 'Desconhecido' ? (
                              <div>
                                <div className="text-slate-200 font-bold">{log.convidadoNome}</div>
                                <div className="text-[10px] text-slate-450 mt-0.5 font-mono">
                                  CPF: {log.convidadoCpf}
                                </div>
                              </div>
                            ) : (
                              <span className="text-rose-450 font-mono font-bold text-[10px] flex items-center gap-1 bg-rose-500/5 px-2 py-0.5 rounded border border-rose-500/15 max-w-fit">
                                <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-450" />
                                Alerta de Invasor
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-slate-500 text-xs">
                          Nenhum log de auditoria encontrado na pesquisa.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}

            </div>

            {/* Rodapé da tabela */}
            <div className="px-5 py-4 border-t border-white/10 bg-[#0B1224] flex items-center justify-between text-[11px] text-slate-500 select-none">
              {subTab === 'convidados' ? (
                <span>Registros: {convidadosFiltrados.length} de {convidados.length} total</span>
              ) : (
                <span>Leituras: {logsFiltrados.length} registradas na portaria</span>
              )}
              <span>Auditado em Praia, Santiago</span>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
