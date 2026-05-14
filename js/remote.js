/**
 * Supabase REST：上传 / 拉取会话（静态托管时用）
 */
(function () {
  const C = window.SJL_CONFIG;

  function cfg() {
    return C.REMOTE || {};
  }

  function isRemoteConfigured() {
    const r = cfg();
    return !!(r.enabled && r.supabaseUrl && r.supabaseAnonKey);
  }

  function authHeaders() {
    const key = cfg().supabaseAnonKey;
    return {
      apikey: key,
      Authorization: "Bearer " + key,
      "Content-Type": "application/json",
    };
  }

  function baseUrl() {
    return String(cfg().supabaseUrl || "").replace(/\/+$/, "");
  }

  function tableName() {
    return cfg().tableName || "experiment_sessions";
  }

  /**
   * 整段 session 写入表；session_id 冲突则覆盖 payload。
   */
  async function pushSession(session) {
    if (!isRemoteConfigured()) return { ok: false, skipped: true };
    const url = baseUrl() + "/rest/v1/" + tableName();
    const row = {
      session_id: session.meta.sessionId,
      subject_id: session.meta.subjectId,
      payload: session,
    };
    let res = await fetch(url, {
      method: "POST",
      headers: { ...authHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify(row),
    });
    if (res.status === 409) {
      const q =
        baseUrl() +
        "/rest/v1/" +
        tableName() +
        "?session_id=eq." +
        encodeURIComponent(session.meta.sessionId);
      res = await fetch(q, {
        method: "PATCH",
        headers: { ...authHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ payload: session, subject_id: session.meta.subjectId }),
      });
    }
    if (!res.ok) {
      const t = await res.text();
      throw new Error(res.status + " " + (t || res.statusText));
    }
    return { ok: true };
  }

  /** 拉取表中 payload 列（需 RLS 允许读，见 SQL） */
  async function fetchSessions() {
    if (!isRemoteConfigured()) return [];
    const q =
      baseUrl() +
      "/rest/v1/" +
      tableName() +
      "?select=session_id,subject_id,created_at,payload&order=created_at.desc";
    const res = await fetch(q, { headers: authHeaders() });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(res.status + " " + (t || res.statusText));
    }
    const rows = await res.json();
    const out = [];
    for (const r of rows) {
      const p = r.payload;
      if (p && p.meta && p.meta.sessionId) out.push(p);
    }
    return out;
  }

  window.SJL_REMOTE = { pushSession, fetchSessions, isRemoteConfigured };
})();
