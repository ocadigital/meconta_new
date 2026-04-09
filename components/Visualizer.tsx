import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Sparkles, Download, Plus, Trash2, Edit2, Check, X, Share2, DollarSign, ToggleLeft, ToggleRight, Save, Loader2, Target } from 'lucide-react';
import { generateGoalImage } from '../services/geminiService';
import { storageService } from '../services/storage';
import { LoadingOverlay } from './LoadingOverlay';
import { ImageSize, Goal } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const Visualizer: React.FC = () => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [view, setView] = useState<'list' | 'form'>('list');
  const [loading, setLoading] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(true);

  // Form State
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [size, setSize] = useState<ImageSize>('1K');
  const [isPublic, setIsPublic] = useState(true); // Default true for feed publish

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      const data = await storageService.getGoals();
      setGoals(data);
    } catch (e) {
      console.error("Failed to load goals", e);
    } finally {
      setLoadingGoals(false);
    }
  };

  const handleGenerate = async () => {
    if (!description) return;
    setLoading(true);
    try {
      const fullPrompt = `Uma imagem realista e inspiradora representando esta meta financeira: ${description}. Estilo cinematográfico, alta qualidade.`;
      const result = await generateGoalImage(fullPrompt, size);
      setGeneratedImage(result);
    } catch (e) {
      alert("Erro ao gerar imagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoalId(goal.id);
    setDescription(goal.description);
    setAmount(goal.amount.toString().replace('.', ','));
    setGeneratedImage(goal.imageUrl);
    setIsPublic(goal.isPublic);
    setView('form');
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta meta?")) return;
    try {
        await storageService.deleteGoal(id);
        setGoals(prev => prev.filter(g => g.id !== id));
    } catch(e) {
        alert("Erro ao excluir meta.");
    }
  };

  const handleSave = async () => {
    if (!description || !amount || !generatedImage) {
        alert("Preencha a descrição, valor e gere uma imagem.");
        return;
    }

    const numericAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
    if (isNaN(numericAmount)) {
        alert("Valor inválido.");
        return;
    }

    setLoading(true);
    try {
        const goalData: Partial<Goal> = {
            id: editingGoalId || Date.now().toString(),
            description,
            amount: numericAmount,
            imageUrl: generatedImage,
            isPublic
        };

        await storageService.saveGoal(goalData);
        await fetchGoals();
        setView('list');
        resetForm();
    } catch (e: any) {
        if (e.message.includes('Limite')) {
            alert(e.message);
        } else {
            alert("Erro ao salvar meta.");
        }
    } finally {
        setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingGoalId(null);
    setDescription('');
    setAmount('');
    setGeneratedImage(null);
    setIsPublic(true);
  };

  const handleCreateNew = () => {
      if (goals.length >= 5) {
          alert("Você atingiu o limite de 5 metas. Exclua uma para criar nova.");
          return;
      }
      resetForm();
      setView('form');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const number = parseInt(value) / 100;
    setAmount(number.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  if (view === 'list') {
      return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-purple-500"/> Meus Sonhos</h2>
                    <p className="text-sm text-gray-500">Visualize e materialize seus objetivos ({goals.length}/5).</p>
                </div>
                <button 
                    onClick={handleCreateNew} 
                    disabled={goals.length >= 5}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl font-bold shadow-lg shadow-purple-200 dark:shadow-none flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Plus className="w-5 h-5" /> Nova Meta
                </button>
            </div>

            {loadingGoals ? (
                <div className="p-12 text-center text-gray-400"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-2"/>Carregando metas...</div>
            ) : goals.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-700">
                    <ImageIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">Nenhuma meta criada ainda</h3>
                    <p className="text-gray-500 mb-6">Comece agora a visualizar seu futuro!</p>
                    <button onClick={handleCreateNew} className="text-purple-600 font-bold hover:underline">Criar Primeira Meta</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {goals.map(goal => (
                        <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 group hover:shadow-md transition-all">
                            <div className="h-48 overflow-hidden relative">
                                <img src={goal.imageUrl} alt={goal.description} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(goal)} className="p-2 bg-white/90 rounded-full hover:bg-white text-gray-700"><Edit2 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(goal.id)} className="p-2 bg-white/90 rounded-full hover:bg-white text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="absolute bottom-3 left-3 bg-black/60 text-white px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1">
                                    {goal.isPublic ? <Share2 className="w-3 h-3" /> : <X className="w-3 h-3"/>} {goal.isPublic ? 'No Feed' : 'Privado'}
                                </div>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2">{goal.description}</h3>
                                <div className="flex items-center gap-2 text-purple-600">
                                    <Target className="w-5 h-5" />
                                    <p className="font-extrabold text-xl">{formatCurrency(goal.amount)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      );
  }

  // FORM VIEW
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      {loading && <LoadingOverlay message={editingGoalId ? "Salvando meta..." : "Gerando visualização..."} />}
      
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6" />
          <h2 className="text-xl font-bold">{editingGoalId ? 'Editar Meta' : 'Nova Meta Visual'}</h2>
        </div>
        <button onClick={() => setView('list')} className="text-white/80 hover:text-white"><X className="w-6 h-6"/></button>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Qual é o seu sonho?</label>
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ex: Uma casa moderna na praia ao pôr do sol..."
                        className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none h-24 text-sm"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Valor da Meta</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                        <input 
                            type="text" 
                            value={amount} 
                            onChange={handleAmountChange} 
                            placeholder="0,00" 
                            className="w-full pl-10 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:outline-none font-bold text-gray-800 dark:text-white"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Qualidade da Imagem</label>
                    <div className="flex gap-2">
                        {(['1K', '2K', '4K'] as ImageSize[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`flex-1 py-2 text-xs font-bold rounded-lg border ${
                            size === s 
                                ? 'bg-purple-100 border-purple-500 text-purple-700' 
                                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-500'
                            }`}
                        >
                            {s}
                        </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={!description}
                    className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 shadow-md"
                >
                    <ImageIcon className="w-5 h-5" />
                    {generatedImage ? 'Gerar Nova Imagem' : 'Gerar Imagem IA'}
                </button>
            </div>

            <div className="flex flex-col h-full">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Prévia</label>
                <div className="flex-1 bg-gray-100 dark:bg-gray-900 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center overflow-hidden relative min-h-[250px]">
                    {generatedImage ? (
                        <img src={generatedImage} alt="Preview" className="w-full h-full object-cover absolute inset-0" />
                    ) : (
                        <div className="text-center text-gray-400">
                            <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">A imagem aparecerá aqui</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="pt-6 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            <button 
                onClick={() => setIsPublic(!isPublic)} 
                className={`flex items-center gap-3 px-4 py-2 rounded-xl transition-colors border ${isPublic ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}
            >
                {isPublic ? <ToggleRight className="w-6 h-6 fill-blue-600 text-white" /> : <ToggleLeft className="w-6 h-6" />}
                <span className="font-bold text-sm">Publicar no Feed da Família</span>
            </button>

            <div className="flex gap-3 w-full md:w-auto">
                <button onClick={() => setView('list')} className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-600 font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Cancelar
                </button>
                <button onClick={handleSave} className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" /> Salvar Meta
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};