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

type Tab = 'leads' | 'gaps' | 'actions';

export default function LeadsPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('leads');
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const emptyForm: any = {
    title: '',
    description: '',
    priority: 'medium',
    gap_id: '',
    lead_id: '',
    proposed_step: '',
    expected_information: '',
    outcome_notes: '',
  };
  const [createForm, setCreateForm] = useState<any>(emptyForm);
  const [leadStatusFilter, setLeadStatusFilter] = useState('');
  const [gapStatusFilter, setGapStatusFilter] = useState('');
  const [actionStatusFilter, setActionStatusFilter] = useState('');

  const leadsQ = useQuery({
    queryKey: ['leads', caseId, leadStatusFilter],
    queryFn: () => api.getLeads(caseId!, leadStatusFilter || undefined),
    enabled: !!caseId,
  });
  const gapsQ = useQuery({
    queryKey: ['gaps', caseId, gapStatusFilter],
    queryFn: () => api.getGaps(caseId!, gapStatusFilter || undefined),
    enabled: !!caseId,
  });
  const actionsQ = useQuery({
    queryKey: ['actions', caseId, actionStatusFilter],
    queryFn: () => api.getActions(caseId!, actionStatusFilter || undefined),
    enabled: !!caseId,
  });
  const leadDetailQ = useQuery({
    queryKey: ['lead', caseId, selectedLead?.id],
    queryFn: () => api.getLead(caseId!, selectedLead!.id),
    enabled: !!caseId && !!selectedLead,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['leads', caseId] });
    queryClient.invalidateQueries({ queryKey: ['gaps', caseId] });
    queryClient.invalidateQueries({ queryKey: ['actions', caseId] });
    queryClient.invalidateQueries({ queryKey: ['lead', caseId] });
    queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
  };

  const reviewLeadMutation = useMutation({
    mutationFn: ({ decision }: any) =>
      api.reviewLead(caseId!, selectedLead!.id, { decision, note: reviewNote }),
    onSuccess: () => {
      invalidate();
      setReviewNote('');
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: (data: any) => api.updateLead(caseId!, selectedLead!.id, data),
    onSuccess: () => {
      invalidate();
    },
  });

  const createLeadMutation = useMutation({
    mutationFn: () =>
      api.createLead(caseId!, {
        title: createForm.title,
        description: createForm.description || undefined,
        priority: createForm.priority,
        origin_type: 'manual',
      }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setCreateForm(emptyForm);
    },
  });

  const createGapMutation = useMutation({
    mutationFn: () =>
      api.createGap(caseId!, {
        title: createForm.title,
        description: createForm.description || undefined,
        lead_id: createForm.lead_id || undefined,
        related_evidence_refs: [],
      }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setCreateForm(emptyForm);
    },
  });

  const createActionMutation = useMutation({
    mutationFn: () =>
      api.createAction(caseId!, {
        title: createForm.title,
        description: createForm.description || undefined,
        proposed_step: createForm.proposed_step || undefined,
        expected_information: createForm.expected_information || undefined,
        gap_id: createForm.gap_id || undefined,
        lead_id: createForm.lead_id || undefined,
      }),
    onSuccess: () => {
      invalidate();
      setShowCreate(false);
      setCreateForm(emptyForm);
    },
  });

  const updateTypeMutation = useMutation({
    mutationFn: ({ kind, id, data }: any) =>
      kind === 'lead'
        ? api.updateLead(caseId!, id, data)
        : api.updateAction(caseId!, id, data),
    onSuccess: () => {
      invalidate();
    },
  });

  const updateGapMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.updateGap(caseId!, id, data),
    onSuccess: () => {
      invalidate();
    },
  });

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'leads', label: 'LEAD TRACKER', count: leadsQ.data?.length },
    { key: 'gaps', label: 'INFORMATION GAPS', count: gapsQ.data?.length },
    { key: 'actions', label: 'TACTICAL ACTIONS', count: actionsQ.data?.length },
  ];

  const createButtonLabel =
    tab === 'leads' ? '+ NEW LEAD' : tab === 'gaps' ? '+ LOG GAP' : '+ DISPATCH ACTION';

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="TRACKING // 05"
        title="LEADS, GAPS & TACTICAL ACTIONS"
        description="Prioritized investigation tasks, operational subpoenas, and intelligence blindspot records."
      >
        <div className="flex items-center gap-3">
          <TerminalButton
            variant="primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '[ CANCEL ]' : createButtonLabel}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Terminal tab row */}
      <div className="flex border-b border-[#27453A] gap-2 pb-px">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-colors flex items-center gap-2 ${
              tab === t.key
                ? 'border-[#FFB84D] text-[#FFB84D] bg-[#0F1D18]'
                : 'border-transparent text-[#6F887A] hover:text-[#D8E5DC]'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#07100D] border border-[#27453A] text-[#9FE3B1]">
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create form drawer */}
      {showCreate && (
        <TerminalPanel
          title={`REGISTER NEW // ${
            tab === 'gaps' ? 'INFORMATION GAP' : tab === 'leads' ? 'LEAD' : 'ACTION'
          }`}
          variant="raised"
        >
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                ITEM TITLE / OBJECTIVE
              </label>
              <input
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Subject description or task target..."
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
              />
            </div>

            {tab === 'actions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                    LINK TO LEAD (OPTIONAL)
                  </label>
                  <select
                    value={createForm.lead_id}
                    onChange={e => setCreateForm({ ...createForm, lead_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  >
                    <option value="">NO LINKED LEAD</option>
                    {(leadsQ.data || []).map((l: any) => (
                      <option key={l.id} value={l.id}>
                        {l.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                    LINK TO GAP (OPTIONAL)
                  </label>
                  <select
                    value={createForm.gap_id}
                    onChange={e => setCreateForm({ ...createForm, gap_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  >
                    <option value="">NO LINKED GAP</option>
                    {(gapsQ.data || []).map((g: any) => (
                      <option key={g.id} value={g.id}>
                        {g.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {tab === 'gaps' && (
              <div>
                <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                  LINK TO PARENT LEAD (OPTIONAL)
                </label>
                <select
                  value={createForm.lead_id}
                  onChange={e => setCreateForm({ ...createForm, lead_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                >
                  <option value="">NO LINKED LEAD</option>
                  {(leadsQ.data || []).map((l: any) => (
                    <option key={l.id} value={l.id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {tab === 'leads' && (
              <div>
                <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                  TACTICAL PRIORITY
                </label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high', 'critical'].map(p => (
                    <button
                      key={p}
                      onClick={() => setCreateForm({ ...createForm, priority: p })}
                      className={`text-xs px-3 py-1.5 rounded-sm border uppercase font-bold transition-colors ${
                        createForm.priority === p
                          ? 'border-[#FFB84D] bg-[#FFB84D]/10 text-[#FFB84D]'
                          : 'border-[#27453A] text-[#6F887A] hover:text-[#D8E5DC]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'actions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                    PROPOSED STEP / SUBPOENA SPEC
                  </label>
                  <input
                    value={createForm.proposed_step}
                    onChange={e =>
                      setCreateForm({ ...createForm, proposed_step: e.target.value })
                    }
                    placeholder="e.g. Issue 2703(d) order to ISP for IP audit..."
                    className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                    EXPECTED DISCLOSURE / EVIDENCE
                  </label>
                  <input
                    value={createForm.expected_information}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        expected_information: e.target.value,
                      })
                    }
                    placeholder="e.g. DHCP leases confirming physical router MAC"
                    className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                DESCRIPTION / SCOPE NOTES
              </label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Supporting intelligence, rationale, or officer notes..."
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <TerminalButton
                variant="primary"
                onClick={() => {
                  if (tab === 'leads') createLeadMutation.mutate();
                  else if (tab === 'gaps') createGapMutation.mutate();
                  else createActionMutation.mutate();
                }}
                disabled={
                  !createForm.title ||
                  createLeadMutation.isPending ||
                  createGapMutation.isPending ||
                  createActionMutation.isPending
                }
              >
                [ SAVE RECORD ]
              </TerminalButton>
              <TerminalButton onClick={() => setShowCreate(false)}>
                ABORT
              </TerminalButton>
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* Leads Tab Content */}
      {tab === 'leads' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={leadStatusFilter}
              onChange={e => setLeadStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0F1D18] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="resolved">RESOLVED</option>
              <option value="dismissed">DISMISSED</option>
            </select>
          </div>

          {leadsQ.isLoading ? (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              LOADING LEADS MATRIX...
            </div>
          ) : leadsQ.data && leadsQ.data.length > 0 ? (
            <div className="space-y-3">
              {leadsQ.data.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`border bg-[#0B1713] hover:border-[#FFB84D] p-4 rounded-sm cursor-pointer transition-colors space-y-2 group ${
                    selectedLead?.id === l.id ? 'border-[#FFB84D] bg-[#0F1D18]' : 'border-[#27453A]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#D8E5DC] group-hover:text-[#FFB84D] transition-colors">
                          {l.title}
                        </span>
                        <StatusBadge status={l.priority} />
                        <StatusBadge status={l.status} />
                      </div>
                      {l.description && (
                        <p className="text-xs text-[#6F887A] leading-relaxed line-clamp-2">
                          {l.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#6F887A] uppercase">
                        ORIGIN: {l.origin_type || 'MANUAL'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#6F887A] pt-1 border-t border-[#27453A]/40">
                    <span>
                      SUPPORTING REFS: {l.supporting_evidence_refs?.length || 0}
                    </span>
                    <span>·</span>
                    <span>
                      CONFLICTING REFS: {l.conflicting_evidence_refs?.length || 0}
                    </span>
                    <span className="ml-auto text-[#FFB84D] group-hover:translate-x-1 transition-transform">
                      OPEN DOSSIER ▶
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              NO ACTIVE LEADS IN CURRENT REGISTRY.
            </div>
          )}
        </div>
      )}

      {/* Gaps Tab Content */}
      {tab === 'gaps' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={gapStatusFilter}
              onChange={e => setGapStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0F1D18] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="addressed">ADDRESSED</option>
              <option value="dismissed">DISMISSED</option>
            </select>
          </div>

          {gapsQ.isLoading ? (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              LOADING INFORMATION GAPS...
            </div>
          ) : gapsQ.data && gapsQ.data.length > 0 ? (
            <div className="space-y-3">
              {gapsQ.data.map((g: any) => (
                <div
                  key={g.id}
                  className="border border-[#27453A] bg-[#0B1713] p-4 rounded-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#D8E5DC]">{g.title}</span>
                        <StatusBadge status={g.status} />
                      </div>
                      {g.description && (
                        <p className="text-xs text-[#6F887A] leading-relaxed">
                          {g.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#27453A]/40">
                    <span className="text-[10px] text-[#6F887A] uppercase mr-2">
                      MARK STATUS:
                    </span>
                    {['open', 'addressed', 'dismissed'].map(s => (
                      <button
                        key={s}
                        onClick={() =>
                          updateGapMutation.mutate({ id: g.id, data: { status: s } })
                        }
                        className="text-[10px] px-2 py-0.5 border border-[#27453A] bg-[#0F1D18] text-[#6F887A] hover:text-[#D8E5DC] hover:border-[#FFB84D] uppercase"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              NO UNRESOLVED INFORMATION GAPS DETECTED.
            </div>
          )}
        </div>
      )}

      {/* Actions Tab Content */}
      {tab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <select
              value={actionStatusFilter}
              onChange={e => setActionStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#0F1D18] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="proposed">PROPOSED</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="completed">COMPLETED</option>
              <option value="failed">FAILED</option>
            </select>
          </div>

          {actionsQ.isLoading ? (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              LOADING TASKED ACTIONS...
            </div>
          ) : actionsQ.data && actionsQ.data.length > 0 ? (
            <div className="space-y-3">
              {actionsQ.data.map((a: any) => (
                <div
                  key={a.id}
                  className="border border-[#27453A] bg-[#0B1713] p-4 rounded-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#D8E5DC]">{a.title}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.proposed_step && (
                        <p className="text-xs text-[#D8E5DC]">
                          <span className="text-[#FFB84D] font-bold">STEP:</span>{' '}
                          {a.proposed_step}
                        </p>
                      )}
                      {a.expected_information && (
                        <p className="text-xs text-[#6F887A]">
                          <span className="text-[#9FE3B1] font-bold">EXPECTED:</span>{' '}
                          {a.expected_information}
                        </p>
                      )}
                      {a.outcome_notes && (
                        <p className="text-xs text-[#6F887A]">
                          <span className="text-[#FFD27A] font-bold">OUTCOME:</span>{' '}
                          {a.outcome_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#27453A]/40 flex-wrap">
                    <span className="text-[10px] text-[#6F887A] uppercase mr-2">
                      TRANSITION:
                    </span>
                    {['proposed', 'in_progress', 'completed', 'failed'].map(s => (
                      <button
                        key={s}
                        onClick={() =>
                          updateTypeMutation.mutate({
                            kind: 'action',
                            id: a.id,
                            data: { status: s },
                          })
                        }
                        className="text-[10px] px-2 py-0.5 border border-[#27453A] bg-[#0F1D18] text-[#6F887A] hover:text-[#D8E5DC] hover:border-[#FFB84D] uppercase"
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
              NO TACTICAL ACTIONS DISPATCHED YET.
            </div>
          )}
        </div>
      )}

      {/* Lead Detail Modal */}
      {selectedLead && leadDetailQ.data && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="border border-[#27453A] bg-[#07100D] rounded-sm max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#27453A] pb-3">
              <div>
                <div className="text-sm font-bold text-[#D8E5DC] flex items-center gap-2">
                  <span className="text-[#FFB84D]">LEAD //</span>
                  <span>{leadDetailQ.data.lead.title}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <select
                    value={leadDetailQ.data.lead.priority}
                    onChange={e => updateLeadMutation.mutate({ priority: e.target.value })}
                    className="px-2 py-1 bg-[#0F1D18] border border-[#27453A] text-xs text-[#FFB84D] rounded-sm focus:outline-none"
                  >
                    {['low', 'medium', 'high', 'critical'].map(p => (
                      <option key={p} value={p}>
                        PRIORITY: {p.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <select
                    value={leadDetailQ.data.lead.status}
                    onChange={e => reviewLeadMutation.mutate({ decision: e.target.value })}
                    className="px-2 py-1 bg-[#0F1D18] border border-[#27453A] text-xs text-[#9FE3B1] rounded-sm focus:outline-none"
                  >
                    {['open', 'in_progress', 'resolved', 'dismissed'].map(s => (
                      <option key={s} value={s}>
                        STATUS: {s.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                onClick={() => setSelectedLead(null)}
                className="text-xs text-[#6F887A] hover:text-[#D8E5DC] px-2 py-1 border border-[#27453A]"
              >
                [ ESC ]
              </button>
            </div>

            {leadDetailQ.data.lead.description && (
              <p className="text-xs text-[#D8E5DC] leading-relaxed bg-[#0F1D18] p-3 border border-[#27453A] rounded-sm">
                {leadDetailQ.data.lead.description}
              </p>
            )}

            {leadDetailQ.data.lead.priority_rationale && (
              <div className="text-xs text-[#6F887A] bg-[#0F1D18] p-2 border border-[#27453A] rounded-sm">
                <span className="text-[#FFB84D] font-bold">RATIONALE:</span>{' '}
                {leadDetailQ.data.lead.priority_rationale}
              </div>
            )}

            {/* Evidence comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-[#27453A] bg-[#0B1713] p-3 rounded-sm space-y-2">
                <div className="text-[10px] text-[#9FE3B1] uppercase font-bold">
                  SUPPORTING EVIDENCE ({leadDetailQ.data.lead.supporting_evidence_refs?.length || 0})
                </div>
                {(leadDetailQ.data.lead.supporting_evidence_refs || []).length > 0 ? (
                  leadDetailQ.data.lead.supporting_evidence_refs.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="text-[11px] bg-[#0F1D18] p-2 rounded-sm border border-[#27453A] text-[#6F887A]"
                    >
                      {r.locator && <div>LOCATOR: {r.locator}</div>}
                      {r.excerpt && <div className="italic text-[#D8E5DC]">"{r.excerpt}"</div>}
                      {r.evidence_id && (
                        <div className="text-[#3C6653]">
                          [EVID #{r.evidence_id.slice(0, 8)}]
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[#6F887A]">No corroborating links.</div>
                )}
              </div>

              <div className="border border-[#E05A52]/40 bg-[#0B1713] p-3 rounded-sm space-y-2">
                <div className="text-[10px] text-[#E05A52] uppercase font-bold">
                  CONFLICTING EVIDENCE ({leadDetailQ.data.lead.conflicting_evidence_refs?.length || 0})
                </div>
                {(leadDetailQ.data.lead.conflicting_evidence_refs || []).length > 0 ? (
                  leadDetailQ.data.lead.conflicting_evidence_refs.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="text-[11px] bg-[#E05A52]/10 p-2 rounded-sm border border-[#E05A52]/30 text-[#E05A52]"
                    >
                      {r.locator && <div>LOCATOR: {r.locator}</div>}
                      {r.excerpt && <div className="italic">"{r.excerpt}"</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[#6F887A]">No conflicting evidence.</div>
                )}
              </div>
            </div>

            {/* Linked Gaps & Actions */}
            {leadDetailQ.data.gaps?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#6F887A]">LINKED GAPS</div>
                <div className="space-y-1">
                  {leadDetailQ.data.gaps.map((g: any) => (
                    <div
                      key={g.id}
                      className="text-xs bg-[#0F1D18] border border-[#27453A] p-2 rounded-sm flex items-center justify-between"
                    >
                      <span>{g.title}</span>
                      <StatusBadge status={g.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {leadDetailQ.data.actions?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#6F887A]">LINKED ACTIONS</div>
                <div className="space-y-1">
                  {leadDetailQ.data.actions.map((a: any) => (
                    <div
                      key={a.id}
                      className="text-xs bg-[#0F1D18] border border-[#27453A] p-2 rounded-sm flex items-center justify-between"
                    >
                      <span>{a.title}</span>
                      <StatusBadge status={a.status} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Review History */}
            {leadDetailQ.data.review_history?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#6F887A]">AUDIT TIMELINE</div>
                <div className="space-y-1">
                  {leadDetailQ.data.review_history.map((h: any) => (
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

            {/* Decision console */}
            <div className="border-t border-[#27453A] pt-3 space-y-2">
              <div className="text-[10px] uppercase text-[#6F887A]">
                RECORD LEAD STATUS UPDATE
              </div>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Analyst progress report or case clearance notes..."
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                rows={2}
              />
              <div className="flex gap-2 flex-wrap">
                <TerminalButton
                  variant="primary"
                  size="xs"
                  onClick={() => reviewLeadMutation.mutate({ decision: 'resolved' })}
                  disabled={reviewLeadMutation.isPending}
                >
                  [ RESOLVED ]
                </TerminalButton>
                <TerminalButton
                  size="xs"
                  onClick={() => reviewLeadMutation.mutate({ decision: 'in_progress' })}
                  disabled={reviewLeadMutation.isPending}
                >
                  [ IN PROGRESS ]
                </TerminalButton>
                <TerminalButton
                  size="xs"
                  onClick={() => reviewLeadMutation.mutate({ decision: 'open' })}
                  disabled={reviewLeadMutation.isPending}
                >
                  [ OPEN ]
                </TerminalButton>
                <TerminalButton
                  variant="danger"
                  size="xs"
                  onClick={() => reviewLeadMutation.mutate({ decision: 'dismissed' })}
                  disabled={reviewLeadMutation.isPending}
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