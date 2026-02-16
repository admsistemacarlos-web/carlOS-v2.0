
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  
  // Ref para focar na senha se o email já estiver preenchido
  const passwordInputRef = useRef<HTMLInputElement>(null);
  
  // Estado para lembrar o e-mail
  const [rememberEmail, setRememberEmail] = useState(false);

  // Se já estiver logado, redireciona
  useEffect(() => {
    if (user) {
      navigate('/fork');
    }
  }, [user, navigate]);

  // Carregar e-mail salvo ao montar
  useEffect(() => {
    const savedEmail = localStorage.getItem('carlos_auth_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
      // Se já tem email, foca na senha para agilizar
      setTimeout(() => {
        passwordInputRef.current?.focus();
      }, 100);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const cleanEmail = email.trim();

    // Lógica de Lembrar E-mail
    if (rememberEmail) {
      localStorage.setItem('carlos_auth_email', cleanEmail);
    } else {
      localStorage.removeItem('carlos_auth_email');
    }

    try {
      if (isSignUp) {
        // Fluxo de Cadastro
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          navigate('/fork');
        } else if (data.user) {
          setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
          setIsSignUp(false); // Volta para login para o usuário tentar entrar após confirmar (ou ver a msg)
        }
      } else {
        // Fluxo de Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) throw error;

        if (data.session) {
          navigate('/fork');
        }
      }
    } catch (err: any) {
      let msg = err.message || 'Erro desconhecido.';
      
      // Tratamento robusto de mensagens de erro
      if (msg.includes('Invalid login credentials')) msg = 'Email ou senha incorretos.';
      else if (msg.includes('User already registered')) msg = 'Este email já está cadastrado.';
      else if (msg.includes('Email not confirmed')) msg = 'Email não confirmado. Verifique sua caixa de entrada.';
      else if (msg.includes('Password should be at least')) msg = 'A senha deve ter pelo menos 6 caracteres.';
      
      setError(msg);
      // Log discreto para debug se necessário, mas não como erro principal
      console.log('Auth error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md bg-card p-10 rounded-[2.5rem] border border-border shadow-premium animate-fade-in">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-semibold text-foreground mb-3 tracking-tighter">
            carlOS
          </h1>
          <p className="text-muted-foreground font-medium text-sm tracking-tight">
            {isSignUp ? 'Crie sua conta para começar' : 'Faça login para continuar'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5" autoComplete="on">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-sm">
              {message}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-[11px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="username email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground placeholder-stone-400 focus:ring-2 focus:ring-olive/20 focus:border-primary/30 outline-none transition-all"
              placeholder="exemplo@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[11px] font-bold text-foreground uppercase tracking-widest mb-2 ml-1">
              Senha
            </label>
            <input
              id="password"
              ref={passwordInputRef}
              type="password"
              name="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full bg-secondary border border-border rounded-2xl p-4 text-foreground placeholder-stone-400 focus:ring-2 focus:ring-olive/20 focus:border-primary/30 outline-none transition-all"
              placeholder="******"
            />
          </div>

          {/* Opção Lembrar E-mail */}
          <div className="flex items-center gap-2 pl-1">
            <input
              type="checkbox"
              id="rememberEmail"
              checked={rememberEmail}
              onChange={(e) => setRememberEmail(e.target.checked)}
              className="w-4 h-4 rounded border-border text-deep-blue focus:ring-olive/30 cursor-pointer"
            />
            <label htmlFor="rememberEmail" className="text-xs font-medium text-muted-foreground cursor-pointer select-none">
              Lembrar meu e-mail neste dispositivo
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-deep-blue hover:bg-black text-cream font-bold py-4 rounded-2xl transition-all mt-4 shadow-lg shadow-deep-blue/10 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processando...' : (isSignUp ? 'Criar Conta' : 'Acessar Sistema')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => { setIsSignUp(!isSignUp); setError(''); setMessage(''); }}
            className="text-xs font-bold text-olive uppercase tracking-widest hover:underline"
          >
            {isSignUp ? 'Já tem uma conta? Fazer Login' : 'Não tem conta? Cadastre-se'}
          </button>
        </div>

        <div className="mt-10 text-center">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-relaxed px-4">
            Dica: Salve a senha no navegador para usar biometria no próximo acesso.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
