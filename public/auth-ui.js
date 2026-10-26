// Стандартный вид клиента auth-kit на DOM (образец: gym-hero), поверх ядра client/auth-core.js.
// Копируйте оба файла в приложение БЕЗ ИЗМЕНЕНИЙ: сначала auth-core.js, затем auth-ui.js. Спецификация: INTEGRATION.md.
// Если нужен свой дизайн, этот файл не подключают: ядро отдаёт готовое состояние экранов (см. «Экраны: контракт»).
//
//   <script src="auth-core.js"></script>
//   <script src="auth-ui.js"></script>
//   authKit.init({
//     logo: { text: "Gym", accent: "Hero", suffix: " 💪" },   // логотип на экране ввода ключа
//     storagePrefix: "gh",                                     // ключи в localStorage: gh_key, gh_accounts
//     whoMount: "#authKitWho",                                 // куда в «Настройках» поставить карточку «Вы вошли как…»
//     barMount: ".app",                                        // куда поставить верхнюю плашку (по умолчанию body)
//     onReady(me) { /* me = { user_id, name, role, readonly, impersonate, impersonatedBy } */ },
//     decoderSrc: "jsqr.js",                                   // необязательно: адрес декодера QR (по умолчанию рядом с этим файлом)
//   });
//   const rows = await authKit.api("/sets");                   // JSON-ответ, ошибки и тосты уже обработаны
//
// Сканер QR: кнопка «Сканировать QR» на экране ввода и в листе «Добавить ключ другого человека». Нативный BarcodeDetector, если он есть,
// иначе декодер client/jsqr.js (грузится лениво при первом открытии сканера). Копируйте jsqr.js рядом с этим файлом.
// Оформление берётся из переменных темы приложения: --bg --card --card2 --line --txt --dim --accent --accent2 --danger
// (значения по умолчанию совпадают с gym-hero). Нужен CSP style-src 'unsafe-inline'.
(function (root) {
  "use strict";
  if (!root.authKitCore) throw new Error("authKit: подключите client/auth-core.js перед auth-ui.js");
  const T = root.authKitCore.texts;
  const SCRIPT_BASE = ((document.currentScript && document.currentScript.src) || "").replace(/[^/?#]*([?#].*)?$/, ""); // каталог этого файла

  const CSS = `
.ak-lock{position:fixed;inset:0;z-index:200;background:var(--bg,#0f1115);color:var(--txt,#e8ebf0);display:flex;align-items:center;justify-content:center;padding:24px;font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.ak-lock[hidden],.ak-lock-msg[hidden],.ak-retry[hidden],.ak-who[hidden],.ak-as[hidden],.ak-acc-list[hidden],.ak-switch[hidden],.ak-bar[hidden],.ak-bar button[hidden]{display:none!important}
.ak-lock-msg{position:absolute;top:calc(env(safe-area-inset-top,0px) + 16px);left:16px;right:16px;max-width:520px;margin:0 auto;padding:12px 14px;border-radius:12px;font-size:14px;text-align:center;background:rgba(255,107,107,.12);border:1px solid var(--danger,#ff6b6b);color:var(--txt,#e8ebf0)}
.ak-lock-msg.info{background:var(--card2,#20242e);border-color:var(--line,#2a2f3a);color:var(--dim,#8b93a3)}
.ak-retry{width:100%;margin-top:10px;padding:14px;border-radius:14px;border:1px solid var(--line,#2a2f3a);background:var(--card2,#20242e);color:var(--txt,#e8ebf0);font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.ak-lock button:disabled{opacity:.6;cursor:default}
.ak-field{--h:54px;display:flex;gap:8px;align-items:center}
.ak-sheet .ak-field{--h:50px}
.ak-field input{flex:1 1 auto;width:auto;min-width:0;height:var(--h);box-sizing:border-box}
.ak-scan{flex:0 0 var(--h);width:var(--h);height:var(--h);box-sizing:border-box;padding:0;display:flex;align-items:center;justify-content:center;border-radius:14px;border:1px solid var(--line,#2a2f3a);background:var(--card2,#20242e);color:var(--accent,#5b9dff);cursor:pointer}
.ak-sheet .ak-scan{border-radius:12px}
.ak-scan:active{background:var(--card,#181b22)}
.ak-scan svg{width:26px;height:26px;display:block}
.ak-scan-view{position:fixed;inset:0;z-index:400;background:#000;color:#fff;font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.ak-scan-view video{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.ak-scan-frame{position:absolute;left:50%;top:50%;width:min(70vw,320px);aspect-ratio:1;transform:translate(-50%,-50%);border:3px solid rgba(255,255,255,.9);border-radius:18px;box-shadow:0 0 0 100vmax rgba(0,0,0,.45)}
.ak-scan-title{position:absolute;left:0;right:0;top:calc(env(safe-area-inset-top,0px) + 76px);padding:0 16px;text-align:center;font-weight:700;font-size:18px;text-shadow:0 1px 4px rgba(0,0,0,.8)}
.ak-scan-hint{position:absolute;left:0;right:0;bottom:calc(env(safe-area-inset-bottom,0px) + 92px);padding:0 24px;text-align:center;font-size:14px;text-shadow:0 1px 4px rgba(0,0,0,.8)}
.ak-scan-actions{position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 20px);display:flex;gap:10px}
.ak-scan-actions button{flex:1;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.4);background:rgba(0,0,0,.55);color:#fff;font-weight:700;font-size:15px;cursor:pointer;font-family:inherit}
.ak-lock-card{width:100%;max-width:360px;display:flex;flex-direction:column}
.ak-logo{font-size:26px;font-weight:800;text-align:center}
.ak-logo span{color:var(--accent,#5b9dff)}
.ak-lock-sub{text-align:center;color:var(--dim,#8b93a3);font-size:14px;margin:6px 0 22px}
.ak-lock input,.ak-sheet input{width:100%;box-sizing:border-box;background:var(--card2,#20242e);border:1px solid var(--line,#2a2f3a);border-radius:14px;padding:15px;font-size:16px;color:var(--txt,#e8ebf0);font-family:inherit}
.ak-sheet input{border-radius:12px;padding:13px}
.ak-err{color:var(--danger,#ff6b6b);font-size:13px;text-align:center;min-height:18px;margin-top:10px}
.ak-save{width:100%;margin-top:18px;background:var(--accent,#5b9dff);color:#07142b;font-weight:800;font-size:16px;padding:16px;border-radius:14px;border:none;cursor:pointer;font-family:inherit}
.ak-save:active{background:var(--accent2,#3d7be0)}
.ak-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:9px 16px;background:rgba(110,168,254,.14);border-bottom:1px solid var(--accent,#5b9dff);font-size:13px;color:var(--txt,#e8ebf0);position:sticky;top:0;z-index:30;padding-top:calc(env(safe-area-inset-top,0px) + 9px)}
.ak-bar.warn{background:rgba(255,170,60,.16);border-bottom-color:#ffaa3c}
.ak-bar.warn button{color:#ffaa3c}
.ak-bar button{color:var(--accent,#5b9dff);font-weight:800;font-size:13px;padding:4px 2px;white-space:nowrap;background:none;border:none;cursor:pointer;font-family:inherit}
.ak-who{display:flex;flex-direction:column;gap:10px;padding:12px 14px;margin-bottom:6px;background:var(--card2,#20242e);border:1px solid var(--line,#2a2f3a);border-radius:14px;font-size:14px;color:var(--dim,#8b93a3)}
.ak-who b{color:var(--txt,#e8ebf0)}
.ak-who-top{display:flex;align-items:center;justify-content:space-between;gap:12px}
.ak-who-top button{color:var(--accent,#5b9dff);font-weight:700;font-size:14px;padding:4px 2px;background:none;border:none;cursor:pointer;font-family:inherit}
.ak-as{padding:8px 10px;border-radius:10px;background:rgba(110,168,254,.14);color:var(--txt,#e8ebf0);font-size:13px}
.ak-as.warn{background:rgba(255,170,60,.16)}
.ak-switch{width:100%;padding:10px;border:1px dashed var(--accent,#5b9dff);border-radius:10px;color:var(--accent,#5b9dff);font-weight:700;font-size:14px;text-align:center;background:none;cursor:pointer;font-family:inherit}
.ak-acc-list{display:flex;flex-direction:column;gap:6px}
.ak-acc{display:flex;align-items:stretch;gap:6px}
.ak-acc-main{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;padding:9px 12px;border:1px solid var(--line,#2a2f3a);border-radius:10px;background:var(--card,#181b22);color:inherit;cursor:pointer;font-family:inherit}
.ak-acc.on .ak-acc-main{border-color:var(--accent,#5b9dff);background:rgba(110,168,254,.12)}
.ak-acc-main>span:first-child{display:flex;flex-direction:column;min-width:0}
.ak-acc-name{color:var(--txt,#e8ebf0);font-weight:700;font-size:14px}
.ak-acc-sub{color:var(--dim,#8b93a3);font-size:12px;margin-top:1px}
.ak-acc-state{color:var(--accent,#5b9dff);font-weight:700;font-size:13px;white-space:nowrap}
.ak-acc-x{width:38px;border:1px solid var(--line,#2a2f3a);border-radius:10px;color:var(--dim,#8b93a3);font-size:14px;background:none;cursor:pointer}
.ak-sheet-bg{position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:70;opacity:0;pointer-events:none;transition:opacity .2s}
.ak-sheet-bg.open{opacity:1;pointer-events:auto}
.ak-sheet{position:fixed;left:0;right:0;bottom:0;z-index:71;max-width:520px;margin:0 auto;background:var(--card,#181b22);color:var(--txt,#e8ebf0);border-radius:22px 22px 0 0;border-top:1px solid var(--line,#2a2f3a);padding:8px 16px calc(20px + env(safe-area-inset-bottom,0px));transform:translateY(110%);transition:transform .26s cubic-bezier(.22,1,.36,1);max-height:90vh;overflow:auto;font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
.ak-sheet.open{transform:none}
.ak-grab{width:40px;height:4px;background:var(--line,#2a2f3a);border-radius:4px;margin:8px auto 14px}
.ak-sheet h3{margin:0 0 6px;font-size:16px}
.ak-hint{font-size:12px;color:var(--dim,#8b93a3);margin:0 0 14px}
.ak-toast{position:fixed;left:50%;transform:translateX(-50%) translateY(20px);bottom:calc(150px + env(safe-area-inset-bottom,0px));background:var(--card2,#20242e);color:var(--txt,#e8ebf0);border:1px solid var(--line,#2a2f3a);border-radius:12px;padding:10px 16px;z-index:300;opacity:0;transition:.2s;font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;pointer-events:none;box-shadow:0 8px 24px rgba(0,0,0,.4)}
.ak-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
`;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text; // имена людей всегда как текст, не как HTML
    return e;
  }
  const core = root.authKitCore;
  // Иконка QR-кода: три угловых маркера и несколько модулей данных. Цвет берётся от кнопки (currentColor).
  function qrIcon() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const path = document.createElementNS(ns, "path");
    path.setAttribute("fill", "currentColor");
    path.setAttribute("fill-rule", "evenodd");
    // три маркера (рамка 6x6 с точкой 2x2 внутри) и четыре модуля данных справа внизу
    path.setAttribute("d", [
      "M3 3h7v7H3zM5 5v3h3V5z", "M14 3h7v7h-7zM16 5v3h3V5z", "M3 14h7v7H3zM5 16v3h3v-3z",
      "M14 14h3v3h-3z", "M18 14h3v2h-3z", "M14 18h2v3h-2z", "M18 18h3v3h-3z",
    ].join(""));
    svg.append(path);
    return svg;
  }
  /** Квадратная кнопка с иконкой QR; текст scanButton только как доступное имя и подсказка (INTEGRATION.md §5.2). */
  function scanButton(onClick) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "ak-scan";
    b.setAttribute("aria-label", T.scanButton);
    b.title = T.scanButton;
    b.append(qrIcon());
    b.onclick = onClick;
    return b;
  }
  const fieldRow = (input, button) => { const r = el("div", "ak-field"); r.append(input, button); return r; };
  const resolve = (x) => (typeof x === "string" ? document.querySelector(x) : x) || null;

  function init(options = {}) {
    const logoCfg = { text: "", accent: "", suffix: "", ...(options.logo || {}) };
    const auth = root.authKitCore.create({ storagePrefix: options.storagePrefix, apiBase: options.apiBase });
    const ui = {};
    let prevPhase = null;
    let toastTimer = null;

    const style = el("style");
    style.id = "authkit-style";
    style.textContent = CSS;
    document.head.append(style);

    /* ---- сканер QR (INTEGRATION.md §10.3) ---- */
    let decoderPromise = null;
    // Декодер для браузеров без BarcodeDetector (Safari на iOS): подгружается один раз при первом открытии сканера.
    const loadDecoder = () => {
      if (root.jsQR) return Promise.resolve(root.jsQR);
      if (!decoderPromise) {
        decoderPromise = new Promise((resolve, reject) => {
          const sc = document.createElement("script");
          sc.src = options.decoderSrc || SCRIPT_BASE + "jsqr.js";
          sc.onload = () => (root.jsQR ? resolve(root.jsQR) : reject(new Error("jsQR missing")));
          sc.onerror = () => reject(new Error("decoder load failed"));
          document.head.append(sc);
        });
        decoderPromise.catch(() => { decoderPromise = null; }); // можно попробовать ещё раз при следующем открытии
      }
      return decoderPromise;
    };
    // Функция «кадр -> текст QR или null»: нативный BarcodeDetector или jsQR по кадру, уменьшенному до 640 пикселей.
    async function makeReader(video) {
      if (root.BarcodeDetector) {
        try {
          if ((await root.BarcodeDetector.getSupportedFormats()).includes("qr_code")) {
            const det = new root.BarcodeDetector({ formats: ["qr_code"] });
            return async () => { const r = await det.detect(video); return r[0] ? r[0].rawValue : null; };
          }
        } catch {}
      }
      const decode = await loadDecoder();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      return async () => {
        const w = video.videoWidth, h = video.videoHeight;
        if (!w || !h) return null;
        const k = Math.min(1, 640 / w);
        canvas.width = Math.round(w * k);
        canvas.height = Math.round(h * k);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const r = decode(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
        return r ? r.data : null;
      };
    }
    // Окно сканера. onCode(code) вызывается один раз с нормализованным кодом, после чего камера уже выключена.
    function openScanner({ onCode, refocus }) {
      const view = el("div", "ak-scan-view");
      view.setAttribute("role", "dialog");
      view.setAttribute("aria-modal", "true");
      view.setAttribute("aria-label", T.scanTitle);
      const video = el("video");
      video.setAttribute("playsinline", "");
      video.muted = true;
      video.autoplay = true;
      const msg = el("div", "ak-lock-msg");
      msg.hidden = true;
      msg.setAttribute("role", "alert");
      const manual = el("button", null, T.scanManual);
      manual.type = "button";
      const close = el("button", null, T.scanClose);
      close.type = "button";
      const actions = el("div", "ak-scan-actions");
      actions.append(manual, close);
      view.append(video, el("div", "ak-scan-frame"), msg, el("div", "ak-scan-title", T.scanTitle), el("div", "ak-scan-hint", T.scanHint), actions);
      document.body.append(view);

      let stream = null, stopped = false, timer = null, noCodeTimer = null;
      const say = (text) => { msg.textContent = text; msg.hidden = !text; };
      const releaseCamera = () => { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } video.srcObject = null; };
      const onVisibility = () => { if (document.hidden) stop(); };
      const onKey = (e) => { if (e.key === "Escape") stop(); };
      function stop() {
        if (stopped) return;
        stopped = true;
        clearTimeout(timer);
        clearTimeout(noCodeTimer);
        releaseCamera();
        document.removeEventListener("visibilitychange", onVisibility);
        document.removeEventListener("keydown", onKey);
        root.removeEventListener("pagehide", stop);
        view.remove();
      }
      document.addEventListener("visibilitychange", onVisibility);
      document.addEventListener("keydown", onKey);
      root.addEventListener("pagehide", stop);
      close.onclick = stop;
      manual.onclick = () => { stop(); if (refocus) refocus(); };

      (async () => {
        const md = root.navigator && root.navigator.mediaDevices;
        if (!md || !md.getUserMedia) { say(T.scanNoCamera); return; }
        try {
          stream = await md.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        } catch (e) {
          say(/NotAllowed|Permission|Security/i.test(String((e && e.name) || "")) ? T.scanDenied : T.scanNoCamera);
          return;
        }
        if (stopped) { releaseCamera(); return; }
        video.srcObject = stream;
        try { await video.play(); } catch {}
        let read;
        try { read = await makeReader(video); } catch { releaseCamera(); say(T.scanNoCamera); return; }
        if (stopped) return;
        noCodeTimer = setTimeout(() => say(T.scanNoCode), 20000); // за 20 секунд ничего подходящего: подсказка, сканирование продолжается
        const tick = async () => {
          if (stopped) return;
          let code = null;
          try { code = core.scanCode(await read()); } catch {}
          if (stopped) return;
          if (code) { stop(); onCode(code); return; } // посторонний QR молча пропускается
          timer = setTimeout(tick, 150);
        };
        tick();
      })();
    }

    /* ---- разметка (структура и атрибуты описаны в INTEGRATION.md, «Экраны: контракт») ---- */
    ui.toast = el("div", "ak-toast");
    ui.toast.setAttribute("role", "status");

    // экран ввода ключа
    ui.lock = el("div", "ak-lock");
    ui.lock.hidden = true;
    const card = el("div", "ak-lock-card");
    const logo = el("div", "ak-logo", logoCfg.text);
    logo.append(el("span", null, logoCfg.accent), logoCfg.suffix || "");
    ui.lockInput = el("input");
    ui.lockInput.type = "password";
    ui.lockInput.placeholder = T.keyOrCodePlaceholder;
    ui.lockInput.autocomplete = "off";
    ui.lockInput.autocapitalize = "off";
    ui.lockInput.spellcheck = false;
    ui.lockInput.setAttribute("inputmode", "text");
    const submit = () => auth.submitKey(ui.lockInput.value);
    ui.lockInput.addEventListener("keydown", (e) => { if (e.key === "Enter") submit(); });
    ui.lockBtn = el("button", "ak-save", T.signIn);
    ui.lockBtn.onclick = submit;
    // «Попробовать ещё раз»: только когда на устройстве есть сохранённый ключ; повторяет его проверку
    ui.retryBtn = el("button", "ak-retry", T.retry);
    ui.retryBtn.type = "button";
    ui.retryBtn.hidden = true;
    ui.retryBtn.onclick = () => auth.retry();
    // сообщение о том, что произошло, закреплено вверху экрана
    ui.lockMsg = el("div", "ak-lock-msg");
    ui.lockMsg.hidden = true;
    ui.lockMsg.setAttribute("role", "alert");
    ui.scanBtn = scanButton(() => openScanner({ onCode: (code) => auth.submitKey(code), refocus: () => ui.lockInput.focus() }));
    card.append(logo, el("div", "ak-lock-sub", T.lockSub), fieldRow(ui.lockInput, ui.scanBtn), ui.lockBtn, ui.retryBtn);
    ui.lock.append(ui.lockMsg, card);

    // верхняя плашка «смотрю как…»
    ui.bar = el("div", "ak-bar");
    ui.bar.hidden = true;
    ui.barText = el("span");
    ui.backBtn = el("button", null, T.back);
    ui.backBtn.type = "button";
    ui.backBtn.onclick = () => { const k = ui.backBtn.dataset.key; if (k) auth.switchTo(k); };
    ui.bar.append(ui.barText, ui.backBtn);
    (resolve(options.barMount) || document.body).prepend(ui.bar);
    const syncBarHeight = () => requestAnimationFrame(() => {
      document.documentElement.style.setProperty("--bar-h", (!ui.bar.hidden ? ui.bar.offsetHeight : 0) + "px");
    });
    root.addEventListener("resize", syncBarHeight);

    // лист «Добавить ключ другого человека»
    ui.sheetBg = el("div", "ak-sheet-bg");
    ui.sheet = el("div", "ak-sheet");
    const openSheet = () => { ui.sheetBg.classList.add("open"); ui.sheet.classList.add("open"); };
    const closeSheet = () => { ui.sheetBg.classList.remove("open"); ui.sheet.classList.remove("open"); };
    ui.sheetBg.onclick = closeSheet;
    ui.addInput = el("input");
    ui.addInput.type = "password";
    ui.addInput.autocomplete = "off";
    ui.addInput.autocapitalize = "off";
    ui.addInput.spellcheck = false;
    ui.addInput.placeholder = T.keyOrCodePlaceholder;
    ui.addErr = el("div", "ak-err");
    const addSubmit = async () => {
      ui.addErr.textContent = T.checking;
      const r = await auth.addKey(ui.addInput.value);
      if (!r.ok) ui.addErr.textContent = r.error;
    };
    ui.addInput.addEventListener("keydown", (e) => { if (e.key === "Enter") addSubmit(); });
    const go = el("button", "ak-save", T.addGo);
    go.onclick = addSubmit;
    ui.sheetScan = scanButton(() => openScanner({
      onCode: async (code) => {
        ui.addErr.textContent = T.checking;
        const r = await auth.addKey(code);
        if (!r.ok) ui.addErr.textContent = r.error;
      },
      refocus: () => ui.addInput.focus(),
    }));
    ui.sheet.append(el("div", "ak-grab"), el("h3", null, T.addTitle), el("p", "ak-hint", T.addHint), fieldRow(ui.addInput, ui.sheetScan), ui.addErr, go);

    // карточка «Вы вошли как…» в настройках приложения
    const whoHost = resolve(options.whoMount);
    if (whoHost) {
      ui.who = el("div", "ak-who");
      ui.who.hidden = true;
      const top = el("div", "ak-who-top");
      const label = el("span");
      ui.whoLabel = document.createTextNode("");
      ui.whoName = el("b");
      ui.whoRole = el("span");
      label.append(ui.whoLabel, ui.whoName, " ", ui.whoRole);
      ui.logoutBtn = el("button", null, T.logout);
      ui.logoutBtn.type = "button";
      ui.logoutBtn.onclick = () => { const q = auth.logoutRequest(); if (confirm(q.text)) q.perform(); };
      top.append(label, ui.logoutBtn);
      ui.as = el("div", "ak-as");
      ui.as.hidden = true;
      ui.accList = el("div", "ak-acc-list");
      ui.accList.hidden = true;
      ui.switchBtn = el("button", "ak-switch", T.addKey);
      ui.switchBtn.type = "button";
      ui.switchBtn.hidden = true;
      ui.switchBtn.onclick = () => {
        ui.addInput.value = "";
        ui.addErr.textContent = "";
        openSheet();
        setTimeout(() => { try { ui.addInput.focus(); } catch {} }, 80);
      };
      ui.who.append(top, ui.as, ui.accList, ui.switchBtn);
      whoHost.replaceChildren(ui.who);
    }
    document.body.append(ui.lock, ui.sheetBg, ui.sheet, ui.toast);

    /* ---- отрисовка состояния ядра ---- */
    function renderAccounts(accounts) {
      if (!accounts.length) { ui.accList.hidden = true; ui.accList.replaceChildren(); return; }
      ui.accList.replaceChildren(...accounts.map((a) => {
        const row = el("div", "ak-acc" + (a.active ? " on" : ""));
        const main = el("button", "ak-acc-main");
        main.type = "button";
        const left = el("span");
        left.append(el("span", "ak-acc-name", a.title), el("span", "ak-acc-sub", a.sub));
        main.append(left, el("span", "ak-acc-state", a.stateLabel));
        if (!a.active) main.onclick = () => auth.switchTo(a.key);
        row.append(main);
        if (a.canForget) {
          const x = el("button", "ak-acc-x", "✕");
          x.type = "button";
          x.title = T.accForget;
          x.onclick = () => { const q = auth.forgetRequest(a.key); if (confirm(q.text)) q.perform(); };
          row.append(x);
        }
        return row;
      }));
      ui.accList.hidden = false;
    }

    function render(s) {
      // экран ввода
      const locked = s.phase === "locked";
      ui.lock.hidden = !locked;
      ui.lockMsg.textContent = s.lock.message;
      ui.lockMsg.hidden = !s.lock.message;
      ui.lockMsg.classList.toggle("info", s.lock.kind === "info");
      ui.retryBtn.hidden = !s.lock.canRetry;
      ui.retryBtn.disabled = ui.lockBtn.disabled = s.lock.checking;
      if (locked && prevPhase !== "locked") {
        ui.lockInput.value = "";
        setTimeout(() => { try { ui.lockInput.focus(); } catch {} }, 60);
      }
      prevPhase = s.phase;

      // режим «только чтение»: приложение скрывает кнопки правки по body.ro
      document.body.classList.toggle("ro", s.readonly);

      // верхняя плашка
      const bar = s.bar;
      if (bar) {
        ui.barText.textContent = bar.text;
        ui.backBtn.hidden = !bar.backKey;
        ui.backBtn.dataset.key = bar.backKey || "";
        ui.bar.classList.toggle("warn", bar.tone === "warn");
        ui.bar.hidden = false;
      } else { ui.bar.hidden = true; ui.backBtn.dataset.key = ""; }
      document.body.classList.toggle("has-bar", !!bar); // шапка приложения смещается: top:var(--bar-h,0px)
      syncBarHeight();

      // карточка в настройках
      if (ui.who) {
        const c = s.card;
        if (!c) { ui.who.hidden = true; return; }
        ui.whoLabel.nodeValue = c.label + " ";
        ui.whoName.textContent = c.name;
        ui.whoRole.textContent = c.roleText;
        if (c.as) {
          ui.as.textContent = c.as.text;
          ui.as.classList.toggle("warn", c.as.tone === "warn");
          ui.as.hidden = false;
        } else ui.as.hidden = true;
        ui.switchBtn.hidden = !c.canAddKey;
        renderAccounts(c.accounts);
        ui.who.hidden = false;
      }
    }

    const showToast = (text) => {
      ui.toast.textContent = text;
      ui.toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 1800);
    };
    auth.onToast(showToast);
    if (options.onReady) auth.onReady(options.onReady);
    auth.subscribe(render);

    root.authKit = {
      init,
      core: auth,
      api: auth.api,
      toast: showToast,
      getKey: auth.getKey,
      logout: () => { const q = auth.logoutRequest(); if (confirm(q.text)) q.perform(); },
      get me() { return auth.state.me; },
      texts: T,
    };
    return auth.start();
  }

  root.authKit = { init, texts: T };
})(window);
