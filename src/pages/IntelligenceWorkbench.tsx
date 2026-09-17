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
import { Zap, Radio, AlertTriangle } from 'lucide-react';

const FAMILY_META: Record<string, { label: string; weight: string; color: string }> = {
  communication: { label: 'COMMUNICATION', weight: '0.20', color: '#FF9E1B' },
  device_sim: { label: 'DEVICE/SIM', weight: '0.20', color: '#FFBA42' },
  spatial_temporal: { label: 'SPATIAL/TEMPORAL', weight: '0.15', color: '#FFE7B8' },
  writing_style: { label: 'WRITING STYLE', weight: '0.15', color: '#A6732E' },
  financial: { label: 'FINANCIAL', weight: '0.10', color: '#34D399' },
  infrastructure: { label: 'INFRASTRUCTURE', weight: '0.10', color: '#FBBF24' },
  network_topology: { label: 'TOPOLOGY', weight: '0.10', color: '#FF9E1B' },
};

const FAMILY_ORDER = ['communication', 'device_sim', 'spatial_temporal', 'writing_style', 'financial', 'infrastructure', 'network_topology'];

export default function IntelligenceWorkbench() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [activeFamily, setActiveFamily] = useState<string>('all');
  const [running, setRunning] = useState(false);

  const { data: runs } = useQuery({
    queryKey: ['analysis', caseId],
    queryFn: () => api.getAnalysisRuns(caseId!),
    enabled: !!caseId,
  });

  const { data: signals } = useQuery({
    queryKey: ['signals', caseId],
    queryFn: () => api.getSignals(caseId!, activeFamily === 'all' ? undefined : activeFamily),
    enabled: !!caseId,
  });

  const { data: hypotheses } = useQuery({
    queryKey: ['hypotheses', caseId],
    queryFn: () => api.getHypotheses(caseId!),
    enabled: !!caseId,
  });

  const runMutation = useMutation({
    mutationFn: () => api.runAnalysis(caseId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analysis', caseId] });
      queryClient.invalidateQueries({ queryKey: ['hypotheses', caseId] });
      queryClient.invalidateQueries({ queryKey: ['signals', caseId] });
      queryClient.invalidateQueries({ queryKey: ['workspace-summary', caseId] });
      setRunning(false);
    },
    onError: () => {
      setRunning(false);
    },
  });

  const latestRun = runs && runs.length > 0 ? runs[0] : null;
  const counts: Record<string, number> = (signals?.counts_by_family as Record<string, number>) || {};
  const families = FAMILY_ORDER.filter(f => counts[f] !== undefined);
  const hasEngineErrors = Object.keys(counts).length === 0 && latestRun && latestRun.status === 'completed';

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="WORKBENCH // 04"
        title="DETERMINISTIC INTELLIGENCE SIGNAL MATRIX"
        description="Multi-vector heuristic engines calculating telecommunication, spatial proximity, and behavioral co-occurrences."
      >
        <div className="flex items-center gap-3">
          <TerminalButton
            variant="primary"
            onClick={() => {
              setRunning(true);
              runMutation.mutate();
            }}
            disabled={running}
          >
            {running ? '[ EXECUTING ENGINE SUITE... ]' : '⚡ RUN SIGNAL ANALYSIS'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Latest Analysis Banner */}
      {latestRun && (
        <TerminalPanel
          title="ACTIVE RUN TELEMETRY"
          action={
            <span className="text-xs font-bold text-[#FF9E1B]">
              VERSION v{latestRun.version}
            </span>
          }
        >
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              <StatusBadge status={latestRun.status} />
              <span className="text-[#A6732E]">
                HASH ID: #{latestRun.id.slice(0, 10)}
              </span>
              {latestRun.completed_at && (
                <span className="text-[#A6732E]">
                  COMPLETED: {new Date(latestRun.completed_at).toLocaleString()}
                </span>
              )}
            </div>

            <div className="text-[11px] text-[#FFE7B8] flex flex-wrap gap-2">
              {Object.entries(counts).map(([f, c]) => (
                <span
                  key={f}
                  className="px-2 py-0.5 bg-[#14110C] border border-[#3D2A12] rounded-xs"
                >
                  <span className="text-[#A6732E]">{FAMILY_META[f]?.label || f}:</span>{' '}
                  <span className="font-bold text-[#FF9E1B]">{c}</span>
                </span>
              ))}
            </div>
          </div>
        </TerminalPanel>
      )}

      {!latestRun && (
        <div className="border border-dashed border-[#3D2A12] bg-[#0D0B08] p-8 text-center text-[#A6732E] rounded-xs text-xs">
          NO ANALYSIS PIPELINE HAS RUN FOR THIS INVESTIGATION. TRIGGER SIGNAL ANALYSIS TO POPULATE THE MATRIX.
        </div>
      )}

      {latestRun && hasEngineErrors && (
        <div className="border border-[#EF4444] bg-[#EF4444]/10 p-4 rounded-xs text-xs text-[#EF4444]">
          ANALYSIS EXECUTED WITH ZERO DERIVED SIGNALS. VERIFY RAW EVIDENCE INGESTION AND INGESTION SCHEMA COMPATIBILITY.
        </div>
      )}

      {/* Signal Family Filter Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        <button
          onClick={() => setActiveFamily('all')}
          className={`p-3 text-left border rounded-xs transition-colors ${
            activeFamily === 'all'
              ? 'bg-[#14110C] border-[#FF9E1B] text-[#FF9E1B]'
              : 'bg-[#0D0B08] border-[#3D2A12] hover:bg-[#14110C] text-[#FFE7B8]'
          }`}
        >
          <div className="text-[10px] text-[#A6732E] uppercase">ALL DOMAINS</div>
          <div className="font-bold text-sm mt-0.5">
            {families.reduce((a, f) => a + (counts[f] || 0), 0)}
          </div>
          <div className="text-[9px] text-[#A6732E]">SIGNALS</div>
        </button>

        {families.map(f => (
          <button
            key={f}
            onClick={() => setActiveFamily(f)}
            className={`p-3 text-left border rounded-xs transition-colors ${
              activeFamily === f
                ? 'bg-[#14110C] border-[#FF9E1B] text-[#FF9E1B]'
                : 'bg-[#0D0B08] border-[#3D2A12] hover:bg-[#14110C] text-[#FFE7B8]'
            }`}
          >
            <div className="text-[10px] text-[#A6732E] uppercase truncate">
              {FAMILY_META[f]?.label || f}
            </div>
            <div className="font-bold text-sm mt-0.5">{counts[f]}</div>
            <div className="text-[9px] text-[#A6732E]">WT: {FAMILY_META[f]?.weight || '0.10'}</div>
          </button>
        ))}
      </div>

      {/* Signal Feed */}
      <TerminalPanel
        title={
          activeFamily === 'all'
            ? `RAW DETECTED SIGNALS (${signals?.signals?.length || 0})`
            : `${FAMILY_META[activeFamily]?.label || activeFamily} SIGNAL FEED (${signals?.signals?.length || 0})`
        }
      >
        {signals && signals.signals.length > 0 ? (
          <div className="space-y-3">
            {signals.signals.slice(0, 25).map((s: any) => (
              <div
                key={s.id}
                className="bg-[#0D0B08] border border-[#3D2A12] p-3.5 rounded-xs space-y-2 hover:border-[#FF9E1B]/50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#FFE7B8]">
                      {[s.entity_pair?.source, s.entity_pair?.target].filter(Boolean).join(' ↔ ') || '(UNPAIRED VECTOR)'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-xs bg-[#14110C] border border-[#3D2A12] text-[#A6732E]">
                      {s.contributing_record_count} SOURCES
                    </span>
                    {s.engine_name && (
                      <span className="text-[10px] text-[#A6732E]">
                        ENG: {s.engine_name} {s.engine_version || ''}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-xs bg-[#14110C] border border-[#FF9E1B]/40 text-[#FF9E1B]">
                      INDEX: {Math.round(s.numeric_value * 100)}/100
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#FFBA42]/80">{s.explanation || 'No heuristic annotation.'}</p>

                {s.contradiction && (
                  <div className="text-xs text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 p-2 rounded-xs">
                    [ CONTRADICTION DETECTED ] {s.contradiction_reason || 'Incompatible physical or timeline parameters'}
                  </div>
                )}

                {s.feature_details && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {Object.entries(s.feature_details)
                      .filter(([k]) => !['cycle'].includes(k))
                      .slice(0, 8)
                      .map(([k, v]) => (
                        <span
                          key={k}
                          className="text-[10px] bg-[#14110C] border border-[#3D2A12] rounded-xs px-2 py-0.5 text-[#A6732E]"
                        >
                          <span className="text-[#FF9E1B]">{k}:</span>{' '}
                          {typeof v === 'string'
                            ? v.length > 28
                              ? v.slice(0, 28) + '…'
                              : v
                            : JSON.stringify(v)}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-[#A6732E] text-xs">
            {activeFamily === 'all'
              ? 'RUN SIGNAL ANALYSIS TO GENERATE INTELLIGENCE FEEDS.'
              : `NO SIGNALS LOGGED FOR ${FAMILY_META[activeFamily]?.label || activeFamily}.`}
          </div>
        )}
      </TerminalPanel>

      {/* Forensic Pipeline Visualizer */}
      <TerminalPanel title="INTELLIGENCE FUSION SEQUENCE">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-[#0D0B08] border border-[#3D2A12] rounded-xs">
            <div className="text-[10px] text-[#A6732E] uppercase">STAGE 01</div>
            <div className="font-bold text-[#FFE7B8] mt-1">SOURCE RECORDS</div>
            <div className="text-[10px] text-[#A6732E] mt-1">CDRs, chats, logs, filings</div>
          </div>
          <div className="p-3 bg-[#0D0B08] border border-[#3D2A12] rounded-xs">
            <div className="text-[10px] text-[#A6732E] uppercase">STAGE 02</div>
            <div className="font-bold text-[#FF9E1B] mt-1">
              SIGNALS ({signals?.signals?.length || 0})
            </div>
            <div className="text-[10px] text-[#A6732E] mt-1">Mathematical vectors</div>
          </div>
          <div className="p-3 bg-[#0D0B08] border border-[#3D2A12] rounded-xs">
            <div className="text-[10px] text-[#A6732E] uppercase">STAGE 03</div>
            <div className="font-bold text-[#FFBA42] mt-1">
              HYPOTHESES ({hypotheses?.length || 0})
            </div>
            <div className="text-[10px] text-[#A6732E] mt-1">Weighted network assertions</div>
          </div>
          <div className="p-3 bg-[#0D0B08] border border-[#3D2A12] rounded-xs">
            <div className="text-[10px] text-[#A6732E] uppercase">STAGE 04</div>
            <div className="font-bold text-[#EF4444] mt-1">GAP / ACTIONS</div>
            <div className="text-[10px] text-[#A6732E] mt-1">Subpoenas, warrants, field leads</div>
          </div>
        </div>
      </TerminalPanel>
    </div>
  );
}
