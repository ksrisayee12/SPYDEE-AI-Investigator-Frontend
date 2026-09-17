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

  const setDemo = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-[#07100D] flex items-center justify-center p-4 font-mono text-[#D8E5DC]">
      <div className="w-full max-w-md space-y-4">
        {/* Terminal Header Banner */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 border border-[#27453A] bg-[#0B1713] text-[11px] text-[#6F887A] rounded-sm uppercase tracking-wider mb-2">
            <span className="w-2 h-2 rounded-full bg-[#9FE3B1] animate-pulse" />
            GOVERNMENT INTELLIGENCE GATEWAY // PORT 3000
          </div>
          <h1 className="text-3xl font-bold tracking-widest text-[#FFB84D] flex items-center justify-center gap-2">
            <span>◈</span> SPYDEE
          </h1>
          <p className="text-xs text-[#6F887A] uppercase tracking-wider">
            Operational Investigation & Intelligence Terminal
          </p>
        </div>

        {/* Authentication Panel */}
        <TerminalPanel title="SECURE ACCESS // CREDENTIAL CHALLENGE">
          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6F887A] mb-1">
                OPERATOR IDENTIFIER [USERNAME]
              </label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1D18] border border-[#27453A] rounded-sm text-sm text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none placeholder-[#3C6653]"
                placeholder="e.g. investigator"
                autoComplete="username"
                required
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#6F887A] mb-1">
                SECURITY ACCESS KEY [PASSWORD]
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-[#0F1D18] border border-[#27453A] rounded-sm text-sm text-[#D8E5DC] focus:border-[#FFB84D] focus:outline-none placeholder-[#3C6653]"
                placeholder="••••••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {error && (
              <div className="p-2.5 border border-[#E05A52] bg-[#E05A52]/10 text-[#E05A52] text-xs rounded-sm">
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

          {/* Preset Demo Operators */}
          <div className="mt-5 pt-4 border-t border-[#27453A] text-xs">
            <div className="text-[10px] text-[#6F887A] uppercase tracking-wider mb-2">
              QUICK AUTHENTICATION PROFILES (SYNTHETIC ENVIRONMENT):
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemo('investigator', 'invest123')}
                className="px-2 py-1.5 border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:text-[#FFB84D] text-[10px] text-left rounded-sm transition-colors"
              >
                <div className="text-[#9FE3B1] font-bold">INVESTIGATOR</div>
                <div className="text-[#6F887A] text-[9px]">Level-3 Access</div>
              </button>
              <button
                type="button"
                onClick={() => setDemo('admin', 'admin123')}
                className="px-2 py-1.5 border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:text-[#FFB84D] text-[10px] text-left rounded-sm transition-colors"
              >
                <div className="text-[#FFB84D] font-bold">ADMIN</div>
                <div className="text-[#6F887A] text-[9px]">Full Clearance</div>
              </button>
              <button
                type="button"
                onClick={() => setDemo('supervisor', 'super123')}
                className="px-2 py-1.5 border border-[#27453A] bg-[#0F1D18] hover:border-[#FFB84D] hover:text-[#FFB84D] text-[10px] text-left rounded-sm transition-colors"
              >
                <div className="text-[#D8E5DC] font-bold">SUPERVISOR</div>
                <div className="text-[#6F887A] text-[9px]">Audit Authority</div>
              </button>
            </div>
          </div>
        </TerminalPanel>

        <div className="text-center text-[10px] text-[#6F887A] tracking-wider uppercase">
          PROTECTED UNDER CLASSIFIED DATA CLEARANCE PROTOCOLS // DO NOT DISCLOSE
        </div>
      </div>
    </div>
  );
}
