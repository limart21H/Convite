/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  updateDoc, 
  deleteDoc,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Convidado, DashboardStats, LogAuditoria, Fiscal, AtividadeProgramacao, MensagemMural, DocumentoOficial } from './types.ts';

// 1. Initialize Firebase Config
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// 2. Types & Interface declarations
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

// 3. Mandatory Error Handler Function
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Chaves do localStorage
const DB_KEY = 'caboverde2026_convidados';
const OFFLINE_QUEUE_KEY = 'caboverde2026_sync_queue';
const ONLINE_STATE_KEY = 'caboverde2026_online_state';
const AUDIT_KEY = 'caboverde2026_logs_auditoria';

// Gerador de UUID para navegadores
export function gerarUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Validador real de CPF brasileiro
export function validarCPF(cpf: string): boolean {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  let digito1 = resto > 9 ? 0 : resto;
  if (parseInt(cleanCPF.charAt(9)) !== digito1) return false;
  
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cleanCPF.charAt(i)) * (11 - i);
  }
  resto = 11 - (soma % 11);
  let digito2 = resto > 9 ? 0 : resto;
  if (parseInt(cleanCPF.charAt(10)) !== digito2) return false;
  
  return true;
}

// Máscara de CPF automática
export function aplicarMascaraCPF(valor: string): string {
  const numeros = valor.replace(/\D/g, '').substring(0, 11);
  if (numeros.length <= 3) return numeros;
  if (numeros.length <= 6) return `${numeros.substring(0, 3)}.${numeros.substring(3)}`;
  if (numeros.length <= 9) return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6)}`;
  return `${numeros.substring(0, 3)}.${numeros.substring(3, 6)}.${numeros.substring(6, 9)}-${numeros.substring(9)}`;
}

// Máscara de Telefone automática
export function aplicarMascaraTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, '');
  if (numeros.length <= 8) {
    return numeros;
  }
  if (numeros.length === 9) {
    return `${numeros.substring(0, 5)}-${numeros.substring(5)}`;
  }
  if (numeros.length === 11) {
    return `(${numeros.substring(0, 2)}) ${numeros.substring(2, 7)}-${numeros.substring(7)}`;
  }
  if (numeros.length > 11) {
    return `+${numeros.substring(0, numeros.length - 8)} ${numeros.substring(numeros.length - 8)}`;
  }
  return numeros;
}

// Gerar código único antifraude de 6 caracteres alfanuméricos
export function gerarCodigoAntifraude(codigosExistentes: string[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let iter = 0;
  while (iter < 1000) {
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (!codigosExistentes.includes(result)) {
      return result;
    }
    iter++;
  }
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Dados de UUIDs fictícios para limpeza e filtragem automática de legados
const DUMMY_UUIDS = [
  "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb01",
  "4fa8db52-1981-45bc-96b5-06bade26241b",
  "cf309df5-cfb8-47f6-9fcf-b6b801de2026",
  "a814c2b9-7b3e-4dca-973e-324c16b1ff22",
  "d5aef831-7bc3-48ee-a01c-6daccde22bc1"
];

// Dados iniciais (Seed Data) - Alterado para vazio a fim de remover convidados fictícios
const CONVIDADOS_INICIAIS: Convidado[] = [];

// Memory cache synced in real-time with Firestore and backed up by LocalStorage
let cacheConvidados: Convidado[] = [];

const cachedList = localStorage.getItem(DB_KEY);
if (cachedList) {
  try {
    const parsed = JSON.parse(cachedList);
    cacheConvidados = Array.isArray(parsed) 
      ? parsed.filter((c: any) => !DUMMY_UUIDS.includes(c.uuid)) 
      : [];
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));
  } catch (e) {
    cacheConvidados = [...CONVIDADOS_INICIAIS];
  }
} else {
  cacheConvidados = [...CONVIDADOS_INICIAIS];
}

// Memory cache for logs
let cacheLogs: LogAuditoria[] = [];
const cachedLogsList = localStorage.getItem(AUDIT_KEY);
if (cachedLogsList) {
  try {
    cacheLogs = JSON.parse(cachedLogsList);
  } catch (e) {
    cacheLogs = [];
  }
}

// Memory cache & seed for Fiscais (Marshals)
let cacheFiscais: Fiscal[] = [];
const cachedFiscaisList = localStorage.getItem('caboverde2026_fiscais');
if (cachedFiscaisList) {
  try { cacheFiscais = JSON.parse(cachedFiscaisList); } catch (e) { cacheFiscais = []; }
} else {
  cacheFiscais = [
    { id: 'f-1', nome: 'Tenente António Silva', badge: 'FIS-101', setor: 'Portaria Principal', status: 'Ativo', checkinsCount: 0 },
    { id: 'f-2', nome: 'Agente Maria Cabral', badge: 'FIS-204', setor: 'Acesso VIP', status: 'Ativo', checkinsCount: 0 },
    { id: 'f-3', nome: 'Inspector Jorge Lima', badge: 'FIS-315', setor: 'Portaria Cultural', status: 'Ativo', checkinsCount: 0 }
  ];
  localStorage.setItem('caboverde2026_fiscais', JSON.stringify(cacheFiscais));
}

// Memory cache & seed for Programação (Schedule)
let cacheProgramacao: AtividadeProgramacao[] = [];
const cachedProgList = localStorage.getItem('caboverde2026_programacao');
if (cachedProgList) {
  try { cacheProgramacao = JSON.parse(cachedProgList); } catch (e) { cacheProgramacao = []; }
} else {
  cacheProgramacao = [
    { id: 'p-1', horario: '22:00', titulo: 'Abertura dos Portões & Pavilhão Gastronómico', responsavel: 'Comissão de Logística', status: 'Agendado' },
    { id: 'p-2', horario: '22:30', titulo: 'Apresentação Artística: Batuque das Crioulas', responsavel: 'Secretaria de Cultura', status: 'Agendado' },
    { id: 'p-3', horario: '23:00', titulo: 'Ato Solene: Hino Nacional e Hasteamento da Bandeira', responsavel: 'Secretariado Geral', status: 'Agendado' },
    { id: 'p-4', horario: '23:30', titulo: 'Pronunciamento Consular & Homenagem de Heróis Nacionais', responsavel: 'Comitê Diplomático', status: 'Agendado' },
    { id: 'p-5', horario: '00:00', titulo: 'Brinde da Independência (Grogue Festivo) & Fogos', responsavel: 'Cerimonial Oficial', status: 'Agendado' },
    { id: 'p-6', horario: '00:30', titulo: 'Funaná e Coladera Dance Celebration (Grupo Morabeza)', responsavel: 'Direção Artística', status: 'Agendado' }
  ];
  localStorage.setItem('caboverde2026_programacao', JSON.stringify(cacheProgramacao));
}

// Memory cache & seed for Mural
let cacheMural: MensagemMural[] = [];
const cachedMuralList = localStorage.getItem('caboverde2026_mural');
if (cachedMuralList) {
  try { cacheMural = JSON.parse(cachedMuralList); } catch (e) { cacheMural = []; }
} else {
  cacheMural = [
    { id: 'm-1', autor: 'Dara de Assis', mensagem: 'Viva Cabo Verde! Orgulho imenso das nossas ilhas de sol e de morabeza! 🇨🇻', status: 'Aprovado', data: new Date().toISOString() },
    { id: 'm-2', autor: 'Manuel Lopes', mensagem: 'Uma saudação fraterna a todos os conterrâneos na diáspora. Comemoramos 50 anos de liberdade!', status: 'Aprovado', data: new Date().toISOString() },
    { id: 'm-3', autor: 'Soraia Semedo', mensagem: 'Que saudades de uma boa cachupa e um funaná rasgado! Festa maravilhosa.', status: 'Pendente', data: new Date().toISOString() }
  ];
  localStorage.setItem('caboverde2026_mural', JSON.stringify(cacheMural));
}

// Memory cache & seed for Documentos
let cacheDocumentos: DocumentoOficial[] = [];
const cachedDocList = localStorage.getItem('caboverde2026_documentos');
if (cachedDocList) {
  try { cacheDocumentos = JSON.parse(cachedDocList); } catch (e) { cacheDocumentos = []; }
} else {
  cacheDocumentos = [
    { id: 'd-1', nome: 'Decreto_Governamental_Autorizacao_Solenidade.pdf', tipo: 'PDF', pasta: 'Jurídico', tamanho: '2.4 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-2', nome: 'Orcamento_Festa_Independencia_Porto_Alegre.xlsx', tipo: 'XLS', pasta: 'Financeiro', tamanho: '1.8 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-3', nome: 'Plano_Layout_Espacial_Assembleia_Nacional.pdf', tipo: 'PDF', pasta: 'Logística', tamanho: '4.1 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-4', nome: 'PressKit_Assessoria_CaboVerde_2026.zip', tipo: 'ZIP', pasta: 'Divulgação', tamanho: '12.0 MB', dataAdicionado: new Date().toISOString() }
  ];
  localStorage.setItem('caboverde2026_documentos', JSON.stringify(cacheDocumentos));
}

// Access Hit Counter tracking
let cacheTotalAcessos = 142;
const cachedHits = localStorage.getItem('caboverde2026_total_acessos');
if (cachedHits) {
  cacheTotalAcessos = parseInt(cachedHits) + 1;
} else {
  cacheTotalAcessos = 142;
}
localStorage.setItem('caboverde2026_total_acessos', String(cacheTotalAcessos));

// Anonymous Auth and connection bootstrapping
async function inicializarConexao() {
  try {
    await signInAnonymously(auth);
    console.log('Firebase Authenticated Anonymously');
    
    // Test connection as required by rules
    try {
      await getDocFromServer(doc(db, 'convidados', 'connection_test'));
    } catch (e) {
      // Intended connection ping
    }
  } catch (e) {
    console.info('Firebase Auth Anonymous Setup (Restricted):', e instanceof Error ? e.message : String(e), '- Running in secure client-first hybrid storage mode.');
  }
}
inicializarConexao();

// Real-time listener for synchronization
let initialSeedingDone = false;
onSnapshot(collection(db, 'convidados'), async (snapshot) => {
  if (snapshot.empty && !initialSeedingDone) {
    initialSeedingDone = true;
    console.log('Database empty. No initial seeding needed (fictitious guests removed).');
  } else {
    const list: Convidado[] = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Convidado;
      if (DUMMY_UUIDS.includes(data.uuid)) {
        // Encontrou um convidado fictício legado no Firestore, deleta-o para limpar o banco
        deleteDoc(docSnap.ref).catch(err => {
          console.warn('Erro ao remover convidado fictício legado:', err);
        });
      } else {
        list.push(data);
      }
    });
    // Sort logically to preserve registration list order
    list.sort((a, b) => parseInt(a.id) - parseInt(b.id));
    cacheConvidados = list;
    localStorage.setItem(DB_KEY, JSON.stringify(list));
  }
}, (error) => {
  console.warn('Firestore Snapshot connection warning/throttled:', error);
});

// Real-time listener for audit logs
onSnapshot(collection(db, 'logs_auditoria'), (snapshot) => {
  const list: LogAuditoria[] = [];
  snapshot.forEach((doc) => {
    list.push(doc.data() as LogAuditoria);
  });
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  cacheLogs = list;
  localStorage.setItem(AUDIT_KEY, JSON.stringify(list));
}, (error) => {
  console.warn('Firestore logs_auditoria listener warning:', error);
});

// Recuperar Lista de Convidados (instantâneo síncrono do cache real-time)
export function obterConvidados(): Convidado[] {
  return cacheConvidados;
}

// Recuperar status de Conexão Virtual
export function obterEstadoOnline(): boolean {
  const state = localStorage.getItem(ONLINE_STATE_KEY);
  return state === null ? true : state === 'true';
}

// Alternar status de Conexão Virtual
export function definirEstadoOnline(online: boolean): void {
  localStorage.setItem(ONLINE_STATE_KEY, String(online));
  if (online) {
    processarFilaSincronizacao();
  }
}

// Adicionar à fila de sincronização offline
interface SyncAction {
  tipo: 'cadastro' | 'confirmar_entrada' | 'status_convite';
  uuid: string;
  payload: any;
  timestamp: string;
}

function processarFilaSincronizacao(): void {
  const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueJson) return;
  try {
    const queue: SyncAction[] = JSON.parse(queueJson);
    if (queue.length === 0) return;

    queue.forEach(async (action) => {
      try {
        if (action.tipo === 'cadastro') {
          await setDoc(doc(db, 'convidados', action.uuid), action.payload);
        } else if (action.tipo === 'confirmar_entrada') {
          await updateDoc(doc(db, 'convidados', action.uuid), {
            statusEntrada: 'Utilizado',
            horaEntrada: action.payload.horaEntrada,
            adminValidacao: action.payload.adminValidacao
          });
        } else if (action.tipo === 'status_convite') {
          await updateDoc(doc(db, 'convidados', action.uuid), {
            statusConvite: action.payload.statusConvite,
            statusEntrada: 'Não utilizado',
            horaEntrada: null
          });
        } else if ((action.tipo as string) === 'auditoria') {
          await setDoc(doc(db, 'logs_auditoria', action.uuid), action.payload);
        }
      } catch (e) {
        console.error(`Error syncing action ${action.tipo} offline:`, e);
      }
    });

    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
    console.log('Offline queue synchronized successfully.');
  } catch (e) {
    console.error('Offline sync processing error:', e);
  }
}

function registrarAcaoOffline(action: SyncAction): void {
  const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
  let queue: SyncAction[] = [];
  try {
    if (queueJson) queue = JSON.parse(queueJson);
  } catch (e) {
    queue = [];
  }
  queue.push(action);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

// Obter Fila Offline de forma visível para relatórios/admin
export function obterFilaOffline(): SyncAction[] {
  const queueJson = localStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!queueJson) return [];
  try {
    return JSON.parse(queueJson);
  } catch {
    return [];
  }
}

// Cadastrar Convidado
export interface CadastroInput {
  nome: string;
  telefone: string;
  email: string;
  cpf: string;
  documento?: string | null; // Base64 string se cadastrado
  paisResidencia?: string | null;
  cidadeAtual?: string | null;
  ilhaOrigem?: string | null;
}

export function cadastrarConvidado(input: CadastroInput): { sucesso: boolean; mensagem: string; convidado?: Convidado } {
  // Limpa caracteres especiais do CPF e e-mail para comparação consistente
  const cpfFormatado = aplicarMascaraCPF(input.cpf);
  const emailLimpo = input.email.trim().toLowerCase();
  
  // Impedir CPFs duplicados
  const cpfDuplicado = cacheConvidados.some(c => c.cpf === cpfFormatado && c.statusConvite === 'Ativo');
  if (cpfDuplicado) {
    return { sucesso: false, mensagem: 'Este CPF já está cadastrado em um convite ativo.' };
  }

  // Impedir e-mails duplicados
  const emailDuplicado = cacheConvidados.some(c => c.email.toLowerCase() === emailLimpo && c.statusConvite === 'Ativo');
  if (emailDuplicado) {
    return { sucesso: false, mensagem: 'Este e-mail já está cadastrado em um convite ativo.' };
  }

  // Gerar ID sequencial
  const proximoId = (Math.max(...cacheConvidados.map(c => parseInt(c.id)), 1000) + 1).toString();
  
  // Gerar código antifraude único
  const codigosExistentes = cacheConvidados.map(c => c.codigoAntifraude);
  const novoCodigo = gerarCodigoAntifraude(codigosExistentes);

  const novoConvidado: Convidado = {
    id: proximoId,
    uuid: gerarUUID(),
    nome: input.nome.trim(),
    telefone: aplicarMascaraTelefone(input.telefone),
    email: emailLimpo,
    cpf: cpfFormatado,
    codigoAntifraude: novoCodigo,
    dataCadastro: new Date().toISOString(),
    statusConvite: 'Ativo',
    statusEntrada: 'Não utilizado',
    horaEntrada: null,
    adminValidacao: null,
    documento: input.documento || null,
    paisResidencia: input.paisResidencia || 'Brasil',
    cidadeAtual: input.cidadeAtual || 'Porto Alegre',
    ilhaOrigem: input.ilhaOrigem || 'Santiago'
  };

  const isOnline = obterEstadoOnline();
  if (isOnline) {
    // Write instantly and reactively
    setDoc(doc(db, 'convidados', novoConvidado.uuid), novoConvidado)
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `convidados/${novoConvidado.uuid}`));
  } else {
    // Save to sync queue and cache locally immediately
    cacheConvidados.push(novoConvidado);
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));
    registrarAcaoOffline({
      tipo: 'cadastro',
      uuid: novoConvidado.uuid,
      payload: novoConvidado,
      timestamp: new Date().toISOString()
    });
  }

  return { 
    sucesso: true, 
    mensagem: 'Inscrição realizada com sucesso!', 
    convidado: novoConvidado 
  };
}

// Criptografar string usando chave secreta com XOR e Base64
export function criptografar(text: string): string {
  const salt = 'ChaveSecretaIndependenciaCV51Anos2026';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(encodeURIComponent(result));
}

// Descriptografar string
export function descriptografar(cipherText: string): string {
  try {
    const decoded = decodeURIComponent(atob(cipherText));
    const salt = 'ChaveSecretaIndependenciaCV51Anos2026';
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      const charCode = decoded.charCodeAt(i) ^ salt.charCodeAt(i % salt.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    return '';
  }
}

// Calcular assinatura digital única baseada em chave privada simulada
export function calcularAssinatura(uuid: string, codigo: string): string {
  const salt = 'CaboVerdeIndependencia2026SecretKeySignature!!!';
  const input = `${uuid}-${codigo}-${salt}`;
  let hash1 = 0;
  for (let i = 0; i < input.length; i++) {
    hash1 = ((hash1 << 5) - hash1) + input.charCodeAt(i);
    hash1 |= 0;
  }
  let hash2 = 17;
  for (let i = input.length - 1; i >= 0; i--) {
    hash2 = ((hash2 << 5) + hash2) + input.charCodeAt(i);
    hash2 |= 0;
  }
  return `${Math.abs(hash1).toString(16).padStart(8, '0')}-${Math.abs(hash2).toString(16).padStart(8, '0')}`.toUpperCase();
}

export interface ValidacaoResultado {
  isOficial: boolean;
  resultado: 'valido' | 'utilizado' | 'cancelado' | 'adulterado' | 'inexistente';
  convidado?: Convidado;
  mensagem: string;
}

// Validação Completa Multifatorial de Credenciais Antifraude
export function validarIngressoCompleto(objetoQR: { id?: string; uuid?: string; uuidCriptografado?: string; codigo?: string; assinatura?: string }): ValidacaoResultado {
  let { uuid, codigo, assinatura, uuidCriptografado } = objetoQR;

  // Se tiver uuidCriptografado, descriptografa para obter o uuid real!
  if (uuidCriptografado && !uuid) {
    uuid = descriptografar(uuidCriptografado);
  }

  if (!uuid || !codigo || !assinatura) {
    return {
      isOficial: false,
      resultado: 'adulterado',
      mensagem: 'Este convite não foi emitido pela plataforma oficial da Festa da Independência de Cabo Verde 2026.'
    };
  }

  // 1. Validar e recalcular assinatura digital
  const assinaturaCalculada = calcularAssinatura(uuid, codigo);
  if (assinatura.trim().toUpperCase() !== assinaturaCalculada.trim().toUpperCase()) {
    return {
      isOficial: false,
      resultado: 'adulterado',
      mensagem: 'Este convite não foi emitido pela plataforma oficial da Festa da Independência de Cabo Verde 2026.'
    };
  }

  // 2. Verificar existência oficial
  const convidado = cacheConvidados.find(c => c.uuid === uuid);
  if (!convidado) {
    return {
      isOficial: false,
      resultado: 'inexistente',
      mensagem: 'Este convite não foi emitido pela plataforma oficial da Festa da Independência de Cabo Verde 2026.'
    };
  }

  // 3. Verificar código antifraude correspondente
  if (convidado.codigoAntifraude !== codigo) {
    return {
      isOficial: false,
      resultado: 'adulterado',
      mensagem: 'Código de segurança corrompido ou adulterado. Este convite não foi emitido pela plataforma oficial da Festa da Independência de Cabo Verde 2026.'
    };
  }

  // 4. Se oficial, verificar status do convite
  if (convidado.statusConvite === 'Cancelado') {
    return {
      isOficial: true,
      resultado: 'cancelado',
      convidado,
      mensagem: 'Convite emitido pela plataforma oficial.'
    };
  }

  // 5. Verificar se já foi utilizado
  if (convidado.statusEntrada === 'Utilizado') {
    return {
      isOficial: true,
      resultado: 'utilizado',
      convidado,
      mensagem: 'Convite emitido pela plataforma oficial.'
    };
  }

  return {
    isOficial: true,
    resultado: 'valido',
    convidado,
    mensagem: 'Convite emitido pela plataforma oficial.'
  };
}

// Consultar/Validar ingresso por UUID e Código Antifraude (legado/fallback)
export function validarIngresso(uuid: string, codigo: string): { 
  resultado: 'valido' | 'invalido' | 'utilizado';
  convidado?: Convidado;
} {
  const convidado = cacheConvidados.find(c => c.uuid === uuid && c.codigoAntifraude === codigo);
  
  if (!convidado || convidado.statusConvite === 'Cancelado') {
    return { resultado: 'invalido' };
  }
  
  if (convidado.statusEntrada === 'Utilizado') {
    return { resultado: 'utilizado', convidado };
  }
  
  return { resultado: 'valido', convidado };
}

// Logs de Auditoria
export function obterLogsAuditoria(): LogAuditoria[] {
  return cacheLogs;
}

export function registrarLogAuditoria(logInput: {
  adminNome: string;
  dataLeitura: string;
  horaLeitura: string;
  resultado: 'Válido' | 'Já Utilizado' | 'Cancelado' | 'Não Oficial / Adulterado';
  localValidacao: string;
  convidadoUuid?: string;
  convidadoNome?: string;
  convidadoCpf?: string;
  dispositivo: string;
  localizacaoGps?: string | null;
}): void {
  const novoLog: LogAuditoria = {
    ...logInput,
    id: gerarUUID(),
    timestamp: new Date().toISOString()
  };

  const isOnline = obterEstadoOnline();
  if (isOnline) {
    setDoc(doc(db, 'logs_auditoria', novoLog.id), novoLog)
      .catch(error => handleFirestoreError(error, OperationType.WRITE, `logs_auditoria/${novoLog.id}`));
  } else {
    cacheLogs.push(novoLog);
    cacheLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    localStorage.setItem(AUDIT_KEY, JSON.stringify(cacheLogs));

    registrarAcaoOffline({
      tipo: 'auditoria' as any,
      uuid: novoLog.id,
      payload: novoLog,
      timestamp: new Date().toISOString()
    });
  }
}

// Confirmar Entrada do Convidado
export function confirmarEntrada(uuid: string, adminResponsavel: string = 'Operador de Segurança'): { sucesso: boolean; mensagem: string; convidado?: Convidado } {
  const index = cacheConvidados.findIndex(c => c.uuid === uuid);
  
  if (index === -1) {
    return { sucesso: false, mensagem: 'Convidado não encontrado no sistema.' };
  }
  
  const horaAtual = new Date().toISOString();
  
  const isOnline = obterEstadoOnline();
  if (isOnline) {
    // Async push to firebase
    updateDoc(doc(db, 'convidados', uuid), {
      statusEntrada: 'Utilizado',
      horaEntrada: horaAtual,
      adminValidacao: adminResponsavel
    }).catch(error => handleFirestoreError(error, OperationType.UPDATE, `convidados/${uuid}`));
  } else {
    // Write local first
    cacheConvidados[index].statusEntrada = 'Utilizado';
    cacheConvidados[index].horaEntrada = horaAtual;
    cacheConvidados[index].adminValidacao = adminResponsavel;
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));
    
    registrarAcaoOffline({
      tipo: 'confirmar_entrada',
      uuid,
      payload: { 
        horaEntrada: horaAtual,
        adminValidacao: adminResponsavel
      },
      timestamp: horaAtual
    });
  }
  
  return { 
    sucesso: true, 
    mensagem: 'Entrada confirmada com sucesso!', 
    convidado: cacheConvidados[index] 
  };
}

// Alterar Status do Convite (Cancelar / Reativar / Aprovar)
export function alterarStatusConvite(uuid: string, novoStatus: 'Ativo' | 'Cancelado'): boolean {
  const index = cacheConvidados.findIndex(c => c.uuid === uuid);
  if (index === -1) return false;
  
  const isOnline = obterEstadoOnline();
  if (isOnline) {
    updateDoc(doc(db, 'convidados', uuid), {
      statusConvite: novoStatus,
      statusEntrada: 'Não utilizado',
      horaEntrada: null
    }).catch(error => handleFirestoreError(error, OperationType.UPDATE, `convidados/${uuid}`));
  } else {
    cacheConvidados[index].statusConvite = novoStatus;
    if (novoStatus === 'Cancelado') {
      cacheConvidados[index].statusEntrada = 'Não utilizado';
      cacheConvidados[index].horaEntrada = null;
    }
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));
    
    registrarAcaoOffline({
      tipo: 'status_convite',
      uuid,
      payload: { statusConvite: novoStatus },
      timestamp: new Date().toISOString()
    });
  }
  return true;
}

// Obter Estatísticas Gerais do Painel
export function obterEstatisticaDashboard(): DashboardStats {
  const totalCadastrados = cacheConvidados.length;
  const totalUtilizados = cacheConvidados.filter(c => c.statusEntrada === 'Utilizado').length;
  const totalCancelados = cacheConvidados.filter(c => c.statusConvite === 'Cancelado').length;
  const totalPendentes = cacheConvidados.filter(c => c.statusConvite === 'Ativo' && c.statusEntrada === 'Não utilizado').length;
  
  const ativos = cacheConvidados.filter(c => c.statusConvite === 'Ativo').length;
  const taxaComparecimento = ativos > 0 ? Math.round((totalUtilizados / ativos) * 100) : 0;
  
  // Total fraud attempts: counted from security audit logs where QR validation failed
  const totalFraudes = cacheLogs.filter(l => l.resultado === 'Não Oficial / Adulterado' || l.resultado === 'Já Utilizado').length;
  
  // Total active marshals
  const totalFiscaisAtivos = cacheFiscais.filter(f => f.status === 'Ativo').length;
  
  // Total system accesses (from our session counter)
  const totalAcessos = cacheTotalAcessos;
  
  return {
    totalCadastrados,
    totalUtilizados,
    totalPendentes,
    totalCancelados,
    taxaComparecimento,
    totalFraudes,
    totalFiscaisAtivos,
    totalAcessos
  };
}

// Support guest editing and deletion
export function removerConvidado(uuid: string): void {
  const index = cacheConvidados.findIndex(c => c.uuid === uuid);
  if (index !== -1) {
    const isOnline = obterEstadoOnline();
    if (isOnline) {
      deleteDoc(doc(db, 'convidados', uuid)).catch(error => handleFirestoreError(error, OperationType.DELETE, `convidados/${uuid}`));
    }
    cacheConvidados.splice(index, 1);
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));
  }
}

export function editarConvidado(uuid: string, dados: Partial<Convidado>): void {
  const index = cacheConvidados.findIndex(c => c.uuid === uuid);
  if (index !== -1) {
    const updated = { ...cacheConvidados[index], ...dados };
    cacheConvidados[index] = updated;
    localStorage.setItem(DB_KEY, JSON.stringify(cacheConvidados));

    const isOnline = obterEstadoOnline();
    if (isOnline) {
      updateDoc(doc(db, 'convidados', uuid), dados).catch(error => handleFirestoreError(error, OperationType.UPDATE, `convidados/${uuid}`));
    }
  }
}

// Operations for Fiscais
export function obterFiscais(): Fiscal[] {
  return cacheFiscais.map(f => {
    // calculate validation count on the fly from the audit logs
    const checkins = cacheLogs.filter(l => l.adminNome === f.nome && l.resultado === 'Válido').length;
    // Find last validation timestamp if exists
    const lastLog = cacheLogs.find(l => l.adminNome === f.nome);
    const ultimoAcesso = lastLog ? `${lastLog.dataLeitura} ${lastLog.horaLeitura}` : null;
    return {
      ...f,
      ultimoAcesso,
      checkinsCount: checkins
    };
  });
}

export function cadastrarFiscal(nome: string, badge: string, setor: string): void {
  const novoFiscal: Fiscal = {
    id: gerarUUID(),
    nome,
    badge,
    setor,
    status: 'Ativo',
    checkinsCount: 0
  };
  cacheFiscais.push(novoFiscal);
  localStorage.setItem('caboverde2026_fiscais', JSON.stringify(cacheFiscais));
}

export function removerFiscal(id: string): void {
  cacheFiscais = cacheFiscais.filter(f => f.id !== id);
  localStorage.setItem('caboverde2026_fiscais', JSON.stringify(cacheFiscais));
}

export function alterarStatusFiscal(id: string, status: 'Ativo' | 'Suspenso'): void {
  const index = cacheFiscais.findIndex(f => f.id === id);
  if (index !== -1) {
    cacheFiscais[index].status = status;
    localStorage.setItem('caboverde2026_fiscais', JSON.stringify(cacheFiscais));
  }
}

// Operations for Programação (Schedule)
export function obterProgramacao(): AtividadeProgramacao[] {
  return cacheProgramacao;
}

export function cadastrarAtividade(horario: string, titulo: string, responsavel: string): void {
  const novaAtiv: AtividadeProgramacao = {
    id: 'p-' + gerarUUID().substring(0, 4),
    horario,
    titulo,
    responsavel,
    status: 'Agendado'
  };
  cacheProgramacao.push(novaAtiv);
  localStorage.setItem('caboverde2026_programacao', JSON.stringify(cacheProgramacao));
}

export function removerAtividade(id: string): void {
  cacheProgramacao = cacheProgramacao.filter(p => p.id !== id);
  localStorage.setItem('caboverde2026_programacao', JSON.stringify(cacheProgramacao));
}

export function alterarStatusAtividade(id: string, status: 'Agendado' | 'Em andamento' | 'Realizado' | 'Atrasado'): void {
  const index = cacheProgramacao.findIndex(p => p.id === id);
  if (index !== -1) {
    cacheProgramacao[index].status = status;
    localStorage.setItem('caboverde2026_programacao', JSON.stringify(cacheProgramacao));
  }
}

// Operations for Mural
export function obterMural(): MensagemMural[] {
  return cacheMural;
}

export function cadastrarMensagemMural(autor: string, mensagem: string): void {
  const novaMsg: MensagemMural = {
    id: 'm-' + gerarUUID().substring(0, 4),
    autor: autor || 'Anónimo',
    mensagem,
    status: 'Pendente',
    data: new Date().toISOString()
  };
  cacheMural.push(novaMsg);
  localStorage.setItem('caboverde2026_mural', JSON.stringify(cacheMural));
}

export function alterarStatusMural(id: string, status: 'Pendente' | 'Aprovado' | 'Recusado'): void {
  const index = cacheMural.findIndex(m => m.id === id);
  if (index !== -1) {
    cacheMural[index].status = status;
    localStorage.setItem('caboverde2026_mural', JSON.stringify(cacheMural));
  }
}

export function removerMensagemMural(id: string): void {
  cacheMural = cacheMural.filter(m => m.id !== id);
  localStorage.setItem('caboverde2026_mural', JSON.stringify(cacheMural));
}

// Operations for Documentos
export function obterDocumentos(): DocumentoOficial[] {
  return cacheDocumentos;
}

export function cadastrarDocumento(nome: string, tipo: string, pasta: 'Jurídico' | 'Financeiro' | 'Divulgação' | 'Logística', tamanho: string): void {
  const novoDoc: DocumentoOficial = {
    id: 'd-' + gerarUUID().substring(0, 4),
    nome,
    tipo,
    pasta,
    tamanho,
    dataAdicionado: new Date().toISOString()
  };
  cacheDocumentos.push(novoDoc);
  localStorage.setItem('caboverde2026_documentos', JSON.stringify(cacheDocumentos));
}

export function removerDocumento(id: string): void {
  cacheDocumentos = cacheDocumentos.filter(d => d.id !== id);
  localStorage.setItem('caboverde2026_documentos', JSON.stringify(cacheDocumentos));
}

// Resetar banco para o estado padrão
export function redefinirBancoDeDados(): void {
  // Clear all docs from Firestore
  const isOnline = obterEstadoOnline();
  if (isOnline) {
    cacheConvidados.forEach(c => {
      deleteDoc(doc(db, 'convidados', c.uuid))
        .catch(error => handleFirestoreError(error, OperationType.DELETE, `convidados/${c.uuid}`));
    });
    cacheLogs.forEach(l => {
      deleteDoc(doc(db, 'logs_auditoria', l.id))
        .catch(error => handleFirestoreError(error, OperationType.DELETE, `logs_auditoria/${l.id}`));
    });
  }
  
  cacheConvidados = [...CONVIDADOS_INICIAIS];
  cacheLogs = [];
  cacheFiscais = [
    { id: 'f-1', nome: 'Tenente António Silva', badge: 'FIS-101', setor: 'Portaria Principal', status: 'Ativo', checkinsCount: 0 },
    { id: 'f-2', nome: 'Agente Maria Cabral', badge: 'FIS-204', setor: 'Acesso VIP', status: 'Ativo', checkinsCount: 0 },
    { id: 'f-3', nome: 'Inspector Jorge Lima', badge: 'FIS-315', setor: 'Portaria Cultural', status: 'Ativo', checkinsCount: 0 }
  ];
  cacheProgramacao = [
    { id: 'p-1', horario: '22:00', titulo: 'Abertura dos Portões & Pavilhão Gastronómico', responsavel: 'Comissão de Logística', status: 'Agendado' },
    { id: 'p-2', horario: '22:30', titulo: 'Apresentação Artística: Batuque das Crioulas', responsavel: 'Secretaria de Cultura', status: 'Agendado' },
    { id: 'p-3', horario: '23:00', titulo: 'Ato Solene: Hino Nacional e Hasteamento da Bandeira', responsavel: 'Secretariado Geral', status: 'Agendado' },
    { id: 'p-4', horario: '23:30', titulo: 'Pronunciamento Consular & Homenagem de Heróis Nacionais', responsavel: 'Comitê Diplomático', status: 'Agendado' },
    { id: 'p-5', horario: '00:00', titulo: 'Brinde da Independência (Grogue Festivo) & Fogos', responsavel: 'Cerimonial Oficial', status: 'Agendado' },
    { id: 'p-6', horario: '00:30', titulo: 'Funaná e Coladera Dance Celebration (Grupo Morabeza)', responsavel: 'Direção Artística', status: 'Agendado' }
  ];
  cacheMural = [
    { id: 'm-1', autor: 'Dara de Assis', mensagem: 'Viva Cabo Verde! Orgulho imenso das nossas ilhas de sol e de morabeza! 🇨🇻', status: 'Aprovado', data: new Date().toISOString() },
    { id: 'm-2', autor: 'Manuel Lopes', mensagem: 'Uma saudação fraterna a todos os conterrâneos na diáspora. Comemoramos 50 anos de liberdade!', status: 'Aprovado', data: new Date().toISOString() },
    { id: 'm-3', autor: 'Soraia Semedo', mensagem: 'Que saudades de uma boa cachupa e um funaná rasgado! Festa maravilhosa.', status: 'Pendente', data: new Date().toISOString() }
  ];
  cacheDocumentos = [
    { id: 'd-1', nome: 'Decreto_Governamental_Autorizacao_Solenidade.pdf', tipo: 'PDF', pasta: 'Jurídico', tamanho: '2.4 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-2', nome: 'Orcamento_Festa_Independencia_Porto_Alegre.xlsx', tipo: 'XLS', pasta: 'Financeiro', tamanho: '1.8 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-3', nome: 'Plano_Layout_Espacial_Assembleia_Nacional.pdf', tipo: 'PDF', pasta: 'Logística', tamanho: '4.1 MB', dataAdicionado: new Date().toISOString() },
    { id: 'd-4', nome: 'PressKit_Assessoria_CaboVerde_2026.zip', tipo: 'ZIP', pasta: 'Divulgação', tamanho: '12.0 MB', dataAdicionado: new Date().toISOString() }
  ];
  cacheTotalAcessos = 142;

  localStorage.setItem(DB_KEY, JSON.stringify(CONVIDADOS_INICIAIS));
  localStorage.setItem(AUDIT_KEY, JSON.stringify([]));
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify([]));
  localStorage.setItem(ONLINE_STATE_KEY, 'true');
  localStorage.setItem('caboverde2026_fiscais', JSON.stringify(cacheFiscais));
  localStorage.setItem('caboverde2026_programacao', JSON.stringify(cacheProgramacao));
  localStorage.setItem('caboverde2026_mural', JSON.stringify(cacheMural));
  localStorage.setItem('caboverde2026_documentos', JSON.stringify(cacheDocumentos));
  localStorage.setItem('caboverde2026_total_acessos', '142');
}
