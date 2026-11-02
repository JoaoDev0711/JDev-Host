const corsHeaders = {
  "Access-Control-Allow-Origin": "https://joaodev0711.github.io",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Authorization,Content-Type",
  "Access-Control-Max-Age": "86400",
  "Vary": "Origin"
};

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
});
const fail = (message, status = 400) => json({ error: message }, status);
const now = () => new Date().toISOString();
const id = () => crypto.randomUUID();
const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map(x => x.toString(16).padStart(2, "0")).join("");
};
async function hash(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}
function bearer(request) {
  const value = request.headers.get("Authorization") || "";
  return value.startsWith("Bearer ") ? value.slice(7) : "";
}
async function admin(request, env) {
  const token = bearer(request);
  if (!token) return false;
  const tokenHash = await hash(token);
  return !!(await env.DB.prepare("SELECT token_hash FROM auth_tokens WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1").bind(tokenHash).first());
}
async function device(request, env) {
  const token = bearer(request);
  if (!token) return null;
  const tokenHash = await hash(token);
  return await env.DB.prepare("SELECT id, name FROM devices WHERE token_hash = ? AND revoked_at IS NULL LIMIT 1").bind(tokenHash).first();
}
async function body(request) {
  const text = await request.text();
  if (text.length > 1_000_000) throw new Error("Corpo da requisição muito grande.");
  return text ? JSON.parse(text) : {};
}
function allowedGame(game) {
  return ["ETS2", "BeamNG", "MinecraftJava", "MinecraftBedrock"].includes(game);
}
function serverData(input) {
  const game = String(input.game || "");
  if (!allowedGame(game)) throw new Error("Jogo não suportado.");
  const name = String(input.name || "").trim().slice(0, 60);
  if (!name) throw new Error("Informe o nome do servidor.");
  const config = {
    game,
    version: String(input.version || "").slice(0, 40),
    loader: String(input.loader || "").slice(0, 40),
    loaderVersion: String(input.loaderVersion || "").slice(0, 60),
    ram: Math.max(1, Math.min(128, Number(input.ram) || 1)),
    port: Math.max(1, Math.min(65535, Number(input.port) || 25565)),
    description: String(input.description || "").slice(0, 160),
    settings: input.settings && typeof input.settings === "object" ? input.settings : {}
  };
  return { name, config };
}
async function log(env, serverId, level, message) {
  await env.DB.prepare("INSERT INTO logs (id, server_id, level, message, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id(), serverId || null, String(level || "info").slice(0, 16), String(message || "").slice(0, 2000), now()).run();
}
async function enqueue(env, command, serverId, payload = {}) {
  const taskId = id();
  await env.DB.prepare("INSERT INTO tasks (id, command, server_id, payload_json, status, created_at) VALUES (?, ?, ?, ?, 'pending', ?)")
    .bind(taskId, command, serverId, JSON.stringify(payload), now()).run();
  return taskId;
}

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (path === "/health" && request.method === "GET") {
        return json({ ok: true, service: "JDev Host API", time: now() });
      }

      if (path === "/api/claim" && request.method === "POST") {
        const input = await body(request);
        const setupHash = await hash(String(input.setupCode || ""));
        const setup = await env.DB.prepare("SELECT id FROM setup_keys WHERE token_hash = ? AND used_at IS NULL LIMIT 1").bind(setupHash).first();
        if (!setup) return fail("Código inicial inválido ou já utilizado.", 401);
        const panelToken = randomToken();
        await env.DB.batch([
          env.DB.prepare("INSERT INTO auth_tokens (token_hash, created_at) VALUES (?, ?)").bind(await hash(panelToken), now()),
          env.DB.prepare("UPDATE setup_keys SET used_at = ? WHERE id = ? AND used_at IS NULL").bind(now(), setup.id)
        ]);
        return json({ panelToken, message: "Painel autorizado. Guarde seu token; o código inicial não poderá ser reutilizado." }, 201);
      }

      if (path === "/api/agent/pair" && request.method === "POST") {
        if (!(await admin(request, env))) return fail("Não autorizado.", 401);
        const input = await body(request);
        const name = String(input.name || "JDev Host Linux").slice(0, 80);
        const token = randomToken();
        const tokenHash = await hash(token);
        const deviceId = id();
        await env.DB.prepare("UPDATE devices SET revoked_at = ? WHERE revoked_at IS NULL").bind(now()).run();
        await env.DB.prepare("INSERT INTO devices (id, name, token_hash, created_at, last_seen) VALUES (?, ?, ?, ?, ?)")
          .bind(deviceId, name, tokenHash, now(), now()).run();
        return json({ deviceId, deviceToken: token, message: "Guarde o token do agente. Ele não será exibido novamente." }, 201);
      }

      if (path.startsWith("/api/agent/")) {
        const currentDevice = await device(request, env);
        if (!currentDevice) return fail("Agente não autorizado.", 401);

        if (path === "/api/agent/poll" && request.method === "POST") {
          await env.DB.prepare("UPDATE devices SET last_seen = ? WHERE id = ?").bind(now(), currentDevice.id).run();
          const task = await env.DB.prepare("SELECT id, command, server_id, payload_json FROM tasks WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1").first();
          if (!task) return json({ task: null, pollAfterMs: 4000 });
          await env.DB.prepare("UPDATE tasks SET status = 'claimed', claimed_by = ?, claimed_at = ? WHERE id = ? AND status = 'pending'")
            .bind(currentDevice.id, now(), task.id).run();
          const claimed = await env.DB.prepare("SELECT id, command, server_id, payload_json FROM tasks WHERE id = ? AND status = 'claimed' AND claimed_by = ?")
            .bind(task.id, currentDevice.id).first();
          if (!claimed) return json({ task: null, pollAfterMs: 1500 });
          return json({ task: { id: claimed.id, command: claimed.command, serverId: claimed.server_id, payload: JSON.parse(claimed.payload_json || "{}") }, pollAfterMs: 1000 });
        }

        if (path === "/api/agent/report" && request.method === "POST") {
          const input = await body(request);
          const status = String(input.status || "");
          const serverId = input.serverId ? String(input.serverId) : null;
          if (serverId && !["stopped", "starting", "running", "stopping", "error"].includes(status)) return fail("Status inválido.");
          if (serverId) {
            await env.DB.prepare("UPDATE servers SET status = ?, updated_at = ? WHERE id = ?").bind(status, now(), serverId).run();
            if (status === "running") {
              await env.DB.prepare("UPDATE runtime_state SET active_server_id = ?, updated_at = ? WHERE id = 1").bind(serverId, now()).run();
            } else if (status === "stopped" || status === "error") {
              await env.DB.prepare("UPDATE runtime_state SET active_server_id = CASE WHEN active_server_id = ? THEN NULL ELSE active_server_id END, updated_at = ? WHERE id = 1").bind(serverId, now()).run();
            }
          }
          if (input.taskId) {
            await env.DB.prepare("UPDATE tasks SET status = 'done', finished_at = ?, result = ? WHERE id = ? AND claimed_by = ?")
              .bind(now(), String(input.message || status || "Concluído").slice(0, 1000), String(input.taskId), currentDevice.id).run();
          }
          if (input.message) await log(env, serverId, input.level || "info", input.message);
          await env.DB.prepare("UPDATE devices SET last_seen = ? WHERE id = ?").bind(now(), currentDevice.id).run();
          return json({ ok: true });
        }
        return fail("Rota do agente não encontrada.", 404);
      }

      if (!(await admin(request, env))) return fail("Acesso negado. Configure o token do painel.", 401);

      if (path === "/api/status" && request.method === "GET") {
        const [agent, runtime, pending, servers] = await Promise.all([
          env.DB.prepare("SELECT name, last_seen FROM devices WHERE revoked_at IS NULL ORDER BY created_at DESC LIMIT 1").first(),
          env.DB.prepare("SELECT active_server_id, updated_at FROM runtime_state WHERE id = 1").first(),
          env.DB.prepare("SELECT COUNT(*) AS count FROM tasks WHERE status IN ('pending','claimed')").first(),
          env.DB.prepare("SELECT id, name, config_json, status, created_at, updated_at FROM servers ORDER BY created_at DESC").all()
        ]);
        const online = !!agent && Date.now() - new Date(agent.last_seen).getTime() < 25000;
        return json({ agent: { connected: online, name: agent?.name || null, lastSeen: agent?.last_seen || null }, runtime, pendingTasks: pending?.count || 0, servers: (servers.results || []).map(s => ({ ...s, config: JSON.parse(s.config_json) })) });
      }

      if (path === "/api/servers" && request.method === "GET") {
        const result = await env.DB.prepare("SELECT id, name, config_json, status, created_at, updated_at FROM servers ORDER BY created_at DESC").all();
        return json((result.results || []).map(s => ({ ...s, config: JSON.parse(s.config_json) })));
      }

      if (path === "/api/servers" && request.method === "POST") {
        const input = await body(request);
        const { name, config } = serverData(input);
        const serverId = id();
        await env.DB.prepare("INSERT INTO servers (id, name, config_json, status, created_at, updated_at) VALUES (?, ?, ?, 'stopped', ?, ?)")
          .bind(serverId, name, JSON.stringify(config), now(), now()).run();
        await log(env, serverId, "info", "Servidor cadastrado no painel.");
        return json({ id: serverId, name, config, status: "stopped" }, 201);
      }

      const match = path.match(/^\/api\/servers\/([a-f0-9-]+)(?:\/(start|stop|logs))?$/);
      if (match) {
        const serverId = match[1];
        const action = match[2] || "";
        const server = await env.DB.prepare("SELECT id, name, config_json, status FROM servers WHERE id = ?").bind(serverId).first();
        if (!server) return fail("Servidor não encontrado.", 404);

        if (action === "start" && request.method === "POST") {
          const runtime = await env.DB.prepare("SELECT active_server_id FROM runtime_state WHERE id = 1").first();
          const activeId = runtime?.active_server_id;
          if (activeId && activeId !== serverId) {
            await enqueue(env, "stop", activeId, { reason: "Troca de servidor: apenas uma instância pode ficar ativa." });
            await env.DB.prepare("UPDATE servers SET status = 'stopping', updated_at = ? WHERE id = ?").bind(now(), activeId).run();
          }
          const taskId = await enqueue(env, "start", serverId, { config: JSON.parse(server.config_json) });
          await env.DB.prepare("UPDATE servers SET status = 'starting', updated_at = ? WHERE id = ?").bind(now(), serverId).run();
          await log(env, serverId, "info", "Inicialização solicitada pelo painel.");
          return json({ ok: true, taskId, status: "starting", stoppedPrevious: !!activeId && activeId !== serverId }, 202);
        }
        if (action === "stop" && request.method === "POST") {
          const taskId = await enqueue(env, "stop", serverId, {});
          await env.DB.prepare("UPDATE servers SET status = 'stopping', updated_at = ? WHERE id = ?").bind(now(), serverId).run();
          await log(env, serverId, "info", "Parada solicitada pelo painel.");
          return json({ ok: true, taskId, status: "stopping" }, 202);
        }
        if (action === "logs" && request.method === "GET") {
          const result = await env.DB.prepare("SELECT level, message, created_at FROM logs WHERE server_id = ? ORDER BY created_at DESC LIMIT 100").bind(serverId).all();
          return json(result.results || []);
        }
        if (!action && request.method === "PUT") {
          const input = await body(request);
          const { name, config } = serverData(input);
          await env.DB.prepare("UPDATE servers SET name = ?, config_json = ?, updated_at = ? WHERE id = ?")
            .bind(name, JSON.stringify(config), now(), serverId).run();
          await log(env, serverId, "info", "Configuração atualizada.");
          return json({ ok: true });
        }
        if (!action && request.method === "DELETE") {
          if (server.status === "running" || server.status === "starting" || server.status === "stopping") return fail("Pare o servidor antes de excluí-lo.", 409);
          await env.DB.batch([
            env.DB.prepare("DELETE FROM logs WHERE server_id = ?").bind(serverId),
            env.DB.prepare("DELETE FROM tasks WHERE server_id = ?").bind(serverId),
            env.DB.prepare("DELETE FROM servers WHERE id = ?").bind(serverId)
          ]);
          return json({ ok: true });
        }
      }
      return fail("Rota não encontrada.", 404);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Erro interno.", 500);
    }
  }
};