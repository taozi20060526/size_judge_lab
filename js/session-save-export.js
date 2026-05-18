/**
 * 【本地存档与数据导出】赵钰涛
 *
 * localStorage 存多条会话；提供试次级 CSV、多会话汇总 CSV、单条 JSON 下载；与远端拉取结果在 UI 层合并展示。
 * 对外：window.SJL_STORAGE。
 */
(function () {
  const C = window.SJL_CONFIG;

  function safeParse(json, fb) {
    try {
      return JSON.parse(json);
    } catch {
      return fb;
    }
  }

  function loadAll() {
    const a = safeParse(localStorage.getItem(C.STORAGE_KEY), []);
    return Array.isArray(a) ? a : [];
  }

  function saveAll(sessions) {
    localStorage.setItem(C.STORAGE_KEY, JSON.stringify(sessions));
  }

  function appendSession(s) {
    const all = loadAll();
    all.push(s);
    saveAll(all);
  }

  function deleteSession(sessionId) {
    saveAll(loadAll().filter((x) => x.meta.sessionId !== sessionId));
  }

  function esc(v) {
    if (v == null) return "";
    const s = String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  }

  const CONDITION_CN = {
    pic_con: "图画-一致",
    pic_inc: "图画-不一致",
    txt_con: "文字-一致",
    txt_inc: "文字-不一致",
  };

  function fmtPhase(p) {
    const m = { practice: "练习", formal: "正式", filler: "填充", attention: "注意检查" };
    return m[p] || p;
  }

  function fmtMode(m) {
    if (m === "image") return "图画";
    if (m === "text") return "文字";
    return m;
  }

  function fmtYesNo(v) {
    if (v === true || v === 1 || v === "1") return "是";
    if (v === false || v === 0 || v === "0") return "否";
    return v;
  }

  function fmtResponse(r) {
    if (r === "ArrowLeft") return "左箭头";
    if (r === "ArrowRight") return "右箭头";
    if (r === "timeout") return "超时";
    return r;
  }

  function fmtCondition(k) {
    return CONDITION_CN[k] || k;
  }

  /** 试次级 CSV：表头与单元格均为中文（JSON 原始字段不变） */
  function buildCsv(s) {
    const cols = [
      { key: "phase", label: "阶段", fmt: fmtPhase },
      { key: "includeInAnalysis", label: "计入分析", fmt: fmtYesNo },
      { key: "sessionId", label: "会话编号" },
      { key: "subjectId", label: "被试编号" },
      { key: "sessionSeed", label: "随机种子" },
      { key: "sequenceIndex", label: "试次序号" },
      { key: "trialInFormal", label: "正式试次序号" },
      { key: "chunkIndex", label: "组块序号" },
      { key: "pairId", label: "词对编号" },
      { key: "conditionKey", label: "实验条件", fmt: fmtCondition },
      { key: "mode", label: "刺激类型", fmt: fmtMode },
      { key: "consistent", label: "大小一致", fmt: fmtYesNo },
      { key: "leftIsBig", label: "左侧为真实更大", fmt: fmtYesNo },
      { key: "leftWord", label: "左侧词" },
      { key: "rightWord", label: "右侧词" },
      { key: "leftFile", label: "左图文件名" },
      { key: "rightFile", label: "右图文件名" },
      { key: "leftPct", label: "左侧呈现比例" },
      { key: "rightPct", label: "右侧呈现比例" },
      { key: "rtMs", label: "反应时毫秒" },
      { key: "correct", label: "是否正确", fmt: fmtYesNo },
      { key: "response", label: "按键反应", fmt: fmtResponse },
      { key: "timedOut", label: "是否超时", fmt: fmtYesNo },
      { key: "isAttentionCheck", label: "是否注意检查", fmt: fmtYesNo },
      { key: "timestampEnd", label: "结束时间" },
    ];
    const m = s.meta;
    const lines = [cols.map((c) => c.label).join(",")];
    const row = (o) => {
      lines.push(
        cols
          .map((c) => {
            let v = o[c.key];
            if (c.fmt) v = c.fmt(v);
            return esc(v);
          })
          .join(",")
      );
    };

    for (const t of s.practice?.trials || []) {
      row({
        phase: "practice",
        includeInAnalysis: 0,
        sessionId: m.sessionId,
        subjectId: m.subjectId,
        sessionSeed: m.sessionSeed,
        sequenceIndex: t.sequenceIndex,
        trialInFormal: "",
        chunkIndex: "",
        pairId: t.pairId,
        conditionKey: t.conditionKey,
        mode: t.mode,
        consistent: t.consistent,
        leftIsBig: t.leftIsBig,
        leftWord: t.leftWord,
        rightWord: t.rightWord,
        leftFile: t.leftFile,
        rightFile: t.rightFile,
        leftPct: t.leftPct,
        rightPct: t.rightPct,
        rtMs: t.rtMs,
        correct: t.correct,
        response: t.response,
        timedOut: t.timedOut,
        isAttentionCheck: 0,
        timestampEnd: t.timestampEnd,
      });
    }
    for (const t of s.main?.trialLog || []) {
      row({
        phase: t.phase,
        includeInAnalysis: t.includeInAnalysis,
        sessionId: m.sessionId,
        subjectId: m.subjectId,
        sessionSeed: m.sessionSeed,
        sequenceIndex: t.sequenceIndex,
        trialInFormal: t.trialInFormal ?? "",
        chunkIndex: t.chunkIndex ?? "",
        pairId: t.pairId,
        conditionKey: t.conditionKey,
        mode: t.mode,
        consistent: t.consistent,
        leftIsBig: t.leftIsBig,
        leftWord: t.leftWord,
        rightWord: t.rightWord,
        leftFile: t.leftFile,
        rightFile: t.rightFile,
        leftPct: t.leftPct,
        rightPct: t.rightPct,
        rtMs: t.rtMs,
        correct: t.correct,
        response: t.response,
        timedOut: t.timedOut,
        isAttentionCheck: 0,
        timestampEnd: t.timestampEnd,
      });
    }
    for (const a of s.attention || []) {
      row({
        phase: "attention",
        includeInAnalysis: 0,
        sessionId: m.sessionId,
        subjectId: m.subjectId,
        sessionSeed: m.sessionSeed,
        sequenceIndex: a.afterSequenceIndex,
        trialInFormal: "",
        chunkIndex: "",
        pairId: "",
        conditionKey: "",
        mode: "",
        consistent: "",
        leftIsBig: "",
        leftWord: "",
        rightWord: "",
        leftFile: "",
        rightFile: "",
        leftPct: "",
        rightPct: "",
        rtMs: a.rtMs,
        correct: a.correct,
        response: a.response,
        timedOut: 0,
        isAttentionCheck: 1,
        timestampEnd: a.timestampEnd,
      });
    }
    return lines.join("\r\n");
  }

  /** 会话汇总 CSV：每会话一行，表头中文 */
  function buildSessionsOverviewCsv(sessions) {
    const ST = window.SJL_STATS;
    const cols = [
      { key: "sessionId", label: "会话编号" },
      { key: "subjectId", label: "被试编号" },
      { key: "createdAt", label: "保存时间" },
      { key: "isComplete", label: "主流程完整" },
      { key: "qualityNote", label: "质量说明" },
      { key: "mainTrialCount", label: "主流程试次数" },
      { key: "formalCount", label: "正式试次数" },
      { key: "fillerCount", label: "填充试次数" },
      { key: "attentionCount", label: "注意检查次数" },
      { key: "formalTimeouts", label: "正式超时次数" },
      { key: "meanRt_pic_con_ms", label: "图画一致平均RT毫秒" },
      { key: "meanRt_pic_inc_ms", label: "图画不一致平均RT毫秒" },
      { key: "meanRt_txt_con_ms", label: "文字一致平均RT毫秒" },
      { key: "meanRt_txt_inc_ms", label: "文字不一致平均RT毫秒" },
      { key: "acc_pic_con", label: "图画一致正确率百分" },
      { key: "acc_pic_inc", label: "图画不一致正确率百分" },
      { key: "acc_txt_con", label: "文字一致正确率百分" },
      { key: "acc_txt_inc", label: "文字不一致正确率百分" },
    ];
    const lines = [cols.map((c) => c.label).join(",")];
    for (const s of sessions) {
      const q = ST.sessionQuality(s);
      const agg = ST.aggregateFormal(s);
      const row = {
        sessionId: s.meta?.sessionId,
        subjectId: s.meta?.subjectId,
        createdAt: s.meta?.createdAt,
        isComplete: q.isComplete ? "是" : "否",
        qualityNote: q.issueSummary,
        mainTrialCount: q.mainN,
        formalCount: q.formalN,
        fillerCount: q.fillerN,
        attentionCount: q.attentionN,
        formalTimeouts: q.formalTimeouts,
        meanRt_pic_con_ms: agg.byCondition.pic_con.meanRt != null ? Math.round(agg.byCondition.pic_con.meanRt) : "",
        meanRt_pic_inc_ms: agg.byCondition.pic_inc.meanRt != null ? Math.round(agg.byCondition.pic_inc.meanRt) : "",
        meanRt_txt_con_ms: agg.byCondition.txt_con.meanRt != null ? Math.round(agg.byCondition.txt_con.meanRt) : "",
        meanRt_txt_inc_ms: agg.byCondition.txt_inc.meanRt != null ? Math.round(agg.byCondition.txt_inc.meanRt) : "",
        acc_pic_con: (agg.byCondition.pic_con.accuracy * 100).toFixed(1),
        acc_pic_inc: (agg.byCondition.pic_inc.accuracy * 100).toFixed(1),
        acc_txt_con: (agg.byCondition.txt_con.accuracy * 100).toFixed(1),
        acc_txt_inc: (agg.byCondition.txt_inc.accuracy * 100).toFixed(1),
      };
      lines.push(cols.map((c) => esc(row[c.key])).join(","));
    }
    return lines.join("\r\n");
  }

  function download(name, text, mime) {
    const b = new Blob([text], { type: mime || "text/csv;charset=utf-8" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u;
    a.download = name;
    a.click();
    URL.revokeObjectURL(u);
  }

  window.SJL_STORAGE = { loadAll, saveAll, appendSession, deleteSession, buildCsv, buildSessionsOverviewCsv, download };
})();
