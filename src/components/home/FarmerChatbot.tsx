'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Bot, ChevronDown, Mic, MicOff, Send, Volume2, VolumeX, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { t } from '@/lib/translations';
import type { Language } from '@/lib/translations';

// Web Speech API types (not universally in lib.dom.d.ts)
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionResultEvent {
  results: { 0: { 0: { transcript: string } } };
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
  mode?: 'voice' | 'text';
};

function getQuickReplies(lang: Language) {
  return [
    t('chat.suggestedWheat', lang),
    t('chat.suggestedTomato', lang),
    t('chat.suggestedWeather', lang),
    t('chat.suggestedTurDal', lang),
  ];
}

function getGreeting(lang: string) {
  if (lang === 'hi') return 'नमस्ते! मैं किसान मित्र AI हूँ। मंडी भाव, स्लॉट बुकिंग, या किसी भी सवाल में मैं आपकी मदद कर सकता हूँ। आप बोल भी सकते हैं! 🎤';
  if (lang === 'mr') return 'नमस्कार! मी किसान मित्र AI आहे. मंडी भाव, स्लॉट बुकिंग किंवा कोणत्याही प्रश्नासाठी मी मदत करू शकतो. आपण बोलू शकता! 🎤';
  if (lang === 'pa') return 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਕਿਸਾਨ ਮਿੱਤਰ AI ਹਾਂ। ਮੰਡੀ ਭਾਅ, ਸਲਾਟ ਬੁਕਿੰਗ ਜਾਂ ਕਿਸੇ ਵੀ ਸਵਾਲ ਵਿੱਚ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ। ਤੁਸੀਂ ਬੋਲ ਵੀ ਸਕਦੇ ਹੋ! 🎤';
  if (lang === 'gu') return 'નમસ્તે! હું કિસાન મિત્ર AI છું. મંડી ભાવ, સ્લોટ બુકિંગ અથવા કોઈપણ પ્રશ્ન માટે હું મદદ કરી શકું છું. તમે બોલી પણ શકો છો! 🎤';
  return 'Namaste! I am Kisan Mitra AI. I can help with mandi prices, slot booking, and farming queries. You can also speak your question! 🎤';
}

function getLangCode(lang: string): string {
  const map: Record<string, string> = { en: 'en-IN', hi: 'hi-IN', mr: 'mr-IN', pa: 'pa-IN', gu: 'gu-IN' };
  return map[lang] || 'hi-IN';
}

function TypingDots() {
  return (
    <div className="chat-thinking-dots" aria-label="Thinking">
      <span /><span /><span />
    </div>
  );
}

