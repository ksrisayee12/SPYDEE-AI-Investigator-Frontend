import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';

const typeColors: Record<string, string> = {
  person: '#9FE3B1',
  alias: '#9FE3B1',
  phone_sim: '#2DD4BF',
  device: '#FFB84D',
  account: '#9FE3B1',
  location: '#E05A52',
  organization: '#A78BFA',
  domain_ip: '#6F887A',
  event: '#FFB84D',
  document: '#6F887A',
};

export default function InvestigationGraph() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();
  const cyRef = useRef<HTMLDivElement>(null);
  const cyInstance = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);
  const [filters, setFilters] = useState<any>({ include_inferred: true, max_nodes: 300, max_edges: 1500 });
  const [nodeDetail, setNodeDetail] = useState<any>(null);
  const [edgeDetail, setEdgeDetail] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());

  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ['graph', caseId, filters],
    queryFn: () => api.getGraph(caseId!, filters),
    enabled: !!caseId,
  });

  const edgeRange = useCallback(() => {
    let min: number | null = null;
    let max: number | null = null;
    (graphData?.edges || []).forEach((e: any) => {
      ['valid_from', 'valid_to'].forEach((k) => {
        const v = e.properties?.[k];
        if (!v) return;
        const t = new Date(v).getTime();
        if (Number.isNaN(t)) return;
        if (min === null || t < min) min = t;
        if (max === null || t > max) max = t;
      });
    });
    return { min: min !== null ? new Date(min).toISOString() : undefined, max: max !== null ? new Date(max).toISOString() : undefined };
  }, [graphData]);

  const applyDates = (from?: string, to?: string) => {
    setDateFrom(from || '');
    setDateTo(to || '');
    setFilters((f: any) => ({
      ...f,
      date_from: from ? new Date(from).toISOString() : undefined,
      date_to: to ? new Date(to).toISOString() : undefined,
    }));
  };

  const applyPreset = (hours: number | null) => {
    if (hours === null) { applyDates(undefined, undefined); return; }
    const range = edgeRange();
    if (!range.max) return;
    const to = new Date(range.max);
    applyDates(new Date(to.getTime() - hours * 3600 * 1000).toISOString(), to.toISOString());
  };

  const range = edgeRange();

  // Search: find matching nodes and highlight them
  const searchResults = useQuery({
    queryKey: ['entities', caseId, searchTerm],
    queryFn: () => api.getEntities(caseId!, undefined, searchTerm || undefined),
    enabled: !!caseId && searchTerm.trim().length > 0,
  });

  const runSearch = (name: string) => {
    const results = searchResults.data || [];
    if (name === '') { setHighlightIds(new Set()); return; }
    const ids = results.map((e: any) => e.id);
    setHighlightIds(new Set(ids));
    if (results.length > 0) {
      cyInstance.current?.nodes().forEach((n) => {
        if (ids.includes(n.id())) n.addClass('highlighted');
        else n.removeClass('highlighted');
      });
      if (results[0]?.id) {
        cyInstance.current?.animate({ fit: { eles: cyInstance.current!.elements(`#${CSS.escape(results[0].id)}`) as any, padding: 80 }, duration: 400 });
      }
    }
  };

  useEffect(() => {
    if (!cyRef.current) return;
    cyInstance.current = cytoscape({
      container: cyRef.current as unknown as HTMLElement,
      styleEnabled: true,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#0F1D18',
            'border-width': 2,
            'border-color': '#27453A',
            label: 'data(label)',
            'font-family': 'IBM Plex Mono, monospace',
            'font-size': '10px',
            color: '#D8E5DC',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-wrap': 'ellipsis',
            'text-max-width': '120px',
          },
        },
        ...Object.entries(typeColors).map(([type, color]) => ({
          selector: `node.${type}`,
          style: { 'background-color': '#0F1D18', 'border-color': color, 'border-width': 2.5 },
        })),
        {
          selector: 'edge.observed',
          style: {
            'line-color': '#27453A',
            width: 1.5,
            'target-arrow-color': '#27453A',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge.inferred',
          style: {
            'line-color': '#FFB84D',
            width: 1.5,
            'line-style': 'dashed',
            'target-arrow-color': '#FFB84D',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge.contradicted',
          style: {
            'line-color': '#E05A52',
            'line-style': 'dotted',
            'target-arrow-color': '#E05A52',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        { selector: 'edge.strong', style: { width: 3.5, 'line-color': '#6F887A' } },
        { selector: 'edge.moderate', style: { width: 2.2 } },
        { selector: 'node.highlighted', style: { 'border-width': 4, 'border-color': '#FFB84D' } },
        { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#9FE3B1' } },
        { selector: 'edge:selected', style: { 'line-color': '#9FE3B1', width: 3 } },
      ],
      layout: { name: 'cose', animate: false, nodeDimensionsIncludeLabels: true, idealEdgeLength: 120, padding: 40 },
      minZoom: 0.2,
      maxZoom: 3,
    });
    return () => { cyInstance.current?.destroy(); cyInstance.current = null; };
  }, []);

  useEffect(() => {
    if (!cyInstance.current || !graphData) return;
    const cy = cyInstance.current!;
    const elements: cytoscape.ElementDefinition[] = [];
    graphData.nodes.forEach((n: any) => {
      elements.push({
        data: { id: n.id, label: n.label, entity_type: n.entity_type, review_state: n.review_state },
        classes: n.entity_type,
      });
    });
    graphData.edges.forEach((e: any) => {
      const contradicted = !!(e.properties?.contradiction || e.properties?.contradicted || e.properties?.contradiction_reason);
      const strength = e.evidence_count || e.properties?.evidence_count || 0;
      const cls = [
        e.classification === 'inferred' ? 'inferred' : 'observed',
        contradicted ? 'contradicted' : '',
        strength >= 10 ? 'strong' : strength >= 3 ? 'moderate' : '',
      ].filter(Boolean).join(' ');
      elements.push({
        data: { id: e.id, source: e.source, target: e.target, label: e.label, classification: e.classification, relationship_type: e.relationship_type, evidence_count: strength, contradicted, props: e.properties },
        classes: cls,
      });
    });
    cy.elements().remove();
    cy.add(elements);
    cy.elements().unselect();
    cy.layout({ name: 'cose', animate: false, nodeDimensionsIncludeLabels: true, idealEdgeLength: 120, padding: 40 }).run();
    cy.elements().forEach((ele) => { ele.removeClass('highlighted'); });
  }, [graphData]);

  useEffect(() => {
    if (!cyInstance.current) return;
    const cy = cyInstance.current!;
    const onNodeTap = (evt: any) => {
      const node = evt.target;
      setSelectedEdge(null);
      setEdgeDetail(null);
      setSelectedNode(node.data());
      api.getNeighbourhood(caseId!, node.data('id'), 1).then((detail) => setNodeDetail(detail));
    };
    const onEdgeTap = async (evt: any) => {
      const edge = evt.target;
      setSelectedNode(null);
      setNodeDetail(null);
      setSelectedEdge(edge.data());
      const evidence = await api.getRelEvidence(caseId!, edge.data('id')).catch(() => ({ evidence: [] }));
      setEdgeDetail({ ...edge.data(), evidence: evidence.evidence || [] });
    };
    const onBgrTap = (evt: any) => {
      if (evt.target === cy) { setSelectedNode(null); setSelectedEdge(null); setNodeDetail(null); setEdgeDetail(null); }
    };
    cy.on('tap', 'node', onNodeTap);
    cy.on('tap', 'edge', onEdgeTap);
    cy.on('tap', onBgrTap);
    return () => { cy.removeListener('tap'); };
  }, [caseId]);

  const typeOptions = ['person', 'alias', 'phone_sim', 'device', 'account', 'location', 'organization', 'domain_ip'];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setSelectedNode(null); setSelectedEdge(null); setNodeDetail(null); setEdgeDetail(null);
      cyInstance.current?.elements().unselect();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col min-w-0 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="TOPOLOGY // 02"
        title="INVESTIGATION LINK & RELATIONSHIP GRAPH"
        description="Dynamic force-directed network showing observed, inferred, and disputed entity linkages."
      >
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); runSearch(e.target.value); }}
              onKeyDown={(e) => { if (e.key === 'Enter') runSearch(searchTerm); }}
              placeholder="SEARCH ENTITY ID / ALIAS..."
              className="px-3 py-1 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] placeholder-[#6F887A] rounded-sm w-56 focus:border-[#FFB84D] outline-none"
            />
          </div>
          <select
            onChange={e => setFilters({ ...filters, entity_types: e.target.value ? [e.target.value] : undefined })}
            className="px-2 py-1 bg-[#07100D] border border-[#27453A] text-xs text-[#D8E5DC] rounded-sm"
          >
            <option value="">ALL ENTITY TYPES</option>
            {typeOptions.map(t => <option key={t} value={t}>{t.toUpperCase().replace('_', '/')}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-[#D8E5DC] cursor-pointer">
            <input
              type="checkbox"
              checked={filters.include_inferred}
              onChange={e => setFilters({ ...filters, include_inferred: e.target.checked })}
              className="accent-[#FFB84D]"
            />
            INFERRED
          </label>
          <TerminalButton variant="secondary" onClick={() => refetch()}>
            REFRESH
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Temporal Scoping Bar */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-[#0B1713] border border-[#27453A] rounded-sm my-2 text-xs">
        <span className="font-bold text-[#6F887A] text-[10px] uppercase tracking-wider">TEMPORAL WINDOW:</span>
        <input
          type="datetime-local"
          value={dateFrom ? toLocalInput(dateFrom) : ''}
          onChange={e => applyDates(e.target.value ? new Date(e.target.value).toISOString() : undefined, dateTo || undefined)}
          className="px-2 py-0.5 border border-[#27453A] bg-[#07100D] text-[#D8E5DC] rounded-xs text-[11px]"
        />
        <span className="text-[#6F887A]">→</span>
        <input
          type="datetime-local"
          value={dateTo ? toLocalInput(dateTo) : ''}
          onChange={e => applyDates(dateFrom || undefined, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          className="px-2 py-0.5 border border-[#27453A] bg-[#07100D] text-[#D8E5DC] rounded-xs text-[11px]"
        />
        <div className="flex gap-1">
          {[24, 24 * 7, 24 * 30].map(h => (
            <button
              key={h}
              onClick={() => applyPreset(h)}
              className="px-2 py-0.5 rounded-xs border border-[#27453A] bg-[#07100D] hover:border-[#FFB84D] text-[#6F887A] hover:text-[#D8E5DC] text-[10px]"
            >
              {h === 24 ? '24H' : h === 24 * 7 ? '7D' : '30D'}
            </button>
          ))}
          <button
            onClick={() => applyPreset(null)}
            className="px-2 py-0.5 rounded-xs border border-[#27453A] bg-[#07100D] hover:border-[#FFB84D] text-[#6F887A] hover:text-[#D8E5DC] text-[10px]"
          >
            ALL
          </button>
        </div>
        <span className="text-[10px] text-[#6F887A] ml-auto">
          {dateFrom ? (
            `${new Date(dateFrom).toLocaleDateString()} – ${dateTo ? new Date(dateTo).toLocaleDateString() : 'PRESENT'}`
          ) : (
            range.min ? `DATA SPANS: ${new Date(range.min).toLocaleDateString()} – ${new Date(range.max!).toLocaleDateString()}` : 'NO TIMESTAMPED EDGES'
          )}
        </span>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 bg-[#07100D] border border-[#27453A] rounded-sm overflow-hidden relative min-w-0">
          {isLoading && (
            <div className="absolute inset-0 bg-[#07100D]/80 flex items-center justify-center z-10 text-xs text-[#FFB84D]">
              [ COMPILING GRAPH TOPOLOGY... ]
            </div>
          )}
          <div ref={cyRef} className="w-full h-full" />
          
          {graphData && (
            <div className="absolute bottom-3 left-3 bg-[#0B1713]/95 border border-[#27453A] rounded-xs px-3 py-1.5 text-[11px] text-[#D8E5DC] shadow-lg">
              <span className="text-[#6F887A]">ENTITIES:</span> <span className="text-[#9FE3B1] font-bold">{graphData.total_nodes}</span> |{' '}
              <span className="text-[#6F887A]">VECTORS:</span> <span className="text-[#FFB84D] font-bold">{graphData.total_edges}</span>
              {graphData.truncated && <span className="text-[#E05A52] ml-2">[TRUNCATED]</span>}
            </div>
          )}

          {/* Terminal Legend */}
          <div className="absolute top-3 right-3 bg-[#0B1713]/95 border border-[#27453A] rounded-xs p-3 text-[10px] text-[#D8E5DC] space-y-1.5 shadow-xl max-w-xs">
            <div className="font-bold text-[#FFB84D] border-b border-[#27453A] pb-1 tracking-wider uppercase">
              TOPOLOGY KEY
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[#6F887A]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#9FE3B1] bg-[#07100D]"></span> Person / Alias</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#FFB84D] bg-[#07100D]"></span> Device</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#2DD4BF] bg-[#07100D]"></span> Phone / SIM</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#E05A52] bg-[#07100D]"></span> Location</div>
            </div>
            <div className="border-t border-[#27453A] pt-1.5 space-y-1">
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#27453A] inline-block"></span> Observed (Direct)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#FFB84D] inline-block border-b border-dashed"></span> Inferred (Synthesized)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#E05A52] inline-block border-b border-dotted"></span> Contradicted (Collision)</div>
            </div>
          </div>
        </div>

        {/* Selected Entity / Edge Sidecar */}
        {(selectedNode || selectedEdge) && (
          <div className="w-96 bg-[#0B1713] border border-[#27453A] rounded-sm p-4 h-fit sticky top-0 max-h-[calc(100vh-10rem)] overflow-y-auto">
            {selectedNode && (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between border-b border-[#27453A] pb-2">
                  <div>
                    <span className="text-[10px] text-[#6F887A]">INSPECTED NODE</span>
                    <h3 className="font-bold text-sm text-[#FFB84D] truncate">{selectedNode.label}</h3>
                  </div>
                  <button
                    onClick={() => { setSelectedNode(null); setNodeDetail(null); }}
                    className="text-[#6F887A] hover:text-[#D8E5DC] text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 text-[#6F887A] text-xs">
                  <div><span className="text-[#D8E5DC]">TYPE:</span> {selectedNode.entity_type}</div>
                  <div><span className="text-[#D8E5DC]">STATE:</span> <StatusBadge status={selectedNode.review_state || 'new'} /></div>
                </div>

                {nodeDetail && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[11px] text-[#D8E5DC]">
                        NEIGHBORHOOD ({nodeDetail.edges?.length || 0})
                      </span>
                      <button
                        onClick={() => navigate(`/cases/${caseId}/timeline`)}
                        className="text-[10px] text-[#FFB84D] hover:underline"
                      >
                        TIMELINE →
                      </button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {nodeDetail.edges && nodeDetail.edges.length > 0 ? (
                        nodeDetail.edges.slice(0, 20).map((e: any, i: number) => (
                          <div key={i} className="text-[11px] bg-[#07100D] border border-[#27453A] p-2 rounded-xs flex items-center justify-between">
                            <span className="truncate text-[#D8E5DC]">{e.relationship_type || e.label || 'connected'}</span>
                            <span className={`ml-2 shrink-0 text-[10px] ${e.classification === 'inferred' ? 'text-[#FFB84D]' : 'text-[#6F887A]'}`}>
                              {e.classification || 'observed'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#6F887A]">NO IMMEDIATE NEIGHBORS</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between border-b border-[#27453A] pb-2">
                  <div>
                    <span className="text-[10px] text-[#6F887A]">RELATIONSHIP VECTOR</span>
                    <h3 className="font-bold text-sm text-[#FFB84D]">
                      {selectedEdge.relationship_type || selectedEdge.label}
                    </h3>
                  </div>
                  <button
                    onClick={() => { setSelectedEdge(null); setEdgeDetail(null); }}
                    className="text-[#6F887A] hover:text-[#D8E5DC] text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-[#6F887A]">
                  <div><span className="text-[#D8E5DC]">CLASSIFICATION:</span> {selectedEdge.classification || 'observed'}</div>
                  {selectedEdge.evidence_count ? (
                    <div><span className="text-[#D8E5DC]">SUPPORTING EVIDENCE:</span> {selectedEdge.evidence_count}</div>
                  ) : null}
                  {selectedEdge.contradicted && (
                    <div className="text-[#E05A52] bg-[#E05A52]/10 border border-[#E05A52]/30 p-1.5 rounded-xs">
                      [ INVALIDATED BY CONFLICTING EVIDENCE ]
                    </div>
                  )}
                </div>

                {edgeDetail?.evidence?.length > 0 && (
                  <div className="pt-2">
                    <span className="font-bold text-[11px] text-[#D8E5DC] block mb-1.5">
                      RAW FORENSIC PROVENANCE ({edgeDetail.evidence.length})
                    </span>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {edgeDetail.evidence.slice(0, 15).map((ev: any, i: number) => (
                        <div key={i} className="text-[10px] bg-[#07100D] border border-[#27453A] rounded-xs p-2">
                          <div className="text-[#FFB84D] mb-1">
                            RECORD #{ev.source_record_id?.slice(0, 10)} (WT: {ev.weight})
                          </div>
                          <pre className="text-[#6F887A] whitespace-pre-wrap font-mono text-[9px] break-words max-h-32 overflow-auto">
                            {prettyJson(ev.record_data)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-[#27453A] pt-3">
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                  setNodeDetail(null);
                  setEdgeDetail(null);
                  cyInstance.current?.elements().unselect();
                }}
                className="w-full text-left text-[10px] text-[#6F887A] hover:text-[#D8E5DC]"
              >
                [ ESC ] CLEAR ACTIVE SELECTION
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function prettyJson(v: any): string {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  try { return JSON.stringify(v, null, 1); } catch { return String(v); }
}