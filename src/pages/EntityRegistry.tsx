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

export default function EntityRegistry() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');

  const { data: entities } = useQuery({
    queryKey: ['entities', caseId, typeFilter, search],
    queryFn: () => api.getEntities(caseId!, typeFilter || undefined, search || undefined),
    enabled: !!caseId,
  });

  const { data: mergeSuggestions } = useQuery({
    queryKey: ['merge-suggestions', caseId],
    queryFn: () => api.getMergeSuggestions(caseId!),
    enabled: !!caseId,
  });

  const generateMerges = useMutation({
    mutationFn: () => api.generateMergeCandidates(caseId!),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['merge-suggestions', caseId] }),
  });

  const mergeDecision = useMutation({
    mutationFn: ({ id, decision }: any) =>
      decision === 'apply' ? api.applyMergeSuggestion(caseId!, id) : api.dismissMergeSuggestion(caseId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['merge-suggestions', caseId] });
      queryClient.invalidateQueries({ queryKey: ['entities', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
    },
  });

  const pendingMerges = (mergeSuggestions || []).filter((m: any) => m.review_state === 'new');

  const reviewMutation = useMutation({
    mutationFn: ({ entityId, decision }: any) => api.reviewEntity(caseId!, entityId, { decision, note: reviewNote }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['entities', caseId] }); setSelectedEntity(null); setReviewNote(''); },
  });

  const typeLabels: Record<string, string> = {
    person: 'Person', alias: 'Alias', phone_sim: 'Phone/SIM', device: 'Device',
    account: 'Account', location: 'Location', organization: 'Organization',
    domain_ip: 'Domain/IP', event: 'Event', document: 'Document',
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="REGISTRY // 03"
        title="TARGET & SUBJECT ENTITY REPOSITORY"
        description="Index of extracted identities, telecommunication nodes, digital devices, physical locations, and algorithmic disambiguation merges."
      >
        <div className="flex items-center gap-3">
          <TerminalButton
            variant="secondary"
            onClick={() => generateMerges.mutate()}
            disabled={generateMerges.isPending}
          >
            {generateMerges.isPending ? '[ SCANNING CANDIDATES... ]' : '⚡ RUN MERGE SCAN'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Merge Suggestions Banner */}
      <TerminalPanel
        title={`ALGORITHMIC MERGE CANDIDATES (${pendingMerges.length})`}
        variant={pendingMerges.length > 0 ? 'raised' : 'default'}
        action={
          <span className="text-[10px] text-[#6F887A]">
            AUTO-DISAMBIGUATION ENGINE
          </span>
        }
      >
        <p className="text-xs text-[#6F887A] mb-3">
          Review confidence-scored candidate merges detected via matching identifiers, shared telephony, or co-occurrence proximity.
        </p>

        {pendingMerges.length > 0 ? (
          <div className="space-y-2">
            {pendingMerges.map((m: any) => (
              <div
                key={m.id}
                className="border border-[#27453A] bg-[#07100D] p-3 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="text-xs text-[#D8E5DC] flex items-center gap-2">
                    <span className="text-[#FFB84D] font-bold">PRIMARY: #{m.primary_entity_id?.slice(0, 8)}</span>
                    <span className="text-[#6F887A]">← MERGE ←</span>
                    <span className="text-[#E05A52] font-bold">SECONDARY: #{m.secondary_entity_id?.slice(0, 8)}</span>
                  </div>
                  {m.reason && <div className="text-[11px] text-[#D8E5DC]">{m.reason}</div>}
                  {m.basis && (
                    <div className="text-[10px] text-[#6F887A]">
                      BASIS: {m.basis} · {m.evidence_record_ids?.length || 0} SUPPORTING SIGNALS
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-xs font-bold border ${
                      m.confidence >= 0.8
                        ? 'border-[#9FE3B1]/40 text-[#9FE3B1] bg-[#9FE3B1]/10'
                        : m.confidence >= 0.5
                        ? 'border-[#FFB84D]/40 text-[#FFB84D] bg-[#FFB84D]/10'
                        : 'border-[#27453A] text-[#6F887A] bg-[#0B1713]'
                    }`}
                  >
                    CONF: {Math.round((m.confidence || 0) * 100)}%
                  </span>
                  <TerminalButton
                    size="xs"
                    variant="primary"
                    onClick={() => mergeDecision.mutate({ id: m.id, decision: 'apply' })}
                    disabled={mergeDecision.isPending}
                  >
                    [ APPLY MERGE ]
                  </TerminalButton>
                  <TerminalButton
                    size="xs"
                    onClick={() => mergeDecision.mutate({ id: m.id, decision: 'dismiss' })}
                    disabled={mergeDecision.isPending}
                  >
                    [ DISMISS ]
                  </TerminalButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-[#6F887A] py-2">
            NO PENDING MERGE CANDIDATES. RUN MERGE SCAN TO LOCATE DISPERSION ANOMALIES.
          </div>
        )}
      </TerminalPanel>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Entity Registry Table */}
        <div className="lg:col-span-8 space-y-4">
          <TerminalPanel
            title={`INDEXED ENTITIES (${entities?.length || 0})`}
            action={
              <div className="flex items-center gap-3">
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="px-2 py-1 bg-[#07100D] border border-[#27453A] rounded-xs text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                >
                  <option value="">ALL CLASSIFICATIONS</option>
                  {Object.entries(typeLabels).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.toUpperCase()}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="FILTER ENTITIES..."
                  className="px-2 py-1 bg-[#07100D] border border-[#27453A] rounded-xs text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none placeholder:text-[#3C6653] w-48"
                />
              </div>
            }
          >
            {entities && entities.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#27453A] text-[#6F887A]">
                      <th className="py-2.5 px-3 font-semibold">LABEL / IDENTITY</th>
                      <th className="py-2.5 px-3 font-semibold">TYPE</th>
                      <th className="py-2.5 px-3 font-semibold">IDENTIFIERS</th>
                      <th className="py-2.5 px-3 font-semibold">REVIEW STATUS</th>
                      <th className="py-2.5 px-3 font-semibold text-right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#27453A]/40">
                    {entities.map((e: any) => (
                      <tr
                        key={e.id}
                        onClick={() => setSelectedEntity(e)}
                        className={`cursor-pointer transition-colors ${
                          selectedEntity?.id === e.id
                            ? 'bg-[#0F1D18] border-l-2 border-[#FFB84D]'
                            : 'hover:bg-[#0B1713]'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-bold text-[#D8E5DC]">
                          {e.label}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#07100D] border border-[#27453A] text-[#9FE3B1] uppercase">
                            {typeLabels[e.entity_type] || e.entity_type}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[#6F887A]">
                          {e.identifiers?.length || 0} LINKED
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge status={e.review_state || 'new'} />
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="text-[#FFB84D] text-[11px] hover:underline">
                            [ INSPECT ]
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-[#6F887A] text-xs">
                NO MATCHING ENTITIES IN THIS JURISDICTION.
              </div>
            )}
          </TerminalPanel>
        </div>

        {/* Entity Inspector Sidecar */}
        <div className="lg:col-span-4 sticky top-16">
          {selectedEntity ? (
            <TerminalPanel
              title="ENTITY DOSSIER"
              variant="raised"
              action={
                <StatusBadge status={selectedEntity.review_state || 'new'} />
              }
            >
              <div className="space-y-4 text-xs">
                <div>
                  <div className="text-[10px] text-[#6F887A] uppercase">TARGET LABEL</div>
                  <div className="font-bold text-sm text-[#FFB84D]">{selectedEntity.label}</div>
                  <div className="text-[10px] text-[#6F887A] mt-0.5">
                    SYSTEM ID: #{selectedEntity.id.slice(0, 12)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-[#07100D] p-2.5 border border-[#27453A] rounded-sm text-[11px]">
                  <div>
                    <span className="text-[#6F887A]">TYPE:</span>{' '}
                    <span className="text-[#D8E5DC] font-bold">
                      {typeLabels[selectedEntity.entity_type] || selectedEntity.entity_type}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#6F887A]">RECORDS:</span>{' '}
                    <span className="text-[#D8E5DC] font-bold">
                      {selectedEntity.source_record_ids?.length || 0}
                    </span>
                  </div>
                </div>

                {selectedEntity.identifiers?.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[10px] text-[#6F887A] uppercase font-bold">
                      IDENTIFIERS & TRAIL MARKS ({selectedEntity.identifiers.length})
                    </div>
                    <div className="space-y-1">
                      {selectedEntity.identifiers.map((id: any) => (
                        <div
                          key={id.id}
                          className="bg-[#07100D] border border-[#27453A] p-2 rounded-xs flex items-center justify-between text-[11px]"
                        >
                          <span className="text-[#6F887A] font-semibold uppercase">{id.id_type}:</span>
                          <span className="text-[#D8E5DC] font-bold font-mono">{id.id_value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Action */}
                <div className="border-t border-[#27453A] pt-3 space-y-2">
                  <div className="text-[10px] text-[#6F887A] uppercase font-bold">
                    INVESTIGATIVE DETERMINATION
                  </div>
                  <textarea
                    value={reviewNote}
                    onChange={e => setReviewNote(e.target.value)}
                    placeholder="Enter forensic officer annotation..."
                    rows={2}
                    className="w-full px-2.5 py-1.5 bg-[#07100D] border border-[#27453A] rounded-xs text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none placeholder:text-[#3C6653]"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <TerminalButton
                      size="xs"
                      onClick={() =>
                        reviewMutation.mutate({
                          entityId: selectedEntity.id,
                          decision: 'needs_verification',
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      [ VERIFY ]
                    </TerminalButton>
                    <TerminalButton
                      size="xs"
                      variant="primary"
                      onClick={() =>
                        reviewMutation.mutate({
                          entityId: selectedEntity.id,
                          decision: 'supported_by_reviewer',
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      [ CONFIRM ]
                    </TerminalButton>
                    <TerminalButton
                      size="xs"
                      variant="danger"
                      onClick={() =>
                        reviewMutation.mutate({
                          entityId: selectedEntity.id,
                          decision: 'rejected',
                        })
                      }
                      disabled={reviewMutation.isPending}
                    >
                      [ REJECT ]
                    </TerminalButton>
                  </div>
                </div>
              </div>
            </TerminalPanel>
          ) : (
            <div className="border border-[#27453A] bg-[#07100D] p-8 text-center text-[#6F887A] rounded-sm space-y-2">
              <div className="text-xs text-[#FFB84D] font-bold">
                [ AWAITING TARGET SELECTION ]
              </div>
              <p className="text-[11px] text-[#6F887A]">
                Select an entity row from the registry to inspect identifiers, forensic records, and log officer determinations.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
