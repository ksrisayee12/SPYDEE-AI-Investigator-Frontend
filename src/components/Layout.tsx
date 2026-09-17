import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import {
  LayoutDashboard,
  FileText,
  Users,
  Network,
  MapPin,
  Clock,
  Sparkles,
  GitFork,
  AlertTriangle,
  HelpCircle,
  Compass,
  Cpu,
  Database,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  LogOut,
  FolderOpen
} from 'lucide-react';
import { TerminalAlertProvider } from '../context/TerminalAlertContext';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [caseId, setCaseId] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [timeString, setTimeString] = useState('07:42:11');
  const [dateString, setDateString] = useState('16 SEP 2026');
  const [scanlinesActive, setScanlinesActive] = useState(true);
  const [diskBlink, setDiskBlink] = useState(true);
  const [netBlink, setNetBlink] = useState(true);

  // Live updating clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const month = months[now.getMonth()];
      const year = now.getFullYear();
      setDateString(`${day} ${month} ${year}`);

      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      setTimeString(`${hours}:${minutes}:${seconds}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Telemetry LED blinks
  useEffect(() => {
    const diskInterval = setInterval(() => {
      setDiskBlink(prev => !prev);
    }, 1200);

    const netInterval = setInterval(() => {
      setNetBlink(prev => Math.random() > 0.3);
    }, 800);

    return () => {
      clearInterval(diskInterval);
      clearInterval(netInterval);
    };
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

  const currentCaseDisplay = caseData?.id || (caseId ? `CASE ${caseId.slice(0, 12)}` : 'ACTIVE DIRECTORY');

  // Navigation Items matching the exact reference structure
  const navSections = caseId ? [
    {
      section: '// CASE CONSOLE',
      items: [
        { label: 'CASE OVERVIEW', path: `/cases/${caseId}`, icon: LayoutDashboard },
        { label: 'EVIDENCE & FILES', path: `/cases/${caseId}/evidence`, icon: FileText, count: 6 },
        { label: 'ENTITIES', path: `/cases/${caseId}/entities`, icon: Users, count: 27 },
        { label: 'GRAPH', path: `/cases/${caseId}/graph`, icon: Network, count: 84 },
        { label: 'MAP', path: `/cases/${caseId}/map`, icon: MapPin },
        { label: 'TIMELINE', path: `/cases/${caseId}/timeline`, icon: Clock, count: 9 },
      ],
    },
    {
      section: '// INTELLIGENCE',
      items: [
        { label: 'WORKBENCH', path: `/cases/${caseId}/workbench`, icon: Sparkles },
        { label: 'HYPOTHESES', path: `/cases/${caseId}/hypotheses`, icon: GitFork, count: 6 },
        { label: 'CONTRADICTIONS', path: `/cases/${caseId}/contradictions`, icon: AlertTriangle, count: 2 },
        { label: 'INFORMATION GAPS', path: `/cases/${caseId}/leads`, icon: HelpCircle, count: 6 },
        { label: 'LEADS & ACTIONS', path: `/cases/${caseId}/leads`, icon: Compass, count: 4 },
      ],
    },
    {
      section: '// TOOLS',
      items: [
        { label: 'AI INVESTIGATOR', path: `/cases/${caseId}/copilot`, icon: Cpu },
        { label: 'DATA INGESTION', path: `/cases/${caseId}/evidence`, icon: Database },
        { label: 'SYSTEM AUDIT', path: `/cases/${caseId}/reports`, icon: ShieldCheck },
      ],
    },
  ] : [
    {
      section: '// CASES DIRECTORY',
      items: [
        { label: 'ALL ACTIVE CASES', path: '/cases', icon: FolderOpen },
      ],
    },
  ];

  return (
    <TerminalAlertProvider>
      <div className="relative w-screen h-screen flex flex-col bg-[#080c08] text-[#f59e0b] overflow-hidden select-none font-mono">
        {/* Scanlines overlay (software-only CRT texture) */}
        {scanlinesActive && <div className="absolute inset-0 scanlines z-50 pointer-events-none" />}
        <div className="absolute inset-0 crt-vignette z-40 pointer-events-none" />

        {/* TOP GLOBAL BAR */}
        <header className="relative z-30 h-14 bg-[#0a0f0a] border-b border-amber-500/40 px-3 md:px-4 flex items-center justify-between text-xs shrink-0 shadow-md">
          {/* Left: Case identity */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 bg-black border border-amber-500/40 text-amber-300 hover:bg-amber-500 hover:text-black transition-colors shrink-0"
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => navigate('/cases')}
            >
              <div className="w-2.5 h-2.5 bg-amber-500 animate-pulse rounded-none shadow-[0_0_8px_#f59e0b]" />
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] text-amber-500/80 font-bold tracking-widest">CURRENT CASE</span>
                <span className="text-sm font-bold text-amber-300 tracking-wider group-hover:text-amber-200">
                  {currentCaseDisplay}
                </span>
              </div>
            </div>

            <div className="hidden md:flex items-center border-l border-amber-500/30 pl-3">
              <span className="px-2 py-0.5 text-[10px] bg-emerald-950/60 border border-emerald-500/50 text-emerald-400 font-bold tracking-widest">
                [ACTIVE]
              </span>
            </div>

            {caseData?.title && (
              <div className="hidden lg:block border-l border-amber-500/30 pl-3 text-[11px] text-amber-500/80 truncate max-w-xs">
                {caseData.title}
              </div>
            )}
          </div>

          {/* Center: System Header */}
          <div className="flex flex-col items-center text-center">
            <div className="flex items-center gap-2">
              <span className="text-xs md:text-sm font-bold text-amber-400 tracking-widest uppercase amber-glow">
                CRIMINAL NETWORK ANALYSIS SYSTEM
              </span>
            </div>
            <span className="text-[10px] text-amber-500/70 tracking-widest uppercase hidden sm:block">
              MINISTRY OF HOME AFFAIRS // INTELLIGENCE & INVESTIGATION
            </span>
          </div>

          {/* Right: Security session, Clock, Telemetry LEDs */}
          <div className="flex items-center gap-3 md:gap-5">
            {/* Hardware Telemetry Simulation LEDs */}
            <div className="hidden sm:flex items-center gap-2.5 px-2 py-1 bg-black/60 border border-amber-500/30 text-[10px]">
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${diskBlink ? 'bg-emerald-500 shadow-[0_0_5px_#10b981]' : 'bg-emerald-900'}`} />
                <span className="text-emerald-400 font-bold">DISK</span>
              </div>
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${netBlink ? 'bg-amber-400 shadow-[0_0_5px_#fbbf24]' : 'bg-amber-900'}`} />
                <span className="text-amber-400 font-bold">NET</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_5px_#ef4444]" />
                <span className="text-red-400 font-bold">PWR</span>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex flex-col text-right leading-tight">
              <span className="text-[10px] text-amber-500/80 tracking-widest">{dateString}</span>
              <span className="text-xs md:text-sm font-bold text-amber-300 tracking-widest">
                {timeString}
              </span>
            </div>

            {/* Classification & Session badge */}
            <div className="hidden xl:flex flex-col items-end gap-0.5">
              <div className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold tracking-wider">
                SECURE TERMINAL
              </div>
              <span className="text-[9px] text-amber-500/70">v1.0.3 // CLASSIFIED</span>
            </div>

            {/* Scanline toggle button */}
            <button
              onClick={() => setScanlinesActive(!scanlinesActive)}
              title="Toggle Scanlines"
              className={`p-1.5 border text-[11px] transition-colors ${
                scanlinesActive 
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-300' 
                  : 'bg-black border-amber-500/30 text-amber-500/50'
              }`}
            >
              CRT
            </button>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              title="Disconnect Terminal"
              className="p-1.5 bg-black border border-amber-500/30 hover:border-red-500 hover:text-red-400 text-amber-500/60 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </header>

        {/* MAIN VIEWPORT: SIDEBAR + CONTENT AREA */}
        <div className="relative z-20 flex-1 flex overflow-hidden">
          {/* Mobile backdrop */}
          {mobileMenuOpen && (
            <div
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 z-35 bg-black/70 md:hidden"
            />
          )}

          {/* LEFT SIDEBAR NAVIGATION */}
          <aside className={`fixed inset-y-14 left-0 z-40 w-64 bg-[#080d08] border-r border-amber-500/40 flex flex-col shrink-0 overflow-y-auto transition-transform duration-200 md:static md:translate-x-0 ${
            mobileMenuOpen ? 'translate-x-0 shadow-[0_0_25px_rgba(0,0,0,0.9)]' : '-translate-x-full md:translate-x-0'
          }`}>
            {/* Brand Header */}
            <div className="p-3.5 border-b border-amber-500/30 bg-[#0c120c]/80">
              <div className="flex items-center gap-2.5">
                {/* SPYDEE Network Node Icon */}
                <div className="relative w-7 h-7 flex items-center justify-center border border-amber-500/50 bg-black/60">
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute top-1 left-1 shadow-[0_0_4px_#f59e0b]" />
                  <span className="w-2 h-2 rounded-full bg-amber-400 absolute bottom-1 right-1 shadow-[0_0_4px_#f59e0b]" />
                  <span className="w-2 h-2 rounded-full bg-amber-300 absolute top-1 right-1" />
                  <div className="w-3.5 h-[1px] bg-amber-500 rotate-45" />
                </div>
                <div>
                  <h1 className="text-base font-black tracking-widest text-amber-400 amber-glow leading-none">
                    SPYDEE
                  </h1>
                  <p className="text-[9px] text-amber-500/80 tracking-widest uppercase mt-0.5 font-medium">
                    UNSEEN LINKS. SAFER TOMORROWS.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 py-2 px-2 space-y-4">
              {navSections.map((group) => (
                <div key={group.section} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold text-amber-500/60 tracking-widest uppercase flex items-center justify-between">
                    <span>{group.section}</span>
                    <span className="w-8 h-[1px] bg-amber-500/20" />
                  </div>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.path}
                          id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                          onClick={() => {
                            navigate(item.path);
                            setMobileMenuOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 text-xs flex items-center justify-between transition-all group font-mono ${
                            isActive
                              ? 'bg-[#f59e0b] text-[#080c08] font-bold shadow-[0_0_12px_rgba(245,158,11,0.5)]'
                              : 'text-amber-400/80 hover:text-amber-300 hover:bg-amber-950/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#080c08]' : 'text-amber-500'}`} />
                            <span className="truncate tracking-wider uppercase text-[11px]">
                              {item.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {item.count !== undefined && (
                              <span
                                className={`text-[10px] px-1 py-0.2 border ${
                                  isActive
                                    ? 'border-[#080c08] bg-[#080c08]/10 text-[#080c08]'
                                    : 'border-amber-500/30 bg-black/40 text-amber-500/90'
                                }`}
                              >
                                {String(item.count).padStart(2, '0')}
                              </span>
                            )}
                            {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#080c08]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Bottom Sidebar Footer */}
            <div className="p-3 border-t border-amber-500/30 bg-[#0a0f0a] text-[10px] text-amber-500/80 space-y-1">
              <div className="flex justify-between items-center text-amber-400 font-bold">
                <span>SPYDEE // v1.0.3</span>
                <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 border border-amber-500/40">STF</span>
              </div>
              <div className="text-[9px] text-amber-500/60 leading-tight">
                INTELLIGENCE DIVISION<br />
                AUTHORIZED USE ONLY
              </div>
              <div className="pt-1 border-t border-amber-500/20 flex items-center justify-between text-[8px] text-amber-500/50">
                <span>BHARAT ELECTRONICS</span>
                <span>IN-TERMINAL</span>
              </div>
            </div>
          </aside>

          {/* MAIN BODY WORKSPACE */}
          <main className="flex-1 flex flex-col min-w-0 bg-[#070b07] overflow-y-auto relative">
            {/* Active view component rendered through React Router */}
            <div className="flex-1 p-3 md:p-4 overflow-y-auto">
              <Outlet />
            </div>

            {/* BOTTOM TERMINAL STATUS STRIP */}
            <footer className="h-6 bg-[#0a0f0a] border-t border-amber-500/30 px-3 flex items-center justify-between text-[10px] text-amber-500/70 shrink-0 select-none">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 font-bold text-amber-400">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                  SYSTEM ONLINE
                </span>
                <span className="hidden sm:inline-block border-l border-amber-500/30 pl-3">
                  INTELLIGENCE ENGINE: READY
                </span>
                <span className="hidden md:inline-block border-l border-amber-500/30 pl-3">
                  GRAPH NODES: {caseData?.entityCount || '27'} // EDGES: {caseData?.edgeCount || '84'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <span className="hidden lg:inline-block">
                  🇮🇳 GOVT. OF INDIA // INVESTIGATIVE INTELLIGENCE
                </span>
                <span className="text-amber-400 font-bold">
                  CLASSIFIED
                </span>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </TerminalAlertProvider>
  );
}
