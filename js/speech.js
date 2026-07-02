/* ==========================================================================
   speech.js
   Thin wrapper around SpeechSynthesis (tutor voice) and SpeechRecognition
   (student spoken answers). Degrades gracefully when the browser lacks
   support — the rest of the app never assumes these APIs exist.
   ========================================================================== */

const SpeechModule = (() => {
  const synth = window.speechSynthesis || null;
  const RecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  let voices = [];
  let preferredVoice = null;

  function loadVoices() {
    if (!synth) return;
    voices = synth.getVoices();
    preferredVoice =
      voices.find(v => /en-US/i.test(v.lang) && /female|Samantha|Google US English/i.test(v.name)) ||
      voices.find(v => /en-US/i.test(v.lang)) ||
      voices.find(v => /^en/i.test(v.lang)) ||
      null;
  }
  if (synth) {
    loadVoices();
    synth.onvoiceschanged = loadVoices;
  }

  /**
   * Speak text aloud. onWord fires on each word boundary (used to drive
   * the avatar's lip-sync); onEnd fires when speech finishes (or immediately
   * if speech synthesis is unavailable / disabled).
   */
  function speak(text, { onStart, onWord, onEnd, enabled = true } = {}) {
    if (!enabled || !synth) {
      onStart && onStart();
      onEnd && onEnd();
      return;
    }
    synth.cancel(); // stop anything currently queued
    const utter = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, ''));
    utter.voice = preferredVoice;
    utter.lang = 'en-US';
    utter.rate = 0.98;
    utter.pitch = 1.03;
    utter.onstart = () => onStart && onStart();
    utter.onboundary = (e) => { if (e.name === 'word' || e.charIndex !== undefined) onWord && onWord(); };
    utter.onend = () => onEnd && onEnd();
    utter.onerror = () => onEnd && onEnd();
    synth.speak(utter);
  }

  function stop() { synth && synth.cancel(); }

  const isRecognitionSupported = !!RecognitionCtor;
  let recognizer = null;

  function listen({ onResult, onError, onStart, onEnd, lang = 'en-US' } = {}) {
    if (!RecognitionCtor) {
      onError && onError('unsupported');
      return null;
    }
    if (recognizer) { try { recognizer.stop(); } catch (e) {} }
    recognizer = new RecognitionCtor();
    recognizer.lang = lang;
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;
    recognizer.onstart = () => onStart && onStart();
    recognizer.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      onResult && onResult(transcript);
    };
    recognizer.onerror = (e) => onError && onError(e.error);
    recognizer.onend = () => onEnd && onEnd();
    recognizer.start();
    return recognizer;
  }

  function stopListening() {
    if (recognizer) { try { recognizer.stop(); } catch (e) {} }
  }

  return {
    isSynthesisSupported: !!synth,
    isRecognitionSupported,
    speak,
    stop,
    listen,
    stopListening,
  };
})();
