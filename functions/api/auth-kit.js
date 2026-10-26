// Эталонный серверный модуль auth-kit (образец: gym-hero). Копируйте в приложение без изменений (Workers и Pages Functions).
// Спецификация: INTEGRATION.md. Привязка (binding) называется VAULT, entrypoint Vault.
//
//   import { authenticate, meResponse, json } from "./auth-kit.js";
//   const PROJECT_ID = "gym-hero";                         // константа в коде, НЕ из запроса
//   const auth = await authenticate(request, env, PROJECT_ID);
//   if (auth.response) return auth.response;               // 401 / 429 / 403 readonly / 503 / 500
//   const { who } = auth;      // { userId, name, role, readonly, impersonate, impersonatedBy }
//   // GET /api/me -> return meResponse(who)

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
}

/** Достаёт ключ только из заголовка Authorization: Bearer <ключ>. Ключ не принимается из URL, cookie и тела запроса. */
export function bearerKey(request) {
  const m = /^Bearer\s+(.+)$/i.exec(request.headers.get("Authorization") || "");
  return m ? m[1].trim() : "";
}

/**
 * Проверяет ключ через auth-kit. Возвращает { who } или { response } (готовый ответ, его нужно вернуть как есть).
 * Все коды и тела ошибок фиксированы спецификацией и одинаковы во всех приложениях.
 */
export async function authenticate(request, env, projectId) {
  if (!env.VAULT) return { response: json({ error: "no_vault_binding" }, 500) };

  const key = bearerKey(request);
  if (!key) return { response: json({ error: "unauthorized" }, 401) };

  let who;
  try {
    who = await env.VAULT.verify(key, projectId, request.headers.get("CF-Connecting-IP") || undefined);
  } catch {
    // Сам auth-kit недоступен: это 503, а не 401, чтобы клиент не стирал ключ из-за чужого сбоя. Доступ при этом закрыт.
    return { response: json({ error: "auth_unavailable" }, 503) };
  }

  if (!who) return { response: json({ error: "unauthorized" }, 401) };
  if ("limited" in who) return { response: json({ error: "rate_limited" }, 429, { "Retry-After": "60" }) };

  // Ключ «только чтение»: любые изменения запрещены (включая импорт и очистку данных).
  if (who.readonly && request.method !== "GET" && request.method !== "HEAD") {
    return { response: json({ error: "readonly" }, 403) };
  }

  return { who };
}

/**
 * POST /api/claim: погашение одноразового кода входа (из QR или введённого вручную). Ключа у человека ещё нет, поэтому
 * authenticate не вызывается: маршрут открыт без ключа (в шлюзе сайта тоже, см. site-gate.js). Код только в теле запроса.
 * Тело: {"code":"XXXX-XXXX-XXXX"} (принимается и "akc:XXXX-XXXX-XXXX"). Успех: 200 {"key":"..."}; ключ виден один раз.
 * Любая неудача (нет такого кода, истёк, отменён, уже использован, чужой проект) это одинаковый 400 invalid_code.
 */
export async function claimResponse(request, env, projectId) {
  if (request.method !== "POST") return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
  if (!env.VAULT) return json({ error: "no_vault_binding" }, 500);

  let body = null;
  try { body = await request.json(); } catch {}
  const code = body && typeof body.code === "string" ? body.code : "";

  let r;
  try {
    r = await env.VAULT.redeem(code, projectId, request.headers.get("CF-Connecting-IP") || undefined);
  } catch {
    return json({ error: "auth_unavailable" }, 503);
  }
  if (!r) return json({ error: "invalid_code" }, 400);
  if ("limited" in r) return json({ error: "rate_limited" }, 429, { "Retry-After": "60" });
  return json({ key: r.key });
}

/**
 * Тело ответа GET /api/me. Поля фиксированы, клиент auth-core.js рассчитывает именно на них.
 * user_id: строка с userId из auth-kit (в таблицах приложения user_id текстовый).
 * Для ключа имперсонации user_id/name/role это человек, под которым зашли; impersonatedBy: {userId, name} админа-владельца.
 */
export function meResponse(who) {
  return json({
    user_id: String(who.userId),
    name: who.name,
    role: who.role,
    readonly: !!who.readonly,
    impersonate: !!who.impersonate,
    impersonatedBy: who.impersonatedBy || null,
  });
}
