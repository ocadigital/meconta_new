import React from 'react';
import { FileText, Plus, Search, Store, Edit2, Check } from 'lucide-react';
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
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
    filteredTransactions, stats, filters, setFilters, incomeCategories, expenseCategories,
    formatCurrency, formatDate, users, handleTogglePaid, handleEditTransaction,
    setShowImportModal, setShowAddModal, DateNavigatorComponent
}) => {
    return (
        <div className="space-y-6">
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
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap gap-4 items-center">
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
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                                <th className="p-4 w-10"></th>
                                <th className="p-4">Data</th>
                                <th className="p-4">Descrição</th>
                                <th className="p-4">Categoria</th>
                                <th className="p-4">Valor</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="p-4 text-center">
                                        <button onClick={(e) => { e.stopPropagation(); handleTogglePaid(t); }} className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${t.isPaid ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 hover:border-gray-400'}`}>
                                            {t.isPaid && <Check className="w-3 h-3" />}
                                        </button>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-700">{formatDate(t.date)}</td>
                                    <td className="p-4">
                                        <p className="font-bold text-gray-900 text-sm">{t.description}</p>
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
                                        <button onClick={() => handleEditTransaction(t)} className="text-gray-400 hover:text-blue-600 p-2"><Edit2 className="w-4 h-4"/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};