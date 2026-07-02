/* ==========================================================================
   scenarios.js
   Defines the four professional fields the tutor can generate exercises for.
   Each profession carries: label, icon, an SVG "dossier" backdrop (consistent
   thin-line illustration system), a subject/verb/object word bank used by
   exercises.js to build sentences, and short scenario blurbs for the dossier
   panel and conversation mode.
   ========================================================================== */

const PROFESSIONS = {

  health: {
    id: 'health',
    label: 'Salud',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 21s-7-4.6-9.5-9C.7 8.3 2 4.5 5.6 4.1c2-.2 3.6.8 4.4 2.4C10.8 4.9 12.4 3.9 14.4 4.1c3.6.4 4.9 4.2 3.1 7.9C15 16.4 12 21 12 21Z"/><path d="M8 12h2l1-2 2 4 1-2h2"/></svg>',
    subjects: [
      { text: 'the nurse', plural: false }, { text: 'the surgeon', plural: false },
      { text: 'the paramedics', plural: true }, { text: 'Dr. Andrade', plural: false },
      { text: 'the lab technician', plural: false }
    ],
    scenes: ['Hospital / Emergencias', 'Consulta médica', 'Laboratorio clínico', 'Quirófano', 'Unidad de cuidados intensivos'],
    verbs: [
      { base: 'stabilize', part: 'stabilized', past: 'stabilized', es: 'estabilizar' },
      { base: 'diagnose', part: 'diagnosed', past: 'diagnosed', es: 'diagnosticar' },
      { base: 'administer', part: 'administered', past: 'administered', es: 'administrar (un medicamento)' },
      { base: 'examine', part: 'examined', past: 'examined', es: 'examinar' },
      { base: 'operate on', part: 'operated on', past: 'operated on', es: 'operar a' },
      { base: 'discharge', part: 'discharged', past: 'discharged', es: 'dar de alta a' },
    ],
    objects: ['the patient', 'three patients', 'the results', 'the wound', 'the medication chart'],
    blurb: (level) => `Sala de emergencias, turno nocturno. Nivel ${level}: describe procedimientos clínicos usando el tiempo correcto.`,
    scene: () => `
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMax slice">
        <defs><linearGradient id="hGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--violet)" stop-opacity=".15"/>
          <stop offset="1" stop-color="var(--violet)" stop-opacity="0"/>
        </linearGradient></defs>
        <rect x="0" y="0" width="640" height="320" fill="url(#hGrad)"/>
        <g stroke="var(--amber)" stroke-width="1.3" fill="none" opacity=".55">
          <rect x="40" y="60" width="150" height="90" rx="6"/>
          <polyline points="40,105 65,105 75,85 90,125 105,95 120,105 190,105" stroke-width="2"/>
          <circle cx="70" cy="70" r="4" fill="var(--amber)" stroke="none"/>
          <path d="M300 240 h60 M330 210 v60" stroke-width="4" stroke-linecap="round" opacity=".7"/>
          <circle cx="330" cy="240" r="46" opacity=".35"/>
          <rect x="450" y="70" width="120" height="160" rx="10" opacity=".4"/>
          <line x1="450" y1="110" x2="570" y2="110" opacity=".4"/>
          <line x1="450" y1="150" x2="570" y2="150" opacity=".4"/>
        </g>
      </svg>`
  },

  engineering: {
    id: 'engineering',
    label: 'Ingeniería',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3.2"/><path d="M19.4 13.5a7.6 7.6 0 0 0 0-3l2-1.5-2-3.4-2.3.9a7.6 7.6 0 0 0-2.6-1.5L14 2.5h-4l-.5 2.5a7.6 7.6 0 0 0-2.6 1.5l-2.3-.9-2 3.4 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.4 2.3-.9c.77.66 1.65 1.17 2.6 1.5l.5 2.5h4l.5-2.5a7.6 7.6 0 0 0 2.6-1.5l2.3.9 2-3.4-2-1.5Z"/></svg>',
    subjects: [
      { text: 'the engineers', plural: true }, { text: 'the automation team', plural: false },
      { text: 'the site supervisor', plural: false }, { text: 'the QA department', plural: false },
      { text: 'the robotics lab', plural: false }
    ],
    scenes: ['Planta industrial', 'Obra de construcción', 'Laboratorio de robótica', 'Línea de automatización', 'Oficina de software'],
    verbs: [
      { base: 'test', part: 'tested', past: 'tested', es: 'probar' },
      { base: 'assemble', part: 'assembled', past: 'assembled', es: 'ensamblar' },
      { base: 'calibrate', part: 'calibrated', past: 'calibrated', es: 'calibrar' },
      { base: 'deploy', part: 'deployed', past: 'deployed', es: 'desplegar' },
      { base: 'inspect', part: 'inspected', past: 'inspected', es: 'inspeccionar' },
      { base: 'design', part: 'designed', past: 'designed', es: 'diseñar' },
    ],
    objects: ['the prototype', 'the new sensor array', 'the production line', 'the software module', 'the bridge structure'],
    blurb: (level) => `Planta de manufactura, previo a auditoría técnica. Nivel ${level}: reporta avances de ingeniería con precisión temporal.`,
    scene: () => `
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMax slice">
        <defs><linearGradient id="eGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--teal)" stop-opacity=".14"/>
          <stop offset="1" stop-color="var(--teal)" stop-opacity="0"/>
        </linearGradient></defs>
        <rect x="0" y="0" width="640" height="320" fill="url(#eGrad)"/>
        <g stroke="var(--amber)" stroke-width="1.3" fill="none" opacity=".55">
          <circle cx="90" cy="120" r="34"/>
          <circle cx="90" cy="120" r="10"/>
          <g>
            <line x1="90" y1="72" x2="90" y2="86"/><line x1="90" y1="154" x2="90" y2="168"/>
            <line x1="42" y1="120" x2="56" y2="120"/><line x1="124" y1="120" x2="138" y2="120"/>
          </g>
          <circle cx="150" cy="170" r="20"/>
          <rect x="330" y="60" width="220" height="150" rx="4" opacity=".4"/>
          <line x1="330" y1="100" x2="550" y2="100" opacity=".35"/>
          <line x1="330" y1="140" x2="550" y2="140" opacity=".35"/>
          <line x1="400" y1="60" x2="400" y2="210" opacity=".35"/>
          <path d="M470 210 v-70 l30 -20" opacity=".5"/>
        </g>
      </svg>`
  },

  accounting: {
    id: 'accounting',
    label: 'Contabilidad',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3.5" y="3.5" width="17" height="17" rx="2"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="8" y1="16" x2="12.5" y2="16"/></svg>',
    subjects: [
      { text: 'the accountant', plural: false }, { text: 'the auditors', plural: true },
      { text: 'the finance department', plural: false }, { text: 'the controller', plural: false },
      { text: 'the tax office', plural: false }
    ],
    scenes: ['Auditoría anual', 'Cierre financiero', 'Revisión de impuestos', 'Departamento de facturación', 'Reunión con el banco'],
    verbs: [
      { base: 'reconcile', part: 'reconciled', past: 'reconciled', es: 'conciliar' },
      { base: 'audit', part: 'audited', past: 'audited', es: 'auditar' },
      { base: 'file', part: 'filed', past: 'filed', es: 'presentar (una declaración)' },
      { base: 'approve', part: 'approved', past: 'approved', es: 'aprobar' },
      { base: 'review', part: 'reviewed', past: 'reviewed', es: 'revisar' },
      { base: 'submit', part: 'submitted', past: 'submitted', es: 'enviar' },
    ],
    objects: ['the report', 'the quarterly accounts', 'the tax return', 'the invoice', 'the budget forecast'],
    blurb: (level) => `Cierre de trimestre fiscal. Nivel ${level}: comunica el estado de procesos financieros con el tiempo verbal correcto.`,
    scene: () => `
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMax slice">
        <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--amber)" stop-opacity=".16"/>
          <stop offset="1" stop-color="var(--amber)" stop-opacity="0"/>
        </linearGradient></defs>
        <rect x="0" y="0" width="640" height="320" fill="url(#aGrad)"/>
        <g stroke="var(--amber)" stroke-width="1.3" fill="none" opacity=".55">
          <rect x="60" y="70" width="180" height="130" rx="4"/>
          <line x1="60" y1="100" x2="240" y2="100"/>
          <line x1="60" y1="130" x2="240" y2="130"/>
          <line x1="60" y1="160" x2="240" y2="160"/>
          <line x1="120" y1="70" x2="120" y2="200"/>
          <line x1="180" y1="70" x2="180" y2="200"/>
          <polyline points="380,190 420,140 460,165 510,90" stroke-width="2"/>
          <circle cx="510" cy="90" r="4" fill="var(--amber)" stroke="none"/>
          <rect x="380" y="60" width="180" height="150" rx="4" opacity=".3"/>
        </g>
      </svg>`
  },

  law: {
    id: 'law',
    label: 'Derecho',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 3v18M5 21h14M12 3 6 7m6-4 6 4"/><path d="M4 7l-2.5 5a2.5 2.5 0 0 0 5 0L4 7Z"/><path d="M20 7l-2.5 5a2.5 2.5 0 0 0 5 0L20 7Z"/></svg>',
    subjects: [
      { text: 'the lawyer', plural: false }, { text: 'the prosecutor', plural: false },
      { text: 'the defense team', plural: false }, { text: 'the judge', plural: false },
      { text: 'the witnesses', plural: true }
    ],
    scenes: ['Sala de audiencias', 'Firma de contrato', 'Fiscalía', 'Tribunal de apelaciones', 'Reunión con el cliente'],
    verbs: [
      { base: 'present', part: 'presented', past: 'presented', es: 'presentar' },
      { base: 'sign', part: 'signed', past: 'signed', es: 'firmar' },
      { base: 'review', part: 'reviewed', past: 'reviewed', es: 'revisar' },
      { base: 'file', part: 'filed', past: 'filed', es: 'presentar (una demanda)' },
      { base: 'testify', part: 'testified', past: 'testified', es: 'testificar' },
      { base: 'appeal', part: 'appealed', past: 'appealed', es: 'apelar' },
    ],
    objects: ['the case', 'all the documents', 'the contract', 'the verdict', 'the evidence'],
    blurb: (level) => `Antes de la audiencia principal. Nivel ${level}: narra procedimientos legales respetando la secuencia temporal.`,
    scene: () => `
      <svg viewBox="0 0 640 320" preserveAspectRatio="xMidYMax slice">
        <defs><linearGradient id="lGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="var(--coral)" stop-opacity=".12"/>
          <stop offset="1" stop-color="var(--coral)" stop-opacity="0"/>
        </linearGradient></defs>
        <rect x="0" y="0" width="640" height="320" fill="url(#lGrad)"/>
        <g stroke="var(--amber)" stroke-width="1.3" fill="none" opacity=".55">
          <line x1="90" y1="60" x2="90" y2="220"/>
          <line x1="60" y1="60" x2="120" y2="60"/>
          <path d="M60 90 l-20 40 a20 12 0 0 0 40 0 Z"/>
          <path d="M120 90 l-20 40 a20 12 0 0 0 40 0 Z"/>
          <line x1="60" y1="220" x2="120" y2="220"/>
          <rect x="380" y="80" width="180" height="120" rx="6" opacity=".4"/>
          <line x1="400" y1="110" x2="540" y2="110" opacity=".4"/>
          <line x1="400" y1="130" x2="540" y2="130" opacity=".4"/>
          <line x1="400" y1="150" x2="480" y2="150" opacity=".4"/>
          <path d="M410 175 q10 -15 20 0 q10 -15 20 0" opacity=".6"/>
        </g>
      </svg>`
  }
};

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

// Vocabulary / hint density per level — used by tutor.js to shape difficulty.
const LEVEL_CONFIG = {
  A1: { hintsAvailable: 3, sentenceComplexity: 1, distractors: 2 },
  A2: { hintsAvailable: 3, sentenceComplexity: 1, distractors: 3 },
  B1: { hintsAvailable: 2, sentenceComplexity: 2, distractors: 3 },
  B2: { hintsAvailable: 2, sentenceComplexity: 2, distractors: 3 },
  C1: { hintsAvailable: 1, sentenceComplexity: 3, distractors: 4 },
  C2: { hintsAvailable: 1, sentenceComplexity: 3, distractors: 4 },
};
