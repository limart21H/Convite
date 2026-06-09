/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Convidado } from '../types.ts';
import { obterConvidados } from '../dbStore.ts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, MapPin, Clock, Globe, ArrowRight, BookOpen, Music, 
  Utensils, Sparkles, Compass, Users, HeartHandshake, Volume2, VolumeX, Play, Pause, RefreshCw, Lock
} from 'lucide-react';

const CAROUSEL_IMAGENS = [
  {
    nome: "Santa Maria, Ilha do Sal",
    vibe: "Santuário turístico de águas mornas e areia fina e dourada.",
    url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nome: "Baía do Mindelo, São Vicente",
    vibe: "Capital da cultura e da música, berço da lendária Cesária Évora.",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nome: "Montanhas de Santo Antão",
    vibe: "Os vales verdejantes cultivados em níveis, esculpidos na rocha basáltica.",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nome: "Planalto da Assomada, Santiago",
    vibe: "Região fértil de grande importância comercial e tradição cultural.",
    url: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nome: "Tarrafal, Praia Formosa",
    vibe: "Praias deslumbrantes com palmeiras, carisma e história viva nacional.",
    url: "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=1200&q=80"
  },
  {
    nome: "Porto Novo, Santo Antão",
    vibe: "Rivalidade de belezas entre fés de mar profundo e as maiores escarpas do arquipélago.",
    url: "https://images.unsplash.com/photo-1473116763269-25541579ffb1?auto=format&fit=crop&w=1200&q=80"
  }
];

const MUSICAS = [
  {
    titulo: "Sodade",
    artista: "Cesária Évora",
    genero: "Morna (Poética da canção lenta)",
    ano: "1992",
    duracao: "3:48",
    vibe: "A dor eterna da partida para Angola e a saudade do torrão natal."
  },
  {
    titulo: "Funaná no Porto de Mindelo",
    artista: "Ska Cabo Verde",
    genero: "Funaná (Ritmo acelerado do acordeão gaita)",
    ano: "2018",
    duracao: "4:12",
    vibe: "Ritmo vibrante e festivo, marcado pela energia contagiante do acordeão cabo-verdiano."
  },
  {
    titulo: "Morabeza Atlântica",
    artista: "Orquestra Diáspora",
    genero: "Coladeira (O pulsar alegre das ilhas)",
    ano: "2024",
    duracao: "3:30",
    vibe: "Uma homenagem instrumental às dez estrelas soberanas cabo-verdianas."
  }
];

const CURIOSIDADES = [
  {
    pergunta: "Por que se chama Cabo Verde?",
    resposta: "O nome vem da Península de Cabo Verde, no Senegal, o ponto mais ocidental do continente africano, avistado pelos navegadores que depois chegaram ao arquipélago."
  },
  {
    pergunta: "O que é a 'Morabeza'?",
    resposta: "É o traço mais marcante do povo: uma recepção transbordante de hospitalidade, bondade profunda, sorriso aberto e acolhimento caloroso aos visitantes."
  },
  {
    pergunta: "Quantas ilhas formam o país?",
    resposta: "Cabo Verde é formado por 10 ilhas (9 habitadas) divididas em Barlavento (ao norte) e Sotavento (ao sul), todas de origem vulcânica majestosa."
  },
  {
    pergunta: "Como surgiu o Crioulo Cabo-verdiano?",
    resposta: "É a língua crioula mais antiga do mundo ainda falada, nascida do contato íntimo e fusão do português do século XV com várias línguas da África Ocidental."
  }
];

