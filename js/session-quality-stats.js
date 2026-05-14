/**
 * 【会话统计与数据质量】赵钰涛
 *
 * 按条件聚合正式试次（排除超时与填充）、计算正确率与 RT；并给出「是否跑满主流程」等审核用标记。
 * 供结束页、数据仪表盘与教师检查表使用。对外：window.SJL_STATS。
 */
(function () {
  const LABEL = {
    pic_con: "图画-一致",
    pic_inc: "图画-不一致",
    txt_con: "文字-一致",
    txt_inc: "文字-不一致",
  };
  const KEYS = ["pic_con", "pic_inc", "txt_con", "txt_inc"];

  function aggregateFormal(session) {
    const trials = (session.main?.trialLog || []).filter(
      (t) => t.phase === "formal" && t.includeInAnalysis === 1
    );
    const out = {};
    for (const k of KEYS) {
      const all = trials.filter((t) => t.conditionKey === k);
      const rts = all.filter((t) => !t.timedOut).map((t) => t.rtMs);
      const correctN = all.filter((t) => t.correct).length;
      out[k] = {
        key: k,
        label: LABEL[k],
        n: all.length,
        nValidRt: rts.length,
        accuracy: all.length ? correctN / all.length : 0,
        meanRt: rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null,
        medianRt: rts.length
          ? [...rts].sort((a, b) => a - b)[Math.floor(rts.length / 2)]
          : null,
      };
    }
    return { byCondition: out, formalN: trials.length };
  }

  /** 返回主流程试次数、注意检查次数、未完成原因列表（供数据表「待审核」列使用）。 */
  function sessionQuality(session) {
    const main = session.main?.trialLog || [];
    const formal = main.filter((t) => t.phase === "formal");
    const filler = main.filter((t) => t.phase === "filler");
    const att = session.attention || [];
    const issues = [];
    if (main.length === 0) issues.push("无主流程记录（可能未开始或已清除）");
    if (main.length > 0 && main.length < 100) issues.push(`主流程试次 ${main.length}/100（未完成）`);
    if (main.length > 100) issues.push(`主流程试次 ${main.length}，超出预期`);
    if (formal.length !== 80 && main.length > 0) issues.push(`正式试次 ${formal.length}/80`);
    if (filler.length !== 20 && main.length > 0) issues.push(`填充试次 ${filler.length}/20`);
    if (main.length === 100 && att.length < 2) issues.push(`注意力检查 ${att.length}/2`);
    if (att.some((a) => !a.correct)) issues.push("注意力检查存在未按要求（←）作答");
    const formalTimeouts = formal.filter((t) => t.timedOut).length;
    if (formalTimeouts > 8) issues.push(`正式试次超时 ${formalTimeouts} 次`);
    const isComplete =
      main.length === 100 &&
      formal.length === 80 &&
      filler.length === 20 &&
      att.length >= 2;
    return {
      isComplete,
      mainN: main.length,
      formalN: formal.length,
      fillerN: filler.length,
      attentionN: att.length,
      formalTimeouts,
      issues,
      issueSummary: issues.length ? issues.join("；") : "—",
    };
  }

  /** 跨会话元分析：只纳入 sessionQuality 判定为完整的记录，再按四条件池化 RT 与正确率。 */
  function pooledByCondition(sessions) {
    const complete = sessions.filter((s) => sessionQuality(s).isComplete);
    const trials = [];
    for (const s of complete) {
      for (const t of s.main?.trialLog || []) {
        if (t.phase === "formal" && t.includeInAnalysis === 1) trials.push(t);
      }
    }
    const out = {};
    for (const k of KEYS) {
      const all = trials.filter((t) => t.conditionKey === k);
      const rts = all.filter((t) => !t.timedOut).map((t) => t.rtMs);
      const correctN = all.filter((t) => t.correct).length;
      out[k] = {
        key: k,
        label: LABEL[k],
        n: all.length,
        nSessions: complete.length,
        meanRt: rts.length ? rts.reduce((a, b) => a + b, 0) / rts.length : null,
        accuracy: all.length ? correctN / all.length : 0,
      };
    }
    return { byCondition: out, completeSessionCount: complete.length, trialTotal: trials.length };
  }

  window.SJL_STATS = { aggregateFormal, sessionQuality, pooledByCondition, CONDITION_KEYS: KEYS };
})();
