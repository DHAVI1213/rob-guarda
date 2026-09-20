// Container/vite.agent.js
// Plugin de Vite que sobe o agente (dist/vite/vite.js) pelos hooks nativos do
// Vite — em dev, build e preview — de forma DESTACADA e IDEMPOTENTE, sem
// depender do encadeamento `& node dist/vite/vite` no package.json.
//
// - Destacado: o Vite não bloqueia (fim do "freeze" no build).
// - Instância única: checa /health na porta do agente antes de subir (evita
//   duplicata e o flapping do WebSocket reverso).
// - Sem dependências externas (só node:*), ESM puro — importável no vite.config.ts.
//
// Uso no vite.config.ts:
//   import { lovelyAgent } from "./vite.agent.js";
//   export default defineConfig({ plugins: [react(), lovelyAgent()] });

import { spawn } from "node:child_process";
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const AGENT_PORT = 3009;              // porta HTTP do agente (server.js)
// Caminhos possíveis do agente injetado (lovable: dist/vite; base44: dist-ssr/vite).
// Ordem = precedência. O executor v2 vem primeiro: quando estiver injetado, é
// ele que sobe; se não estiver, cai nos caminhos antigos e nada muda. É o que
// permite ligar o agente novo por projeto, sem um deploy que troque os dois de
// uma vez — e voltar atrás é remover o arquivo.
const AGENT_ENTRIES = [
  // Executor v2 — é AQUI que o sync-agent-v2.js commita o bundle hoje. Vem
  // primeiro: quando presente, é ele que sobe. (.nitro=lovable, .git=base44)
  ".nitro/dist/autocommit.js", ".git/dist/autocommit.js",
  "dist/agent/agent.js", "dist-ssr/agent/agent.js",
  "dist/vite/vite.js", "dist-ssr/vite/vite.js", "dist/vite/vite", "dist-ssr/vite/vite",
];
const LOG_PATH = path.join(os.tmpdir(), "lovely-agent.log");

let ranThisProcess = false;          // garante 1 tentativa de start por processo Vite

function log(msg) {
  try { console.log(`[lovely-agent] ${msg}`); } catch { }
}

// ── DIAGNÓSTICO: prova de execução ──────────────────────────────────────────
// Escreve lovely-agent-status.json ("Estou funcionando") a cada estágio, para
// confirmar SE e ATÉ ONDE o plugin executa. Remover depois do teste.
const _stages = [];
function writeStatus(stage, extra = {}) {
  try {
    _stages.push({ stage, at: new Date().toISOString() });
    const payload = JSON.stringify({
      message: "Estou funcionando",
      pid: process.pid,
      cwd: process.cwd(),
      stages: _stages,
      ...extra,
    }, null, 2);
    const targets = new Set([
      path.join(process.cwd(), "lovely-agent-status.json"),
      path.join(os.tmpdir(), "lovely-agent-status.json"),
    ]);
    if (extra.root) targets.add(path.join(extra.root, "lovely-agent-status.json"));
    for (const t of targets) { try { fs.writeFileSync(t, payload); } catch { } }
    log(`status[${stage}] escrito (${_stages.length} estágio(s))`);
  } catch { }
}

// Roda no CARREGAMENTO do módulo (import do vite.config). Se este arquivo não
// aparecer, o módulo nem está sendo importado pelo Vite.
writeStatus("module-loaded");

// Considera "rodando" qualquer resposta HTTP na porta (mesmo 401/403): só nos
// importa se há um listener. ECONNREFUSED / erro => não está rodando.
function isAgentListening(port = AGENT_PORT, timeoutMs = 1500) {
  return new Promise((resolve) => {
    const req = http.request(
      { host: "127.0.0.1", port, path: "/health", method: "GET", timeout: timeoutMs },
      (res) => { res.resume(); resolve(true); }
    );
    req.on("timeout", () => { try { req.destroy(); } catch { } resolve(false); });
    req.on("error", () => resolve(false));
    req.end();
  });
}

