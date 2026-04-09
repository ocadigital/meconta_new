
import React, { useState, useEffect } from 'react';
import { User, UserPlan } from '../types';
import { Lock, Mail, User as UserIcon, Eye, EyeOff, ArrowRight, ShieldCheck, Phone, Check, X, Users, Star, Smartphone, Globe } from 'lucide-react';
import { storageService } from '../services/storage';
import { Logo } from './Logo';

interface AuthScreenProps {
  onLogin: (user: User, remember?: boolean) => void;
  users: User[]; 
  onRegister: (user: User) => void;
  initialView?: 'login' | 'register';
  initialPlan?: UserPlan;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onRegister, initialView = 'login', initialPlan = 'basic' }) => {
  const [isLogin, setIsLogin] = useState(initialView === 'login');
  const [showPassword, setShowPassword] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+55');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<UserPlan>(initialPlan);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
      setSelectedPlan(initialPlan);
  }, [initialPlan]);

  useEffect(() => {
      setIsLogin(initialView === 'login');
  }, [initialView]);

  const validatePassword = (pwd: string) => {
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return regex.test(pwd);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value.replace(/\D/g, '');
      if (val.length > 11) val = val.slice(0, 11);
      
      // Mask: (XX) XXXXX-XXXX
      let formatted = val;
      if (val.length > 2) {
          formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
      }
      if (val.length > 7) {
          // Adjust hyphen position based on length (10 vs 11 digits)
          const isMobile = val.length === 11;
          const splitIndex = isMobile ? 10 : 9; // Position in formatted string
          // Re-calculate simply:
          // (XX) X...
          const ddd = val.slice(0, 2);
          const part1 = val.slice(2, isMobile ? 7 : 6);
          const part2 = val.slice(isMobile ? 7 : 6);
          formatted = `(${ddd}) ${part1}-${part2}`;
      }
      
      setPhone(formatted);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (forgotPasswordMode) {
        if (!email) {
          setError("Digite seu email.");
          setIsLoading(false);
          return;
        }
        await storageService.recoverPassword(email);
        setSuccessMsg(`Se o email existir, uma nova senha foi enviada para ${email}`);
        setTimeout(() => {
          setForgotPasswordMode(false);
          setSuccessMsg('');
        }, 5000);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        try {
            const { user } = await storageService.login(email, password);
            if (user) {
                onLogin(user, rememberMe);
            } else {
                setError("Login falhou.");
            }
        } catch (err: any) {
             console.error("Login error:", err);
             const msg = err.message || "Erro desconhecido.";
             
             if (msg.includes('403') || msg.includes('aprov')) {
                setError("Sua conta aguarda aprovação do administrador.");
             } else if (msg.includes('401') || msg.includes('Credenciais') || msg.includes('inválidas')) {
                setError("Email ou senha incorretos.");
             } else if (msg.includes('connection') || msg.includes('fetch')) {
                setError("Erro de conexão com o servidor. Tente novamente.");
             } else {
                setError(`Erro: ${msg}`);
             }
        }
      } else {
        // REGISTER
        if (!name || !email || !password || !phone || !countryCode) {
          setError("Preencha todos os campos, incluindo o telefone completo.");
          setIsLoading(false);
          return;
        }
        if (!validatePassword(password)) {
          setError("Senha fraca: use Maiúscula, minúscula, número e símbolo (@$!%*?&).");
          setIsLoading(false);
          return;
        }
        if (!consent) {
          setError("Aceite os termos.");
          setIsLoading(false);
          return;
        }

        const colors = ['bg-coral-500', 'bg-sage-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500'];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        const id = Date.now().toString();
        
        // Combine country code and phone for storage
        const fullPhone = `${countryCode.trim()} ${phone.trim()}`;

        const newUser: User = {
          id,
          familyId: id,
          name,
          email,
          phone: fullPhone,
          passwordHash: password,
          avatarColor: randomColor,
          plan: selectedPlan 
        };
        
        await onRegister(newUser);
        
        // Auto-login logic
        try {
            const { user } = await storageService.login(email, password);
            onLogin(user, true);
        } catch (loginErr) {
            setSuccessMsg("Cadastro realizado! Faça login para entrar.");
            setIsLogin(true);
        }
      }
    } catch (err: any) {
        const msg = err.message.replace('API Error 400: ', '').replace('API Error 401: ', '');
        setError(msg.includes('JSON') ? "Erro de conexão" : msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full ${isLogin ? 'max-w-md' : 'max-w-2xl'} overflow-hidden flex flex-col relative border border-gray-100 dark:border-gray-700 transition-all`}>
        
        <div className="h-2 w-full bg-gradient-to-r from-coral-500 to-sage-500"></div>

        <div className="w-full p-8">
          <div className="flex justify-center mb-6">
             <Logo className="w-16 h-16" />
          </div>
          
          <h2 className="text-3xl font-extrabold text-center text-charcoal-900 dark:text-white mb-3">
            {forgotPasswordMode ? 'Recuperar Acesso' : (isLogin ? 'MeConta: Quais os lançamentos do dia?' : 'Crie a sua conta bora testar!')}
          </h2>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mb-8">
            {forgotPasswordMode 
              ? 'Informe seu email para receber uma nova senha.' 
              : (isLogin ? 'Gestão financeira familiar simples e inteligente.' : 'Preencha seus dados para liberar seus 7 dias grátis.')}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            {!isLogin && !forgotPasswordMode && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                    <input type="text" placeholder="Nome Completo" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-coral-500 outline-none" required />
                  </div>
                  <div className="relative group flex gap-2">
                    <div className="relative w-28">
                        <Globe className="absolute left-3 top-3.5 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="+55" 
                            value={countryCode} 
                            onChange={(e) => setCountryCode(e.target.value)} 
                            className="w-full pl-9 pr-2 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-coral-500 outline-none font-medium" 
                            required 
                        />
                    </div>
                    <div className="relative flex-1">
                        <Phone className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                        <input 
                            type="tel" 
                            placeholder="(11) 99999-9999" 
                            value={phone} 
                            onChange={handlePhoneChange} 
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-coral-500 outline-none" 
                            required 
                        />
                    </div>
                  </div>
              </div>
            )}

            {!isLogin && !forgotPasswordMode && (
                <div className="space-y-3">
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">Escolha seu Plano (7 dias grátis)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div onClick={() => setSelectedPlan('basic')} className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${selectedPlan === 'basic' ? 'border-coral-500 bg-coral-50 dark:bg-coral-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-2 mb-1"><Smartphone className="w-4 h-4 text-coral-600"/><span className="font-bold text-sm text-gray-900 dark:text-white">Solo</span></div>
                            <p className="text-[10px] text-gray-500">Individual, Essencial.</p>
                        </div>
                        <div onClick={() => setSelectedPlan('family')} className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${selectedPlan === 'family' ? 'border-coral-500 bg-coral-50 dark:bg-coral-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-2 mb-1"><Users className="w-4 h-4 text-coral-600"/><span className="font-bold text-sm text-gray-900 dark:text-white">Família</span></div>
                            <p className="text-[10px] text-gray-500">Até 5 pessoas.</p>
                        </div>
                        <div onClick={() => setSelectedPlan('pro')} className={`cursor-pointer p-3 rounded-xl border-2 transition-all ${selectedPlan === 'pro' ? 'border-coral-500 bg-coral-50 dark:bg-coral-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                            <div className="flex items-center gap-2 mb-1"><Star className="w-4 h-4 text-coral-600"/><span className="font-bold text-sm text-gray-900 dark:text-white">Ultimate</span></div>
                            <p className="text-[10px] text-gray-500">IA Completa + Família.</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="relative group">
              <Mail className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
              <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-coral-500 outline-none" required />
            </div>

            {!forgotPasswordMode && (
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input type={showPassword ? "text" : "password"} placeholder="Sua Senha" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-12 pr-12 py-3 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-coral-500 outline-none" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            )}

            {isLogin && !forgotPasswordMode && (
              <div className="flex items-center gap-2 px-1">
                <input type="checkbox" id="rememberMe" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 text-coral-600 rounded focus:ring-coral-500 border-gray-300 dark:border-gray-600" />
                <label htmlFor="rememberMe" className="text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">Manter conectado</label>
              </div>
            )}

            {!isLogin && !forgotPasswordMode && (
              <div className="space-y-3">
                  <div className="text-xs text-gray-500 flex gap-2 items-start bg-gray-50 dark:bg-gray-700 p-3 rounded-xl border border-gray-100 dark:border-gray-600">
                    <ShieldCheck className="w-4 h-4 text-sage-600 flex-shrink-0 mt-0.5" />
                    <span>Senha: Min 8 chars, maiúscula, minúscula, número e símbolo.</span>
                  </div>
                  <div className="flex items-start gap-2 px-1">
                    <input type="checkbox" id="consent" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4 mt-0.5 text-coral-600 rounded focus:ring-coral-500 border-gray-300 dark:border-gray-600 flex-shrink-0" />
                    <label htmlFor="consent" className="text-xs text-gray-600 dark:text-gray-300 cursor-pointer select-none">
                        Li e concordo com os <button type="button" onClick={() => setShowTerms(true)} className="underline text-coral-600">Termos de Uso</button> e <button type="button" onClick={() => setShowPrivacy(true)} className="underline text-coral-600">Política de Privacidade</button>.
                    </label>
                  </div>
              </div>
            )}

            {error && (
                <div className="flex items-center gap-3 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 animate-in slide-in-from-top-2">
                    <X className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{error}</span>
                </div>
            )}
            {successMsg && <p className="text-sage-700 text-sm text-center bg-sage-50 dark:bg-sage-900/20 p-4 rounded-xl border border-sage-200 font-medium animate-in slide-in-from-top-2">{successMsg}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-coral-500 hover:bg-coral-600 text-white font-bold py-4 rounded-xl disabled:opacity-70 transition-all flex items-center justify-center gap-2 shadow-lg shadow-coral-200 dark:shadow-none hover:scale-[1.02] active:scale-100"
            >
              {isLoading ? 'Processando...' : (forgotPasswordMode ? 'Enviar Nova Senha' : (isLogin ? 'Entrar' : 'Começar Agora (Grátis)'))} 
              {!isLoading && <ArrowRight className="w-5 h-5" />}
            </button>
          </form>

          <div className="mt-8 text-center text-sm space-y-3">
            {!forgotPasswordMode && (
                <>
                    <p className="text-gray-600 dark:text-gray-400">
                    {isLogin ? 'Não tem uma conta? ' : 'Já possui cadastro? '}
                    <button onClick={() => { setIsLogin(!isLogin); setError(''); setSuccessMsg(''); }} className="text-coral-600 dark:text-coral-400 font-bold hover:underline">
                        {isLogin ? 'Cadastre-se grátis' : 'Fazer login'}
                    </button>
                    </p>
                    {isLogin && <button onClick={() => { setForgotPasswordMode(true); setError(''); setSuccessMsg(''); }} className="text-gray-500 hover:text-gray-700 underline text-xs">Esqueci minha senha</button>}
                </>
            )}
            {forgotPasswordMode && <button onClick={() => { setForgotPasswordMode(false); setError(''); setSuccessMsg(''); }} className="text-coral-600 hover:underline font-medium">Voltar para Login</button>}
          </div>
        </div>
      </div>

      {/* Terms Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">Termos de Uso</h3>
                    <button onClick={() => setShowTerms(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
                </div>
                <div className="p-6 overflow-y-auto text-gray-600 space-y-4 text-sm leading-relaxed">
                    <p><strong>1. Aceitação:</strong> Ao utilizar o MeConta, você concorda com estes termos. O serviço é fornecido "como está".</p>
                    <p><strong>2. Uso do Serviço:</strong> Você é responsável por manter sua senha segura. Não compartilhe sua conta com terceiros fora do seu núcleo familiar.</p>
                    <p><strong>3. Pagamentos:</strong> O período de teste é de 7 dias. Após isso, a assinatura será cobrada conforme o plano escolhido. Cancelamentos devem ser feitos antes da renovação.</p>
                    <p><strong>4. Propriedade Intelectual:</strong> Todo o design, código e conteúdo são propriedade exclusiva do MeConta.</p>
                    <p><strong>5. Modificações:</strong> Podemos alterar estes termos a qualquer momento, notificando os usuários via email ou aviso no app.</p>
                    <p>Este é um documento simplificado para fins de demonstração.</p>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button onClick={() => setShowTerms(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entendi</button>
                </div>
            </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">Política de Privacidade</h3>
                    <button onClick={() => setShowPrivacy(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
                </div>
                <div className="p-6 overflow-y-auto text-gray-600 space-y-4 text-sm leading-relaxed">
                    <p><strong>1. Coleta de Dados:</strong> Coletamos apenas os dados necessários para o funcionamento do app: nome, email e dados financeiros inseridos por você.</p>
                    <p><strong>2. Uso de IA:</strong> Ao usar recursos de IA (como leitura de recibos), os dados da imagem são processados temporariamente para extração de informações e não são usados para treinar modelos públicos sem seu consentimento explícito.</p>
                    <p><strong>3. Armazenamento:</strong> Seus dados são armazenados em servidores seguros com criptografia.</p>
                    <p><strong>4. Seus Direitos (LGPD):</strong> Você tem direito a acessar, corrigir, portar e excluir seus dados a qualquer momento através do painel de perfil.</p>
                    <p><strong>5. Contato DPO:</strong> Para questões de privacidade, contate dpo@meconta.app.</p>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button onClick={() => setShowPrivacy(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entendi</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};
