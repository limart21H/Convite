import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Ensure Gemini API key is configured
const apiKey = process.env.GEMINI_API_KEY;

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON bodies
  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Secure Gemini API Proxy
  app.post('/api/chat', async (req, res) => {
    try {
      if (!apiKey) {
        return res.status(500).json({ 
          error: 'GEMINI_API_KEY is not defined in the environment secrets. Please configure it in the application settings.' 
        });
      }

      const { prompt, state } = req.body;
      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required.' });
      }

      // Initialize Google GenAI Client
      const ai = new GoogleGenAI({ apiKey });

      // Build a detailed Cabo Verde 2026 Admin Context system prompt
      const totalGuests = state?.stats?.totalCadastrados ?? 0;
      const totalUsed = state?.stats?.totalUtilizados ?? 0;
      const totalPending = state?.stats?.totalPendentes ?? 0;
      const totalCancelled = state?.stats?.totalCancelados ?? 0;
      const attendanceRate = state?.stats?.taxaComparecimento ?? 0;
      const totalFrauds = state?.stats?.totalFraudes ?? 0;
      const totalAcessos = state?.stats?.totalAcessos ?? 0;
      const totalFiscais = state?.stats?.totalFiscaisAtivos ?? 0;

      // Extract details about diaspora origin countries and Cabo Verde islands
      const guestOrigins: Record<string, number> = {};
      const islandsOfOrigin: Record<string, number> = {};
      if (Array.isArray(state?.convidados)) {
        state.convidados.forEach((c: any) => {
          if (c.statusConvite === 'Ativo') {
            const country = c.paisResidencia || 'Desconhecido';
            const island = c.ilhaOrigem || 'Desconhecido';
            guestOrigins[country] = (guestOrigins[country] || 0) + 1;
            islandsOfOrigin[island] = (islandsOfOrigin[island] || 0) + 1;
          }
        });
      }

      const originCountryDetails = Object.entries(guestOrigins)
        .map(([c, n]) => `- ${c}: ${n} convidados ativos`)
        .join('\n');

      const islandDetails = Object.entries(islandsOfOrigin)
        .map(([cv, n]) => `- Ilha de ${cv}: ${n} pessoas relacionadas`)
        .join('\n');

      // Schedule current status
      let scheduleText = '';
      if (Array.isArray(state?.programacao)) {
        scheduleText = state.programacao
          .map((item: any) => `* [${item.horario}] ${item.titulo} (Resp: ${item.responsavel}) - Status: ${item.status}`)
          .join('\n');
      }

      // Incidents/Audit
      let incidentsText = '';
      if (Array.isArray(state?.logs)) {
        const fraudsList = state.logs.filter((l: any) => l.resultado === 'Não Oficial / Adulterado' || l.resultado === 'Já Utilizado');
        incidentsText = `Últimos logs relevantes:\n` + state.logs.slice(0, 5)
          .map((l: any) => `* [${l.horaLeitura} ${l.dataLeitura}] Operador: ${l.adminNome} | Convidado: ${l.convidadoNome} | Resultado: ${l.resultado} | Local: ${l.localValidacao}`)
          .join('\n');
      }

      const systemInstruction = `
Você é o Assistente de Inteligência Artificial Oficial do Centro de Comando da Festa da Independência de Cabo Verde 2026.
Seu papel é auxiliar os gestores e organizadores do evento fornecendo respostas fundamentadas nos dados reais do sistema que são injetados nesta mensagem.

Siga estas diretrizes:
1. Responda de forma clara, prestativa, altamente profissional e com o calor cultural de Cabo Verde (termo de acolhimento: "Morabeza").
2. Sempre responda em Português.
3. Se o gestor perguntar sobre estatísticas ou dados, use os dados fornecidos abaixo e evite inventar números que contradizem os fatos fornecidos.
4. Use formatação em Markdown elegante com tabelas e listas se necessário para apresentar relatórios e dados numéricos complexos de forma visualmente estimulante.

FONTES DE DADOS REAIS DO EVENTO:
- CONVITES EMITIDOS: ${totalGuests} totais cadastrados na plataforma.
- CONVITES UTILIZADOS (CHECK-IN CONCLUÍDO): ${totalUsed}
- CONVITES PENDENTES (RESERVAS ATIVAS): ${totalPending}
- CONVITES CANCELADOS: ${totalCancelled}
- TAXA DE COMPARECIMENTO (PRESENÇA REAL): ${attendanceRate}%
- FRAUDES IMPEDIDAS: ${totalFrauds} tentativas de invasão bloqueadas pela portaria
- FISCAIS DE PORTARIA ATIVOS: ${totalFiscais}
- TOTAL DE ACESSOS AO CONSOLE: ${totalAcessos} acessos monitorados

PAÍSES DE ORIGEM NA DIÁSPORA (RESIDÊNCIA):
${originCountryDetails || 'Nenhum convidado cadastrado até o momento.'}

ORIGENS INSULARES (ILHAS DE ORIGEM EM CABO VERDE):
${islandDetails || 'Nenhum convidado cadastrado até o momento.'}

CRONOGRAMA DO EVENTO PROGRAMADO EM TEMPO REAL:
${scheduleText || 'Nenhuma atividade registrada.'}

LOGS DE SEGURANÇA E AUDITORIA DA CENTRAL DE PORTARIA:
${incidentsText || 'Nenhum log registrado.'}

Responda à pergunta do gestor de forma concisa e útil com base em todos estes dados reais estruturados. Mantenha os termos amigáveis e evite jargões de programação desproporcionais.
`;

      const result = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.3,
        }
      });

      const responseText = result.text || 'Desculpe, não consegui analisar os relatórios. Tente novamente.';
      res.json({ text: responseText });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ 
        error: `Ocorreu um erro ao processar a consulta via IA: ${error?.message || String(error)}` 
      });
    }
  });

  // Serve Vite or static files based on environment
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

startServer();
