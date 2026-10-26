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
    let state = { phase: "starting", me: null, readonly: false, lock: { message: "", kind: "", checking: false, canRetry: false }, bar: null, card: null };
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
    const lockState = (message, kind, checking) => ({ message: message || "", kind: message ? kind : "", checking: !!checking, canRetry: !!getKey() });
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

    /* ---- действия ---- */
    function loggedIn(me) {
      applyMe(me);
      setState({ phase: "ready", lock: { message: "", kind: "", checking: false, canRetry: false } });
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
        return state.phase === "ready" ? { ok: true } : { ok: false, error: state.lock.message };
      }
      const p = await probe(k);
      if (!p.ok) {
        const error = lockProblem(p.status);
        setState({ lock: lockState(error, "error", false) });
        return { ok: false, error };
      }
      setKey(k);
      loggedIn(p.me);
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
      getKey,
      texts: TEXTS,
    };
  }

  root.authKitCore = { create, texts: TEXTS, normalizeCode, scanCode, looksLikeKey: (t) => KEY_SHAPE.test(t) };
})(globalThis);
