/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { Convidado } from '../types.ts';
import { FlagCaboVerde, EmblemaOficial } from './FlagComponents.tsx';
import { Calendar, MapPin, Clock, ShieldCheck, Download, Printer, Copy, Check, Sparkles, AlertCircle } from 'lucide-react';
import QRCode from 'qrcode';
import { motion } from 'motion/react';
import { calcularAssinatura, criptografar } from '../dbStore.ts';

interface TicketViewProps {
  convidado: Convidado;
  onRegisterAnother?: () => void;
}

export function TicketView({ convidado, onRegisterAnother }: TicketViewProps) {
  const PAISAGENS = [
    {
      nome: "Praias do Sal",
      url: "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=800&q=80",
      vibe: "Sopro azul-turquesa do Atlântico"
    },
    {
      nome: "Baía do Mindelo",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
      vibe: "Espírito melódico e boêmio de São Vicente"
    },
    {
      nome: "Montanhas de Santo Antão",
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80",
      vibe: "Grandiosidade verdejante e picos imponentes"
    },
    {
      nome: "Cidade da Praia",
      url: "https://images.unsplash.com/photo-1473116763269-25541579ffb1?auto=format&fit=crop&w=800&q=80",
      vibe: "Berço da soberania e tradição em Santiago"
    },
    {
      nome: "Coqueirais do Tarrafal",
      url: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=800&q=80",
      vibe: "Santuário de areias mornas e coqueirais da liberdade"
    },
    {
      nome: "Vulcão do Fogo",
      url: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=800&q=80",
      vibe: "Imponência monumental e solo vulcânico sagrado"
    }
  ];

  const numId = parseInt(convidado.id) || 1001;
  const paisagem = PAISAGENS[numId % PAISAGENS.length];

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [copiado, setCopiado] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  // Gerar o QR Code com payload seguro e criptográfico real
  useEffect(() => {
    const payloadPlano = JSON.stringify({
      id: convidado.id,
      codigo: convidado.codigoAntifraude,
      uuid: convidado.uuid,
      assinatura: calcularAssinatura(convidado.uuid, convidado.codigoAntifraude)
    });

    const payloadCriptografado = criptografar(payloadPlano);

    QRCode.toDataURL(payloadCriptografado, {
      width: 220,
      margin: 2,
      color: {
        dark: '#002561', // Azul profundo
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'H'
    })
    .then(url => {
      setQrCodeDataUrl(url);
    })
    .catch(err => {
      console.error('Erro ao gerar código QR:', err);
    });
  }, [convidado]);

  // Copiar código antifraude para a área de transferência
  const copiarCodigo = () => {
    navigator.clipboard.writeText(convidado.codigoAntifraude);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  // Acionar impressão nativa focada apenas no ingresso
  const imprimirTicket = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-1">
      
      {/* Botões Superiores Rápidos */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#050B1F] p-3 rounded-2xl border border-white/10 no-print">
        <button
          onClick={onRegisterAnother}
          className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline px-3 py-1.5 rounded-lg hover:bg-white/5 transition-all"
        >
          ← Cadastrar outro convidado
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={copiarCodigo}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-200 font-medium text-xs shadow-sm hover:bg-white/10 transition-all"
            title="Copiar Código Antifraude"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? 'Copiado!' : 'Copiar Código'}</span>
          </button>
          <button
            onClick={imprimirTicket}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#003893] text-white font-medium text-xs shadow-sm hover:bg-[#0047bd] transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir Convite</span>
          </button>
        </div>
      </div>

      {/* Cartão de Ingresso Principal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        ref={ticketRef}
        id="convite_digital_print"
        className="relative rounded-3xl overflow-hidden border-2 border-[#DFBA6B]/70 bg-[#03061A] text-slate-100 shadow-[0_10px_40px_rgba(0,0,0,0.5)] print:shadow-none print:border-neutral-800"
      >
        
        {/* Separador Central c/ Linhas de Ouro e Selo de Cera Virtual (Apenas no Desktop) */}
        <div className="hidden lg:flex absolute left-[58.33%] top-0 bottom-0 w-[1.5px] bg-gradient-to-b from-[#DFBA6B]/80 via-[#99762F] to-[#DFBA6B]/80 z-20 items-center justify-center -translate-x-1/2">
          {/* Wave background cutout */}
          <div className="absolute w-14 h-24 bg-[#03061A] rounded-full border border-y border-[#DFBA6B]/30 flex items-center justify-center">
            {/* Medalha Selo de Ouro */}
            <div className="w-11 h-11 rounded-full bg-gradient-to-b from-[#FFF2A3] via-[#D1A63B] to-[#785310] p-[1.5px] shadow-[0_4px_12px_rgba(0,0,0,0.6)] flex items-center justify-center relative active:scale-95 transition-all">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-[#DFBA6B] to-[#B08930] flex items-center justify-center relative overflow-hidden">
                {/* Linha/Aura interna */}
                <div className="absolute inset-[2px] rounded-full border border-[#FFF2A3]/30"></div>
                {/* Ícone de Estátua/Monumento Mini ou Estrelinhas */}
                <span className="text-[#3b2a09] text-[11px] font-black font-serif">51º</span>
              </div>
            </div>
          </div>
        </div>

        {/* Diagonal Ribbon da Bandeira de Cabo Verde (Canto Superior Direito) */}
        <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none select-none z-10">
          <div className="absolute top-[-10px] right-[-45px] w-[140px] h-[50px] bg-[#003893] border-b-2 border-white/45 rotate-45 flex flex-col items-center justify-end pb-1.5 shadow-md">
            {/* Faixas branca e vermelha */}
            <div className="w-full h-[3px] bg-white"></div>
            <div className="w-full h-[5px] bg-[#C60C30]"></div>
            <div className="w-full h-[3px] bg-white"></div>
            {/* Pequenas Estrelas Douradas da Bandeira */}
            <div className="flex gap-0.5 justify-center mt-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-[6px] text-[#FFD100] leading-none mb-0.5">★</span>
              ))}
            </div>
          </div>
        </div>

        {/* Layout Dividido: Horizontal no desktop (lg), empilhado no mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
          
          {/* LADO ESQUERDO: Painel do Evento (Col-span 7) */}
          <div className="lg:col-span-7 relative p-8 sm:p-12 flex flex-col justify-between overflow-hidden border-b lg:border-b-0 border-[#DFBA6B]/20">
            
            {/* Foto de Fundo com Overlay Luxuoso */}
            <div className="absolute inset-0 z-0">
              <img
                src={paisagem.url}
                alt={paisagem.nome}
                className="w-full h-full object-cover scale-105 opacity-[0.25] mix-blend-luminosity brightness-[0.7] contrast-[1.1]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-[#020512] via-[#041031]/85 to-[#020512]/95"></div>
              {/* Moldura Dourada da Textura */}
              <div className="absolute inset-2 border border-[#DFBA6B]/15 rounded-2xl pointer-events-none"></div>
              <div className="absolute inset-3.5 border border-[#DFBA6B]/40 rounded-2.5xl pointer-events-none opacity-30"></div>
            </div>

            {/* Conteúdo do Painel de Evento */}
            <div className="relative z-10 space-y-6 flex-grow flex flex-col justify-center">
              
              {/* Emblema Dourado de Cabo Verde Criado Manualmente em SVG */}
              <div className="flex justify-center">
                <svg className="w-16 h-16 text-[#DFBA6B] drop-shadow-[0_2px_12px_rgba(223,186,107,0.35)]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx="50" cy="50" r="41" stroke="currentColor" strokeWidth="1.5" />
                  <circle cx="50" cy="50" r="38" fill="#001845/60" />
                  {/* Estátua ou monumento da Independência */}
                  <g transform="translate(50, 48) scale(0.95)">
                    <path d="M -5,14 L -1.5,-2 L 1.5,-2 L 5,14 Z" fill="currentColor" />
                    <path d="M -1.5,-2 C -6,-10 0,-14 0,-14 C 0,-14 6,-10 1.5,-2 Z" fill="#C60C30" />
                    <circle cx="0" cy="14" r="2.5" fill="#FFFFFF" />
                  </g>
                  {/* Estrela solitária dourada */}
                  <polygon points="50,15 51.5,19 55,19 52,21 53.5,25 50,23 46.5,25 48,21 45,19 48.5,19" fill="currentColor" />
                  {/* Três estrelas à esquerda e direita */}
                  {Array.from({ length: 10 }).map((_, i) => {
                    const angle = (i * 36 - 90) * Math.PI / 180;
                    const x = 50 + 32 * Math.cos(angle);
                    const y = 50 + 32 * Math.sin(angle);
                    return (
                      <polygon
                        key={i}
                        points="0,-2.2 0.7,-0.7 2.2,-0.7 1,0.4 1.4,1.8 0,1 -1.4,1.8 -1,0.4 -2.2,-0.7 -0.7,-0.7"
                        transform={`translate(${x}, ${y})`}
                        fill="currentColor"
                      />
                    );
                  })}
                </svg>
              </div>

              {/* Títulos do Convite */}
              <div className="space-y-1">
                <span className="text-[10px] text-[#DFBA6B] font-extrabold uppercase tracking-[0.22em] block text-center font-sans">
                  CONVITE OFICIAL
                </span>
                <h2 className="text-3xl sm:text-4xl text-center font-serif font-extrabold text-[#FFFFFF] tracking-tight leading-tight uppercase">
                  51<span className="text-xl align-super font-semibold mr-0.5 relative -top-1">ª</span> FESTA DA INDEPENDÊNCIA
                </h2>
                <p className="text-center font-script text-[#DFBA6B] text-4xl sm:text-5xl leading-none pt-1">
                  República de Cabo Verde
                </p>
                
                {/* Linha 2026 */}
                <div className="flex items-center justify-center gap-3 py-1">
                  <span className="w-12 h-[1.2px] bg-gradient-to-r from-transparent to-[#DFBA6B]/75"></span>
                  <span className="text-white font-serif tracking-[0.25em] text-sm font-semibold select-none">2026</span>
                  <span className="w-12 h-[1.2px] bg-gradient-to-l from-transparent to-[#DFBA6B]/75"></span>
                </div>

                {/* 5 Estrelas Douradas */}
                <div className="flex justify-center gap-1.5 text-[#DFBA6B] text-[10px]">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
              </div>

              {/* Slogan */}
              <div className="text-center py-1 space-y-1">
                <p className="text-[10px] sm:text-xs text-white/90 font-bold uppercase tracking-wider font-sans">
                  "51 ANOS DE LIBERDADE, UNIDADE E PROGRESSO"
                </p>
                <p className="text-[9px] sm:text-[10px] text-amber-300 font-extrabold tracking-widest uppercase font-mono">
                  ORGULHO DE SER CABO-VERDIANO!
                </p>
              </div>

              {/* BANDEIRA ARTÍSTICA PINTADA */}
              <div className="relative flex justify-center py-1">
                <div className="relative w-48 h-12 flex items-center justify-center">
                  <svg viewBox="0 0 200 60" className="w-full h-full drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                    <defs>
                      <clipPath id="painted-clip">
                        <path d="M 6,12 Q 52,6 98,13 T 194,11 Q 188,28 194,48 Q 142,53 98,44 T 6,48 Q 14,30 6,12 Z" />
                      </clipPath>
                    </defs>
                    <g clipPath="url(#painted-clip)">
                      {/* Fundo Azul */}
                      <rect width="200" height="60" fill="#003893" />
                      {/* Faixas tricolores */}
                      <rect y="31" width="200" height="3" fill="white" />
                      <rect y="34" width="200" height="5" fill="#C60C30" />
                      <rect y="39" width="200" height="3" fill="white" />
                      
                      {/* Anel deestrelas da bandeira */}
                      {Array.from({ length: 10 }).map((_, i) => {
                        const angle = (i * 36) * Math.PI / 180;
                        const cx = 55 + 12 * Math.cos(angle);
                        const cy = 37 + 12 * Math.sin(angle);
                        return (
                          <polygon
                            key={i}
                            points="0,-2 0.6,-0.6 2,-0.6 0.9,0.3 1.3,1.7 0,0.9 -1.3,1.7 -0.9,0.3 -2,-0.6 -0.6,-0.6"
                            transform={`translate(${cx}, ${cy})`}
                            fill="#FFD100"
                          />
                        );
                      })}
                    </g>
                  </svg>
                </div>
              </div>

              {/* VETORES DE LINHAS DE PAISAGEM CABO-VERDIANA (Dourado de Luxo) */}
              <div className="relative pt-1">
                <svg viewBox="0 0 400 62" fill="none" className="w-full text-[#DFBA6B]/30 overflow-visible">
                  {/* Coqueiro / Palmeira */}
                  <path d="M 30,52 Q 35,32 25,12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 25,12 Q 13,14 8,20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 25,12 Q 19,7 14,6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 25,12 Q 31,4 39,6" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 25,12 Q 36,14 41,20" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  
                  {/* Linhas de Montanhas (Ilha de Santo Antão / Fogo) */}
                  <path d="M 50,52 L 75,27 L 90,40 L 115,17 L 140,52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  
                  {/* Ondas do mar de Cabo Verde */}
                  <path d="M 152,47 C 160,42 165,50 172,47 C 180,42 185,50 192,47" stroke="currentColor" strokeWidth="0.75" />
                  <path d="M 150,51 C 158,46 163,54 170,51 C 178,46 183,54 190,51" stroke="currentColor" strokeWidth="0.75" />
                  
                  {/* Barco à Vela tradicional das ilhas */}
                  <path d="M 230,47 L 255,47 C 253,52 232,52 230,47" stroke="currentColor" strokeWidth="1" fill="currentColor" fillOpacity="0.08" />
                  <path d="M 242,47 L 242,22 L 232,40 Z" stroke="currentColor" strokeWidth="1" />
                  <path d="M 243,47 L 243,26 Q 255,36 243,42" stroke="currentColor" strokeWidth="1" />
                  
                  {/* Capela / Igreja do Monte / Monumento Colonial */}
                  <path d="M 285,52 L 285,37 L 295,37 L 295,52 M 290,37 L 290,22 L 287,26 M 290,22 L 293,26" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  <path d="M 280,52 L 280,42 L 300,42 L 300,52" stroke="currentColor" strokeWidth="1" />
                  <circle cx="290" cy="30" r="2" stroke="currentColor" strokeWidth="1" />
                  
                  {/* Altas montanhas e picos de São Nicolau / Monte Cara */}
                  <path d="M 320,52 L 345,12 L 360,34 L 380,20 L 395,52" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                </svg>
              </div>

            </div>

            {/* Rodapé do Painel de Evento */}
            <div className="relative z-10 text-center pt-4 border-t border-[#DFBA6B]/15 mt-3 select-none">
              <p className="text-[10px] text-[#DFBA6B] font-extrabold uppercase tracking-widest font-sans">
                DE CABO VERDE, PARA O MUNDO.
              </p>
              <p className="text-sm font-script text-[#DFBA6B] leading-none mt-1">
                Unidos pela nossa história, guiados pelo nosso futuro.
              </p>
            </div>

          </div>

          {/* LADO DIREITO: Detalhes do Ingresso e QR Code (Col-span 5) */}
          <div className="lg:col-span-5 relative p-8 flex flex-col justify-between bg-[#040A22] z-10">
            
            {/* Dados do Portador */}
            <div className="space-y-4 text-left">
              <div>
                <span className="text-[10px] text-[#A6C3E2] font-extrabold uppercase tracking-widest font-sans block">
                  CONVIDADO
                </span>
                <p className="text-xl sm:text-2xl font-display font-black text-white tracking-tight uppercase leading-tight mt-1">
                  {convidado.nome}
                </p>
                
                {/* Diáspora tag elegantizada */}
                {convidado.paisResidencia && (
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full mt-1.5 select-none font-sans uppercase">
                    🌍 DIÁSPORA: {convidado.cidadeAtual} • {convidado.paisResidencia}
                  </span>
                )}
              </div>

              {/* Atributos: CPF e Código Antifraude */}
              <div className="grid grid-cols-2 gap-4 border-t border-amber-400/15 pt-4">
                <div>
                  <span className="text-[9px] text-[#A6C3E2] font-bold uppercase tracking-widest block mb-0.5">
                    CPF
                  </span>
                  <p className="text-sm font-mono font-bold text-white/90">
                    {convidado.cpf}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-[#A6C3E2] font-bold uppercase tracking-widest block mb-0.5">
                    CÓDIGO ANTIFRAUDE
                  </span>
                  <p className="text-sm font-mono text-rose-500 font-extrabold flex items-center gap-1 uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{convidado.codigoAntifraude}</span>
                  </p>
                </div>
              </div>

              <div className="border-b border-amber-400/15 pb-4"></div>

              {/* Informações sobre Localização e Horários do Modelo */}
              <div className="space-y-4 pt-1">
                
                {/* DATA */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-sans block mb-0.5">DATA</span>
                    <p className="text-xs sm:text-xs text-white/90 font-bold uppercase tracking-wide">
                      Sexta-feira, 24 de Julho de 2026
                    </p>
                  </div>
                </div>

                {/* HORÁRIO */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-sans block mb-0.5">HORÁRIO</span>
                    <p className="text-xs sm:text-xs text-white/90 font-bold uppercase tracking-wide">
                      Abertura: 19h00 (Portaria Social)
                    </p>
                  </div>
                </div>

                {/* LOCAL */}
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest font-sans block mb-0.5">LOCAL</span>
                    <p className="text-xs sm:text-xs text-white/95 font-black uppercase leading-tight">
                      Palácio da Assembleia Nacional
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      Praia, Ilha de Santiago – Cabo Verde
                    </p>
                  </div>
                </div>

              </div>

            </div>

            {/* Bloco de Validação Tríplice c/ QR Code */}
            <div className="pt-6 border-t border-dashed border-white/10 mt-6 text-center">
              
              <div className="p-4 bg-black/45 rounded-2xl border border-[#DFBA6B]/25 relative backdrop-blur-md flex flex-col items-center justify-center">
                
                {/* QR Code de Alta Resolução real */}
                {qrCodeDataUrl ? (
                  <div className="bg-white p-1.5 rounded-xl shadow-lg border-2 border-amber-400/20 max-w-[136px]">
                    <img src={qrCodeDataUrl} alt="QR Code de Acesso Único" className="w-32 h-32" referrerPolicy="no-referrer" />
                  </div>
                ) : (
                  <div className="w-32 h-32 bg-slate-900 rounded-xl animate-pulse flex items-center justify-center">
                    <span className="text-slate-400 text-xs">Gerando QR...</span>
                  </div>
                )}
                
                {/* Código de Chave do QR */}
                <span className="text-[10px] text-[#DFBA6B] mt-3 font-mono font-bold tracking-widest block select-none uppercase">
                  {convidado.uuid.substring(0, 8).toUpperCase()}-{convidado.codigoAntifraude}
                </span>

                {/* Badge de Aprovação do Modelo */}
                <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-950/45 border border-emerald-500 text-emerald-400 text-[10px] font-black tracking-widest uppercase font-mono shadow-[0_0_12px_rgba(16,185,129,0.15)] select-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>ATIVO & AUTORIZADO</span>
                </div>

              </div>

            </div>

            {/* Rodapé Metadados Administrador e Segurança */}
            <div className="border-t border-white/5 pt-4 mt-6 flex justify-between items-end">
              <div className="text-[9px] text-slate-400 font-mono space-y-0.5 leading-normal text-left">
                <p>ID do Sistema: #{convidado.id}</p>
                <p>Cadastrado em: {new Date(convidado.dataCadastro).toLocaleDateString('pt-BR')} às {new Date(convidado.dataCadastro).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                <p className="text-slate-500">Sabor e Melodia de Cabo Verde – 51 Anos de Independência Soberana.</p>
              </div>
              
              <div className="flex items-center gap-1.5 bg-amber-500/5 border border-amber-500/10 rounded-lg p-1.5 select-none shrink-0 text-left">
                <ShieldCheck className="w-4 h-4 text-[#DFBA6B]" />
                <span className="text-[7.5px] leading-3 font-bold uppercase text-[#DFBA6B] block">
                  GARANTIA<br />ANTIFRAUDE
                </span>
              </div>
            </div>

          </div>

        </div>

      </motion.div>

      {/* Instruções Pós-Cadastro de Cortesia */}
      <div className="text-center bg-amber-500/10 p-4 rounded-2xl border border-amber-500/20 text-amber-200 text-xs max-w-lg mx-auto leading-relaxed no-print">
        <p className="font-semibold flex items-center justify-center gap-1.5 mb-1 text-amber-300">
          <AlertCircle className="w-4 h-4 text-amber-400" />
          O que fazer com este convite?
        </p>
        Tire um print da tela ou salve a imagem em PDF. Apresente este QR Code na portaria do evento. A equipe de recepção lerá o QR Code usando a câmera para autenticar instantaneamente sua entrada.
      </div>

    </div>
  );
}
