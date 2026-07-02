/* ==========================================================================
   app.js
   Wires the DOM to TutorEngine / ExerciseEngine / Avatar / SpeechModule.
   Owns transient UI state (current exercise, selected answer, hint usage)
   that doesn't need to persist across sessions.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  const state = TutorEngine.getState();

  // ---------- element refs ----------
  const $ = (sel) => document.querySelector(sel);
  const professionGrid = $('#professionGrid');
  const levelTrack = $('#levelTrack');
  const levelCaption = $('#levelCaption');
  const dossierScenario = $('#dossierScenario');
  const dossierLevel = $('#dossierLevel');
  const sceneBackdrop = $('#sceneBackdrop');
  const avatarSvg = $('#avatarSvg');
  const avatarStatus = $('#avatarStatus');
  const tutorText = $('#tutorText');
  const voiceToggle = $('#voiceToggle');
  const speechSupportHint = $('#speechSupportHint');

  const exTypeChip = $('#exTypeChip');
  const livesRow = $('#livesRow');
  const exerciseCard = $('#exerciseCard');
  const exercisePrompt = $('#exercisePrompt');
  const exerciseBody = $('#exerciseBody');
  const hintBtn = $('#hintBtn');
  const micBtn = $('#micBtn');
  const checkBtn = $('#checkBtn');
  const feedbackPanel = $('#feedbackPanel');
  const feedbackIcon = $('#feedbackIcon');
  const feedbackTitle = $('#feedbackTitle');
  const feedbackExplain = $('#feedbackExplain');
  const retryBtn = $('#retryBtn');
  const nextBtn = $('#nextBtn');

  const xpValue = $('#xpValue');
  const xpBarFill = $('#xpBarFill');
  const xpCaption = $('#xpCaption');
  const streakValue = $('#streakValue');
  const accuracyValue = $('#accuracyValue');
  const timeValue = $('#timeValue');
  const badgeGrid = $('#badgeGrid');
  const dailyChallengeEl = $('#dailyChallenge');

  const convoLog = $('#convoLog');
  const convoInput = $('#convoInput');
  const convoSendBtn = $('#convoSendBtn');
  const convoMicBtn = $('#convoMicBtn');

  const analyticsGrid = $('#analyticsGrid');

  let currentExercise = null;
  let getUserAnswer = () => null;
  let answered = false;
  let hintsUsedThisExercise = 0;

  // ==========================================================================
  // INIT
  // ==========================================================================

  Avatar.init(avatarSvg);

  document.documentElement.setAttribute('data-theme', state.theme || 'dark');
  applyThemeIcons();

  buildProfessionGrid();
  buildLevelTrack();
  buildBadgeGrid();
  refreshGamificationUI();
  updateDossier();
  updateScene();
  dailyChallengeEl.textContent = TutorEngine.dailyChallenge();

  voiceToggle.checked = state.voiceEnabled;
  if (!SpeechModule.isSynthesisSupported) {
    speechSupportHint.textContent = 'Tu navegador no soporta síntesis de voz.';
    voiceToggle.checked = false;
    voiceToggle.disabled = true;
  } else if (!SpeechModule.isRecognitionSupported) {
    speechSupportHint.textContent = 'Reconocimiento de voz no disponible en este navegador (puedes escribir tus respuestas).';
  }

  greet();
  setInterval(() => TutorEngine.tickActiveTime(2000), 2000);
  setInterval(refreshGamificationUI, 4000);

  // ==========================================================================
  // TOP TABS
  // ==========================================================================
  document.querySelectorAll('.top-tab').forEach(tab => {
    tab.addEventListener('click', () => switchView(tab.dataset.view));
  });

  function switchView(view) {
    document.querySelectorAll('.top-tab').forEach(t => {
      const active = t.dataset.view === view;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active);
    });
    document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('is-active'));
    $(`#view-${view}`).classList.add('is-active');
    if (view === 'analytics') AnalyticsPanel.render(analyticsGrid);
    if (view === 'practice' && !currentExercise) loadNewExercise();
  }

  $('#startPracticeBtn').addEventListener('click', () => switchView('practice'));

  // ==========================================================================
  // THEME
  // ==========================================================================
  $('#themeToggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    state.theme = next;
    TutorEngine.persist();
    applyThemeIcons();
  });
  function applyThemeIcons() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('.icon-sun').hidden = dark;
    $('.icon-moon').hidden = !dark;
  }

  // ==========================================================================
  // PROFESSION + LEVEL RAILS
  // ==========================================================================
  function buildProfessionGrid() {
    professionGrid.innerHTML = Object.values(PROFESSIONS).map(p => `
      <button class="profession-btn ${p.id === state.profession ? 'is-active' : ''}" data-id="${p.id}">
        <span class="p-icon">${p.icon}</span> ${p.label}
      </button>`).join('');
    professionGrid.querySelectorAll('.profession-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        TutorEngine.setProfession(btn.dataset.id);
        professionGrid.querySelectorAll('.profession-btn').forEach(b => b.classList.remove('is-active'));
        btn.classList.add('is-active');
        updateDossier();
        updateScene();
        talkTutor(`Switching to ${PROFESSIONS[btn.dataset.id].label} scenarios. Let's continue practicing Present Perfect and Past Perfect in this context.`);
        if (document.querySelector('.top-tab.is-active').dataset.view === 'practice') loadNewExercise();
      });
    });
  }

  function buildLevelTrack() {
    levelTrack.innerHTML = LEVELS.map((l, i) => `<div class="level-dot" data-i="${i}" title="${l}"></div>`).join('');
    refreshLevelTrack();
  }
  function refreshLevelTrack() {
    const dots = levelTrack.querySelectorAll('.level-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('is-reached', i <= state.levelIndex);
      d.classList.toggle('is-current', i === state.levelIndex);
    });
    levelCaption.textContent = `${TutorEngine.level()} · Se ajusta automáticamente según tus respuestas`;
    dossierLevel.textContent = TutorEngine.level();
  }

  function updateDossier() {
    const p = PROFESSIONS[state.profession];
    $('#dossierEyebrow').textContent = pick(p.scenes).toUpperCase();
    dossierScenario.textContent = p.blurb(TutorEngine.level());
  }
  function updateScene() {
    const p = PROFESSIONS[state.profession];
    sceneBackdrop.style.opacity = 0;
    setTimeout(() => {
      sceneBackdrop.innerHTML = p.scene();
      sceneBackdrop.style.opacity = 1;
    }, 200);
  }
  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  voiceToggle.addEventListener('change', () => {
    state.voiceEnabled = voiceToggle.checked;
    TutorEngine.persist();
  });

  // ==========================================================================
  // AVATAR / TUTOR SPEECH
  // ==========================================================================
  function talkTutor(text, htmlOverride) {
    tutorText.innerHTML = htmlOverride || text;
    avatarStatus.textContent = 'Hablando…';
    Avatar.talk(text, {
      voiceEnabled: state.voiceEnabled,
      onEnd: () => { avatarStatus.textContent = 'Lista para ayudarte'; }
    });
  }
  $('#replayVoiceBtn').addEventListener('click', () => {
    Avatar.talk(tutorText.textContent, { voiceEnabled: true });
  });

  function greet() {
    talkTutor(`Hi! I'm your English tutor. Today we will master the Present Perfect and Past Perfect tenses using real ${PROFESSIONS[state.profession].label.toLowerCase()} scenarios. Ready to start?`);
  }

  // ==========================================================================
  // GAMIFICATION UI
  // ==========================================================================
  function refreshGamificationUI() {
    xpValue.textContent = state.xp;
    const need = TutorEngine.xpForNextLevel();
    xpBarFill.style.width = `${Math.min(100, (state.xp / need) * 100)}%`;
    xpCaption.textContent = `${state.xp} / ${need} para el siguiente nivel`;
    streakValue.textContent = state.streak;
    accuracyValue.textContent = state.totalAnswers ? `${TutorEngine.accuracy()}%` : '—';
    timeValue.textContent = `${Math.max(0, Math.round(state.activeMs / 60000))}m`;
    refreshLevelTrack();
    renderLives();
    refreshBadges();
  }

  function renderLives() {
    livesRow.innerHTML = Array.from({ length: 3 }).map((_, i) =>
      `<span class="${i < state.lives ? '' : 'life-lost'}">❤️</span>`).join('');
  }

  function buildBadgeGrid() {
    badgeGrid.innerHTML = TutorEngine.BADGE_DEFS.map(b =>
      `<div class="badge" data-id="${b.id}" title="${b.id}">${b.icon}</div>`).join('');
  }
  function refreshBadges() {
    badgeGrid.querySelectorAll('.badge').forEach(el => {
      el.classList.toggle('is-unlocked', state.badges.includes(el.dataset.id));
    });
  }

  function showToast(msg) {
    const t = document.createElement('div');
    t.className = 'floating-toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2600);
  }

  // ==========================================================================
  // EXERCISE RENDERING
  // ==========================================================================
  function loadNewExercise() {
    answered = false;
    hintsUsedThisExercise = 0;
    feedbackPanel.hidden = true;
    retryBtn.hidden = true;
    checkBtn.disabled = false;
    checkBtn.textContent = 'Comprobar';

    const type = ExerciseEngine.randomType();
    currentExercise = ExerciseEngine.generate(type, state.profession, TutorEngine.level());
    exTypeChip.textContent = currentExercise.typeLabel;
    exercisePrompt.textContent = currentExercise.prompt;
    renderExerciseBody(currentExercise);
    Avatar.setExpression('neutral');
  }

  function renderExerciseBody(ex) {
    exerciseBody.innerHTML = '';
    if (ex.type === 'mc') renderMC(ex);
    else if (ex.type === 'fill') renderFill(ex);
    else if (ex.type === 'order') renderOrder(ex);
    else if (ex.type === 'error') renderErrorDetect(ex);
    else if (ex.type === 'match') renderMatch(ex);
  }

  function renderMC(ex) {
    const wrap = document.createElement('div');
    wrap.className = 'mc-options';
    let selected = null;
    ex.options.forEach((opt, i) => {
      const btn = document.createElement('button');
      btn.className = 'mc-option';
      btn.innerHTML = `<span class="letter">${String.fromCharCode(65 + i)}</span><span>${opt}</span>`;
      btn.addEventListener('click', () => {
        wrap.querySelectorAll('.mc-option').forEach(o => o.classList.remove('is-selected'));
        btn.classList.add('is-selected');
        selected = opt;
      });
      wrap.appendChild(btn);
    });
    exerciseBody.appendChild(wrap);
    getUserAnswer = () => selected;
  }

  function renderFill(ex) {
    const wrap = document.createElement('div');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'blank-input';
    input.placeholder = 'ej: have finished';
    input.autocomplete = 'off';
    wrap.appendChild(input);
    exerciseBody.appendChild(wrap);
    getUserAnswer = () => input.value;
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkBtn.click(); });
    setTimeout(() => input.focus(), 50);
  }

  function renderOrder(ex) {
    const answerRow = document.createElement('div');
    answerRow.className = 'order-row';
    answerRow.setAttribute('aria-label', 'Tu oración');
    const pool = document.createElement('div');
    pool.className = 'order-pool';

    let order = [];
    let remaining = [...ex.tokens];

    function draw() {
      answerRow.innerHTML = order.length ? '' : '<span class="empty-note" style="font-size:.78rem;">Haz clic en las palabras para construir la oración…</span>';
      order.forEach((w, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = w;
        chip.title = 'Clic para quitar';
        chip.addEventListener('click', () => { order.splice(i, 1); remaining.push(w); draw(); });
        answerRow.appendChild(chip);
      });
      pool.innerHTML = '';
      remaining.forEach((w, i) => {
        const chip = document.createElement('span');
        chip.className = 'chip';
        chip.textContent = w;
        chip.title = 'Clic para añadir';
        chip.addEventListener('click', () => { remaining.splice(i, 1); order.push(w); draw(); });
        pool.appendChild(chip);
      });
    }
    draw();
    exerciseBody.appendChild(answerRow);
    exerciseBody.appendChild(pool);
    getUserAnswer = () => order;
  }

  function renderErrorDetect(ex) {
    const p = document.createElement('p');
    p.className = 'error-detect-sentence';
    let selected = null;
    ex.words.forEach((w, i) => {
      const span = document.createElement('span');
      span.className = 'error-word';
      span.textContent = w + ' ';
      span.addEventListener('click', () => {
        p.querySelectorAll('.error-word').forEach(s => s.classList.remove('is-selected'));
        span.classList.add('is-selected');
        selected = w;
      });
      p.appendChild(span);
    });
    exerciseBody.appendChild(p);
    getUserAnswer = () => selected;
  }

  function renderMatch(ex) {
    const wrap = document.createElement('div');
    wrap.className = 'match-columns';
    const colL = document.createElement('div'); colL.className = 'match-col';
    const colR = document.createElement('div'); colR.className = 'match-col';

    let selL = null, selR = null;
    const pairs = []; // {signal, tense}
    const pairedSignals = new Set();

    function makeItem(text, col, isTenseCol) {
      const el = document.createElement('div');
      el.className = 'match-item';
      el.textContent = text;
      el.addEventListener('click', () => {
        if (el.classList.contains('is-paired')) return;
        if (!isTenseCol) {
          colL.querySelectorAll('.match-item').forEach(i => i.classList.remove('is-selected'));
          el.classList.add('is-selected');
          selL = text;
        } else {
          if (!selL) return;
          selR = text;
          pairs.push({ signal: selL, tense: selR });
          pairedSignals.add(selL);
          [...colL.children].find(i => i.textContent === selL)?.classList.add('is-paired');
          el.classList.add('is-paired');
          selL = null; selR = null;
          if (pairs.length === ex.left.length) checkBtn.disabled = false;
        }
      });
      col.appendChild(el);
    }
    ex.left.forEach(t => makeItem(t, colL, false));
    ex.right.forEach(t => makeItem(t, colR, true));
    wrap.appendChild(colL); wrap.appendChild(colR);
    exerciseBody.appendChild(wrap);
    checkBtn.disabled = true;
    getUserAnswer = () => {
      const allCorrect = ex.pairs.every(p => pairs.some(u => u.signal === p.signal && u.tense === p.tense));
      return allCorrect;
    };
  }

  // ==========================================================================
  // HINT / MIC / CHECK / NEXT
  // ==========================================================================
  hintBtn.addEventListener('click', () => {
    if (!currentExercise) return;
    hintsUsedThisExercise++;
    talkTutor(currentExercise.hint);
  });

  micBtn.addEventListener('click', () => {
    if (!SpeechModule.isRecognitionSupported) {
      talkTutor("Voice recognition isn't available in this browser, but you can type your answer instead.");
      return;
    }
    micBtn.classList.add('is-recording');
    micBtn.textContent = '🎙️ Escuchando…';
    SpeechModule.listen({
      onResult: (transcript) => {
        applySpokenAnswer(transcript);
        micBtn.classList.remove('is-recording');
        micBtn.textContent = '🎙️ Responder hablando';
      },
      onError: () => {
        micBtn.classList.remove('is-recording');
        micBtn.textContent = '🎙️ Responder hablando';
      },
      onEnd: () => {
        micBtn.classList.remove('is-recording');
        micBtn.textContent = '🎙️ Responder hablando';
      }
    });
  });

  function applySpokenAnswer(transcript) {
    if (!currentExercise) return;
    if (currentExercise.type === 'fill') {
      const input = exerciseBody.querySelector('.blank-input');
      if (input) input.value = transcript;
    } else if (currentExercise.type === 'mc') {
      const lower = transcript.toLowerCase();
      const match = [...exerciseBody.querySelectorAll('.mc-option')].find(btn => lower.includes(btn.textContent.trim().slice(2).toLowerCase().split(' ').slice(0, 2).join(' ')));
      if (match) match.click();
    } else if (currentExercise.type === 'order') {
      talkTutor('For ordering exercises, please tap the words instead of speaking — this keeps the sequence precise.');
    }
  }

  checkBtn.addEventListener('click', () => {
    if (!currentExercise || answered) return;
    const answer = getUserAnswer();
    if (answer === null || answer === undefined || answer === '' || (Array.isArray(answer) && answer.length === 0)) {
      talkTutor('Please provide an answer first — take your time.');
      return;
    }
    answered = true;
    const result = TutorEngine.evaluate(currentExercise, answer);
    showFeedback(result, answer);
    refreshGamificationUI();
  });

  function showFeedback(result, userAnswer) {
    feedbackPanel.hidden = false;
    feedbackPanel.className = `feedback-panel ${result.correct ? 'is-correct' : 'is-incorrect'}`;
    feedbackIcon.textContent = result.correct ? '✅' : '📝';
    feedbackTitle.textContent = result.correct ? pickPraise() : 'Good attempt.';
    feedbackExplain.innerHTML = result.explanation;

    markAnswerVisual(result.correct, userAnswer);

    if (result.correct) {
      Avatar.celebrate();
      talkTutor(stripHtml(result.explanation), result.explanation);
      if (result.xpGained) showToast(`+${result.xpGained} XP`);
      if (result.leveledUp) showToast(`🚀 ¡Subiste a nivel ${result.level}!`);
      retryBtn.hidden = true;
    } else {
      Avatar.sympathize();
      talkTutor(stripHtml(result.explanation), result.explanation);
      retryBtn.hidden = result.lives <= 0;
      if (result.lives <= 0) {
        feedbackExplain.innerHTML += `<br><br>Te quedaste sin vidas por ahora. No pasa nada — revisa la explicación y continúa cuando quieras.`;
        setTimeout(() => TutorEngine.reviveLives(), 300);
      }
    }
    checkBtn.disabled = true;
  }

  function markAnswerVisual(correct, userAnswer) {
    if (!currentExercise) return;
    if (currentExercise.type === 'mc') {
      exerciseBody.querySelectorAll('.mc-option').forEach(btn => {
        const text = btn.querySelector('span:last-child').textContent;
        if (text === currentExercise.correctAnswer) btn.classList.add('is-correct');
        else if (btn.classList.contains('is-selected') && !correct) btn.classList.add('is-wrong');
      });
    } else if (currentExercise.type === 'error') {
      exerciseBody.querySelectorAll('.error-word').forEach((s, i) => {
        if (i === currentExercise.errorIndex) s.style.background = 'var(--teal-soft)';
      });
    }
  }

  function pickPraise() {
    return pick(['Excellent!', 'Great job!', 'Well done!', 'Perfect!', 'Nice work!']);
  }
  function stripHtml(html) { return html.replace(/<[^>]+>/g, ''); }

  retryBtn.addEventListener('click', () => {
    answered = false;
    feedbackPanel.hidden = true;
    checkBtn.disabled = false;
    renderExerciseBody(currentExercise); // reset inputs, keep same exercise
  });

  nextBtn.addEventListener('click', loadNewExercise);

  // ==========================================================================
  // CONVERSATION MODE
  // ==========================================================================
  function addConvoMsg(text, who, explain) {
    const div = document.createElement('div');
    div.className = `convo-msg ${who}`;
    div.innerHTML = `${text}${explain ? `<span class="explain">${explain}</span>` : ''}`;
    convoLog.appendChild(div);
    convoLog.scrollTop = convoLog.scrollHeight;
  }

  const IRREGULAR_PARTICIPLES = ['been','gone','done','seen','written','taken','made','given','known','said','found','brought','built','met','run','sent','had','told','left','shown','begun','broken','chosen','felt','kept','paid','held'];

  function analyzeConversation(text) {
    const lower = text.toLowerCase();
    const hasPresentPerfect = /\b(have|has)\s+(\w+ed\b|been\b|gone\b|done\b|seen\b|written\b|taken\b|made\b|given\b|known\b|said\b|found\b|brought\b|built\b|met\b|run\b|sent\b)/.test(lower);
    const hasPastPerfect = /\bhad\s+(\w+ed\b|been\b|gone\b|done\b|seen\b|written\b|taken\b|made\b|given\b|known\b|said\b|found\b|brought\b|built\b|met\b|run\b|sent\b)/.test(lower);
    const presentSignal = /(already|just now|\byet\b|\bsince\b|\bfor\s+\d|\bever\b|\bnever\b|so far)/.test(lower);
    const pastSignal = /(before|after|by the time|\bwhen\b)/.test(lower);

    let title, explain, correct;
    if (hasPastPerfect && pastSignal) {
      correct = true; title = 'Excellent!';
      explain = 'Usaste correctamente <strong>had + participio</strong> junto con una señal de secuencia pasada. Eso es exactamente Past Perfect.';
    } else if (hasPresentPerfect && (presentSignal || !pastSignal)) {
      correct = true; title = 'Great job!';
      explain = 'Usaste correctamente <strong>have/has + participio</strong>, conectando la acción con el presente. Eso es Present Perfect.';
    } else if (hasPastPerfect && !pastSignal) {
      correct = false; title = 'Good attempt.';
      explain = 'Detecté <strong>had + participio</strong> (Past Perfect), pero no una señal clara de secuencia (before / after / by the time). Agrega una segunda acción pasada para que quede claro cuál ocurrió primero.';
    } else if (hasPresentPerfect) {
      correct = true; title = 'Good!';
      explain = 'Usaste Present Perfect correctamente. Si quieres practicar Past Perfect, describe qué había pasado <em>antes</em> de otro evento pasado.';
    } else if (pastSignal && !hasPastPerfect) {
      correct = false; title = 'Good attempt.';
      explain = 'Veo la palabra de secuencia ("before"/"after"/"when"), pero no encontré la estructura <strong>had + participio</strong>. Recuerda: la acción anterior necesita Past Perfect.';
    } else {
      correct = false; title = 'Good attempt.';
      explain = 'No detecté claramente Present Perfect (have/has + participio) ni Past Perfect (had + participio). Intenta reformular usando una de esas estructuras — por ejemplo: "The team had finished the report before the audit began."';
    }
    return { correct, title, explain };
  }

  function sendConvo() {
    const text = convoInput.value.trim();
    if (!text) return;
    addConvoMsg(text, 'user');
    convoInput.value = '';
    const result = analyzeConversation(text);
    addConvoMsg(result.title, 'tutor', result.explain);
    Avatar[result.correct ? 'celebrate' : 'sympathize']();
    if (state.voiceEnabled) Avatar.talk(stripHtml(result.title + '. ' + result.explain));
    if (result.correct) {
      state.xp += 4; TutorEngine.persist(); refreshGamificationUI();
    }
  }
  convoSendBtn.addEventListener('click', sendConvo);
  convoInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendConvo(); });
  convoMicBtn.addEventListener('click', () => {
    if (!SpeechModule.isRecognitionSupported) return;
    convoMicBtn.classList.add('is-recording');
    SpeechModule.listen({
      onResult: (t) => { convoInput.value = t; convoMicBtn.classList.remove('is-recording'); },
      onEnd: () => convoMicBtn.classList.remove('is-recording'),
      onError: () => convoMicBtn.classList.remove('is-recording'),
    });
  });

  // seed conversation with an opening scenario line
  addConvoMsg(`Tell me about something ${PROFESSIONS[state.profession].subjects[0].text} has already done today, or something that had happened before an event in your field.`, 'tutor');

});
