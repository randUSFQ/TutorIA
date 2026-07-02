/* ==========================================================================
   tutor.js
   The "brain" of the tutor: owns adaptive state (level, XP, streak, lives),
   evaluates answers for every exercise type, and remembers recurring
   mistakes so it can steer future exercises and recommendations.
   Never returns a bare correct/incorrect — always produces an explanation.
   ========================================================================== */

const TutorEngine = (() => {

  const STORAGE_KEY = 'perfecta_tutor_state_v1';

  const defaultState = () => ({
    profession: 'health',
    levelIndex: 2, // B1
    xp: 0,
    streak: 0,
    bestStreak: 0,
    lives: 3,
    totalAnswers: 0,
    correctAnswers: 0,
    startedAt: Date.now(),
    activeMs: 0,
    errorLog: [], // {tense, type, timestamp}
    typeCounts: {}, // exercises attempted per type
    typeCorrect: {},
    tenseCounts: { present: 0, past: 0 },
    tenseCorrect: { present: 0, past: 0 },
    badges: [],
    voiceEnabled: true,
    theme: 'dark',
  });

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) {}
    return defaultState();
  }

  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (e) {}
  }

  function level() { return LEVELS[state.levelIndex]; }

  function setProfession(id) { state.profession = id; persist(); }

  function adjustLevel(delta) {
    const next = Math.min(LEVELS.length - 1, Math.max(0, state.levelIndex + delta));
    const changed = next !== state.levelIndex;
    state.levelIndex = next;
    return changed;
  }

  const XP_PER_CORRECT = { A1: 8, A2: 9, B1: 10, B2: 12, C1: 14, C2: 16 };

  function xpForNextLevel() { return 100 + state.levelIndex * 40; }

  /**
   * Core evaluator — normalizes per exercise type, returns:
   * { correct, explanation, xpGained, leveledUp, dossierNote }
   */
  function evaluate(exercise, userAnswer) {
    let correct = false;

    switch (exercise.type) {
      case 'mc':
        correct = userAnswer === exercise.correctAnswer;
        break;
      case 'fill': {
        const norm = (s) => s.toLowerCase().trim().replace(/\s+/g, ' ');
        correct = norm(userAnswer) === norm(exercise.correctAnswer);
        break;
      }
      case 'order':
        correct = userAnswer.join(' ') === exercise.correctOrder.join(' ');
        break;
      case 'error':
        correct = userAnswer === exercise.correctAnswer;
        break;
      case 'match':
        correct = userAnswer === true; // app.js resolves full-match boolean
        break;
      default:
        correct = false;
    }

    recordAttempt(exercise, correct);

    const explanation = correct
      ? exercise.explanation
      : (typeof exercise.wrongExplanation === 'function' ? exercise.wrongExplanation(formatAnswer(userAnswer)) : exercise.explanation);

    let xpGained = 0;
    let leveledUp = false;

    if (correct) {
      xpGained = XP_PER_CORRECT[level()] + Math.min(10, state.streak);
      state.xp += xpGained;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      if (state.xp >= xpForNextLevel()) {
        state.xp -= xpForNextLevel();
        leveledUp = adjustLevel(1);
      } else if (state.streak > 0 && state.streak % 5 === 0) {
        leveledUp = adjustLevel(1); // fast learners climb on hot streaks too
      }
    } else {
      state.streak = 0;
      state.lives = Math.max(0, state.lives - 1);
      if (state.totalAnswers > 4 && accuracy() < 45) adjustLevel(-1);
      logError(exercise);
    }

    checkBadges();
    persist();

    return { correct, explanation, xpGained, leveledUp, level: level(), lives: state.lives };
  }

  function formatAnswer(a) {
    if (Array.isArray(a)) return a.join(' ');
    return String(a);
  }

  function recordAttempt(exercise, correct) {
    state.totalAnswers += 1;
    if (correct) state.correctAnswers += 1;
    state.typeCounts[exercise.type] = (state.typeCounts[exercise.type] || 0) + 1;
    if (correct) state.typeCorrect[exercise.type] = (state.typeCorrect[exercise.type] || 0) + 1;
    if (exercise.tense === 'present' || exercise.tense === 'past') {
      state.tenseCounts[exercise.tense] += 1;
      if (correct) state.tenseCorrect[exercise.tense] += 1;
    }
  }

  function logError(exercise) {
    state.errorLog.push({ tense: exercise.tense, type: exercise.type, ts: Date.now() });
    if (state.errorLog.length > 60) state.errorLog.shift();
  }

  function accuracy() {
    return state.totalAnswers === 0 ? 0 : Math.round((state.correctAnswers / state.totalAnswers) * 100);
  }

  function weakestTense() {
    const pAcc = state.tenseCounts.present ? state.tenseCorrect.present / state.tenseCounts.present : 1;
    const paAcc = state.tenseCounts.past ? state.tenseCorrect.past / state.tenseCounts.past : 1;
    if (state.tenseCounts.present + state.tenseCounts.past < 3) return null;
    return pAcc <= paAcc ? 'present' : 'past';
  }

  const BADGE_DEFS = [
    { id: 'first-correct', icon: '🌱', test: s => s.correctAnswers >= 1 },
    { id: 'streak-5', icon: '🔥', test: s => s.bestStreak >= 5 },
    { id: 'streak-10', icon: '⚡', test: s => s.bestStreak >= 10 },
    { id: 'twenty', icon: '📘', test: s => s.totalAnswers >= 20 },
    { id: 'accuracy-80', icon: '🎯', test: s => s.totalAnswers >= 10 && accuracy() >= 80 },
    { id: 'b2', icon: '🚀', test: s => s.levelIndex >= 3 },
    { id: 'c1', icon: '👑', test: s => s.levelIndex >= 4 },
    { id: 'polyglot', icon: '🌍', test: s => new Set(Object.keys(s.typeCounts)).size >= 4 },
  ];

  function checkBadges() {
    BADGE_DEFS.forEach(b => {
      if (!state.badges.includes(b.id) && b.test(state)) state.badges.push(b.id);
    });
  }

  function dailyChallenge() {
    const day = new Date().getDate();
    const options = [
      'Completa 5 ejercicios de Present Perfect sin fallar.',
      'Practica en el modo Conversación usando "before" al menos dos veces.',
      'Alcanza una racha de 8 respuestas correctas seguidas.',
      'Prueba los cuatro campos profesionales hoy.',
      'Consigue 90% de precisión en 10 ejercicios.',
    ];
    return options[day % options.length];
  }

  function tickActiveTime(ms) { state.activeMs += ms; }

  function reviveLives() { state.lives = 3; persist(); }

  function getState() { return state; }

  return {
    getState, load, persist, level, setProfession, evaluate, accuracy,
    weakestTense, dailyChallenge, tickActiveTime, reviveLives, BADGE_DEFS,
    xpForNextLevel,
  };
})();
