import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import {
  WorkspaceHeader,
  TerminalPanel,
  TerminalButton,
  StatusBadge,
} from '../components/TerminalComponents';

export default function CaseList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newCase, setNewCase] = useState({ title: '', case_code: '', description: '' });

  const { data: cases, isLoading } = useQuery({
    queryKey: ['cases', search],
    queryFn: () => api.getCases(search || undefined),
  });

  const createMutation = useMutation({
    mutationFn: api.createCase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cases'] });
      setShowCreate(false);
      setNewCase({ title: '', case_code: '', description: '' });
    },
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#D8E5DC]">
      <WorkspaceHeader
        code="REGISTRY // 00"
        title="OPERATIONAL CASE REGISTRY"
        description="Active criminal network investigations and synthetic intelligence environments."
      >
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="FILTER BY CODE OR TITLE..."
            className="px-3 py-1.5 bg-[#0F1D18] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none w-64 placeholder-[#3C6653]"
          />
          <TerminalButton
            variant="primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? '[ CANCEL ]' : '+ NEW CASE DOSSIER'}
          </TerminalButton>
        </div>
      </WorkspaceHeader>

      {showCreate && (
        <TerminalPanel title="PROVISION NEW INVESTIGATION DOSSIER" variant="raised">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                CASE TITLE
              </label>
              <input
                placeholder="e.g. Operation Nightshade - Smuggling Network"
                value={newCase.title}
                onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                CASE CODE IDENTIFIER
              </label>
              <input
                placeholder="e.g. MH-26189-042"
                value={newCase.case_code}
                onChange={e => setNewCase({ ...newCase, case_code: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-[#6F887A] uppercase tracking-wider mb-1">
                INVESTIGATION SCOPE / OBJECTIVES
              </label>
              <textarea
                placeholder="Brief summary of target criminal network or mandate..."
                value={newCase.description}
                onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#0B1713] border border-[#27453A] rounded-sm text-xs text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none"
                rows={2}
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <TerminalButton
              variant="primary"
              onClick={() => createMutation.mutate(newCase)}
              disabled={!newCase.title || !newCase.case_code || createMutation.isPending}
            >
              {createMutation.isPending ? 'PROVISIONING...' : '[ INITIALIZE CASE ]'}
            </TerminalButton>
            <TerminalButton onClick={() => setShowCreate(false)}>
              ABORT
            </TerminalButton>
          </div>
        </TerminalPanel>
      )}

      {isLoading ? (
        <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
          FETCHING CLASSIFIED CASE INVENTORIES...
        </div>
      ) : cases && cases.length > 0 ? (
        <div className="grid gap-3">
          {cases.map((c: any) => (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="border border-[#27453A] bg-[#0B1713] hover:border-[#FFB84D] hover:bg-[#0F1D18] rounded-sm p-4 cursor-pointer transition-colors group relative"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#D8E5DC] group-hover:text-[#FFB84D] transition-colors">
                      {c.title}
                    </span>
                    {c.is_synthetic && (
                      <span className="text-[10px] px-1.5 py-0.2 border border-[#FFB84D] text-[#FFB84D] uppercase bg-[#FFB84D]/10">
                        [ SYNTHETIC DEMO ]
                      </span>
                    )}
                    <StatusBadge status={c.status} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#6F887A]">
                    <span className="text-[#FFD27A]">{c.case_code}</span>
                    <span>//</span>
                    <span className="truncate max-w-md">{c.description || 'No description provided.'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t md:border-t-0 border-[#27453A] pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-[#9FE3B1]">{c.entity_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#6F887A]">ENTITIES</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#D8E5DC]">{c.evidence_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#6F887A]">EVIDENCE</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#FFB84D]">{c.hypothesis_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#6F887A]">HYPOTHESES</div>
                  </div>
                  <div className="pl-3 text-[#6F887A] group-hover:text-[#FFB84D] text-sm">
                    ▶
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[#27453A] bg-[#0B1713] rounded-sm text-[#6F887A] text-xs">
          NO CASE DOSSIERS FOUND MATCHING QUERY.
        </div>
      )}
    </div>
  );
}
