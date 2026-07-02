/* ==========================================================================
   exercises.js
   Generates exercises on the fly by combining profession vocabulary
   (scenarios.js) with grammar templates for Present Perfect and Past
   Perfect. Nothing is hardcoded per-profession beyond the word banks —
   this is the "AI engine" that keeps content fresh every attempt.
   ========================================================================== */

const ExerciseEngine = (() => {

  const PRESENT_MARKERS = ['already', 'just', 'yet', 'ever', 'never', 'so far', 'recently'];
  const PRESENT_DURATION = (y) => Math.random() < 0.5 ? `for ${y} years` : `since 20${18 + (y % 6)}`;
  const PAST_CONNECTORS = ['before', 'after', 'by the time', 'when'];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function aux(subject, tense) {
    if (tense === 'past') return 'had';
    return subject.plural ? 'have' : 'has';
  }

  /** Build one Present Perfect clause. */
  function presentPerfectClause(profession) {
    const subject = pick(profession.subjects);
    const verb = pick(profession.verbs);
    const object = pick(profession.objects);
    const useDuration = Math.random() < 0.4;
    const marker = useDuration ? PRESENT_DURATION(2 + Math.floor(Math.random() * 5)) : pick(PRESENT_MARKERS);
    const markerBefore = ['already', 'just', 'never', 'ever'].includes(marker);
    return {
      tense: 'present',
      subject, verb, object, marker,
      auxiliary: aux(subject, 'present'),
      render(withBlank) {
        const verbPhrase = withBlank ? '_____' : `${this.auxiliary} ${markerBefore ? marker + ' ' : ''}${verb.part}`;
        const tail = markerBefore ? '' : ` ${marker}`;
        return `${cap(subject.text)} ${verbPhrase} ${object}${tail}.`;
      },
      correctPhrase: `${aux(subject, 'present')} ${verb.part}`,
    };
  }

  /** Build one Past Perfect two-clause sentence: [had-clause] connector [simple past clause]. */
  function pastPerfectClause(profession) {
    const subject = pick(profession.subjects);
    const verb = pick(profession.verbs);
    const object = pick(profession.objects);
    const secondSubject = pick(profession.subjects.filter(s => s.text !== subject.text)) || subject;
    const secondVerb = pick(profession.verbs.filter(v => v.base !== verb.base)) || verb;
    const connector = pick(PAST_CONNECTORS);
    const secondClauseFirst = connector === 'before' || connector === 'when' ? Math.random() < 0.5 : true;

    return {
      tense: 'past',
      subject, verb, object, connector, secondSubject, secondVerb,
      auxiliary: 'had',
      render(withBlank) {
        const perfectClause = `${cap(subject.text)} ${withBlank ? '_____' : 'had ' + verb.part} ${object}`;
        const simpleClause = `${connector} ${secondSubject.text} ${secondVerb.past} the case`.replace('the case', pick(profession.objects));
        return secondClauseFirst
          ? `${cap(simpleClause)}, ${perfectClause.charAt(0).toLowerCase() + perfectClause.slice(1)}.`
          : `${perfectClause} ${simpleClause}.`;
      },
      correctPhrase: `had ${verb.part}`,
    };
  }

  function buildClause(profession, forcedTense) {
    const tense = forcedTense || (Math.random() < 0.5 ? 'present' : 'past');
    return tense === 'present' ? presentPerfectClause(profession) : pastPerfectClause(profession);
  }

  // ---- Distractor verb phrases (wrong tense options) ----
  function distractorsFor(clause, count) {
    const { subject, verb } = clause;
    const pool = clause.tense === 'present'
      ? [`had ${verb.part}`, `${subject.plural ? 'have' : 'has'} ${verb.base}`, `was ${verb.part}`, `${verb.past}`]
      : [`${subject.plural ? 'have' : 'has'} ${verb.part}`, `have ${verb.base}`, `${verb.past}`, `was ${verb.part}`];
    const unique = [...new Set(pool)].filter(p => p !== clause.correctPhrase);
    const shuffled = unique.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  function explanationFor(clause) {
    if (clause.tense === 'present') {
      return `Correcto: se usa <strong>Present Perfect</strong> (${clause.auxiliary} + participio) porque la acción de "${clause.verb.es}" está conectada con el presente — la señal "${clause.marker}" lo confirma. No importa el momento exacto, importa el resultado ahora.`;
    }
    return `Correcto: se usa <strong>Past Perfect</strong> (had + participio) porque esta acción ("${clause.verb.es}") ocurrió <strong>antes</strong> que la otra acción pasada mencionada en la oración (conector "${clause.connector}"). Es el "pasado del pasado".`;
  }

  function wrongExplanationFor(clause, chosenPhrase) {
    if (clause.tense === 'present') {
      return `No es correcto. Aquí necesitamos <strong>Present Perfect</strong>, no "${chosenPhrase}". La señal temporal indica una conexión con el presente (resultado visible ahora), así que el verbo debe ser <strong>${clause.correctPhrase}</strong>.`;
    }
    return `No es correcto. Esta acción sucedió antes que otra acción pasada (fíjate en "${clause.connector}"), por lo tanto se necesita <strong>Past Perfect</strong>: <strong>${clause.correctPhrase}</strong>, no "${chosenPhrase}".`;
  }

  // ---------------- Exercise type builders ----------------

  function makeMultipleChoice(profession, level) {
    const clause = buildClause(profession);
    const nDistractors = LEVEL_CONFIG[level].distractors;
    const distractors = distractorsFor(clause, nDistractors);
    const options = [...distractors, clause.correctPhrase].sort(() => Math.random() - 0.5);
    return {
      type: 'mc',
      tense: clause.tense,
      prompt: clause.render(true),
      options,
      correctAnswer: clause.correctPhrase,
      explanation: explanationFor(clause),
      wrongExplanation: (chosen) => wrongExplanationFor(clause, chosen),
      hint: `Piensa: ¿la acción de "${clause.verb.es}" está conectada con el presente, o pasó antes de otra acción pasada?`,
    };
  }

  function makeFillBlank(profession, level) {
    const clause = buildClause(profession);
    return {
      type: 'fill',
      tense: clause.tense,
      prompt: clause.render(true),
      correctAnswer: clause.correctPhrase.toLowerCase(),
      explanation: explanationFor(clause),
      wrongExplanation: (chosen) => wrongExplanationFor(clause, chosen) + ` (Tu respuesta: "${chosen}")`,
      hint: `La estructura es: ${clause.tense === 'present' ? clause.auxiliary + ' + participio' : 'had + participio'}. El participio de "${clause.verb.base}" es "${clause.verb.part}".`,
    };
  }

  function makeSentenceOrdering(profession, level) {
    const clause = buildClause(profession);
    const full = clause.render(false);
    const cleanSentence = full.replace(/[,.]/g, '');
    const words = cleanSentence.split(' ').filter(Boolean);
    const scrambled = [...words].sort(() => Math.random() - 0.5);
    return {
      type: 'order',
      tense: clause.tense,
      prompt: 'Ordena las palabras para formar una oración correcta:',
      tokens: scrambled,
      correctOrder: words,
      correctAnswer: words.join(' '),
      explanation: explanationFor(clause),
      wrongExplanation: () => `El orden correcto es: <strong>"${words.join(' ')}."</strong> ${explanationFor(clause)}`,
      hint: `La oración empieza con "${words[0]}".`,
    };
  }

  /** For Error Detection: change exactly ONE word (auxiliary OR participle) so the
   *  broken sentence has a single, unambiguous error to click on. */
  function singleWordError(clause) {
    const useAuxError = Math.random() < 0.5;
    if (useAuxError) {
      const correctAux = clause.tense === 'present' ? clause.auxiliary : 'had';
      const wrongAux = clause.tense === 'present' ? 'had' : (clause.subject.plural ? 'have' : 'has');
      return { phrase: `${wrongAux} ${clause.verb.part}`, diffIndex: 0 };
    }
    const aux = clause.tense === 'present' ? clause.auxiliary : 'had';
    return { phrase: `${aux} ${clause.verb.base}`, diffIndex: 1 }; // wrong verb form (base instead of participle)
  }

  function makeErrorDetection(profession, level) {
    const clause = buildClause(profession);
    const correctSentence = clause.render(false).replace(/[.]$/, '');
    const { phrase: wrongPhrase } = singleWordError(clause);
    const brokenSentence = correctSentence.replace(clause.correctPhrase, wrongPhrase);
    const words = brokenSentence.split(' ');
    const wrongWords = wrongPhrase.split(' ');
    const correctWords = clause.correctPhrase.split(' ');
    let errorIndex = words.findIndex((w, i) =>
      w.toLowerCase() === wrongWords[0].toLowerCase() && (words[i + 1] || '').toLowerCase() === wrongWords[1].toLowerCase()
    );
    // shift to the specific word that actually differs from the correct phrase
    if (errorIndex !== -1) {
      const diffOffset = wrongWords[0] !== correctWords[0] ? 0 : 1;
      errorIndex += diffOffset;
    } else {
      errorIndex = Math.floor(words.length / 2);
    }
    return {
      type: 'error',
      tense: clause.tense,
      prompt: 'Haz clic en la palabra que contiene el error gramatical:',
      words,
      errorIndex,
      correctAnswer: words[errorIndex],
      explanation: `Encontraste el error. ${explanationFor(clause)} La forma correcta es "${clause.correctPhrase}", no "${wrongPhrase}".`,
      wrongExplanation: () => `Esa palabra está bien. El error real está en "${words[errorIndex]}" — se necesita <strong>${clause.correctPhrase}</strong> en lugar de "${wrongPhrase}".`,
      hint: `Busca el verbo principal de la oración y revisa su forma auxiliar o su participio.`,
    };
  }

  function makeMatchColumns(profession, level) {
    const items = [
      { signal: 'already / just / yet', tense: 'Present Perfect' },
      { signal: 'since 2021 / for 3 years', tense: 'Present Perfect' },
      { signal: 'before / by the time', tense: 'Past Perfect' },
      { signal: 'ever / never (experiencia de vida)', tense: 'Present Perfect' },
      { signal: 'when + acción pasada anterior', tense: 'Past Perfect' },
    ];
    const shuffledRight = [...items].sort(() => Math.random() - 0.5);
    return {
      type: 'match',
      tense: 'mixed',
      prompt: 'Empareja cada señal temporal con el tiempo verbal correcto:',
      left: items.map(i => i.signal),
      right: shuffledRight.map(i => i.tense),
      pairs: items.map(i => ({ signal: i.signal, tense: i.tense })),
      correctAnswer: 'all-paired',
      explanation: `Las señales "already, just, yet, ever, never, since, for" apuntan a <strong>Present Perfect</strong> (conexión con el presente). Las señales "before, after, by the time, when + pasado" apuntan a <strong>Past Perfect</strong> (una acción antes que otra en el pasado).`,
      wrongExplanation: () => `Revisa: already/just/yet/ever/never/since/for → Present Perfect. before/by the time/when(+pasado anterior) → Past Perfect.`,
      hint: `Pregúntate: ¿la señal habla del presente (Present Perfect) o de secuencia entre dos pasados (Past Perfect)?`,
    };
  }

  const BUILDERS = {
    mc: makeMultipleChoice,
    fill: makeFillBlank,
    order: makeSentenceOrdering,
    error: makeErrorDetection,
    match: makeMatchColumns,
  };

  const TYPE_LABELS = {
    mc: 'Multiple Choice', fill: 'Fill in the Blank', order: 'Sentence Ordering',
    error: 'Error Detection', match: 'Match Columns',
  };

  function generate(type, professionId, level) {
    const profession = PROFESSIONS[professionId] || PROFESSIONS.health;
    const builder = BUILDERS[type] || BUILDERS.mc;
    const ex = builder(profession, level);
    ex.typeLabel = TYPE_LABELS[type];
    ex.id = `${type}-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
    return ex;
  }

  function randomType(excludeMatchWeight = false) {
    const weighted = ['mc', 'mc', 'fill', 'fill', 'order', 'error', 'match'];
    return pick(weighted);
  }

  return { generate, randomType, TYPE_LABELS };
})();
