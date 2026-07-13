import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';

export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => setSession(newSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function sendLink(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
    if (error) setError(error.message);
    else setSent(true);
  }

  if (session === undefined) return null;

  if (!session) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form onSubmit={sendLink} style={{ width: 300, textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Fuel My Stride</div>
          {sent ? (
            <div style={{ fontSize: 14, color: '#555' }}>Check {email} for a sign-in link.</div>
          ) : (
            <>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{ width: '100%', padding: 10, marginBottom: 10, border: '1px solid #ccc', borderRadius: 8 }}
              />
              <button type="submit" style={{ width: '100%', padding: 10, borderRadius: 8, border: 'none', background: '#333', color: '#fff', cursor: 'pointer' }}>
                Send sign-in link
              </button>
              {error && <div style={{ color: 'crimson', fontSize: 13, marginTop: 10 }}>{error}</div>}
            </>
          )}
        </form>
      </div>
    );
  }

  return children;
}
