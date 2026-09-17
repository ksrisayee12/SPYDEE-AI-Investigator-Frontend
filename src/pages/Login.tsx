import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { TerminalPanel, TerminalButton } from '../components/TerminalComponents';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.login(username, password);
      localStorage.setItem('spydee_token', res.access_token);
      localStorage.setItem('spydee_user', JSON.stringify(res.user));
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'AUTHENTICATION REJECTED // INVALID CREDENTIALS');
    } finally {
      setLoading(false);
    }
  };

  const setCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#080705] flex items-center justify-center p-4 font-mono text-[#FFBA42] crt-screen">
      <div className="w-full max-w-md space-y-4">
        {/* Terminal Header Banner */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#3D2A12] bg-[#0D0B08] text-[11px] text-[#A6732E] rounded-xs uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#FF9E1B] animate-pulse" />
            SECURE INTELLIGENCE GATEWAY // PORT 3000
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-[#FF9E1B] flex items-center justify-center gap-2 amber-glow">
            <span>◈</span> SPYDEE
          </h1>
          <p className="text-xs text-[#A6732E] uppercase tracking-wider">
            Criminal Network Analysis & Intelligence Terminal
          </p>
        </div>

        {/* Authentication Panel */}
        <TerminalPanel title="SECURE ACCESS // CREDENTIAL CHALLENGE" variant="raised">
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6732E] mb-1">
                OPERATOR IDENTIFIER [USERNAME]
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-sm text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                placeholder="e.g. investigator"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#A6732E] mb-1">
                SECURITY ACCESS KEY [PASSWORD]
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#14110C] border border-[#3D2A12] rounded-xs text-sm text-[#FFE7B8] focus:border-[#FF9E1B] focus:outline-none placeholder-[#7A521D]"
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-2.5 border border-[#EF4444] bg-[#EF4444]/10 text-[#EF4444] text-xs rounded-xs">
                ⚠ {error}
              </div>
            )}

            <TerminalButton
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full py-2.5 text-xs font-semibold"
            >
              {loading ? 'VERIFYING SECURITY TOKENS...' : 'AUTHENTICATE SESSION ▶'}
            </TerminalButton>
          </form>

          {/* Quick Operator Profiles for local dev/testing */}
          <div className="mt-5 pt-4 border-t border-[#3D2A12] text-xs">
            <div className="text-[10px] text-[#A6732E] uppercase tracking-wider mb-2">
              QUICK CREDENTIAL SELECTION:
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setCredentials('investigator', 'invest123')}
                className="px-2 py-1.5 border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] hover:text-[#FFBA42] text-[10px] text-left rounded-xs transition-colors"
              >
                <div className="text-[#FF9E1B] font-bold">INVESTIGATOR</div>
                <div className="text-[#A6732E] text-[9px]">Field Level</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('admin', 'admin123')}
                className="px-2 py-1.5 border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] hover:text-[#FFBA42] text-[10px] text-left rounded-xs transition-colors"
              >
                <div className="text-[#34D399] font-bold">ADMIN</div>
                <div className="text-[#A6732E] text-[9px]">Full Clearance</div>
              </button>
              <button
                type="button"
                onClick={() => setCredentials('supervisor', 'super123')}
                className="px-2 py-1.5 border border-[#3D2A12] bg-[#14110C] hover:border-[#FF9E1B] hover:text-[#FFBA42] text-[10px] text-left rounded-xs transition-colors"
              >
                <div className="text-[#FFBA42] font-bold">SUPERVISOR</div>
                <div className="text-[#A6732E] text-[9px]">Audit Authority</div>
              </button>
            </div>
          </div>
        </TerminalPanel>

        <div className="text-center text-[10px] text-[#A6732E] tracking-wider uppercase">
          PROTECTED UNDER CLASSIFIED INTELLIGENCE PROTOCOLS // RESTRICTED ACCESS
        </div>
      </div>
    </div>
  );
}
