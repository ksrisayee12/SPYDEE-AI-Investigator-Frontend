import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  Folder,
  HardDrive,
  Users,
  Share2,
  Map as MapIcon,
  Clock,
  Brain,
  AlertTriangle,
  Lightbulb,
  Crosshair,
  Terminal,
  FileText,
  LogOut,
} from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [caseId, setCaseId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState('');

  // Clock ticker for top bar: TUE 16 SEP 2026 07:42:11
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      const hours = String(now.getHours()).padStart(2, '0');
      const mins = String(now.getMinutes()).padStart(2, '0');
      const secs = String(now.getSeconds()).padStart(2, '0');
      setCurrentTime(`${dayName} ${day} ${month} ${year}  ${hours}:${mins}:${secs}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
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
      heading: '// CASE CONSOLE',
      items: [
        { label: 'CASE OVERVIEW', path: `/cases/${caseId}`, icon: Folder },
        { label: 'EVIDENCE & SITE', path: `/cases/${caseId}/evidence`, icon: HardDrive },
        { label: 'ENTITIES', path: `/cases/${caseId}/entities`, icon: Users },
        { label: 'GRAPH', path: `/cases/${caseId}/graph`, icon: Share2 },
        { label: 'MAP', path: `/cases/${caseId}/map`, icon: MapIcon },
        { label: 'TIMELINE', path: `/cases/${caseId}/timeline`, icon: Clock },
      ],
    },
    {
      heading: '// INTELLIGENCE',
      items: [
        { label: 'WORKBENCH', path: `/cases/${caseId}/workbench`, icon: Brain },
        { label: 'CONTRADICTIONS', path: `/cases/${caseId}/contradictions`, icon: AlertTriangle },
        { label: 'HYPOTHESES & LEADS', path: `/cases/${caseId}/hypotheses`, icon: Lightbulb },
        { label: 'LEADS, GAPS & ACTIONS', path: `/cases/${caseId}/leads`, icon: Crosshair },
      ],
    },
    {
      heading: '// TOOLS',
      items: [
        { label: 'COPILOT', path: `/cases/${caseId}/copilot`, icon: Terminal },
        { label: 'DOSSIERS & AUDIT', path: `/cases/${caseId}/reports`, icon: FileText },
      ],
    },
  ] : [];

  return (
    <div className="flex flex-col h-screen bg-[#080705] text-[#FFBA42] font-mono overflow-hidden crt-screen">
      {/* ============================================================== */}
      {/* TOP GLOBAL INFORMATION BAR                                    */}
      {/* ============================================================== */}
      <header className="h-14 bg-[#0A0805] border-b border-[#3D2A12] px-4 flex items-center justify-between flex-shrink-0 z-20">
        {/* Left: Brand Identity */}
        <div className="flex items-center">
          <div
            className="flex items-center gap-2.5 cursor-pointer group select-none"
            onClick={() => navigate(caseId ? `/cases/${caseId}` : '/cases')}
          >
            {/* Connected Node Logo */}
            <div className="w-8 h-8 flex items-center justify-center relative">
              <svg viewBox="0 0 32 32" className="w-7 h-7 text-[#FF9E1B]">
                <circle cx="9" cy="20" r="3.5" fill="#FF9E1B" />
                <circle cx="23" cy="11" r="3.5" fill="#FF9E1B" />
                <circle cx="21" cy="23" r="3" fill="#FF9E1B" />
                <line x1="9" y1="20" x2="23" y2="11" stroke="#FF9E1B" strokeWidth="2" />
                <line x1="9" y1="20" x2="21" y2="23" stroke="#FF9E1B" strokeWidth="2" />
              </svg>
            </div>

            <div>
              <div className="font-bold text-lg leading-tight text-[#FF9E1B] tracking-wider">
                SPYDEE
              </div>
              <div className="text-[8px] text-[#A6732E] tracking-widest uppercase">
                UNSEEN LINKS. SAFER TOMORROWS.
              </div>
            </div>
          </div>

          <div className="h-7 w-[1px] bg-[#3D2A12] mx-4 hidden sm:block" />

          {/* Center subtitle */}
          <div className="hidden lg:block leading-tight">
            <div className="text-[11px] font-semibold text-[#FFBA42] tracking-wider uppercase">
              CRIMINAL NETWORK ANALYSIS SYSTEM
            </div>
            <div className="text-[9px] text-[#A6732E] tracking-wide uppercase">
              MINISTRY OF HOME AFFAIRS // INTELLIGENCE & INVESTIGATION
            </div>
          </div>
        </div>

        {/* Right: Telemetry & Terminal Badges */}
        <div className="flex items-center gap-3 text-xs">
          <div className="hidden md:block text-[11px] text-[#FFBA42] tracking-wider font-medium">
            {currentTime || '16 SEP 2026 07:42:11'}
          </div>

          <div className="px-2.5 py-0.5 border border-[#34D399] text-[#34D399] text-[10px] font-bold tracking-wider uppercase bg-[#34D399]/5 green-box-glow">
            [ SECURE TERMINAL ]
          </div>

          <div className="px-2 py-0.5 bg-[#FF9E1B] text-[#080705] text-[10px] font-bold tracking-wider uppercase">
            v1.0.3
          </div>
        </div>
      </header>

      {/* ============================================================== */}
      {/* MAIN CONTAINER (SIDEBAR + WORKSPACE)                          */}
      {/* ============================================================== */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-60 bg-[#0A0805] text-[#FFBA42] flex flex-col flex-shrink-0 border-r border-[#3D2A12] select-none">
          {/* Active Case Context / Quick Switch */}
          <div className="p-3 border-b border-[#3D2A12]">
            <button
              onClick={() => navigate('/cases')}
              className={`w-full text-left px-2.5 py-1.5 rounded-xs text-[11px] tracking-wider uppercase transition-colors flex items-center justify-between ${
                !caseId
                  ? 'bg-[#FF9E1B] text-[#080705] font-bold'
                  : 'text-[#A6732E] hover:bg-[#14110C] hover:text-[#FFBA42]'
              }`}
            >
              <span>{caseId ? 'ALL CASES' : 'CASE REGISTRY'}</span>
              <span className="text-[10px] opacity-80">[SWITCH]</span>
            </button>
            {caseId && (
              <div className="mt-1.5 px-2.5 py-1 bg-[#0D0B08] border border-[#3D2A12] rounded-xs text-[10px]">
                <div className="text-[#A6732E] text-[9px] uppercase tracking-wider">CURRENT CASE</div>
                <div className="text-[#FF9E1B] font-bold truncate">
                  {caseData?.case_code || caseId}
                </div>
              </div>
            )}
          </div>

          {/* Navigation Sections */}
          <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto">
            {navSections.map(section => (
              <div key={section.heading} className="space-y-1">
                <div className="px-2 text-[10px] uppercase tracking-widest text-[#A6732E] font-bold">
                  {section.heading}
                </div>
                <div className="space-y-0.5">
                  {section.items.map(item => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full text-left px-2.5 py-2 rounded-xs text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-between ${
                          isActive
                            ? 'bg-[#FF9E1B] text-[#080705] font-bold shadow-sm'
                            : 'text-[#FFBA42] hover:bg-[#14110C] hover:text-[#FFE7B8]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? 'text-[#080705]' : 'text-[#A6732E]'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        {isActive && (
                          <span className="text-[10px] font-bold text-[#080705] ml-1">▶</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          {/* Bottom Terminal Footer */}
          <div className="p-3 border-t border-[#3D2A12] bg-[#0A0805] text-[10px] space-y-2">
            <div className="leading-tight text-[#A6732E] font-mono">
              <div className="text-[#FF9E1B] font-bold">SPYDEE // v1.0.3</div>
              <div>INTELLIGENCE DIVISION</div>
              <div>CLASSIFIED USE ONLY</div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 px-2 py-1 border border-[#3D2A12] hover:border-[#EF4444] text-[#A6732E] hover:text-[#EF4444] rounded-xs text-[10px] uppercase tracking-wider transition-colors"
            >
              <LogOut className="w-3 h-3" />
              <span>TERMINAL LOGOUT</span>
            </button>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#080705]">
          <div className="flex-1 overflow-auto p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}