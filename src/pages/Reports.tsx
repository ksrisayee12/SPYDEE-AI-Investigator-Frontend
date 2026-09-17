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
import { FileText, Printer, Download, ShieldCheck } from 'lucide-react';

export default function Reports() {
  const { caseId } = useParams<{ caseId: string }>();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [analysisRunId, setAnalysisRunId] = useState('');

  const { data: reports } = useQuery({
    queryKey: ['reports', caseId],
    queryFn: () => api.getReports(caseId!),
    enabled: !!caseId,
  });

  const { data: runs } = useQuery({
    queryKey: ['analysis-runs', caseId],
    queryFn: () => api.getAnalysisRuns(caseId!),
    enabled: !!caseId,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      api.createReport(caseId!, {
        title: title || `CASE REPORT // ${new Date().toISOString().slice(0, 10)}`,
        include_unresolved: true,
        analysis_run_id: analysisRunId || undefined,
      }),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['reports', caseId] });
      setSelectedReport(data);
      setGenerating(false);
      setTitle('');
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="ARCHIVE // 07"
        title="DOSSIER COMPILATION & AUDIT LEDGER"
        description="Court-admissible forensic briefings, multi-source provenance manifests, and cryptographic operational audit logs."
      >
        <div className="flex items-center gap-3">
          <TerminalButton
            variant="primary"
            onClick={() => {
              setGenerating(true);
              generateMutation.mutate();
            }}
            disabled={generating}
          >
            {generating ? '[ COMPILING... ]' : '+ COMPILE DOSSIER'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Dossier Generator, Generated Reports & Audit */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generation Console */}
          <TerminalPanel title="COMPILE INTELLIGENCE BRIEFING" variant="raised">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                  DOSSIER TITLE / JURISDICTIONAL REFERENCE
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. OPERATION NIGHTSHADE // INTERIM PROBABLE CAUSE BRIEFING"
                  className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder:text-[#7A521D]"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {runs && runs.length > 0 && (
                  <div className="flex-1">
                    <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                      ANALYSIS RUN VERSION
                    </label>
                    <select
                      value={analysisRunId}
                      onChange={e => setAnalysisRunId(e.target.value)}
                      className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none"
                    >
                      <option value="">LATEST REVISED RUN (AUTOMATIC)</option>
                      {[...runs].reverse().map((r: any) => (
                        <option key={r.id} value={r.id}>
                          RUN v{r.version} —{' '}
                          {r.created_at ? new Date(r.created_at).toLocaleString() : r.id.slice(0, 8)}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="sm:self-end">
                  <TerminalButton
                    variant="primary"
                    onClick={() => {
                      setGenerating(true);
                      generateMutation.mutate();
                    }}
                    disabled={generating}
                  >
                    {generating ? '[ COMPILING... ]' : '[ EXECUTE COMPILATION ]'}
                  </TerminalButton>
                </div>
              </div>
            </div>
          </TerminalPanel>

          {/* Generated Reports Registry */}
          <TerminalPanel
            title={`COMPILED DOSSIER REGISTRY (${reports?.length || 0})`}
          >
            {reports && reports.length > 0 ? (
              <div className="divide-y divide-[#3D2A12]/50">
                {reports.map((r: any) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-center justify-between group ${
                      selectedReport?.id === r.id
                        ? 'bg-[#14110C] border-l-2 border-[#FF9E1B]'
                        : 'hover:bg-[#14110C]'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-xs text-[#FFBA42] group-hover:text-[#FFE7B8] transition-colors flex items-center gap-2">
                        <span>{r.title}</span>
                        {selectedReport?.id === r.id && (
                          <span className="text-[10px] text-[#FF9E1B] bg-[#FF9E1B]/10 px-1.5 py-0.2 rounded-xs">
                            [ ACTIVE VIEW ]
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#A6732E] flex items-center gap-2">
                        <span>GEN: {new Date(r.created_at).toLocaleString()}</span>
                        <span>·</span>
                        <span>DOC ID: #{r.id.slice(0, 8)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] px-2 py-0.5 rounded-xs bg-[#0D0B08] border border-[#3D2A12] text-[#34D399] uppercase font-bold">
                        {r.format || 'MARKDOWN'}
                      </span>
                      <span className="text-[#FF9E1B] text-xs group-hover:translate-x-1 transition-transform">
                        ▶
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-[#A6732E] text-xs">
                NO DOSSIERS COMPILED IN THIS INVESTIGATION.
              </div>
            )}
          </TerminalPanel>

          {/* Cryptographic Audit Ledger */}
          <TerminalPanel title="CHAIN OF CUSTODY & AUDIT LEDGER">
            <div className="text-xs">
              <AuditLog caseId={caseId!} />
            </div>
          </TerminalPanel>
        </div>

        {/* Right Column: Selected Report Live Preview */}
        <div className="lg:col-span-5 sticky top-16">
          {selectedReport ? (
            <TerminalPanel
              title="DOSSIER INSPECTOR"
              variant="raised"
              action={
                <div className="flex gap-2">
                  <TerminalButton
                    size="xs"
                    onClick={() => downloadMarkdown(selectedReport)}
                  >
                    [ EXPORT .MD ]
                  </TerminalButton>
                  <TerminalButton
                    size="xs"
                    variant="primary"
                    onClick={() => printReport(selectedReport)}
                  >
                    [ PRINT / PDF ]
                  </TerminalButton>
                </div>
              }
            >
              <div className="text-xs space-y-4 max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                {/* Header Information */}
                <div className="p-3 bg-[#0D0B08] border border-[#3D2A12] rounded-xs space-y-1">
                  <div className="text-xs font-bold text-[#FF9E1B] truncate">
                    {selectedReport.title}
                  </div>
                  <div className="text-[10px] text-[#A6732E]">
                    COMPILED: {new Date(selectedReport.created_at).toLocaleString()}
                  </div>
                </div>

                {/* Quantitative Summary Metric Matrix */}
                {selectedReport.content?.summary && (
                  <div className="bg-[#0D0B08] p-3 border border-[#3D2A12] rounded-xs space-y-2">
                    <div className="text-[10px] text-[#34D399] font-bold uppercase tracking-wider flex items-center justify-between">
                      <span>INTELLIGENCE MATRIX TOTALS</span>
                      {selectedReport.content.analysis_version != null && (
                        <span className="text-[#A6732E]">
                          ANALYSIS RUN v{selectedReport.content.analysis_version}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">ENTITIES:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_entities}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">RELATIONS:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_relationships}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">HYPOTHESES:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_hypotheses}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">SIGNALS:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_signals ?? '-'}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">EVIDENCE FILES:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_evidence_files}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">SOURCE RECORDS:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.total_source_records}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#EF4444]">CONTRADICTIONS:</span>{' '}
                        <span className="text-[#EF4444] font-bold">
                          {selectedReport.content.summary.open_contradictions ?? 0}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#FF9E1B]">OPEN LEADS:</span>{' '}
                        <span className="text-[#FF9E1B] font-bold">
                          {selectedReport.content.summary.open_leads ?? 0}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">INFO GAPS:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.open_gaps ?? 0}
                        </span>
                      </div>
                      <div className="bg-[#14110C] p-1.5 border border-[#3D2A12]/60">
                        <span className="text-[#A6732E]">ACTIONS QUEUED:</span>{' '}
                        <span className="text-[#FFE7B8] font-bold">
                          {selectedReport.content.summary.open_actions ?? 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ranked Hypotheses */}
                {selectedReport.content?.hypotheses?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#FF9E1B] uppercase font-bold tracking-wider">
                      RANKED HYPOTHESES ({selectedReport.content.hypotheses.length})
                    </div>
                    <div className="space-y-1.5">
                      {[...selectedReport.content.hypotheses]
                        .sort(
                          (a: any, b: any) =>
                            (b.numeric_value || 0) - (a.numeric_value || 0)
                        )
                        .slice(0, 10)
                        .map((h: any, i: number) => (
                          <div
                            key={h.id || i}
                            className="bg-[#0D0B08] p-2 border border-[#3D2A12]/60 rounded-xs space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-[#FFE7B8] truncate">
                                {h.entity_pair_name || h.stable_key || h.hypothesis_type}
                              </span>
                              <span className="text-[#FF9E1B] font-bold">
                                {h.numeric_value ?? 0}/100
                              </span>
                            </div>
                            <div className="w-full bg-[#14110C] border border-[#3D2A12]/60 h-2 rounded-xs overflow-hidden">
                              <div
                                className="h-full bg-[#FF9E1B]"
                                style={{
                                  width: `${Math.max(3, h.numeric_value || 0)}%`,
                                }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-[#A6732E]">
                              <span>TYPE: {h.hypothesis_type || 'GENERAL'}</span>
                              <StatusBadge status={h.review_state || h.state || 'pending'} />
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Contradictions */}
                {selectedReport.content?.contradictions?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#EF4444] uppercase font-bold tracking-wider">
                      CONTRADICTIONS LOGGED ({selectedReport.content.contradictions.length})
                    </div>
                    <div className="space-y-1">
                      {selectedReport.content.contradictions.map((c: any) => (
                        <div
                          key={c.id}
                          className="bg-[#EF4444]/10 border border-[#EF4444]/30 p-2 rounded-xs text-[11px] space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#EF4444]">{c.title}</span>
                            <StatusBadge status={c.status} />
                          </div>
                          {c.explanation && (
                            <p className="text-[10px] text-[#A6732E]">{c.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Leads & Actions */}
                {selectedReport.content?.leads?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[10px] text-[#34D399] uppercase font-bold tracking-wider">
                      PRIMARY LEADS ({selectedReport.content.leads.length})
                    </div>
                    <div className="space-y-1">
                      {selectedReport.content.leads.slice(0, 6).map((l: any) => (
                        <div
                          key={l.id}
                          className="bg-[#0D0B08] border border-[#3D2A12] p-2 rounded-xs text-[11px] flex items-center justify-between"
                        >
                          <span className="truncate text-[#FFE7B8]">{l.title}</span>
                          <div className="flex gap-1">
                            <StatusBadge status={l.priority} />
                            <StatusBadge status={l.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Decisions */}
                {selectedReport.content?.review_decisions?.length > 0 && (
                  <div className="space-y-1.5 border-t border-[#3D2A12]/60 pt-2">
                    <div className="text-[10px] text-[#A6732E] uppercase font-bold">
                      OFFICER DECISION AUDIT
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {selectedReport.content.review_decisions.map((r: any, i: number) => (
                        <div
                          key={i}
                          className="bg-[#0D0B08] p-1.5 border border-[#3D2A12]/50 rounded-xs flex items-start gap-2"
                        >
                          <span className="text-[#FF9E1B] font-bold uppercase">{r.action}</span>
                          <span className="text-[#A6732E]">{r.note || 'No notes attached.'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Legal Limitations / Standard Disclaimer */}
                {selectedReport.content?.limitations && (
                  <div className="space-y-1 border-t border-[#3D2A12]/60 pt-2">
                    <div className="text-[10px] text-[#A6732E] uppercase font-bold">
                      EVIDENTIARY LIMITATIONS
                    </div>
                    <ul className="text-[10px] text-[#A6732E] list-disc list-inside space-y-0.5">
                      {selectedReport.content.limitations.map((l: string, i: number) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </TerminalPanel>
          ) : (
            <div className="border border-[#3D2A12] bg-[#0D0B08] p-8 text-center text-[#A6732E] rounded-xs space-y-2">
              <div className="text-xs text-[#FF9E1B] font-bold">
                [ AWAITING DOSSIER SELECTION ]
              </div>
              <p className="text-[11px] text-[#A6732E]">
                Select a compiled report from the ledger on the left to inspect intelligence
                breakdowns, export Markdown manifests, or print formal affidavits.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function markdownFromReport(r: any): string {
  const c = r.content || {};
  const lines: string[] = [];
  lines.push(`# ${c.case?.title || r.title}`);
  lines.push('');
  lines.push(`- Case code: ${c.case?.code || '-'}`);
  lines.push(`- Status: ${c.case?.status || '-'}`);
  lines.push(`- Generated: ${c.generated_at || r.created_at}`);
  lines.push(`- Analysis version: ${c.analysis_version ?? '-'}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`- Entities: ${c.summary?.total_entities ?? '-'}`);
  lines.push(`- Relationships: ${c.summary?.total_relationships ?? '-'}`);
  lines.push(`- Hypotheses: ${c.summary?.total_hypotheses ?? '-'}`);
  lines.push('');
  lines.push('## Hypotheses (ranked by strength)');
  lines.push('');
  [...(c.hypotheses || [])]
    .sort((a: any, b: any) => (b.numeric_value || 0) - (a.numeric_value || 0))
    .forEach((h: any, i: number) => {
      const name = h.entity_pair_name || h.stable_key || h.hypothesis_type || 'Unknown';
      lines.push(`### ${i + 1}. ${name}`);
      lines.push(`- Strength: ${h.numeric_value}/100`);
      lines.push(`- Type: ${h.hypothesis_type || '-'}`);
      lines.push(`- Review: ${h.review_state || h.state || 'pending'}`);
      if (h.notes) lines.push(`- Notes: ${h.notes}`);
      if (h.contributing_signal_highlights?.length) {
        lines.push(`- Key signals: ${h.contributing_signal_highlights.join('; ')}`);
      }
      lines.push('');
    });
  if (c.review_decisions?.length) {
    lines.push('## Review Decisions');
    lines.push('');
    c.review_decisions.forEach((rv: any) => {
      lines.push(`- **${rv.action}** ${rv.note ? `— ${rv.note}` : ''} (${rv.created_at})`);
    });
    lines.push('');
  }
  lines.push('## Limitations');
  lines.push('');
  (c.limitations || []).forEach((l: string) => lines.push(`- ${l}`));
  lines.push('');
  lines.push('---');
  lines.push(
    '*Generated with the SPYDEE intelligence terminal. Findings are evidence-strength indices, not proof.*'
  );
  return lines.join('\n');
}

function downloadMarkdown(r: any) {
  const md = markdownFromReport(r);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(r.title || 'report').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function printReport(r: any) {
  const c = r.content || {};
  const esc = (s: any) =>
    String(s ?? '').replace(
      /[&<>"]/g,
      ch =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch] || ch)
    );
  const hyps = [...(c.hypotheses || [])]
    .sort((a: any, b: any) => (b.numeric_value || 0) - (a.numeric_value || 0))
    .map(
      (h: any, i: number) =>
        `<tr>
        <td>${i + 1}</td>
        <td><strong>${esc(
          h.entity_pair_name || h.stable_key || h.hypothesis_type || '-'
        )}</strong><br>
        <span class="muted">Type: ${esc(h.hypothesis_type || '-')}</span></td>
        <td class="num">${h.numeric_value ?? '-'}/100</td>
        <td>${esc(h.review_state || h.state || 'pending')}</td>
        <td class="muted">${esc(h.notes || '')}</td>
      </tr>`
    )
    .join('');
  const reviews = (c.review_decisions || [])
    .map(
      (rv: any) =>
        `<li><strong>${esc(rv.action)}</strong> ${
          rv.note ? `— ${esc(rv.note)}` : ''
        } <span class="muted">(${esc(rv.created_at)})</span></li>`
    )
    .join('');
  const limitations = (c.limitations || [])
    .map((l: string) => `<li>${esc(l)}</li>`)
    .join('');

  const html = `<!doctype html><html><head><meta charset="utf-8">
      <title>${esc(r.title)}</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 40px; color: #1a1a2e; background: #fff; }
        h1 { color: #080705; border-bottom: 2px solid #FF9E1B; padding-bottom: 8px; font-size: 20px; }
        h2 { color: #080705; margin-top: 24px; font-size: 14px; text-transform: uppercase; }
        table { border-collapse: collapse; width: 100%; font-size: 11px; margin-top: 12px; }
        th, td { border: 1px solid #3D2A12; padding: 6px 8px; text-align: left; vertical-align: top; }
        th { background: #fdf6ec; }
        .num { font-weight: 600; white-space: nowrap; }
        .muted { color: #64748b; font-size: 10px; }
        ul { margin-top: 6px; font-size: 11px; }
        .footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #FF9E1B; color: #64748b; font-size: 10px; }
        @media print { body { margin: 12mm; } }
      </style></head><body>
      <h1>${esc(r.title)}</h1>
      <p class="muted">
        CASE: ${esc(c.case?.title || '-')} (${esc(c.case?.code || '-')}) &middot;
        STATUS: ${esc(c.case?.status || '-')} &middot;
        GENERATED: ${esc(c.generated_at || r.created_at)} &middot;
        ANALYSIS RUN: ${esc(c.analysis_version ?? '-')}
      </p>
      <h2>Executive Summary</h2>
      <p>Entities: <strong>${c.summary?.total_entities ?? '-'}</strong> &middot;
        Relationships: <strong>${c.summary?.total_relationships ?? '-'}</strong> &middot;
        Hypotheses: <strong>${c.summary?.total_hypotheses ?? '-'}</strong></p>
      <h2>Hypotheses (Ranked by Evidence Weight)</h2>
      <table>
        <thead><tr><th>#</th><th>Hypothesis</th><th>Strength</th><th>Review</th><th>Notes</th></tr></thead>
        <tbody>${hyps || '<tr><td colspan="5" class="muted">No hypotheses recorded.</td></tr>'}</tbody>
      </table>
      ${reviews ? `<h2>Audit Decisions</h2><ul>${reviews}</ul>` : ''}
      <h2>Legal Limitations</h2><ul>${limitations || '<li>None recorded.</li>'}</ul>
      <div class="footer">CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE &middot; Generated with SPYDEE Intelligence Terminal</div>
      </body></html>`;

  const w = window.open('', '_blank', 'width=900,height=700');
  if (w) {
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 250);
  }
}

function AuditLog({ caseId }: { caseId: string }) {
  const { data: events } = useQuery({
    queryKey: ['audit', caseId],
    queryFn: () => api.getAuditLog(caseId),
    enabled: !!caseId,
  });

  if (!events || events.length === 0)
    return <div className="text-[#A6732E] py-3">NO AUDIT RECORDS FOUND.</div>;

  return (
    <div className="space-y-2">
      {events.slice(0, 25).map((e: any) => (
        <div
          key={e.id}
          className="flex items-center justify-between py-1.5 border-b border-[#3D2A12]/40 last:border-0 text-xs"
        >
          <div className="flex items-center gap-2">
            <span className="text-[#34D399] font-bold">[{e.action}]</span>
            {e.resource_type && (
              <span className="text-[#A6732E]">
                TARGET: {e.resource_type}
                {e.resource_id ? ` #${e.resource_id.slice(0, 6)}` : ''}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#A6732E]">
            {new Date(e.created_at).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}
