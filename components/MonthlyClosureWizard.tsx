
import React, { useState, useEffect } from 'react';
import { X, ArrowRight, CheckCircle, AlertCircle, Calendar, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { MonthlyClosureStats } from '../types';
import { MONTHS } from '../constants';

interface MonthlyClosureWizardProps {
    month: number;
    year: number;
    onClose: () => void;
    onFinished: () => void;
}

export const MonthlyClosureWizard: React.FC<MonthlyClosureWizardProps> = ({ month, year, onClose, onFinished }) => {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<MonthlyClosureStats | null>(null);
    const [pendingAction, setPendingAction] = useState<{ [id: string]: 'rollover' | 'pay' | 'ignore' }>({});

    useEffect(() => {
        const loadStats = async () => {
            const currentUserId = localStorage.getItem('finance_current_user_id');
            try {
                const res = await fetch(`/api/transactions?mode=closure&month=${month}&year=${year}`, {
                    headers: { 'X-User-Id': currentUserId || '' }
                });
                const data = await res.json();
                setStats(data.stats);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadStats();
    }, [month, year]);

    const handleNext = () => setStep(s => s + 1);

    const handleFinalize = async () => {
        if (!stats) return;
        setLoading(true);
        const currentUserId = localStorage.getItem('finance_current_user_id');
        const idsToRollover = Object.entries(pendingAction).filter(([_, action]) => action === 'rollover').map(([id]) => id);

        try {
            await fetch(`/api/transactions?mode=closure&month=${month}&year=${year}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
                body: JSON.stringify({ 
                    action: 'rollover', pendingIdsToRollover: idsToRollover 
                })
            });
            await fetch(`/api/transactions?mode=closure&month=${month}&year=${year}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
                body: JSON.stringify({ 
                    action: 'close', totalIncome: stats.totalIncome, totalExpense: stats.totalExpense, finalBalance: stats.balance 
                })
            });
            onFinished();
        } catch (e) { alert("Erro ao fechar mês."); setLoading(false); }
    };

    if (loading) return <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center text-white"><RefreshCw className="w-8 h-8 animate-spin"/></div>;
    if (!stats) return null;
    const isSurplus = stats.balance >= 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
            <div className="absolute top-6 right-6"><button onClick={onClose} className="text-white/50 hover:text-white"><X className="w-8 h-8"/></button></div>
            <div className="w-full max-w-lg p-6">
                {step === 0 && (
                    <div className="text-center space-y-8 animate-in slide-in-from-bottom-10">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,0,0,0.3)] ${isSurplus ? 'bg-sage-500 text-white' : 'bg-coral-500 text-white'}`}>{isSurplus ? <TrendingUp className="w-12 h-12" /> : <TrendingDown className="w-12 h-12" />}</div>
                        <div>
                            <h2 className="text-4xl font-extrabold text-white mb-2">{MONTHS[month-1]} Terminou!</h2>
                            <p className="text-xl text-white/80">O saldo da família foi de:</p>
                            <p className={`text-5xl font-extrabold mt-4 ${isSurplus ? 'text-sage-400' : 'text-coral-400'}`}>R$ {Math.abs(stats.balance).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                            <p className="text-sm text-white/50 mt-2 uppercase tracking-widest font-bold">{isSurplus ? 'NO AZUL' : 'NO VERMELHO'}</p>
                        </div>
                        <button onClick={handleNext} className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform flex items-center gap-2 mx-auto">Ver Detalhes <ArrowRight className="w-5 h-5"/></button>
                    </div>
                )}
                {step === 1 && (
                    <div className="space-y-6 animate-in slide-in-from-right-10">
                        <h2 className="text-2xl font-bold text-white text-center mb-8">Destaques do Mês</h2>
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10"><p className="text-gray-400 text-sm font-bold uppercase mb-1">Maior Categoria de Gastos</p><div className="flex justify-between items-end"><span className="text-2xl font-bold text-white">{stats.topCategory.name || 'Nenhuma'}</span><span className="text-xl text-coral-400">R$ {stats.topCategory.value.toLocaleString('pt-BR')}</span></div></div>
                        <div className="bg-gray-800/50 p-6 rounded-2xl border border-white/10"><p className="text-gray-400 text-sm font-bold uppercase mb-1">Quem mais gastou</p><div className="flex justify-between items-end"><span className="text-2xl font-bold text-white">{stats.topSpender.name || 'Ninguém'}</span><span className="text-xl text-coral-400">R$ {stats.topSpender.value.toLocaleString('pt-BR')}</span></div></div>
                        <button onClick={handleNext} className="w-full bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform mt-8">Continuar</button>
                    </div>
                )}
                {step === 2 && (
                    <div className="space-y-4 animate-in slide-in-from-right-10 flex flex-col h-[80vh]">
                        <div className="text-center"><h2 className="text-2xl font-bold text-white">Pendências</h2><p className="text-white/60 text-sm">O que fazer com estas contas que não foram baixadas?</p></div>
                        <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                            {stats.pendingTransactions.length === 0 ? (<div className="text-center text-white/40 py-10">Nenhuma pendência! Tudo limpo. ✨</div>) : stats.pendingTransactions.map(t => {
                                const currentAction = pendingAction[t.id] || 'ignore';
                                return (
                                    <div key={t.id} className="bg-gray-800 p-4 rounded-xl border border-white/10">
                                        <div className="flex justify-between mb-3"><span className="font-bold text-white">{t.description}</span><span className="text-coral-400 font-bold">R$ {t.amount}</span></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setPendingAction({...pendingAction, [t.id]: 'rollover'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${currentAction === 'rollover' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'}`}>Jogar p/ {MONTHS[month]}</button>
                                            <button onClick={() => setPendingAction({...pendingAction, [t.id]: 'ignore'})} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${currentAction === 'ignore' ? 'bg-white/20 text-white' : 'bg-gray-700 text-gray-400'}`}>Manter Pendente</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        <button onClick={handleFinalize} className="w-full bg-sage-500 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-sage-600 transition-transform shadow-[0_0_20px_rgba(80,149,115,0.4)]">Finalizar Mês 🎉</button>
                    </div>
                )}
            </div>
        </div>
    );
};
