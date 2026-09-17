import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [caseId, setCaseId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('spydee_user');
    if (stored) setUser(JSON.parse(stored));
    const parts = location.pathname.split('/');
    const ci = parts.indexOf('cases');
    if (ci >= 0 && parts[ci + 1]) setCaseId(parts[ci + 1]);
    else setCaseId(null);
  }, [location.pathname]);

  const { data: caseData } = useQuery({
    queryKey: ['case', caseId],
    queryFn: () => api.getCase(caseId!),
    enabled: !!caseId,
  });

  const handleLogout = () => {
    localStorage.removeItem('spydee_token');
    localStorage.removeItem('spydee_user');
    navigate('/login');
  };

  const navSections = caseId ? [
    {
      heading: 'CASE CONTROL',
      items: [
        { label: 'OVERVIEW', path: `/cases/${caseId}` },
        { label: 'EVIDENCE', path: `/cases/${caseId}/evidence` },
        { label: 'ENTITIES', path: `/cases/${caseId}/entities` },
        { label: 'GRAPH', path: `/cases/${caseId}/graph` },
        { label: 'MAP', path: `/cases/${caseId}/map` },
        { label: 'TIMELINE', path: `/cases/${caseId}/timeline` },
      ],
    },
    {
      heading: 'INTELLIGENCE',
      items: [
        { label: 'WORKBENCH', path: `/cases/${caseId}/workbench` },
        { label: 'HYPOTHESES', path: `/cases/${caseId}/hypotheses` },
        { label: 'CONTRADICTIONS', path: `/cases/${caseId}/contradictions` },
        { label: 'LEADS / GAPS / ACTIONS', path: `/cases/${caseId}/leads` },
      ],
    },
    {
      heading: 'PARTNER TOOLS',
      items: [
        { label: 'COPILOT', path: `/cases/${caseId}/copilot` },
      ],
    },
    {
      heading: 'OUTPUT',
      items: [
        { label: 'REPORTS & AUDIT', path: `/cases/${caseId}/reports` },
      ],
    },
  ] : [];

  const caseNav = (navSections || []).flatMap(s => s.items);
  const currentSection = caseNav.find(n => location.pathname === n.path)?.label || '';

  return (
    <div className="flex h-screen bg-[#07100D] text-[#D8E5DC] font-mono overflow-hidden">
      {/* Sidebar Command Console */}
      <aside className="w-64 bg-[#0B1713] text-[#D8E5DC] flex flex-col flex-shrink-0 border-r border-[#27453A]">
        {/* Terminal Brand Header */}
        <div className="p-4 border-b border-[#27453A] flex items-center justify-between">
          <div
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <div className="w-6 h-6 border border-[#FFB84D] flex items-center justify-center text-[#FFB84D] text-xs font-bold bg-[#0F1D18]">
              ◈
            </div>
            <div>
              <div className="font-bold text-sm text-[#D8E5DC] tracking-widest flex items-center gap-1.5">
                <span>SPYDEE</span>
                <span className="text-[10px] text-[#FFB84D] font-normal">// INTEL</span>
              </div>
              <div className="text-[9px] text-[#6F887A] tracking-wider uppercase">Terminal v2.6.4</div>
            </div>
          </div>
          <span className="w-2 h-2 rounded-full bg-[#9FE3B1] animate-pulse" title="System Ready" />
        </div>

        {/* Command Navigation */}
        <nav className="flex-1 p-3 space-y-3 overflow-y-auto text-xs">
          <div>
            <button
              onClick={() => navigate('/cases')}
              className={`w-full text-left px-3 py-1.5 font-mono text-xs uppercase tracking-wider rounded-sm transition-colors flex items-center justify-between ${
                !caseId
                  ? 'border-l-2 border-[#FFB84D] bg-[#0F1D18] text-[#FFB84D]'
                  : 'text-[#6F887A] hover:bg-[#0F1D18] hover:text-[#D8E5DC]'
              }`}
            >
              <span>{!caseId ? '▶' : '>'} CASE REGISTRY</span>
              <span className="text-[10px] opacity-70">[ALL]</span>
            </button>
          </div>

          {caseId && (
            <div className="px-3 py-2 bg-[#0F1D18] border border-[#27453A] rounded-sm text-[10px] space-y-1">
              <div className="text-[#6F887A] uppercase tracking-wider text-[9px]">ACTIVE CASE CONTEXT</div>
              <div className="text-[#FFB84D] font-medium truncate">{caseData?.case_code || caseId}</div>
              <div className="text-[#D8E5DC] text-[10px] truncate">{caseData?.title}</div>
            </div>
          )}

          {navSections.map(section => (
            <div key={section.heading} className="space-y-0.5">
              <div className="px-3 py-1 text-[10px] uppercase tracking-widest text-[#6F887A] font-medium">
                {section.heading}
              </div>
              {section.items.map(item => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-3 py-1.5 rounded-sm font-mono text-xs uppercase tracking-wider transition-colors flex items-center gap-2 ${
                      isActive
                        ? 'border-l-2 border-[#FFB84D] bg-[#0F1D18] text-[#FFB84D] font-medium'
                        : 'text-[#6F887A] hover:bg-[#0F1D18] hover:text-[#D8E5DC]'
                    }`}
                  >
                    <span className="text-[10px]">{isActive ? '▶' : '>'}</span>
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Terminal Operator Status Panel */}
        <div className="p-3 border-t border-[#27453A] bg-[#0B1713] text-[10px] space-y-2">
          <div className="grid grid-cols-2 gap-2 text-[9px] border border-[#27453A] p-2 bg-[#0F1D18] rounded-sm">
            <div>
              <div className="text-[#6F887A]">OPERATOR</div>
              <div className="text-[#D8E5DC] font-medium truncate">{user?.display_name || user?.username || 'INVESTIGATOR'}</div>
            </div>
            <div>
              <div className="text-[#6F887A]">ROLE</div>
              <div className="text-[#9FE3B1] uppercase font-medium truncate">{user?.role || 'LEVEL-3'}</div>
            </div>
            <div>
              <div className="text-[#6F887A]">MODE</div>
              <div className="text-[#FFB84D] uppercase">SYNTHETIC</div>
            </div>
            <div>
              <div className="text-[#6F887A]">SYSTEM</div>
              <div className="text-[#9FE3B1] uppercase">READY</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-center px-3 py-1 border border-[#E05A52]/50 text-[#E05A52] hover:bg-[#E05A52]/10 rounded-sm text-[11px] uppercase tracking-wider transition-colors"
          >
            [ SIGN OUT TERMINAL ]
          </button>
        </div>
      </aside>

      {/* Main Terminal Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#07100D]">
        {/* Top Intelligence Header */}
        <header className="bg-[#0B1713] border-b border-[#27453A] px-6 py-2.5 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[#FFB84D] font-bold text-xs uppercase tracking-wider">
                SPYDEE // INTELLIGENCE TERMINAL
              </span>
              <span className="text-[#27453A]">|</span>
            </div>
            {caseData ? (
              <div className="flex items-center gap-2 truncate text-xs">
                <span className="text-[#D8E5DC] font-medium truncate">{caseData.title}</span>
                <span className="text-[#6F887A] text-[11px]">
                  ({caseData.case_code})
                </span>
                {currentSection && (
                  <>
                    <span className="text-[#27453A]">»</span>
                    <span className="text-[#FFB84D] text-[11px] font-medium">{currentSection}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="text-xs text-[#6F887A] uppercase">
                {location.pathname === '/cases' ? 'CASE REGISTRY INDEX' : 'SYSTEM OPERATIONAL'}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] font-mono flex-shrink-0">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-[#9FE3B1]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9FE3B1]" />
              API CONNECTED
            </span>
            <span className="hidden md:inline-flex items-center gap-1.5 text-[#628C73]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#628C73]" />
              DATA INDEX READY
            </span>
            <span className="px-2 py-0.5 border border-[#3C6653] text-[#6F887A] rounded-sm font-medium uppercase">
              PROTOTYPE
            </span>
            <span className="px-2 py-0.5 border border-[#FFB84D] text-[#FFB84D] rounded-sm font-medium uppercase bg-[#FFB84D]/5">
              SYNTHETIC DATA
            </span>
          </div>
        </header>

        {/* Content Viewport */}
        <div className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}