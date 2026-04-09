import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle, RefreshCw, Sparkles, Clipboard } from 'lucide-react';
import { analyzeReceipt } from '../services/geminiService';
import { Transaction } from '../types';

interface ReceiptUploaderProps {
  onDataExtracted: (data: any) => void;
  onImageSelected: (base64: string) => void;
  availableCategories: string[];
  transactionHistory: Transaction[];
}

type UploadStatus = 'idle' | 'analyzing' | 'success' | 'error';

export const ReceiptUploader: React.FC<ReceiptUploaderProps> = ({ 
  onDataExtracted, 
  onImageSelected,
  availableCategories,
  transactionHistory
}) => {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enable pasting images
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (status !== 'idle') return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) processFile(blob);
          break;
        }
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [status]);

  const getHistoryContext = () => {
    if (!transactionHistory || transactionHistory.length === 0) return "";

    const storeStats: Record<string, { [category: string]: number }> = {};
    const storeDisplayNames: Record<string, string> = {}; 

    // Ordenar histórico do mais recente para o mais antigo
    const sortedHistory = [...transactionHistory]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 1. Análise de Frequência (Padrões de Lojas)
    sortedHistory.slice(0, 500).forEach(t => {
      const entityName = t.store || t.description;
      if (!entityName || !t.category) return;
      
      const normalizedKey = entityName.trim().toLowerCase();
      
      if (!storeDisplayNames[normalizedKey]) {
        storeDisplayNames[normalizedKey] = entityName.trim();
      }
      if (!storeStats[normalizedKey]) {
        storeStats[normalizedKey] = {};
      }
      storeStats[normalizedKey][t.category] = (storeStats[normalizedKey][t.category] || 0) + 1;
    });

    const storePatterns: { name: string, category: string, count: number }[] = [];

    Object.keys(storeStats).forEach(storeKey => {
      const categories = storeStats[storeKey];
      const bestCategory = Object.keys(categories).reduce((a, b) => 
        categories[a] > categories[b] ? a : b
      );
      
      storePatterns.push({ 
          name: storeDisplayNames[storeKey], 
          category: bestCategory, 
          count: Object.values(categories).reduce((sum, val) => sum + val, 0)
      });
    });

    storePatterns.sort((a, b) => b.count - a.count);

    const patternsString = storePatterns.slice(0, 40).map(p => {
       return `"${p.name}" costuma ser "${p.category}"`;
    }).join("; ");

    // 2. Contexto Imediato (Últimas transações)
    const recentTransactionsString = sortedHistory.slice(0, 15).map(t => {
        const typeLabel = t.type === 'Entrada' ? '(Entrada)' : ''; 
        return `[${t.date}] ${t.description} R$${t.amount} ${typeLabel}`;
    }).join("; ");

    return `Padrões de consumo frequentes (Loja->Categoria): ${patternsString}. \nHistórico recentíssimo para contexto: ${recentTransactionsString}`;
  };

  const processFile = (file: File) => {
    setStatus('analyzing');
    setErrorMsg(null);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.floor(Math.random() * 10) + 2;
      });
    }, 300);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      const base64Data = base64String.split(',')[1];
      const mimeType = base64String.match(/data:([^;]*);/)?.[1] || 'image/jpeg';
      
      setPreviewUrl(base64String);
      onImageSelected(base64String);

      try {
        const historyContext = getHistoryContext();
        const extractedData = await analyzeReceipt(
          base64Data, 
          mimeType,
          availableCategories,
          historyContext
        );
        
        clearInterval(progressInterval);
        setProgress(100);
        
        if (extractedData) {
          setStatus('success');
          setTimeout(() => {
            onDataExtracted(extractedData);
          }, 1500);
        } else {
          throw new Error("Dados não encontrados");
        }
      } catch (err: any) {
        clearInterval(progressInterval);
        console.error("Receipt error:", err);
        setStatus('error');
        let msg = "Não foi possível ler o recibo. Tente novamente ou insira manualmente.";
        if (err.message) {
            if (err.message.includes('LIMIT_REACHED')) {
                msg = "Limite do plano atingido.";
                throw err;
            } else if (err.message.includes('API Key')) {
                msg = "Erro de Configuração: API Key não encontrada no servidor.";
            } else {
                msg = err.message;
            }
        }
        setErrorMsg(msg);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setStatus('idle');
    setPreviewUrl(null);
    setErrorMsg(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      <div 
        className={`relative w-full h-56 rounded-2xl overflow-hidden border-2 border-dashed transition-all group ${
          status === 'idle' 
            ? 'border-coral-200 dark:border-gray-600 hover:bg-coral-50 dark:hover:bg-gray-700/30 bg-white dark:bg-gray-800 cursor-pointer' 
            : 'border-transparent bg-gray-100 dark:bg-gray-800'
        }`}
        onClick={() => status === 'idle' && fileInputRef.current?.click()}
      >
        
        {/* IDLE STATE */}
        {status === 'idle' && (
          <>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="p-4 bg-coral-100 dark:bg-coral-900/30 rounded-full text-coral-600 dark:text-coral-400 group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8" />
              </div>
              <div className="text-center px-4">
                 <p className="text-base font-bold text-gray-700 dark:text-gray-200">
                    Toque para escanear
                 </p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] mx-auto">
                    A IA detecta loja, data e valor automaticamente.
                 </p>
                 <div className="hidden md:flex items-center justify-center gap-1 mt-2 text-[10px] text-gray-400 bg-gray-50 px-2 py-1 rounded-full w-max mx-auto">
                    <Clipboard className="w-3 h-3"/> ou cole (Ctrl+V)
                 </div>
              </div>
            </div>
          </>
        )}

        {/* PREVIEW & STATES */}
        {previewUrl && (
          <>
            <img 
              src={previewUrl} 
              alt="Recibo" 
              className={`w-full h-full object-cover transition-all duration-500 ${status !== 'idle' ? 'scale-105' : ''}`} 
            />
            
            {/* ANALYZING OVERLAY */}
            {status === 'analyzing' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md transition-opacity p-6">
                <div className="relative mb-4">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
                    <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Analisando Recibo...</p>
                <p className="text-gray-300 text-xs mb-4">Extraindo informações com IA</p>
                
                {/* Progress Bar */}
                <div className="w-full max-w-[200px] bg-gray-700 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-blue-400 to-purple-500 h-full transition-all duration-300 ease-out" 
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-gray-400 text-[10px] mt-2 font-mono">{progress}%</p>
              </div>
            )}

            {/* SUCCESS OVERLAY */}
            {status === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-sage-600/95 backdrop-blur-md transition-all duration-500 animate-in fade-in">
                <div className="bg-white rounded-full p-3 mb-3 shadow-xl animate-bounce">
                   <CheckCircle className="w-10 h-10 text-sage-600" />
                </div>
                <p className="text-white font-extrabold text-2xl tracking-tight">Sucesso!</p>
                <p className="text-white/90 text-sm mt-1 font-medium">Dados extraídos e preenchidos.</p>
              </div>
            )}

            {/* ERROR OVERLAY */}
            {status === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-600/90 backdrop-blur-md transition-opacity p-6 text-center">
                <div className="bg-white/10 p-3 rounded-full mb-3">
                    <AlertCircle className="w-10 h-10 text-white" />
                </div>
                <p className="text-white font-bold text-lg mb-1">Ops! Algo deu errado</p>
                <p className="text-white/80 text-xs mb-6 px-4">{errorMsg}</p>
                <button 
                  onClick={handleRetry}
                  className="bg-white text-red-600 px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-100 transition-colors shadow-xl active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" /> Tentar Novamente
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};