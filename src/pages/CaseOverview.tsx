import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Users,
  Share2,
  Clock,
  Radio,
  Lightbulb,
  AlertTriangle,
  Crosshair,
  HelpCircle,
  CheckSquare,
  HardDrive,
  Zap,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { StatusBadge } from '../components/TerminalComponents';

export default function CaseOverview() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: caseData, isLoading } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId!),
    enabled: !!caseId,
  });

  const { data: runs } = useQuery({
    queryKey: ['analysis-runs', caseId],
    queryFn: () => api.getAnalysisRuns(caseId!),
    enabled: !!caseId,
  });

  const { data: files } = useQuery({
    queryKey: ['files', caseId],
    queryFn: () => api.getFiles(caseId!),
    enabled: !!caseId,
  });

  const { data: ws } = useQuery({
    queryKey: ['workspace-summary', caseId],
    queryFn: () => api.getWorkspaceSummary(caseId!),
    enabled: !!caseId,
  });

  const rerunMutation = useMutation({
    mutationFn: () => api.runAnalysis(caseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis-runs', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      queryClient.invalidateQueries({ queryKey: ['case', caseId] });
    },
  });

  if (isLoading) {
    return (
      <div className="text-center py-20 font-mono text-xs text-[#A6732E] border border-[#3D2A12] bg-[#0D0B08]">
        INITIALIZING CASE COMMAND CENTER TELEMETRY...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="text-center py-20 font-mono text-xs text-[#EF4444] border border-[#EF4444] bg-[#0D0B08]">
        [ERROR] CASE DOSSIER NOT FOUND OR ACCESS RESTRICTED.
      </div>
    );
  }

  const latestRun = runs?.[runs.length - 1] || ws?.latest_run;

  return (
    <div className="max-w-7xl mx-auto space-y-4 font-mono text-[#FFBA42]">
      {/* ============================================================== */}
      {/* CASE HEADER BANNER                                            */}
      {/* ============================================================== */}
      <div className="border border-[#3D2A12] bg-[#0D0B08] p-3 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 relative">
        <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
        <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />
        <span className="absolute -bottom-[1px] -left-[1px] w-1.5 h-1.5 border-b-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
        <span className="absolute -bottom-[1px] -right-[1px] w-1.5 h-1.5 border-b-2 border-r-2 border-[#FF9E1B] pointer-events-none" />

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[#FF9E1B] font-bold text-sm">▶</span>
          <span className="text-xs font-bold text-[#FFBA42] uppercase tracking-wider">
            CASE : {caseData.title} - {caseData.case_code}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <StatusBadge status={caseData.status || 'ACTIVE'} />
          <span className="px-2 py-0.5 border border-[#3D2A12] text-[#A6732E] text-[10px] uppercase tracking-wider bg-[#14110C]">
            CODE: {caseData.case_code}
          </span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 1: PRIMARY METRICS (5 BOXES)                               */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* ENTITIES */}
        <div
          onClick={() => navigate(`/cases/${caseId}/entities`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>ENTITIES</span>
            <Users className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42] group-hover:text-[#FFE7B8]">
            {ws?.entity_count ?? caseData.entity_count ?? 0}
          </div>
        </div>

        {/* RELATIONS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/graph`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>RELATIONS</span>
            <Share2 className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42] group-hover:text-[#FFE7B8]">
            {ws?.relationship_count ?? caseData.relationship_count ?? 0}
          </div>
        </div>

        {/* EVENTS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/timeline`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>EVENTS</span>
            <Clock className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42] group-hover:text-[#FFE7B8]">
            {ws?.event_count ?? caseData.event_count ?? 0}
          </div>
        </div>

        {/* SIGNALS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/workbench`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>SIGNALS</span>
            <Radio className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42] group-hover:text-[#FFE7B8]">
            {ws?.signal_count ?? latestRun?.signal_count ?? caseData.signal_count ?? 0}
          </div>
        </div>

        {/* HYPOTHESES */}
        <div
          onClick={() => navigate(`/cases/${caseId}/hypotheses`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>HYPOTHESES</span>
            <Lightbulb className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42] group-hover:text-[#FFE7B8]">
            {ws?.hypothesis_count ?? caseData.hypothesis_count ?? 0}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* ROW 2: SECONDARY OPERATIONAL TRACKING (4 BOXES)                */}
      {/* ============================================================== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* OPEN CONTRADICTIONS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/contradictions`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#EF4444] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>OPEN CONTRADICTIONS</span>
            <AlertTriangle className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#EF4444]" />
          </div>
          <div className="text-2xl font-bold text-[#EF4444]">
            {ws?.open_contradictions ?? 0}
          </div>
        </div>

        {/* OPEN LEADS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/leads`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>OPEN LEADS</span>
            <Crosshair className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42]">
            {ws?.open_leads ?? 0}
          </div>
        </div>

        {/* OPEN GAPS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/leads`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>OPEN GAPS</span>
            <HelpCircle className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42]">
            {ws?.open_gaps ?? 0}
          </div>
        </div>

        {/* PENDING ACTIONS */}
        <div
          onClick={() => navigate(`/cases/${caseId}/leads`)}
          className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] p-3 rounded-xs cursor-pointer transition-all relative group"
        >
          <div className="flex items-center justify-between text-[#A6732E] text-[10px] uppercase tracking-wider mb-1">
            <span>PENDING ACTIONS</span>
            <CheckSquare className="w-3.5 h-3.5 text-[#A6732E] group-hover:text-[#FF9E1B]" />
          </div>
          <div className="text-2xl font-bold text-[#FFBA42]">
            {ws?.open_actions ?? 0}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* LATEST ANALYSIS RUN STRIP                                      */}
      {/* ============================================================== */}
      {latestRun ? (
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-3 rounded-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs relative">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[#FF9E1B] font-bold">▶ LATEST ANALYSIS RUN</span>
            <span className="text-[#3D2A12]">|</span>
            <span className="text-[#A6732E]">
              Run ID : <span className="text-[#FFBA42] font-semibold">{latestRun?.id?.slice(0, 8)}</span>
            </span>
            <span className="text-[#3D2A12]">|</span>
            <span className="text-[#A6732E]">
              Executed : <span className="text-[#FFBA42]">{latestRun?.created_at ? new Date(latestRun.created_at).toLocaleString() : '-'}</span>
            </span>
            <span className="text-[#3D2A12]">|</span>
            <span className="text-[#34D399] font-medium">
              Generated {latestRun?.hypothesis_count ?? 0} hypotheses across {latestRun?.signal_count ?? 0} signals
            </span>
          </div>

          <button
            onClick={() => navigate(`/cases/${caseId}/workbench`)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-[#3D2A12] hover:border-[#FF9E1B] text-[#FFBA42] hover:text-[#FFE7B8] text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <span>[ VIEW DETAILS [→] ]</span>
          </button>
        </div>
      ) : (
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-3 rounded-xs flex items-center justify-between text-xs text-[#A6732E]">
          <div className="flex items-center gap-2">
            <span className="text-[#FF9E1B]">▶</span>
            <span>NO ANALYSIS CYCLE RUN YET FOR THIS DOSSIER.</span>
          </div>
          <button
            onClick={() => rerunMutation.mutate()}
            disabled={rerunMutation.isPending}
            className="px-2.5 py-1 border border-[#FF9E1B] text-[#FF9E1B] hover:bg-[#FF9E1B] hover:text-[#080705] font-bold text-xs uppercase tracking-wider transition-colors"
          >
            {rerunMutation.isPending ? 'EXECUTING...' : '[ RUN INITIAL ANALYSIS ]'}
          </button>
        </div>
      )}

      {/* ============================================================== */}
      {/* QUICK ACTIONS & EVIDENCE INVENTORY                             */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* QUICK ACTIONS */}
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs relative">
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />

          <div className="text-xs font-bold text-[#FFBA42] uppercase tracking-wider pb-3 mb-3 border-b border-[#3D2A12] flex items-center gap-2">
            <span className="text-[#FF9E1B]">▶</span>
            <span>QUICK ACTIONS</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={() => navigate(`/cases/${caseId}/evidence`)}
              className="text-left border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] p-3 rounded-xs transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFBA42] group-hover:text-[#FFE7B8] mb-1">
                <HardDrive className="w-3.5 h-3.5 text-[#FF9E1B]" />
                <span>IMPORT EVIDENCE</span>
              </div>
              <div className="text-[10px] text-[#A6732E]">
                Ingest CDR, bank statements, tower dumps
              </div>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/graph`)}
              className="text-left border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] p-3 rounded-xs transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFBA42] group-hover:text-[#FFE7B8] mb-1">
                <Share2 className="w-3.5 h-3.5 text-[#FF9E1B]" />
                <span>OPEN GRAPH</span>
              </div>
              <div className="text-[10px] text-[#A6732E]">
                Visual network exploration & link analysis
              </div>
            </button>

            <button
              onClick={() => rerunMutation.mutate()}
              disabled={rerunMutation.isPending}
              className="text-left border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] p-3 rounded-xs transition-colors group disabled:opacity-50"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFBA42] group-hover:text-[#FFE7B8] mb-1">
                <Zap className="w-3.5 h-3.5 text-[#FF9E1B]" />
                <span>RUN ANALYSIS</span>
              </div>
              <div className="text-[10px] text-[#A6732E]">
                Execute multi-tier signal fusion engine
              </div>
            </button>

            <button
              onClick={() => navigate(`/cases/${caseId}/reports`)}
              className="text-left border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] p-3 rounded-xs transition-colors group"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-[#FFBA42] group-hover:text-[#FFE7B8] mb-1">
                <FileText className="w-3.5 h-3.5 text-[#FF9E1B]" />
                <span>VIEW REPORTS</span>
              </div>
              <div className="text-[10px] text-[#A6732E]">
                Executive briefs and judicial audit exports
              </div>
            </button>
          </div>
        </div>

        {/* EVIDENCE INVENTORY */}
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs relative">
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />

          <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#3D2A12]">
            <div className="text-xs font-bold text-[#FFBA42] uppercase tracking-wider flex items-center gap-2">
              <span className="text-[#FF9E1B]">▶</span>
              <span>EVIDENCE INVENTORY</span>
            </div>
            <button
              onClick={() => navigate(`/cases/${caseId}/evidence`)}
              className="text-[10px] text-[#A6732E] hover:text-[#FF9E1B] uppercase tracking-wider flex items-center gap-1"
            >
              <span>[ VIEW ALL ]</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {files && files.length > 0 ? (
              files.slice(0, 4).map((f: any) => (
                <div
                  key={f.id}
                  className="border border-[#3D2A12] bg-[#14110C] p-2.5 rounded-xs text-xs flex items-center justify-between"
                >
                  <div className="truncate mr-2">
                    <div className="font-semibold text-[#FFBA42] truncate">{f.original_filename}</div>
                    <div className="text-[10px] text-[#A6732E] flex items-center gap-2 mt-0.5">
                      <span className="uppercase text-[#FF9E1B]">{f.source_type}</span>
                      <span>//</span>
                      <span>{f.accepted_count || 0} records extracted</span>
                    </div>
                  </div>
                  <StatusBadge status={f.status} />
                </div>
              ))
            ) : (
              <div className="p-6 border border-[#3D2A12] bg-[#14110C] rounded-xs text-center text-xs text-[#A6732E] space-y-1">
                <div>NO FORENSIC EVIDENCE FILES INGESTED YET.</div>
                <div className="text-[10px] text-[#6E491A]">
                  Upload CDR records, cell tower dumps, or financial statements via Evidence Room.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* BOTTOM ROW: RECENT ACTIVITY & DOT MATRIX AMBER BANNER          */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* RECENT ACTIVITY */}
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs relative">
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />

          <div className="text-xs font-bold text-[#FFBA42] uppercase tracking-wider pb-3 mb-3 border-b border-[#3D2A12] flex items-center gap-2">
            <span className="text-[#FF9E1B]">▶</span>
            <span>RECENT ACTIVITY</span>
          </div>

          <div className="space-y-2 text-xs">
            {ws?.recent_activity && ws.recent_activity.length > 0 ? (
              ws.recent_activity.slice(0, 4).map((a: any) => (
                <div key={a.id} className="flex items-center justify-between border-b border-[#3D2A12]/40 pb-1.5">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-[9px] px-1 py-0.2 border border-[#3D2A12] text-[#A6732E] uppercase">
                      {a.kind}
                    </span>
                    <span className="text-[#FFBA42] truncate">{a.action}</span>
                  </div>
                  <span className="text-[10px] text-[#A6732E] shrink-0">
                    {a.created_at ? new Date(a.created_at).toLocaleTimeString() : ''}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-[#A6732E]">
                NO SYSTEM ACTIVITY RECORDED FOR THIS CASE YET.
              </div>
            )}
          </div>
        </div>

        {/* TERMINAL CREED & INTELLIGENCE BANNER */}
        <div className="border border-[#3D2A12] bg-[#0D0B08] p-4 rounded-xs relative flex flex-col justify-between">
          <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] pointer-events-none" />
          <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] pointer-events-none" />

          <div>
            <div className="text-[10px] text-[#A6732E] uppercase tracking-widest mb-1">
              OPERATIONAL DOCTRINE
            </div>
            <div className="text-base font-bold text-[#FF9E1B] tracking-wide mb-1">
              "PATTERNS EXIST EVEN IN SILENCE."
            </div>
            <div className="text-xs text-[#A6732E]">— SPYDEE INTELLIGENCE DIVISION</div>
          </div>

          <div className="mt-4 pt-4 border-t border-[#3D2A12] flex items-end justify-between text-[10px] text-[#A6732E]">
            <div className="space-y-0.5">
              <div className="text-[#FFBA42] font-semibold">INTELLIGENCE FOR A SAFER TOMORROW.</div>
              <div>CRIMINAL NETWORK ANALYSIS PLATFORM</div>
            </div>

            <div className="text-right text-[#FF9E1B] font-mono text-[9px]">
              <div>CASE ID: {caseId?.slice(0, 8)}</div>
              <div>SYS-REF: SPY-MH-2026</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