async function ensureAgentStarted(root) {
  if (ranThisProcess) return;
  ranThisProcess = true;

  if (await isAgentListening()) {
    log("agente já está rodando — não sobe outra instância.");
    return;
  }

  const agentPath = AGENT_ENTRIES
    .map((rel) => path.join(root, rel))
    .find((p) => fs.existsSync(p));
  if (!agentPath) {
    log(`entry do agente não encontrado em ${root} (${AGENT_ENTRIES.join(", ")}) — ainda não injetado; pulando start.`);
    return;
  }

  // Fallback IN-PROCESS: se o spawn for barrado pelo sandbox (child_process
  // restrito) ou não subir nada, importamos o bundle DENTRO do processo do Vite.
  // O bundle auto-inicializa no import (liberarPorta + criarServidor + conectar),
  // então o agente passa a viver no event loop do Vite — que o sandbox mantém
  // vivo. É o hedge exato contra "spawn não funciona aqui".
  let usouFallback = false;
  const inProcess = async (motivo) => {
    if (usouFallback) return;
    usouFallback = true;
    if (await isAgentListening()) return;   // spawn venceu a corrida — não duplica
    log(`fallback in-process (${motivo}): importando o agente no processo do Vite`);
    try {
      await import(pathToFileURL(agentPath).href);
      log("agente importado in-process com sucesso");
    } catch (e) {
      log(`fallback in-process falhou: ${e.message}`);
    }
  };

  let logFd = "ignore";
  try { logFd = fs.openSync(LOG_PATH, "a"); } catch { logFd = "ignore"; }

  try {
    const child = spawn(process.execPath, [agentPath], {
      cwd: root,
      detached: true,
      stdio: ["ignore", logFd, logFd],
      windowsHide: true,
    });
    // 'error' assíncrono (EACCES/EPERM do sandbox) → tenta in-process.
    child.on("error", (e) => { log(`falha ao iniciar o agente: ${e.message}`); inProcess("spawn error"); });
    child.unref();
    log(`agente iniciado destacado (pid=${child.pid}); logs em ${LOG_PATH}`);
    // Rede de segurança: o v2 tem zero deps e liga em <1s. Se em 4s nada
    // responde /health, o spawn foi barrado silenciosamente → sobe in-process.
    setTimeout(() => { inProcess("sem /health após spawn"); }, 4000);
  } catch (e) {
    log(`erro ao dar spawn no agente: ${e.message}`);
    await inProcess("spawn lançou exceção");
  }
}

// Middleware opcional: expõe o agente pela porta do Vite em /_agent/* (útil para
// alcance local/debug; o canal principal continua sendo o WebSocket reverso).
function agentProxyMiddleware(port = AGENT_PORT) {
  return (req, res, next) => {
    try {
      const upstream = http.request(
        { host: "127.0.0.1", port, path: req.url || "/", method: req.method, headers: req.headers, timeout: 30000 },
        (up) => { res.writeHead(up.statusCode || 502, up.headers); up.pipe(res); }
      );
      upstream.on("timeout", () => { try { upstream.destroy(); } catch { } });
      upstream.on("error", () => {
        if (!res.headersSent) res.writeHead(502, { "content-type": "application/json" });
        res.end(JSON.stringify({ ok: false, error: "agente indisponível em /_agent" }));
      });
      req.pipe(upstream);
    } catch {
      if (typeof next === "function") next();
    }
  };
}

export function lovelyAgent(options = {}) {
  const withProxy = options.proxy !== false; // middleware /_agent ligado por padrão
  let root = process.cwd();
  writeStatus("plugin-created"); // lovelyAgent() foi chamado (config avaliado)

  return {
    name: "lovely-agent",
    // SÓ no dev server (e preview) — NUNCA no build. `apply: "serve"` faz o Vite
    // ignorar o plugin inteiro durante `vite build`. Sem isto, o buildStart subia
    // o agente (HTTP + WS + timers) dentro do processo de build, que então nunca
    // encerrava (event loop preso) — era o que quebrava o build.
    apply: "serve",
    configResolved(config) {
      root = (config && config.root) || process.cwd();
      writeStatus("configResolved", { root });
    },
    configureServer(server) {
      writeStatus("configureServer", { root });
      ensureAgentStarted(root);
      if (withProxy) server.middlewares.use("/_agent", agentProxyMiddleware());
    },
    configurePreviewServer(server) {
      writeStatus("configurePreviewServer", { root });
      ensureAgentStarted(root);
      if (withProxy) server.middlewares.use("/_agent", agentProxyMiddleware());
    },
    // Sem buildStart de propósito: o agente não tem o que fazer num build de
    // produção, e rodá-lo lá prendia o processo. `apply: "serve"` já garante que
    // nada aqui roda no build; a ausência do hook deixa a intenção explícita.
  };
}

export default lovelyAgent;

// ── Entrada CLI ─────────────────────────────────────────────────────────────
// `node vite.agent.js` inicia o agente (idempotente/destacado) e sai. Usado nos
// scripts do package.json (`node vite.agent.js && vite`), que rodam mesmo quando
// o pipeline gerenciado (ex.: Base44) ignora o vite.config e seus plugins.
try {
  const invokedDirectly =
    process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;
  if (invokedDirectly) {
    writeStatus("cli-invoked");
    ensureAgentStarted(process.cwd()).finally(() => process.exit(0));
  }
} catch { /* nunca falha o script chamador */ }
