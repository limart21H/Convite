/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { Convidado } from '../types.ts';
import { 
  validarIngressoCompleto, 
  confirmarEntrada, 
  obterEstadoOnline,
  registrarLogAuditoria,
  descriptografar
} from '../dbStore.ts';
import { Camera, Check, AlertTriangle, XCircle, RefreshCw, ShieldCheck, UserCheck, Radio, ShieldAlert, FileText } from 'lucide-react';
import jsQR from 'jsqr';
import { motion, AnimatePresence } from 'motion/react';

interface QRScannerViewProps {
  adminNome?: string;
}

export function QRScannerView({ adminNome = 'Operador de Segurança' }: QRScannerViewProps) {
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [erroCamera, setErroCamera] = useState<string | null>(null);
  const [offlineState, setOfflineState] = useState(false);
  
  // Estados de Validação
  const [statusValidacao, setStatusValidacao] = useState<'scan' | 'valido' | 'invalido' | 'utilizado' | 'cancelado'>('scan');
  const [convidadoEscanado, setConvidadoEscanado] = useState<Convidado | null>(null);
  const [codigoEscanado, setCodigoEscanado] = useState<string>('');
  const [horarioLeitura, setHorarioLeitura] = useState<string>('');
  const [gpsLocation, setGpsLocation] = useState<string>('Buscando localização...');
  const [dispositivoInfo, setDispositivoInfo] = useState<string>('Dispositivo Terminal UI');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Monitorar GPS e metadados no carregamento
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsLocation(`Lat: ${position.coords.latitude.toFixed(4)}, Lon: ${position.coords.longitude.toFixed(4)}`);
        },
        (error) => {
          setGpsLocation('Lat: 14.9187, Lon: -23.5094 (Praia, Palácio Nacional)');
        },
        { enableHighAccuracy: true, timeout: 4000 }
      );
    } else {
      setGpsLocation('Lat: 14.9187, Lon: -23.5094 (Praia, Palácio Nacional)');
    }

    // Detectar detalhes aproximados do dispositivo portaria
    const ua = navigator.userAgent;
    let dev = 'Navegador Web';
    if (/android/i.test(ua)) dev = 'Android Device Camera';
    else if (/iPad|iPhone|iPod/.test(ua)) dev = 'iOS Device Camera';
    else if (/Macintosh/.test(ua)) dev = 'Mac Portaria Host';
    else if (/Windows/.test(ua)) dev = 'Windows Portaria Host';
    else if (/Linux/.test(ua)) dev = 'Linux Portaria Host';

    if (/Chrome/i.test(ua)) dev += ' (Chrome)';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) dev += ' (Safari)';
    else if (/Firefox/i.test(ua)) dev += ' (Firefox)';

    setDispositivoInfo(dev);
  }, []);

  // Monitorar Estado Online/Offline
  useEffect(() => {
    setOfflineState(!obterEstadoOnline());
    const interval = setInterval(() => {
      setOfflineState(!obterEstadoOnline());
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Parar a câmera quando o componente for desmontado
  useEffect(() => {
    return () => {
      pararCamera();
    };
  }, []);

  // Iniciar fluxo da Câmera
  const iniciarCamera = async () => {
    setErroCamera(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Impedir tela cheia no iOS
        videoRef.current.play();
        setCameraAtiva(true);
        setStatusValidacao('scan');
        
        // Iniciar loop de monitoramento de frames do QR Code
        animationFrameRef.current = requestAnimationFrame(loopVarreduraFrames);
      }
    } catch (err: any) {
      console.error('Erro de acesso à câmera:', err);
      setErroCamera(
        'Não foi possível acessar a câmera do dispositivo. Verifique se concedeu as permissões necessárias.'
      );
    }
  };

  // Parar fluxo da Câmera
  const pararCamera = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraAtiva(false);
  };

  // Processamento contínuo de frames do feed de vídeo
  const loopVarreduraFrames = () => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const video = videoRef.current;
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const qrCode = jsQR(imgData.data, imgData.width, imgData.height, {
          inversionAttempts: 'dontInvert'
        });

        if (qrCode) {
          tocarClickDetectado();
          processarConteudoQR(qrCode.data);
          return;
        }
      }
    }
    animationFrameRef.current = requestAnimationFrame(loopVarreduraFrames);
  };

  // Som rápido de foco/captura para indicar detecção antes de validar
  const tocarClickDetectado = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.04);
    } catch (e) {
      // Ignorar erros se bloqueado
    }
  };

  // Emitir feedback tátil (vibração) e sonoros diferenciados
  const tocarFeedbackCompleto = (tipo: 'sucesso' | 'utilizado' | 'invalido') => {
    // 1. Feedback Tátil (Vibração diferenciada)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        if (tipo === 'sucesso') {
          // Duplo toque curto e ritmado para sucesso
          navigator.vibrate([70, 40, 70]);
        } else if (tipo === 'utilizado') {
          // Três batidas médias de intensidade moderada
          navigator.vibrate([150, 80, 150, 80, 150]);
        } else {
          // Longo pulso contínuo indicando erro catastrófico/rejeitado
          navigator.vibrate([450]);
        }
      } catch (err) {
        // Ignorado se bloqueado pelo navegador
      }
    }

    // 2. Feedback Sonoro (Melodias distintas sintetizadas via Web Audio API)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (tipo === 'sucesso') {
        // Sucesso: Dupla harmônica ascendente limpa (ondas senoidais agradáveis)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.00, now + 0.08); // A5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (tipo === 'utilizado') {
        // Já utilizado: Tons alternados ("bip-bop") de aviso intrigante
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gain1 = audioCtx.createGain();
        const gain2 = audioCtx.createGain();

        osc1.connect(gain1);
        gain1.connect(audioCtx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(349.23, now); // F4
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.005, now + 0.15);

        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(293.66, now + 0.15); // D4
        gain2.gain.setValueAtTime(0.15, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.005, now + 0.35);

        osc1.start(now);
        osc1.stop(now + 0.15);
        osc2.start(now + 0.15);
        osc2.stop(now + 0.35);
      } else {
        // Erro / Inválido / Cancelado: Baixo ruído grave e prolongado (rejeição)
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.linearRampToValueAtTime(90, now + 0.4);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.005, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      }
    } catch (e) {
      // Autoplay ou Web Audio desabilitado
    }
  };

  // Tratar os dados lidos do QR Code
  const processarConteudoQR = (dados: string) => {
    pararCamera();
    
    // Registrar o exato horário da varredura para exibição na tela verde de validação
    const tempoLeitura = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'});
    setHorarioLeitura(tempoLeitura);
    
    let dadosProcessados = dados;
    // Se a string não começar com '{', tentamos descriptografar o QR Code completo criptografado
    if (dados && !dados.trim().startsWith('{')) {
      try {
        const descrypt = descriptografar(dados.trim());
        if (descrypt) {
          dadosProcessados = descrypt;
        }
      } catch (err) {
        console.error('Erro ao descriptografar QR Code:', err);
      }
    }

    let qrParsed: any = null;
    try {
      qrParsed = JSON.parse(dadosProcessados);
    } catch (e) {
      // Falha ao parsear JSON
    }

    if (!qrParsed || typeof qrParsed !== 'object') {
      setStatusValidacao('invalido');
      setConvidadoEscanado(null);
      setCodigoEscanado('');
      tocarFeedbackCompleto('invalido');
      
      // Registrar log de auditoria para tentativa não oficial
      registrarLogAuditoria({
        adminNome,
        dataLeitura: new Date().toLocaleDateString('pt-BR'),
        horaLeitura: tempoLeitura,
        resultado: 'Não Oficial / Adulterado',
        localValidacao: 'Portaria Principal - Palácio da Assembleia',
        convidadoNome: 'Assinatura inválida (Dados Corrompidos)',
        convidadoCpf: 'N/A',
        dispositivo: dispositivoInfo,
        localizacaoGps: gpsLocation
      });
      return;
    }

    const { uuid, codigo } = qrParsed;
    setCodigoEscanado(codigo || 'N/A');

    const validacao = validarIngressoCompleto(qrParsed);
    setConvidadoEscanado(validacao.convidado || null);

    if (validacao.resultado === 'valido') {
      setStatusValidacao('valido');
      tocarFeedbackCompleto('sucesso');
    } else if (validacao.resultado === 'utilizado') {
      setStatusValidacao('utilizado');
      tocarFeedbackCompleto('utilizado');
    } else if (validacao.resultado === 'cancelado') {
      setStatusValidacao('cancelado');
      tocarFeedbackCompleto('invalido');
    } else {
      setStatusValidacao('invalido'); // 'inexistente' ou 'adulterado' -> CONVITE NÃO OFICIAL
      tocarFeedbackCompleto('invalido');
    }

    // Registrar log no banco de dados de auditoria
    let resultadoAuditoria: 'Válido' | 'Já Utilizado' | 'Cancelado' | 'Não Oficial / Adulterado';
    if (validacao.resultado === 'valido') resultadoAuditoria = 'Válido';
    else if (validacao.resultado === 'utilizado') resultadoAuditoria = 'Já Utilizado';
    else if (validacao.resultado === 'cancelado') resultadoAuditoria = 'Cancelado';
    else resultadoAuditoria = 'Não Oficial / Adulterado';

    registrarLogAuditoria({
      adminNome,
      dataLeitura: new Date().toLocaleDateString('pt-BR'),
      horaLeitura: tempoLeitura,
      resultado: resultadoAuditoria,
      localValidacao: 'Portaria Principal - Palácio da Assembleia',
      convidadoUuid: validacao.convidado?.uuid || uuid || 'Desconhecido',
      convidadoNome: validacao.convidado?.nome || 'Desconhecido',
      convidadoCpf: validacao.convidado?.cpf || 'Desconhecido',
      dispositivo: dispositivoInfo,
      localizacaoGps: gpsLocation
    });
  };

  // Confirmar Entrada do Convidado Válido
  const handleConfirmarEntrada = () => {
    if (convidadoEscanado) {
      confirmarEntrada(convidadoEscanado.uuid, adminNome);
      setConvidadoEscanado(null);
      setCodigoEscanado('');
      iniciarCamera();
    }
  };

  // Reiniciar Scanner para nova leitura
  const handleVoltarScan = () => {
    setConvidadoEscanado(null);
    setCodigoEscanado('');
    iniciarCamera();
  };

  // Ocultar dados pessoais na tela do operador
  const mascararCpfSeguro = (cpf: string) => {
    if (cpf.length < 14) return cpf;
    return `***.${cpf.substring(4, 11)}.-**`;
  };

  return (
    <div className="max-w-md mx-auto bg-[#050B1F] rounded-2xl shadow-2xl overflow-hidden border border-white/10 transition-all duration-300">
      
      {/* Indicador de Conexão Virtual no Leitor */}
      <div className="bg-[#0B1224] text-white px-4 py-2.5 flex items-center justify-between text-xs border-b border-white/10">
        <div className="flex items-center gap-1.5 font-semibold text-slate-400 select-none">
          <Radio className={`w-3.5 h-3.5 ${offlineState ? 'text-[#FFD100]' : 'text-emerald-400 animate-pulse'}`} />
          <span>MODO DE CONEXÃO:</span>
        </div>
        <div>
          {offlineState ? (
            <span className="text-[#FFD100] font-mono bg-amber-500/10 px-2 py-0.5 rounded font-bold border border-amber-500/20">
              ⚡ OFFLINE (CACHE LOCAL ATIVO)
            </span>
          ) : (
            <span className="text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded font-bold border border-emerald-500/20">
              ● ONLINE (NUVEM SINCRONIZADA)
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* TELA DE SCANNER ATIVO */}
        {statusValidacao === 'scan' && (
          <motion.div
            key="scanner"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-6 text-center space-y-6"
          >
            <div>
              <h3 className="text-xl font-display font-bold text-white">
                Controle de Portaria & Acesso
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Aponte para o QR Code impresso ou gerado no celular do convidado
              </p>
            </div>

            {/* Espaço de Captura do Vídeo */}
            <div className="relative aspect-square w-full max-w-[280px] mx-auto rounded-2xl overflow-hidden border-2 border-white/10 bg-black flex items-center justify-center group shadow-md">
              
              {cameraAtiva ? (
                <>
                  <video 
                    ref={videoRef} 
                    className="w-full h-full object-cover" 
                  />
                  {/* Overlay Mira de Scanner */}
                  <div className="absolute inset-0 border-[24px] border-black/35 pointer-events-none flex items-center justify-center">
                    <div className="w-full h-full max-w-[160px] max-h-[160px] border-2 border-[#FFD100] relative rounded-lg">
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-amber-400" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-amber-400" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-amber-400" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-amber-400" />
                      
                      <div className="w-full h-0.5 bg-rose-500 rounded animate-laser-move absolute" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 text-slate-500 flex flex-col items-center gap-3">
                  <div className="p-4 rounded-full bg-white/5 border border-white/5 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-slate-400" />
                  </div>
                  <span className="text-xs text-center">A câmera está desativada no momento.</span>
                </div>
              )}
            </div>

            {erroCamera && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs text-left font-medium leading-relaxed">
                {erroCamera}
              </div>
            )}

            {/* Botões de Controle */}
            <div className="pt-2 space-y-4">
              {cameraAtiva ? (
                <button
                  onClick={pararCamera}
                  className="px-5 py-2.5 bg-white/5 border border-white/10 text-slate-200 hover:bg-white/10 rounded-xl text-xs font-semibold shadow-sm transition-all animate-pulse-slow cursor-pointer"
                >
                  Pausar Câmera
                </button>
              ) : (
                <button
                  onClick={iniciarCamera}
                  className="w-full py-3 bg-[#003893] hover:bg-[#0047bd] text-white font-display font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ler QR Code</span>
                </button>
              )}

              {/* Monitor de Operações da Portaria */}
              <div className="p-3 bg-[#0B1224] rounded-xl border border-white/5 text-[10px] text-left space-y-1 select-none font-mono text-slate-400">
                <p className="font-bold text-[#FFD100]/90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD100] animate-ping"></span>
                  Terminal Portaria Ativo
                </p>
                <div className="text-slate-400 space-y-0.5">
                  <p>📍 Localização GPS: <span className="text-slate-200">{gpsLocation}</span></p>
                  <p>📱 Detector Portaria: <span className="text-slate-200">{dispositivoInfo}</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* TELA VERDE - CONVITE VÁLIDO */}
        {statusValidacao === 'valido' && convidadoEscanado && (
          <motion.div
            key="valido"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 space-y-6 bg-[#0A1F13] text-emerald-100 font-sans border-t border-white/10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg border-4 border-[#0A1F13] mb-4 animate-bounce-short">
                <Check className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-mono tracking-wide uppercase mb-1 flex items-center gap-1">
                ✅ CONVITE OFICIAL
              </span>
              <p className="text-[10px] text-slate-400 italic mb-2">Convite emitido pela plataforma oficial.</p>
              <h3 className="text-xl font-display font-black text-[#11c462] tracking-tight uppercase leading-none">
                Acesso Autorizado!
              </h3>
              <p className="text-[11px] text-emerald-400 mt-2 uppercase tracking-tight font-semibold">Festa da Independência 2026</p>
            </div>

            {/* Documento se cadastrado */}
            {convidadoEscanado.documento ? (
              <div className="flex justify-center">
                <div className="w-full max-w-[240px] h-32 rounded-xl overflow-hidden border-2 border-emerald-500/55 shadow-lg bg-neutral-900 p-0.5 flex items-center justify-center">
                  <img src={convidadoEscanado.documento} alt="Documento do Convidado" className="w-full h-full object-contain" />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-xl bg-emerald-500/5 border border-emerald-500/25 flex items-center justify-center text-emerald-500/30 font-mono text-[9px] flex-col gap-1 uppercase tracking-wider">
                  <FileText className="w-6 h-6" />
                  <span>Sem Doc</span>
                </div>
              </div>
            )}

            {/* Ficha do Convidado */}
            <div className="bg-black/45 rounded-2xl p-5 shadow-sm border border-emerald-500/20 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Convidado</span>
                <p className="text-base font-bold text-white leading-tight">{convidadoEscanado.nome}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-white/5 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">CPF</span>
                  <p className="font-mono font-medium text-slate-300">{mascararCpfSeguro(convidadoEscanado.cpf)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Código</span>
                  <p className="font-mono font-bold text-slate-100">{convidadoEscanado.codigoAntifraude}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-white/5 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Cadastro</span>
                  <p className="text-slate-300">{new Date(convidadoEscanado.dataCadastro).toLocaleDateString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Status Convite</span>
                  <p className="text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 animate-pulse"></span>
                    Ativo
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-white/5 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Horário Leitura</span>
                  <p className="text-emerald-400 font-bold flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block shrink-0 animate-ping"></span>
                    {horarioLeitura || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Auditado de</span>
                  <span className="text-slate-300 font-mono text-[9px] truncate block">{gpsLocation}</span>
                </div>
              </div>
            </div>

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleConfirmarEntrada}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-display font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 transform active:scale-95"
              >
                <UserCheck className="w-4 h-4" />
                <span>Confirmar Entrada</span>
              </button>
              
              <button
                onClick={handleVoltarScan}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold rounded-xl transition-all"
              >
                Cancelar & Voltar a Escanear
              </button>
            </div>
          </motion.div>
        )}

        {/* TELA AMARELA - CONVITE JÁ UTILIZADO */}
        {statusValidacao === 'utilizado' && convidadoEscanado && (
          <motion.div
            key="utilizado"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 space-y-6 bg-[#241705] text-amber-100 font-sans border-t border-white/10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg border-4 border-[#241705] mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/35 font-mono tracking-wide uppercase mb-1 flex items-center gap-1">
                ✅ CONVITE OFICIAL
              </span>
              <p className="text-[10px] text-slate-400 italic mb-2">Convite emitido pela plataforma oficial.</p>
              <h3 className="text-xl font-display font-black text-amber-500 tracking-tight uppercase leading-none">
                CONVITE JÁ UTILIZADO
              </h3>
              <p className="text-xs text-rose-350 font-bold mt-2 uppercase text-center">
                Acesso Duplicado Proibido! Tentativa de Clonagem Detectada.
              </p>
            </div>

            {/* Ficha do Convidado */}
            <div className="bg-black/45 rounded-2xl p-5 shadow-sm border border-amber-500/20 space-y-3">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Convidado</span>
                <p className="text-base font-bold text-white leading-tight">{convidadoEscanado.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-white/5 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">CPF</span>
                  <p className="font-mono font-medium text-slate-300">{mascararCpfSeguro(convidadoEscanado.cpf)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Código</span>
                  <p className="font-mono font-bold text-slate-200">{convidadoEscanado.codigoAntifraude}</p>
                </div>
              </div>

              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 text-xs space-y-1">
                <p className="font-bold text-amber-300 uppercase tracking-wider text-[9px] mb-1">Registro da Primeira Utilização:</p>
                <div className="grid grid-cols-1 font-mono text-amber-200 space-y-0.5">
                  <p>📅 Data: {convidadoEscanado.horaEntrada ? new Date(convidadoEscanado.horaEntrada).toLocaleDateString('pt-BR') : 'Sem data'}</p>
                  <p>⏳ Hora: {convidadoEscanado.horaEntrada ? new Date(convidadoEscanado.horaEntrada).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit', second:'2-digit'}) : 'Desconhecido'}</p>
                  <p>👮 Responsável: <span className="text-white font-bold">{convidadoEscanado.adminValidacao || 'Operador de Segurança'}</span></p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleVoltarScan}
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-display font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 font-bold cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Voltar a Escanear</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TELA VERMELHA - CONVITE CANCELADO */}
        {statusValidacao === 'cancelado' && convidadoEscanado && (
          <motion.div
            key="cancelado"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 space-y-6 bg-[#240A10] text-[#FFD100]/95 font-sans border-t border-white/10"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-4 border-[#240A10] mb-4">
                <ShieldAlert className="w-8 h-8 text-neutral-100" />
              </div>
              <span className="text-[11px] font-bold text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/35 font-mono tracking-wide uppercase mb-1 flex items-center gap-1">
                ✅ CONVITE OFICIAL
              </span>
              <p className="text-[10px] text-slate-400 italic mb-2">Convite emitido pela plataforma oficial.</p>
              <h3 className="text-xl font-display font-black text-rose-500 tracking-tight uppercase leading-none">
                CONVITE CANCELADO
              </h3>
              <p className="text-xs text-rose-200 font-bold mt-2 text-center leading-relaxed">
                Este convite foi cancelado e não pode ser utilizado.
              </p>
            </div>

            {/* Ficha do Convidado */}
            <div className="bg-black/45 rounded-2xl p-5 shadow-sm border border-rose-500/20 space-y-3">
              <div>
                <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider block">Convidado</span>
                <p className="text-base font-bold text-white leading-tight">{convidadoEscanado.nome}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-dashed border-white/5 pt-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">CPF</span>
                  <p className="font-mono font-medium text-slate-300">{mascararCpfSeguro(convidadoEscanado.cpf)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Código</span>
                  <p className="font-mono font-bold text-slate-200">{convidadoEscanado.codigoAntifraude}</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleVoltarScan}
                className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white font-display font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Voltar a Escanear</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* TELA VERMELHA - CONVITE INVÁLIDO */}
        {statusValidacao === 'invalido' && (
          <motion.div
            key="invalido"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="p-6 space-y-6 bg-[#240A10] text-[#FFD100]/95 font-sans border-t border-white/10"
          >
            <div className="flex flex-col items-center text-center font-sans">
              <div className="w-16 h-16 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg border-4 border-[#240A10] mb-4">
                <XCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-display font-black text-rose-500 tracking-tight uppercase leading-tight mb-2">
                CONVITE NÃO OFICIAL
              </h3>
              <p className="text-xs text-rose-200 font-semibold px-4 text-center leading-relaxed">
                Este convite não foi emitido pela plataforma oficial da Festa da Independência de Cabo Verde 2026.
              </p>
            </div>

            <div className="bg-black/45 rounded-2xl p-5 shadow-sm border border-rose-500/20 text-center text-xs space-y-2 leading-relaxed text-rose-200">
              <p className="font-bold text-rose-300">Detecção de Segurança Violada:</p>
              <ul className="text-left list-disc list-inside space-y-1.5 text-rose-200/90 font-mono text-[10px]">
                <li>Assinatura digital corrompida ou falsificada.</li>
                <li>QR Code não emitido pelo portal de inscrições.</li>
                <li>Tentativa de intrusão com credencial clonada.</li>
                <li>Acesso em desacordo com as regras diplomáticas.</li>
              </ul>
            </div>

            {/* Ações */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleVoltarScan}
                className="w-full py-3 bg-rose-650 hover:bg-rose-700 text-white font-display font-semibold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Escanear Outro Código</span>
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
