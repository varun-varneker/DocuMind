
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, BarChart3, ExternalLink, ShieldCheck } from 'lucide-react';
import { ChatMessage, DocumentChunk } from '../types';
import { marked } from 'marked';

interface ChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isTyping: boolean;
  onSourceClick: (chunkId: string) => void;
}

const Chat: React.FC<ChatProps> = ({ messages, onSendMessage, isTyping, onSourceClick }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isTyping) {
      onSendMessage(input);
      setInput('');
    }
  };

  useEffect(() => {
    marked.setOptions({
      breaks: true,
      gfm: true,
    });
  }, []);

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden relative">
      {/* SCROLLABLE MESSAGE THREAD - FLEX GROW */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-6 md:px-10 py-8 space-y-8 bg-slate-50/5 custom-scrollbar overscroll-contain"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-6 max-w-xs mx-auto text-center opacity-80 pt-10">
            <div className="p-6 bg-white rounded-3xl shadow-xl border border-slate-100 transform -rotate-1">
              <BarChart3 className="w-10 h-10 text-indigo-600 animate-pulse" />
            </div>
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2">Synthesis Engine Engaged</p>
              <p className="text-[12px] text-slate-400 font-semibold leading-relaxed">
                Initialize query for grounded evaluation.
              </p>
            </div>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
            <div className={`flex max-w-[95%] md:max-w-[90%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`flex-shrink-0 w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shadow-lg ${m.role === 'user' ? 'bg-indigo-600 ml-3' : 'bg-white border border-slate-100 mr-3'}`}>
                {m.role === 'user' ? <User className="w-4.5 h-4.5 text-white" /> : <BarChart3 className="w-4.5 h-4.5 text-indigo-600" />}
              </div>
              <div className="flex flex-col max-w-full">
                <div className={`px-5 py-4 md:px-6 md:py-5 rounded-2xl shadow-sm text-[14px] md:text-[15px] leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-100 text-slate-800 rounded-tl-none'}`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center space-x-2 mb-2">
                       <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                       <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Verified Citations</span>
                    </div>
                  )}
                  <div 
                    className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert font-medium' : 'prose-slate font-medium text-slate-700'}`}
                    dangerouslySetInnerHTML={{ __html: marked.parse(m.content) }}
                  />
                </div>
                
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {m.sources.map((source) => (
                      <button 
                        key={source.id} 
                        onClick={() => onSourceClick(source.id)}
                        className="flex items-center h-8 px-3 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-indigo-600 hover:border-indigo-600 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 group"
                      >
                        <ExternalLink className="w-3 h-3 mr-1.5 opacity-40 group-hover:opacity-100" />
                        NODE P{source.pageNumber}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 px-6 py-3 rounded-2xl rounded-tl-none shadow-md flex items-center space-x-2">
              <div className="w-2 h-2 bg-indigo-200 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
              <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            </div>
          </div>
        )}
      </div>

      {/* INPUT BAR - STICKY TO BOTTOM OF CHAT COLUMN */}
      <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-slate-100 bg-white flex-shrink-0 z-20">
        <div className="relative flex items-center max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Initialize synthesis..."
            className="w-full pl-5 pr-14 py-3 md:py-4 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl focus:outline-none focus:border-indigo-400 text-sm md:text-base transition-all font-semibold placeholder:text-slate-300"
            disabled={isTyping}
            enterKeyHint="send"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="absolute right-1.5 p-3 md:p-3.5 bg-indigo-600 text-white rounded-lg md:rounded-xl shadow-lg disabled:opacity-40 transition-all active:scale-90 flex items-center justify-center group"
          >
            <Send className="w-4.5 h-4.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;
