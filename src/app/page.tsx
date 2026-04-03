'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '../stores/useStore';
import { Leaf, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const login = useStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      setIsLoading(false);
      
      if (success) {
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Try admin@githirioni.org / admin123');
      }
    }, 500);
  };

  return (
    <main style={{ 
      minHeight: '100vh', 
      display: 'flex',
      background: 'linear-gradient(135deg, #228B22 0%, #1B6B1B 100%)'
    }}>
      <div style={{
        display: 'flex',
        width: '100%',
        minHeight: '100vh',
      }}>
        <div style={{
          display: 'none',
          flex: 1,
          background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Cpath fill=\'%23FFFFFF\' fill-opacity=\'0.05\' d=\'M50 0c27.6 0 50 22.4 50 50s-22.4 50-50 50S0 77.6 0 50 22.4 0 50 0z\'/%3E%3C/svg%3E")',
          backgroundSize: '50px 50px',
        }} className="lg:flex lg:flex-col lg:justify-center lg:items-center lg:p-12">
          <div style={{ color: 'white', textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(255,255,255,0.2)', 
              borderRadius: '50%', 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px'
            }}>
              <Leaf size={40} />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '16px' }}>
              Githirioni Self Help Group
            </h1>
            <p style={{ fontSize: '1.125rem', opacity: 0.9, lineHeight: 1.6 }}>
              Building community financial strength through cooperation, transparency, and shared success.
            </p>
            <div style={{ 
              marginTop: '48px', 
              display: 'grid', 
              gridTemplateColumns: 'repeat(2, 1fr)', 
              gap: '24px',
              textAlign: 'left'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#90EE90' }}>KSHS 2.5M+</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Total Savings</div>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.1)', padding: '20px', borderRadius: '8px' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#90EE90' }}>45</div>
                <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>Active Members</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          background: '#F8FAF8',
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px', display: 'none' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                background: '#228B22', 
                borderRadius: '12px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <Leaf size={24} />
              </div>
            </div>

            <div className="mobile-logo" style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: '#228B22', 
                borderRadius: '16px', 
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: 'white'
              }}>
                <Leaf size={32} />
              </div>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 700, 
                color: '#1A1A1A',
                marginBottom: '8px'
              }}>
                Welcome Back
              </h2>
              <p style={{ color: '#6B6B6B', fontSize: '0.875rem' }}>
                Sign in to manage your SHG
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label 
                  htmlFor="email" 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    color: '#4A4A4A',
                    marginBottom: '6px'
                  }}
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="admin@githirioni.org"
                  required
                  style={{ height: '48px' }}
                />
              </div>

              <div>
                <label 
                  htmlFor="password" 
                  style={{ 
                    display: 'block', 
                    fontSize: '0.875rem', 
                    fontWeight: 500, 
                    color: '#4A4A4A',
                    marginBottom: '6px'
                  }}
                >
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input"
                    placeholder="Enter your password"
                    required
                    style={{ height: '48px', paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B6B6B',
                      padding: '4px'
                    }}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {error && (
                <div style={{
                  background: '#FEE2E2',
                  color: '#991B1B',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg"
                style={{ 
                  height: '48px', 
                  marginTop: '8px',
                  opacity: isLoading ? 0.7 : 1
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="spinner" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div style={{ 
              marginTop: '24px', 
              textAlign: 'center',
              fontSize: '0.875rem',
              color: '#6B6B6B'
            }}>
              Demo: admin@githirioni.org / admin123
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @media (min-width: 1024px) {
          .mobile-logo {
            display: none;
          }
        }
      `}</style>
    </main>
  );
}