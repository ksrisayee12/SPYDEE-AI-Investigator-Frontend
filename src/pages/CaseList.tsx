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
import { Search, Plus } from 'lucide-react';

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
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-[#FFBA42]">
      <WorkspaceHeader
        code="REGISTRY // 00"
        title="OPERATIONAL CASE REGISTRY"
        description="Active criminal network investigations and intelligence dossier repository."
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A6732E]" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="FILTER BY CODE OR TITLE..."
              className="pl-8 pr-3 py-1.5 bg-[#0D0B08] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none w-64 placeholder-[#7A521D]"
            />
          </div>
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
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                CASE TITLE
              </label>
              <input
                placeholder="e.g. Operation Nightshade - Smuggling Network"
                value={newCase.title}
                onChange={e => setNewCase({ ...newCase, title: e.target.value })}
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
              />
            </div>
            <div>
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                CASE CODE IDENTIFIER
              </label>
              <input
                placeholder="e.g. MH-26189-042"
                value={newCase.case_code}
                onChange={e => setNewCase({ ...newCase, case_code: e.target.value })}
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] text-[#A6732E] uppercase tracking-wider mb-1">
                INVESTIGATION SCOPE / OBJECTIVES
              </label>
              <textarea
                placeholder="Brief summary of target criminal network or mandate..."
                value={newCase.description}
                onChange={e => setNewCase({ ...newCase, description: e.target.value })}
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-xs text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
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
        <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs">
          FETCHING CLASSIFIED CASE INVENTORIES FROM DATABASE...
        </div>
      ) : cases && cases.length > 0 ? (
        <div className="grid gap-3">
          {cases.map((c: any) => (
            <div
              key={c.id}
              onClick={() => navigate(`/cases/${c.id}`)}
              className="border border-[#3D2A12] bg-[#0D0B08] hover:border-[#FF9E1B] hover:bg-[#14110C] rounded-xs p-4 cursor-pointer transition-colors group relative"
            >
              <span className="absolute -top-[1px] -left-[1px] w-1.5 h-1.5 border-t-2 border-l-2 border-[#FF9E1B] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />
              <span className="absolute -top-[1px] -right-[1px] w-1.5 h-1.5 border-t-2 border-r-2 border-[#FF9E1B] opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity" />

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-[#FFBA42] group-hover:text-[#FFE7B8] transition-colors">
                      {c.title}
                    </span>
                    <StatusBadge status={c.status || 'ACTIVE'} />
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#A6732E]">
                    <span className="text-[#FF9E1B] font-semibold">{c.case_code}</span>
                    <span>//</span>
                    <span className="truncate max-w-md">{c.description || 'No description provided.'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t md:border-t-0 border-[#3D2A12] pt-3 md:pt-0">
                  <div className="text-right">
                    <div className="text-base font-bold text-[#34D399]">{c.entity_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#A6732E]">ENTITIES</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#FFBA42]">{c.evidence_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#A6732E]">EVIDENCE</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-bold text-[#FF9E1B]">{c.hypothesis_count || 0}</div>
                    <div className="text-[9px] uppercase tracking-wider text-[#A6732E]">HYPOTHESES</div>
                  </div>
                  <div className="pl-3 text-[#A6732E] group-hover:text-[#FF9E1B] text-sm">
                    ▶
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border border-[#3D2A12] bg-[#0D0B08] rounded-xs text-[#A6732E] text-xs space-y-2">
          <div>NO CASE DOSSIERS FOUND MATCHING QUERY.</div>
          <div className="text-[10px] text-[#7A521D]">Use [ + NEW CASE DOSSIER ] to initialize an investigation.</div>
        </div>
      )}
    </div>
  );
}
