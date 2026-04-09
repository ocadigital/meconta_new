import React, { useState, useRef, useEffect } from 'react';
import { Send, Volume2, Loader2, Bot, User } from 'lucide-react';
import { chatWithFinancialAssistant, generateSpeech } from '../services/geminiService';
import { ChatMessage } from '../types';

// Helper to decode Base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode raw PCM audio data
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

export const ChatAssistant: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: 'model', text: 'Olá! Sou seu assistente financeiro. Como posso ajudar você a economizar hoje?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null); // ID of message playing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Format history for API
      // Important: Remove the first hardcoded welcome message (id: '1') from history sent to API.
      // This ensures the conversation context starts with a User turn (the first question),
      // which prevents "Model first" errors in strict conversation models.
      const history = messages
        .filter(m => m.id !== '1')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const responseText = await chatWithFinancialAssistant(history, userMsg.text);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Desculpe, não entendi."
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Ocorreu um erro ao processar sua mensagem. Tente novamente em instantes."
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeak = async (message: ChatMessage) => {
    if (isPlayingAudio) return; // Prevent overlapping

    try {
      setIsPlayingAudio(message.id);
      
      let audioData = message.audioData;

      if (!audioData) {
        // Generate if not cached
        const generatedAudio = await generateSpeech(message.text);
        if (generatedAudio) {
           audioData = generatedAudio;
           // Cache it
           setMessages(prev => prev.map(m => m.id === message.id ? { ...m, audioData: generatedAudio } : m));
        }
      }

      if (audioData) {
        if (!audioContextRef.current) {
          // Initialize AudioContext
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        
        // Decode raw PCM data
        const bytes = decode(audioData);
        // gemini-2.5-flash-preview-tts output is typically 24000Hz, Mono
        const audioBuffer = await decodeAudioData(bytes, audioContextRef.current, 24000, 1);
        
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);
        source.onended = () => setIsPlayingAudio(null);
        source.start(0);
      } else {
        setIsPlayingAudio(null);
      }

    } catch (e) {
      console.error("Audio playback error", e);
      setIsPlayingAudio(null);
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4 text-white flex items-center gap-2">
        <Bot className="w-6 h-6" />
        <h2 className="font-bold text-lg">Assistente IA</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-100'
            }`}>
              <div className="flex items-start gap-2">
                {msg.role === 'model' && (
                  <button 
                    onClick={() => handleSpeak(msg)}
                    className={`mt-1 p-1.5 rounded-full hover:bg-gray-100 transition-colors ${isPlayingAudio === msg.id ? 'text-blue-500 animate-pulse' : 'text-gray-400'}`}
                    title="Ouvir resposta"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                )}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">{msg.text}</div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs text-gray-500">Digitando...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Pergunte sobre seus gastos..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
        <button 
          type="submit" 
          disabled={!inputText.trim() || isLoading}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};