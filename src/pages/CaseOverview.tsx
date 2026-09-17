import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
  MetricCell,
} from '../components/TerminalComponents';

export default function CaseOverview() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId!),
    enabled: !!caseId,
  });

  const rerunMutation = useMutation({
    mutationFn: () => api.runAnalysis(caseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-runs', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      queryClient.invalidateQueries({ queryKey: ['hypotheses', caseId] });
    },
  });

  const { data: files } = useQuery({
    queryKey: ['files', caseId],
    queryFn: () => api.getFiles(caseId!),
    enabled: !!caseId,
  });

  const { data: jobs } = useQuery({
    queryKey: ['jobs', caseId],
    queryFn: () => api.getJobs(caseId!),
    enabled: !!caseId,
  });

  const { data: runs } = useQuery({
    queryKey: ['analysis-runs', caseId],
    queryFn: () => api.getAnalysisRuns(caseId!),
    enabled: !!caseId,
  });

  const { data: ws } = useQuery({
    queryKey: ['workspace-summary', caseId],
    queryFn: () => api.getWorkspaceSummary(caseId!),
    enabled: !!caseId,
  });

  if (isLoading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-[#6F887A] border border-[#27453A] bg-[#0B1713] rounded-sm">
        INITIALIZING CASE COMMAND CENTER TELEMETRY...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20 font-mono text-xs text-[#E05A52] border border-[#E05A52] bg-[#0B1713] rounded-sm">
        [ERROR] CASE DOSSIER NOT FOUND OR ACCESS RESTRICTED.
      </div>
    );
  }

  const latestRun = runs?.[runs.length - 1] || ws?.latest_run;

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code={`CASE // ${caseData.case_code}`}
        title="INVESTIGATION COMMAND CENTER"
        description={caseData.description || 'Target intelligence dossier and synthesized findings.'}
        statusBadge={
          <div className="flex items-center gap-2">
            <StatusBadge status={caseData.status || 'ACTIVE'} />
            {caseData.is_synthetic && (
              <span className="text-[10px] px-1.5 py-0.2 border border-[#FFB84D] text-[#FFB84D] uppercase bg-[#FFB84D]/10">
                [ SYNTHETIC ]
              </span>
            )}
          </div>
        }
      >
        <TerminalButton
          variant="primary"
          onClick={() => rerunMutation.mutate()}
          disabled={rerunMutation.isPending}
        >
          {rerunMutation.isPending ? 'EXECUTING PIPELINE...' : '⚡ RUN FUSION PIPELINE'}
        </TerminalButton>
      </WorkspaceHeader>

      {/* Stale Findings Alert */}
      {ws?.analysis_stale && (
        <div className="border border-[#FFB84D] bg-[#FFB84D]/10 p-3.5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs text-[#FFD27A]">
          <div>
            <div className="font-bold tracking-wider flex items-center gap-2">
              <span>⚠</span> INTEL STATUS: FINDINGS MAY BE STALE
            </div>
            <div className="text-[#6F887A] text-[11px] mt-0.5">
              {ws.analysis_stale_reason || 'New evidence was ingested following the last signal fusion cycle.'}
            </div>
          </div>
          <TerminalButton
            variant="primary"
            onClick={() => rerunMutation.mutate()}
            disabled={rerunMutation.isPending}
          >
            {rerunMutation.isPending ? 'PROCESSING...' : '[ TRIGGER RE-ANALYSIS ]'}
          </TerminalButton>
        </div>
      )}

      {/* Primary Intelligence Metrics Cells */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6F887A] mb-2 flex items-center gap-2">
          <span>// PRIMARY INVESTIGATION TELEMETRY</span>
          <span className="text-[#27453A]">━━━━━━━━━━━━━━━━━━━━</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <MetricCell
            label="ENTITIES"
            value={ws?.entity_count ?? (caseData.entity_count || 0)}
            sublabel="Resolved nodes"
            onClick={() => navigate(`/cases/${caseId}/entities`)}
          />
          <MetricCell
            label="RELATIONS"
            value={ws?.relationship_count ?? (caseData.relationship_count || 0)}
            sublabel="Network edges"
            onClick={() => navigate(`/cases/${caseId}/graph`)}
          />
          <MetricCell
            label="EVENTS"
            value={ws?.event_count ?? (caseData.event_count || 0)}
            sublabel="Temporal log"
            onClick={() => navigate(`/cases/${caseId}/timeline`)}
          />
          <MetricCell
            label="SIGNALS"
            value={ws?.signal_count ?? (latestRun?.signal_count ?? (caseData.signal_count || 0))}
            sublabel="Extracted indices"
            onClick={() => navigate(`/cases/${caseId}/workbench`)}
          />
          <MetricCell
            label="HYPOTHESES"
            value={ws?.hypothesis_count ?? (caseData.hypothesis_count || 0)}
            sublabel="Evidence models"
            highlight={true}
            onClick={() => navigate(`/cases/${caseId}/hypotheses`)}
          />
        </div>
      </div>

      {/* Secondary Operational Tracking Cells */}
      <div>
        <div className="text-[10px] uppercase tracking-wider text-[#6F887A] mb-2 flex items-center gap-2">
          <span>// EPISTEMIC INTEGRITY & ACTION PIPELINE</span>
          <span className="text-[#27453A]">━━━━━━━━━━━━━━━━━━━━</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCell
            label="OPEN CONTRADICTIONS"
            value={ws?.open_contradictions ?? 0}
            sublabel="Evidence conflicts"
            alert={Number(ws?.open_contradictions) > 0}
            onClick={() => navigate(`/cases/${caseId}/contradictions`)}
          />
          <MetricCell
            label="ACTIVE LEADS"
            value={ws?.open_leads ?? 0}
            sublabel="Prioritized leads"
            onClick={() => navigate(`/cases/${caseId}/leads`)}
          />
          <MetricCell
            label="INFORMATION GAPS"
            value={ws?.open_gaps ?? 0}
            sublabel="Unanswered queries"
            onClick={() => navigate(`/cases/${caseId}/leads`)}
          />
          <MetricCell
            label="PENDING ACTIONS"
            value={ws?.open_actions ?? 0}
            sublabel="Investigative steps"
            onClick={() => navigate(`/cases/${caseId}/leads`)}
          />
        </div>
      </div>

      {/* Latest Analysis Run Status */}
      {latestRun && (
        <TerminalPanel title="LATEST SIGNAL FUSION EXECUTION" variant="raised">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-[#FFB84D] font-bold">RUN ID: {latestRun.id?.slice(0, 8)}</span>
                <span className="text-[#27453A]">|</span>
                <span className="text-[#D8E5DC]">ENGINE v{latestRun.version}</span>
                <span className="text-[#27453A]">|</span>
                <span className="text-[#6F887A]">
                  {latestRun.created_at ? new Date(latestRun.created_at).toLocaleString() : ''}
                </span>
              </div>
              <div className="text-[#6F887A] text-[11px]">
                Status:{' '}
                <span className="text-[#9FE3B1] uppercase font-semibold">
                  {latestRun.status || 'COMPLETED'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-2 py-0.5 border border-[#628C73] text-[#9FE3B1] rounded-sm text-[10px]">
                {latestRun.hypothesis_count || 0} HYPOTHESES GENERATED
              </span>
              <span className="px-2 py-0.5 border border-[#27453A] text-[#FFD27A] rounded-sm text-[10px]">
                {latestRun.signal_count || 0} SIGNALS FUSED
              </span>
              {latestRun.engine_error_count > 0 && (
                <span className="px-2 py-0.5 border border-[#E05A52] text-[#E05A52] rounded-sm text-[10px]">
                  {latestRun.engine_error_count} ERRORS
                </span>
              )}
            </div>
          </div>
        </TerminalPanel>
      )}

      {/* Two Column Section: Quick Actions & Evidence Inventory */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TerminalPanel title="OPERATIONAL WORKSPACES // SHORTCUTS">
          <div className="grid grid-cols-1 gap-2 pt-1">
            <button
              onClick={() => navigate(`/cases/${caseId}/evidence`)}
              className="text-left border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:bg-[#0B1713] p-3 rounded-sm transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] flex items-center gap-2">
                  <span>▣</span> EVIDENCE INTAKE ROOM
                </div>
                <div className="text-[10px] text-[#6F887A] mt-0.5">
                  Ingest phone dumps, telecom records, and forensic documents
                </div>
              </div>
              <span className="text-xs text-[#6F887A] group-hover:text-[#FFB84D]">▶</span>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/graph`)}
              className="text-left border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:bg-[#0B1713] p-3 rounded-sm transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] flex items-center gap-2">
                  <span>◈</span> INVESTIGATION LINK GRAPH
                </div>
                <div className="text-[10px] text-[#6F887A] mt-0.5">
                  Cytoscape multi-tier topological analysis and connection tracing
                </div>
              </div>
              <span className="text-xs text-[#6F887A] group-hover:text-[#FFB84D]">▶</span>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/leads`)}
              className="text-left border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:bg-[#0B1713] p-3 rounded-sm transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] flex items-center gap-2">
                  <span>↦</span> LEADS, GAPS & ACTION REGISTRY
                </div>
                <div className="text-[10px] text-[#6F887A] mt-0.5">
                  Actionable leads, intelligence holes, and verified next steps
                </div>
              </div>
              <span className="text-xs text-[#6F887A] group-hover:text-[#FFB84D]">▶</span>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/contradictions`)}
              className="text-left border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:bg-[#0B1713] p-3 rounded-sm transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] flex items-center gap-2">
                  <span>≠</span> CONTRADICTION CONTROL CONSOLE
                </div>
                <div className="text-[10px] text-[#6F887A] mt-0.5">
                  Resolve competing or falsified witness statements and signals
                </div>
              </div>
              <span className="text-xs text-[#6F887A] group-hover:text-[#FFB84D]">▶</span>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/workbench`)}
              className="text-left border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:bg-[#0B1713] p-3 rounded-sm transition-colors flex items-center justify-between group"
            >
              <div>
                <div className="text-xs font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] flex items-center gap-2">
                  <span>◆</span> INTELLIGENCE WORKBENCH
                </div>
                <div className="text-[10px] text-[#6F887A] mt-0.5">
                  Inspect the 7-family signal fusion pipeline and feature vectors
                </div>
              </div>
              <span className="text-xs text-[#6F887A] group-hover:text-[#FFB84D]">▶</span>
            </button>
          </div>
        </TerminalPanel>

        <TerminalPanel
          title="INGESTED EVIDENCE INVENTORY"
          action={
            <TerminalButton
              size="xs"
              onClick={() => navigate(`/cases/${caseId}/evidence`)}
            >
              VIEW ALL
            </TerminalButton>
          }
        >
          {files && files.length > 0 ? (
            <div className="space-y-2 pt-1">
              {files.slice(0, 5).map((f: any) => (
                <div
                  key={f.id}
                  className="border border-[#27453A] bg-[#0F1D18] p-2.5 rounded-sm text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#D8E5DC] truncate max-w-[200px]">
                      {f.original_filename}
                    </span>
                    <StatusBadge status={f.status} />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[#6F887A]">
                    <span className="uppercase text-[#FFB84D]">{f.source_type}</span>
                    <span>//</span>
                    <span>{f.accepted_count || 0} accepted</span>
                    <span>·</span>
                    <span>{f.rejected_count || 0} rejected</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-[#6F887A] text-xs">
              NO EVIDENCE FILES LOGGED FOR THIS CASE YET.
            </div>
          )}
        </TerminalPanel>
      </div>

      {/* Activity & Jobs Stream */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <TerminalPanel title="TELEMETRY // AUDIT ACTIVITY STREAM">
          {ws?.recent_activity && ws.recent_activity.length > 0 ? (
            <div className="space-y-2 pt-1 text-xs">
              {ws.recent_activity.slice(0, 6).map((a: any) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between border-b border-[#27453A]/50 pb-1.5 last:border-0"
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[9px] px-1 py-0.2 border border-[#3C6653] text-[#628C73] uppercase">
                      {a.kind}
                    </span>
                    <span className="text-[#D8E5DC] truncate">
                      {a.action} {a.status ? `[${a.status}]` : ''}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6F887A] shrink-0">
                    {a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#6F887A] text-xs">
              NO RECENT OPERATOR EVENTS RECORDED.
            </div>
          )}
        </TerminalPanel>

        {/* Recent Jobs */}
        <TerminalPanel title="BACKGROUND ASYNC JOBS">
          {jobs && jobs.length > 0 ? (
            <div className="space-y-2 pt-1 text-xs">
              {jobs.slice(0, 6).map((j: any) => (
                <div
                  key={j.id}
                  className="flex items-center justify-between border-b border-[#27453A]/50 pb-1.5 last:border-0"
                >
                  <div className="truncate">
                    <span className="text-[#D8E5DC] uppercase font-medium">{j.job_type}</span>
                    <span className="ml-2">
                      <StatusBadge status={j.status} />
                    </span>
                  </div>
                  <span className="text-[10px] text-[#6F887A] shrink-0">
                    {j.created_at ? new Date(j.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-[#6F887A] text-xs">
              NO BACKGROUND JOBS RUNNING OR QUEUED.
            </div>
          )}
        </TerminalPanel>
      </div>
    </div>
  );
}