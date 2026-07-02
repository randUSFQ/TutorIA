# Perfecta — Tutor Inteligente de Present Perfect & Past Perfect

Tutor de inglés hiperrealista (avatar animado, voz, escenarios profesionales,
gamificación y analítica) enfocado en **Present Perfect** y **Past Perfect**,
construido en HTML5 + CSS3 + JavaScript puro (sin frameworks ni build step).

## Cómo ejecutarlo localmente

No requiere instalación de dependencias. Solo necesitas servir los archivos
estáticos (abrir `index.html` directamente con doble clic también funciona,
pero un servidor local evita restricciones de algunos navegadores con
`SpeechRecognition`):

```bash
cd perfecta-tutor
python3 -m http.server 8080
# luego abre http://localhost:8080 en Chrome o Edge (mejor soporte de Web Speech API)
```

o con Node:

```bash
npx serve .
```

**Recomendado:** Google Chrome o Microsoft Edge de escritorio, con micrófono
habilitado si quieres usar el reconocimiento de voz. Firefox/Safari soportan
la síntesis de voz (el tutor hablando) pero tienen soporte limitado o nulo
de `SpeechRecognition` — la app lo detecta automáticamente y oculta/avisa
cuando no está disponible, sin romper el resto de la experiencia.

## Qué incluye esta versión

- **Aprender**: explicación clara de Present Perfect vs. Past Perfect con
  señales temporales y ejemplos por profesión.
- **Practicar**: generación dinámica e infinita de ejercicios (Multiple
  Choice, Fill in the Blank, Sentence Ordering, Error Detection, Match
  Columns) combinando plantillas gramaticales con bancos de vocabulario de
  4 campos profesionales (Salud, Ingeniería, Contabilidad, Derecho).
  Cada respuesta —correcta o no— recibe una explicación, nunca solo
  "Correct/Incorrect".
- **Conversación**: modo de práctica libre con reconocimiento heurístico de
  estructura gramatical (detecta *have/has + participio* vs *had +
  participio* y sus señales típicas) y retroalimentación en tiempo real.
- **Progreso**: panel analítico con precisión, tiempo activo, desempeño por
  tipo de ejercicio, errores frecuentes por tiempo verbal y recomendaciones.
- **Adaptación de dificultad**: el nivel CEFR (A1–C2) sube o baja según
  rachas de aciertos/errores; XP, vidas, racha y logros persisten en
  `localStorage` entre sesiones.
- **Avatar animado**: parpadeo, sincronización labial aproximada durante el
  habla (Speech Synthesis API + `onboundary`), gestos (señalar, asentir,
  negar) y expresiones (neutral, feliz, pensativa).
- **Modo claro/oscuro**, diseño responsive, accesibilidad básica (foco
  visible, `aria-live`, `prefers-reduced-motion`).

## Arquitectura

```
index.html
css/styles.css
js/
  scenarios.js   → datos de las 4 profesiones (vocabulario, escenas SVG)
  speech.js      → wrapper de SpeechSynthesis + SpeechRecognition
  avatar.js      → avatar SVG animado (parpadeo, labios, gestos)
  exercises.js   → motor generador de ejercicios (plantillas + vocabulario)
  tutor.js       → motor adaptativo (nivel, XP, rachas, memoria de errores)
  analytics.js   → panel de progreso
  app.js         → orquestador de UI / integración de todos los módulos
```

## Cómo integrar una API de IA real (siguiente paso recomendado)

Esta versión genera ejercicios y explicaciones con un motor de plantillas
100% local (sin costos, sin latencia, funciona offline). Para llevarlo al
siguiente nivel con generación de contenido verdaderamente abierta, el punto
de integración natural es `js/exercises.js` y `js/app.js` (función
`analyzeConversation`):

1. **Generación de ejercicios más variados**: reemplaza o complementa
   `ExerciseEngine.generate()` con una llamada a la API de OpenAI, Azure
   OpenAI o Gemini, enviando el nivel CEFR, la profesión y el tipo de
   ejercicio deseado, y pidiendo una respuesta en JSON estructurado (ver
   los objetos que ya retorna `exercises.js` como esquema de referencia).
2. **Evaluación de conversación libre**: sustituye la heurística basada en
   expresiones regulares de `analyzeConversation()` por una llamada al LLM
   con instrucciones para: (a) detectar si la oración usa Present Perfect o
   Past Perfect correctamente, (b) explicar el error en español, (c) sugerir
   una corrección — siempre devolviendo una explicación, nunca un booleano
   plano.
3. **Reconocimiento de pronunciación**: la transcripción ya disponible vía
   `SpeechModule.listen()` puede enviarse junto al audio (si se captura con
   `MediaRecorder`) a un servicio de evaluación de pronunciación (p. ej.
   Azure Pronunciation Assessment) para retroalimentación fonética, además
   de la gramatical que ya existe.
4. **Seguridad**: nunca expongas la API key en el cliente; usa un backend
   ligero (Node/Express, Cloudflare Worker, etc.) como proxy entre el
   navegador y el proveedor de IA.

## Notas de accesibilidad y rendimiento

- Sin dependencias externas de runtime (solo Google Fonts vía `<link>`).
- Todo el estado vive en `localStorage`; borra la clave
  `perfecta_tutor_state_v1` para reiniciar el progreso desde cero.
- `prefers-reduced-motion` desactiva animaciones para usuarios sensibles al
  movimiento.
