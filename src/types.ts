/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Convidado {
  id: string; // ID sequencial ou UUID
  uuid: string; // UUID de segurança único
  nome: string;
  telefone: string;
  email: string;
  cpf: string; // Formato 000.000.000-00
  codigoAntifraude: string; // Código de 6 caracteres (ex: A7K9P2)
  dataCadastro: string; // ISO String
  statusConvite: 'Ativo' | 'Cancelado'; 
  statusEntrada: 'Não utilizado' | 'Utilizado';
  horaEntrada?: string | null; // ISO String ou formato legível de entrada
  adminValidacao?: string | null; // Administrador que realizou a validação
  documento?: string | null; // Documento de identificação (Base64 string se cadastrado)
  paisResidencia?: string | null; // País de residência atual (Diáspora)
  cidadeAtual?: string | null; // Cidade atual de moradia
  ilhaOrigem?: string | null; // Ilha de origem em Cabo Verde (Santiago, São Vicente, etc.)
}

export interface AdminUser {
  id: string;
  email: string;
  nome: string;
}

export interface DashboardStats {
  totalCadastrados: number;
  totalUtilizados: number;
  totalPendentes: number; // Não utilizados e Ativos
  totalCancelados: number;
  taxaComparecimento: number; // Porcentagem
  totalFraudes: number;
  totalFiscaisAtivos: number;
  totalAcessos: number;
}

export interface Fiscal {
  id: string;
  nome: string;
  badge: string; // ex: FIS-001
  setor: string; // Portaria Principal, Zona VIP, etc.
  status: 'Ativo' | 'Suspenso';
  ultimoAcesso?: string | null;
  checkinsCount: number;
}

export interface AtividadeProgramacao {
  id: string;
  horario: string; // ex: "22:00"
  titulo: string;
  responsavel: string;
  status: 'Agendado' | 'Em andamento' | 'Realizado' | 'Atrasado';
}

export interface MensagemMural {
  id: string;
  autor: string;
  mensagem: string;
  status: 'Pendente' | 'Aprovado' | 'Recusado';
  data: string; // ISO String
}

export interface DocumentoOficial {
  id: string;
  nome: string;
  tipo: string; // PDF, XLS, PNG, etc.
  pasta: 'Jurídico' | 'Financeiro' | 'Divulgação' | 'Logística';
  tamanho: string;
  dataAdicionado: string; // ISO String
}

export interface LogSincronizacao {
  id: string;
  tipo: 'cadastro' | 'entrada' | 'cancelamento';
  registerId: string;
  payload: any;
  timestamp: string;
  sincronizado: boolean;
}

export interface LogAuditoria {
  id: string;
  adminNome: string;
  dataLeitura: string;
  horaLeitura: string;
  resultado: 'Válido' | 'Já Utilizado' | 'Cancelado' | 'Não Oficial / Adulterado';
  localValidacao: string;
  convidadoUuid?: string;
  convidadoNome?: string;
  convidadoCpf?: string;
  timestamp: string;
  dispositivo: string; // Dispositivo de varredura
  localizacaoGps?: string | null; // Coordenadas de GPS se disponíveis
}

