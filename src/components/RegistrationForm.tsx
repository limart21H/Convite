/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, ChangeEvent, FormEvent } from 'react';
import { cadastrarConvidado, aplicarMascaraCPF, aplicarMascaraTelefone, validarCPF } from '../dbStore.ts';
import { Convidado } from '../types.ts';
import { FlagCaboVerde } from './FlagComponents.tsx';
import { User, Phone, Mail, FileText, CheckCircle2, AlertTriangle, Sparkles, Camera, Upload, X, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface RegistrationFormProps {
  onSuccess: (convidado: Convidado) => void;
}

export function RegistrationForm({ onSuccess }: RegistrationFormProps) {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [documento, setDocumento] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  
  // Estados da Diáspora Cabo-verdiana
  const [eCaboVerdiano, setECaboVerdiano] = useState(true);
  const [paisResidencia, setPaisResidencia] = useState('Brasil');
  const [cidadeAtual, setCidadeAtual] = useState('');
  const [ilhaOrigem, setIlhaOrigem] = useState('Santiago');
  
  const [erros, setErros] = useState<{ [key: string]: string }>({});
  const [erroGeral, setErroGeral] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Manipular upload de documento
  const handleDocumentoUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErros(prev => ({ ...prev, documento: 'Apenas arquivos de imagem são aceitos.' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) { // Limite de 2MB
      setErros(prev => ({ ...prev, documento: 'O documento deve ter no máximo 2MB.' }));
      return;
    }

    setErros(prev => {
      const copy = { ...prev };
      delete copy.documento;
      return copy;
    });

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        setDocumento(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleDocumentoUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDocumentoUpload(e.dataTransfer.files[0]);
    }
  };

  // Manipular CPF digitado (máscara automática)
  const handleCpfChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valorComMascara = aplicarMascaraCPF(e.target.value);
    setCpf(valorComMascara);
    if (erros.cpf) {
      setErros(prev => {
        const copy = { ...prev };
        delete copy.cpf;
        return copy;
      });
    }
  };

  // Manipular Telefone digitado (máscara automática)
  const handleTelefoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    const valorComMascara = aplicarMascaraTelefone(e.target.value);
    setTelefone(valorComMascara);
    if (erros.telefone) {
      setErros(prev => {
        const copy = { ...prev };
        delete copy.telefone;
        return copy;
      });
    }
  };

  // Validar e-mail de forma robusta
  const validarFormatoEmail = (emailStr: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(emailStr);
  };

  // Submissão do Formulário
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setErros({});
    setErroGeral('');

    // Validações básicas
    const novosErros: { [key: string]: string } = {};

    if (nome.trim().length < 5) {
      novosErros.nome = 'Por favor, digite seu nome completo.';
    }

    const cpfLimpo = cpf.replace(/\D/g, '');
    if (cpfLimpo.length !== 11) {
      novosErros.cpf = 'O CPF deve possuir exatamente 11 dígitos.';
    } else if (!validarCPF(cpf)) {
      novosErros.cpf = 'Este não é um CPF válido. Verifique os números.';
    }

    const telefoneLimpo = telefone.replace(/\D/g, '');
    if (telefoneLimpo.length < 8) {
      novosErros.telefone = 'Por favor, digite um telefone de contato válido.';
    }

    if (!validarFormatoEmail(email)) {
      novosErros.email = 'Insira um formato de e-mail válido (exemplo@dominio.com).';
    }

    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros);
      return;
    }

    setCarregando(true);

    // Simular um delay de requisição de servidor para a experiência de alta fidelidade
    setTimeout(() => {
      const resposta = cadastrarConvidado({
        nome,
        telefone,
        email,
        cpf,
        documento,
        paisResidencia,
        cidadeAtual: cidadeAtual.trim() || 'Porto Alegre',
        ilhaOrigem: eCaboVerdiano ? ilhaOrigem : 'Nenhuma'
      });

      setCarregando(false);

      if (resposta.sucesso && resposta.convidado) {
        onSuccess(resposta.convidado);
      } else {
        setErroGeral(resposta.mensagem);
      }
    }, 800);
  };

  return (
    <div id="registration_form_container" className="bg-[#050B1F] rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] border border-white/10 overflow-hidden max-w-lg mx-auto transition-all duration-300">
      
      {/* Banner Superior Temático */}
      <div className="relative bg-gradient-to-br from-[#003893]/50 to-[#050B1F]/90 text-white p-6 sm:p-8 border-b border-white/10">
        {/* Flag e Estrelas de Background */}
        <div className="absolute right-4 top-4 opacity-15">
          <FlagCaboVerde className="w-24 h-16" shadow={false} />
        </div>
        
        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 text-[#FFD100] border border-white/10 backdrop-blur-sm mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Cabo Verde 2026 • 51 Anos
          </span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white">
            Solicitar Convite Oficial
          </h2>
          <p className="text-slate-300 text-sm mt-1">
            Festa da Independência Nacional — 24 de julho de 2026
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
        
        {/* Mensagem de Erro Geral vinda do DB (duplicados, etc) */}
        {erroGeral && (
          <motion.div 
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
            <div>
              <span className="font-semibold">Erro de Cadastro:</span> {erroGeral}
            </div>
          </motion.div>
        )}

        {/* Nome Completo */}
        <div className="space-y-1.5">
          <label htmlFor="reg_nome" className="block text-sm font-medium text-slate-300">
            Nome Completo <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-5 h-5" />
            </div>
            <input
              id="reg_nome"
              type="text"
              required
              placeholder="Digite seu nome completo igual no documento"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-black/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:bg-black/50 transition-all text-sm ${
                erros.nome 
                  ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-200 focus:border-rose-500' 
                  : 'border-white/10 focus:ring-blue-500/20 focus:border-[#003893]'
              }`}
            />
          </div>
          {erros.nome && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-500 block"></span>
              {erros.nome}
            </p>
          )}
        </div>

        {/* CPF do Convidado */}
        <div className="space-y-1.5">
          <label htmlFor="reg_cpf" className="block text-sm font-medium text-slate-300 flex justify-between">
            <span>CPF <span className="text-rose-400">*</span></span>
            <span className="text-xs text-slate-500 font-normal">Somente CPFs válidos</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <FileText className="w-5 h-5" />
            </div>
            <input
              id="reg_cpf"
              type="text"
              required
              maxLength={14}
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-black/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:bg-black/50 transition-all text-sm font-mono ${
                erros.cpf 
                  ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-200 focus:border-rose-500' 
                  : 'border-white/10 focus:ring-blue-500/20 focus:border-[#003893]'
              }`}
            />
          </div>
          {erros.cpf && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-500 block"></span>
              {erros.cpf}
            </p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-1.5">
          <label htmlFor="reg_telefone" className="block text-sm font-medium text-slate-300">
            Número de Telefone / WhatsApp <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Phone className="w-5 h-5" />
            </div>
            <input
              id="reg_telefone"
              type="tel"
              required
              placeholder="Ex: (11) 99999-9999 ou +238 991-2026"
              value={telefone}
              onChange={handleTelefoneChange}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-black/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:bg-black/50 transition-all text-sm ${
                erros.telefone 
                  ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-200 focus:border-rose-500' 
                  : 'border-white/10 focus:ring-blue-500/20 focus:border-[#003893]'
              }`}
            />
          </div>
          {erros.telefone && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-500 block"></span>
              {erros.telefone}
            </p>
          )}
        </div>

        {/* E-mail */}
        <div className="space-y-1.5">
          <label htmlFor="reg_email" className="block text-sm font-medium text-slate-300">
            Endereço de E-mail <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <Mail className="w-5 h-5" />
            </div>
            <input
              id="reg_email"
              type="email"
              required
              placeholder="exemplo@dominio.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (erros.email) {
                  setErros(prev => {
                    const copy = { ...prev };
                    delete copy.email;
                    return copy;
                  });
                }
              }}
              className={`w-full pl-11 pr-4 py-2.5 rounded-xl border bg-black/30 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:bg-black/50 transition-all text-sm ${
                erros.email 
                  ? 'border-rose-500/50 focus:ring-rose-500/20 text-rose-200 focus:border-rose-500' 
                  : 'border-white/10 focus:ring-blue-500/20 focus:border-[#003893]'
              }`}
            />
          </div>
          {erros.email && (
            <p className="text-xs text-rose-400 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-rose-505 block"></span>
              {erros.email}
            </p>
          )}
        </div>

        {/* Dados da Diáspora Cabo-verdiana */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-4 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#FFD100] flex items-center gap-1.5 leading-none">
            <Globe className="w-3.5 h-3.5 text-[#FFD100]" />
            Mapeamento da Diáspora
          </h4>
          <p className="text-[11px] text-slate-400 leading-normal">
            Ajude-nos a comemorar a nossa conexão global! Esses dados alimentarão o Mapa da Diáspora interativo do evento.
          </p>

          {/* Vínculo de Origem Cabo-Verdiana */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-medium text-slate-300">
              Você possui nacionalidade ou origem cabo-verdiana? <span className="text-rose-400">*</span>
            </span>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setECaboVerdiano(true);
                  setIlhaOrigem('Santiago');
                }}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  eCaboVerdiano
                    ? 'bg-[#003893]/30 border-[#003893] text-[#FFD100] font-bold shadow-sm'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:bg-black/50 hover:text-slate-300'
                }`}
              >
                ✓ Sim (Cidadão / Descendente)
              </button>
              <button
                type="button"
                onClick={() => {
                  setECaboVerdiano(false);
                  setIlhaOrigem('Nenhuma');
                }}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer ${
                  !eCaboVerdiano
                    ? 'bg-[#003893]/30 border-[#003893] text-[#FFD100] font-bold shadow-sm'
                    : 'bg-black/30 border-white/10 text-slate-400 hover:bg-black/50 hover:text-slate-300'
                }`}
              >
                Amigo / Estrangeiro
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* País de Residência */}
            <div className="space-y-1">
              <label htmlFor="reg_pais" className="block text-[11px] font-medium text-slate-300">
                País de Residência <span className="text-rose-400">*</span>
              </label>
              <select
                id="reg_pais"
                value={paisResidencia}
                onChange={(e) => setPaisResidencia(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/45 text-slate-205 focus:outline-none focus:ring-1 focus:ring-[#003893] text-xs transition-colors shrink-0"
              >
                <option value="Brasil">Brasil</option>
                <option value="Cabo Verde">Cabo Verde</option>
                <option value="Portugal">Portugal</option>
                <option value="Estados Unidos">Estados Unidos</option>
                <option value="França">França</option>
                <option value="Holanda">Holanda</option>
                <option value="Angola">Angola</option>
                <option value="Outro">Outro</option>
              </select>
            </div>

            {/* Cidade Atual */}
            <div className="space-y-1">
              <label htmlFor="reg_cidade" className="block text-[11px] font-medium text-slate-300">
                Cidade Atual <span className="text-rose-400">*</span>
              </label>
              <input
                id="reg_cidade"
                type="text"
                required
                placeholder="Ex: Porto Alegre"
                value={cidadeAtual}
                onChange={(e) => setCidadeAtual(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/45 text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#003893] text-xs transition-colors"
              />
            </div>
          </div>

          {/* Ilha de Origem em Cabo Verde - Condicional */}
          {eCaboVerdiano && (
            <div className="space-y-1 transition-all duration-300 animate-fadeIn">
              <label htmlFor="reg_ilha" className="block text-[11px] font-medium text-slate-300">
                Ilha de Origem em Cabo Verde <span className="text-rose-400">*</span>
              </label>
              <select
                id="reg_ilha"
                value={ilhaOrigem}
                onChange={(e) => setIlhaOrigem(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-white/10 bg-black/45 text-slate-205 focus:outline-none focus:ring-1 focus:ring-[#003893] text-xs transition-colors shrink-0"
              >
                <option value="Santiago">Santiago</option>
                <option value="São Vicente">São Vicente</option>
                <option value="Santo Antão">Santo Antão</option>
                <option value="Fogo">Fogo</option>
                <option value="Sal">Sal</option>
                <option value="Boa Vista">Boa Vista</option>
                <option value="São Nicolau">São Nicolau</option>
                <option value="Maio">Maio</option>
                <option value="Brava">Brava</option>
                <option value="Santa Luzia">Santa Luzia (Desabitada)</option>
                <option value="Descendente / Nenhuma">Membro Estrangeiro / Descendente</option>
              </select>
            </div>
          )}
        </div>

        {/* Documento de Identificação (Opcional) */}
        <div className="space-y-1.5" onDragEnter={handleDrag}>
          <label className="block text-sm font-medium text-slate-300">
            Documento de Identificação <span className="text-xs text-slate-500">(Opcional, recomendável para portaria)</span>
          </label>
          
          <div 
            className={`relative rounded-xl border-2 border-dashed p-4 flex flex-col items-center justify-center transition-all ${
              dragActive 
                ? 'border-[#FFD100] bg-[#FFD100]/5' 
                : documento 
                ? 'border-emerald-500/30 bg-[#050B1F]' 
                : 'border-white/10 hover:border-white/20 bg-black/30'
            }`}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            {documento ? (
              <div className="relative flex flex-col items-center gap-3 w-full">
                <div className="relative w-full max-w-xs h-36 rounded-xl overflow-hidden border-2 border-emerald-500/50 shadow-md group bg-neutral-950 flex items-center justify-center p-1">
                  <img src={documento} alt="Prévia do Documento" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => setDocumento(null)}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-rose-400 cursor-pointer rounded-xl"
                    title="Remover Documento"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setDocumento(null)}
                  className="text-xs text-rose-450 hover:text-rose-300 flex items-center gap-1 border border-rose-500/20 px-2.5 py-1 rounded-lg bg-rose-500/5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Remover Documento
                </button>
              </div>
            ) : (
              <label htmlFor="doc-uploader" className="cursor-pointer flex flex-col items-center justify-center text-center p-3 space-y-2 group w-full">
                <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 group-hover:border-white/20 flex items-center justify-center text-slate-400 transition-colors">
                  <FileText className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                    Arraste a imagem do seu documento aqui ou clique para selecionar
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1">Carregue RG, CNH, Passaporte ou ID (PNG, JPG de Max. 2MB)</p>
                </div>
              </label>
            )}

            <input
              id="doc-uploader"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          {erros.documento && (
            <p className="text-xs text-rose-450 flex items-center gap-1 uppercase tracking-tight font-mono">
              <span className="w-1 h-1 rounded-full bg-rose-500 block"></span>
              {erros.documento}
            </p>
          )}
        </div>

        {/* Nota Explicativa */}
        <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/25 text-slate-300 text-xs leading-relaxed">
          Ao solicitar o seu convite, um código antifraude de 6 dígitos único e um QR Code de acesso serão vinculados às suas credenciais de segurança. O lote é pessoal, intransferível e assegurará a entrada mediante conferência no dia do evento.
        </div>

        {/* Botão de Cadastro */}
        <button
          id="btn_submit_cadastro"
          type="submit"
          disabled={carregando}
          className="w-full relative py-3 px-4 rounded-xl bg-[#003893] text-white font-display font-medium text-sm transition-all shadow-md active:scale-[0.99] hover:bg-[#0047bd] disabled:opacity-75 disabled:cursor-not-allowed overflow-hidden group"
        >
          {carregando ? (
            <div className="flex items-center justify-center gap-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Processando Credenciais...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Gerar Meu Convite Digital</span>
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
          
          {/* Flame Sweep Effect */}
          <div className="absolute top-0 -inset-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white/10 opacity-40 group-hover:animate-shine" />
        </button>

      </form>
    </div>
  );
}
