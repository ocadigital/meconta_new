import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Lock, Unlock, ShoppingBag, ArrowUpRight, ArrowDownRight, User, Target, Sparkles } from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface FeedItem extends Omit<Transaction, 'type'> {
    type: TransactionType | 'Meta';
    userName: string;
    avatarColor: string;
    isPrivate: boolean;
    reactions: { [key: string]: number };
    userReaction: string | null;
    isGoal?: boolean;
    imageUrl?: string;
}

export const FamilyFeed: React.FC = () => {
    const [feed, setFeed] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeed = async () => {
        try {
            const currentUserId = localStorage.getItem('finance_current_user_id');
            const res = await fetch('/api/transactions?mode=feed', {
                headers: { 'X-User-Id': currentUserId || '' }
            });
            if (res.ok) {
                const data = await res.json();
                setFeed(data);
            }
        } catch (e) {
            console.error("Failed to load feed");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);

    const toggleReaction = async (transactionId: string, type: 'LIKE' | 'CLAP') => {
        setFeed(prev => prev.map(item => {
            if (item.id === transactionId) {
                const hasReacted = item.userReaction === type;
                const newCount = (item.reactions[type] || 0) + (hasReacted ? -1 : 1);
                return { ...item, userReaction: hasReacted ? null : type, reactions: { ...item.reactions, [type]: newCount } };
            }
            return item;
        }));

        try {
            const currentUserId = localStorage.getItem('finance_current_user_id');
            await fetch('/api/transactions?mode=reaction', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-User-Id': currentUserId || '' },
                body: JSON.stringify({ transactionId, reactionType: type })
            });
        } catch (e) { fetchFeed(); }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-400">Carregando novidades da família...</div>;
    if (feed.length === 0) return <div className="flex flex-col items-center justify-center py-12 text-gray-400"><ShoppingBag className="w-12 h-12 mb-2 opacity-20" /><p>Nenhuma atividade recente.</p></div>;

    return (
        <div className="space-y-6 max-w-3xl">
            {feed.map((item) => {
                const isGoal = item.isGoal || item.type === 'Meta';
                const isIncome = item.type === TransactionType.INCOME;

                return (
                    <div key={item.id} className={`bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border ${isGoal ? 'border-purple-200 dark:border-purple-900/30 ring-1 ring-purple-100 dark:ring-purple-900/20' : 'border-gray-100 dark:border-gray-700'} relative overflow-hidden group hover:shadow-md transition-all`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${item.avatarColor}`}>{item.userName.charAt(0).toUpperCase()}</div>
                                <div><p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{item.userName}</p><p className="text-xs text-gray-500">{formatTime(item.date)}</p></div>
                            </div>
                            {item.isPrivate && <Lock className="w-3 h-3 text-gray-300" />}
                        </div>
                        <div className="pl-13 ml-1">
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`p-1.5 rounded-lg ${isGoal ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}>
                                        {isGoal ? <Target className="w-4 h-4" /> : (isIncome ? <ArrowUpRight className="w-4 h-4 text-green-600"/> : <ArrowDownRight className="w-4 h-4 text-red-500"/>)}
                                    </span>
                                    <span className="font-medium text-gray-800 dark:text-gray-200">{item.description}</span>
                                </div>
                                <span className={`font-extrabold text-lg ${isGoal ? 'text-purple-600' : (isIncome ? 'text-sage-600' : 'text-coral-600')}`}>
                                    {isGoal ? 'Alvo: ' : (isIncome ? '+' : '-')} R$ {item.amount.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                                </span>
                            </div>
                            
                            <div className="flex gap-2 mb-3">
                                <span className={`text-xs px-2 py-1 rounded ${isGoal ? 'bg-purple-50 text-purple-500 font-bold' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>{item.category}</span>
                                {item.store && <span className="text-xs bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded text-gray-500 dark:text-gray-400 flex items-center gap-1">{isGoal ? 'Objetivo' : 'Store'}: {item.store}</span>}
                            </div>

                            {/* Show Image for Goals */}
                            {isGoal && item.imageUrl && (
                                <div className="mt-3 mb-4 rounded-xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative group/image">
                                    <img src={item.imageUrl} alt="Meta Visual" className="w-full h-48 object-cover transform group-hover/image:scale-105 transition-transform duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                    <div className="absolute bottom-3 left-3 text-white flex items-center gap-2">
                                        <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse"/>
                                        <span className="text-xs font-bold shadow-black drop-shadow-md">Meta Visualizada</span>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-4 pt-3 border-t border-gray-50 dark:border-gray-700">
                                <button onClick={() => toggleReaction(item.id, 'LIKE')} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${item.userReaction === 'LIKE' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}><Heart className={`w-4 h-4 ${item.userReaction === 'LIKE' ? 'fill-current' : ''}`} />{item.reactions['LIKE'] || 0}</button>
                                <button onClick={() => toggleReaction(item.id, 'CLAP')} className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${item.userReaction === 'CLAP' ? 'text-blue-500' : 'text-gray-400 hover:text-blue-500'}`}><span>👏</span>{item.reactions['CLAP'] || 0}</button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};