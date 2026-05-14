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

  function buildCsv(s) {
    const cols = [
      "phase",
      "includeInAnalysis",
      "sessionId",
      "subjectId",
      "sessionSeed",
      "sequenceIndex",
      "trialInFormal",
      "chunkIndex",
      "pairId",
      "conditionKey",
      "mode",
      "consistent",
      "leftIsBig",
      "leftWord",
      "rightWord",
      "leftFile",
      "rightFile",
      "leftPct",
      "rightPct",
      "rtMs",
      "correct",
      "response",
      "timedOut",
      "isAttentionCheck",
      "timestampEnd",
    ];
    const m = s.meta;
    const lines = [cols.join(",")];
    const row = (o) => lines.push(cols.map((c) => esc(o[c])).join(","));

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

  /** 会话总览 CSV 一行一条 */
  function buildSessionsOverviewCsv(sessions) {
    const ST = window.SJL_STATS;
    const cols = [
      "sessionId",
      "subjectId",
      "createdAt",
      "isComplete",
      "qualityNote",
      "mainTrialCount",
      "formalCount",
      "fillerCount",
      "attentionCount",
      "formalTimeouts",
      "meanRt_pic_con_ms",
      "meanRt_pic_inc_ms",
      "meanRt_txt_con_ms",
      "meanRt_txt_inc_ms",
      "acc_pic_con",
      "acc_pic_inc",
      "acc_txt_con",
      "acc_txt_inc",
    ];
    const lines = [cols.join(",")];
    for (const s of sessions) {
      const q = ST.sessionQuality(s);
      const agg = ST.aggregateFormal(s);
      const row = {
        sessionId: s.meta?.sessionId,
        subjectId: s.meta?.subjectId,
        createdAt: s.meta?.createdAt,
        isComplete: q.isComplete ? 1 : 0,
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
      lines.push(cols.map((c) => esc(row[c])).join(","));
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
