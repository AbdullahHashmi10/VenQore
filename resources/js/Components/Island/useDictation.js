import { useState, useRef, useCallback, useEffect } from 'react';

/**
 * Speech-to-text on the mic button.
 *
 * Uses the same Web Speech setup and the same locale mapping SmartCapturePanel
 * already relies on, so a shopkeeper who dictates a voice memo there and asks
 * Vena a question here gets the same recognition language either way.
 *
 * Interim results stream into the field as you speak rather than landing in one
 * block at the end — that live feedback is what makes dictation feel like it is
 * listening instead of buffering.
 */
export default function useDictation({ locale, onText, onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [supported] = useState(
    () => typeof window !== 'undefined' &&
      Boolean(window.SpeechRecognition || window.webkitSpeechRecognition)
  );
  const recRef = useRef(null);
  const baseRef = useRef('');

  const stop = useCallback(() => {
    try { recRef.current?.stop(); } catch (e) { /* already stopped */ }
    setListening(false);
  }, []);

  const start = useCallback((currentValue = '') => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    try { recRef.current?.abort(); } catch (e) { /* nothing running */ }

    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = locale === 'ur' ? 'ur-PK'
      : locale === 'hi' ? 'hi-IN'
      : locale === 'ar' ? 'ar-SA'
      : 'en-US';

    baseRef.current = currentValue ? `${currentValue} ` : '';

    rec.onresult = (event) => {
      let text = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        text += event.results[i][0].transcript;
      }
      const merged = (baseRef.current + text).trimStart();
      onText?.(merged);
      if (event.results[event.results.length - 1].isFinal) onFinal?.(merged);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch (e) {
      setListening(false);
    }
  }, [locale, onText, onFinal]);

  const toggle = useCallback((currentValue = '') => {
    if (listening) stop(); else start(currentValue);
  }, [listening, start, stop]);

  useEffect(() => () => { try { recRef.current?.abort(); } catch (e) { /* unmounted */ } }, []);

  return { listening, supported, start, stop, toggle };
}
