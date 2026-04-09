import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Shield, Loader2 } from 'lucide-react';
import { storageService } from '../services/storage';

export const AdminPanel: React.FC = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const data = await storageService.getAllUsersAdmin();
            setUsers(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadUsers();
    }, []);

    const toggleStatus = async (userId: string, currentStatus: boolean) => {
        try {
            await storageService.updateUserStatus(userId, { isApproved: !currentStatus });
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, isApproved: !currentStatus } : u));
        } catch (e) {
            alert("Erro ao atualizar status");
        }
    };

    if (loading) return <div className="p-12 text-center text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Carregando usuários...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2"><Shield className="w-6 h-6 text-blue-600"/> Painel Administrativo</h2>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                        <tr>
                            <th className="p-4">Usuário</th>
                            <th className="p-4">Plano</th>
                            <th className="p-4">Cadastro</th>
                            <th className="p-4">Indicado Por</th>
                            <th className="p-4 text-center">Status</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-gray-50">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full ${u.avatarColor} flex items-center justify-center text-white font-bold text-xs`}>
                                            {u.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm text-gray-900">{u.name}</p>
                                            <p className="text-xs text-gray-500">{u.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="text-xs font-bold bg-blue-50 text-blue-600 px-2 py-1 rounded uppercase">{u.plan}</span>
                                </td>
                                <td className="p-4 text-sm text-gray-600">
                                    {new Date(u.createdAt).toLocaleDateString()}
                                </td>
                                <td className="p-4 text-sm font-medium text-purple-600">
                                    {u.referrerName || '-'}
                                </td>
                                <td className="p-4 text-center">
                                    {u.isApproved 
                                        ? <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full"><CheckCircle className="w-3 h-3"/> Ativo</span>
                                        : <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full"><XCircle className="w-3 h-3"/> Pendente</span>
                                    }
                                </td>
                                <td className="p-4 text-right">
                                    <button 
                                        onClick={() => toggleStatus(u.id, u.isApproved)}
                                        className={`text-xs font-bold px-3 py-1.5 rounded transition-colors ${u.isApproved ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                                    >
                                        {u.isApproved ? 'Bloquear' : 'Aprovar'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};