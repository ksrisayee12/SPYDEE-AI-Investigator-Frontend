import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useState, useRef, useEffect } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';

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
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-6.5rem)] font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="INTEL // 06"
        title="TACTICAL INVESTIGATOR COPILOT"
        description="Neural graph query engine for multi-hop link analysis, evidentiary citations, and contradictory cross-referencing."
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[10px] text-[#6F887A] bg-[#0B1713] px-3 py-1.5 border border-[#27453A] rounded-sm">
            <span className="w-2 h-2 rounded-full bg-[#9FE3B1] animate-pulse" />
            <span>NEURAL REASONING ENGINE ACTIVE</span>
          </div>
        </div>
      </WorkspaceHeader>

      {/* Main chat terminal window */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-[#07100D] border border-[#27453A] p-4 my-4 space-y-4 rounded-sm relative"
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #9FE3B1 1px, transparent 1px), linear-gradient(to bottom, #9FE3B1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {messages.length === 0 && history && history.length > 0 && (
          <div className="border border-[#27453A] bg-[#0B1713] p-3 rounded-sm space-y-2">
            <div className="text-[10px] text-[#6F887A] uppercase tracking-wider flex items-center justify-between">
              <span>PRIOR INTERROGATION LOGS (RECENT QUERIES)</span>
              <span className="text-[#3C6653]">{history.length} SAVED SESSIONS</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {history.slice(0, 4).map((m: any) => (
                <div
                  key={m.id}
                  onClick={() => handleSuggestedPrompt(m.query)}
                  className="bg-[#0F1D18] hover:bg-[#132720] border border-[#27453A] hover:border-[#FFB84D] p-2 rounded-xs cursor-pointer transition-colors text-xs space-y-1 group"
                >
                  <div className="text-[#FFB84D] font-bold truncate group-hover:text-[#FFD27A]">
                    ❯ {m.query}
                  </div>
                  <div className="text-[11px] text-[#6F887A] line-clamp-2">
                    {m.response?.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="text-center py-10 space-y-4">
            <div className="inline-block p-4 border border-[#27453A] bg-[#0B1713] rounded-sm text-left max-w-xl space-y-2">
              <div className="text-xs text-[#FFB84D] font-bold flex items-center gap-2">
                <span>[ PROTOCOL READY ]</span>
                <span className="text-[10px] text-[#6F887A]">AWAITING OPERATOR INPUT</span>
              </div>
              <p className="text-xs text-[#6F887A] leading-relaxed">
                Query graph relationships across phone records, shell companies, and surveillance logs.
                All copilot responses enforce strict provenance and source citation tracking.
              </p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] text-[#6F887A] uppercase tracking-widest">
                PRE-COMPILED RECONNAISSANCE QUERIES
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {examples.map(ex => (
                  <button
                    key={ex}
                    onClick={() => handleSuggestedPrompt(ex)}
                    className="text-xs bg-[#0F1D18] hover:bg-[#152B23] text-[#9FE3B1] hover:text-[#D8E5DC] border border-[#27453A] hover:border-[#9FE3B1] px-3 py-1.5 rounded-sm transition-colors text-left"
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
            <div className="flex items-center gap-2 text-[10px] text-[#6F887A] uppercase">
              <span>{m.role === 'user' ? 'OPERATOR // DISPATCH' : 'ORACLE // SYNTHESIS'}</span>
              {m.timestamp && <span>· {m.timestamp}</span>}
            </div>

            <div
              className={`max-w-[85%] rounded-sm p-4 text-xs border ${
                m.role === 'user'
                  ? 'bg-[#0F1D18] border-[#FFB84D] text-[#D8E5DC]'
                  : 'bg-[#0B1713] border-[#27453A] text-[#D8E5DC] space-y-3'
              }`}
            >
              {m.role === 'assistant' ? (
                <div>
                  <p className="whitespace-pre-wrap leading-relaxed font-sans text-xs text-[#D8E5DC]">
                    {m.content.answer}
                  </p>

                  {/* Deep Navigation Jump Links */}
                  {m.content.links?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#27453A]/60 flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-[#6F887A] self-center mr-1">
                        JUMP TO:
                      </span>
                      {m.content.links.map((l: any, j: number) => {
                        if (l.type === 'contradiction')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/contradictions`)}
                              className="text-[10px] bg-[#E05A52]/10 text-[#E05A52] border border-[#E05A52]/40 px-2 py-0.5 rounded-xs hover:bg-[#E05A52]/20 font-bold"
                            >
                              [ CONTRADICTION #{l.id ? l.id.slice(0, 6) : 'LINK'} ]
                            </button>
                          );
                        if (l.type === 'lead')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/leads`)}
                              className="text-[10px] bg-[#FFB84D]/10 text-[#FFB84D] border border-[#FFB84D]/40 px-2 py-0.5 rounded-xs hover:bg-[#FFB84D]/20 font-bold"
                            >
                              [ LEAD RECORD ]
                            </button>
                          );
                        if (l.type === 'information_gap')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/leads`)}
                              className="text-[10px] bg-[#9FE3B1]/10 text-[#9FE3B1] border border-[#9FE3B1]/40 px-2 py-0.5 rounded-xs hover:bg-[#9FE3B1]/20 font-bold"
                            >
                              [ INTEL GAP ]
                            </button>
                          );
                        if (l.type === 'entity')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/entities`)}
                              className="text-[10px] bg-[#6F887A]/10 text-[#9FE3B1] border border-[#27453A] px-2 py-0.5 rounded-xs hover:border-[#9FE3B1] font-bold"
                            >
                              [ ENTITY DOSSIER ]
                            </button>
                          );
                        if (l.type === 'hypothesis')
                          return (
                            <button
                              key={j}
                              onClick={() => navigate(`/cases/${caseId}/hypotheses`)}
                              className="text-[10px] bg-[#D8E5DC]/10 text-[#D8E5DC] border border-[#27453A] px-2 py-0.5 rounded-xs hover:border-[#D8E5DC] font-bold"
                            >
                              [ HYPOTHESIS ]
                            </button>
                          );
                        return (
                          <span
                            key={j}
                            className="text-[10px] bg-[#07100D] text-[#6F887A] border border-[#27453A] px-2 py-0.5 rounded-xs"
                          >
                            {l.type}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Evidentiary citations breakdown */}
                  {m.content.citations?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#27453A]/60 space-y-1.5">
                      <div className="text-[10px] text-[#6F887A] font-bold flex items-center justify-between">
                        <span>EVIDENTIARY CITATIONS ({m.content.citations.length})</span>
                        <span className="text-[#3C6653]">PROVENANCE VERIFIED</span>
                      </div>
                      <div className="space-y-1">
                        {m.content.citations.map((c: any, j: number) => (
                          <div
                            key={j}
                            className="flex items-start gap-2 bg-[#07100D] p-1.5 rounded-xs border border-[#27453A]/50 text-[11px]"
                          >
                            <StatusBadge status={c.type} />
                            <span className="text-[#D8E5DC]">
                              {c.title ||
                                c.label ||
                                c.id ||
                                (c.count != null ? `${c.count} records` : '') ||
                                ''}
                              {c.evidence_file_id && (
                                <span className="text-[#6F887A]">
                                  {' '}
                                  · DOC #{c.evidence_file_id.slice(0, 8)}
                                  {c.page ? ` [P.${c.page}]` : ''}
                                </span>
                              )}
                              {c.hops != null && (
                                <span className="text-[#FFB84D]"> · {c.hops} GRAPH HOPS</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow up tactical prompts */}
                  {m.content.follow_ups?.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-[#27453A]/60 space-y-1.5">
                      <div className="text-[10px] text-[#6F887A] uppercase">
                        RECOMMENDED FOLLOW-UP INTERROGATIONS
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.content.follow_ups.map((f: string, j: number) => (
                          <button
                            key={j}
                            onClick={() => handleSuggestedPrompt(f)}
                            className="text-[11px] bg-[#07100D] hover:bg-[#0F1D18] border border-[#27453A] hover:border-[#FFB84D] text-[#D8E5DC] px-2.5 py-1 rounded-xs transition-colors text-left"
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
            <div className="text-[10px] text-[#6F887A] uppercase">
              ORACLE // SYNTHESIS IN PROGRESS...
            </div>
            <div className="bg-[#0B1713] border border-[#27453A] p-3 rounded-sm text-xs text-[#FFB84D] flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-[#FFB84D] animate-ping" />
              <span>Scanning graph relationships and validating evidence citations...</span>
            </div>
          </div>
        )}
      </div>

      {/* Terminal prompt input bar */}
      <form onSubmit={handleSubmit} className="flex gap-2 relative">
        <div className="relative flex-1">
          <span className="absolute left-3 top-2.5 text-[#FFB84D] font-bold text-sm pointer-events-none">
            ❯
          </span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Type intelligence query, entity handle, or contradiction request..."
            disabled={askMutation.isPending}
            className="w-full pl-8 pr-4 py-2.5 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none placeholder:text-[#6F887A]"
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
