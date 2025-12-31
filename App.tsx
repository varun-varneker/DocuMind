
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { extractTextFromPdf } from './services/pdfService';
import { rankChunksForQuery, getGroundedResponse } from './services/geminiService';
import { ChatMessage, DocumentChunk, ProcessingState } from './types';
import FileUpload from './components/FileUpload';
import Chat from './components/Chat';
import { RefreshCw, Search, Layers, Zap, MessageSquare, BookOpen, Target, Layout } from 'lucide-react';

const App: React.FC = () => {
  const [chunks, setChunks] = useState<DocumentChunk[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [processing, setProcessing] = useState<ProcessingState>({ status: 'idle', progress: 0 });
  const [activeFile, setActiveFile] = useState<File | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedChunkId, setHighlightedChunkId] = useState<string | null>(null);
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeMobileTab, setActiveMobileTab] = useState<'chat' | 'inspector'>('chat');
  
  const chunkRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleFileSelect = async (file: File) => {
    setActiveFile(file);
    setProcessing({ status: 'parsing', progress: 20, message: 'Ingesting subject data...' });
    
    try {
      const extractedChunks = await extractTextFromPdf(file);
      setChunks(extractedChunks);
      setProcessing({ status: 'ready', progress: 100, message: 'Synthesis Engine Active' });
      
      setMessages([{
        id: 'system-1',
        role: 'assistant',
        content: `Got it. I've finished mapping **${file.name}**. 

I've indexed about **${extractedChunks.length} specific nodes** across the document. I'm ready to look this over and help you figure out how it stacks up against current industry standards. What's on your mind?`,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setProcessing({ status: 'error', progress: 0, message: 'Ingestion failure.' });
    }
  };

  const handleSendMessage = async (text: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const relevantChunks = await rankChunksForQuery(text, chunks);
      const history = messages
        .filter(m => m.id !== 'system-1')
        .map(m => ({ role: m.role, content: m.content }));
        
      const response = await getGroundedResponse(text, relevantChunks, history);

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        sources: relevantChunks,
        timestamp: new Date()
      }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Network interruption or API quota reached. Please retry.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const reset = () => {
    setChunks([]);
    setMessages([]);
    setActiveFile(null);
    setProcessing({ status: 'idle', progress: 0 });
    setSearchTerm('');
    setHighlightedChunkId(null);
    setActiveTags([]);
    setActiveMobileTab('chat');
  };

  const handleSourceClick = (chunkId: string) => {
    setActiveMobileTab('inspector');
    setSearchTerm(''); 
    setActiveTags([]); 
    setHighlightedChunkId(chunkId);
    
    setTimeout(() => {
      const element = chunkRefs.current[chunkId];
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 400);

    setTimeout(() => setHighlightedChunkId(null), 4000);
  };

  const entities = useMemo(() => {
    const foundTags = new Set<string>();
    const dateRegex = /\b(19|20)\d{2}\b/g;
    const percentRegex = /\b\d+(\.\d+)?%\b/g;
    const orgSuffixRegex = /\b[A-Z][a-z]+ (Inc|Corp|LLC|Ltd|Group)\b/g;

    chunks.slice(0, 50).forEach(c => {
      const dates = c.text.match(dateRegex);
      const percents = c.text.match(percentRegex);
      const orgs = c.text.match(orgSuffixRegex);
      dates?.forEach(d => foundTags.add(d));
      percents?.forEach(p => foundTags.add(p));
      orgs?.forEach(o => foundTags.add(o));
    });

    return Array.from(foundTags).slice(0, 6);
  }, [chunks]);

  const filteredChunks = useMemo(() => {
    let result = chunks;
    const term = searchTerm.toLowerCase().trim();
    if (term) {
      if (term.startsWith('p')) {
        const page = parseInt(term.replace('p', ''));
        if (!isNaN(page)) result = result.filter(c => c.pageNumber === page);
      } else {
        result = result.filter(chunk => chunk.text.toLowerCase().includes(term));
      }
    }
    if (activeTags.length > 0) {
      result = result.filter(chunk => activeTags.some(tag => chunk.text.includes(tag)));
    }
    return result;
  }, [chunks, searchTerm, activeTags]);

  const heatmapData = useMemo(() => {
    const pages: { [key: number]: number } = {};
    chunks.forEach(c => { pages[c.pageNumber] = (pages[c.pageNumber] || 0) + 1; });
    return Object.entries(pages).map(([page, count]) => ({ page: parseInt(page), count }));
  }, [chunks]);

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-inter blueprint-bg overflow-hidden relative">
      {/* HEADER SECTION - FIXED HEIGHT */}
      <nav className="flex-shrink-0 w-full bg-white border-b border-slate-200 px-6 md:px-12 py-4 z-50 shadow-sm">
        <div className="max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-500/20">
              <Layout className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tighter text-indigo-950 uppercase leading-none">
                DocuMind
              </h1>
              <p className="hidden md:block text-[9px] text-indigo-400 font-black tracking-[0.4em] uppercase mt-1">Intelligence Architect</p>
            </div>
          </div>
          
          {activeFile && (
            <div className="flex items-center space-x-4 md:space-x-6">
               <div className="hidden sm:flex items-center px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-2xl text-[10px] font-black border border-indigo-100 uppercase tracking-widest">
                <Zap className="w-3 h-3 mr-2 animate-pulse" />
                Grounded Logic
              </div>
              <button 
                onClick={reset}
                className="text-slate-400 hover:text-red-600 transition-all p-2 hover:bg-red-50 rounded-xl group"
                title="Reset Project"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* MAIN VIEWPORT - LOCKED TO REMAINING SCREEN HEIGHT */}
      <main className={`flex-1 flex flex-col md:flex-row w-full max-w-screen-2xl mx-auto overflow-hidden relative ${!activeFile ? 'items-center justify-center p-6' : 'p-0 md:p-6 md:gap-6'}`}>
        
        {!activeFile ? (
          /* WELCOME SCREEN */
          <div className="max-w-2xl w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-700 py-12">
            <div className="mb-8 text-center">
              <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white border border-slate-100 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] mb-6 shadow-md">
                <span>System Status: Online</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tighter">
                Architecture <br />for the <span className="text-indigo-600">Complex.</span>
              </h2>
              <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed max-lg mx-auto mb-8">
                Verify logic, cite evidence, and eliminate hallucinations with our grounded knowledge graph.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <FileUpload 
                onFileSelect={handleFileSelect} 
                isLoading={processing.status === 'parsing'} 
                status={processing.message || ''}
              />
            </div>
          </div>
        ) : (
          /* ACTIVE SPLIT VIEW */
          <>
            {/* COLUMN 1: KNOWLEDGE INSPECTOR (Sidebar) - INDEPENDENT SCROLL */}
            <aside className={`
              w-full md:w-[360px] lg:w-[400px] flex flex-col bg-white md:bg-transparent h-full z-10 flex-shrink-0
              ${activeMobileTab === 'inspector' ? 'flex' : 'hidden md:flex'}
            `}>
              <div className="bg-white rounded-none md:rounded-[2rem] shadow-none md:shadow-xl md:shadow-slate-200/50 border-0 md:border border-slate-200 flex flex-col h-full overflow-hidden">
                <div className="hidden md:block px-6 py-5 bg-slate-900 text-white flex-shrink-0">
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">Node Distribution</p>
                  <div className="flex items-end space-x-1 h-10 bg-white/5 rounded-xl p-1.5 border border-white/10">
                    {heatmapData.map((d) => (
                      <button 
                        key={d.page}
                        className={`flex-1 rounded-sm transition-all ${searchTerm === `p${d.page}` ? 'bg-indigo-400' : 'bg-slate-700'}`}
                        style={{ height: `${Math.min(100, Math.max(20, (d.count / 5) * 100))}%` }}
                        onClick={() => setSearchTerm(searchTerm === `p${d.page}` ? '' : `p${d.page}`)}
                      />
                    ))}
                  </div>
                </div>

                <div className="p-5 border-b border-slate-100 flex-shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-800">Knowledge Nodes</h3>
                    </div>
                    <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">{filteredChunks.length} Nodes</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input 
                      type="text" 
                      placeholder="Search semantic evidence..." 
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-400 transition-all shadow-inner"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                {/* INTERNAL SCROLL FOR KNOWLEDGE NODES */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/10 custom-scrollbar">
                  {filteredChunks.map(chunk => (
                    <div 
                      key={chunk.id} 
                      ref={(el) => { chunkRefs.current[chunk.id] = el; }}
                      className={`p-4 bg-white rounded-2xl border transition-all duration-300 relative group
                        ${highlightedChunkId === chunk.id 
                          ? 'border-indigo-500 ring-4 ring-indigo-500/5 z-10 scale-[1.01] shadow-lg bg-indigo-50/5' 
                          : 'border-slate-100 shadow-sm hover:border-indigo-200'}`}
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[9px] font-black text-indigo-700 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-widest border border-indigo-100/50">PAGE {chunk.pageNumber}</span>
                        <Target className={`w-3.5 h-3.5 text-indigo-500 ${highlightedChunkId === chunk.id ? 'opacity-100' : 'opacity-0'}`} />
                      </div>
                      <p className="text-slate-600 text-[12px] leading-relaxed font-medium">
                        {chunk.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* COLUMN 2: SYNTHESIS TERMINAL (Chat) - INDEPENDENT SCROLL */}
            <section className={`
              flex-1 flex flex-col bg-white md:rounded-[2rem] shadow-none md:shadow-xl md:shadow-slate-200/50 border-0 md:border border-slate-200 overflow-hidden relative h-full
              ${activeMobileTab === 'chat' ? 'flex' : 'hidden md:flex'}
            `}>
              <Chat 
                messages={messages} 
                onSendMessage={handleSendMessage} 
                isTyping={isTyping} 
                onSourceClick={handleSourceClick}
              />
            </section>
          </>
        )}
      </main>

      {/* MOBILE BOTTOM NAV - HIDDEN ON DESKTOP */}
      {activeFile && (
        <div className="flex md:hidden bg-white border-t border-slate-200 px-6 py-2 z-50 flex-shrink-0 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          <button 
            onClick={() => setActiveMobileTab('chat')}
            className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all
              ${activeMobileTab === 'chat' ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 font-bold'}`}
          >
            <MessageSquare className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-widest">Synthesis</span>
          </button>
          <button 
            onClick={() => setActiveMobileTab('inspector')}
            className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all
              ${activeMobileTab === 'inspector' ? 'text-indigo-600 bg-indigo-50 font-black' : 'text-slate-400 font-bold'}`}
          >
            <BookOpen className="w-5 h-5 mb-1" />
            <span className="text-[10px] uppercase tracking-widest">Knowledge</span>
          </button>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 20px; }
        
        .blueprint-bg {
          background-image: 
            linear-gradient(rgba(99, 102, 241, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.03) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>
    </div>
  );
};

export default App;
