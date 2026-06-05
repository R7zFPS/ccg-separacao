/**
 * Login — Casa das Correntes Guanabara
 * Design premium: Navy profundo + Dourado | GSAP kinetic animations
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate }        from 'react-router-dom';
import { Eye, EyeOff, AlertCircle }    from 'lucide-react';
import { useAuth }                      from '../../context/AuthContext';
import { Spinner }                      from '../../components/ui/Spinner';

/* ── Ícone de usuário inline (sem biblioteca) ── */
function IconeUsuario() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4"/>
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  );
}

/* ── Ícone de cadeado inline ── */
function IconeCadeado() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  );
}

/* ── Seta de entrada ── */
function IconeEntrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
      <polyline points="10 17 15 12 10 7"/>
      <line x1="15" y1="12" x2="3" y2="12"/>
    </svg>
  );
}

/* ── SVG Logo completo (ícone + texto integrado) ── */
function LogoCompleta({ className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-5 ${className}`}>
      {/* Ícone animado */}
      <div className="logo-icon-wrap" style={{ width: 120, height: 116 }}>
        <svg viewBox="0 0 220 212" xmlns="http://www.w3.org/2000/svg"
             style={{ width: '100%', height: '100%' }}>
          {/* Losango */}
          <path
            className="logo-diamond"
            d="M 110 8 L 208 106 L 110 204 L 12 106 Z"
            stroke="currentColor" strokeWidth="6" fill="none" strokeLinejoin="miter"
          />
          {/* 3 elos */}
          <rect className="logo-chain" x="30"  y="93" width="58" height="26" rx="13"
                stroke="currentColor" strokeWidth="5" fill="none"/>
          <rect className="logo-chain" x="81"  y="93" width="58" height="26" rx="13"
                stroke="currentColor" strokeWidth="5" fill="none"/>
          <rect className="logo-chain" x="132" y="93" width="58" height="26" rx="13"
                stroke="currentColor" strokeWidth="5" fill="none"/>
        </svg>
      </div>
      {/* Texto */}
      <div className="text-center">
        <p className="logo-nome"
           style={{
             fontFamily: 'Fraunces, Georgia, serif',
             fontSize: '1.45rem',
             fontWeight: 700,
             letterSpacing: '0.22em',
             textTransform: 'uppercase',
             lineHeight: 1.1,
             color: '#FFFFFF',
           }}>
          CASA DAS CORRENTES
        </p>
        <p style={{
             fontFamily: 'Outfit, sans-serif',
             fontSize: '0.7rem',
             fontWeight: 300,
             letterSpacing: '0.35em',
             textTransform: 'uppercase',
             color: 'rgba(201,217,238,0.6)',
             marginTop: '0.4rem',
           }}>
          GUANABARA
        </p>
      </div>
    </div>
  );
}

/* ── Padrão decorativo de elos no fundo ── */
function BackgroundPattern() {
  const elos = [
    { x: 8, y: 12 }, { x: 24, y: 6 }, { x: 40, y: 16 }, { x: 56, y: 4 }, { x: 72, y: 14 },
    { x: 16, y: 28 }, { x: 32, y: 22 }, { x: 48, y: 32 }, { x: 64, y: 20 }, { x: 80, y: 30 },
    { x: 4,  y: 44 }, { x: 20, y: 38 }, { x: 36, y: 48 }, { x: 52, y: 36 }, { x: 68, y: 46 },
    { x: 88, y: 38 }, { x: 12, y: 60 }, { x: 28, y: 54 }, { x: 44, y: 64 }, { x: 60, y: 52 },
    { x: 76, y: 62 }, { x: 92, y: 50 }, { x: 8,  y: 76 }, { x: 24, y: 70 }, { x: 40, y: 80 },
    { x: 56, y: 68 }, { x: 72, y: 78 }, { x: 88, y: 66 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100"
           preserveAspectRatio="xMidYMid slice">
        {elos.map((p, i) => (
          <rect
            key={i}
            x={p.x} y={p.y}
            width="9" height="4" rx="2"
            stroke="rgba(201,217,238,0.06)"
            strokeWidth="0.4"
            fill="none"
            style={{
              animation: `chainFloat ${3.5 + (i % 4) * 0.7}s ease-in-out ${(i % 7) * 0.4}s infinite`,
            }}
          />
        ))}
      </svg>

      {/* Gradiente radial de profundidade */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 70% at 40% 60%, rgba(15,72,128,0.18) 0%, transparent 70%)',
      }} />

      {/* Linha dourada no topo do painel */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: '3px',
        background: 'linear-gradient(90deg, transparent, rgba(196,144,42,0.7) 40%, rgba(217,172,64,0.9) 60%, transparent)',
      }} />
    </div>
  );
}

/* ═══════════════════════════════════
   PÁGINA DE LOGIN
   ═══════════════════════════════════ */
export default function Login() {
  const { login, estaAutenticado, precisaTrocarSenha } = useAuth();
  const navigate = useNavigate();
  const painelRef  = useRef(null);
  const formRef    = useRef(null);
  const logoRef    = useRef(null);

  const [form, setForm]                 = useState({ usuario_login: '', senha: '' });
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando]     = useState(false);
  const [erro, setErro]                 = useState('');
  const [inputFocus, setInputFocus]     = useState(null);

  /* ── Animação GSAP na montagem ── */
  useEffect(() => {
    if (typeof window.gsap === 'undefined') return;

    const gsap = window.gsap;
    const ctx  = gsap.context(() => {

      /* 1. Painel esquerdo: desliza da esquerda */
      gsap.from('.login-left-panel', {
        x: -60, opacity: 0, duration: 1,
        ease: 'cubic-bezier(0.22,1,0.36,1)',
      });

      /* 2. Logo: escala + fade */
      gsap.from('.logo-icon-wrap', {
        scale: 0.75, opacity: 0, duration: 1.1,
        ease: 'back.out(1.5)', delay: 0.25,
      });

      /* 3. Nome da empresa: stagger por letra (simulado por palavra) */
      gsap.from('.logo-nome', {
        y: 30, opacity: 0, duration: 0.9,
        ease: 'cubic-bezier(0.22,1,0.36,1)', delay: 0.5,
      });

      /* 4. Texto descritivo */
      gsap.from('.login-left-desc', {
        y: 20, opacity: 0, duration: 0.8,
        ease: 'cubic-bezier(0.22,1,0.36,1)', delay: 0.75,
      });

      /* 5. Indicadores de feature */
      gsap.from('.login-feature', {
        x: -20, opacity: 0, duration: 0.7,
        stagger: 0.12,
        ease: 'cubic-bezier(0.22,1,0.36,1)', delay: 0.9,
      });

      /* 6. Painel direito (formulário) */
      gsap.from('.login-right-panel', {
        x: 60, opacity: 0, duration: 1,
        ease: 'cubic-bezier(0.22,1,0.36,1)', delay: 0.1,
      });

      /* 7. Campos do formulário: stagger suave */
      gsap.from('.login-form-field', {
        y: 20, opacity: 0, duration: 0.7,
        stagger: 0.1,
        ease: 'cubic-bezier(0.22,1,0.36,1)', delay: 0.45,
      });

    }, painelRef);

    return () => ctx.revert();
  }, []);

  if (estaAutenticado && !precisaTrocarSenha) return <Navigate to="/dashboard" replace />;
  if (estaAutenticado &&  precisaTrocarSenha) return <Navigate to="/primeiro-acesso" replace />;

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
    if (erro) setErro('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.usuario_login || !form.senha) {
      setErro('Preencha o usuário e a senha.');
      return;
    }
    setCarregando(true);
    setErro('');
    try {
      const usr = await login(form.usuario_login, form.senha);
      navigate(usr.primeiro_acesso ? '/primeiro-acesso' : '/dashboard', { replace: true });
    } catch (err) {
      setErro(
        err?.response?.data?.mensagem ||
        err?.message ||
        'Usuário ou senha incorretos.'
      );
      /* Shake no card ao errar */
      if (typeof window.gsap !== 'undefined' && formRef.current) {
        window.gsap.timeline()
          .to(formRef.current, { x: -8, duration: 0.08 })
          .to(formRef.current, { x:  8, duration: 0.08 })
          .to(formRef.current, { x: -5, duration: 0.08 })
          .to(formRef.current, { x:  5, duration: 0.08 })
          .to(formRef.current, { x:  0, duration: 0.08 });
      }
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div ref={painelRef} style={{ minHeight: '100vh', display: 'flex' }}>

      {/* ══════════════════════════════════════
          PAINEL ESQUERDO — Branding (desktop)
          ══════════════════════════════════════ */}
      <div
        className="login-left-panel"
        style={{
          display: 'none',
          width: '45%',
          position: 'relative',
          background: 'linear-gradient(160deg, #010814 0%, #030E22 40%, #051838 100%)',
          overflow: 'hidden',
        }}
      >
        {/* Padrão decorativo */}
        <BackgroundPattern />

        {/* Conteúdo */}
        <div style={{
          position: 'relative', zIndex: 1,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          height: '100%',
          padding: '3rem',
        }}>
          {/* Logo */}
          <div ref={logoRef}>
            <LogoCompleta />
          </div>

          {/* Linha dourada decorativa */}
          <div style={{
            width: 64, height: 2,
            background: 'linear-gradient(90deg, var(--gold-400), var(--gold-200))',
            borderRadius: 999,
            margin: '2.5rem auto',
          }} className="gold-accent-line" />

          {/* Descrição */}
          <p className="login-left-desc" style={{
            maxWidth: 280,
            textAlign: 'center',
            color: 'rgba(201,217,238,0.65)',
            fontSize: '0.875rem',
            lineHeight: 1.7,
            fontWeight: 300,
          }}>
            Gerencie separações de estoque, rastreie entregas e
            mantenha sua equipe sincronizada em tempo real.
          </p>

          {/* Features */}
          <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {[
              { icon: '⚡', label: 'Atualizações em tempo real' },
              { icon: '🔒', label: 'Controle de acesso por perfil' },
              { icon: '📊', label: 'Dashboards e relatórios' },
            ].map(({ icon, label }) => (
              <div key={label} className="login-feature" style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
              }}>
                <div style={{
                  width: 32, height: 32,
                  borderRadius: 8,
                  background: 'rgba(196,144,42,0.12)',
                  border: '1px solid rgba(196,144,42,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.9rem',
                }}>
                  {icon}
                </div>
                <span style={{
                  color: 'rgba(201,217,238,0.75)',
                  fontSize: '0.82rem',
                  fontWeight: 400,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Decoração de correntes no fundo */}
          <div style={{
            position: 'absolute', bottom: 32,
            display: 'flex', gap: 10, opacity: 0.12,
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                width: 28, height: 13,
                borderRadius: 999,
                border: '3px solid rgba(201,217,238,0.8)',
                marginTop: i % 2 === 0 ? 0 : 7,
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          PAINEL DIREITO — Formulário
          ══════════════════════════════════════ */}
      <div
        className="login-right-panel"
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F0F4FA',
          padding: '2rem 1.5rem',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>

          {/* Logo mobile (aparece apenas em telas pequenas) */}
          <div className="login-mobile-logo" style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '2rem',
          }}>
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.75rem',
              color: 'var(--navy-800)',
            }}>
              <svg viewBox="0 0 220 212" width="72" height="70">
                <path d="M 110 8 L 208 106 L 110 204 L 12 106 Z"
                      stroke="currentColor" strokeWidth="6" fill="none" strokeLinejoin="miter"/>
                <rect x="30"  y="93" width="58" height="26" rx="13"
                      stroke="currentColor" strokeWidth="5" fill="none"/>
                <rect x="81"  y="93" width="58" height="26" rx="13"
                      stroke="currentColor" strokeWidth="5" fill="none"/>
                <rect x="132" y="93" width="58" height="26" rx="13"
                      stroke="currentColor" strokeWidth="5" fill="none"/>
              </svg>
              <div style={{ textAlign: 'center' }}>
                <p style={{
                  fontFamily: 'Fraunces, serif', fontWeight: 700,
                  fontSize: '1rem', letterSpacing: '0.18em',
                  textTransform: 'uppercase', color: 'var(--navy-800)',
                }}>CASA DAS CORRENTES</p>
                <p style={{
                  fontSize: '0.65rem', letterSpacing: '0.3em',
                  textTransform: 'uppercase', color: 'var(--navy-400)',
                  fontWeight: 300, marginTop: '2px',
                }}>GUANABARA</p>
              </div>
            </div>
          </div>

          {/* Card do formulário */}
          <div ref={formRef} style={{
            background: '#FFFFFF',
            borderRadius: 20,
            boxShadow: '0 8px 40px rgba(5,24,56,0.12), 0 2px 8px rgba(5,24,56,0.06)',
            padding: '2.5rem',
            border: '1px solid rgba(201,217,238,0.5)',
          }}>
            {/* Título */}
            <div className="login-form-field" style={{ marginBottom: '1.75rem' }}>
              <div style={{
                width: 28, height: 3,
                background: 'linear-gradient(90deg, var(--gold-400), var(--gold-200))',
                borderRadius: 999, marginBottom: '0.875rem',
              }} />
              <h2 style={{
                fontSize: '1.5rem', fontWeight: 800,
                color: 'var(--navy-900)',
                letterSpacing: '-0.03em',
              }}>
                Entrar no sistema
              </h2>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--navy-400)',
                marginTop: '0.25rem',
                fontWeight: 400,
              }}>
                Use seu usuário e senha de acesso
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

                {/* Campo Usuário */}
                <div className="login-form-field">
                  <label htmlFor="usuario_login" className="label-base">
                    Usuário
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12,
                      top: '50%', transform: 'translateY(-50%)',
                      color: inputFocus === 'usuario' ? 'var(--navy-500)' : 'var(--navy-300)',
                      transition: 'color 0.2s',
                      pointerEvents: 'none',
                    }}>
                      <IconeUsuario />
                    </span>
                    <input
                      id="usuario_login"
                      type="text"
                      name="usuario_login"
                      autoComplete="username"
                      autoFocus
                      value={form.usuario_login}
                      onChange={handleChange}
                      onFocus={() => setInputFocus('usuario')}
                      onBlur={()  => setInputFocus(null)}
                      placeholder="seu.usuario"
                      className="input-base"
                      style={{ paddingLeft: 38 }}
                      disabled={carregando}
                      required
                    />
                  </div>
                </div>

                {/* Campo Senha */}
                <div className="login-form-field">
                  <label htmlFor="senha" className="label-base">
                    Senha
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 12,
                      top: '50%', transform: 'translateY(-50%)',
                      color: inputFocus === 'senha' ? 'var(--navy-500)' : 'var(--navy-300)',
                      transition: 'color 0.2s',
                      pointerEvents: 'none',
                    }}>
                      <IconeCadeado />
                    </span>
                    <input
                      id="senha"
                      type={mostrarSenha ? 'text' : 'password'}
                      name="senha"
                      autoComplete="current-password"
                      value={form.senha}
                      onChange={handleChange}
                      onFocus={() => setInputFocus('senha')}
                      onBlur={()  => setInputFocus(null)}
                      placeholder="••••••••"
                      className="input-base"
                      style={{ paddingLeft: 38, paddingRight: 44 }}
                      disabled={carregando}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setMostrarSenha(v => !v)}
                      style={{
                        position: 'absolute', right: 12,
                        top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        color: 'var(--navy-300)', cursor: 'pointer',
                        padding: '2px', borderRadius: 4,
                        display: 'flex', alignItems: 'center',
                      }}
                      tabIndex={-1}
                      aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {mostrarSenha
                        ? <EyeOff size={16} />
                        : <Eye     size={16} />
                      }
                    </button>
                  </div>
                </div>

                {/* Mensagem de erro */}
                {erro && (
                  <div className="login-form-field" style={{
                    display: 'flex', alignItems: 'center', gap: '0.625rem',
                    padding: '0.75rem 1rem',
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: 10,
                    color: '#991B1B',
                    fontSize: '0.85rem',
                  }}>
                    <AlertCircle size={15} style={{ flexShrink: 0 }} />
                    <span>{erro}</span>
                  </div>
                )}

                {/* Botão de entrar */}
                <div className="login-form-field" style={{ marginTop: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={carregando}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: '0.625rem',
                      padding: '0.875rem 1.5rem',
                      background: carregando
                        ? 'var(--navy-600)'
                        : 'linear-gradient(135deg, var(--navy-800) 0%, var(--navy-700) 100%)',
                      color: '#FFFFFF',
                      border: '1px solid var(--navy-600)',
                      borderRadius: 12,
                      fontFamily: 'Outfit, sans-serif',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      letterSpacing: '0.02em',
                      cursor: carregando ? 'not-allowed' : 'pointer',
                      transition: 'all 0.25s cubic-bezier(0.22,1,0.36,1)',
                      boxShadow: '0 2px 8px rgba(5,24,56,0.2)',
                    }}
                    onMouseEnter={e => {
                      if (!carregando) {
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 6px 20px rgba(5,24,56,0.28)';
                      }
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = '';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(5,24,56,0.2)';
                    }}
                  >
                    {carregando ? (
                      <>
                        <Spinner tamanho="sm" />
                        <span>Entrando...</span>
                      </>
                    ) : (
                      <>
                        <IconeEntrar />
                        <span>Entrar</span>
                      </>
                    )}
                  </button>
                </div>

              </div>
            </form>
          </div>

          {/* Rodapé */}
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--navy-300)',
            marginTop: '1.5rem',
            fontWeight: 300,
          }}>
            © {new Date().getFullYear()} Casa das Correntes Guanabara Ltda
          </p>
        </div>
      </div>

      {/* CSS para responsividade do layout */}
      <style>{`
        @media (min-width: 1024px) {
          .login-left-panel  { display: flex !important; }
          .login-mobile-logo { display: none !important; }
        }
        @keyframes chainFloat {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50%       { transform: translateY(-8px) rotate(0.5deg); }
        }
      `}</style>
    </div>
  );
}
