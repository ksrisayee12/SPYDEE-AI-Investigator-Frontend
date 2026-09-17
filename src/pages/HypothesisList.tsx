import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';
import { Lightbulb, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function HypothesisList() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [stateFilter, setStateFilter] = useState('');

  const { data: hypotheses, isLoading } = useQuery({
    queryKey: ['hypotheses', caseId, stateFilter],
    queryFn: () => api.getHypotheses(caseId!, stateFilter || undefined),
    enabled: !!caseId,
  });

  const detailQuery = useQuery({
    queryKey: ['hypothesis', caseId, selected?.id],
    queryFn: () => api.getHypothesis(caseId!, selected.id),
    enabled: !!selected,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ decision }: any) =>
      api.reviewHypothesis(caseId!, selected.id, { decision, note: reviewNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hypotheses', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      setSelected(null);
      setReviewNote('');
    },
  });

  const familyIcons: Record<string, string> = {
    financial: '[$]',
    communication: '[@]',
    spatial_temporal: '[#]',
    network_topology: '[%]',
    writing_style: '[T]',
    device_sim: '[D]',
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selected) {
        setSelected(null);
        setReviewNote('');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selected]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="REASONING // 03"
        title="HYPOTHESIS MATRIX & EPISTEMIC SCORING"
        description="Multi-family signal fusion models, contradiction verification, and human-in-the-loop analyst decisions."
      >
        <div className="flex items-center gap-3">
          <select
            value={stateFilter}
            onChange={e => setStateFilter(e.target.value)}
            className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
          >
            <option value="">ALL STATES (UNFILTERED)</option>
            <option value="new">STATE: NEW</option>
            <option value="needs_verification">STATE: NEEDS VERIFICATION</option>
            <option value="supported_by_reviewer">STATE: SUPPORTED</option>
            <option value="rejected">STATE: REJECTED</option>
          </select>
          <span className="text-xs text-[#A6732E]">
            {hypotheses?.length || 0} TOTAL HYPOTHESES
          </span>
        </div>
      </WorkspaceHeader>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main List */}
        <div className="flex-1 space-y-3">
          {isLoading ? (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
              SYNTHESIZING EPISTEMIC HYPOTHESIS MODELS...
            </div>
          ) : hypotheses && hypotheses.length > 0 ? (
            hypotheses.map((h: any) => {
              const isContradicted = h.contributing_signal_highlights?.some(
                (_: string, i: number) => {
                  const signal = detailQuery.data?.signals?.[i];
                  return signal?.contradiction;
                }
              );

              return (
                <div
                  key={h.id}
                  onClick={() => setSelected(h)}
                  className={`border bg-[#0D0B08] p-4 rounded-xs cursor-pointer transition-colors relative group ${
                    selected?.id === h.id
                      ? 'border-[#FF9E1B] bg-[#14110C]'
                      : isContradicted
                      ? 'border-[#EF4444]/60 hover:border-[#EF4444]'
                      : 'border-[#3D2A12] hover:border-[#FF9E1B]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-[#FF9E1B] font-bold">
                          {familyIcons[h.engine_version?.split(' ')[0] || ''] || '[◆]'}{' '}
                          {h.hypothesis_type?.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {isContradicted && (
                          <span className="text-[10px] px-1.5 py-0.2 border border-[#EF4444] text-[#EF4444] uppercase bg-[#EF4444]/10 font-bold">
                            ⚠ CONTRADICTED
                          </span>
                        )}
                        <StatusBadge status={h.review_state} />
                      </div>

                      <p className="text-xs text-[#FFE7B8]/90 line-clamp-2 leading-relaxed">
                        {h.notes}
                      </p>

                      <div className="flex items-center gap-4 text-[11px] text-[#A6732E] pt-1">
                        <span>SIGNALS: {h.contributing_signal_highlights?.length || 0}</span>
                        <span>·</span>
                        <span>QUALITY: {(h.quality_factor * 100).toFixed(0)}%</span>
                        <span>·</span>
                        <span className="text-[#7A521D]">
                          ENGINE: {h.engine_version?.split(' ')[1] || 'v2.0'}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div
                        className={`text-2xl font-bold font-mono ${
                          h.numeric_value >= 70
                            ? 'text-[#FF9E1B]'
                            : h.numeric_value >= 40
                            ? 'text-[#34D399]'
                            : 'text-[#A6732E]'
                        }`}
                      >
                        {Math.round(h.numeric_value)}
                        <span className="text-xs text-[#A6732E]">/100</span>
                      </div>
                      <div className="text-[9px] uppercase tracking-wider text-[#A6732E] mt-0.5">
                        FUSION SCORE
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="border border-[#3D2A12] bg-[#0D0B08] p-12 text-center text-xs text-[#A6732E] rounded-xs">
              NO HYPOTHESES GENERATED YET. TRIGGER FUSION PIPELINE FROM COMMAND CENTER.
            </div>
          )}
        </div>

        {/* Selected Inspector Drawer / Panel */}
        {selected && (
          <div className="w-full lg:w-[420px] shrink-0">
            <TerminalPanel
              title={`DOSSIER // ${selected.id?.slice(0, 8)}`}
              variant="raised"
              action={
                <button
                  onClick={() => {
                    setSelected(null);
                    setReviewNote('');
                  }}
                  className="text-xs text-[#A6732E] hover:text-[#FFE7B8] px-1.5 py-0.5 border border-[#3D2A12]"
                >
                  [ ESC ]
                </button>
              }
            >
              <div className="space-y-4 pt-1">
                {/* Score Callout */}
                <div className="border border-[#3D2A12] bg-[#0D0B08] p-3 rounded-xs text-center">
                  <div
                    className={`text-3xl font-bold font-mono ${
                      selected.numeric_value >= 70
                        ? 'text-[#FF9E1B]'
                        : selected.numeric_value >= 40
                        ? 'text-[#34D399]'
                        : 'text-[#A6732E]'
                    }`}
                  >
                    {Math.round(selected.numeric_value)}
                    <span className="text-sm text-[#A6732E]">/100</span>
                  </div>
                  <div className="text-[10px] text-[#FF9E1B] uppercase font-bold tracking-wider mt-1">
                    {selected.hypothesis_type?.replace(/_/g, ' ')}
                  </div>
                </div>

                {/* Epistemic Guardrail Notice */}
                <div className="border border-[#3D2A12] bg-[#14110C] p-2.5 rounded-xs text-[11px] text-[#A6732E] leading-relaxed">
                  <span className="text-[#FFBA42] font-bold">METHODOLOGY NOTE:</span> Score is a
                  weighted multi-family evidence correlation,{' '}
                  <span className="underline">not</span> a mathematical conviction probability. High
                  scores mandate sworn analyst verification prior to field action.
                </div>

                {/* Notes */}
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[#A6732E] mb-1">
                    SYNTHESIZED NARRATIVE
                  </div>
                  <p className="text-xs text-[#FFE7B8] leading-relaxed bg-[#14110C] p-2.5 border border-[#3D2A12] rounded-xs">
                    {selected.notes}
                  </p>
                </div>

                {/* Contradiction Warning */}
                {detailQuery.data?.signals?.some((s: any) => s.contradiction) && (
                  <div className="border border-[#EF4444] bg-[#EF4444]/10 p-3 rounded-xs text-xs text-[#EF4444] space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <span>⚠</span> EPISTEMIC CONTRADICTION DETECTED
                    </div>
                    <div className="text-[11px] text-[#FFE7B8]/80">
                      {detailQuery.data.signals.filter((s: any) => s.contradiction).length} signals
                      conflict with this model. Negative weight penalty applied.
                    </div>
                  </div>
                )}

                {/* Contributing Signals */}
                {detailQuery.data?.signals?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-[#A6732E]">
                      CONTRIBUTING SIGNALS ({detailQuery.data.signals.length})
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {detailQuery.data.signals.map((s: any, i: number) => (
                        <div
                          key={i}
                          className={`p-2 rounded-xs border text-xs ${
                            s.contradiction
                              ? 'border-[#EF4444] bg-[#EF4444]/10'
                              : 'border-[#3D2A12] bg-[#14110C]'
                          }`}
                        >
                          <div className="flex justify-between items-center text-[11px]">
                            <span className="text-[#FF9E1B] uppercase font-bold">
                              {s.family}
                              {s.contradiction && (
                                <span className="ml-1 text-[#EF4444]">[CONTRADICTS]</span>
                              )}
                            </span>
                            <span className="text-[#34D399]">
                              {Math.round(s.weight * 100)}% WEIGHT
                            </span>
                          </div>
                          <div className="text-[11px] text-[#A6732E] mt-1">
                            {s.signal?.explanation || s.signal?.notes || 'No notes logged.'}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Actions */}
                {detailQuery.data?.recommendations?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-[#A6732E]">
                      SYSTEM RECOMMENDED ACTIONS
                    </div>
                    <div className="space-y-1.5">
                      {detailQuery.data.recommendations.map((r: any, i: number) => (
                        <div
                          key={i}
                          className="p-2 border border-[#3D2A12] bg-[#14110C] rounded-xs text-xs space-y-0.5"
                        >
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-[#FFE7B8] uppercase">
                              {r.type?.replace(/_/g, ' ')}
                            </span>
                            <StatusBadge status={r.status} />
                          </div>
                          <div className="text-[10px] text-[#A6732E]">{r.rationale}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Record Analyst Decision Console */}
                <div className="border-t border-[#3D2A12] pt-3 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-[#A6732E]">
                    RECORD ANALYST EVALUATION
                  </div>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Mandatory analyst rationale or corroborating file index..."
                    className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <TerminalButton
                      variant="primary"
                      size="xs"
                      onClick={() =>
                        reviewMutation.mutate({ decision: 'supported_by_reviewer' })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      [ SUPPORT ]
                    </TerminalButton>
                    <TerminalButton
                      size="xs"
                      onClick={() =>
                        reviewMutation.mutate({ decision: 'needs_verification' })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      [ VERIFY ]
                    </TerminalButton>
                    <TerminalButton
                      variant="danger"
                      size="xs"
                      onClick={() => reviewMutation.mutate({ decision: 'rejected' })}
                      disabled={reviewMutation.isPending}
                    >
                      [ REJECT ]
                    </TerminalButton>
                  </div>
                </div>
              </div>
            </TerminalPanel>
          </div>
        )}
      </div>
    </div>
  );
}
