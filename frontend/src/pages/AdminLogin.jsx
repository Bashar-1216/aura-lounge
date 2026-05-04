import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(email, password);
      navigate(user.role === 'kitchen' ? '/kitchen' : '/admin');
    } catch (err) {
      setError(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="glass-card login-card">
        <div className="logo" style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '0.5rem' }}>✦ AURA LOUNGE</div>
        <h1 style={{ fontSize: '1.3rem' }}>Staff Login</h1>
        <p>Enter your credentials to access the dashboard</p>

        <form onSubmit={handleSubmit}>
          <div className="input-group" style={{ marginBottom: '1rem' }}>
            <label>Email</label>
            <input className="input" type="email" placeholder="admin@aura.com" value={email} onChange={e => setEmail(e.target.value)} required id="login-email" />
          </div>
          <div className="input-group" style={{ marginBottom: '1.5rem' }}>
            <label>Password</label>
            <input className="input" type="password" placeholder="Enter password" value={password} onChange={e => setPassword(e.target.value)} required id="login-password" />
          </div>
          {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</p>}
          <button className="btn btn-primary w-full" type="submit" disabled={loading} id="login-submit">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
