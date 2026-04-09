
import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, Wallet, Target, Clock, PieChart as PieChartIcon, AlertTriangle, Users, CheckCircle, FileDown, Bell, User as UserIcon } from 'lucide-react';
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip, Bar, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { Transaction, User, TransactionType } from '../types';

const COLORS = ['#f43f5e', '#509573', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];

interface DashboardViewProps {
    stats: any;
    dashboardCharts: any;
    filteredTransactions: Transaction[];
    users: User[];
    dashboardScope: 'family' | 'personal';
    setDashboardScope: (scope: 'family' | 'personal') => void;
    handleCloseMonth: () => void;
    handlePrintReport: () => void;
    activeNotifications: any[];
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    currentDate: Date;
    DateNavigatorComponent: React.ReactNode;
    formatCurrency: (val: number) => string;
    setShowAddModal: (show: boolean) => void;
    formatDate: (date: string) => string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
    stats, dashboardCharts, dashboardScope, setDashboardScope,
    handleCloseMonth, handlePrintReport, activeNotifications, showNotifications, setShowNotifications,
    DateNavigatorComponent, formatCurrency, filteredTransactions
}) => {
    
    // Top 7 Expenses for Chart
    const topExpensesData = useMemo(() => {
        return filteredTransactions
            .filter(t => t.type === TransactionType.EXPENSE)
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 7)
            .map(t => ({
                name: t.description.length > 15 ? t.description.substring(0,12) + '...' : t.description,
                fullDesc: t.description,
                value: t.amount
            }));
    }, [filteredTransactions]);

    const realizedBalance = stats.received - stats.paid;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Minha Visão</h2>
                    <div className="flex gap-2 mt-2">
                        <button onClick={() => setDashboardScope('personal')} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${dashboardScope === 'personal' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200'}`}><UserIcon className="w-3 h-3 inline mr-1"/> Pessoal</button>
                        <button onClick={() => setDashboardScope('family')} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${dashboardScope === 'family' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200'}`}><Users className="w-3 h-3 inline mr-1"/> Família</button>
                    </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <button onClick={handleCloseMonth} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-indigo-200 transition-transform hover:scale-105 active:scale-95">
                        <CheckCircle className="w-4 h-4"/> Fechar Mês
                    </button>
                    <button onClick={handlePrintReport} className="bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 shadow-sm transition-colors" title="Baixar Relatório">
                        <FileDown className="w-5 h-5"/>
                    </button>
                    <div className="relative">
                        <button onClick={() => setShowNotifications(!showNotifications)} className="bg-white hover:bg-gray-50 text-gray-700 p-2.5 rounded-xl border border-gray-200 shadow-sm transition-colors">
                            <Bell className="w-5 h-5"/>
                            {activeNotifications.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">{activeNotifications.length}</span>}
                        </button>
                    </div>
                    {DateNavigatorComponent}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-4">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600"><TrendingUp className="w-5 h-5"/></div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">Entradas</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-1">{formatCurrency(stats.income)}</h3>
                    <p className="text-xs text-gray-400">Recebido: {formatCurrency(stats.received)} | {stats.income > 0 ? Math.round((stats.received/stats.income)*100) : 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-4">
                        <div className="bg-red-100 p-2 rounded-lg text-red-600"><TrendingDown className="w-5 h-5"/></div>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500 font-bold">Saídas</span>
                    </div>
                    <h3 className="text-2xl font-extrabold text-gray-900 mb-1">{formatCurrency(stats.expense)}</h3>
                    <p className="text-xs text-gray-400">Pago: {formatCurrency(stats.paid)} | {stats.expense > 0 ? Math.round((stats.paid/stats.expense)*100) : 0}%</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Wallet className="w-5 h-5"/></div>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Planejado</span>
                    </div>
                    <h3 className={`text-2xl font-extrabold mb-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(stats.balance)}</h3>
                    <p className="text-xs text-gray-400 font-bold">Realizado: <span className={realizedBalance >= 0 ? 'text-green-600' : 'text-red-600'}>{formatCurrency(realizedBalance)}</span></p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-indigo-100 p-1.5 rounded-full text-indigo-600"><Target className="w-4 h-4"/></div>
                            <h3 className="font-bold text-sm text-gray-800">Progresso Financeiro</h3>
                        </div>
                        <div className="flex gap-8 text-xs font-bold">
                            <span className="text-gray-500">Recebimentos <span className="text-gray-900">{stats.income > 0 ? Math.round((stats.received/stats.income)*100) : 0}%</span></span>
                            <span className="text-gray-500">Pagamentos <span className="text-gray-900">{stats.expense > 0 ? Math.round((stats.paid/stats.expense)*100) : 0}%</span></span>
                        </div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex">
                        <div style={{width: `${stats.income > 0 ? Math.min((stats.received/stats.income)*100, 100) : 0}%`}} className="h-full bg-green-500"></div>
                    </div>
                    <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden flex mt-2">
                        <div style={{width: `${stats.expense > 0 ? Math.min((stats.paid/stats.expense)*100, 100) : 0}%`}} className="h-full bg-red-500"></div>
                    </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><Clock className="w-4 h-4 text-gray-400"/> Comparativo vs Mês Anterior</h3>
                            <div className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Entradas ↗ 8.3%</div>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={dashboardCharts.comparisonData} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                                <YAxis hide/>
                                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                <Bar dataKey="Entradas" fill="#509573" radius={[4, 4, 0, 0]} barSize={32}/>
                                <Bar dataKey="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={32}/>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                        <div className="flex justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2"><PieChartIcon className="w-4 h-4 text-gray-400"/> Distribuição de Gastos</h3>
                            <p className="text-xs text-gray-400">Onde você gastou mais este mês</p>
                        </div>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie data={dashboardCharts.donutData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                                    {dashboardCharts.donutData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0}/>
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '10px', color: '#64748b'}} iconSize={8} iconType="circle"/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
            </div>

            {/* TOP 7 CHART */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-gray-800 text-sm">Top 7 Maiores Gastos</h3>
                    <p className="text-xs text-gray-400">Transações únicas</p>
                </div>
                <ResponsiveContainer width="100%" height="85%">
                    <BarChart data={topExpensesData} layout="vertical" margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                        <XAxis type="number" hide/>
                        <YAxis type="category" dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} width={100} axisLine={false} tickLine={false}/>
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(val: number) => formatCurrency(val)}/>
                        <Bar dataKey="value" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={20}>
                            {topExpensesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={`rgba(244, 63, 94, ${1 - (index * 0.1)})`} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-1 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500"/> Anomalias de Gastos</h3>
                        <p className="text-xs text-gray-400 mb-4">Top 3 mudanças em relação à média</p>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                                <div><p className="font-bold text-sm text-gray-800">Serviço Prestado</p><p className="text-xs text-gray-500">Média: R$ 3.900</p></div>
                                <div className="text-right"><p className="font-bold text-red-600">+R$ 7.300,00 ↗</p><p className="text-[10px] text-red-500 font-bold">+187%</p></div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div><p className="font-bold text-sm text-gray-800">Outras - Saída</p><p className="text-xs text-gray-500">Média: R$ 1.783</p></div>
                                <div className="text-right"><p className="font-bold text-green-600">-R$ 1.583,33 ↘</p><p className="text-[10px] text-green-500 font-bold">-89%</p></div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500"/> Resumo por Pessoa</h3>
                        <div className="space-y-6">
                            {Object.entries(dashboardCharts.byPerson).map(([person, total]: [string, any]) => (
                                <div key={person}>
                                    <div className="flex justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs">{person.charAt(0)}</div>
                                            <div><p className="font-bold text-sm">{person}</p><p className="text-[10px] text-gray-400">Conta Atual</p></div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-red-600 text-xs">{formatCurrency(total)}</p>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-2">
                                        <div style={{width: `${(total / dashboardCharts.maxPersonSpent) * 100}%`}} className="h-full bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-80">
                    <h3 className="font-bold text-gray-800 text-sm mb-6">Evolução Anual (Previsto vs Realizado)</h3>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={dashboardCharts.evolutionData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} dy={10}/>
                            <YAxis tick={{fontSize: 10, fill: '#64748b'}} axisLine={false} tickLine={false} tickFormatter={(val: number) => `R$${val/1000}k`}/>
                            <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                            <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '20px'}}/>
                            <Line type="monotone" dataKey="PrevistoEntrada" stroke="#86efac" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                            <Line type="monotone" dataKey="PrevistoSaída" stroke="#fca5a5" strokeDasharray="5 5" dot={false} strokeWidth={2}/>
                            <Line type="monotone" dataKey="RealizadoEntrada" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}/>
                            <Line type="monotone" dataKey="RealizadoSaída" stroke="#ef4444" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}}/>
                        </LineChart>
                    </ResponsiveContainer>
            </div>
        </div>
    );
};