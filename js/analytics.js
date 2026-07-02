/* ==========================================================================
   analytics.js
   Renders the Progress panel from TutorEngine's stored state: accuracy,
   time spent, per-type performance, frequent error patterns, and
   plain-language recommendations for what to practice next.
   ========================================================================== */

const AnalyticsPanel = (() => {

  function minutesActive(state) {
    return Math.max(0, Math.round(state.activeMs / 60000));
  }

  function typeBreakdown(state) {
    return Object.entries(state.typeCounts).map(([type, count]) => {
      const correct = state.typeCorrect[type] || 0;
      const pct = count ? Math.round((correct / count) * 100) : 0;
      return { type, label: ExerciseEngine.TYPE_LABELS[type] || type, count, pct };
    }).sort((a, b) => b.count - a.count);
  }

  function errorFrequency(state) {
    const freq = {};
    state.errorLog.forEach(e => {
      const key = e.tense === 'present' ? 'Present Perfect' : e.tense === 'past' ? 'Past Perfect' : 'Otro';
      freq[key] = (freq[key] || 0) + 1;
    });
    return freq;
  }

  function recommendations(state) {
    const recs = [];
    const weak = TutorEngine.weakestTense();
    if (weak === 'present') recs.push('Refuerza señales de Present Perfect: already, just, yet, since, for.');
    if (weak === 'past') recs.push('Refuerza la secuencia de dos acciones pasadas con Past Perfect (before / by the time).');
    const breakdown = typeBreakdown(state);
    const weakestType = breakdown.filter(t => t.count >= 2).sort((a, b) => a.pct - b.pct)[0];
    if (weakestType && weakestType.pct < 70) {
      recs.push(`Practica más ejercicios de tipo "${weakestType.label}" — tu precisión ahí es ${weakestType.pct}%.`);
    }
    if (state.lives <= 1) recs.push('Tómate un descanso breve antes de continuar; tus vidas están bajas.');
    if (TutorEngine.accuracy() >= 85 && state.totalAnswers >= 10) recs.push('Estás listo para subir de nivel — intenta el modo Conversación para un reto mayor.');
    if (recs.length === 0) recs.push('Sigue practicando para desbloquear recomendaciones personalizadas.');
    return recs;
  }

  function render(container) {
    const state = TutorEngine.getState();
    const acc = TutorEngine.accuracy();
    const breakdown = typeBreakdown(state);
    const errFreq = errorFrequency(state);
    const recs = recommendations(state);
    const maxTypeCount = Math.max(1, ...breakdown.map(t => t.count));
    const maxErr = Math.max(1, ...Object.values(errFreq));

    container.innerHTML = `
      <div class="analytics-card">
        <h3>Precisión general</h3>
        <div class="big-stat">${state.totalAnswers ? acc + '%' : '—'}</div>
        <p class="empty-note">${state.totalAnswers} ejercicios respondidos</p>
      </div>

      <div class="analytics-card">
        <h3>Nivel alcanzado</h3>
        <div class="big-stat">${TutorEngine.level()}</div>
        <p class="empty-note">Racha máxima: ${state.bestStreak}</p>
      </div>

      <div class="analytics-card">
        <h3>Tiempo activo</h3>
        <div class="big-stat">${minutesActive(state)}m</div>
        <p class="empty-note">Desde ${new Date(state.startedAt).toLocaleDateString('es-EC')}</p>
      </div>

      <div class="analytics-card">
        <h3>Competencias dominadas</h3>
        <div class="big-stat">${state.badges.length}/${TutorEngine.BADGE_DEFS.length}</div>
        <p class="empty-note">Logros desbloqueados</p>
      </div>

      <div class="analytics-card wide">
        <h3>Desempeño por tipo de ejercicio</h3>
        ${breakdown.length ? breakdown.map(t => `
          <div class="bar-row">
            <span class="bar-label">${t.label}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(t.count / maxTypeCount) * 100}%"></div></div>
            <span class="bar-num">${t.pct}%</span>
          </div>`).join('') : '<p class="empty-note">Aún no hay datos suficientes.</p>'}
      </div>

      <div class="analytics-card wide">
        <h3>Errores frecuentes por tiempo verbal</h3>
        ${Object.keys(errFreq).length ? Object.entries(errFreq).map(([k, v]) => `
          <div class="bar-row">
            <span class="bar-label">${k}</span>
            <div class="bar-track"><div class="bar-fill" style="width:${(v / maxErr) * 100}%; background:var(--coral);"></div></div>
            <span class="bar-num">${v}</span>
          </div>`).join('') : '<p class="empty-note">Sin errores registrados todavía — ¡buen trabajo!</p>'}
      </div>

      <div class="analytics-card wide">
        <h3>Recomendaciones</h3>
        <ul class="recommend-list">${recs.map(r => `<li>${r}</li>`).join('')}</ul>
      </div>
    `;
  }

  return { render };
})();