export function InicioView({ onSolicitarInscricao }: { onSolicitarInscricao: () => void }) {
  const [slideAtivo, setSlideAtivo] = useState(0);
  const [tempoRestante, setTempoRestante] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
  const [musicaAtiva, setMusicaAtiva] = useState(0);
  const [tocando, setTocando] = useState(false);
  const [progress, setProgress] = useState(0);
  const [curiosidadeAberta, setCuriosidadeAberta] = useState<number | null>(null);
  
  // Dados de Diáspora
  const [convidados, setConvidados] = useState<Convidado[]>([]);
  const [paisSelecionado, setPaisSelecionado] = useState<string | null>("Brasil");
  const [totalPorPais, setTotalPorPais] = useState<Record<string, number>>({});

  // Atualizar banco de convidados e agrupar para o Mapa
  useEffect(() => {
    const carregar = () => {
      const lista = obterConvidados();
      setConvidados(lista);
      
      const totais: Record<string, number> = {};
      lista.forEach(c => {
        if (c.statusConvite === 'Ativo') {
          const p = c.paisResidencia || 'Brasil';
          totais[p] = (totais[p] || 0) + 1;
        }
      });
      setTotalPorPais(totais);
    };
    
    carregar();
    const interval = setInterval(carregar, 3000);
    return () => clearInterval(interval);
  }, []);

  // Countdown para 24 de julho de 2026 às 22h00 (Porto Alegre, RS)
  useEffect(() => {
    const dataMeta = new Date("2026-07-24T22:00:00-03:00"); // Horário de Porto Alegre (GMT-3)
    
    const atualizarCalculo = () => {
      const agora = new Date();
      const diferenca = dataMeta.getTime() - agora.getTime();
      
      if (diferenca <= 0) {
        setTempoRestante({ dias: 0, horas: 0, minutos: 0, segundos: 0 });
        return;
      }
      
      const segundos = Math.floor((diferenca / 1000) % 60);
      const minutos = Math.floor((diferenca / (1000 * 60)) % 60);
      const horas = Math.floor((diferenca / (1000 * 60 * 60)) % 24);
      const dias = Math.floor(diferenca / (1000 * 60 * 60 * 24));
      
      setTempoRestante({ dias, horas, minutos, segundos });
    };
    
    atualizarCalculo();
    const timer = setInterval(atualizarCalculo, 1000);
    return () => clearInterval(timer);
  }, []);

  // Carousel Automático de Imagens de Cabo Verde
  useEffect(() => {
    const timer = setInterval(() => {
      setSlideAtivo(prev => (prev + 1) % CAROUSEL_IMAGENS.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Simulação gráfica do Player de Áudio tradicional
  useEffect(() => {
    let timer: any;
    if (tocando) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setTocando(false);
            return 0;
          }
          return prev + 1.2;
        });
      }, 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [tocando]);

  const handleTogglePlay = () => {
    setTocando(!tocando);
    if (!tocando && progress === 0) {
      setProgress(1);
    }
  };

  const handleAvancarMusica = () => {
    setMusicaAtiva(prev => (prev + 1) % MUSICAS.length);
    setProgress(0);
    setTocando(true);
  };

  // Coordenadas nos nós do mapa SVG (glowing nodes)
  const NOS_MAPA = [
    { nome: "Brasil", x: 260, y: 150, cx: "Porto Alegre / SP", desc: "Sede Oficial das Festividades de 2026." },
    { nome: "Cabo Verde", x: 440, y: 110, cx: "Ilhas Semente", desc: "A amada terra de origem de todos nós." },
    { nome: "Portugal", x: 460, y: 55, cx: "Lisboa / Porto", desc: "Grande polo histórico da diáspora europeia." },
    { nome: "Estados Unidos", x: 190, y: 50, cx: "Boston / New England", desc: "Um dos maiores centros de emigração desde o século XIX." },
    { nome: "França", x: 490, y: 48, cx: "Paris / Nice", desc: "Pátria artística e intelectuária da diáspora." },
    { nome: "Holanda", x: 500, y: 35, cx: "Roterdã", desc: "Comunidade marítima altamente integrada." },
    { nome: "Angola", x: 512, y: 155, cx: "Luanda", desc: "Fortes conexões históricas de trabalho e canções." },
  ];

  return (
    <div id="inicio_root_view" className="space-y-12 no-print">
      
      {/* 🌌 SEÇÃO HERO SENSORIAL COM CAROUSEL E EMBLEMAS */}
      <section className="relative rounded-3xl overflow-hidden min-h-[560px] flex flex-col justify-between border border-white/10 shadow-2xl">
        {/* Carousel Background */}
        <div className="absolute inset-x-0 inset-y-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slideAtivo}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0"
            >
              <img
                src={CAROUSEL_IMAGENS[slideAtivo].url}
                alt={CAROUSEL_IMAGENS[slideAtivo].nome}
                className="w-full h-full object-cover brightness-[0.35]"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </AnimatePresence>
          {/* Glassmorphism overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#020512] via-[#020512]/40 to-transparent"></div>
          <div className="absolute inset-0 bg-black/10"></div>
        </div>

        {/* Header Superior - Cidade de Porto Alegre 2026 */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Compass className="w-5 h-5 text-[#FFD100] animate-spin-slow" />
            <span className="text-[10px] sm:text-xs font-mono font-black tracking-widest text-slate-300 uppercase bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
              Sede Presencial: Porto Alegre - RS | Local a Definir
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-[#FFD100] tracking-wider block bg-black/40 backdrop-blur px-2.5 py-0.5 rounded-md border border-amber-400/25">
              Cabo Verde • Independência 2026
            </span>
          </div>
        </div>

        {/* Conteúdo Central - Convite Principal / Welcome */}
        <div className="relative z-10 px-6 sm:px-12 max-w-3xl space-y-6 text-left my-auto">
          {/* Bandeira de Cabo Verde Waving Animada em SVG */}
          <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md">
            {/* Waving micro SVG flag */}
            <div className="w-12 h-8 rounded overflow-hidden shadow-md flex shrink-0 relative">
              <svg 
                viewBox="0 0 10 6" 
                fill="none" 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-full h-full animate-waving"
              >
                <style>{`
                  @keyframes wave {
                    0% { transform: skewY(0deg); }
                    50% { transform: skewY(2deg) scaleY(1.02); }
                    100% { transform: skewY(0deg); }
                  }
                  .animate-waving {
                    animation: wave 3s ease-in-out infinite;
                  }
                `}</style>
                <rect width="10" height="6" fill="#003893"/>
                <rect y="3" width="10" height="1" fill="#CE1126"/>
                <rect y="2.7" width="10" height="0.3" fill="#FFFFFF"/>
                <rect y="4" width="10" height="0.3" fill="#FFFFFF"/>
                <circle cx="3.5" cy="3.5" r="1.5" stroke="#F7D116" strokeWidth="0.3" fill="transparent" strokeDasharray="0.3 0.3"/>
              </svg>
            </div>
            <div>
              <p className="text-[10px] font-mono text-[#FFD100] tracking-widest leading-none font-bold uppercase">
                24 de julho de 2026
              </p>
              <h4 className="text-xs sm:text-sm font-semibold text-white mt-1 leading-snug">
                Festa da Independência de Cabo Verde em Porto Alegre
              </h4>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-5xl font-display font-black uppercase text-white tracking-tight leading-none">
              O Reencontro Oficial da <br/>
              <span className="text-amber-400">Nossa Morabeza</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Uma noite inesquecível de orgulho cabo-verdiano, gastronomia autêntica, morna ao vivo e networking diplomático no Rio Grande do Sul.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onSolicitarInscricao}
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(251,191,36,0.3)] transition-all rounded-xl text-sm uppercase tracking-wider cursor-pointer font-sans shrink-0 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-slate-950 shrink-0" />
              <span>Garantir Meu Convite Oficial</span>
              <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" />
            </button>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#11c462] animate-ping shrink-0"></span>
              <span>Cadastros abertos para a diáspora</span>
            </div>
          </div>
        </div>

        {/* Barra Inferior com Cronômetro de Luxo */}
        <div className="relative z-10 bg-black/40 backdrop-blur-md border-t border-white/10 p-4 sm:p-6 flex flex-col md:flex-row items-center justify-center gap-4">
          {/* Cronômetro Contagem Regressiva de Luxo */}
          <div className="flex items-center gap-3 bg-[#050C21]/80 border border-white/10 rounded-2xl px-5 py-2.5 shadow-lg select-none text-right shrink-0">
            <div className="text-left hidden lg:block pr-4 border-r border-white/10">
              <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">Contagem Regressiva</p>
              <p className="text-[11px] font-semibold text-white mt-1">Para as Solenidades</p>
            </div>
            
            <div className="flex gap-2 text-center">
              <div className="min-w-[48px]">
                <p className="text-lg sm:text-2xl font-mono font-black text-amber-400 leading-none">{tempoRestante.dias.toString().padStart(2, '0')}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-450 uppercase mt-1">Dias</p>
              </div>
              <span className="text-amber-400/50 font-bold text-lg sm:text-xl">:</span>
              <div className="min-w-[44px]">
                <p className="text-lg sm:text-2xl font-mono font-black text-white leading-none">{tempoRestante.horas.toString().padStart(2, '0')}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-450 uppercase mt-1">Horas</p>
              </div>
              <span className="text-amber-400/50 font-bold text-lg sm:text-xl">:</span>
              <div className="min-w-[44px]">
                <p className="text-lg sm:text-2xl font-mono font-black text-white leading-none">{tempoRestante.minutos.toString().padStart(2, '0')}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-450 uppercase mt-1">Min</p>
              </div>
              <span className="text-amber-400/50 font-bold text-lg sm:text-xl">:</span>
              <div className="min-w-[44px]">
                <p className="text-lg sm:text-2xl font-mono font-black text-rose-500 leading-none">{tempoRestante.segundos.toString().padStart(2, '0')}</p>
                <p className="text-[8px] sm:text-[9px] text-slate-450 uppercase mt-1">Seg</p>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* 📜 BENTO GRID: GALERIA CULTURAL SENSORIAL */}
      <section className="space-y-6 text-left">
        <div className="space-y-1.5">
          <span className="text-xs font-mono font-bold text-[#FFD100] uppercase tracking-wider flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-[#FFD100]" />
            Patrimônio Cultural da Humanidade
          </span>
          <h2 className="text-xl sm:text-2xl font-display font-black uppercase text-white">
            Galeria Cultural e Legado Cabo-Verdiano
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Mergulhe na rica tapeçaria histórica de Cabo Verde, desde o grito triunfante de independência em 1975 até as harmonias musicais celebradas no salão de gala da nossa comemoração.
          </p>
        </div>

        {/* Bento Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          
          {/* Caixa 1: História da Independência (Grande 12/12) */}
          <div className="md:col-span-12 bg-[#050C21] rounded-2xl border border-white/10 p-6 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all text-left">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold text-[#CE1126] uppercase tracking-widest bg-[#CE1126]/10 px-2.5 py-1 rounded border border-[#CE1126]/20">
                ★ 5 de Julho de 1975
              </span>
              <h3 className="text-lg font-display font-bold text-white mt-2 leading-snug">
                A Jornada Soberana para a Dignidade Nacional
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Após séculos de colonização, impulsionado pela liderança revolucionária de <strong>Amílcar Cabral</strong> e os combatentes da liberdade do PAIGC, Cabo Verde declarou formalmente a sua independência em 5 de Julho de 1975 no Estádio da Várzea.
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                A luta travou-se em conjunto com as populações irmãs da Guiné-Bissau e de Angola. Do exílio nas Américas e na Europa, a diáspora ajudou imensamente aportando fundos e solidariedade política nacional, estabelecendo raíces de que o orgulho de pertencer permanece inalterado por mares e gerações.
              </p>
            </div>

            <div className="flex items-center gap-3.5 bg-white/5 p-3 rounded-xl border border-white/5 text-[11px] text-[#FFD100] font-mono">
              <Compass className="w-4 h-4 shrink-0 text-[#FFD100]" />
              <span>Cabo Verde uniu as suas forças sob o lema: Unidade, Luta, Progresso.</span>
            </div>
          </div>

          {/* Caixa 3: Música tradicional e simulated Player (Grande 6/12) */}
          <div className="md:col-span-6 bg-[#050C21] rounded-2xl border border-white/10 p-6 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all text-left">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Music className="w-5 h-5 text-[#FFD100] shrink-0" />
                  <span className="text-xs font-mono font-bold text-[#FFD100] uppercase tracking-wider">Sons do Coração Cabo-Verdiano</span>
                </div>
                <Users className="w-4 h-4 text-emerald-400" />
              </div>
              <h3 className="text-base font-bold text-white">Morna & Melodias da Morabeza</h3>
              <p className="text-xs text-slate-355 leading-relaxed">
                A música é a alma das dez ilhas. Composta por gêneros melancólicos como a <strong>Morna</strong> (eleita Patrimônio Cultural Imaterial de Unesco em 2019), o enérgico <strong>Funaná</strong> e a alegre <strong>Coladeira</strong>.
              </p>

              {/* Simulated Audios Player list */}
              <div className="p-3 bg-black/35 rounded-xl border border-white/10 space-y-3 font-mono">
                <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="text-[10px] text-slate-405 leading-none">
                    <p className="uppercase font-bold text-white tracking-widest">{MUSICAS[musicaAtiva].titulo}</p>
                    <p className="text-slate-500 mt-1">{MUSICAS[musicaAtiva].artista} • {MUSICAS[musicaAtiva].genero}</p>
                  </div>
                  <span className="text-[10px] text-[#FFD100] leading-none shrink-0">{MUSICAS[musicaAtiva].ano}</span>
                </div>

                {/* Progress bar visualizer */}
                <div className="space-y-1">
                  <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center text-[9px] text-slate-500">
                    <span>{tocando ? "0:" + Math.round(progress * 2.2).toString().padStart(2, '0') : "0:00"}</span>
                    <span>{MUSICAS[musicaAtiva].duracao}</span>
                  </div>
                </div>

                {/* Equalizer lines simple simulation */}
                {tocando && (
                  <div className="flex justify-center items-end gap-1 px-4 h-6 py-0.5 select-none pointer-events-none">
                    {Array.from({ length: 15 }).map((_, idx) => {
                      const h = Math.floor(Math.random() * 20) + 4;
                      return (
                        <div 
                          key={idx} 
                          className="w-1.5 bg-gradient-to-t from-amber-400 to-amber-500 rounded-t-sm transition-all duration-200"
                          style={{ height: `${h}px` }}
                        />
                      );
                    })}
                  </div>
                )}

                {/* Controls buttons */}
                <div className="flex items-center justify-center gap-3 pt-0.5">
                  <button 
                    onClick={handleTogglePlay}
                    className="p-1 px-3 bg-slate-800 text-white rounded hover:bg-slate-700 cursor-pointer text-[10px] flex items-center gap-1 border border-white/5"
                  >
                    {tocando ? <VolumeX className="w-3.5 h-3.5 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 shrink-0 text-amber-400" />}
                    <span>{tocando ? "Mudar Canção" : "Escutar Amostra"}</span>
                  </button>
                  <button 
                    onClick={handleAvancarMusica}
                    className="p-1 px-3 bg-slate-805 text-amber-400 rounded hover:text-white cursor-pointer text-[10px] flex items-center gap-1 border border-white/10"
                    title="Próxima Canção"
                  >
                    <RefreshCw className="w-3 h-3 text-emerald-400" />
                    <span>Próxima</span>
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              "Sodade, sodade, sodade de nha terra de S. Nicolau..." — Cesária Évora.
            </p>
          </div>

          {/* Caixa 4: Curiosidades Interactive (Grande 6/12) */}
          <div className="md:col-span-6 bg-[#050C21] rounded-2xl border border-white/10 p-6 flex flex-col justify-between space-y-4 hover:border-white/15 transition-all text-left">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-[#CE1126] shrink-0" />
                <span className="text-xs font-mono font-bold text-[#FFD100] uppercase tracking-wider">Fatos e Segredos Científicos</span>
              </div>
              <h3 className="text-base font-bold text-white">Curiosidades de Espanto</h3>
              <p className="text-xs text-slate-350 leading-relaxed">
                Clique em um dos tópicos abaixo para revelar mistérios e fatos admiráveis que poucas pessoas sabem sobre as ilhas cabo-verdianas.
              </p>

              {/* List of accordion style queries */}
              <div className="space-y-2 pt-1 font-sans">
                {CURIOSIDADES.map((c, idx) => {
                  const isOpen = curiosidadeAberta === idx;
                  return (
                    <div 
                      key={idx} 
                      className="border border-white/5 rounded-xl bg-black/20 overflow-hidden text-xs transition-colors"
                    >
                      <button
                        onClick={() => setCuriosidadeAberta(isOpen ? null : idx)}
                        className="w-full p-2.5 px-3.5 text-left font-semibold text-white hover:bg-white/5 cursor-pointer flex items-center justify-between"
                      >
                        <span className="text-[11px] font-medium leading-normal">{c.pergunta}</span>
                        <span className="text-[#FFD100] text-center font-bold text-xs">{isOpen ? "−" : "+"}</span>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="bg-black/40 border-t border-white/5 p-3 px-3.5 text-[11px] text-slate-400 leading-relaxed"
                          >
                            {c.resposta}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 leading-none">
              <Compass className="w-3.5 h-3.5 text-blue-500 animate-spin-slow shrink-0" />
              <span>Cabo Verde é o primeiro país africano declarado livre de malária.</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
