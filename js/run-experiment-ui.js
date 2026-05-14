/**
 * 【实验界面与流程控制】赵钰涛
 *
 * 串联欢迎页 → 指导语 → 练习 → 正式试次 → 注意检查 → 结束；键盘记录 RT；材料核对页与数据页刷新逻辑亦在此。
 * 依赖前述各 window.SJL_* 模块；本文件不写试次算法、不写持久化细节，只负责交互与状态机。
 */
(function () {
  const S = window.SJL_STORAGE;
  const ST = window.SJL_STATS;
  const R = window.SJL_REMOTE;

  const $ = (id) => document.getElementById(id);
  const screens = {
    welcome: $("screen-welcome"),
    instruct: $("screen-instruct"),
    practice: $("screen-practice"),
    run: $("screen-run"),
    attention: $("screen-attention"),
    end: $("screen-end"),
    review: $("screen-review"),
    data: $("screen-data"),
  };

  let session = null;
  let mergedList = [];
  let practiceList = [];
  let practiceIdx = 0;
  let practiceRound = 0;
  let mainIdx = 0;
  let formalCompleted = 0;
  let stimStartT = 0;
  let timeoutId = null;
  let keyHandler = null;
  let lastMergedSessions = [];

  function imgUrl(fileBase) {
    /* 相对 index.html 所在目录；本地与 GitHub Pages（仓库根部署）均无需 BASE_PATH */
    return `stimuli/${encodeURIComponent(fileBase)}${C.IMAGE_EXT}`;
  }

  function showScreen(name) {
    Object.values(screens).forEach((el) => el && el.classList.add("hidden"));
    screens[name] && screens[name].classList.remove("hidden");
  }

  function setTabsActive(activeId) {
    ["btn-tab-exp", "btn-tab-review", "btn-tab-data"].forEach((id) => {
      $(id).classList.toggle("active", id === activeId);
    });
  }

  /** 练习 + 正式中出现的所有图片基名（不含填充试次图片） */
  function collectStimuliMeta() {
    const map = new Map();
    function bump(file, word, isBig, label) {
      if (!map.has(file)) {
        map.set(file, { file, lines: [] });
      }
      map.get(file).lines.push({ word, isBig, label });
    }
    C.PRACTICE_PAIRS.forEach((p, i) => {
      bump(p.bigFile, p.big, true, `练习词对 ${i + 1}`);
      bump(p.smallFile, p.small, false, `练习词对 ${i + 1}`);
    });
    C.PAIRS.forEach((p) => {
      bump(p.bigFile, p.big, true, `正式 #${p.id}`);
      bump(p.smallFile, p.small, false, `正式 #${p.id}`);
    });
    return [...map.values()].sort((a, b) => a.file.localeCompare(b.file, "zh-Hans-CN"));
  }

  function buildReviewSizeRules() {
    const el = $("review-size-rules");
    if (!el) return;
    const rowsImg = [
      ["图画 · 一致", C.IMG_BIG_CON_PCT, C.IMG_SMALL_CON_PCT],
      ["图画 · 不一致", C.IMG_BIG_INC_PCT, C.IMG_SMALL_INC_PCT],
    ];
    const rowsTxt = [
      ["文字 · 一致", C.TXT_BIG_PT, C.TXT_SMALL_PT],
      ["文字 · 不一致", C.TXT_BIG_INC_PT, C.TXT_SMALL_INC_PT],
    ];
    const table = (title, rows, unit) => `
      <div class="review-mini-cap">${title}</div>
      <table class="review-table">
        <thead><tr><th>条件</th><th>真实更大一侧</th><th>真实更小一侧</th></tr></thead>
        <tbody>
          ${rows
            .map(
              ([lab, bigV, smallV]) =>
                `<tr><td>${lab}</td><td><strong>${bigV}${unit}</strong></td><td><strong>${smallV}${unit}</strong></td></tr>`
            )
            .join("")}
        </tbody>
      </table>`;
    el.innerHTML =
      `<p class="review-logic">「一致」：画面上更大的一侧对应真实世界里更大的物体；「不一致」：屏幕上的大小和真实大小反着来。参数见下表。</p>` +
      table("图画条件（相对高度，%）", rowsImg, "%") +
      table("文字条件（字号参数）", rowsTxt, " pt");
  }

  function buildReviewPairTables() {
    const el = $("review-pair-tables");
    if (!el) return;
    const rowP = (p, i, isFormal) => {
      const id = isFormal ? String(p.id) : `练习 ${i + 1}`;
      return `<tr>
        <td>${id}</td>
        <td>${p.big} <span class="pair-tag">大</span></td>
        <td>${p.small} <span class="pair-tag">小</span></td>
        <td><code>${p.bigFile}${C.IMAGE_EXT}</code></td>
        <td><code>${p.smallFile}${C.IMAGE_EXT}</code></td>
      </tr>`;
    };
    el.innerHTML = `
      <h4 class="review-h4">练习（仅图画一致 / 不一致）</h4>
      <table class="review-table review-table-pairs">
        <thead><tr><th>序号</th><th>真实更大（词）</th><th>真实更小（词）</th><th>大图文件</th><th>小图文件</th></tr></thead>
        <tbody>${C.PRACTICE_PAIRS.map((p, i) => rowP(p, i, false)).join("")}</tbody>
      </table>
      <h4 class="review-h4">正式词对</h4>
      <table class="review-table review-table-pairs">
        <thead><tr><th>id</th><th>真实更大（词）</th><th>真实更小（词）</th><th>大图文件</th><th>小图文件</th></tr></thead>
        <tbody>${C.PAIRS.map((p, i) => rowP(p, i, true)).join("")}</tbody>
      </table>`;
  }

  function escHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildReviewStimuliGrid() {
    const grid = $("review-stimuli-grid");
    if (!grid) return;
    const items = collectStimuliMeta();
    grid.innerHTML = items
      .map((item, idx) => {
        const lines = item.lines
          .map((L) => `${L.label} · <strong>${L.isBig ? "大侧" : "小侧"}</strong>「${escHtml(L.word)}」`)
          .join("<br/>");
        const fn = escHtml(item.file);
        return `<div class="review-card" data-file="${fn}">
          <div class="review-card-top">
            <div class="review-thumb-wrap" id="rev-thumb-${idx}">
              <img class="review-thumb" alt="" src="${imgUrl(item.file)}" loading="lazy" />
            </div>
            <div class="review-card-meta">
              <div class="review-card-name">${fn}</div>
              <div class="review-card-file"><code>${fn}${escHtml(C.IMAGE_EXT)}</code></div>
              <div class="review-card-refs">${lines}</div>
            </div>
          </div>
        </div>`;
      })
      .join("");

    grid.querySelectorAll(".review-thumb").forEach((im) => {
      const wrap = im.closest(".review-thumb-wrap");
      im.onload = () => {
        wrap.classList.add("thumb-ok");
        wrap.classList.remove("thumb-bad");
        im.style.display = "";
        wrap.querySelectorAll(".thumb-miss").forEach((n) => n.remove());
      };
      im.onerror = () => {
        wrap.classList.add("thumb-bad");
        wrap.classList.remove("thumb-ok");
        im.style.display = "none";
        if (!wrap.querySelector(".thumb-miss")) {
          const d = document.createElement("div");
          d.className = "thumb-miss";
          d.textContent = "未加载";
          wrap.appendChild(d);
        }
      };
    });
  }

  function buildReviewPanel() {
    buildReviewSizeRules();
    buildReviewPairTables();
    buildReviewStimuliGrid();
  }

  function newSubjectId() {
    return `S_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function collectImageUrls(trials) {
    const set = new Set();
    for (const tr of trials) {
      if (tr.mode === "image") {
        set.add(imgUrl(tr.leftFile));
        set.add(imgUrl(tr.rightFile));
      }
    }
    return [...set];
  }

  function preloadImages(urls, done) {
    let n = urls.length;
    if (!n) return done(0, 0);
    let ok = 0;
    const tick = () => {
      n--;
      $("preload-status").textContent = `材料加载中：${urls.length - n}/${urls.length}`;
      if (n <= 0) done(ok, urls.length - ok);
    };
    urls.forEach((url) => {
      const im = new Image();
      im.onload = () => {
        ok++;
        tick();
      };
      im.onerror = tick;
      im.src = url;
    });
  }

  function clearTimers() {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  }

  function removeKeyHandler() {
    if (keyHandler) {
      window.removeEventListener("keydown", keyHandler, true);
      keyHandler = null;
    }
  }

  function renderImageCell(cell, fileBase, pct, altWord) {
    cell.innerHTML = "";
    cell.classList.remove("has-image");
    const wrap = document.createElement("div");
    wrap.style.width = "100%";
    wrap.style.height = "100%";
    wrap.style.display = "flex";
    wrap.style.alignItems = "center";
    wrap.style.justifyContent = "center";

    const hRef = Math.min(window.innerHeight * 0.52, 560);
    const im = document.createElement("img");
    im.alt = "";
    im.decoding = "async";
    im.src = imgUrl(fileBase);
    im.style.maxHeight = `${(pct / 100) * hRef}px`;
    im.style.maxWidth = "100%";
    im.onload = () => cell.classList.add("has-image");
    im.onerror = () => {
      im.remove();
      const ph = document.createElement("div");
      ph.className = "placeholder-inner";
      ph.title = "";
      ph.innerHTML = '<div class="hint">图片未能显示</div>';
      wrap.appendChild(ph);
    };
    wrap.appendChild(im);
    cell.appendChild(wrap);
  }

  function renderStimulus(tr, leftCell, rightCell) {
    if (tr.mode === "image") {
      renderImageCell(leftCell, tr.leftFile, tr.leftPct, tr.leftWord);
      renderImageCell(rightCell, tr.rightFile, tr.rightPct, tr.rightWord);
    } else {
      leftCell.innerHTML = "";
      rightCell.innerHTML = "";
      leftCell.classList.add("has-image");
      rightCell.classList.add("has-image");
      const lt = document.createElement("div");
      lt.className = "text-stim";
      lt.textContent = tr.leftWord;
      lt.style.fontSize = `clamp(20px, ${tr.leftPct * 0.065}vw, ${tr.leftPct}px)`;
      leftCell.appendChild(lt);
      const rt = document.createElement("div");
      rt.className = "text-stim";
      rt.textContent = tr.rightWord;
      rt.style.fontSize = `clamp(20px, ${tr.rightPct * 0.065}vw, ${tr.rightPct}px)`;
      rightCell.appendChild(rt);
    }
  }

  function waitKeys(keys, cb) {
    removeKeyHandler();
    keyHandler = (e) => {
      if (keys.includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        cb(e.key);
      }
    };
    window.addEventListener("keydown", keyHandler, true);
  }

  function runTrial(tr, fixEl, stimEl, leftCell, rightCell, progEl, onDone) {
    fixEl.classList.remove("hidden");
    stimEl.classList.add("hidden");
    const lab =
      tr.phase === "filler"
        ? "填充"
        : tr.phase === "practice"
          ? "练习"
          : "正式";
    progEl.innerHTML =
      `${lab} · 进度 <b>${tr.sequenceIndex}</b>/100 <span class="pill">${tr.conditionLabel || ""}</span>`;

    setTimeout(() => {
      fixEl.classList.add("hidden");
      stimEl.classList.remove("hidden");
      renderStimulus(tr, leftCell, rightCell);

      clearTimers();
      stimStartT = performance.now();

      const finish = (side) => {
        clearTimers();
        removeKeyHandler();
        const rt = Math.round(performance.now() - stimStartT);
        const ok =
          (side === "ArrowLeft" && tr.leftIsBig) || (side === "ArrowRight" && !tr.leftIsBig);
        onDone({ response: side, rtMs: rt, correct: ok, timedOut: false });
      };

      waitKeys(["ArrowLeft", "ArrowRight"], finish);

      timeoutId = setTimeout(() => {
        removeKeyHandler();
        onDone({
          response: "timeout",
          rtMs: Math.round(performance.now() - stimStartT),
          correct: false,
          timedOut: true,
        });
      }, C.TIMEOUT_MS);
    }, C.FIX_MS);
  }

  function beginSession() {
    const sessionSeed = (Math.floor(Math.random() * 0xffffffff) ^ Date.now()) >>> 0;
    const subjectId = newSubjectId();
    const subIdx =
      Math.abs([...((sessionSeed >>> 0).toString(16))].reduce((a, c) => a + c.charCodeAt(0), 0)) % 4;

    const built = T.buildFormalTrials(sessionSeed, subIdx);
    const formal80 = built.trials;
    const filler20 = T.buildFillerTrials(sessionSeed);
    mergedList = T.mergeFormalWithFillers(formal80, filler20);
    practiceList = T.buildPracticeTrials(sessionSeed);
    practiceIdx = 0;
    practiceRound = 0;
    mainIdx = 0;
    formalCompleted = 0;

    session = {
      meta: {
        sessionId: crypto.randomUUID ? crypto.randomUUID() : `sess_${Date.now()}`,
        subjectId,
        sessionSeed,
        subjectIndexForLatin: subIdx,
        createdAt: new Date().toISOString(),
        userAgent: navigator.userAgent,
        innerW: window.innerWidth,
        innerH: window.innerHeight,
        design: { ...built, fillerAfterEvery: 4 },
      },
      practice: { trials: [] },
      main: { trialLog: [] },
      attention: [],
    };

    const urls = collectImageUrls([...formal80, ...practiceList]);
    $("preload-status").textContent = "正在加载实验材料…";
    preloadImages(urls, (loadedOk, failed) => {
      $("img-load-hint").textContent =
        failed > 0
          ? `有 ${failed} 项材料未能加载，对应位置将显示为空白。可在「材料核对」中查看。`
          : "材料已全部就绪。";
      showScreen("instruct");
    });
  }

  function runPracticeLoop() {
    showScreen("practice");
    if (practiceIdx >= practiceList.length) {
      const acc =
        session.practice.trials.filter((x) => x.correct).length /
        Math.max(1, session.practice.trials.length);
      $("practice-summary").innerHTML = `练习正确率：<b>${(acc * 100).toFixed(1)}%</b>（≥${(C.PRACTICE_MIN_ACC * 100).toFixed(0)}% 可进正式）`;
      $("practice-feedback").classList.remove("hidden");
      const ok = acc >= C.PRACTICE_MIN_ACC;
      const maxed = practiceRound >= C.PRACTICE_MAX_TRIES - 1;
      $("btn-practice-enter").classList.toggle("hidden", !ok && !maxed);
      $("btn-practice-next").classList.toggle("hidden", ok || maxed);
      return;
    }
    const tr = { ...practiceList[practiceIdx], sequenceIndex: practiceIdx + 1 };
    $("practice-feedback").classList.add("hidden");
    runTrial(
      tr,
      $("pr-fix"),
      $("pr-stim"),
      $("pr-left"),
      $("pr-right"),
      $("practice-progress"),
      (res) => {
        session.practice.trials.push({
          ...tr,
          rtMs: res.rtMs,
          correct: res.correct,
          response: res.response,
          timedOut: res.timedOut,
          timestampEnd: new Date().toISOString(),
        });
        practiceIdx += 1;
        setTimeout(runPracticeLoop, C.ITI_MS);
      }
    );
  }

  function runAttentionThen(next) {
    showScreen("attention");
    const t0 = performance.now();
    waitKeys(["ArrowLeft", "ArrowRight"], (key) => {
      removeKeyHandler();
      const rt = Math.round(performance.now() - t0);
      session.attention.push({
        afterFormalCount: formalCompleted,
        afterSequenceIndex: mainIdx + 1,
        rtMs: rt,
        correct: key === "ArrowLeft",
        response: key,
        timestampEnd: new Date().toISOString(),
      });
      setTimeout(next, C.ITI_MS);
    });
  }

  function runMainLoop() {
    showScreen("run");
    if (mainIdx >= mergedList.length) {
      void finishSession();
      return;
    }
    const tr = { ...mergedList[mainIdx] };
    runTrial(
      tr,
      $("run-fix"),
      $("run-stim"),
      $("run-left"),
      $("run-right"),
      $("run-progress"),
      (res) => {
        session.main.trialLog.push({
          ...tr,
          rtMs: res.rtMs,
          correct: res.correct,
          response: res.response,
          timedOut: res.timedOut,
          timestampEnd: new Date().toISOString(),
        });
        const wasFormal = tr.phase === "formal";
        if (wasFormal) formalCompleted += 1;
        const needAtt = wasFormal && (formalCompleted === 30 || formalCompleted === 60);
        mainIdx += 1;
        if (needAtt) {
          setTimeout(() => runAttentionThen(() => setTimeout(runMainLoop, C.ITI_MS)), C.ITI_MS);
        } else {
          setTimeout(runMainLoop, C.ITI_MS);
        }
      }
    );
  }

  async function finishSession() {
    let cloudOk = false;
    if (R && R.isRemoteConfigured()) {
      try {
        await R.pushSession(session);
        cloudOk = true;
      } catch (e) {
        console.warn("upload", e);
      }
    }
    if (!cloudOk) S.appendSession(session);

    const agg = ST.aggregateFormal(session);
    $("end-stats").innerHTML = ["pic_con", "pic_inc", "txt_con", "txt_inc"]
      .map((k) => {
        const x = agg.byCondition[k];
        return `<div class="stat-box"><b>${x.label}</b><br/>n=${x.n} · 正确率 ${(x.accuracy * 100).toFixed(1)}% · RT均值 ${x.meanRt != null ? Math.round(x.meanRt) : "—"} ms · 中位数 ${x.medianRt != null ? Math.round(x.medianRt) : "—"}</div>`;
      })
      .join("");
    let meta = `被试编号 ${session.meta.subjectId} · 会话 ${session.meta.sessionId}`;
    if (R && R.isRemoteConfigured()) {
      meta += cloudOk ? " · 数据已写入数据库" : " · 写入数据库失败，已保存于本机";
    }
    $("end-meta").textContent = meta;
    showScreen("end");
  }

  async function getMergedSessions() {
    let remote = [];
    let remoteError = null;
    if (R && R.isRemoteConfigured()) {
      try {
        remote = await R.fetchSessions();
      } catch (e) {
        remoteError = e;
        console.warn("fetch", e);
      }
    }
    const local = S.loadAll();
    const byId = new Map();
    for (const s of remote) {
      if (s && s.meta && s.meta.sessionId) byId.set(s.meta.sessionId, s);
    }
    for (const s of local) {
      if (s && s.meta && s.meta.sessionId && !byId.has(s.meta.sessionId)) {
        byId.set(s.meta.sessionId, s);
      }
    }
    const all = [...byId.values()].sort(
      (a, b) => new Date(b.meta.createdAt).getTime() - new Date(a.meta.createdAt).getTime()
    );
    return { all, remoteError, remoteCount: remote.length };
  }

  async function refreshData() {
    const dash = $("data-dashboard");
    const tbl = $("data-sessions-table");
    if (dash) dash.innerHTML = '<p class="dash-empty">加载中…</p>';
    if (tbl) tbl.innerHTML = "";

    const banner = $("data-cloud-banner");
    if (R && R.isRemoteConfigured()) {
      if (banner) {
        banner.classList.remove("hidden");
        banner.textContent = "正在同步远端数据…";
        banner.className = "data-cloud-banner data-cloud-banner--info";
      }
    } else if (banner) {
      banner.classList.add("hidden");
      banner.textContent = "";
    }

    const { all, remoteError, remoteCount } = await getMergedSessions();
    lastMergedSessions = all;

    if (banner && R && R.isRemoteConfigured()) {
      if (remoteError) {
        const raw = remoteError.message || String(remoteError);
        const hint401 =
          /permission denied|42501/i.test(raw) || raw.includes("401")
            ? " 请在 Supabase → SQL Editor 中执行仓库内 supabase-setup.sql 末尾的 GRANT 语句（为 anon 授予该表的 SELECT/INSERT/UPDATE）。"
            : "";
        banner.textContent = "远端同步失败：" + raw + hint401 + " 当前仅展示本机已缓存的会话（如有）。";
        banner.className = "data-cloud-banner data-cloud-banner--err";
      } else {
        banner.textContent = `已从数据库加载 ${remoteCount} 条会话（与本机缓存合并）。`;
        banner.className = "data-cloud-banner data-cloud-banner--ok";
      }
    }

    const sel = $("session-select");
    sel.innerHTML = `<option value="">— 选择会话 —</option>`;
    all.forEach((s) => {
      const o = document.createElement("option");
      o.value = s.meta.sessionId;
      const q = ST.sessionQuality(s);
      const flag = q.isComplete ? "" : " · 待审核";
      o.textContent = `${s.meta.createdAt.slice(0, 19)} · ${s.meta.subjectId}${flag}`;
      sel.appendChild(o);
    });
    renderDataDashboard(all);
    $("data-stats").innerHTML = "";
    $("session-json").value = "";
    sel.value = "";
  }

  function renderDataDashboard(all) {
    const dash = $("data-dashboard");
    const tbl = $("data-sessions-table");
    if (!dash || !tbl) return;
    const n = all.length;
    const qualities = all.map((s) => ({ s, q: ST.sessionQuality(s) }));
    const nComplete = qualities.filter((x) => x.q.isComplete).length;
    const pool = ST.pooledByCondition(all);
    const keys = ST.CONDITION_KEYS;
    const remoteOn = !!(R && R.isRemoteConfigured());
    const dashHint = remoteOn
      ? "列表为远端数据与本机未上传记录的合并。删除仅清除本机 localStorage，不影响数据库。"
      : "未配置远端时，数据仅保存在各被试浏览器本地；汇总请导出 CSV。";

    dash.innerHTML = `
      <div class="dash-grid">
        <div class="dash-card dash-card--wide">
          <div class="dash-k">已保存会话</div>
          <div class="dash-v">${n}</div>
          <div class="dash-hint">${dashHint}</div>
        </div>
        <div class="dash-card ${nComplete ? "dash-ok" : ""}">
          <div class="dash-k">完整主流程</div>
          <div class="dash-v">${nComplete}</div>
          <div class="dash-hint">100 试次（正式 80 + 填充 20）</div>
        </div>
        <div class="dash-card ${n - nComplete > 0 ? "dash-warn" : ""}">
          <div class="dash-k">待审核 / 未完成</div>
          <div class="dash-v">${n - nComplete}</div>
          <div class="dash-hint">未跑满或注意力检查异常</div>
        </div>
      </div>
      <div class="dash-pooled">
        <h4 class="dash-pooled-title">完整会话汇总 · 各条件平均反应时与正确率</h4>
        ${
          pool.completeSessionCount === 0
            ? '<p class="dash-empty">尚无完整会话。</p>'
            : `<div class="dash-cond-grid">
          ${keys
            .map((k) => {
              const x = pool.byCondition[k];
              return `<div class="dash-cond-cell"><b>${x.label}</b><div class="dash-cond-stat">${
                x.meanRt != null ? Math.round(x.meanRt) : "—"
              } ms</div><div class="dash-cond-sub">试次 n=${x.n} · 正确率 ${(x.accuracy * 100).toFixed(
                1
              )}% · 基于 ${x.nSessions} 份完整数据</div></div>`;
            })
            .join("")}
        </div>`
        }
      </div>`;

    if (n === 0) {
      tbl.innerHTML = '<p class="dash-empty">暂无会话记录。</p>';
      return;
    }
    tbl.innerHTML = `
      <table class="review-table data-session-table">
        <thead><tr>
          <th>状态</th><th>保存时间</th><th>被试编号</th><th>主流程</th><th>注意</th><th>异常说明</th><th></th>
        </tr></thead>
        <tbody>
          ${qualities
            .map(({ s, q }) => {
              const st = q.isComplete
                ? '<span class="badge badge-ok">完整</span>'
                : '<span class="badge badge-warn">审核</span>';
              const dt = (s.meta?.createdAt || "").slice(0, 19).replace("T", " ");
              const sub = escHtml(String(s.meta?.subjectId || ""));
              const note = q.issues.length ? escHtml(q.issues.join("；")) : "—";
              const sid = String(s.meta?.sessionId || "").replace(/"/g, "&quot;");
              return `<tr>
                <td>${st}</td>
                <td>${dt}</td>
                <td class="mono">${sub}</td>
                <td>${q.mainN}/100</td>
                <td>${q.attentionN}/2</td>
                <td class="cell-note">${note}</td>
                <td><button type="button" class="btn-tiny" data-select="${sid}">查看</button></td>
              </tr>`;
            })
            .join("")}
        </tbody>
      </table>`;
    tbl.querySelectorAll("button[data-select]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-select");
        const selEl = $("session-select");
        selEl.value = id;
        selEl.dispatchEvent(new Event("change"));
      });
    });
  }

  function wire() {
    $("btn-start").onclick = beginSession;
    $("btn-to-practice").onclick = () => {
      practiceIdx = 0;
      session.practice.trials = [];
      $("practice-feedback").classList.add("hidden");
      runPracticeLoop();
    };
    $("btn-practice-next").onclick = () => {
      practiceRound += 1;
      practiceIdx = 0;
      session.practice.trials = [];
      practiceList = T.buildPracticeTrials((session.meta.sessionSeed + practiceRound * 9973) >>> 0);
      $("practice-feedback").classList.add("hidden");
      runPracticeLoop();
    };
    $("btn-practice-enter").onclick = () => {
      mainIdx = 0;
      formalCompleted = 0;
      session.main.trialLog = [];
      session.attention = [];
      runMainLoop();
    };

    $("btn-tab-exp").onclick = () => {
      setTabsActive("btn-tab-exp");
      showScreen("welcome");
    };
    $("btn-tab-review").onclick = () => {
      setTabsActive("btn-tab-review");
      buildReviewPanel();
      showScreen("review");
    };
    $("btn-tab-data").onclick = () => {
      setTabsActive("btn-tab-data");
      showScreen("data");
      void refreshData();
    };

    $("btn-review-refresh").onclick = () => buildReviewPanel();

    $("session-select").onchange = () => {
      const id = $("session-select").value;
      const found =
        (lastMergedSessions && lastMergedSessions.find((x) => x.meta.sessionId === id)) ||
        S.loadAll().find((x) => x.meta.sessionId === id);
      $("session-json").value = id && found ? JSON.stringify(found, null, 2) : "";
      if (id && found) {
        const agg = ST.aggregateFormal(found);
        $("data-stats").innerHTML = ["pic_con", "pic_inc", "txt_con", "txt_inc"]
          .map((k) => {
            const x = agg.byCondition[k];
            return `<div class="stat-box"><b>${x.label}</b><br/>n=${x.n} · 正确率 ${(x.accuracy * 100).toFixed(1)}% · RT 均值 ${x.meanRt != null ? Math.round(x.meanRt) : "—"} ms · 中位数 ${x.medianRt != null ? Math.round(x.medianRt) : "—"} ms</div>`;
          })
          .join("");
      } else $("data-stats").innerHTML = "";
    };

    $("btn-export").onclick = () => {
      const id = $("session-select").value;
      if (!id) return alert("请选择会话");
      const s =
        (lastMergedSessions && lastMergedSessions.find((x) => x.meta.sessionId === id)) ||
        S.loadAll().find((x) => x.meta.sessionId === id);
      if (!s) return alert("未找到该会话");
      const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      S.download(`shijue_biaoxiang_trials_${safe}.csv`, "\uFEFF" + S.buildCsv(s), "text/csv;charset=utf-8");
    };
    $("btn-export-all-summary").onclick = async () => {
      const { all } = await getMergedSessions();
      if (!all.length) return alert("暂无会话");
      const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
      S.download(
        `shijue_biaoxiang_sessions_${stamp}.csv`,
        "\uFEFF" + S.buildSessionsOverviewCsv(all),
        "text/csv;charset=utf-8"
      );
    };
    $("btn-json").onclick = () => {
      const id = $("session-select").value;
      if (!id) return alert("请选择会话");
      const s =
        (lastMergedSessions && lastMergedSessions.find((x) => x.meta.sessionId === id)) ||
        S.loadAll().find((x) => x.meta.sessionId === id);
      if (!s) return alert("未找到该会话");
      const safe = id.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
      S.download(`shijue_biaoxiang_session_${safe}.json`, JSON.stringify(s, null, 2), "application/json;charset=utf-8");
    };
    $("btn-delete").onclick = () => {
      const id = $("session-select").value;
      if (!id) return alert("请选择会话");
      const extra =
        R && R.isRemoteConfigured()
          ? "\n\n说明：仅删除本机 localStorage 中的副本；数据库中的记录需在 Supabase 表编辑器中手动删除。"
          : "";
      if (!confirm("确定删除当前所选会话的本机缓存？" + extra)) return;
      S.deleteSession(id);
      void refreshData();
      $("session-json").value = "";
    };
    $("btn-end-home").onclick = () => {
      setTabsActive("btn-tab-exp");
      showScreen("welcome");
    };
    $("btn-open-data").onclick = () => $("btn-tab-data").click();
  }

  wire();
})();
