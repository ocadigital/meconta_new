import React, { useState } from 'react';
import { Logo } from './Logo';
import { Check, ArrowRight, Shield, Users, Zap, TrendingUp, MessageCircle, Camera, Star, Menu, X, Smartphone, Lock, DownloadCloud, PieChart, Clock, Bell, UserPlus, Tag, FileText, Wallet, Sparkles, Brain, CalendarRange, Heart } from 'lucide-react';

interface LandingPageProps {
  onStart: (plan?: 'basic' | 'family' | 'pro') => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLogin }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // FAQ Data - Optimized for GEO (Questions users ask AI)
  const faqs = [
    { q: "Como o planejamento anual funciona?", a: "Ao contrário de outros apps, o MeConta entende a diferença entre um gasto 'Único', 'Fixo' (ex: Aluguel) e 'Parcelado'. Ele projeta automaticamente seu saldo para os próximos 12 meses considerando essas nuances." },
    { q: "Funciona bem para casais?", a: "Perfeitamente. O foco do MeConta é a transparência. Vocês têm uma timeline única, sabem quem gastou o que, e somam forças para realizar sonhos juntos." },
    { q: "A classificação automática funciona mesmo?", a: "Sim! Nossa IA analisa a descrição da compra ('Netflix', 'Posto Ipiranga') e atribui a categoria correta (Lazer, Transporte) instantaneamente." },
    { q: "O WhatsApp é seguro?", a: "Sim. Utilizamos a API Oficial do WhatsApp Business (Meta). Seus dados são criptografados de ponta a ponta e a nossa IA processa apenas o texto para extrair números e categorias, sem armazenar conversas pessoais." },
    { q: "Meus dados bancários estão protegidos?", a: "Absolutamente. O MeConta não realiza movimentações bancárias, apenas leitura. Seus dados são armazenados em servidores seguros com criptografia de nível bancário e seguimos rigorosamente a LGPD." }
  ];

  const plans = [
    {
      id: 'basic',
      name: "MeConta Solo",
      price: billingCycle === 'monthly' ? "R$ 9,90" : "R$ 7,90",
      period: "/mês",
      description: "Para quem quer organizar a própria vida.",
      features: [
        "Integração WhatsApp (Limitada)",
        "Importação de Extrato (OFX)",
        "Classificação Automática com IA",
        "Planejamento Anual (Fixo/Parcelado)",
        "Acesso via Web e Mobile"
      ],
      missing: [
        "Gestão Compartilhada (Casal)",
        "Importação de Fatura PDF",
        "Metas dos Sonhos com IA"
      ],
      popular: false,
      buttonVariant: "outline"
    },
    {
      id: 'family',
      name: "MeConta Família",
      price: billingCycle === 'monthly' ? "R$ 29,90" : "R$ 20,00",
      period: "/mês",
      description: "A paz financeira que seu lar merece.",
      features: [
        "Tudo do Plano Solo",
        "Até 5 membros da família",
        "Timeline Familiar Unificada",
        "Importação de Faturas PDF",
        "Integração WhatsApp Completa",
        "Metas Compartilhadas (Sonhos)",
        "Visão de Fluxo de Caixa Futuro"
      ],
      missing: [
        "IA Ilimitada (Recibos)",
        "Prioridade no Suporte",
        "Análise de Investimentos"
      ],
      popular: true,
      badge: "RECOMENDADO PARA CASAIS",
      buttonVariant: "solid"
    },
    {
      id: 'pro',
      name: "MeConta Ultimate",
      price: billingCycle === 'monthly' ? "R$ 49,90" : "R$ 39,99",
      period: "/mês",
      description: "Poder total da IA para suas finanças.",
      features: [
        "Tudo do Plano Família",
        "Leitura de Recibos ILIMITADA",
        "Chatbot Financeiro ILIMITADO",
        "Geração de Imagens de Metas (IA)",
        "Suporte VIP via WhatsApp",
        "Importação Prioritária",
        "Acesso antecipado a novidades"
      ],
      missing: [],
      popular: false,
      buttonVariant: "gradient"
    }
  ];

  return (
    <div className="min-h-screen bg-cream-50 font-sans text-charcoal-900 selection:bg-coral-200">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-100 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center cursor-pointer transform hover:scale-105 transition-transform" onClick={() => window.scrollTo(0, 0)}>
              <Logo className="w-10 h-10" showText={true} />
            </div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#funcionalidades" className="text-gray-600 hover:text-coral-600 font-medium transition-colors">Funcionalidades</a>
              <a href="#sobre" className="text-gray-600 hover:text-coral-600 font-medium transition-colors">Sobre Nós</a>
              <a href="#precos" className="text-gray-600 hover:text-coral-600 font-medium transition-colors">Preços</a>
              <a href="#faq" className="text-gray-600 hover:text-coral-600 font-medium transition-colors">FAQ</a>
              <button onClick={onLogin} className="text-coral-600 font-bold hover:underline">Entrar</button>
              <button onClick={() => onStart()} className="bg-coral-500 hover:bg-coral-600 text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-coral-200 transition-all hover:scale-105 active:scale-95">
                Começar Grátis
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-gray-600 p-2">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 p-4 space-y-4 shadow-xl absolute w-full animate-in slide-in-from-top-10">
             <a href="#funcionalidades" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium p-2 hover:bg-gray-50 rounded-lg">Funcionalidades</a>
             <a href="#sobre" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium p-2 hover:bg-gray-50 rounded-lg">Sobre Nós</a>
             <a href="#precos" onClick={() => setIsMenuOpen(false)} className="block text-gray-600 font-medium p-2 hover:bg-gray-50 rounded-lg">Preços</a>
             <button onClick={() => { setIsMenuOpen(false); onLogin(); }} className="block w-full text-left text-coral-600 font-bold p-2 hover:bg-coral-50 rounded-lg">Entrar</button>
             <button onClick={() => { setIsMenuOpen(false); onStart(); }} className="block w-full bg-coral-500 text-white font-bold p-3 rounded-xl text-center shadow-md">Começar Agora</button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 overflow-hidden relative">
        {/* Background blobs for modern feel */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden -z-10">
            <div className="absolute top-[-10%] right-[-5%] w-[50%] h-[50%] bg-gradient-to-b from-coral-100 to-transparent rounded-full blur-[100px] opacity-60"></div>
            <div className="absolute bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-gradient-to-t from-sage-100 to-transparent rounded-full blur-[100px] opacity-60"></div>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               Feito para Famílias Reais
            </div>
            {/* H1 Optimized for SEO: "Controle Financeiro Familiar" keyword added */}
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight text-charcoal-900 tracking-tight">
              Controle Financeiro Familiar com IA: A Harmonia que sua <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-500 to-orange-500 relative inline-block">Família Precisa</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Acabe com as discussões sobre dinheiro. Tenha transparência total entre o casal, importe extratos em segundos e planeje o futuro com a ajuda da nossa IA.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => onStart()} className="bg-coral-500 hover:bg-coral-600 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-coral-200 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2">
                Criar Conta Familiar <ArrowRight className="w-5 h-5"/>
              </button>
              <button onClick={() => document.getElementById('detalhes')?.scrollIntoView()} className="px-8 py-4 rounded-full font-bold text-gray-600 hover:bg-white bg-white/50 transition-all flex items-center justify-center gap-2 border border-gray-200 hover:border-gray-300">
                Ver Como Funciona
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-6 text-xs text-gray-500 font-bold uppercase tracking-wide">
               <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500"/> Integração WhatsApp</span>
               <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500"/> Sem Planilhas</span>
               <span className="flex items-center gap-1"><Check className="w-4 h-4 text-green-500"/> Fluxo de Caixa Futuro</span>
            </div>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-1000 delay-200 hidden md:block perspective-1000">
             {/* Abstract Dashboard Mockup with 3D Float Effect */}
             <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-gray-100 relative z-10 transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 animate-[float_6s_ease-in-out_infinite]">
                <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-coral-100 rounded-full flex items-center justify-center text-coral-600"><Users className="w-6 h-6"/></div>
                   <div>
                      <p className="text-xs text-gray-400 font-bold uppercase">Orçamento Familiar</p>
                      <p className="text-2xl font-extrabold text-charcoal-900">R$ 8.450,00</p>
                   </div>
                   <div className="ml-auto bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"><MessageCircle className="w-3 h-3"/> Online</div>
                </div>
                
                {/* Simulated Chart */}
                <div className="h-40 bg-gradient-to-b from-gray-50 to-white rounded-xl mb-6 flex items-end justify-between p-4 gap-2 border border-gray-50">
                   {[40, 60, 35, 70, 50, 80, 65].map((h, i) => (
                      <div key={i} style={{height: `${h}%`}} className="w-full bg-gradient-to-t from-coral-400 to-coral-300 rounded-t-md opacity-90"></div>
                   ))}
                </div>

                <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-sm text-lg"><FileText className="w-4 h-4"/></div>
                         <div>
                            <div className="text-sm font-bold">Fatura Nubank (PDF)</div>
                            <div className="text-[10px] text-gray-400">Importado Automaticamente</div>
                         </div>
                      </div>
                      <div className="text-coral-600 font-bold">- R$ 1.250,00</div>
                   </div>
                   <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center shadow-sm text-lg"><MessageCircle className="w-4 h-4"/></div>
                         <div>
                            <div className="text-sm font-bold">Mercado Semanal</div>
                            <div className="text-[10px] text-gray-400">Via Áudio WhatsApp</div>
                         </div>
                      </div>
                      <div className="text-coral-600 font-bold">- R$ 450,90</div>
                   </div>
                </div>
             </div>
             
             {/* Floating Badge */}
             <div className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 flex items-center gap-3 z-20 animate-[bounce_3s_infinite]">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600"><Sparkles className="w-6 h-6"/></div>
                <div>
                   <p className="text-xs text-gray-500 font-bold uppercase">Sonho da Família</p>
                   <p className="text-sm font-bold text-purple-600">Férias Disney 🏰</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
              <span className="text-coral-500 font-bold text-sm uppercase tracking-widest mb-2 block">O Método MeConta</span>
              <h2 className="text-4xl font-extrabold text-charcoal-900 mb-16">Transparência em 4 Passos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                  {/* Connecting Line (Desktop) */}
                  <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-gray-100 -z-10 transform -translate-y-1/2"></div>

                  {[
                      { icon: UserPlus, title: "Convide", desc: "Adicione seu parceiro(a) e filhos para a mesma conta." },
                      { icon: Wallet, title: "Centralize", desc: "Conecte contas e cartões de todos em um só lugar." },
                      { icon: MessageCircle, title: "Simplifique", desc: "Cada um lança seus gastos no WhatsApp ou importa extratos." },
                      { icon: Brain, title: "Planeje", desc: "A IA classifica e projeta o futuro financeiro da família." }
                  ].map((step, i) => (
                      <div key={i} className="flex flex-col items-center group">
                          <div className="w-24 h-24 bg-coral-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border-4 border-white shadow-lg relative z-10">
                              <step.icon className="w-10 h-10 text-coral-500" />
                          </div>
                          <span className="text-coral-300 font-bold text-lg mb-2">0{i+1}</span>
                          <h3 className="text-xl font-bold text-charcoal-900 mb-2">{step.title}</h3>
                          <p className="text-gray-500 text-sm leading-relaxed max-w-[200px]">{step.desc}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* DETAILED FEATURES SECTIONS */}
      <div id="detalhes" className="space-y-24 py-24 bg-cream-50">
         
         {/* Feature 1: AI Classification & WhatsApp */}
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="order-2 lg:order-1 relative">
                 <div className="absolute inset-0 bg-coral-200 rounded-full blur-[100px] opacity-20"></div>
                 <div className="bg-white rounded-[2.5rem] shadow-2xl p-6 border border-gray-100 relative z-10 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                     <div className="space-y-4">
                         <div className="flex gap-4 items-start">
                             <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-green-200"><MessageCircle className="w-5 h-5"/></div>
                             <div className="bg-white p-4 rounded-2xl rounded-tl-none flex-1 shadow-sm border border-gray-50">
                                <p className="text-xs font-bold text-gray-400 mb-1">Pai enviou:</p>
                                <p className="text-gray-600 text-sm italic mb-2">"Gastei 250 no posto shell agora"</p>
                                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                    <div className="bg-sage-100 text-sage-700 px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                                        <Brain className="w-3 h-3"/> Transporte
                                    </div>
                                    <span className="text-coral-500 font-bold text-sm ml-auto">- R$ 250,00</span>
                                </div>
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             <div className="order-1 lg:order-2 space-y-6">
                 <div className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase tracking-wider">Praticidade</div>
                 <h2 className="text-4xl font-extrabold text-charcoal-900">Registre seus gastos <span className="text-green-500">usando o WhatsApp</span></h2>
                 <p className="text-lg text-gray-600 leading-relaxed">
                     Na correria do dia a dia, ninguém quer abrir app e preencher formulário. Com o MeConta, você manda um áudio ou texto pro nosso WhatsApp oficial e a IA faz o trabalho sujo: entende, categoriza e registra.
                 </p>
                 <ul className="space-y-3">
                     <li className="flex items-center gap-3 text-gray-700 font-medium"><Check className="w-5 h-5 text-sage-500"/> Reconhecimento de voz e texto</li>
                     <li className="flex items-center gap-3 text-gray-700 font-medium"><Check className="w-5 h-5 text-sage-500"/> Categorização automática inteligente</li>
                     <li className="flex items-center gap-3 text-gray-700 font-medium"><Check className="w-5 h-5 text-sage-500"/> Zero atrito para o casal</li>
                 </ul>
             </div>
         </div>

         {/* Feature 2: Imports & Automation */}
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
             <div className="space-y-6">
                 <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider">Consolidação</div>
                 <h2 className="text-4xl font-extrabold text-charcoal-900">Todas as contas em <span className="text-purple-600">um só lugar</span></h2>
                 <p className="text-lg text-gray-600 leading-relaxed">
                     Não importa se você usa Nubank e ela Itaú. Importe extratos OFX e faturas PDF de todos os bancos. O MeConta unifica a visão financeira da família, eliminando o "eu paguei isso, você pagou aquilo".
                 </p>
                 <button onClick={() => onStart()} className="text-purple-600 font-bold flex items-center gap-2 hover:gap-3 transition-all group">
                     Testar Importação Grátis <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform"/>
                 </button>
             </div>
             <div className="relative">
                 <div className="bg-white rounded-[2rem] shadow-2xl p-8 border border-gray-100 relative z-10 flex flex-col items-center text-center transform rotate-2 hover:rotate-0 transition-transform duration-500">
                     <div className="w-full h-48 bg-gray-50 rounded-xl mb-6 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group">
                         <FileText className="w-12 h-12 text-gray-300 mb-2 group-hover:scale-110 transition-transform"/>
                         <div className="absolute bottom-4 bg-white/90 px-4 py-1 rounded-full text-xs font-bold shadow-sm text-gray-600">Fatura_Cartao_Final.pdf</div>
                     </div>
                     <div className="w-full space-y-3 text-left">
                         <div className="flex justify-between border-b border-gray-50 pb-2">
                             <span className="text-gray-500 text-sm">Detectado</span>
                             <span className="font-bold text-gray-900">Nubank Roxinho</span>
                         </div>
                         <div className="flex justify-between items-center">
                             <span className="text-gray-500 text-sm">Total Processado</span>
                             <span className="font-extrabold text-2xl text-coral-600">R$ 3.450,20</span>
                         </div>
                     </div>
                     <div className="mt-6 bg-sage-50 text-sage-700 px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2">
                         <Zap className="w-4 h-4 fill-sage-700"/> 42 transações lidas em 3s
                     </div>
                 </div>
             </div>
         </div>
      </div>

      {/* Benefits Grid - UPDATED WITH ANNUAL PLANNING */}
      <section id="funcionalidades" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
           <div className="text-center mb-16">
               <span className="text-coral-500 font-bold text-sm uppercase tracking-widest mb-2 block">Diferenciais Reais</span>
               <h2 className="text-3xl md:text-4xl font-extrabold text-charcoal-900">Por que as famílias escolhem o MeConta?</h2>
               <p className="text-gray-500 mt-4 max-w-2xl mx-auto">Ferramentas pensadas para a realidade financeira brasileira.</p>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                   { icon: CalendarRange, title: "Planejamento Anual Real", desc: "Diferencie gastos 'Fixos' (Aluguel), 'Parcelados' (12x sem juros) e 'Únicos'. O App projeta automaticamente seu saldo para os próximos 12 meses, evitando surpresas.", bg: "bg-blue-50", color: "text-blue-600" },
                   { icon: MessageCircle, title: "Integração WhatsApp", desc: "Envie áudios, textos ou fotos e a IA registra o gasto na hora. A forma mais rápida de manter o controle sem burocracia.", bg: "bg-green-50", color: "text-green-600" },
                   { icon: Brain, title: "Importação Inteligente", desc: "Importe extratos OFX e Faturas em PDF de qualquer banco. A IA lê e classifica tudo automaticamente.", bg: "bg-purple-50", color: "text-purple-600" },
                   { icon: Wallet, title: "Multi-Carteira", desc: "Controle contas bancárias, carteira física e múltiplos cartões de crédito de forma separada e organizada.", bg: "bg-orange-50", color: "text-orange-500" },
                   { icon: Sparkles, title: "Meus Sonhos com IA", desc: "Visualize suas metas! A IA gera imagens inspiradoras dos seus objetivos para motivar a família a poupar.", bg: "bg-pink-50", color: "text-pink-600" },
                   { icon: Users, title: "Timeline Familiar", desc: "Um feed estilo rede social com todas as movimentações da casa. Transparência total entre o casal.", bg: "bg-sage-50", color: "text-sage-600" }
               ].map((feat, i) => (
                   <div key={i} className="bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl transition-all hover:-translate-y-1 group relative overflow-hidden">
                       <div className={`w-14 h-14 rounded-2xl ${feat.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                           <feat.icon className={`w-7 h-7 ${feat.color}`} />
                       </div>
                       <h3 className="text-xl font-bold text-charcoal-900 mb-3">{feat.title}</h3>
                       <p className="text-gray-500 leading-relaxed text-sm">{feat.desc}</p>
                       {i === 0 && <div className="absolute top-4 right-4 bg-blue-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse">DIFERENCIAL</div>}
                   </div>
               ))}
           </div>
        </div>
      </section>

      {/* ABOUT US - NEW SECTION FOR AUTHORITY (GEO) */}
      <section id="sobre" className="py-24 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                  <div className="space-y-6">
                      <span className="text-purple-500 font-bold text-sm uppercase tracking-widest">Sobre Nós</span>
                      <h2 className="text-4xl font-extrabold text-charcoal-900">Tecnologia com Propósito: Unir Famílias</h2>
                      <div className="space-y-4 text-gray-600 leading-relaxed">
                          <p>
                              O MeConta nasceu de uma necessidade real: acabar com as "DRs" financeiras. Acreditamos que o dinheiro deve ser uma ferramenta para realizar sonhos em família, não um motivo de estresse.
                          </p>
                          <p>
                              Utilizamos tecnologia de Inteligência Artificial de ponta (Google Gemini) não apenas para "classificar gastos", mas para entender o contexto da sua vida financeira. Nossa IA aprende que o posto de gasolina "Shell" é transporte, e que a "Disney" é um sonho a ser realizado.
                          </p>
                          <p>
                              Com uma equipe apaixonada por finanças e tecnologia, garantimos segurança de nível bancário e uma experiência que realmente funciona no dia a dia corrido dos brasileiros.
                          </p>
                      </div>
                      <div className="flex gap-8 pt-4">
                          <div>
                              <p className="text-3xl font-extrabold text-charcoal-900">5k+</p>
                              <p className="text-gray-500 text-sm">Famílias Organizadas</p>
                          </div>
                          <div>
                              <p className="text-3xl font-extrabold text-charcoal-900">1.2M</p>
                              <p className="text-gray-500 text-sm">Transações Processadas</p>
                          </div>
                      </div>
                  </div>
                  <div className="relative">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50 -z-10"></div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-cream-50 p-6 rounded-2xl h-48 flex flex-col justify-center items-center text-center">
                              <Heart className="w-10 h-10 text-coral-500 mb-3" />
                              <h3 className="font-bold text-gray-900">Missão</h3>
                              <p className="text-xs text-gray-500 mt-2">Trazer paz e transparência financeira para os lares.</p>
                          </div>
                          <div className="bg-blue-50 p-6 rounded-2xl h-48 flex flex-col justify-center items-center text-center mt-8">
                              <Shield className="w-10 h-10 text-blue-500 mb-3" />
                              <h3 className="font-bold text-gray-900">Segurança</h3>
                              <p className="text-xs text-gray-500 mt-2">Dados criptografados e privacidade em primeiro lugar.</p>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </section>

      {/* Testimonials - WITH PARALLAX */}
      <section className="py-24 bg-charcoal-900 text-white overflow-hidden relative bg-fixed" style={{backgroundImage: "url('https://www.transparenttextures.com/patterns/cubes.png')"}}>
          <div className="absolute inset-0 bg-gradient-to-b from-charcoal-900/90 to-charcoal-900/95"></div>
          
          <div className="max-w-7xl mx-auto px-4 relative z-10">
              <h2 className="text-3xl font-extrabold text-center mb-16">O que as famílias dizem</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {[
                      { name: "Ricardo e Ana", role: "Casados há 5 anos", text: "A função de lançamentos parcelados salvou nosso ano. Antes a gente esquecia as compras parceladas e o cartão vinha uma surpresa. Agora o app projeta tudo." },
                      { name: "Patrícia S.", role: "Mãe Solo", text: "Eu amo a função 'Sonhos'. Ver a imagem da minha viagem gerada pela IA me ajuda muito a guardar dinheiro e não gastar com bobagem." },
                      { name: "Família Costa", role: "4 Membros", text: "O plano família anual vale muito a pena. Controle total dos cartões de todos e sem brigas no fim do mês. A transparência mudou nossa relação." }
                  ].map((t, i) => (
                      <div key={i} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-coral-500/50 transition-colors">
                          <div className="flex gap-1 mb-4 text-yellow-400">
                              {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 fill-current"/>)}
                          </div>
                          <p className="text-gray-300 italic mb-6 leading-relaxed">"{t.text}"</p>
                          <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-coral-500 to-purple-600 flex items-center justify-center font-bold">{t.name.charAt(0)}</div>
                              <div>
                                  <p className="font-bold text-white text-sm">{t.name}</p>
                                  <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">{t.role}</p>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* Pricing Section */}
      <section id="precos" className="py-24 bg-cream-50 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-4 relative z-10">
            <div className="text-center mb-16">
               <h2 className="text-3xl md:text-4xl font-extrabold text-charcoal-900 mb-6">Investimento que se Paga</h2>
               <p className="text-gray-500 max-w-xl mx-auto mb-8">Escolha o plano ideal para o tamanho do seu sonho.</p>
               
               {/* Toggle */}
               <div className="flex items-center justify-center gap-4">
                  <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-charcoal-900' : 'text-gray-400'}`}>Mensal</span>
                  <button onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')} className="w-16 h-8 bg-coral-500 rounded-full p-1 relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-coral-500 ring-offset-cream-50">
                     <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                  </button>
                  <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-charcoal-900' : 'text-gray-400'}`}>Anual <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full ml-1">MELHOR PREÇO</span></span>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
               {plans.map((plan, i) => (
                  <div key={i} className={`bg-white rounded-[2rem] p-8 relative flex flex-col ${plan.popular ? 'shadow-2xl ring-4 ring-coral-500 transform md:-translate-y-4' : 'shadow-lg border border-gray-100 opacity-95 hover:opacity-100 transition-opacity'}`}>
                     {plan.popular && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-coral-500 text-white px-4 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-lg">
                           {plan.badge}
                        </div>
                     )}
                     <div className="text-center mb-8">
                        <h3 className="text-lg font-bold text-gray-500 uppercase tracking-wider mb-2">{plan.name}</h3>
                        <div className="flex items-center justify-center text-charcoal-900">
                           <span className="text-4xl font-extrabold">{plan.price}</span>
                           <span className="text-gray-400 font-medium ml-1">{plan.period}</span>
                        </div>
                        <p className="text-sm text-gray-400 mt-2">{plan.description}</p>
                     </div>

                     <div className="space-y-4 flex-1 mb-8">
                        {plan.features.map((feat, idx) => (
                           <div key={idx} className="flex items-start gap-3">
                              <Check className="w-5 h-5 text-sage-500 flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-medium text-gray-700">{feat}</span>
                           </div>
                        ))}
                        {plan.missing.map((miss, idx) => (
                           <div key={idx} className="flex items-start gap-3 opacity-50">
                              <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                              <span className="text-sm font-medium text-gray-400">{miss}</span>
                           </div>
                        ))}
                     </div>

                     <button onClick={() => onStart(plan.id as any)} className={`w-full py-4 rounded-xl font-bold transition-all ${
                        plan.buttonVariant === 'solid' 
                           ? 'bg-coral-500 hover:bg-coral-600 text-white shadow-lg shadow-coral-200' 
                           : (plan.buttonVariant === 'gradient' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg' : 'border-2 border-gray-200 text-gray-700 hover:border-coral-500 hover:text-coral-600')
                     }`}>
                        Começar Teste Gratuito
                     </button>
                  </div>
               ))}
            </div>
         </div>
      </section>
      
      {/* FAQ */}
      <section id="faq" className="py-24 bg-white">
          <div className="max-w-3xl mx-auto px-4">
              <h2 className="text-3xl font-extrabold text-center mb-12 text-charcoal-900">Perguntas Frequentes</h2>
              <div className="space-y-6">
                  {faqs.map((f, i) => (
                      <div key={i} className="bg-cream-50 p-6 rounded-2xl border border-gray-100 hover:border-coral-200 transition-colors">
                          <h3 className="text-lg font-bold text-gray-900 mb-2">{f.q}</h3>
                          <p className="text-gray-600 text-sm leading-relaxed">{f.a}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>

      {/* CTA Footer */}
      <footer className="bg-charcoal-900 text-white py-20 border-t border-gray-800 relative overflow-hidden">
         <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-coral-500 to-purple-600"></div>
         <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
             <h2 className="text-3xl md:text-5xl font-extrabold mb-6">Sua Família Merece Essa Paz</h2>
             <p className="text-gray-400 mb-10 text-lg">Junte-se a milhares de famílias que organizaram as finanças e pararam de brigar por dinheiro.</p>
             <button onClick={() => onStart()} className="bg-coral-500 hover:bg-coral-600 text-white px-10 py-5 rounded-full font-bold text-xl shadow-xl shadow-coral-900/50 transition-all hover:scale-105">
                Criar Conta Grátis
             </button>
             
             <div className="mt-16 pt-12 border-t border-gray-800 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
                 <div className="flex flex-col items-center md:items-start gap-4">
                     <div className="flex items-center gap-2 opacity-80"><Logo className="w-6 h-6" isDark /> <span className="font-bold text-white">MeConta</span></div>
                     <p>&copy; 2024 MeConta Inc.</p>
                     <p className="text-xs">CNPJ: 27.010.924/0001-25</p>
                 </div>
                 
                 <div className="flex flex-col items-center gap-2">
                     <h4 className="font-bold text-gray-300 uppercase tracking-wider text-xs mb-2">Legal</h4>
                     <button onClick={() => setShowTermsModal(true)} className="hover:text-white transition-colors">Termos de Uso</button>
                     <button onClick={() => setShowPrivacyModal(true)} className="hover:text-white transition-colors">Política de Privacidade</button>
                     <button onClick={() => setShowPrivacyModal(true)} className="hover:text-white transition-colors">LGPD</button>
                 </div>

                 <div className="flex flex-col items-center md:items-end gap-2">
                     <h4 className="font-bold text-gray-300 uppercase tracking-wider text-xs mb-2">Contato</h4>
                     <a href="mailto:suporte@meconta.app" className="hover:text-white transition-colors">suporte@meconta.app</a>
                     <p className="text-xs">Horário: Seg-Sex 9h às 18h</p>
                 </div>
             </div>
         </div>
      </footer>

      {/* MODALS */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">Termos de Uso</h3>
                    <button onClick={() => setShowTermsModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
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
                    <button onClick={() => setShowTermsModal(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entendi</button>
                </div>
            </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-gray-900">Política de Privacidade</h3>
                    <button onClick={() => setShowPrivacyModal(false)}><X className="w-6 h-6 text-gray-500 hover:text-gray-800"/></button>
                </div>
                <div className="p-6 overflow-y-auto text-gray-600 space-y-4 text-sm leading-relaxed">
                    <p><strong>1. Coleta de Dados:</strong> Coletamos apenas os dados necessários para o funcionamento do app: nome, email e dados financeiros inseridos por você.</p>
                    <p><strong>2. Uso de IA:</strong> Ao usar recursos de IA (como leitura de recibos ou WhatsApp), os dados são processados temporariamente para extração de informações e não são usados para treinar modelos públicos sem seu consentimento explícito.</p>
                    <p><strong>3. Armazenamento:</strong> Seus dados são armazenados em servidores seguros com criptografia.</p>
                    <p><strong>4. Seus Direitos (LGPD):</strong> Você tem direito a acessar, corrigir, portar e excluir seus dados a qualquer momento através do painel de perfil.</p>
                    <p><strong>5. Contato DPO:</strong> Para questões de privacidade, contate dpo@meconta.app.</p>
                </div>
                <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
                    <button onClick={() => setShowPrivacyModal(false)} className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold">Entendi</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};