export default function FarmerChatbot() {
  const { language } = useLanguage();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: getGreeting(language) },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update greeting when language changes
  useEffect(() => {
    // Reset the conversation greeting when the user's selected language changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([{ role: 'assistant', content: getGreeting(language) }]);
  }, [language]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (open) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [messages, open, sending]);

  // Focus input when chat opens
  useEffect(() => {
    if (open && !voiceMode) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open, voiceMode]);

  const speakText = useCallback((text: string) => {
    if (!ttsEnabled) return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getLangCode(language);
    utterance.rate = 0.9;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    synth.speak(utterance);
    synthRef.current = synth;
  }, [language, ttsEnabled]);

  const sendMessage = useCallback(async (content: string, mode: 'text' | 'voice' = 'text') => {
    const trimmed = content.trim();
    if (!trimmed || sending) return;

    const nextMessages: Message[] = [...messages, { role: 'user', content: trimmed, mode }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages, language }),
      });
      const payload = await response.json() as { answer?: string; message?: string };
      const answer = payload.answer || payload.message || 'I could not answer that right now. Please try again.';
      setMessages((current) => [...current, { role: 'assistant', content: answer }]);
      if (voiceMode || mode === 'voice') {
        speakText(answer);
      }
    } catch {
      const errMsg = 'The connection is unavailable. Please check your internet and try again.';
      setMessages((current) => [...current, { role: 'assistant', content: errMsg }]);
    } finally {
      setSending(false);
    }
  }, [messages, sending, language, voiceMode, speakText]);

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage(input, 'text');
  };

  const startListening = useCallback(() => {
    const SR = (window.SpeechRecognition || window.webkitSpeechRecognition) as (new () => SpeechRecognitionInstance) | undefined;
    if (!SR) {
      alert('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    const recognition = new SR();
    recognition.lang = getLangCode(language);
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      const transcript = event.results[0][0].transcript;
      void sendMessage(transcript, 'voice');
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognition.start();
    recognitionRef.current = recognition;
  }, [language, sendMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const handleClose = () => {
    setOpen(false);
    stopSpeaking();
    stopListening();
  };

  const quickReplies = getQuickReplies(language);

  return (
    <div className={`farmer-chatbot ${open ? 'is-open' : ''}`}>
      {open && (
        <section className="chat-panel" aria-label="Kisan Mitra AI assistant">
          {/* Header */}
          <header className="chat-header">
            <div className="chat-header-info">
              <div className="chat-avatar">
                <Bot />
                <span className="chat-status-dot" />
              </div>
              <span>
                <strong>{t('chat.title', language)}</strong>
                <small>
                  {listening ? t('chat.listening', language) : speaking ? '🔊 ...' : t('chat.status', language)}
                </small>
              </span>
            </div>
            <div className="chat-header-actions">
              <button
                type="button"
                onClick={() => setTtsEnabled((v) => !v)}
                aria-label={ttsEnabled ? 'Mute' : 'Unmute'}
                title={ttsEnabled ? 'Mute' : 'Unmute'}
              >
                {ttsEnabled ? <Volume2 /> : <VolumeX />}
              </button>
              <button
                type="button"
                onClick={handleClose}
                aria-label={t('common.dismiss', language)}
              >
                <X />
              </button>
            </div>
          </header>

          {/* Mode Toggle */}
          <div className="chat-mode-bar">
            <button
              type="button"
              className={`chat-mode-btn ${!voiceMode ? 'active' : ''}`}
              onClick={() => setVoiceMode(false)}
            >
              💬 {t('chat.textTab', language)}
            </button>
            <button
              type="button"
              className={`chat-mode-btn ${voiceMode ? 'active' : ''}`}
              onClick={() => setVoiceMode(true)}
            >
              🎤 {t('chat.voiceTab', language)}
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages" aria-live="polite" role="log">
            {messages.map((message, index) => (
              <div
                className={`chat-message ${message.role} ${message.mode === 'voice' ? 'chat-voice-msg' : ''}`}
                key={`${message.role}-${index}`}
              >
                {message.role === 'assistant' && <span className="chat-msg-icon"><Bot /></span>}
                <span className="chat-msg-text">{message.content}</span>
              </div>
            ))}
            {sending && (
              <div className="chat-message assistant">
                <span className="chat-msg-icon"><Bot /></span>
                <span className="chat-msg-text"><TypingDots /></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies (only when not in middle of convo) */}
          {messages.length <= 2 && !sending && (
            <div className="chat-quick-replies" aria-label="Quick question suggestions">
              {quickReplies.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  className="chat-quick-btn"
                  onClick={() => void sendMessage(reply, 'text')}
                >
                  {reply}
                </button>
              ))}
            </div>
          )}

          {/* Input area */}
          {voiceMode ? (
            <div className="chat-voice-area">
              <div className={`chat-voice-ring ${listening ? 'is-listening' : ''}`}>
                <button
                  type="button"
                  className={`chat-mic-btn ${listening ? 'active' : ''}`}
                  onClick={listening ? stopListening : startListening}
                  aria-label={listening ? 'Stop listening' : 'Start voice input'}
                  disabled={sending}
                >
                  {listening ? <MicOff /> : <Mic />}
                </button>
              </div>
              <p className="chat-voice-hint">
                {listening
                  ? t('chat.listening', language)
                  : sending
                  ? t('common.loading', language)
                  : t('chat.clickToSpeak', language)}
              </p>
              {speaking && (
                <button type="button" className="chat-stop-speak" onClick={stopSpeaking}>
                  <VolumeX /> {t('common.dismiss', language)}
                </button>
              )}
            </div>
          ) : (
            <form className="chat-form" onSubmit={handleFormSubmit}>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder={t('chat.inputPlaceholder', language)}
                aria-label={t('chat.inputPlaceholder', language)}
                disabled={sending}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label={t('chat.send', language)}
              >
                <Send />
              </button>
            </form>
          )}

          <p className="chat-disclaimer">
            {t('chat.disclaimer', language)}
          </p>
        </section>
      )}

      <button
        type="button"
        id="kisan-mitra-chatbot-launcher"
        className={`chat-launcher ${listening ? 'is-listening' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t('common.dismiss', language) : t('chat.title', language)}
        aria-expanded={open}
      >
        <span className="chat-launcher-icon">{open ? <ChevronDown /> : <Bot />}</span>
        <span>{open ? t('common.dismiss', language) : t('chat.title', language)}</span>
        {!open && <span className="chat-launcher-badge">AI</span>}
      </button>
    </div>
  );
}
