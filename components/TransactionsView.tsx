import React, { useState, useMemo } from 'react';
import { FileText, Plus, Search, Store, Edit2, CheckCircle, ArrowUp, ArrowDown, ChevronUp, ChevronDown, Trash2, X, Circle, Copy } from 'lucide-react';
import { Transaction, TransactionType, User } from '../types';

interface TransactionsViewProps {
    filteredTransactions: Transaction[];
    stats: any;
    filters: any;
    setFilters: (filters: any) => void;
    incomeCategories: string[];
    expenseCategories: string[];
    formatCurrency: (val: number) => string;
    formatDate: (date: string) => string;
    users: User[];
    handleTogglePaid: (t: Transaction) => void;
    handleEditTransaction: (t: Transaction) => void;
    setShowImportModal: (show: boolean) => void;
    setShowAddModal: (show: boolean) => void;
    DateNavigatorComponent: React.ReactNode;
    onDeleteTransactions: (ids: string[]) => void;
    onDuplicateTransaction: (t: Transaction) => void;
}

type SortKey = 'date' | 'description' | 'category' | 'amount' | 'isPaid';

export const TransactionsView: React.FC<TransactionsViewProps> = ({
    filteredTransactions, stats, filters, setFilters, incomeCategories, expenseCategories,
    formatCurrency, formatDate, users, handleTogglePaid, handleEditTransaction,
    setShowImportModal, setShowAddModal, DateNavigatorComponent, onDeleteTransactions, onDuplicateTransaction
}) => {
    const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleSort = (key: SortKey) => {
        setSortConfig(current => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const sortedTransactions = useMemo(() => {
        const sorted = [...filteredTransactions];
        sorted.sort((a, b) => {
            let valA: any = a[sortConfig.key as keyof Transaction];
            let valB: any = b[sortConfig.key as keyof Transaction];

            if (sortConfig.key === 'date') {
                valA = new Date(a.date).getTime();
                valB = new Date(b.date).getTime();
            } else if (sortConfig.key === 'description') {
                valA = a.description.toLowerCase();
                valB = b.description.toLowerCase();
            }

            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredTransactions, sortConfig]);

    const SortIcon = ({ column }: { column: SortKey }) => {
        if (sortConfig.key !== column) return <ChevronDown className="w-3 h-3 text-gray-300 opacity-50" />;
        return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-blue-600" /> : <ChevronDown className="w-3 h-3 text-blue-600" />;
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(sortedTransactions.map(t => t.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const confirmDelete = () => {
        onDeleteTransactions(selectedIds);
        setSelectedIds([]);
        setShowDeleteModal(false);
    };

    return (
        <div className="space-y-6 relative min-h-[500px]">
            {/* Header with Date Nav */}
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Lançamentos</h2>
                    <p className="text-gray-500">Gerencie todos os detalhes.</p>
                </div>
                <div className="flex items-center gap-3">
                    {DateNavigatorComponent}
                    <button onClick={() => setShowImportModal(true)} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 shadow-md transition-transform hover:scale-105 flex items-center gap-2 text-sm font-bold"><FileText className="w-5 h-5"/> Importar</button>
                    <button onClick={() => setShowAddModal(true)} className="bg-green-700 text-white p-2.5 rounded-xl hover:bg-green-800 shadow-md transition-transform hover:scale-105"><Plus className="w-6 h-6"/></button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex flex-wrap gap-4 items-center">
                    <select value={filters.type} onChange={e => setFilters({...filters, type: e.target.value})} className="p-2 border rounded-lg text-sm bg-gray-50 font-medium text-gray-700 min-w-[120px]">
                        <option value="all">Todos os Tipos</option><option value="income">Entradas</option><option value="expense">Saídas</option>
                    </select>
                    <select value={filters.status} onChange={e => setFilters({...filters, status: e.target.value})} className="p-2 border rounded-lg text-sm bg-gray-50 font-medium text-gray-700 min-w-[120px]">
                        <option value="all">Todos os Status</option><option value="paid">Pago</option><option value="pending">Pendente</option>
                    </select>
                    <select value={filters.category} onChange={e => setFilters({...filters, category: e.target.value})} className="p-2 border rounded-lg text-sm bg-gray-50 font-medium text-gray-700 min-w-[140px]">
                        <option value="all">Todas as Categorias</option>
                        {[...incomeCategories, ...expenseCategories].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <div className="flex-1 relative">
                        <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400"/>
                        <input type="text" placeholder="Buscar..." value={filters.search} onChange={e => setFilters({...filters, search: e.target.value})} className="w-full pl-10 p-2 border rounded-lg text-sm bg-gray-50" />
                    </div>
                </div>
                
                {/* Second Row: Source Filter */}
                <div className="flex gap-2">
                    <button 
                        onClick={() => setFilters({...filters, source: 'all'})} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filters.source === 'all' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        Todas as Origens
                    </button>
                    <button 
                        onClick={() => setFilters({...filters, source: 'manual'})} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filters.source === 'manual' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        Manuais
                    </button>
                    <button 
                        onClick={() => setFilters({...filters, source: 'imported'})} 
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${filters.source === 'imported' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}
                    >
                        Importadas
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl">
                    <p className="text-xs font-bold text-emerald-700 uppercase mb-1">RECEBIDO</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.received)}</p>
                </div>
                <div className="bg-white border-2 border-dashed border-emerald-200 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">A RECEBER</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.toReceive)}</p>
                </div>
                <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                    <p className="text-xs font-bold text-red-700 uppercase mb-1">PAGO</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.paid)}</p>
                </div>
                <div className="bg-white border-2 border-dashed border-red-200 p-4 rounded-xl">
                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">A PAGAR</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(stats.toPay)}</p>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden pb-16">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="p-4 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                        checked={sortedTransactions.length > 0 && selectedIds.length === sortedTransactions.length}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('date')}>
                                    <div className="flex items-center gap-1">Data <SortIcon column="date"/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('description')}>
                                    <div className="flex items-center gap-1">Descrição <SortIcon column="description"/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1">Categoria <SortIcon column="category"/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('amount')}>
                                    <div className="flex items-center gap-1">Valor <SortIcon column="amount"/></div>
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors group" onClick={() => handleSort('isPaid')}>
                                    <div className="flex items-center gap-1">Status <SortIcon column="isPaid"/></div>
                                </th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {sortedTransactions.map(t => (
                                <tr key={t.id} className={`hover:bg-gray-50 group transition-colors ${selectedIds.includes(t.id) ? 'bg-blue-50' : ''}`}>
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                            checked={selectedIds.includes(t.id)}
                                            onChange={() => handleSelectRow(t.id)}
                                        />
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-700">{formatDate(t.date)}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900 text-sm">{t.description}</p>
                                        {t.isImported && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-1 font-bold">Importado</span>}
                                        <div className="flex gap-2 mt-1">
                                            <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{users.find(u => u.id === t.memberId)?.name || 'User'}</span>
                                            {t.store && <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1"><Store className="w-3 h-3"/> {t.store}</span>}
                                        </div>
                                    </td>
                                    <td className="p-4"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded font-medium">{t.category}</span></td>
                                    <td className={`p-4 font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                        {t.type === TransactionType.INCOME ? '+' : '-'} {formatCurrency(t.amount)}
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${t.isPaid ? 'bg-red-100 text-red-700' : 'border border-gray-200 text-gray-500'}`}>
                                            {t.isPaid ? 'Pago' : 'A Pagar'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={(e) => { e.stopPropagation(); handleTogglePaid(t); }} className="text-gray-400 hover:text-green-600 p-2" title={t.isPaid ? "Marcar como pendente" : "Marcar como pago"}>
                                                {t.isPaid ? <CheckCircle className="w-5 h-5 text-green-600" /> : <Circle className="w-5 h-5" />}
                                            </button>
                                            <button onClick={() => onDuplicateTransaction(t)} className="text-gray-400 hover:text-indigo-600 p-2" title="Duplicar">
                                                <Copy className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => handleEditTransaction(t)} className="text-gray-400 hover:text-blue-600 p-2" title="Editar">
                                                <Edit2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Floating Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-full shadow-2xl border border-gray-200 px-6 py-3 flex items-center gap-6 z-40 animate-in slide-in-from-bottom-4">
                    <span className="font-bold text-gray-700 text-sm">{selectedIds.length} selecionados</span>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <button 
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 font-bold text-sm transition-colors"
                    >
                        <Trash2 className="w-4 h-4" /> Excluir
                    </button>
                    <button 
                        onClick={() => setSelectedIds([])}
                        className="ml-2 p-1 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>
            )}

            {/* Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-in zoom-in-95">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir {selectedIds.length} Itens?</h3>
                            <p className="text-gray-500 text-sm mb-6">Esta ação é irreversível e irá atualizar o saldo das contas vinculadas.</p>
                            
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmDelete}
                                    className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition-colors"
                                >
                                    Sim, Excluir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};