import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';
import { AlertTriangle, ShieldAlert } from 'lucide-react';

export default function Contradictions() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [reviewNote, setReviewNote] = useState('');
  const [createForm, setCreateForm] = useState({
    title: '',
    statementA: '',
    statementB: '',
    time_context: '',
    detection_method: '',
    explanation: '',
  });

  const { data: contradictions, isLoading } = useQuery({
    queryKey: ['contradictions', caseId, statusFilter],
    queryFn: () => api.getContradictions(caseId!, statusFilter || undefined),
    enabled: !!caseId,
  });

  const { data: detail } = useQuery({
    queryKey: ['contradiction', caseId, selected?.id],
    queryFn: () => api.getContradiction(caseId!, selected!.id),
    enabled: !!caseId && !!selected,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ decision }: any) =>
      api.reviewContradiction(caseId!, selected!.id, { decision, note: reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contradictions', caseId] });
      queryClient.invalidateQueries({ queryKey: ['contradiction', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      setReviewNote('');
    },
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createContradiction(caseId!, {
        title: createForm.title,
        statements: [
          { text: createForm.statementA, source_ref: {} },
          { text: createForm.statementB, source_ref: {} },
        ],
        time_context: createForm.time_context || undefined,
        detection_method: createForm.detection_method || undefined,
        explanation: createForm.explanation || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contradictions', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      setShowCreate(false);
      setCreateForm({
        title: '',
        statementA: '',
        statementB: '',
        time_context: '',
        detection_method: '',
        explanation: '',
      });
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="INTEGRITY // 04"
        title="CONTRADICTION CONTROL CONSOLE"
        description="Conflicting witness statements, telecommunication mismatches, and epistemic falsification tracking."
      >
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
          >
            <option value="">ALL STATUSES</option>
            <option value="open">STATUS: OPEN</option>
            <option value="needs_clarification">STATUS: NEEDS CLARIFICATION</option>
            <option value="resolved">STATUS: RESOLVED</option>
            <option value="dismissed">STATUS: DISMISSED</option>
          </select>
          <TerminalButton
            variant="primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '[ CANCEL ]' : '+ RECORD CONTRADICTION'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Creation form */}
      {showCreate && (
        <TerminalPanel title="RECORD COMPETING / CONFLICTING EVIDENCE" variant="raised">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                CONTRADICTION TITLE / HYPOTHESIS TARGET
              </label>
              <input
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Alibi Conflict: Suspect claims home presence vs cell tower ping"
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#FF9E1B] uppercase tracking-wider mb-1">
                  CLAIM A (PROPOSITION 01)
                </label>
                <textarea
                  value={createForm.statementA}
                  onChange={e => setCreateForm({ ...createForm, statementA: e.target.value })}
                  placeholder="Suspect witness transcript claims residence in Mumbai all night..."
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#EF4444] uppercase tracking-wider mb-1">
                  CLAIM B (MUTUALLY EXCLUSIVE PROPOSITION 02)
                </label>
                <textarea
                  value={createForm.statementB}
                  onChange={e => setCreateForm({ ...createForm, statementB: e.target.value })}
                  placeholder="Tower CDR extraction places device near port facility at 02:41 IST..."
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                  TEMPORAL CONTEXT
                </label>
                <input
                  value={createForm.time_context}
                  onChange={e => setCreateForm({ ...createForm, time_context: e.target.value })}
                  placeholder="e.g. 2026-03-12 02:00-04:00 IST"
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                  DETECTION PIPELINE / SOURCE
                </label>
                <input
                  value={createForm.detection_method}
                  onChange={e =>
                    setCreateForm({ ...createForm, detection_method: e.target.value })
                  }
                  placeholder="e.g. telecom_cross_validation_v2"
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                ANALYST EXPLANATION / IMPACT ON CASE
              </label>
              <textarea
                value={createForm.explanation}
                onChange={e => setCreateForm({ ...createForm, explanation: e.target.value })}
                placeholder="Details of physical impossibility or falsified log..."
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <TerminalButton
                variant="primary"
                onClick={() => createMutation.mutate()}
                disabled={
                  !createForm.title ||
                  !createForm.statementA ||
                  !createForm.statementB ||
                  createMutation.isPending
                }
              >
                {createMutation.isPending ? 'LOGGING...' : '[ REGISTER CONTRADICTION ]'}
              </TerminalButton>
              <TerminalButton onClick={() => setShowCreate(false)}>
                ABORT
              </TerminalButton>
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* Contradictions grid */}
      {isLoading ? (
        <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
          FETCHING CROSS-EXAMINATION CONFLICT REGISTRY...
        </div>
      ) : contradictions && contradictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contradictions.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`border bg-[#0D0B08] hover:border-[#FF9E1B] p-4 rounded-xs cursor-pointer transition-colors space-y-3 group ${
                selected?.id === c.id ? 'border-[#FF9E1B] bg-[#14110C]' : 'border-[#3D2A12]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-[#FFBA42] group-hover:text-[#FFE7B8] transition-colors">
                  {c.title}
                </span>
                <StatusBadge status={c.status} />
              </div>

              <div className="space-y-1.5 text-xs">
                {(c.statements || []).map((s: any, i: number) => (
                  <div
                    key={i}
                    className={`p-2 rounded-xs border text-[11px] leading-relaxed ${
                      i === 0
                        ? 'border-[#FF9E1B]/30 bg-[#FF9E1B]/5 text-[#FFE7B8]'
                        : 'border-[#EF4444]/30 bg-[#EF4444]/5 text-[#EF4444]'
                    }`}
                  >
                    <span className="font-bold mr-1">
                      {i === 0 ? '[CLAIM 1]:' : '[CLAIM 2]:'}
                    </span>{' '}
                    "{s.text}"
                  </div>
                ))}
              </div>

              {c.detection_method && (
                <div className="text-[10px] text-[#A6732E] flex items-center justify-between pt-1 border-t border-[#3D2A12]/40">
                  <span>METHOD: {c.detection_method}</span>
                  <span className="text-[#FF9E1B] group-hover:translate-x-1 transition-transform">
                    INSPECT ▶
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
          NO ACTIVE CONTRADICTIONS RECORDED FOR THIS INVESTIGATION.
        </div>
      )}

      {/* Contradiction Inspector Modal */}
      {selected && detail && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="border border-[#FF9E1B] bg-[#0D0B08] rounded-xs max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative amber-box-glow"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#3D2A12] pb-3">
              <div>
                <div className="text-sm font-bold text-[#FFBA42] flex items-center gap-2">
                  <span className="text-[#FF9E1B]">CONFLICT //</span>
                  <span>{detail.contradiction.title}</span>
                </div>
                <div className="mt-1">
                  <StatusBadge status={detail.contradiction.status} />
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-[#A6732E] hover:text-[#FFE7B8] px-2 py-1 border border-[#3D2A12]"
              >
                [ ESC ]
              </button>
            </div>

            {/* Competing statements */}
            <div className="space-y-2">
              {(detail.contradiction.statements || []).map((s: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 border rounded-xs text-xs space-y-1 ${
                    i === 0
                      ? 'border-[#FF9E1B]/40 bg-[#14110C]'
                      : 'border-[#EF4444]/40 bg-[#14110C]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#A6732E]">
                    {i === 0 ? 'MUTUALLY EXCLUSIVE ASSERTION 01' : 'MUTUALLY EXCLUSIVE ASSERTION 02'}
                  </div>
                  <div className="text-[#FFE7B8] font-medium leading-relaxed">"{s.text}"</div>
                  {s.source_ref && (s.source_ref.excerpt || s.source_ref.locator) && (
                    <div className="text-[10px] text-[#A6732E] pt-1">
                      {s.source_ref.locator && <span>LOCATOR: {s.source_ref.locator}</span>}
                      {s.source_ref.locator && s.source_ref.excerpt && <span> · </span>}
                      {s.source_ref.excerpt && (
                        <span className="italic text-[#FF9E1B]">"{s.source_ref.excerpt}"</span>
                      )}
                      {s.source_ref.evidence_id && (
                        <span className="text-[#7A521D]">
                          {' '}
                          [EVID #{s.source_ref.evidence_id.slice(0, 8)}]
                        </span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {detail.contradiction.time_context && (
              <div className="text-xs text-[#A6732E] bg-[#14110C] p-2 border border-[#3D2A12] rounded-xs">
                <span className="text-[#FF9E1B] font-bold">TIME FRAME:</span>{' '}
                {detail.contradiction.time_context}
              </div>
            )}

            {detail.contradiction.explanation && (
              <div className="text-xs text-[#FFE7B8] bg-[#14110C] p-2 border border-[#3D2A12] rounded-xs leading-relaxed">
                <span className="text-[#FF9E1B] font-bold">REASONING:</span>{' '}
                {detail.contradiction.explanation}
              </div>
            )}

            {/* Review History */}
            {detail.review_history?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#A6732E]">
                  AUDIT LOG // DECISION TIMELINE
                </div>
                <div className="space-y-1">
                  {detail.review_history.map((h: any) => (
                    <div
                      key={h.id}
                      className="text-xs bg-[#14110C] border border-[#3D2A12]/50 p-2 rounded-xs"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge status={h.decision} />
                        <span className="text-[10px] text-[#A6732E]">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      {h.note && <div className="text-[#FFE7B8] mt-1 text-[11px]">{h.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Decision Console */}
            <div className="border-t border-[#3D2A12] pt-3 space-y-2">
              <div className="text-[10px] uppercase text-[#A6732E]">
                RESOLVE CONTRADICTION STATUS
              </div>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Corroborating record or rationale for dismissal..."
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                rows={2}
              />
              <div className="flex gap-2 flex-wrap">
                <TerminalButton
                  variant="primary"
                  size="xs"
                  onClick={() => reviewMutation.mutate({ decision: 'resolved' })}
                  disabled={reviewMutation.isPending}
                >
                  [ RESOLVED ]
                </TerminalButton>
                <TerminalButton
                  size="xs"
                  onClick={() => reviewMutation.mutate({ decision: 'needs_clarification' })}
                  disabled={reviewMutation.isPending}
                >
                  [ CLARIFICATION NEEDED ]
                </TerminalButton>
                <TerminalButton
                  size="xs"
                  onClick={() => reviewMutation.mutate({ decision: 'open' })}
                  disabled={reviewMutation.isPending}
                >
                  [ KEEP OPEN ]
                </TerminalButton>
                <TerminalButton
                  variant="danger"
                  size="xs"
                  onClick={() => reviewMutation.mutate({ decision: 'dismissed' })}
                  disabled={reviewMutation.isPending}
                >
                  [ DISMISS ]
                </TerminalButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
