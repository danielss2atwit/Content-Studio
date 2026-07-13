import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL;

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [newPasscode, setNewPasscode] = useState('');
  const [setupMsg, setSetupMsg] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function unlock(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email: OWNER_EMAIL, password: passcode });
    if (error) setError('Wrong passcode.');
  }

  async function savePasscode(e) {
    e.preventDefault();
    setSetupMsg('');
    const { error } = await supabase.auth.updateUser({ password: newPasscode });
    if (error) {
      setSetupMsg(error.message);
    } else {
      setSetupMsg('Passcode set.');
      setNewPasscode('');
      setShowSetup(false);
    }
  }

  if (session === undefined) return null;

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={unlock} style={{ width: 280, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Fuel My Stride</div>
          <input
            type="password"
            required
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            style={{ width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
          <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>
            Unlock
          </button>
          {error && <div style={{ color: 'crimson', fontSize: 13, marginTop: 10 }}>{error}</div>}
        </form>
      </div>
    );
  }

  return (
    <>
      {children}
      <div style={{ position: 'fixed', bottom: 12, right: 12, zIndex: 100, fontFamily: 'sans-serif' }}>
        {showSetup ? (
          <form onSubmit={savePasscode} style={{ background: '#fff', border: '1px solid #ccc', borderRadius: 10, padding: 10, boxShadow: '0 2px 10px rgba(0,0,0,0.15)', display: 'flex', gap: 6 }}>
            <input
              type="password"
              required
              value={newPasscode}
              onChange={(e) => setNewPasscode(e.target.value)}
              placeholder="New passcode"
              style={{ padding: 6, border: '1px solid #ccc', borderRadius: 6, fontSize: 12 }}
            />
            <button type="submit" style={{ padding: '6px 10px', borderRadius: 6, border: 'none', background: '#333', color: '#fff', fontSize: 12, cursor: 'pointer' }}>
              Save
            </button>
          </form>
        ) : (
          <div
            onClick={() => setShowSetup(true)}
            title="Set device passcode"
            style={{ width: 30, height: 30, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }}
          >
            🔑
          </div>
        )}
        {setupMsg && <div style={{ fontSize: 11, marginTop: 4, textAlign: 'right', color: '#555', background: '#fff', padding: '2px 6px', borderRadius: 6 }}>{setupMsg}</div>}
      </div>
    </>
  );
}
