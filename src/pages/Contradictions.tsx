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
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="INTEGRITY // 04"
        title="CONTRADICTION CONTROL CONSOLE"
        description="Conflicting witness statements, telecommunication mismatches, and epistemic falsification tracking."
      >
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#0F1D18] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
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
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                CONTRADICTION TITLE / HYPOTHESIS TARGET
              </label>
              <input
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="e.g. Alibi Conflict: Suspect claims home presence vs cell tower ping"
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#FFB84D] uppercase tracking-wider mb-1">
                  CLAIM A (PROPOSITION 01)
                </label>
                <textarea
                  value={createForm.statementA}
                  onChange={e => setCreateForm({ ...createForm, statementA: e.target.value })}
                  placeholder="Suspect witness transcript claims residence in Mumbai all night..."
                  className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-[10px] text-[#E05A52] uppercase tracking-wider mb-1">
                  CLAIM B (MUTUALLY EXCLUSIVE PROPOSITION 02)
                </label>
                <textarea
                  value={createForm.statementB}
                  onChange={e => setCreateForm({ ...createForm, statementB: e.target.value })}
                  placeholder="Tower CDR extraction places device near port facility at 02:41 IST..."
                  className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                  TEMPORAL CONTEXT
                </label>
                <input
                  value={createForm.time_context}
                  onChange={e => setCreateForm({ ...createForm, time_context: e.target.value })}
                  placeholder="e.g. 2026-03-12 02:00-04:00 IST"
                  className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                  DETECTION PIPELINE / SOURCE
                </label>
                <input
                  value={createForm.detection_method}
                  onChange={e =>
                    setCreateForm({ ...createForm, detection_method: e.target.value })
                  }
                  placeholder="e.g. telecom_cross_validation_v2"
                  className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                ANALYST EXPLANATION / IMPACT ON CASE
              </label>
              <textarea
                value={createForm.explanation}
                onChange={e => setCreateForm({ ...createForm, explanation: e.target.value })}
                placeholder="Details of physical impossibility or falsified log..."
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
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
        <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
          FETCHING CROSS-EXAMINATION CONFLICT REGISTRY...
        </div>
      ) : contradictions && contradictions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {contradictions.map((c: any) => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`border bg-[#0B1713] hover:border-[#FFB84D] p-4 rounded-sm cursor-pointer transition-colors space-y-3 group ${
                selected?.id === c.id ? 'border-[#FFB84D] bg-[#0F1D18]' : 'border-[#27453A]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-xs text-[#D8E5DC] group-hover:text-[#FFB84D] transition-colors">
                  {c.title}
                </span>
                <StatusBadge status={c.status} />
              </div>

              <div className="space-y-1.5 text-xs">
                {(c.statements || []).map((s: any, i: number) => (
                  <div
                    key={i}
                    className={`p-2 rounded-sm border text-[11px] leading-relaxed ${
                      i === 0
                        ? 'border-[#FFB84D]/30 bg-[#FFB84D]/5 text-[#FFD27A]'
                        : 'border-[#E05A52]/30 bg-[#E05A52]/5 text-[#E05A52]'
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
                <div className="text-[10px] text-[#6F887A] flex items-center justify-between pt-1 border-t border-[#27453A]/40">
                  <span>METHOD: {c.detection_method}</span>
                  <span className="text-[#FFB84D] group-hover:translate-x-1 transition-transform">
                    INSPECT ▶
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
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
            className="border border-[#27453A] bg-[#07100D] rounded-sm max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#27453A] pb-3">
              <div>
                <div className="text-sm font-bold text-[#D8E5DC] flex items-center gap-2">
                  <span className="text-[#FFB84D]">CONFLICT //</span>
                  <span>{detail.contradiction.title}</span>
                </div>
                <div className="mt-1">
                  <StatusBadge status={detail.contradiction.status} />
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-xs text-[#6F887A] hover:text-[#D8E5DC] px-2 py-1 border border-[#27453A]"
              >
                [ ESC ]
              </button>
            </div>

            {/* Competing statements */}
            <div className="space-y-2">
              {(detail.contradiction.statements || []).map((s: any, i: number) => (
                <div
                  key={i}
                  className={`p-3 border rounded-sm text-xs space-y-1 ${
                    i === 0
                      ? 'border-[#FFB84D]/40 bg-[#0F1D18]'
                      : 'border-[#E05A52]/40 bg-[#0B1713]'
                  }`}
                >
                  <div className="text-[10px] uppercase font-bold text-[#6F887A]">
                    {i === 0 ? 'MUTUALLY EXCLUSIVE ASSERTION 01' : 'MUTUALLY EXCLUSIVE ASSERTION 02'}
                  </div>
                  <div className="text-[#D8E5DC] font-medium leading-relaxed">"{s.text}"</div>
                  {s.source_ref && (s.source_ref.excerpt || s.source_ref.locator) && (
                    <div className="text-[10px] text-[#6F887A] pt-1">
                      {s.source_ref.locator && <span>LOCATOR: {s.source_ref.locator}</span>}
                      {s.source_ref.locator && s.source_ref.excerpt && <span> · </span>}
                      {s.source_ref.excerpt && (
                        <span className="italic text-[#9FE3B1]">"{s.source_ref.excerpt}"</span>
                      )}
                      {s.source_ref.evidence_id && (
                        <span className="text-[#3C6653]">
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
              <div className="text-xs text-[#6F887A] bg-[#0F1D18] p-2 border border-[#27453A] rounded-sm">
                <span className="text-[#FFB84D] font-bold">TIME FRAME:</span>{' '}
                {detail.contradiction.time_context}
              </div>
            )}

            {detail.contradiction.explanation && (
              <div className="text-xs text-[#D8E5DC] bg-[#0F1D18] p-2 border border-[#27453A] rounded-sm leading-relaxed">
                <span className="text-[#FFB84D] font-bold">REASONING:</span>{' '}
                {detail.contradiction.explanation}
              </div>
            )}

            {/* Review History */}
            {detail.review_history?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#6F887A]">
                  AUDIT LOG // DECISION TIMELINE
                </div>
                <div className="space-y-1">
                  {detail.review_history.map((h: any) => (
                    <div
                      key={h.id}
                      className="text-xs bg-[#0F1D18] border border-[#27453A]/50 p-2 rounded-sm"
                    >
                      <div className="flex items-center justify-between">
                        <StatusBadge status={h.decision} />
                        <span className="text-[10px] text-[#6F887A]">
                          {h.created_at ? new Date(h.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      {h.note && <div className="text-[#D8E5DC] mt-1 text-[11px]">{h.note}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Apply Decision Console */}
            <div className="border-t border-[#27453A] pt-3 space-y-2">
              <div className="text-[10px] uppercase text-[#6F887A]">
                RESOLVE CONTRADICTION STATUS
              </div>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Corroborating record or rationale for dismissal..."
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
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