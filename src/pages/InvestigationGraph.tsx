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
  person: '#FF9E1B',
  alias: '#FFAE3B',
  phone_sim: '#FFBA42',
  device: '#FFE7B8',
  account: '#34D399',
  location: '#EF4444',
  organization: '#C084FC',
  domain_ip: '#A6732E',
  event: '#FBBF24',
  document: '#D97706',
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
    if (hours === null) {
      applyDates(undefined, undefined);
      return;
    }
    const to = new Date();
    const from = new Date(to.getTime() - hours * 3600 * 1000);
    applyDates(from.toISOString(), to.toISOString());
  };

  const runSearch = (term: string) => {
    if (!cyInstance.current) return;
    const cy = cyInstance.current;
    const q = term.trim().toLowerCase();
    if (!q) {
      cy.elements().forEach((ele) => { ele.removeClass('highlighted'); });
      setHighlightIds(new Set());
      return;
    }
    const matches = cy.nodes().filter((n) => {
      const d = n.data();
      return (
        (d.label && d.label.toLowerCase().includes(q)) ||
        (d.id && d.id.toLowerCase().includes(q)) ||
        (d.entity_type && d.entity_type.toLowerCase().includes(q))
      );
    });
    cy.elements().forEach((ele) => { ele.removeClass('highlighted'); });
    const ids = new Set<string>();
    matches.forEach((m) => {
      m.addClass('highlighted');
      ids.add(m.id());
    });
    setHighlightIds(ids);
    if (matches.length > 0) {
      cy.fit(matches, 80);
    }
  };

  useEffect(() => {
    if (!cyRef.current) return;
    cyInstance.current = cytoscape({
      container: cyRef.current,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'font-family': 'IBM Plex Mono, monospace',
            'font-size': '10px',
            color: '#FFBA42',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-wrap': 'ellipsis',
            'text-max-width': '120px',
          },
        },
        ...Object.entries(typeColors).map(([type, color]) => ({
          selector: `node.${type}`,
          style: { 'background-color': '#14110C', 'border-color': color, 'border-width': 2 },
        })),
        {
          selector: 'edge.observed',
          style: {
            'line-color': '#66451B',
            width: 1.5,
            'target-arrow-color': '#66451B',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge.inferred',
          style: {
            'line-color': '#FF9E1B',
            width: 1.5,
            'line-style': 'dashed',
            'target-arrow-color': '#FF9E1B',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        {
          selector: 'edge.contradicted',
          style: {
            'line-color': '#EF4444',
            'line-style': 'dotted',
            'target-arrow-color': '#EF4444',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
          },
        },
        { selector: 'edge.strong', style: { width: 3.5, 'line-color': '#A6732E' } },
        { selector: 'edge.moderate', style: { width: 2.2 } },
        { selector: 'node.highlighted', style: { 'border-width': 4, 'border-color': '#FF9E1B' } },
        { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#FFAE3B' } },
        { selector: 'edge:selected', style: { 'line-color': '#FF9E1B', width: 3 } },
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
      try {
        const ev = await api.getRelEvidence(caseId!, edge.data('id'));
        setEdgeDetail(ev);
      } catch {
        setEdgeDetail({ evidence: [] });
      }
    };
    cy.on('tap', 'node', onNodeTap);
    cy.on('tap', 'edge', onEdgeTap);
    return () => {
      cy.off('tap', 'node', onNodeTap);
      cy.off('tap', 'edge', onEdgeTap);
    };
  }, [caseId]);

  const typeOptions = Object.keys(typeColors);
  const range = edgeRange();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNode(null);
        setSelectedEdge(null);
        setNodeDetail(null);
        setEdgeDetail(null);
        cyInstance.current?.elements().unselect();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col min-w-0 font-mono text-[#FFBA42]">
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
              className="px-3 py-1 bg-[#0D0B08] border border-[#3D2A12] text-xs text-[#FFE7B8] placeholder-[#7A521D] rounded-xs w-56 focus:border-[#FF9E1B] outline-none"
            />
          </div>
          <select
            onChange={e => setFilters({ ...filters, entity_types: e.target.value ? [e.target.value] : undefined })}
            className="px-2 py-1 bg-[#0D0B08] border border-[#3D2A12] text-xs text-[#FFBA42] rounded-xs"
          >
            <option value="">ALL ENTITY TYPES</option>
            {typeOptions.map(t => <option key={t} value={t}>{t.toUpperCase().replace('_', '/')}</option>)}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-[#FFBA42] cursor-pointer">
            <input
              type="checkbox"
              checked={filters.include_inferred}
              onChange={e => setFilters({ ...filters, include_inferred: e.target.checked })}
              className="accent-[#FF9E1B]"
            />
            INFERRED
          </label>
          <TerminalButton variant="secondary" onClick={() => refetch()}>
            REFRESH
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {/* Temporal Scoping Bar */}
      <div className="flex flex-wrap items-center gap-3 px-3 py-1.5 bg-[#0D0B08] border border-[#3D2A12] rounded-xs my-2 text-xs">
        <span className="font-bold text-[#A6732E] text-[10px] uppercase tracking-wider">TEMPORAL WINDOW:</span>
        <input
          type="datetime-local"
          value={dateFrom ? toLocalInput(dateFrom) : ''}
          onChange={e => applyDates(e.target.value ? new Date(e.target.value).toISOString() : undefined, dateTo || undefined)}
          className="px-2 py-0.5 border border-[#3D2A12] bg-[#14110C] text-[#FFE7B8] rounded-xs text-[11px]"
        />
        <span className="text-[#A6732E]">→</span>
        <input
          type="datetime-local"
          value={dateTo ? toLocalInput(dateTo) : ''}
          onChange={e => applyDates(dateFrom || undefined, e.target.value ? new Date(e.target.value).toISOString() : undefined)}
          className="px-2 py-0.5 border border-[#3D2A12] bg-[#14110C] text-[#FFE7B8] rounded-xs text-[11px]"
        />
        <div className="flex gap-1">
          {[24, 24 * 7, 24 * 30].map(h => (
            <button
              key={h}
              onClick={() => applyPreset(h)}
              className="px-2 py-0.5 rounded-xs border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] text-[#A6732E] hover:text-[#FFBA42] text-[10px]"
            >
              {h === 24 ? '24H' : h === 24 * 7 ? '7D' : '30D'}
            </button>
          ))}
          <button
            onClick={() => applyPreset(null)}
            className="px-2 py-0.5 rounded-xs border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] text-[#A6732E] hover:text-[#FFBA42] text-[10px]"
          >
            ALL
          </button>
        </div>
        <span className="text-[10px] text-[#A6732E] ml-auto">
          {dateFrom ? (
            `${new Date(dateFrom).toLocaleDateString()} – ${dateTo ? new Date(dateTo).toLocaleDateString() : 'PRESENT'}`
          ) : (
            range.min ? `DATA SPANS: ${new Date(range.min).toLocaleDateString()} – ${new Date(range.max!).toLocaleDateString()}` : 'NO TIMESTAMPED EDGES'
          )}
        </span>
      </div>

      <div className="flex-1 flex gap-3 min-h-0">
        <div className="flex-1 bg-[#080705] border border-[#3D2A12] rounded-xs overflow-hidden relative min-w-0">
          {isLoading && (
            <div className="absolute inset-0 bg-[#080705]/80 flex items-center justify-center z-10 text-xs text-[#FF9E1B]">
              [ COMPILING GRAPH TOPOLOGY... ]
            </div>
          )}
          <div ref={cyRef} className="w-full h-full" />
          
          {graphData && (
            <div className="absolute bottom-3 left-3 bg-[#0D0B08]/95 border border-[#3D2A12] rounded-xs px-3 py-1.5 text-[11px] text-[#FFE7B8] shadow-lg">
              <span className="text-[#A6732E]">ENTITIES:</span> <span className="text-[#34D399] font-bold">{graphData.total_nodes}</span> |{' '}
              <span className="text-[#A6732E]">VECTORS:</span> <span className="text-[#FF9E1B] font-bold">{graphData.total_edges}</span>
              {graphData.truncated && <span className="text-[#EF4444] ml-2">[TRUNCATED]</span>}
            </div>
          )}

          {/* Terminal Legend */}
          <div className="absolute top-3 right-3 bg-[#0D0B08]/95 border border-[#3D2A12] rounded-xs p-3 text-[10px] text-[#FFBA42] space-y-1.5 shadow-xl max-w-xs">
            <div className="font-bold text-[#FF9E1B] border-b border-[#3D2A12] pb-1 tracking-wider uppercase">
              TOPOLOGY KEY
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[#A6732E]">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#FF9E1B] bg-[#080705]"></span> Person / Alias</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#FFE7B8] bg-[#080705]"></span> Device</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#FFBA42] bg-[#080705]"></span> Phone / SIM</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full border border-[#EF4444] bg-[#080705]"></span> Location</div>
            </div>
            <div className="border-t border-[#3D2A12] pt-1.5 space-y-1">
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#66451B] inline-block"></span> Observed (Direct)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#FF9E1B] inline-block border-b border-dashed"></span> Inferred (Synthesized)</div>
              <div className="flex items-center gap-2"><span className="w-4 h-0.5 bg-[#EF4444] inline-block border-b border-dotted"></span> Contradicted (Collision)</div>
            </div>
          </div>
        </div>

        {/* Selected Entity / Edge Sidecar */}
        {(selectedNode || selectedEdge) && (
          <div className="w-96 bg-[#0D0B08] border border-[#3D2A12] rounded-xs p-4 h-fit sticky top-0 max-h-[calc(100vh-10rem)] overflow-y-auto">
            {selectedNode && (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between border-b border-[#3D2A12] pb-2">
                  <div>
                    <span className="text-[10px] text-[#A6732E]">INSPECTED NODE</span>
                    <h3 className="font-bold text-sm text-[#FF9E1B] truncate">{selectedNode.label}</h3>
                  </div>
                  <button
                    onClick={() => { setSelectedNode(null); setNodeDetail(null); }}
                    className="text-[#A6732E] hover:text-[#FFE7B8] text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 text-[#A6732E] text-xs">
                  <div><span className="text-[#FFE7B8]">TYPE:</span> {selectedNode.entity_type}</div>
                  <div><span className="text-[#FFE7B8]">STATE:</span> <StatusBadge status={selectedNode.review_state || 'new'} /></div>
                </div>

                {nodeDetail && (
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-[11px] text-[#FFE7B8]">
                        NEIGHBORHOOD ({nodeDetail.edges?.length || 0})
                      </span>
                      <button
                        onClick={() => navigate(`/cases/${caseId}/timeline`)}
                        className="text-[10px] text-[#FF9E1B] hover:underline"
                      >
                        TIMELINE →
                      </button>
                    </div>
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {nodeDetail.edges && nodeDetail.edges.length > 0 ? (
                        nodeDetail.edges.slice(0, 20).map((e: any, i: number) => (
                          <div key={i} className="text-[11px] bg-[#14110C] border border-[#3D2A12] p-2 rounded-xs flex items-center justify-between">
                            <span className="truncate text-[#FFE7B8]">{e.relationship_type || e.label || 'connected'}</span>
                            <span className={`ml-2 shrink-0 text-[10px] ${e.classification === 'inferred' ? 'text-[#FF9E1B]' : 'text-[#A6732E]'}`}>
                              {e.classification || 'observed'}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-[10px] text-[#A6732E]">NO IMMEDIATE NEIGHBORS</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedEdge && (
              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between border-b border-[#3D2A12] pb-2">
                  <div>
                    <span className="text-[10px] text-[#A6732E]">RELATIONSHIP VECTOR</span>
                    <h3 className="font-bold text-sm text-[#FF9E1B]">
                      {selectedEdge.relationship_type || selectedEdge.label}
                    </h3>
                  </div>
                  <button
                    onClick={() => { setSelectedEdge(null); setEdgeDetail(null); }}
                    className="text-[#A6732E] hover:text-[#FFE7B8] text-xs px-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-[#A6732E]">
                  <div><span className="text-[#FFE7B8]">CLASSIFICATION:</span> {selectedEdge.classification || 'observed'}</div>
                  {selectedEdge.evidence_count ? (
                    <div><span className="text-[#FFE7B8]">SUPPORTING EVIDENCE:</span> {selectedEdge.evidence_count}</div>
                  ) : null}
                  {selectedEdge.contradicted && (
                    <div className="text-[#EF4444] bg-[#EF4444]/10 border border-[#EF4444]/30 p-1.5 rounded-xs">
                      [ INVALIDATED BY CONFLICTING EVIDENCE ]
                    </div>
                  )}
                </div>

                {edgeDetail?.evidence?.length > 0 && (
                  <div className="pt-2">
                    <span className="font-bold text-[11px] text-[#FFE7B8] block mb-1.5">
                      RAW FORENSIC PROVENANCE ({edgeDetail.evidence.length})
                    </span>
                    <div className="space-y-2 max-h-72 overflow-y-auto">
                      {edgeDetail.evidence.slice(0, 15).map((ev: any, i: number) => (
                        <div key={i} className="text-[10px] bg-[#14110C] border border-[#3D2A12] rounded-xs p-2">
                          <div className="text-[#FF9E1B] mb-1">
                            RECORD #{ev.source_record_id?.slice(0, 10)} (WT: {ev.weight})
                          </div>
                          <pre className="text-[#A6732E] whitespace-pre-wrap font-mono text-[9px] break-words max-h-32 overflow-auto">
                            {prettyJson(ev.record_data)}
                          </pre>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-[#3D2A12] pt-3">
              <button
                onClick={() => {
                  setSelectedNode(null);
                  setSelectedEdge(null);
                  setNodeDetail(null);
                  setEdgeDetail(null);
                  cyInstance.current?.elements().unselect();
                }}
                className="w-full text-left text-[10px] text-[#A6732E] hover:text-[#FFBA42]"
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
