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
import { Compass, CheckSquare, AlertCircle } from 'lucide-react';

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
    mutationFn: ({ kind, id, data }: any) => {
      if (kind === 'gap') return api.updateGap(caseId!, id, data);
      return api.updateAction(caseId!, id, data);
    },
    onSuccess: () => {
      invalidate();
    },
  });

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'leads', label: 'INVESTIGATIVE LEADS', count: leadsQ.data?.length },
    { id: 'gaps', label: 'EPISTEMIC GAPS', count: gapsQ.data?.length },
    { id: 'actions', label: 'DISPATCHED ACTIONS', count: actionsQ.data?.length },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="OPS // 06"
        title="LEADS & ACTION DISPATCH MATRIX"
        description="Information gaps, subpoena execution targets, physical reconnaissance, and investigative tasking."
      >
        <div className="flex items-center gap-3">
          <TerminalButton
            variant="primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '[ CANCEL ]' : `+ NEW ${tab === 'gaps' ? 'GAP' : tab === 'leads' ? 'LEAD' : 'ACTION'}`}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Navigation tabs */}
      <div className="flex border-b border-[#3D2A12] gap-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setShowCreate(false);
            }}
            className={`px-4 py-2 text-xs font-bold transition-colors border-b-2 flex items-center gap-2 ${
              tab === t.id
                ? 'border-[#FF9E1B] text-[#FF9E1B] bg-[#14110C]'
                : 'border-transparent text-[#A6732E] hover:text-[#FFE7B8]'
            }`}
          >
            <span>{t.label}</span>
            {t.count !== undefined && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-xs bg-[#0D0B08] border border-[#3D2A12] text-[#FF9E1B]">
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
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                ITEM TITLE / OBJECTIVE
              </label>
              <input
                value={createForm.title}
                onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                placeholder="Subject description or task target..."
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
              />
            </div>

            {tab === 'actions' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                    LINK TO LEAD (OPTIONAL)
                  </label>
                  <select
                    value={createForm.lead_id}
                    onChange={e => setCreateForm({ ...createForm, lead_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
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
                  <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                    LINK TO GAP (OPTIONAL)
                  </label>
                  <select
                    value={createForm.gap_id}
                    onChange={e => setCreateForm({ ...createForm, gap_id: e.target.value })}
                    className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
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
                <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                  LINK TO PARENT LEAD (OPTIONAL)
                </label>
                <select
                  value={createForm.lead_id}
                  onChange={e => setCreateForm({ ...createForm, lead_id: e.target.value })}
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
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
                <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                  TACTICAL PRIORITY
                </label>
                <div className="flex gap-2">
                  {['low', 'medium', 'high', 'critical'].map(p => (
                    <button
                      key={p}
                      onClick={() => setCreateForm({ ...createForm, priority: p })}
                      className={`text-xs px-3 py-1.5 rounded-xs border uppercase font-bold transition-colors ${
                        createForm.priority === p
                          ? 'border-[#FF9E1B] bg-[#FF9E1B]/10 text-[#FF9E1B]'
                          : 'border-[#3D2A12] text-[#A6732E] hover:text-[#FFE7B8]'
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
                  <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                    PROPOSED STEP / SUBPOENA SPEC
                  </label>
                  <input
                    value={createForm.proposed_step}
                    onChange={e =>
                      setCreateForm({ ...createForm, proposed_step: e.target.value })
                    }
                    placeholder="e.g. Issue 2703(d) order to ISP for IP audit..."
                    className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
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
                    className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                DESCRIPTION / SCOPE NOTES
              </label>
              <textarea
                value={createForm.description}
                onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Supporting intelligence, rationale, or officer notes..."
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
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
              className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="resolved">RESOLVED</option>
              <option value="dismissed">DISMISSED</option>
            </select>
          </div>

          {leadsQ.isLoading ? (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
              LOADING LEADS MATRIX...
            </div>
          ) : leadsQ.data && leadsQ.data.length > 0 ? (
            <div className="space-y-3">
              {leadsQ.data.map((l: any) => (
                <div
                  key={l.id}
                  onClick={() => setSelectedLead(l)}
                  className={`border bg-[#0D0B08] hover:border-[#FF9E1B] p-4 rounded-xs cursor-pointer transition-colors space-y-2 group ${
                    selectedLead?.id === l.id ? 'border-[#FF9E1B] bg-[#14110C]' : 'border-[#3D2A12]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#FFBA42] group-hover:text-[#FFE7B8] transition-colors">
                          {l.title}
                        </span>
                        <StatusBadge status={l.priority} />
                        <StatusBadge status={l.status} />
                      </div>
                      {l.description && (
                        <p className="text-xs text-[#A6732E] leading-relaxed line-clamp-2">
                          {l.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-[#A6732E] uppercase">
                        ORIGIN: {l.origin_type || 'MANUAL'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-[#A6732E] pt-1 border-t border-[#3D2A12]/40">
                    <span>
                      SUPPORTING REFS: {l.supporting_evidence_refs?.length || 0}
                    </span>
                    <span>·</span>
                    <span>
                      CONFLICTING REFS: {l.conflicting_evidence_refs?.length || 0}
                    </span>
                    <span className="ml-auto text-[#FF9E1B] group-hover:translate-x-1 transition-transform">
                      OPEN DOSSIER ▶
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
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
              className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="open">OPEN</option>
              <option value="addressed">ADDRESSED</option>
              <option value="dismissed">DISMISSED</option>
            </select>
          </div>

          {gapsQ.isLoading ? (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
              LOADING INFORMATION GAPS...
            </div>
          ) : gapsQ.data && gapsQ.data.length > 0 ? (
            <div className="space-y-3">
              {gapsQ.data.map((g: any) => (
                <div
                  key={g.id}
                  className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#FFE7B8]">{g.title}</span>
                        <StatusBadge status={g.status} />
                      </div>
                      {g.description && (
                        <p className="text-xs text-[#A6732E] leading-relaxed">
                          {g.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#3D2A12]/40 flex-wrap">
                    <span className="text-[10px] text-[#A6732E] uppercase mr-2">
                      TRANSITION STATUS:
                    </span>
                    {['open', 'addressed', 'dismissed'].map(s => (
                      <button
                        key={s}
                        onClick={() =>
                          updateTypeMutation.mutate({
                            kind: 'gap',
                            id: g.id,
                            data: { status: s },
                          })
                        }
                        className="text-[10px] px-2 py-0.5 border border-[#3D2A12] bg-[#14110C] text-[#A6732E] hover:text-[#FFE7B8] hover:border-[#FF9E1B] uppercase rounded-xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
              NO ACTIVE INFORMATION GAPS RECORDED.
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
              className="px-3 py-1.5 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
            >
              <option value="">ALL STATUSES</option>
              <option value="proposed">PROPOSED</option>
              <option value="in_progress">IN PROGRESS</option>
              <option value="completed">COMPLETED</option>
              <option value="failed">FAILED</option>
            </select>
          </div>

          {actionsQ.isLoading ? (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
              LOADING TACTICAL ACTION REGISTRY...
            </div>
          ) : actionsQ.data && actionsQ.data.length > 0 ? (
            <div className="space-y-3">
              {actionsQ.data.map((a: any) => (
                <div
                  key={a.id}
                  className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#FFE7B8]">{a.title}</span>
                        <StatusBadge status={a.status} />
                      </div>
                      {a.proposed_step && (
                        <p className="text-xs text-[#FFBA42] leading-relaxed">
                          {a.proposed_step}
                        </p>
                      )}
                      {a.expected_information && (
                        <p className="text-xs text-[#A6732E]">
                          <span className="text-[#34D399] font-bold">EXPECTED:</span>{' '}
                          {a.expected_information}
                        </p>
                      )}
                      {a.outcome_notes && (
                        <p className="text-xs text-[#A6732E]">
                          <span className="text-[#FFE7B8] font-bold">OUTCOME:</span>{' '}
                          {a.outcome_notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#3D2A12]/40 flex-wrap">
                    <span className="text-[10px] text-[#A6732E] uppercase mr-2">
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
                        className="text-[10px] px-2 py-0.5 border border-[#3D2A12] bg-[#14110C] text-[#A6732E] hover:text-[#FFE7B8] hover:border-[#FF9E1B] uppercase rounded-xs"
                      >
                        {s.replace('_', ' ')}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
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
            className="border border-[#FF9E1B] bg-[#0D0B08] rounded-xs max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl relative amber-box-glow"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-[#3D2A12] pb-3">
              <div>
                <div className="text-sm font-bold text-[#FFE7B8] flex items-center gap-2">
                  <span className="text-[#FF9E1B]">LEAD //</span>
                  <span>{leadDetailQ.data.lead.title}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <select
                    value={leadDetailQ.data.lead.priority}
                    onChange={e => updateLeadMutation.mutate({ priority: e.target.value })}
                    className="px-2 py-1 bg-[#14110C] border border-[#3D2A12] text-xs text-[#FF9E1B] rounded-xs focus:outline-none"
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
                    className="px-2 py-1 bg-[#14110C] border border-[#3D2A12] text-xs text-[#34D399] rounded-xs focus:outline-none"
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
                className="text-xs text-[#A6732E] hover:text-[#FFE7B8] px-2 py-1 border border-[#3D2A12]"
              >
                [ ESC ]
              </button>
            </div>

            {leadDetailQ.data.lead.description && (
              <p className="text-xs text-[#FFE7B8] leading-relaxed bg-[#14110C] p-3 border border-[#3D2A12] rounded-xs">
                {leadDetailQ.data.lead.description}
              </p>
            )}

            {leadDetailQ.data.lead.priority_rationale && (
              <div className="text-xs text-[#A6732E] bg-[#14110C] p-2 border border-[#3D2A12] rounded-xs">
                <span className="text-[#FF9E1B] font-bold">RATIONALE:</span>{' '}
                {leadDetailQ.data.lead.priority_rationale}
              </div>
            )}

            {/* Evidence comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="border border-[#3D2A12] bg-[#14110C] p-3 rounded-xs space-y-2">
                <div className="text-[10px] text-[#34D399] uppercase font-bold">
                  SUPPORTING EVIDENCE ({leadDetailQ.data.lead.supporting_evidence_refs?.length || 0})
                </div>
                {(leadDetailQ.data.lead.supporting_evidence_refs || []).length > 0 ? (
                  leadDetailQ.data.lead.supporting_evidence_refs.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="text-[11px] bg-[#0D0B08] p-2 rounded-xs border border-[#3D2A12] text-[#A6732E]"
                    >
                      {r.locator && <div>LOCATOR: {r.locator}</div>}
                      {r.excerpt && <div className="italic text-[#FFE7B8]">"{r.excerpt}"</div>}
                      {r.evidence_id && (
                        <div className="text-[#7A521D]">
                          [EVID #{r.evidence_id.slice(0, 8)}]
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[#A6732E]">No corroborating links.</div>
                )}
              </div>

              <div className="border border-[#EF4444]/40 bg-[#14110C] p-3 rounded-xs space-y-2">
                <div className="text-[10px] text-[#EF4444] uppercase font-bold">
                  CONFLICTING EVIDENCE ({leadDetailQ.data.lead.conflicting_evidence_refs?.length || 0})
                </div>
                {(leadDetailQ.data.lead.conflicting_evidence_refs || []).length > 0 ? (
                  leadDetailQ.data.lead.conflicting_evidence_refs.map((r: any, i: number) => (
                    <div
                      key={i}
                      className="text-[11px] bg-[#EF4444]/10 p-2 rounded-xs border border-[#EF4444]/30 text-[#EF4444]"
                    >
                      {r.locator && <div>LOCATOR: {r.locator}</div>}
                      {r.excerpt && <div className="italic">"{r.excerpt}"</div>}
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-[#A6732E]">No conflicting evidence.</div>
                )}
              </div>
            </div>

            {/* Linked Gaps & Actions */}
            {leadDetailQ.data.gaps?.length > 0 && (
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase text-[#A6732E]">LINKED GAPS</div>
                <div className="space-y-1">
                  {leadDetailQ.data.gaps.map((g: any) => (
                    <div
                      key={g.id}
                      className="text-xs bg-[#14110C] border border-[#3D2A12] p-2 rounded-xs flex items-center justify-between"
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
                <div className="text-[10px] uppercase text-[#A6732E]">LINKED ACTIONS</div>
                <div className="space-y-1">
                  {leadDetailQ.data.actions.map((a: any) => (
                    <div
                      key={a.id}
                      className="text-xs bg-[#14110C] border border-[#3D2A12] p-2 rounded-xs flex items-center justify-between"
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
                <div className="text-[10px] uppercase text-[#A6732E]">AUDIT TIMELINE</div>
                <div className="space-y-1">
                  {leadDetailQ.data.review_history.map((h: any) => (
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

            {/* Decision console */}
            <div className="border-t border-[#3D2A12] pt-3 space-y-2">
              <div className="text-[10px] uppercase text-[#A6732E]">
                RECORD LEAD STATUS UPDATE
              </div>
              <textarea
                value={reviewNote}
                onChange={e => setReviewNote(e.target.value)}
                placeholder="Analyst progress report or case clearance notes..."
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
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
