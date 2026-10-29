// Безголовое ядро клиента auth-kit (образец: gym-hero). Копируйте файл в приложение БЕЗ ИЗМЕНЕНИЙ, в том числе тексты.
// Спецификация: INTEGRATION.md. Без зависимостей, сборки и DOM: ядро хранит ключи, проверяет их, ходит в API и отдаёт
// ГОТОВОЕ состояние экранов (тексты уже подставлены). Нарисовать это можно в любом дизайне и на любой платформе;
// стандартный вид на DOM лежит рядом: client/auth-ui.js.
//
//   const auth = authKitCore.create({ storagePrefix: "gh" });     // ключи в localStorage: gh_key, gh_accounts
//   auth.subscribe((s) => render(s));                             // s.phase, s.lock, s.bar, s.card, s.readonly, s.me
//   auth.onToast((text) => showToast(text));
//   auth.onReady((me) => startApp(me));
//   auth.start();
//   const rows = await auth.api("/sets");                         // JSON-ответ; ошибки и тосты обработаны
//
// Окружение: fetch, localStorage (необязателен) и location.reload (в браузере). Ссылок входа нет: ключ вводится вручную.
(function (root) {
  "use strict";

  /* TEXTS:BEGIN */
  const TEXTS = {
    lockSub: "Вход по ключу доступа",
    keyOrCodePlaceholder: "API-ключ или код входа",
    signIn: "Войти",
    enterKey: "Введи ключ",
    checking: "Проверяю…",
    keyInvalid: "Неверный ключ",
    tooManyAttempts: "Слишком много попыток, подожди минуту",
    unavailable: "Сервис входа недоступен, попробуй позже",
    lockOffline: "Нет связи с сервером. Проверь интернет и попробуй ещё раз.",
    lockKeyGone: "Сохранённый ключ больше не действует (отозван, удалён или отключён). Введи новый ключ или обратись к администратору.",
    retry: "Попробовать ещё раз",
    toastOffline: "Нет связи с сервером",
    toastTooMany: "Слишком часто, подожди",
    toastReadonly: "Только чтение",
    toastServerError: "Ошибка сервера",
    toastKeyGone: "Ключ больше не действует, перехожу в «{name}»",
    whoSignedIn: "Вы вошли как",
    logout: "Выйти",
    logoutConfirmOthers: "Выйти из «{name}»? Ключ будет забыт на этом устройстве, вы перейдёте в другой сохранённый.",
    logoutConfirmLast: "Выйти? Ключ будет забыт на этом устройстве.",
    asReadonly: "👁 Смотрите как {name} ({role}) · только чтение",
    asWrite: "✏️ Работаете как {name} ({role}) · правки идут от его имени",
    barReadonly: "👁 Вы смотрите как {name} (ключ: {by}) · только чтение",
    barWrite: "✏️ Вы вошли как {name} (ключ: {by}) · правки идут от его имени",
    barOther: "Вы вошли как {name} ({role}) · ключ другого человека",
    back: "Вернуться",
    accReadonly: "ключ: {by} · только чтение",
    accWrite: "ключ: {by} · правки от его имени",
    accOwn: "ваш ключ",
    accOther: "ключ другого человека",
    accNow: "✓ сейчас",
    accSwitch: "Войти",
    accForget: "Забыть ключ на этом устройстве",
    accForgetConfirm: "Забыть ключ «{name}» на этом устройстве? Ключ показывается в админке один раз, вернуть его нельзя.",
    addKey: "＋ Добавить ключ другого человека",
    addTitle: "Добавить ключ другого человека",
    addHint: "Ключ сохранится на этом устройстве рядом с вашим. Переключаться между ними можно в настройках.",
    addGo: "Добавить и войти",
    keyOrCodeEmpty: "Вставьте ключ или код входа",
    addSame: "Этот ключ уже активен",
    addInvalid: "Ключ не подошёл",
    addTooMany: "Слишком много попыток, подожди минуту",
    addUnavailable: "Сервис входа недоступен",
    scanButton: "Сканировать QR",
    scanTitle: "Наведи камеру на QR-код",
    scanHint: "Код показывает администратор. Он одноразовый и действует недолго.",
    scanManual: "Ввести код вручную",
    scanClose: "Закрыть",
    scanDenied: "Нет доступа к камере. Разреши камеру в настройках или введи код вручную.",
    scanNoCamera: "Камера недоступна. Введи код вручную.",
    scanNoCode: "QR-код входа не найден. Наведи камеру на код из админки.",
    codeInvalid: "Код не подошёл, истёк или уже использован. Попроси администратора выдать новый.",
    sessionBlocked: "Браузер не сохранил вход. Разрешите cookie для этого сайта",
    passkeyOfferTitle: "Входить без ключа?",
    passkeyOfferText: "Создай пасскей: в следующий раз вход по отпечатку, лицу или коду экрана, без ввода ключа.",
    passkeyCreate: "Создать пасскей",
    passkeyLater: "Не сейчас",
    passkeyNever: "Больше не предлагать",
    passkeyLogin: "Войти с пасскеем",
    passkeyCreated: "Пасскей создан. Теперь можно входить без ключа.",
    passkeyFailed: "Не удалось создать или проверить пасскей. Попробуй ещё раз или войди ключом.",
    passkeyUnknown: "Пасскей не подошёл. Войди ключом или кодом.",
    passkeyLimit: "Достигнут предел пасскеев (5). Удали ненужный в настройках.",
    passkeyListTitle: "Пасскеи",
    passkeyNone: "Пасскеев нет.",
    passkeyRemove: "Удалить",
    passkeyRemoveConfirm: "Удалить пасскей? Вход им перестанет работать.",
    passkeyRemoved: "Пасскей удалён.",
    passkeyMetaCreated: "создан {date}",
    passkeyMetaUsed: "вход {date}",
    passkeyDeviceIos: "iPhone или iPad",
    passkeyDeviceAndroid: "Android",
    passkeyDeviceDesktop: "Компьютер",
  };
  /* TEXTS:END */

  const T = TEXTS;
  const fill = (tpl, v) => tpl.replace(/\{(\w+)\}/g, (_, k) => v[k]);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Код входа: 12 символов без I, L, O, 0, 1; показывается как XXXX-XXXX-XXXX, в QR лежит akc:XXXX-XXXX-XXXX (INTEGRATION.md §10.2).
  const CODE_SHAPE = /^[A-HJKMNP-Z2-9]{12}$/;
  const KEY_SHAPE = /^[a-z0-9]{1,8}_[A-Za-z0-9_-]{32}$/;
  /** Приводит ввод к виду из 12 символов или null: любой регистр, пробелы и дефисы не важны, префикс akc: отбрасывается. */
  function normalizeCode(raw) {
    if (typeof raw !== "string" || raw.length > 40) return null;
    const c = raw.trim().replace(/^akc:/i, "").replace(/[\s-]+/g, "").toUpperCase();
    return CODE_SHAPE.test(c) ? c : null;
  }
  /** Код из текста, прочитанного сканером: только с префиксом akc: (посторонние QR игнорируются). */
  const scanCode = (text) => (typeof text === "string" && /^\s*akc:/i.test(text) ? normalizeCode(text) : null);
  /** Что ввели в поле: код (и тогда он нормализован) или null. Строка вида ключа кодом не считается. */
  const codeFromInput = (text) => (KEY_SHAPE.test(text) ? null : normalizeCode(text));

  function create(options = {}) {
    // Неопределённые опции игнорируются: значения по умолчанию остаются.
    const given = Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined));
    const cfg = { storagePrefix: "app", apiBase: "/api", reload: () => root.location.reload(), ...given };
    if (!/^\w+$/.test(cfg.storagePrefix)) throw new Error("authKit: storagePrefix must be [A-Za-z0-9_]+");

    /* ---- хранилище ---- */
    const mem = {}; // запасной вариант, если localStorage недоступен
    const KEY_LS = cfg.storagePrefix + "_key";
    const ACC_LS = cfg.storagePrefix + "_accounts";
    const lsGet = (k) => { try { const v = root.localStorage.getItem(k); return v == null ? (mem[k] ?? null) : v; } catch { return mem[k] ?? null; } };
    const lsSet = (k, v) => { mem[k] = v; try { root.localStorage.setItem(k, v); } catch {} };
    const lsDel = (k) => { delete mem[k]; try { root.localStorage.removeItem(k); } catch {} };
    const getKey = () => lsGet(KEY_LS) || "";
    const setKey = (k) => lsSet(KEY_LS, k);
    const clearKey = () => lsDel(KEY_LS);

    // Все ключи, которыми пользовались на этом устройстве: {key,userId,name,role,readonly,impersonatedBy}. Активный лежит в <prefix>_key.
    function getAccounts() {
      try { const a = JSON.parse(lsGet(ACC_LS) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
    }
    const setAccounts = (a) => lsSet(ACC_LS, JSON.stringify(a));
    function rememberAccount(key, me) {
      if (!key || !me) return;
      const a = getAccounts().filter((x) => x.key !== key);
      a.push({ key, userId: +me.user_id, name: me.name, role: me.role, readonly: !!me.readonly, impersonatedBy: me.impersonatedBy || null });
      setAccounts(a);
    }
    const forgetAccount = (key) => setAccounts(getAccounts().filter((x) => x.key !== key));
    // Куда переключиться, когда активный ключ ушёл: сначала собственный ключ админа, затем любой обычный, затем любой.
    const pickAccount = () => {
      const a = getAccounts();
      return a.find((x) => x.role === "admin" && !x.impersonatedBy) || a.find((x) => !x.impersonatedBy) || a[0] || null;
    };
    const ownAdmin = () => getAccounts().find((a) => a.role === "admin" && !a.impersonatedBy) || null;
    function switchTo(key) { setKey(key); cfg.reload(); }

    /* ---- состояние ---- */
    let ME = null; // кто вошёл: ответ /api/me
    let RETURNING = false; // идёт автопереключение при отказе ключа: экран ввода не показывать
    let state = { phase: "starting", me: null, readonly: false, lock: { message: "", kind: "", checking: false, canRetry: false, passkey: { show: false, primary: false, label: T.passkeyLogin } }, bar: null, card: null, offer: null };
    const subs = new Set(), toastSubs = new Set(), readySubs = new Set();
    const emit = (set, v) => set.forEach((f) => { try { f(v); } catch (e) { if (root.console) console.error(e); } });
    function setState(patch) { state = { ...state, ...patch }; emit(subs, state); }
    const toast = (text) => emit(toastSubs, text);

    // Готовая к показу модель плашки и карточки: тексты уже подставлены, приложению остаётся их нарисовать.
    function present(me) {
      if (!me || !me.name) return { bar: null, card: null };
      const by = me.impersonatedBy || null, ro = !!me.readonly;
      const admin = ownAdmin(), cur = getKey();
      // Куда «Вернуться»: к собственному ключу владельца (при имперсонации) или к ключу админа этого устройства.
      const back = by
        ? getAccounts().find((a) => a.userId === by.userId && !a.impersonatedBy) || null
        : admin && admin.key !== cur ? admin : null;

      let bar = null;
      if (by || back) {
        const text = by ? fill(ro ? T.barReadonly : T.barWrite, { name: me.name, by: by.name }) : fill(T.barOther, { name: me.name, role: me.role });
        // tone "warn": запись от чужого имени подсвечивается
        bar = { text, tone: by && !ro ? "warn" : "info", backKey: back ? back.key : null, backLabel: T.back };
      }

      const list = getAccounts();
      const sorted = [...list].sort((a, b) => (a.impersonatedBy ? 1 : 0) - (b.impersonatedBy ? 1 : 0));
      const accounts = list.length < 2 ? [] : sorted.map((a) => ({
        key: a.key,
        title: `${a.name} (${a.role})`,
        sub: a.impersonatedBy
          ? fill(a.readonly ? T.accReadonly : T.accWrite, { by: a.impersonatedBy.name })
          : admin && a.key === admin.key ? T.accOwn : T.accOther,
        active: a.key === cur,
        stateLabel: a.key === cur ? T.accNow : T.accSwitch,
        canForget: a.key !== cur,
      }));

      const card = {
        label: T.whoSignedIn,
        // При ключе имперсонации «кто я» это владелец ключа, а «под кем» отдельной строкой.
        name: by ? by.name : me.name,
        roleText: by ? "(admin)" : me.role ? `(${me.role})` : "",
        as: by ? { text: fill(ro ? T.asReadonly : T.asWrite, { name: me.name, role: me.role }), tone: ro ? "info" : "warn" } : null,
        accounts,
        canAddKey: !!admin, // добавлять чужие ключи может тот, у кого на устройстве есть собственный ключ админа
        logoutLabel: T.logout,
        addKeyLabel: T.addKey,
        // Пасскеи только у человека со своим обычным ключом (INTEGRATION.md §11.4); список приходит из listPasskeys()
        passkeys: !by && !ro && webauthnSupported() ? { title: T.passkeyListTitle, createLabel: T.passkeyCreate, noneText: T.passkeyNone } : null,
      };
      return { bar, card };
    }

    function applyMe(me) {
      ME = me || null;
      if (me && me.name) rememberAccount(getKey(), me);
      setState({ me: ME, readonly: !!(me && me.readonly), ...present(me) });
    }
    const refresh = () => { if (ME) setState({ ...present(ME) }); };

    // Состояние экрана ввода. kind: "error" (сообщение об ошибке), "info" (идёт проверка), "" (сообщения нет).
    // canRetry: на устройстве есть сохранённый ключ, значит можно показать «Попробовать ещё раз».
    // passkey: кнопка «Войти с пасскеем»; primary: на этом устройстве пасскей уже создавали, кнопка главная (§11.3)
    const lockState = (message, kind, checking) => ({
      message: message || "", kind: message ? kind : "", checking: !!checking, canRetry: !!getKey(),
      passkey: { show: webauthnSupported(), primary: !!pkStore().made, label: T.passkeyLogin },
    });
    function showLock(message) {
      setState({ phase: "locked", lock: lockState(message, "error", false) });
    }
    // Причина неудачной проверки ключа по статусу ответа (0 = нет связи).
    const lockProblem = (status) =>
      status === 401 ? T.keyInvalid : status === 429 ? T.tooManyAttempts : status === 0 ? T.lockOffline : T.unavailable;

    // Ключ ТОЧНО больше не работает (ответ 401: нет, удалён, отозван, человек отключён): забываем его и стираем из хранилища.
    // Есть другой сохранённый ключ: переходим на него с тостом. Иначе экран ввода с текстом, что произошло.
    function keyGone(key) {
      forgetAccount(key);
      if (getKey() === key) clearKey();
      const next = pickAccount();
      if (next) {
        RETURNING = true;
        setKey(next.key);
        toast(fill(T.toastKeyGone, { name: next.name }));
        setTimeout(() => cfg.reload(), 700);
        return;
      }
      showLock(T.lockKeyGone);
    }

    /* ---- запросы ---- */
    // Проверка ключа без побочных эффектов (сохранённый ключ не трогаем).
    async function probe(key) {
      try {
        const res = await root.fetch(cfg.apiBase + "/me", { headers: { Authorization: "Bearer " + key }, cache: "no-store" });
        return { ok: res.ok, status: res.status, me: res.ok ? await res.json() : null };
      } catch {
        return { ok: false, status: 0, me: null };
      }
    }

    // Все запросы к API приложения идут только сюда. Возвращает разобранный JSON (или null) либо бросает
    // Error('unauthorized' | 'readonly' | 'rate_limited' | ...); тост при этом уже отправлен подписчикам onToast.
    // opts.silent = true: фоновый запрос, тосты про сеть, 429 и сбои сервера не показываются (ошибка всё равно бросается).
    // Отказ ключа (401) и режим «только чтение» обрабатываются всегда.
    async function api(path, options = {}) {
      const { silent, ...opts } = options;
      const say = (text) => { if (!silent) toast(text); };
      const method = (opts.method || "GET").toUpperCase();
      if (ME && ME.readonly && method !== "GET" && method !== "HEAD") { toast(T.toastReadonly); throw new Error("readonly"); }
      let res;
      try {
        res = await root.fetch(cfg.apiBase + path, {
          ...opts,
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + getKey(), ...(opts.headers || {}) },
        });
      } catch (e) { say(T.toastOffline); throw e; }

      if (res.status === 401) {
        if (RETURNING) throw new Error("unauthorized"); // параллельные запросы: переключение уже идёт
        keyGone(getKey());
        throw new Error("unauthorized");
      }
      if (res.status === 403) {
        const t = await res.clone().json().catch(() => ({}));
        if (t.error === "readonly") { toast(T.toastReadonly); throw new Error("readonly"); }
      }
      if (res.status === 429) { say(T.toastTooMany); throw new Error("rate_limited"); }
      if (!res.ok) {
        const t = await res.text().catch(() => "");
        say(T.toastServerError);
        throw new Error("API " + res.status + " " + t);
      }
      const txt = await res.text();
      return txt ? JSON.parse(txt) : null;
    }

    // Погашение одноразового кода: POST <apiBase>/claim {code} -> {key}. Ключ создаётся при погашении и виден один раз.
    // Возвращает { ok: true, key } или { ok: false, error } с готовым текстом. Ключ не сохраняет: это делает вызывающий.
    async function claim(raw) {
      const code = normalizeCode(raw);
      if (!code) return { ok: false, error: T.codeInvalid };
      let res;
      try {
        res = await root.fetch(cfg.apiBase + "/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
          cache: "no-store",
        });
      } catch { return { ok: false, error: T.lockOffline }; }
      if (res.status === 400) return { ok: false, error: T.codeInvalid };
      if (res.status === 429) return { ok: false, error: T.tooManyAttempts };
      if (!res.ok) return { ok: false, error: T.unavailable };
      const body = await res.json().catch(() => null);
      if (!body || typeof body.key !== "string" || !body.key) return { ok: false, error: T.unavailable };
      return { ok: true, key: body.key };
    }

    /* ---- пасскеи (INTEGRATION.md §11) ---- */
    // Пасскей это ещё один способ получить обычный ключ: дальше всё как при вводе ключа. Закрытое системное окно не ошибка и ничего не показывает.
    const PK_LS = cfg.storagePrefix + "_pk"; // { made: true, later: время, never: true }
    const PK_LATER_MS = 30 * 24 * 3600 * 1000;
    const pkStore = () => { try { const v = JSON.parse(lsGet(PK_LS) || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
    const pkSave = (patch) => lsSet(PK_LS, JSON.stringify({ ...pkStore(), ...patch }));
    const nav = () => root.navigator;
    // WebAuthn есть, страница на HTTPS и не во фрейме
    function webauthnSupported() {
      const n = nav();
      return !!(root.PublicKeyCredential && n && n.credentials && n.credentials.create && n.credentials.get
        && root.isSecureContext !== false && (!root.top || root.top === root.self));
    }
    // Есть ли смысл предлагать создать пасскей: поддержка плюс платформенный аутентификатор с проверкой владельца
    async function passkeyAvailable() {
      if (!webauthnSupported()) return false;
      try { return !!(await root.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); } catch { return false; }
    }
    const b64uToBuf = (s) => {
      const p = String(s).replace(/-/g, "+").replace(/_/g, "/");
      const bin = root.atob(p + "=".repeat((4 - (p.length % 4)) % 4));
      const out = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out.buffer;
    };
    const bufToB64u = (buf) => {
      let s = "";
      for (const x of new Uint8Array(buf)) s += String.fromCharCode(x);
      return root.btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
    // Короткое имя устройства: только один из трёх текстов (§11.5)
    function deviceName() {
      const n = nav() || {}, ua = n.userAgent || "";
      if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && n.maxTouchPoints > 1)) return T.passkeyDeviceIos;
      return /Android/.test(ua) ? T.passkeyDeviceAndroid : T.passkeyDeviceDesktop;
    }
    async function pkCall(path, { method = "POST", body, auth } = {}) {
      let res;
      try {
        res = await root.fetch(cfg.apiBase + "/passkey" + path, {
          method, cache: "no-store",
          headers: { "Content-Type": "application/json", ...(auth ? { Authorization: "Bearer " + getKey() } : {}) },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
      } catch { return { status: 0, json: null }; }
      return { status: res.status, json: await res.json().catch(() => null) };
    }
    const pkProblem = (r) =>
      r.status === 0 ? T.lockOffline : r.status === 429 ? T.tooManyAttempts
        : r.json && r.json.error === "passkey_limit" ? T.passkeyLimit : r.status >= 500 ? T.unavailable : T.passkeyFailed;
    const pkCancelled = (e) => !!e && (e.name === "NotAllowedError" || e.name === "AbortError");

    // Создать пасскей (нужен вход своим ключом). Возвращает { ok: true } или { ok: false, error }: error это готовый текст или null (человек закрыл окно).
    async function createPasskey() {
      if (!webauthnSupported()) return { ok: false, error: T.passkeyFailed };
      const b = await pkCall("/register/begin", { body: {}, auth: true });
      const o = b.status === 200 && b.json ? b.json.options : null;
      if (!o) return { ok: false, error: pkProblem(b) };
      let cred;
      try {
        cred = await nav().credentials.create({
          publicKey: {
            ...o, challenge: b64uToBuf(o.challenge), user: { ...o.user, id: b64uToBuf(o.user.id) },
            excludeCredentials: (o.excludeCredentials || []).map((c) => ({ ...c, id: b64uToBuf(c.id) })),
          },
        });
      } catch (e) { return { ok: false, error: pkCancelled(e) ? null : T.passkeyFailed }; }
      if (!cred) return { ok: false, error: null };
      const r = cred.response;
      const f = await pkCall("/register/finish", {
        auth: true,
        body: {
          name: deviceName(),
          credential: {
            id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
            response: { clientDataJSON: bufToB64u(r.clientDataJSON), attestationObject: bufToB64u(r.attestationObject) },
            transports: typeof r.getTransports === "function" ? r.getTransports() : [],
          },
        },
      });
      if (f.status !== 200) return { ok: false, error: pkProblem(f) };
      pkSave({ made: true });
      setState({ offer: null });
      toast(T.passkeyCreated);
      return { ok: true };
    }

    // Вход по пасскею (экран ввода): подтверждение владельца -> обычный ключ -> проверка и вход, как при вводе ключа.
    async function loginWithPasskey() {
      const lockError = (error) => { if (error) setState({ lock: lockState(error, "error", false) }); return { ok: false, error }; };
      if (!webauthnSupported()) return lockError(T.passkeyFailed);
      const b = await pkCall("/login/begin", { body: {} });
      const o = b.status === 200 && b.json ? b.json.options : null;
      if (!o) return lockError(pkProblem(b));
      let cred;
      try {
        cred = await nav().credentials.get({
          publicKey: { ...o, challenge: b64uToBuf(o.challenge), allowCredentials: (o.allowCredentials || []).map((c) => ({ ...c, id: b64uToBuf(c.id) })) },
        });
      } catch (e) { return lockError(pkCancelled(e) ? null : T.passkeyFailed); }
      if (!cred) return lockError(null);
      setState({ lock: lockState(T.checking, "info", true) });
      const r = cred.response;
      const f = await pkCall("/login/finish", {
        body: {
          credential: {
            id: cred.id, rawId: bufToB64u(cred.rawId), type: cred.type,
            response: {
              clientDataJSON: bufToB64u(r.clientDataJSON), authenticatorData: bufToB64u(r.authenticatorData), signature: bufToB64u(r.signature),
              userHandle: r.userHandle ? bufToB64u(r.userHandle) : undefined,
            },
          },
        },
      });
      const key = f.status === 200 && f.json && typeof f.json.key === "string" ? f.json.key : "";
      if (!key) return lockError(f.status === 400 ? T.passkeyUnknown : pkProblem(f));
      pkSave({ made: true });
      setKey(key); // как при коде: ключ виден один раз, сохраняем до проверки, чтобы «Попробовать ещё раз» проверил его
      await checkStored();
      return state.phase === "ready" ? { ok: true } : { ok: false, error: state.lock.message };
    }

    // Список своих пасскеев для карточки в настройках: готовые строки (имя, «создан …· вход …»)
    async function listPasskeys() {
      const r = await pkCall("", { method: "GET", auth: true });
      if (r.status !== 200 || !Array.isArray(r.json)) return { ok: false, error: pkProblem(r) };
      const date = (ms) => new Date(ms).toLocaleDateString("ru-RU");
      return {
        ok: true,
        canCreate: r.json.length < 5,
        items: r.json.map((p) => ({
          id: p.id,
          name: p.name || "",
          sub: [fill(T.passkeyMetaCreated, { date: date(p.created_at) }), p.last_used_at ? fill(T.passkeyMetaUsed, { date: date(p.last_used_at) }) : ""].filter(Boolean).join(" · "),
          removeLabel: T.passkeyRemove,
        })),
      };
    }
    // «Удалить» пасскей: { text, perform } как у logoutRequest; perform() -> { ok } | { ok: false, error }
    function removePasskeyRequest(id) {
      return {
        text: T.passkeyRemoveConfirm,
        async perform() {
          const r = await pkCall("/" + encodeURIComponent(id), { method: "DELETE", auth: true });
          if (r.status !== 200) return { ok: false, error: pkProblem(r) };
          toast(T.passkeyRemoved);
          return { ok: true };
        },
      };
    }

    // Предложение создать пасскей: после входа, который человек сделал сам (ключ, код, QR), не при запуске с сохранённым ключом (§11.2)
    async function maybeOffer(me) {
      if (!me || me.impersonate || me.readonly) return;
      const pk = pkStore();
      if (pk.never || pk.made || (pk.later && Date.now() - pk.later < PK_LATER_MS)) return;
      if (!(await passkeyAvailable()) || state.phase !== "ready") return;
      setState({ offer: { title: T.passkeyOfferTitle, text: T.passkeyOfferText, createLabel: T.passkeyCreate, laterLabel: T.passkeyLater, neverLabel: T.passkeyNever } });
    }
    const passkeyOfferCreate = () => createPasskey(); // успех сам убирает предложение; при ошибке оно остаётся
    const passkeyOfferLater = () => { pkSave({ later: Date.now() }); setState({ offer: null }); };
    const passkeyOfferNever = () => { pkSave({ never: true }); setState({ offer: null }); };

    /* ---- действия ---- */
    function loggedIn(me) {
      applyMe(me);
      setState({ phase: "ready", lock: { ...lockState("", "", false), canRetry: false } });
      emit(readySubs, me);
    }

    // Экран ввода ключа: кнопка «Войти». Введённый ключ сохраняется только после успешной проверки.
    async function submitKey(raw) {
      const k = String(raw || "").trim();
      if (!k) { setState({ lock: lockState(T.enterKey, "error", false) }); return { ok: false, error: T.enterKey }; }
      setState({ lock: lockState(T.checking, "info", true) });
      const code = codeFromInput(k);
      if (code) {
        // Код входа: меняем его на ключ. Ключ показывается один раз, поэтому сохраняем его сразу, до проверки:
        // при сбое сети он остаётся на устройстве, и «Попробовать ещё раз» проверит его, а не потеряет.
        const c = await claim(code);
        if (!c.ok) { setState({ lock: lockState(c.error, "error", false) }); return c; }
        setKey(c.key);
        await checkStored();
        if (state.phase === "ready") { maybeOffer(ME); return { ok: true }; }
        return { ok: false, error: state.lock.message };
      }
      const p = await probe(k);
      if (!p.ok) {
        const error = lockProblem(p.status);
        setState({ lock: lockState(error, "error", false) });
        return { ok: false, error };
      }
      setKey(k);
      loggedIn(p.me);
      maybeOffer(p.me);
      return { ok: true };
    }

    // Лист «Добавить ключ другого человека»: принимает ключ или код входа (вставка из буфера или сканер). При успехе сохраняет ключ и перезагружает приложение.
    async function addKey(raw) {
      const text = String(raw || "").trim();
      const code = codeFromInput(text);
      let key;
      if (code) {
        const c = await claim(code);
        if (!c.ok) return c;
        key = c.key;
      } else {
        const m = /^([\w-]+)$/.exec(text);
        if (!m) return { ok: false, error: T.keyOrCodeEmpty };
        key = m[1];
        if (key === getKey()) return { ok: false, error: T.addSame };
      }
      let r = await probe(key);
      // Ключ из кода одноразовый: если проверку споткнула сеть, повторяем, иначе он пропадёт вместе с потраченным кодом.
      for (let i = 1; code && !r.ok && r.status !== 401 && i <= 2; i++) { await sleep(600 * i); r = await probe(key); }
      if (!r.ok) return { ok: false, error: r.status === 401 ? T.addInvalid : r.status === 429 ? T.addTooMany : T.addUnavailable };
      rememberAccount(key, r.me);
      switchTo(key); // свой ключ остаётся в списке на этом устройстве
      return { ok: true };
    }

    // «Выйти» забывает только текущий ключ и переключает на другой сохранённый; экран ввода виден, лишь когда ключей не осталось.
    // Возвращает { text, perform }: приложение показывает text в своём окне подтверждения и вызывает perform() при согласии.
    function logoutRequest() {
      const cur = getKey();
      const others = getAccounts().filter((x) => x.key !== cur);
      const text = others.length ? fill(T.logoutConfirmOthers, { name: ME ? ME.name : "аккаунта" }) : T.logoutConfirmLast;
      return {
        text,
        perform() {
          forgetAccount(cur);
          const pick = pickAccount();
          if (pick) setKey(pick.key); else clearKey();
          cfg.reload();
        },
      };
    }

    // «Забыть ключ на этом устройстве» для строки списка. Возвращает { text, perform } как logoutRequest.
    function forgetRequest(key) {
      const a = getAccounts().find((x) => x.key === key);
      return {
        text: fill(T.accForgetConfirm, { name: a ? a.name : "" }),
        perform() { forgetAccount(key); refresh(); },
      };
    }

    // Показать сообщение на экране ввода (например, текст, сохранённый перед перезагрузкой страницы). Только когда экран ввода уже показан.
    function notice(text) {
      if (state.phase === "locked" && text) setState({ lock: lockState(String(text), "error", false) });
    }

    // Проверка сохранённого ключа (при запуске и по «Попробовать ещё раз»). Исходы:
    //  - ключ подошёл: вход;
    //  - 401 (ключ точно не работает): ключ стирается, экран ввода, вверху текст lockKeyGone (или переход на другой сохранённый ключ);
    //  - любая другая неудача (нет сети, 429, 5xx): ключ НЕ стирается, экран ввода, вверху причина, доступна кнопка «Попробовать ещё раз».
    async function checkStored() {
      const key = getKey();
      if (!key) { showLock(""); return; }
      const p = await probe(key);
      if (p.ok) { loggedIn(p.me); return; }
      if (p.status === 401) { keyGone(key); return; }
      showLock(lockProblem(p.status));
    }
    async function start() { await checkStored(); }
    // Кнопка «Попробовать ещё раз»: тот же разбор, что при запуске.
    async function retry() {
      if (!getKey()) { showLock(""); return; }
      setState({ phase: "locked", lock: lockState(T.checking, "info", true) });
      await checkStored();
    }

    const on = (set) => (fn) => { set.add(fn); return () => set.delete(fn); };
    return {
      get state() { return state; },
      subscribe: (fn) => { subs.add(fn); fn(state); return () => subs.delete(fn); },
      onToast: on(toastSubs),
      onReady: on(readySubs),
      start, retry, notice, submitKey, addKey, claim, api, switchTo, logoutRequest, forgetRequest,
      passkeySupported: webauthnSupported, passkeyAvailable, createPasskey, loginWithPasskey, listPasskeys, removePasskeyRequest,
      passkeyOfferCreate, passkeyOfferLater, passkeyOfferNever,
      getKey,
      texts: TEXTS,
    };
  }

  root.authKitCore = { create, texts: TEXTS, normalizeCode, scanCode, looksLikeKey: (t) => KEY_SHAPE.test(t) };
})(globalThis);
