import React, { useState, useRef } from 'react';
import { Upload, FileText, CreditCard, X, Wand2, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { BankAccount, Transaction, TransactionType } from '../types';
import { parseStatementPDF, categorizeBatch } from '../services/geminiService';
import { storageService } from '../services/storage';

interface ImportWizardProps {
    accounts: BankAccount[];
    existingTransactions: Transaction[];
    onClose: () => void;
    onImportFinished: () => void;
    categories: string[];
}

interface StagedTransaction {
    id: string; 
    date: string;
    description: string;
    amount: number;
    type: TransactionType;
    category: string;
    selected: boolean;
    isDuplicate: boolean;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({ accounts, existingTransactions, onClose, onImportFinished, categories }) => {
    const [step, setStep] = useState(1);
    const [importType, setImportType] = useState<'OFX' | 'PDF'>('OFX');
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [selectedCard, setSelectedCard] = useState<string>('');
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [stagedTransactions, setStagedTransactions] = useState<StagedTransaction[]>([]);
    const [selectAll, setSelectAll] = useState(true);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const parseOFX = async (text: string): Promise<StagedTransaction[]> => {
        const transactions: StagedTransaction[] = [];
        // Regex to find STMTTRN blocks
        const regex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/g;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const block = match[1];
            const dateMatch = block.match(/<DTPOSTED>(\d{8})/);
            const amountMatch = block.match(/<TRNAMT>([\d.-]+)/);
            // Regex to find MEMO content, explicitly stopping at < or newline
            const memoMatch = block.match(/<MEMO>([^<\r\n]*)/i);

            if (dateMatch && amountMatch) {
                const rawDate = dateMatch[1]; 
                const formattedDate = `${rawDate.slice(0,4)}-${rawDate.slice(4,6)}-${rawDate.slice(6,8)}`;
                const amount = parseFloat(amountMatch[1]);
                const type = amount < 0 ? TransactionType.EXPENSE : TransactionType.INCOME;
                
                // Clean description: take regex group 1 if exists, otherwise default
                let description = memoMatch ? memoMatch[1].trim() : 'Sem Descrição';
                
                transactions.push({
                    id: Math.random().toString(36).substr(2, 9),
                    date: formattedDate,
                    description,
                    amount: Math.abs(amount),
                    type,
                    category: '',
                    selected: true,
                    isDuplicate: false
                });
            }
        }
        return transactions;
    };

    const processFile = async () => {
        if (!file || !selectedAccount) {
            alert("Selecione conta e arquivo.");
            return;
        }
        if (importType === 'PDF' && !selectedCard) {
            alert("Selecione o cartão para importação de fatura.");
            return;
        }

        setLoading(true);
        try {
            let parsed: StagedTransaction[] = [];

            if (importType === 'OFX') {
                const text = await file.text();
                parsed = await parseOFX(text);
            } else {
                const reader = new FileReader();
                const base64Promise = new Promise<string>((resolve, reject) => {
                    reader.onload = () => resolve((reader.result as string).split(',')[1]);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
                const base64 = await base64Promise;
                const result = await parseStatementPDF(base64);
                
                parsed = result.map(r => ({
                    id: Math.random().toString(36).substr(2, 9),
                    date: r.date,
                    description: r.description,
                    amount: r.amount,
                    type: r.type === 'Entrada' ? TransactionType.INCOME : TransactionType.EXPENSE,
                    category: '',
                    selected: true,
                    isDuplicate: false
                }));
            }

            const checked = parsed.map(t => {
                const dup = existingTransactions.some(ex => 
                    ex.date === t.date && 
                    Math.abs(ex.amount) === Math.abs(t.amount) &&
                    (t.description.toLowerCase().includes(ex.description.toLowerCase()) || ex.description.toLowerCase().includes(t.description.toLowerCase()))
                );
                return { ...t, isDuplicate: dup, selected: !dup };
            });

            setStagedTransactions(checked);
            setStep(2);
        } catch (e) {
            console.error(e);
            alert("Erro ao processar arquivo.");
        } finally {
            setLoading(false);
        }
    };

    const handleAICategorize = async () => {
        if (!window.confirm(`Deseja classificar ${stagedTransactions.filter(t => t.selected && !t.category).length} transações com IA?`)) return;
        
        setLoading(true);
        try {
            const toClassify = stagedTransactions.filter(t => t.selected && !t.category).map(t => ({
                description: t.description,
                amount: t.amount
            }));
            
            if (toClassify.length === 0) {
                alert("Nenhuma transação selecionada sem categoria.");
                return;
            }

            const mapping = await categorizeBatch(toClassify, categories);
            
            setStagedTransactions(prev => prev.map(t => {
                if (t.selected && !t.category && mapping[t.description]) {
                    return { ...t, category: mapping[t.description] };
                }
                return t;
            }));

        } catch (e) {
            alert("Erro na classificação IA.");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmImport = async () => {
        const toImport = stagedTransactions.filter(t => t.selected);
        if (toImport.length === 0) return;

        setLoading(true);
        try {
            const userId = localStorage.getItem('finance_current_user_id') || '';
            
            for (const t of toImport) {
                const finalTrans: Transaction = {
                    id: Date.now().toString() + Math.random().toString().slice(2,5),
                    userId,
                    memberId: userId,
                    date: t.date,
                    description: t.description,
                    amount: t.amount,
                    type: t.type,
                    category: t.category || 'Outras - Saída',
                    paymentMethod: importType === 'PDF' ? 'CREDIT' : 'DEBIT',
                    accountId: importType === 'OFX' ? selectedAccount : undefined,
                    cardId: importType === 'PDF' ? selectedCard : undefined,
                    store: '',
                    isFixed: false,
                    isPaid: true,
                    isPrivate: false,
                    isImported: true // Mark as imported
                };
                await storageService.addTransaction(finalTrans);
            }
            onImportFinished();
        } catch (e) {
            alert("Erro ao salvar transações.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        const newVal = !selectAll;
        setSelectAll(newVal);
        setStagedTransactions(prev => prev.map(t => ({ ...t, selected: newVal })));
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" /> 
                            Importação Inteligente
                        </h2>
                        <p className="text-sm text-gray-500">Passo {step} de 2: {step === 1 ? 'Configuração' : 'Revisão e Classificação'}</p>
                    </div>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-400 hover:text-red-500"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-white">
                    {step === 1 ? (
                        <div className="space-y-6 max-w-md mx-auto">
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setImportType('OFX')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${importType === 'OFX' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    <FileText className="w-8 h-8" />
                                    <span className="font-bold text-sm">Extrato Bancário (OFX)</span>
                                </button>
                                <button onClick={() => setImportType('PDF')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${importType === 'PDF' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                                    <CreditCard className="w-8 h-8" />
                                    <span className="font-bold text-sm">Fatura Cartão (PDF)</span>
                                </button>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Conta Bancária</label>
                                <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500">
                                    <option value="">Selecione...</option>
                                    {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name}</option>)}
                                </select>
                            </div>

                            {importType === 'PDF' && (
                                <div className="animate-in slide-in-from-top-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Cartão de Crédito</label>
                                    <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className="w-full p-3 border rounded-xl bg-gray-50 outline-none focus:ring-2 focus:ring-purple-500">
                                        <option value="">Selecione...</option>
                                        {accounts.flatMap(a => a.cards || []).map(card => (
                                            <option key={card.id} value={card.id}>{card.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                                <input ref={fileInputRef} type="file" accept={importType === 'OFX' ? ".ofx" : ".pdf"} className="hidden" onChange={handleFileChange} />
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                {file ? (
                                    <span className="text-blue-600 font-bold">{file.name}</span>
                                ) : (
                                    <>
                                        <p className="font-bold text-gray-600">Clique para selecionar</p>
                                        <p className="text-xs text-gray-400 mt-1">Formatos suportados: {importType === 'OFX' ? '.OFX' : '.PDF'}</p>
                                    </>
                                )}
                            </div>

                            <button onClick={processFile} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50">
                                {loading ? <Loader2 className="animate-spin w-5 h-5"/> : 'Processar Arquivo'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} className="w-5 h-5 text-blue-600 rounded" />
                                    <span className="text-sm font-bold text-gray-600">Selecionar Tudo ({stagedTransactions.filter(t => t.selected).length})</span>
                                </div>
                                <button onClick={handleAICategorize} disabled={loading} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-colors">
                                    {loading ? <Loader2 className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4"/>}
                                    Classificar com IA
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto border rounded-xl">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50 sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 w-10"></th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Data</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Descrição</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Valor</th>
                                            <th className="p-3 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {stagedTransactions.map((t, idx) => (
                                            <tr key={t.id} className={`hover:bg-gray-50 ${t.isDuplicate ? 'bg-yellow-50 hover:bg-yellow-100' : ''}`}>
                                                <td className="p-3 text-center">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={t.selected} 
                                                        onChange={() => setStagedTransactions(prev => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item))} 
                                                        className="w-4 h-4 rounded text-blue-600"
                                                    />
                                                </td>
                                                <td className="p-3 text-sm text-gray-600">{t.date}</td>
                                                <td className="p-3">
                                                    <p className="font-bold text-gray-800 text-sm">{t.description}</p>
                                                    {t.isDuplicate && <span className="text-[10px] bg-yellow-200 text-yellow-800 px-1.5 py-0.5 rounded font-bold flex items-center w-max gap-1 mt-1"><AlertTriangle className="w-3 h-3"/> Duplicidade Possível</span>}
                                                </td>
                                                <td className={`p-3 font-bold text-sm ${t.type === TransactionType.INCOME ? 'text-green-600' : 'text-red-600'}`}>
                                                    {t.type === TransactionType.INCOME ? '+' : '-'} R$ {t.amount.toFixed(2)}
                                                </td>
                                                <td className="p-3">
                                                    <select 
                                                        value={t.category} 
                                                        onChange={(e) => setStagedTransactions(prev => prev.map((item, i) => i === idx ? { ...item, category: e.target.value } : item))}
                                                        className="w-full p-2 border rounded-lg text-xs bg-white"
                                                    >
                                                        <option value="">Selecionar...</option>
                                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button onClick={() => { if (step === 2 && !window.confirm("Cancelar importação?")) return; onClose(); }} className="px-6 py-3 rounded-xl border border-gray-300 font-bold text-gray-600 hover:bg-gray-100">
                        Cancelar
                    </button>
                    {step === 2 && (
                        <button onClick={handleConfirmImport} disabled={loading} className="px-8 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg flex items-center gap-2">
                            {loading ? <Loader2 className="animate-spin w-5 h-5"/> : <CheckCircle className="w-5 h-5"/>}
                            Confirmar Importação
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};