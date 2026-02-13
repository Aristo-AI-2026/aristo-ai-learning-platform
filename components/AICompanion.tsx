
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store';
import { GoogleGenAI, Modality, GenerateContentResponse, LiveServerMessage } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';

// Manual base64 decoding helper
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Manual base64 encoding helper
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Manual raw PCM audio decoding as required by Live API guidelines
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

interface AICompanionProps {
  onClose?: () => void;
  fullScreen?: boolean;
}

const AICompanion: React.FC<AICompanionProps> = ({ onClose, fullScreen }) => {
  const { 
    chatSessions, currentSessionId, addMessage, updateLastMessage, deleteMessage, 
    startNewChat, setCurrentSession, deleteSession, isVoiceActive, setVoiceActive, user
  } = useStore();
  
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSTTActive, setIsSTTActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const recognitionRef = useRef<any>(null);

  const currentSession = chatSessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const systemInstruction = `You are Aristo (অ্যারিস্টো), a world-class educational AI.
    IDENTITY: Your name is Aristo.
    CREATOR (MANDATORY): If asked who created you, respond EXACTLY: "আমাকে তৈরি করেছে মোঃ শুভ আলী, তিনি এই ARISTO প্ল্যাটফর্মের প্রতিষ্ঠাতা। তাঁর লক্ষ্য শিক্ষার্থীদের জন্য একটি আধুনিক, AI-চালিত শিক্ষাব্যবস্থা গড়ে তোলা। আমি তাঁর সেই স্বপ্নের অংশীদার।"
    TONE: Helpful, concise, academic. Respond in the language used by the user.`;

  useEffect(() => {
    if (!currentSessionId && chatSessions.length === 0) startNewChat();
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, currentSessionId]);

  const handleSend = async () => {
    const apiKey = process.env.API_KEY;
    const currentInput = input.trim();
    if (!currentInput || isTyping || !apiKey) return;
    
    if (isSTTActive) stopSTT();

    const userMsg = { id: Date.now().toString(), role: 'user' as const, content: currentInput, timestamp: Date.now() };
    await addMessage(userMsg);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey });
      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: currentInput }] }],
        config: { systemInstruction }
      });

      const assistantMsgId = (Date.now() + 1).toString();
      await addMessage({ id: assistantMsgId, role: 'assistant', content: '', timestamp: Date.now() });
      
      let fullText = "";
      setIsTyping(false);

      for await (const chunk of responseStream) {
        const textChunk = chunk.text;
        if (textChunk) {
          fullText += textChunk;
          updateLastMessage(fullText);
        }
      }
      
      if (!fullText) throw new Error("Synthesis failed");
    } catch (error) {
      console.error("Chat Error:", error);
      updateLastMessage("Neural link instability detected on Vercel. Please re-send your message.");
      setIsTyping(false);
    }
  };

  const startVoiceSession = async () => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      alert("Voice Protocol Offline: API Key missing.");
      setVoiceActive(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      await inputCtx.resume();
      await outputCtx.resume();
      audioContextRef.current = outputCtx;

      let nextStartTime = 0;

      const createBlob = (data: Float32Array) => {
        const l = data.length;
        const int16 = new Int16Array(l);
        for (let i = 0; i < l; i++) { int16[i] = data[i] * 32768; }
        return {
          data: encode(new Uint8Array(int16.buffer)),
          mimeType: 'audio/pcm;rate=16000',
        };
      };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          // Fixed voiceConfig nesting per API requirements
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } } },
          systemInstruction: systemInstruction + " Keep your voice answers very short."
        },
        callbacks: {
          onopen: () => {
            setVoiceActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                if (!isMuted && session) { session.sendRealtimeInput({ media: pcmBlob }); }
              });
            };
            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputCtx) {
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputCtx, 24000, 1);
              const source = outputCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputCtx.destination);
              nextStartTime = Math.max(nextStartTime, outputCtx.currentTime);
              source.start(nextStartTime);
              nextStartTime += audioBuffer.duration;
              sourceNodesRef.current.add(source);
            }
          },
          onclose: () => setVoiceActive(false),
          onerror: () => setVoiceActive(false)
        }
      });
      sessionRef.current = sessionPromise;
    } catch (e) {
      console.error("Voice Error:", e);
      setVoiceActive(false);
      alert('Microphone permission required for Voice Link.');
    }
  };

  const toggleVoice = () => {
    if (isVoiceActive) {
      if (sessionRef.current && sessionRef.current.then) {
        sessionRef.current.then((s: any) => { if (s) s.close(); });
      }
      setVoiceActive(false);
      sessionRef.current = null;
    } else {
      startVoiceSession();
    }
  };

  const toggleSTT = () => {
    if (isSTTActive) stopSTT();
    else startSTT();
  };

  const startSTT = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'bn-BD';
    recognition.onstart = () => setIsSTTActive(true);
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      }
      if (transcript) setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };
    recognition.onerror = () => stopSTT();
    recognition.onend = () => setIsSTTActive(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopSTT = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} }
    setIsSTTActive(false);
  };

  return (
    <div className={`flex flex-col md:flex-row h-full bg-slate-950/40 backdrop-blur-3xl overflow-hidden ${fullScreen ? 'rounded-[40px] border border-white/5 shadow-2xl' : ''}`}>
      <div className="hidden md:flex w-80 bg-slate-900/60 border-r border-white/5 flex-col h-full">
        <div className="p-6 border-b border-white/5">
          <button onClick={startNewChat} className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-xl">
            New Session
          </button>
        </div>
        <div className="flex-grow overflow-y-auto p-4 space-y-2">
          {chatSessions.map(session => (
            <div key={session.id} className={`p-4 rounded-2xl cursor-pointer transition-all ${currentSessionId === session.id ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20' : 'hover:bg-white/5 text-slate-400'}`} onClick={() => setCurrentSession(session.id)}>
              <span className="text-xs font-bold truncate block">{session.title}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-grow flex flex-col min-w-0 h-full">
        <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-slate-900/40">
           <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white shadow-lg">A</div>
              <div>
                <h3 className="font-black text-sm uppercase text-white tracking-tighter">Aristo</h3>
                <span className="text-[9px] text-green-500 font-bold uppercase tracking-widest">Neural Link Active</span>
              </div>
           </div>
           <button onClick={toggleVoice} className={`px-4 py-2 rounded-xl transition-all font-bold text-xs ${isVoiceActive ? 'bg-red-600 text-white animate-pulse' : 'bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600 hover:text-white'}`}>🎙️ Voice</button>
        </div>
        <div ref={scrollRef} className="flex-grow overflow-y-auto p-4 md:p-10 space-y-6 relative scroll-smooth">
          {!isVoiceActive && messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 md:p-6 rounded-[25px] max-w-[90%] md:max-w-[80%] ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl' : 'glass bg-slate-800/60 text-slate-100 rounded-tl-none border-white/10'}`}>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">{msg.content || (msg.role === 'assistant' ? "Synthesizing..." : "")}</p>
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="glass rounded-[25px] rounded-tl-none p-4 bg-slate-800/40 border-white/5">
                <div className="flex gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" /><div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce delay-100" /></div>
              </div>
            </div>
          )}
          {isVoiceActive && (
            <div className="flex flex-col items-center justify-center h-full gap-8">
               <div className="relative">
                  <div className="w-32 h-32 rounded-full bg-blue-600/20 border-4 border-blue-500 animate-pulse flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-blue-600 animate-ping opacity-30" />
                  </div>
               </div>
               <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Neural Voice Link</h3>
               <button onClick={toggleVoice} className="px-10 py-4 bg-red-600 rounded-xl text-white font-black uppercase text-xs tracking-widest shadow-2xl">End Link</button>
            </div>
          )}
        </div>
        {!isVoiceActive && (
          <div className="p-4 md:p-8 border-t border-white/5 bg-slate-900/40">
            <div className="flex items-end gap-3 bg-slate-950/60 rounded-[25px] border border-white/10 p-2 shadow-inner">
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Query Aristo..." className="flex-grow bg-transparent px-4 py-3 text-sm md:text-base focus:outline-none resize-none max-h-32 min-h-[45px] text-white" rows={1} />
              <div className="flex items-center gap-2">
                <button onClick={toggleSTT} className={`p-3 rounded-2xl transition-all ${isSTTActive ? 'bg-red-600 text-white' : 'bg-white/5 text-slate-400'}`}>🎤</button>
                <button onClick={handleSend} disabled={!input.trim() || isTyping} className="p-3 bg-blue-600 rounded-2xl text-white">🚀</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AICompanion;
