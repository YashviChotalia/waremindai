import React, { useState } from 'react';
import { useWarehouseStore } from '../store/useWarehouseStore';
import { User, Lock, Shield, Warehouse as WhIcon, Activity, Sun, Moon } from 'lucide-react';

export default function Login() {
  const { setPortalRole, theme, toggleTheme } = useWarehouseStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [roleSelection, setRoleSelection] = useState<'company' | 'warehouse'>('company');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMessage('Please enter both ID and password.');
      return;
    }
    setPortalRole(roleSelection);
  };

  const handleDemoAccess = () => setPortalRole(roleSelection);

  const isLight = theme === 'light';

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: isLight
          ? 'linear-gradient(160deg, #DBEAFE 0%, #EFF6FF 40%, #E0F2FE 100%)'
          : 'linear-gradient(160deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)',
        transition: 'background 0.3s ease',
      }}
    >
      {/* Soft background circles */}
      <div
        className="absolute top-[-80px] left-[-80px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />
      <div
        className="absolute bottom-[-100px] right-[-60px] w-[450px] h-[450px] rounded-full pointer-events-none"
        style={{
          background: isLight
            ? 'radial-gradient(circle, rgba(14,165,233,0.1) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(6,182,212,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Subtle warehouse silhouette at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: isLight
            ? 'linear-gradient(to top, rgba(186,230,255,0.5) 0%, transparent 100%)'
            : 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 100%)',
        }}
      />

      {/* Theme toggle top-right */}
      <button
        onClick={toggleTheme}
        className="absolute top-5 right-5 z-20 flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium transition-all duration-200"
        style={{
          background: isLight ? 'rgba(255,255,255,0.7)' : 'rgba(30,41,59,0.7)',
          border: `1px solid ${isLight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.08)'}`,
          color: isLight ? '#374151' : '#94A3B8',
          backdropFilter: 'blur(8px)',
        }}
      >
        {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
        <span>{isLight ? 'Dark Mode' : 'Light Mode'}</span>
      </button>

      {/* Main card */}
      <div
        className="relative z-10 w-full max-w-sm mx-4 animate-fade-in-up"
        style={{
          background: isLight ? 'rgba(255,255,255,0.82)' : 'rgba(15,23,42,0.75)',
          border: `1px solid ${isLight ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.07)'}`,
          borderRadius: '1.25rem',
          boxShadow: isLight
            ? '0 20px 60px rgba(59,130,246,0.12), 0 4px 16px rgba(0,0,0,0.06)'
            : '0 20px 60px rgba(0,0,0,0.5), 0 4px 16px rgba(0,0,0,0.3)',
          backdropFilter: 'blur(20px)',
          padding: '2.5rem 2rem',
        }}
      >
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
              boxShadow: '0 8px 24px rgba(59,130,246,0.35)',
            }}
          >
            <Activity className="h-7 w-7 text-white" />
          </div>
          <h1
            className="text-4xl font-extrabold tracking-tight text-center"
            style={{ color: isLight ? '#0F172A' : '#F8FAFC', letterSpacing: '-0.03em' }}
          >
            Ware<span style={{ color: '#3B82F6' }}>Mind</span>
          </h1>
          <p
            className="text-xs font-semibold tracking-widest uppercase mt-1.5 text-center"
            style={{ color: isLight ? '#3B82F6' : '#60A5FA' }}
          >
            Intelligent Warehouse Operations
          </p>
        </div>

        {/* Role Selector */}
        <div
          className="flex rounded-xl p-1 mb-6 gap-1"
          style={{
            background: isLight ? 'rgba(219,234,254,0.6)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${isLight ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.06)'}`,
          }}
        >
          {(['company', 'warehouse'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleSelection(role)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: roleSelection === role
                  ? 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)'
                  : 'transparent',
                color: roleSelection === role
                  ? '#FFFFFF'
                  : isLight ? '#64748B' : '#94A3B8',
                boxShadow: roleSelection === role ? '0 2px 8px rgba(59,130,246,0.3)' : 'none',
              }}
            >
              {role === 'company' ? <Shield className="h-3.5 w-3.5" /> : <WhIcon className="h-3.5 w-3.5" />}
              {role === 'company' ? 'Company' : 'Warehouse'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMessage && (
            <div
              className="px-3 py-2 rounded-lg text-xs text-center"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#EF4444',
              }}
            >
              {errorMessage}
            </div>
          )}

          {/* Username */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <User
                className="h-4 w-4"
                style={{ color: isLight ? '#3B82F6' : '#60A5FA' }}
              />
            </div>
            <input
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); setErrorMessage(''); }}
              placeholder="ID Username"
              className="glass-input input-with-icon"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.6)',
                borderColor: isLight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)',
                color: isLight ? '#0F172A' : '#F8FAFC',
                borderRadius: '0.75rem',
              }}
            />
          </div>

          {/* Password */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Lock
                className="h-4 w-4"
                style={{ color: isLight ? '#3B82F6' : '#60A5FA' }}
              />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
              placeholder="Password"
              className="glass-input input-with-icon"
              style={{
                background: isLight ? 'rgba(255,255,255,0.9)' : 'rgba(15,23,42,0.6)',
                borderColor: isLight ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.07)',
                color: isLight ? '#0F172A' : '#F8FAFC',
                borderRadius: '0.75rem',
              }}
            />
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all duration-200 mt-2"
            style={{
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
            }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.55)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(59,130,246,0.4)')}
          >
            Login
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div
            className="flex-1 h-px"
            style={{ background: isLight ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)' }}
          />
          <span className="text-[11px] font-mono" style={{ color: isLight ? '#94A3B8' : '#475569' }}>
            or
          </span>
          <div
            className="flex-1 h-px"
            style={{ background: isLight ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.06)' }}
          />
        </div>

        {/* Demo Access */}
        <button
          onClick={handleDemoAccess}
          className="w-full py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
          style={{
            background: isLight ? 'rgba(219,234,254,0.6)' : 'rgba(59,130,246,0.07)',
            border: `1px solid ${isLight ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.15)'}`,
            color: isLight ? '#3B82F6' : '#60A5FA',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = isLight ? 'rgba(219,234,254,0.9)' : 'rgba(59,130,246,0.12)')}
          onMouseLeave={e => (e.currentTarget.style.background = isLight ? 'rgba(219,234,254,0.6)' : 'rgba(59,130,246,0.07)')}
        >
          Launch Sandbox Demo
        </button>

        {/* Footer */}
        <p
          className="text-center text-[11px] mt-5"
          style={{ color: isLight ? '#94A3B8' : '#475569' }}
        >
          WareMind AI · Warehouse Intelligence Platform
        </p>
      </div>
    </div>
  );
}
