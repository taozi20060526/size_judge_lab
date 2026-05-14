/**
 * 【试次序列生成器】赵钰涛
 *
 * 负责练习试次、正式 100 试次（含填充）的构造：四条件块拉丁方、同词对最小间隔、左右平衡、随机种子可复现。
 * 纯函数逻辑，不读写 DOM。对外：window.SJL_TRIALS。
 */
(function () {
  const C = window.SJL_CONFIG;

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function randomPermutation4(rnd) {
    return shuffle([0, 1, 2, 3], rnd);
  }

  function sizeForSide(isBigObject, mode, consistent) {
    if (mode === "image") {
      if (consistent) {
        return isBigObject ? C.IMG_BIG_CON_PCT : C.IMG_SMALL_CON_PCT;
      }
      return isBigObject ? C.IMG_BIG_INC_PCT : C.IMG_SMALL_INC_PCT;
    }
    if (consistent) {
      return isBigObject ? C.TXT_BIG_PT : C.TXT_SMALL_PT;
    }
    return isBigObject ? C.TXT_BIG_INC_PT : C.TXT_SMALL_INC_PT;
  }

  function buildOneTrial(pair, condDef, leftIsBig, blockIndex, posInBlock, trialInFormal, phase) {
    const leftWord = leftIsBig ? pair.big : pair.small;
    const rightWord = leftIsBig ? pair.small : pair.big;
    const leftFile = leftIsBig ? pair.bigFile : pair.smallFile;
    const rightFile = leftIsBig ? pair.smallFile : pair.bigFile;
    const leftPct = sizeForSide(leftIsBig, condDef.mode, condDef.consistent);
    const rightPct = sizeForSide(!leftIsBig, condDef.mode, condDef.consistent);
    return {
      phase: phase || "formal",
      trialInFormal,
      blockIndex,
      posInBlock,
      pairId: pair.id,
      bigWord: pair.big,
      smallWord: pair.small,
      bigFile: pair.bigFile,
      smallFile: pair.smallFile,
      conditionKey: condDef.key,
      conditionLabel: condDef.label,
      mode: condDef.mode,
      consistent: condDef.consistent,
      leftIsBig,
      leftWord,
      rightWord,
      leftFile,
      rightFile,
      leftPct,
      rightPct,
      includeInAnalysis: phase === "filler" ? 0 : 1,
    };
  }

  function buildFormalTrials(sessionSeed, subjectIndex) {
    const rnd = mulberry32(sessionSeed >>> 0);
    const perm = randomPermutation4(rnd);
    const defs = C.CONDITION_DEFS;
    const pairs = C.PAIRS;
    const blockOrders = [
      [0, 1, 2, 3],
      [1, 2, 3, 0],
      [2, 3, 0, 1],
      [3, 0, 1, 2],
    ];
    const blockPerm = blockOrders[(subjectIndex || 0) % 4];
    const blocks = [];
    let trialInFormal = 0;

    for (let bi = 0; bi < 4; bi++) {
      const blockIndex = blockPerm[bi];
      const pairOrder = shuffle(
        pairs.map((_, idx) => idx),
        rnd
      );
      const blockTrials = [];
      for (let pos = 0; pos < 20; pos++) {
        const pairIdx = pairOrder[pos];
        const pair = pairs[pairIdx];
        const latinCond = (pairIdx + blockIndex) % 4;
        const condDef = defs[perm[latinCond]];
        const leftIsBig = (pairIdx + blockIndex) % 2 === 0;
        trialInFormal += 1;
        blockTrials.push(
          buildOneTrial(pair, condDef, leftIsBig, blockIndex, pos, trialInFormal, "formal")
        );
      }
      shuffle(blockTrials, rnd);
      blocks.push(blockTrials);
    }

    let sequence = blocks.flat();
    const minGap = C.MIN_OTHER_TRIALS_BETWEEN_SAME_PAIR || 12;
    let attempts = 0;
    function violatesMinGap(seq) {
      const last = new Map();
      for (let i = 0; i < seq.length; i++) {
        const p = seq[i].pairId;
        if (last.has(p) && i - last.get(p) - 1 < minGap) return true;
        last.set(p, i);
      }
      return false;
    }
    while (violatesMinGap(sequence) && attempts < 15000) {
      attempts++;
      sequence = shuffle(sequence, rnd);
    }
    sequence.forEach((t, i) => {
      t.trialInFormal = i + 1;
    });
    return {
      trials: sequence,
      sessionSeed,
      perm,
      blockPerm,
      minGapOk: !violatesMinGap(sequence),
      minGapAttempts: attempts,
    };
  }

  function buildPracticeTrials(sessionSeed) {
    const rnd = mulberry32((sessionSeed ^ 0x9e3779b9) >>> 0);
    const defs = [C.CONDITION_DEFS[0], C.CONDITION_DEFS[1]];
    const trials = [];
    let k = 0;
    for (const pair of C.PRACTICE_PAIRS) {
      for (const cond of defs) {
        k += 1;
        const leftIsBig = rnd() < 0.5;
        trials.push({
          ...buildOneTrial(
            { id: `P${k}`, big: pair.big, small: pair.small, bigFile: pair.bigFile, smallFile: pair.smallFile },
            cond,
            leftIsBig,
            -1,
            k - 1,
            k,
            "practice"
          ),
          includeInAnalysis: 0,
        });
      }
    }
    return shuffle(trials, rnd);
  }

  function buildFillerTrials(sessionSeed) {
    const rnd = mulberry32((sessionSeed ^ 0x51ed7e11) >>> 0);
    const pairList = shuffle(C.FILLER_PAIRS.slice(), rnd);
    const condList = shuffle(
      [...Array(10).fill("txt_con"), ...Array(10).fill("txt_inc")],
      rnd
    );
    const defs = C.CONDITION_DEFS;
    const trials = [];
    for (let i = 0; i < 20; i++) {
      const pair = pairList[i];
      const ck = condList[i];
      const condDef = defs.find((d) => d.key === ck);
      const leftIsBig = i % 2 === 0;
      trials.push({
        ...buildOneTrial(pair, condDef, leftIsBig, -2, i, i + 1, "filler"),
        fillerSlot: i + 1,
      });
    }
    return trials;
  }

  function mergeFormalWithFillers(formal80, fillerBySlot20) {
    const out = [];
    let fi = 0;
    for (let chunk = 0; chunk < 20; chunk++) {
      for (let j = 0; j < 4; j++) {
        const t = formal80[chunk * 4 + j];
        t.sequenceIndex = out.length + 1;
        t.chunkIndex = chunk + 1;
        out.push(t);
      }
      const f = fillerBySlot20[fi++];
      f.sequenceIndex = out.length + 1;
      f.chunkIndex = chunk + 1;
      out.push(f);
    }
    return out;
  }

  window.SJL_TRIALS = {
    buildFormalTrials,
    buildPracticeTrials,
    buildFillerTrials,
    mergeFormalWithFillers,
    mulberry32,
  };
})();
