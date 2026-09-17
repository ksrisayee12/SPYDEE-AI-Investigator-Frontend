import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';
import { Terminal, Send, Sparkles } from 'lucide-react';

export default function Copilot() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: history } = useQuery({
    queryKey: ['copilot', caseId],
    queryFn: () => api.getCopilotHistory(caseId!),
    enabled: !!caseId,
  });

  const askMutation = useMutation({
    mutationFn: (q: string) => api.askCopilot(caseId!, q),
    onSuccess: (data, q) => {
      setMessages(prev => [
        ...prev,
        { role: 'user', content: q, timestamp: new Date().toLocaleTimeString() },
        { role: 'assistant', content: data, timestamp: new Date().toLocaleTimeString() },
      ]);
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, askMutation.isPending]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || askMutation.isPending) return;
    const currentQ = query;
    setQuery('');
    askMutation.mutate(currentQ);
  };

  const handleSuggestedPrompt = (promptText: string) => {
    setQuery('');
    askMutation.mutate(promptText);
  };

  const examples = [
    'What are the strongest leads and corroborated paths?',
    'Who are the top high-frequency actors in intercepted communications?',
    'Explain Alias-01 and associated financial transaction vectors',
    'What critical evidence contradicts current primary hypotheses?',
    'Identify intelligence gaps with zero corroborating subpoena records',
  ];

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-6.5rem)] font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="INTEL // 06"
        title="TACTICAL INVESTIGATOR COPILOT"
        description="Neural graph query engine for multi-hop link analysis, evidentiary citations, and contradictory cross-referencing."
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-[#FF9E1B] bg-[#14110C] px-3 py-1.5 border border-[#3D2A12] rounded-xs shadow-[0_0_10px_rgba(255,158,27,0.15)]">
            <span className="w-2 h-2 rounded-full bg-[#FF9E1B] animate-pulse" />
            <span>NEURAL REASONING ENGINE ACTIVE</span>
          </div>
        </div>
      </WorkspaceHeader>

      {/* Main chat terminal window */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#0D0B08] border border-[#3D2A12] p-4 my-4 space-y-4 rounded-xs relative"
      >
        {/* Subtle amber grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #FF9E1B 1px, transparent 1px), linear-gradient(to bottom, #FF9E1B 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {messages.length === 0 && history && history.length > 0 && (
          <div className="border border-[#3D2A12] bg-[#14110C] p-3 rounded-xs space-y-2">
            <div className="text-[10px] text-[#A6732E] uppercase tracking-wider flex items-center justify-between">
              <span>PRIOR INTERROGATION LOGS (RECENT QUERIES)</span>
              <span className="text-[#7A521D]">{history.length} SAVED SESSIONS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {history.slice(0, 4).map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleSuggestedPrompt(m.query)}
                  className="bg-[#0D0B08] hover:bg-[#1A140B] border border-[#3D2A12] hover:border-[#FF9E1B] p-2 rounded-xs cursor-pointer transition-colors text-xs space-y-1 group"
                >
                  <div className="text-[#FF9E1B] font-bold truncate group-hover:text-[#FFE7B8]">
                    ❯ {m.query}
                  </div>
                  <div className="text-[11px] text-[#A6732E] line-clamp-2">
                    {m.response?.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="inline-block p-4 border border-[#3D2A12] bg-[#14110C] rounded-xs text-left max-w-xl space-y-2 shadow-[0_0_15px_rgba(255,158,27,0.1)]">
              <div className="text-xs text-[#FF9E1B] font-bold flex items-center gap-2">
                <span>[ PROTOCOL READY ]</span>
                <span className="text-[10px] text-[#A6732E]">AWAITING OPERATOR INPUT</span>
              </div>
              <p className="text-xs text-[#A6732E] leading-relaxed">
                Query graph relationships across phone records, shell companies, and surveillance logs.
                All copilot responses enforce strict provenance and source citation tracking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-[#A6732E] uppercase tracking-widest">
                PRE-COMPILED RECONNAISSANCE QUERIES
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {examples.map(ex => (
                  <button
                    key={ex}
                    onClick={() => handleSuggestedPrompt(ex)}
                    className="text-xs bg-[#14110C] hover:bg-[#1A140B] text-[#FFBA42] hover:text-[#FFE7B8] border border-[#3D2A12] hover:border-[#FF9E1B] px-3 py-1.5 rounded-xs transition-colors text-left"
                  >
                    ❯ {ex}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message feed */}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            } space-y-1`}
          >
            <div className="flex items-center gap-2 text-[10px] text-[#A6732E] uppercase">
              <span>{m.role === 'user' ? 'OPERATOR // DISPATCH' : 'ORACLE // SYNTHESIS'}</span>
              {m.timestamp && <span>· {m.timestamp}</span>}
            </div>

            <div
              className={`max-w-[85%] rounded-xs p-4 text-xs border ${
                m.role === 'user'
                  ? 'bg-[#14110C] border-[#FF9E1B] text-[#FFE7B8]'
                  : 'bg-[#0D0B08] border-[#3D2A12] text-[#FFBA42] space-y-3'
              }`}
            >
              {m.role === 'assistant' ? (
                <div>
                  <p className="whitespace-pre-wrap leading-relaxed font-mono text-xs text-[#FFE7B8]">
                    {m.content.answer}
                  </p>

                  {/* Deep Navigation Jump Links */}
                  {m.content.links?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#3D2A12]/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-[#A6732E] self-center mr-1">
                        JUMP TO:
                      </span>
                      {m.content.links.map((l: any, j: number) => {
                        if (l.type === 'contradiction')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/contradictions`)}
                              className="text-[10px] bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/40 px-2 py-0.5 rounded-xs hover:bg-[#EF4444]/20 font-bold"
                            >
                              [ CONTRADICTION #{l.id ? l.id.slice(0, 6) : 'LINK'} ]
                            </button>
                          );
                        if (l.type === 'lead')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/leads`)}
                              className="text-[10px] bg-[#FF9E1B]/10 text-[#FF9E1B] border border-[#FF9E1B]/40 px-2 py-0.5 rounded-xs hover:bg-[#FF9E1B]/20 font-bold"
                            >
                              [ LEAD RECORD ]
                            </button>
                          );
                        if (l.type === 'information_gap')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/leads`)}
                              className="text-[10px] bg-[#34D399]/10 text-[#34D399] border border-[#34D399]/40 px-2 py-0.5 rounded-xs hover:bg-[#34D399]/20 font-bold"
                            >
                              [ INTEL GAP ]
                            </button>
                          );
                        if (l.type === 'entity')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/entities`)}
                              className="text-[10px] bg-[#FFBA42]/10 text-[#FFBA42] border border-[#3D2A12] px-2 py-0.5 rounded-xs hover:border-[#FF9E1B] font-bold"
                            >
                              [ ENTITY DOSSIER ]
                            </button>
                          );
                        if (l.type === 'hypothesis')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/hypotheses`)}
                              className="text-[10px] bg-[#FFE7B8]/10 text-[#FFE7B8] border border-[#3D2A12] px-2 py-0.5 rounded-xs hover:border-[#FFE7B8] font-bold"
                            >
                              [ HYPOTHESIS ]
                            </button>
                          );
                        return (
                          <span
                            key={j}
                            className="text-[10px] bg-[#0D0B08] text-[#A6732E] border border-[#3D2A12] px-2 py-0.5 rounded-xs"
                          >
                            {l.type}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Evidentiary citations breakdown */}
                  {m.content.citations?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#3D2A12]/60 space-y-1.5">
                      <div className="text-[10px] text-[#A6732E] font-bold flex items-center justify-between">
                        <span>EVIDENTIARY CITATIONS ({m.content.citations.length})</span>
                        <span className="text-[#34D399]">PROVENANCE VERIFIED</span>
                      </div>
                      <div className="space-y-1">
                        {m.content.citations.map((c: any, j: number) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 bg-[#14110C] p-1.5 rounded-xs border border-[#3D2A12]/50 text-[11px]"
                          >
                            <StatusBadge status={c.type} />
                            <span className="text-[#FFE7B8]">
                              {c.title ||
                                c.label ||
                                c.id ||
                                (c.count != null ? `${c.count} records` : '') ||
                                ''}
                              {c.evidence_file_id && (
                                <span className="text-[#A6732E]">
                                  {' '}
                                  · DOC #{c.evidence_file_id.slice(0, 8)}
                                  {c.page ? ` [P.${c.page}]` : ''}
                                </span>
                              )}
                              {c.hops != null && (
                                <span className="text-[#FF9E1B]"> · {c.hops} GRAPH HOPS</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow up tactical prompts */}
                  {m.content.follow_ups?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#3D2A12]/60 space-y-1.5">
                      <div className="text-[10px] text-[#A6732E] uppercase">
                        RECOMMENDED FOLLOW-UP INTERROGATIONS
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.content.follow_ups.map((f: string, j: number) => (
                          <button
                            key={j}
                            onClick={() => handleSuggestedPrompt(f)}
                            className="text-[11px] bg-[#14110C] hover:bg-[#1A140B] border border-[#3D2A12] hover:border-[#FF9E1B] text-[#FFE7B8] px-2.5 py-1 rounded-xs transition-colors text-left"
                          >
                            ❯ {f}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="leading-relaxed whitespace-pre-wrap">{m.content}</p>
              )}
            </div>
          </div>
        ))}

        {askMutation.isPending && (
          <div className="flex flex-col items-start space-y-1">
            <div className="text-[10px] text-[#A6732E] uppercase">
              ORACLE // SYNTHESIS IN PROGRESS...
            </div>
            <div className="bg-[#14110C] border border-[#3D2A12] p-3 rounded-xs text-xs text-[#FF9E1B] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FF9E1B] animate-ping" />
              <span>Scanning graph relationships and validating evidence citations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal prompt input bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-[#FF9E1B] font-bold text-sm pointer-events-none">
            ❯
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type intelligence query, entity handle, or contradiction request..."
            disabled={askMutation.isPending}
            className="w-full pl-8 pr-4 py-2.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder:text-[#7A521D]"
          />
        </div>
        <TerminalButton
          type="submit"
          variant="primary"
          disabled={!query.trim() || askMutation.isPending}
        >
          {askMutation.isPending ? '[ PROCESSING ]' : '[ TRANSMIT ]'}
        </TerminalButton>
      </form>
    </div>
  );
}
