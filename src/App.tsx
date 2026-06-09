/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Convidado } from './types.ts';
import { FlagCaboVerde, EmblemaOficial } from './components/FlagComponents.tsx';
import { RegistrationForm } from './components/RegistrationForm.tsx';
import { TicketView } from './components/TicketView.tsx';
import { QRScannerView } from './components/QRScannerView.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { InicioView } from './components/InicioView.tsx';
import { 
  PlusCircle, ScanLine, ShieldAlert, Library, Calendar, MapPin, 
  Clock, Info, Volume2, Globe, HeartHandshake, HelpCircle, Lock, Unlock, LogOut, KeyRound, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Tabs disponíveis
type TabAtiva = 'inicio' | 'cadastro' | 'scanner' | 'admin';

export default function App() {
  const [tab, setTab] = useState<TabAtiva>('inicio');
  const [convidadoLogado, setConvidadoLogado] = useState<Convidado | null>(null);
  const [horaLocal, setHoraLocal] = useState('');
  
  // Estado de controle de acessibilidade e permissões (Convidado vs Administrador)
  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('caboverde2026_is_admin') === 'true';
  });
  const [adminUser, setAdminUser] = useState<{ nome: string } | null>(() => {
    if (localStorage.getItem('caboverde2026_is_admin') === 'true') {
      return { nome: 'Operador de Segurança' };
    }
    return null;
  });

  // Modal para autenticação administrativa
  const [mostrarModalAdmin, setMostrarModalAdmin] = useState(false);
  const [senhaAdmin, setSenhaAdmin] = useState('');
  const [erroSenhaAdmin, setErroSenhaAdmin] = useState('');

  // Sincronizar relógio oficial do portal em tempo real
  useEffect(() => {
    const atualizarHorario = () => {
      const agora = new Date();
      setHoraLocal(agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    atualizarHorario();
    const timer = setInterval(atualizarHorario, 1000);
    return () => clearInterval(timer);
  }, []);

  // Tratar registro de convidado bem-sucedido
  const handleCadastroSucesso = (convidado: Convidado) => {
    setConvidadoLogado(convidado);
    // Toca som festivo se suportado
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      // Ignorar bloqueio de autoplay
    }
  };

  const handleVoltarCadastro = () => {
    setConvidadoLogado(null);
  };

  // Entrada de Administrador
  const handleLoginAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senhaAdmin === '1975') {
      setIsAdmin(true);
      setAdminUser({ nome: 'Operador de Segurança' });
      localStorage.setItem('caboverde2026_is_admin', 'true');
      setSenhaAdmin('');
      setErroSenhaAdmin('');
      setMostrarModalAdmin(false);
      setTab('admin'); // Abre automaticamente o painel
    } else {
      setErroSenhaAdmin('Senha protocolar incorreta.');
    }
  };

  // Logoff de Administrador (Volta para convidado)
  const handleLogoutAdmin = () => {
    setIsAdmin(false);
    setAdminUser(null);
    localStorage.removeItem('caboverde2026_is_admin');
    setTab('inicio');
  };

  return (
    <div id="app_root_layout" className="min-h-screen bg-[#020617] text-slate-100 flex flex-col font-sans selection:bg-[#003893]/30 selection:text-white pb-6">
      
      {/* 🇨🇻 CABEÇALHO DIPLOMÁTICO OFICIAL (NO-PRINT) */}
      <nav className="h-16 border-b border-white/10 bg-[#050B1F] flex items-center justify-between px-4 sm:px-8 flex-shrink-0 no-print select-none">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-6 flex items-center justify-center shrink-0">
              <svg width="32" height="20" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-sm">
                <rect width="10" height="6" fill="#003893"/>
                <rect y="3" width="10" height="1" fill="#CE1126"/>
                <rect y="2.7" width="10" height="0.3" fill="#FFFFFF"/>
                <rect y="4" width="10" height="0.3" fill="#FFFFFF"/>
                <circle cx="3.5" cy="3.5" r="1.5" stroke="#F7D116" strokeWidth="0.3" fill="transparent" strokeDasharray="0.3 0.3"/>
              </svg>
            </div>
            <div className="text-left">
              <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 font-mono tracking-widest block whitespace-nowrap">
                REPÚBLICA DE CABO VERDE • PORTAL DE ENTRADA
              </span>
              <h1 className="text-xs sm:text-sm font-display font-black tracking-tight text-white uppercase mt-0.5">
                Independência 2026
              </h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Horário Local */}
          <div className="text-right hidden md:block border-r border-white/10 pr-4">
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Hora Local (GMT-1)</p>
            <p className="text-xs text-[#FFD100] font-mono font-bold tracking-wider">{horaLocal}</p>
          </div>

          {/* Barra de Menus Coesa */}
          <div className="flex items-center bg-[#0B1224] rounded-xl p-1 border border-white/10 shrink-0">
            <button
              onClick={() => { setTab('inicio'); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                tab === 'inicio' 
                  ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#FFD100]" />
              <span className="hidden sm:inline">Início</span>
            </button>

            {/* Apenas exibe o Scanner de QR Code e Painel Geral de Administração se for administrador autenticado */}
            {isAdmin ? (
              <>
                <button
                  onClick={() => { setTab('scanner'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    tab === 'scanner' 
                      ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <ScanLine className="w-3.5 h-3.5 text-[#003893]" />
                  <span className="hidden sm:inline">Portaria</span>
                </button>

                <button
                  onClick={() => { setTab('admin'); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs transition-all cursor-pointer ${
                    tab === 'admin' 
                      ? 'bg-white/15 text-white border border-white/10 shadow-sm' 
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Library className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Painel</span>
                </button>
                
                {/* Botão de Logout para sair do modo Operador */}
                <button
                  onClick={handleLogoutAdmin}
                  className="flex items-center gap-1 px-1.5 py-1 text-slate-400 hover:text-rose-400 rounded transition-all cursor-pointer"
                  title="Sair do modo Administrador"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              // Se for convidado, mostra um botão discreto de login administrativo
              <button
                onClick={() => { setMostrarModalAdmin(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white text-xs transition-all cursor-pointer rounded-lg hover:bg-white/5"
                title="Acesso Reservado à Segurança"
              >
                <Lock className="w-3.5 h-3.5 text-[#CE1126]" />
                <span className="hidden sm:inline font-bold">Portaria</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* 🌟 HERO BANNER INSTITUCIONAL (MOSTRADO NA ABA CADASTRO E NO-PRINT) */}
      {tab === 'cadastro' && !convidadoLogado && (
        <section id="ceremonial_hero_banner" className="bg-[#050B1F] border-b border-white/10 text-slate-100 py-12 px-4 relative overflow-hidden no-print select-none">
          {/* Ribbon Design Background */}
          <div className="absolute -top-10 -right-10 w-60 h-60 bg-[#CE1126] blur-[100px] opacity-15"></div>
          <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-[#003893] blur-[100px] opacity-20"></div>
          
          <div className="max-w-4xl mx-auto text-center space-y-4 relative z-10">
            <div className="flex justify-center -space-x-1.5 animate-pulse-slow">
              {Array.from({ length: 10 }).map((_, i) => (
                <span key={i} className="text-[#FFD100] text-lg font-bold">★</span>
              ))}
            </div>
            
            <h2 className="text-3xl sm:text-5xl font-display font-black tracking-tight text-white leading-tight uppercase font-extrabold text-slate-100 font-sans">
              51º Anos de Independência <br/>
              <span className="text-[#FFD100]">Nacional de Cabo Verde</span>
            </h2>
            
            <p className="text-slate-350 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              O Secretariado Geral convoca Vossa Excelência para os Atos Solenes e Recepção Oficial Comemorativos ao Dia da Independência Nacional, a realizar-se em Porto Alegre - RS (local a definir).
            </p>

            {/* Selos de Conveniência do Evento */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 pt-2 font-mono">
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-default">
                <Calendar className="w-3.5 h-3.5 text-[#FFD100]" />
                24 DE JULHO DE 2026
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-default">
                <Clock className="w-3.5 h-3.5 text-[#FFD100]" />
                ABERTURA: 22h00 (Brasília-DF)
              </span>
              <span className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:border-white/20 transition-colors cursor-default">
                <MapPin className="w-3.5 h-3.5 text-[#FFD100]" />
                PORTO ALEGRE - RS (LOCAL A DEFINIR)
              </span>
            </div>
          </div>
          
          {/* Faixa inferior de Cabo Verde do Banner */}
          <div className="absolute bottom-0 left-0 right-0 h-1.5 flex">
            <div className="flex-[6] bg-[#003893]"></div>
            <div className="flex-[1] bg-white"></div>
            <div className="flex-[1] bg-[#CE1126]"></div>
            <div className="flex-[1] bg-white"></div>
            <div className="flex-[3] bg-[#003893]"></div>
          </div>
        </section>
      )}

      {/* 🖥️ ÁREA PRINCIPAL DO CONTEÚDO */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 relative z-10">
        
        <AnimatePresence mode="wait">
          
          {/* TELA INICIAL: DIÁSPORA, CULTURA, SHOWCASE */}
          {tab === 'inicio' && (
            <motion.div
              key="aba-inicio"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <InicioView onSolicitarInscricao={() => setTab('cadastro')} />
            </motion.div>
          )}
          
          {/* ABA 1: PORTAL DE INSCRIÇÃO / CADASTRO / TICKET */}
          {tab === 'cadastro' && (
            <motion.div
              key="aba-cadastro"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {convidadoLogado ? (
                // Se já estiver cadastrado com convite na mão
                <div className="space-y-4">
                  <div className="text-center space-y-2 no-print select-none">
                    <span className="inline-flex items-center gap-1 text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full font-semibold">
                      <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                      Geração de Código Único Efetuada
                    </span>
                    <h2 className="text-2xl font-display font-extrabold text-[#11c462] uppercase leading-none">
                      Voucher Digital Disponível
                    </h2>
                    <p className="text-sm text-slate-400 max-w-md mx-auto mt-2">
                      Parabéns! Sua credencial exclusiva antifraude foi emitida. Salve ou imprima para apresentar na recepção.
                    </p>
                  </div>
                  
                  <TicketView 
                    convidado={convidadoLogado} 
                    onRegisterAnother={handleVoltarCadastro}
                  />
                </div>
              ) : (
                // Formulário de Cadastro Inicial
                <RegistrationForm onSuccess={handleCadastroSucesso} />
              )}
            </motion.div>
          )}

          {/* ABA 2: LEITOR DE QR CODE DO SEGURANÇA */}
          {tab === 'scanner' && isAdmin && (
            <motion.div
              key="aba-scanner"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <QRScannerView adminNome={adminUser?.nome} />
            </motion.div>
          )}

          {/* ABA 3: PAINEL ADMINISTRATIVO COM SENHA */}
          {tab === 'admin' && isAdmin && (
            <motion.div
              key="aba-admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              <AdminPanel adminUser={adminUser} onLogout={handleLogoutAdmin} />
            </motion.div>
          )}

        </AnimatePresence>

      </main>

      {/* 🏛️ RODAPÉ DO RECONHECIMENTO (NO-PRINT) */}
      <footer className="mt-auto py-6 border-t border-white/10 bg-[#050B1F]/30 no-print text-center text-xs text-slate-400 select-none space-y-2">
        <div className="flex justify-center items-center gap-1.5 font-medium">
          <Globe className="w-4 h-4 text-slate-500" />
          <span>Festa da Independência Nacional de Cabo Verde • 24 de julho de 2026</span>
        </div>
        <div className="text-[10px] text-slate-500 max-w-md mx-auto leading-relaxed px-4">
          Sistema Diplomático Registrado e Blindado Antifraude. Em caso de dúvidas, favor consultar o Comitê de Recepção da República de Cabo Verde.
        </div>
      </footer>

      {/* MODAL DE SEGURANÇA PARA AUTENTICAÇÃO ADMINISTRATIVA (NO-PRINT) */}
      <AnimatePresence>
        {mostrarModalAdmin && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#050B1F] rounded-2xl max-w-sm w-full border border-white/15 overflow-hidden shadow-2xl p-6 space-y-5"
            >
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/25 flex items-center justify-center mx-auto">
                  <KeyRound className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-display font-bold text-white">Central de Portaria</h3>
                <p className="text-xs text-slate-400">Entre com a credencial oficial para acessar o scanner e o banco de leituras</p>
              </div>

              <form onSubmit={handleLoginAdminSubmit} className="space-y-4">
                {erroSenhaAdmin && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-200 text-xs font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{erroSenhaAdmin}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Senha de Protocolo</label>
                  <input
                    type="password"
                    required
                    placeholder="Digite a senha protocolar..."
                    value={senhaAdmin}
                    onChange={(e) => setSenhaAdmin(e.target.value)}
                    className="w-full px-4 py-2 bg-black/35 border border-white/10 rounded-xl text-xs text-slate-100 placeholder:text-slate-500 text-center font-mono focus:outline-none focus:ring-1 focus:ring-[#003893]"
                  />
                  <span className="text-[9px] text-slate-500 block leading-tight text-center">Ano da Independência de Cabo Verde (4 dígitos)</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => { setMostrarModalAdmin(false); setSenhaAdmin(''); setErroSenhaAdmin(''); }}
                    className="flex-1 py-2 border border-white/15 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#CE1126] hover:bg-[#b00e20] text-white rounded-xl text-xs font-bold transition-all shadow-md"
                  >
                    Confirmar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
