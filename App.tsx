import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Calendar, Wallet, MessageCircle, Image as ImageIcon,
  Settings, AlertTriangle, LogOut, Shield, Menu, X, LayoutDashboard, MessageSquare, Bell, FileText, Lock, Trash2, CheckCircle, Store, Tag, AlignLeft, DollarSign, Edit2, Ban, Eye, PanelLeft
} from 'lucide-react';
import { Transaction, TransactionType, User, BankAccount, BankAccountType, CardBrand, PaymentMethod } from './types';
import { MONTHS, APP_VERSION } from './constants';
import { ReceiptUploader } from './components/ReceiptUploader';
import { ChatAssistant } from './components/ChatAssistant';
import { Visualizer } from './components/Visualizer';
import { AuthScreen } from './components/AuthScreen';
import { LandingPage } from './components/LandingPage';
import { Logo } from './components/Logo';
import { FamilyFeed } from './components/FamilyFeed';
import { MonthlyClosureWizard } from './components/MonthlyClosureWizard';
import { ImportWizard } from './components/ImportWizard';
import { storageService } from './services/storage';
import { generateMonthlyReport } from './services/reportService';
import { DebugSuite } from './components/DebugSuite';
import { DateNavigator } from './components/DateNavigator';
import { DashboardView } from './components/DashboardView';
import { TransactionsView } from './components/TransactionsView';

// --- Helper Functions ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return '';
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('pt-BR').format(date);
  } catch (e) {
    return dateString || '';
  }
};

const parseDate = (dateString: string | null | undefined): Date => {
  if (!dateString) return new Date();
  try {
    if (dateString.includes('T')) return new Date(dateString);
    const parts = dateString.split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts.map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(dateString);
  } catch (e) { return new Date(); }
};

const safeInitial = (name?: string) => (name || '?').charAt(0).toUpperCase();

const translateAccountType = (type: string) => {
    if (type === 'CHECKING') return 'Banco';
    if (type === 'WALLET') return 'Carteira';
    if (type === 'SAVINGS') return 'Poupança';
    if (type === 'INVESTMENT') return 'Investimento';
    return type;
};

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allUsersAdmin, setAllUsersAdmin] = useState<User[]>([]); 
  const [showAuthScreen, setShowAuthScreen] = useState(false); 
  const [authInitialView, setAuthInitialView] = useState<'login' | 'register'>('login');
  
  // Data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [ignoredNotifications, setIgnoredNotifications] = useState<string[]>([]);
  
  // UI
  const [view, setView] = useState<'dashboard' | 'feed' | 'chat' | 'visualizer' | 'categories' | 'transactions' | 'profile' | 'admin' | 'wallet' | 'debug'>('dashboard');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false); 
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [showClosureWizard, setShowClosureWizard] = useState(false);
  const [closureTargetDate, setClosureTargetDate] = useState<{month: number, year: number} | null>(null);
  const [dashboardScope, setDashboardScope] = useState<'family' | 'personal'>('family');
  
  // Profile Modals
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Forms
  const [profileForm, setProfileForm] = useState({ name: '', phone: '', avatarColor: '' });
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean, transaction: Transaction | null }>({ isOpen: false, transaction: null });
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentConfirmAccount, setPaymentConfirmAccount] = useState('');
  const [paymentConfirmCard, setPaymentConfirmCard] = useState('');
  const [paymentConfirmMethod, setPaymentConfirmMethod] = useState<PaymentMethod>('DEBIT');

  // Categories Form
  const [newCategoryName, setNewCategoryName] = useState('');

  // Transaction Form
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null); 
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [store, setStore] = useState(''); 
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(''); 
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [category, setCategory] = useState<string>('');
  const [recurrenceMode, setRecurrenceMode] = useState<'single' | 'fixed' | 'installment'>('single');
  const [installmentTotal, setInstallmentTotal] = useState<number>(2);
  const [frequencyMonths, setFrequencyMonths] = useState<number[]>([new Date().getMonth() + 1]); 
  const [isPaid, setIsPaid] = useState(false); 
  const [isPrivate, setIsPrivate] = useState(false); 
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined); 
  const [notes, setNotes] = useState(''); 
  const [selectedMember, setSelectedMember] = useState<string>(''); 
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('DEBIT');
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedCard, setSelectedCard] = useState<string>(''); 
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Account Form
  const [accountForm, setAccountForm] = useState<{
      id?: string, name: string, type: BankAccountType | 'CREDIT_CARD', color: string, balance: string, 
      brand: CardBrand, limit: string, closingDay: string, dueDay: string, accountId?: string
  }>({ name: '', type: 'CHECKING', color: 'bg-blue-600', balance: '', brand: 'MASTERCARD', limit: '', closingDay: '', dueDay: '' });

  // Filters - Added 'source'
  const [filters, setFilters] = useState({ type: 'all', status: 'all', category: 'all', search: '', source: 'all' });
  const [toastMessage, setToastMessage] = useState<{text: string, type: 'success' | 'error'} | null>(null);

  // Init
  useEffect(() => {
    const init = async () => {
        const storedId = storageService.getRememberedUserId();
        if (storedId) {
            storageService.setCurrentSessionUser(storedId);
            await loadData();
        }
    };
    init();
  }, []);

  useEffect(() => {
    if (currentUser) {
        setProfileForm({ name: currentUser.name, phone: currentUser.phone || '', avatarColor: currentUser.avatarColor });
        loadIgnoredNotifications();
    }
  }, [currentUser]);

  const loadIgnoredNotifications = async () => {
      const ignored = await storageService.getIgnoredAlerts();
      setIgnoredNotifications(ignored);
  };

  useEffect(() => {
      if (view === 'admin' && currentUser?.isAdmin) {
          const loadAdmin = async () => {
              try {
                  const users = await storageService.getAllUsersAdmin();
                  setAllUsersAdmin(users);
              } catch(e) { console.error(e); }
          };
          loadAdmin();
      }
  }, [view, currentUser]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
      setToastMessage({ text, type });
      setTimeout(() => setToastMessage(null), 3000);
  };

  const loadData = async () => {
      setIsLoadingData(true);
      try {
          const [us, ts, cats, accs] = await Promise.all([
              storageService.getUsers(),
              storageService.getTransactions(),
              storageService.getCategories(),
              storageService.getAccounts()
          ]);
          setUsers(us);
          setTransactions(ts);
          setIncomeCategories(cats.income);
          setExpenseCategories(cats.expense);
          setAccounts(accs);
          
          const currentId = localStorage.getItem('finance_current_user_id');
          const me = us.find(u => u.id === currentId);
          if (me) setCurrentUser(me);
      } catch(e) { console.error(e); }
      finally { setIsLoadingData(false); }
  };

  const handleLogin = (user: User, remember: boolean = false) => {
      setCurrentUser(user);
      if (remember) storageService.rememberUserId(user.id);
      else storageService.setCurrentSessionUser(user.id);
      loadData();
      setShowAuthScreen(false);
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setTransactions([]);
      storageService.clearRememberedUser();
      setView('dashboard');
      setShowAuthScreen(false);
  };

  // --- CATEGORIES LOGIC ---
  const handleAddCategory = async (type: 'income' | 'expense') => {
      if (!newCategoryName.trim()) return;
      
      const updatedIncome = type === 'income' ? [...incomeCategories, newCategoryName] : incomeCategories;
      const updatedExpense = type === 'expense' ? [...expenseCategories, newCategoryName] : expenseCategories;
      
      try {
          await storageService.saveCategories(updatedIncome, updatedExpense);
          setIncomeCategories(updatedIncome);
          setExpenseCategories(updatedExpense);
          setNewCategoryName('');
          showToast('Categoria adicionada!');
      } catch (e) {
          showToast('Erro ao salvar categoria', 'error');
      }
  };

  const handleDeleteCategory = async (type: 'income' | 'expense', category: string) => {
      // Validation: Check if transactions exist
      const inUse = transactions.some(t => t.category === category);
      if (inUse) {
          showToast(`Não é possível excluir: existem lançamentos em "${category}".`, 'error');
          return;
      }

      if (!window.confirm(`Excluir categoria "${category}"?`)) return;

      const updatedIncome = type === 'income' ? incomeCategories.filter(c => c !== category) : incomeCategories;
      const updatedExpense = type === 'expense' ? expenseCategories.filter(c => c !== category) : expenseCategories;

      try {
          await storageService.saveCategories(updatedIncome, updatedExpense);
          setIncomeCategories(updatedIncome);
          setExpenseCategories(updatedExpense);
          showToast('Categoria excluída!');
      } catch (e) {
          showToast('Erro ao excluir categoria', 'error');
      }
  };

  const handleEditCategory = async (type: 'income' | 'expense', oldName: string) => {
      const newName = window.prompt("Novo nome da categoria:", oldName);
      if (!newName || newName === oldName) return;

      const list = type === 'income' ? incomeCategories : expenseCategories;
      const updatedList = list.map(c => c === oldName ? newName : c);

      const updatedIncome = type === 'income' ? updatedList : incomeCategories;
      const updatedExpense = type === 'expense' ? updatedList : expenseCategories;

      try {
          await storageService.saveCategories(updatedIncome, updatedExpense);
          setIncomeCategories(updatedIncome);
          setExpenseCategories(updatedExpense);
          showToast('Categoria renomeada!');
      } catch (e) {
          showToast('Erro ao renomear', 'error');
      }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);
      try {
          if(!currentUser) return;
          const updated = { ...currentUser, ...profileForm };
          await storageService.saveUsers([updated]);
          setCurrentUser(updated);
          showToast("Perfil atualizado!");
      } catch(e: any) { showToast("Erro ao atualizar", "error"); }
      finally { setIsSubmitting(false); }
  };

  const handleAccountSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (accountForm.type === 'CREDIT_CARD') {
              if (!accountForm.accountId) throw new Error("Selecione uma conta vinculada");
              await storageService.saveCard({
                  id: accountForm.id || Date.now().toString(),
                  accountId: accountForm.accountId,
                  name: accountForm.name,
                  type: 'CREDIT',
                  brand: accountForm.brand,
                  limit: parseFloat(accountForm.limit.replace(/\./g, '').replace(',', '.')) || 0,
                  closingDay: parseInt(accountForm.closingDay),
                  dueDay: parseInt(accountForm.dueDay),
                  ownerId: currentUser?.id
              });
          } else {
              await storageService.saveAccount({
                  id: accountForm.id || Date.now().toString(),
                  name: accountForm.name,
                  type: accountForm.type as BankAccountType,
                  color: accountForm.color,
                  balance: parseFloat(accountForm.balance.replace(/\./g, '').replace(',', '.')) || 0,
                  ownerId: currentUser?.id
              });
          }
          await loadData();
          setShowAccountModal(false);
          showToast("Salvo com sucesso!");
      } catch(e: any) { showToast(e.message, "error"); }
  };

  const handleDeleteAccount = async (accId: string) => {
      // Check for dependencies
      const hasTrans = transactions.some(t => t.accountId === accId || t.cardId === accId);
      if (hasTrans) {
          showToast("Não é possível excluir: existem transações vinculadas.", "error");
          return;
      }
      if (!window.confirm("Tem certeza que deseja excluir esta conta?")) return;
      
      try {
          await storageService.deleteAccount(accId);
          await loadData();
          showToast("Conta excluída.");
      } catch(e: any) { showToast("Erro ao excluir", "error"); }
  };

  const handleEditAccount = (acc: BankAccount) => {
      setAccountForm({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          color: acc.color,
          balance: (acc.balance || 0).toString().replace('.', ','),
          brand: 'MASTERCARD',
          limit: '',
          closingDay: '',
          dueDay: ''
      });
      setShowAccountModal(true);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      // Only allow numbers, comma and dot
      const val = e.target.value.replace(/[^0-9,.]/g, '');
      setAmount(val);
  };

  const handleTransactionSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      // VALIDATION: Mandatory Account/Card selection
      if (paymentMethod === 'CREDIT' && !selectedCard) {
          showToast("Selecione um Cartão de Crédito.", "error");
          setIsSubmitting(false);
          return;
      }
      if (isPaid && paymentMethod !== 'CREDIT' && !selectedAccount) {
          showToast("Para marcar como pago, selecione a Conta de saída.", "error");
          setIsSubmitting(false);
          return;
      }

      try {
          const numAmount = parseFloat(amount.replace(/\./g, '').replace(',', '.'));
          const t: Transaction = {
              id: editingTransactionId || Date.now().toString(),
              userId: currentUser!.id,
              memberId: selectedMember || currentUser!.id,
              description,
              amount: numAmount,
              date,
              dueDate: dueDate || date,
              type,
              category,
              isFixed: recurrenceMode === 'fixed',
              isPaid,
              store: store,
              paymentMethod,
              accountId: paymentMethod === 'CREDIT' ? undefined : selectedAccount,
              cardId: paymentMethod === 'CREDIT' ? selectedCard : undefined,
              installmentTotal: recurrenceMode === 'installment' ? installmentTotal : 1,
              frequencyMonths: recurrenceMode === 'fixed' ? frequencyMonths : undefined,
              receiptImage,
              notes,
              isPrivate,
              parentTransactionId: editingTransactionId ? undefined : Date.now().toString() // Generate grouping ID for new
          };
          
          if (editingTransactionId) await storageService.updateTransaction(t);
          else await storageService.addTransaction(t);
          
          await loadData();
          setShowAddModal(false);
          resetForm();
          showToast("Transação salva!");
      } catch(e: any) { showToast("Erro ao salvar", "error"); }
      finally { setIsSubmitting(false); }
  };

  const updateTransactionStatus = async (updatedT: Transaction) => {
      setTransactions(prev => prev.map(tr => tr.id === updatedT.id ? updatedT : tr));
      try {
          await storageService.updateTransaction(updatedT);
          showToast(updatedT.isPaid ? "Marcado como Pago" : "Marcado como Pendente");
      } catch (e: any) {
          showToast("Erro ao atualizar status", "error");
          loadData();
      }
  };

  const handleTogglePaid = (t: Transaction) => {
      if (t.isPaid) {
          const originalAmount = t.amountPlanned || t.amount;
          const updatedT = { ...t, isPaid: false, amount: originalAmount };
          updateTransactionStatus(updatedT);
      } else {
          setPaymentModal({ isOpen: true, transaction: t });
          setPaymentAmount(t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          setPaymentConfirmMethod(t.paymentMethod);
          setPaymentConfirmAccount(t.accountId || '');
          setPaymentConfirmCard(t.cardId || '');
      }
  };

  const handleConfirmPayment = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!paymentModal.transaction) return;

      // VALIDATION
      if (paymentConfirmMethod === 'CREDIT' && !paymentConfirmCard) {
          showToast("Selecione o Cartão de Crédito.", "error");
          return;
      }
      if (paymentConfirmMethod !== 'CREDIT' && !paymentConfirmAccount) {
          showToast("Selecione a conta para baixa.", "error");
          return;
      }

      const numAmount = parseFloat(paymentAmount.replace(/\./g, '').replace(',', '.'));
      
      const t = { 
          ...paymentModal.transaction, 
          isPaid: true, 
          amount: numAmount, 
          paymentMethod: paymentConfirmMethod, 
          accountId: paymentConfirmMethod === 'CREDIT' ? undefined : paymentConfirmAccount,
          cardId: paymentConfirmMethod === 'CREDIT' ? paymentConfirmCard : undefined
      };
      
      await storageService.updateTransaction(t);
      await loadData();
      setPaymentModal({ isOpen: false, transaction: null });
      showToast("Baixa confirmada!");
  };

  const handleBulkDelete = async (ids: string[]) => {
      try {
          for (const id of ids) {
              await storageService.deleteTransaction(id);
          }
          await loadData(); // Consolidate Balance (Refresh Data)
          showToast(`${ids.length} transações excluídas com sucesso.`);
      } catch (e) {
          showToast("Erro ao excluir transações.", "error");
      }
  };

  const handleReceiptData = (data: any) => {
     if (data.totalAmount) setAmount(data.totalAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }));
     if (data.date) setDate(data.date);
     if (data.storeName) setStore(data.storeName);
     if (data.description) setDescription(data.description);
     if (data.categorySuggestion) setCategory(data.categorySuggestion);
     showToast("Dados extraídos!");
  };

  const handleCloseMonth = () => {
      setClosureTargetDate({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() });
      setShowClosureWizard(true);
  };

  const handlePrintReport = () => {
      generateMonthlyReport(filteredTransactions, currentDate, currentUser);
  };

  const handleAdminApprove = async (userId: string, isApproved: boolean) => {
      try {
          await storageService.updateUserStatus(userId, { isApproved });
          setAllUsersAdmin(prev => prev.map(u => u.id === userId ? { ...u, isApproved } : u));
          showToast(isApproved ? "Usuário aprovado!" : "Usuário bloqueado.");
      } catch (e: any) { showToast("Erro ao atualizar status", "error"); }
  };

  const handleDeleteMe = async () => {
      if(!window.confirm("ATENÇÃO: Deseja realmente excluir sua conta e todos os dados? Esta ação é irreversível.")) return;
      try {
          await storageService.deleteMe();
          handleLogout();
      } catch(e: any) { showToast("Erro ao excluir", "error"); }
  };

  const handleIgnoreNotification = async (id: string) => {
      try {
          await storageService.ignoreAlert(id);
          setIgnoredNotifications(prev => [...prev, id]);
      } catch(e) { console.error(e); }
  };

  const resetForm = () => {
    setEditingTransactionId(null);
    setAmount('');
    setDescription('');
    setStore('');
    setDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
    setType(TransactionType.EXPENSE);
    setCategory('');
    setRecurrenceMode('single');
    setIsPaid(false);
    setIsPrivate(false);
    setFrequencyMonths([new Date().getMonth() + 1]);
    setReceiptImage(undefined);
    setNotes('');
    setInstallmentTotal(2);
    setSelectedMember(currentUser?.id || '');
    setPaymentMethod('DEBIT');
    setSelectedAccount('');
    setSelectedCard('');
  };

  const handleEditTransaction = async (t: Transaction) => {
      setEditingTransactionId(t.id);
      const val = t.amountPaid || t.amount;
      setAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setDescription(t.description);
      setStore(t.store);
      setDate(t.date);
      setDueDate(t.dueDate || t.date);
      setType(t.type);
      setCategory(t.category);
      setRecurrenceMode(t.isFixed ? 'fixed' : (t.installmentTotal && t.installmentTotal > 1 ? 'installment' : 'single'));
      
      // Fix: Load frequency months from stored record
      if (t.isFixed) {
          if (t.frequencyMonths && t.frequencyMonths.length > 0) {
              setFrequencyMonths(t.frequencyMonths);
          } else {
              setFrequencyMonths([1,2,3,4,5,6,7,8,9,10,11,12]); // Fallback legacy
          }
      } else {
          setFrequencyMonths([new Date().getMonth() + 1]);
      }

      setInstallmentTotal(t.installmentTotal || 1);
      setIsPaid(t.isPaid);
      setIsPrivate(t.isPrivate || false);
      setNotes(t.notes || '');
      setReceiptImage(undefined); 
      setSelectedMember(t.memberId || t.userId);
      setPaymentMethod(t.paymentMethod);
      setSelectedAccount(t.accountId || '');
      setSelectedCard(t.cardId || '');
      setShowAddModal(true);
  };

  const handleDuplicateTransaction = (t: Transaction) => {
      const val = t.amountPaid || t.amount;
      setAmount(val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
      setDescription(`${t.description} (Cópia)`);
      setStore(t.store);
      setDate(t.date);
      setDueDate(t.dueDate || t.date);
      setType(t.type);
      setCategory(t.category);
      setRecurrenceMode(t.isFixed ? 'fixed' : (t.installmentTotal && t.installmentTotal > 1 ? 'installment' : 'single'));
      setFrequencyMonths(t.frequencyMonths || [new Date().getMonth() + 1]);
      setInstallmentTotal(t.installmentTotal || 1);
      setIsPaid(t.isPaid);
      setIsPrivate(t.isPrivate || false);
      setNotes(t.notes || '');
      setSelectedMember(t.memberId || t.userId);
      setPaymentMethod(t.paymentMethod);
      setSelectedAccount(t.accountId || '');
      setSelectedCard(t.cardId || '');
      setEditingTransactionId(null);
      setShowAddModal(true);
  };

  // --- FILTERS & STATS logic remains same ---
  // ... (omitted filter/stats logic to focus on changes) ...
  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const d = parseDate(t.date);
          const sameMonth = d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
          const matchesType = filters.type === 'all' || (filters.type === 'income' && t.type === TransactionType.INCOME) || (filters.type === 'expense' && t.type === TransactionType.EXPENSE);
          const matchesStatus = filters.status === 'all' || (filters.status === 'paid' && t.isPaid) || (filters.status === 'pending' && !t.isPaid);
          const matchesCategory = filters.category === 'all' || t.category === filters.category;
          const matchesSearch = filters.search === '' || t.description.toLowerCase().includes(filters.search.toLowerCase()) || t.store?.toLowerCase().includes(filters.search.toLowerCase());
          
          let matchesSource = true;
          if (filters.source === 'imported') matchesSource = Boolean(t.isImported);
          if (filters.source === 'manual') matchesSource = !t.isImported;

          return sameMonth && matchesType && matchesStatus && matchesCategory && matchesSearch && matchesSource;
      });
  }, [transactions, filters, currentDate]);

  const activeNotifications = useMemo(() => {
      const today = new Date();
      return transactions.filter(t => {
          if (t.isPaid || t.type !== TransactionType.EXPENSE) return false;
          if (ignoredNotifications.includes(t.id)) return false;
          const due = parseDate(t.dueDate || t.date);
          const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); 
          return diffDays <= 3; 
      });
  }, [transactions, ignoredNotifications]);

  const stats = useMemo(() => {
      const income = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
      const expense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
      const received = filteredTransactions.filter(t => t.type === TransactionType.INCOME && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
      const paid = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE && t.isPaid).reduce((acc, t) => acc + t.amount, 0);
      return { income, expense, balance: income - expense, received, paid, toReceive: income - received, toPay: expense - paid };
  }, [filteredTransactions]);

  const dashboardCharts = useMemo(() => {
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      const prevDate = new Date(currentYear, currentMonth - 1, 1);
      const prevMonthTrans = transactions.filter(t => { const d = parseDate(t.date); return d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear(); });
      const prevIncome = prevMonthTrans.filter(t => t.type === TransactionType.INCOME).reduce((sum, t) => sum + t.amount, 0);
      const prevExpense = prevMonthTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((sum, t) => sum + t.amount, 0);
      const comparisonData = [{ name: 'Mês Anterior', Entradas: prevIncome, Saídas: prevExpense }, { name: 'Mês Atual', Entradas: stats.income, Saídas: stats.expense }];
      
      const categoryData: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => categoryData[t.category] = (categoryData[t.category] || 0) + t.amount);
      const donutData = Object.keys(categoryData).map(k => ({ name: k, value: categoryData[k] }));

      const evolutionData: any[] = [];
      for(let i=0; i<12; i++) {
          const mTrans = transactions.filter(t => { const d = parseDate(t.date); return d.getMonth() === i && d.getFullYear() === currentYear; });
          const inc = mTrans.filter(t => t.type === TransactionType.INCOME).reduce((s, t) => s + t.amount, 0);
          const exp = mTrans.filter(t => t.type === TransactionType.EXPENSE).reduce((s, t) => s + t.amount, 0);
          evolutionData.push({ name: MONTHS[i].substring(0,3), PrevistoEntrada: inc, PrevistoSaída: exp, RealizadoEntrada: inc, RealizadoSaída: exp }); 
      }

      const byPerson: Record<string, number> = {};
      filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).forEach(t => { const member = users.find(u => u.id === t.memberId)?.name || 'Desconhecido'; byPerson[member] = (byPerson[member] || 0) + t.amount; });
      const maxPersonSpent = Math.max(...(Object.values(byPerson) as number[]), 1);

      return { comparisonData, donutData, evolutionData, byPerson, maxPersonSpent };
  }, [stats, filteredTransactions, currentDate, transactions, users]);

  const getAccountColorClass = (name: string, type: string) => {
      const lower = name.toLowerCase();
      if (lower.includes('brasil') || lower.includes('bb')) return 'bg-yellow-400 text-blue-900';
      if (lower.includes('nu') || lower.includes('nubank')) return 'bg-purple-600 text-white';
      if (lower.includes('caixa')) return 'bg-blue-600 text-white';
      if (lower.includes('inter')) return 'bg-orange-500 text-white';
      return 'bg-gradient-to-r from-blue-500 to-teal-400 text-white';
  };

  const renderDateNavigator = <DateNavigator currentDate={currentDate} setCurrentDate={setCurrentDate} />;

  if (!currentUser) {
      if (showAuthScreen) return <AuthScreen onLogin={handleLogin} users={users} onRegister={() => {}} initialView={authInitialView} />;
      return <LandingPage onStart={() => { setAuthInitialView('register'); setShowAuthScreen(true); }} onLogin={() => { setAuthInitialView('login'); setShowAuthScreen(true); }} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
       {/* ... Header and Menus (omitted for brevity, unchanged) ... */}
       <header className="bg-white shadow-sm sticky top-0 z-30 px-4 h-16 flex justify-between items-center">
           <div className="flex items-center gap-2">
                <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="hidden md:block p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors mr-1">
                    <Menu className="w-5 h-5" />
                </button>
               <Logo showText/> <span className="text-xs text-white font-mono font-bold bg-green-600 px-2 py-1 rounded shadow-sm animate-pulse">{APP_VERSION}</span>
           </div>
           <div className="flex items-center gap-4">
               <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                  <Bell className="w-6 h-6" />
                  {activeNotifications.length > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
               </button>
               {showNotifications && (
                   <div className="absolute top-16 right-4 w-80 bg-white shadow-xl rounded-xl border border-gray-100 z-50 p-4 animate-in slide-in-from-top-2">
                       <h3 className="font-bold text-gray-900 mb-2 px-2">Notificações</h3>
                       {activeNotifications.length === 0 ? <p className="text-sm text-gray-500 px-2">Tudo em dia!</p> : (
                           <ul className="space-y-2 max-h-80 overflow-y-auto">
                               {activeNotifications.map(t => (
                                   <li key={t.id} className="text-sm bg-red-50 p-3 rounded-lg text-red-700 font-medium flex justify-between items-center gap-2 border border-red-100">
                                       <div className="flex flex-col">
                                            <span>{t.description}</span>
                                            <span className="text-xs opacity-75">Vence: {formatDate(t.dueDate)}</span>
                                       </div>
                                       <button onClick={() => handleIgnoreNotification(t.id)} className="p-1 hover:bg-red-100 rounded text-red-500" title="Marcar como resolvida">
                                            <CheckCircle className="w-4 h-4" />
                                       </button>
                                   </li>
                               ))}
                           </ul>
                       )}
                   </div>
               )}
               <button onClick={() => setView('profile')} className={`w-8 h-8 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold`}>{safeInitial(currentUser.name)}</button>
               <div className="md:hidden"><button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2"><Menu className="w-6 h-6" /></button></div>
           </div>
       </header>

       {/* ... Mobile Menu (omitted) ... */}
       {/* ... Sidebar and Main Content ... */}
       <div className="max-w-7xl mx-auto p-4 flex gap-6">
           <aside className={`hidden md:block bg-white rounded-none border-r border-gray-100 h-[calc(100vh-64px)] fixed left-0 top-16 overflow-y-auto z-20 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
               <div className="p-4 space-y-6">
                   <div className={`flex items-center gap-3 px-2 mb-6 ${sidebarCollapsed ? 'justify-center flex-col' : ''}`}>
                       <div className={`w-10 h-10 rounded-full ${currentUser.avatarColor} text-white flex items-center justify-center font-bold`}>{safeInitial(currentUser.name)}</div>
                       {!sidebarCollapsed && (
                           <div><p className="font-bold text-sm text-gray-900">{currentUser.name}</p><p className="text-xs text-gray-400 uppercase">{currentUser.isAdmin ? 'ADMIN' : 'MEMBER'}</p></div>
                       )}
                       {!sidebarCollapsed && (
                           <button onClick={handleLogout} className="ml-auto text-gray-400 hover:text-red-500"><LogOut className="w-4 h-4"/></button>
                       )}
                   </div>
                   <nav className="space-y-1">
                       <button onClick={() => setView('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'dashboard' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Visão Geral" : ""}><LayoutDashboard className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Visão Geral</span>}</button>
                       <button onClick={() => setView('feed')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'feed' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Feed da Família" : ""}><MessageSquare className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Feed da Família</span>}</button>
                       <button onClick={() => setView('transactions')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'transactions' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Lançamentos" : ""}><Calendar className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Lançamentos</span>}</button>
                       <button onClick={() => setView('wallet')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'wallet' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Carteira" : ""}><Wallet className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Carteira</span>}</button>
                       <button onClick={() => setView('categories')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'categories' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Categorias" : ""}><Settings className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Categorias</span>}</button>
                       <button onClick={() => setView('chat')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'chat' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Assistente IA" : ""}><MessageCircle className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Assistente IA</span>}</button>
                       <button onClick={() => setView('visualizer')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'visualizer' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Metas Visuais" : ""}><ImageIcon className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Metas Visuais</span>}</button>
                       <button onClick={() => setView('admin')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors ${view === 'admin' ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Admin Panel" : ""}><Shield className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Admin Panel</span>}</button>
                       <button onClick={() => setView('debug')} className={`w-full text-left px-4 py-3 rounded-lg flex gap-3 font-medium transition-colors mt-6 ${view === 'debug' ? 'text-yellow-600 bg-yellow-50' : 'text-gray-400 hover:bg-gray-50'} ${sidebarCollapsed ? 'justify-center px-2' : ''}`} title={sidebarCollapsed ? "Diagnóstico" : ""}><AlertTriangle className="w-5 h-5 flex-shrink-0"/> {!sidebarCollapsed && <span>Diagnóstico</span>}</button>
                   </nav>
               </div>
           </aside>

           <main className={`flex-1 min-w-0 pt-6 transition-all duration-300 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
               {view === 'debug' && <DebugSuite />}
               {view === 'feed' && <FamilyFeed />}
               {view === 'chat' && <ChatAssistant />}
               {view === 'visualizer' && <Visualizer />}
               {view === 'transactions' && (
                   <TransactionsView 
                       filteredTransactions={filteredTransactions}
                       stats={stats}
                       filters={filters}
                       setFilters={setFilters}
                       incomeCategories={incomeCategories}
                       expenseCategories={expenseCategories}
                       formatCurrency={formatCurrency}
                       formatDate={formatDate}
                       users={users}
                       handleTogglePaid={handleTogglePaid}
                       handleEditTransaction={handleEditTransaction}
                       setShowImportModal={setShowImportModal}
                       setShowAddModal={setShowAddModal}
                       DateNavigatorComponent={renderDateNavigator}
                       onDeleteTransactions={handleBulkDelete}
                       onDuplicateTransaction={handleDuplicateTransaction}
                   />
               )}
               {view === 'dashboard' && (
                   <DashboardView 
                       stats={stats}
                       dashboardCharts={dashboardCharts}
                       filteredTransactions={filteredTransactions}
                       users={users}
                       dashboardScope={dashboardScope}
                       setDashboardScope={setDashboardScope}
                       handleCloseMonth={handleCloseMonth}
                       handlePrintReport={handlePrintReport}
                       activeNotifications={activeNotifications}
                       showNotifications={false}
                       setShowNotifications={setShowNotifications}
                       currentDate={currentDate}
                       DateNavigatorComponent={renderDateNavigator}
                       formatCurrency={formatCurrency}
                       setShowAddModal={setShowAddModal}
                       formatDate={formatDate}
                   />
               )}
               
               {view === 'wallet' && (
                   <div className="space-y-4">
                       <div className="flex justify-between items-center mb-2">
                            <h2 className="text-2xl font-bold text-gray-800">Minha Carteira</h2>
                            <button onClick={() => { setAccountForm({...accountForm, type: 'CHECKING', accountId: undefined}); setShowAccountModal(true); }} className="bg-green-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2"><Plus className="w-4 h-4"/> Nova Conta</button>
                       </div>
                       <div className="flex flex-wrap gap-6">
                           {accounts.map(acc => (
                               <div key={acc.id} className={`${getAccountColorClass(acc.name, acc.type)} rounded-2xl p-6 w-80 shadow-lg relative flex flex-col justify-between min-h-[200px] group`}>
                                   <div><h3 className="font-bold text-lg">{acc.name}</h3><p className="text-white/70 text-xs font-bold uppercase">{translateAccountType(acc.type)}</p></div>
                                   
                                   {/* Edit/Delete Actions */}
                                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => handleEditAccount(acc)} className="p-1.5 bg-white/20 hover:bg-white/40 rounded text-white"><Edit2 className="w-3 h-3"/></button>
                                       <button onClick={() => handleDeleteAccount(acc.id)} className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded text-white"><Trash2 className="w-3 h-3"/></button>
                                   </div>

                                   <div className="mt-4">
                                        {acc.cards && acc.cards.map(card => (
                                            <div key={card.id} className="bg-white/20 rounded-lg p-2 mb-2 text-white text-sm font-bold flex justify-between"><span>{card.name}</span><span>Limit: {card.limit}</span></div>
                                        ))}
                                        {/* Restored: Always show Add Card button if not Wallet type, allowing multiple cards */}
                                        {acc.type !== 'WALLET' && (
                                            <button onClick={() => { setAccountForm({ ...accountForm, type: 'CREDIT_CARD', accountId: acc.id }); setShowAccountModal(true); }} className="text-xs font-bold bg-white/20 p-2 rounded text-white mt-2">+ Cartão</button>
                                        )}
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {view === 'categories' && (
                   <div className="space-y-6">
                       <div className="flex items-center gap-2 mb-4">
                           <input 
                               type="text" 
                               value={newCategoryName} 
                               onChange={e => setNewCategoryName(e.target.value)} 
                               placeholder="Nova Categoria..." 
                               className="p-3 border rounded-xl flex-1 max-w-xs"
                           />
                           <button onClick={() => handleAddCategory('income')} className="bg-green-600 text-white px-4 py-3 rounded-xl font-bold text-sm">+ Entrada</button>
                           <button onClick={() => handleAddCategory('expense')} className="bg-red-600 text-white px-4 py-3 rounded-xl font-bold text-sm">+ Saída</button>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                           <div className="bg-white p-6 rounded-2xl border border-gray-100">
                               <h3 className="text-green-600 font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5"/> Entradas</h3>
                               <ul className="space-y-2">
                                   {incomeCategories.map(c => (
                                       <li key={c} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group border-b border-gray-50 last:border-0">
                                           <span>{c}</span>
                                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={() => handleEditCategory('income', c)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                               <button onClick={() => handleDeleteCategory('income', c)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                           </div>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                           <div className="bg-white p-6 rounded-2xl border border-gray-100">
                               <h3 className="text-red-600 font-bold mb-4 flex items-center gap-2"><Tag className="w-5 h-5"/> Saídas</h3>
                               <ul className="space-y-2">
                                   {expenseCategories.map(c => (
                                       <li key={c} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group border-b border-gray-50 last:border-0">
                                           <span>{c}</span>
                                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                               <button onClick={() => handleEditCategory('expense', c)} className="p-1.5 text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4"/></button>
                                               <button onClick={() => handleDeleteCategory('expense', c)} className="p-1.5 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                           </div>
                                       </li>
                                   ))}
                               </ul>
                           </div>
                       </div>
                   </div>
               )}

               {view === 'profile' && (
                   <div className="bg-white p-8 rounded-2xl shadow-sm max-w-lg mx-auto border border-gray-100">
                       <h2 className="text-2xl font-bold mb-6 text-gray-800">Meu Perfil</h2>
                       <form onSubmit={handleProfileUpdate} className="space-y-4">
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Nome</label>
                               <input type="text" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Nome"/>
                           </div>
                           {/* Restored Email Field */}
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Email</label>
                               <input type="email" value={currentUser?.email} readOnly className="w-full p-3 border rounded-xl bg-gray-100 text-gray-500 cursor-not-allowed" />
                           </div>
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase">Telefone</label>
                               <input type="text" value={profileForm.phone} onChange={e => setProfileForm({...profileForm, phone: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Telefone"/>
                           </div>
                           {/* Restored Avatar Color Picker */}
                           <div>
                               <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Cor do Avatar</label>
                               <div className="flex gap-3">
                                   {['bg-coral-500', 'bg-sage-500', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'].map(color => (
                                       <button 
                                            type="button"
                                            key={color} 
                                            onClick={() => setProfileForm({...profileForm, avatarColor: color})}
                                            className={`w-8 h-8 rounded-full ${color} ${profileForm.avatarColor === color ? 'ring-2 ring-offset-2 ring-gray-400' : ''}`}
                                       />
                                   ))}
                               </div>
                           </div>
                           <button type="submit" disabled={isSubmitting} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-4">{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</button>
                       </form>
                       
                       <div className="mt-8 border-t border-gray-200 pt-6">
                            <h3 className="text-sm font-bold text-gray-500 uppercase mb-4 flex items-center gap-2"><Shield className="w-4 h-4"/> Privacidade e Termos (LGPD)</h3>
                            <div className="space-y-2">
                                <button type="button" onClick={() => setShowTerms(true)} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium border border-gray-200">
                                    <span className="flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500"/> Termos de Uso</span>
                                </button>
                                <button type="button" onClick={() => setShowPrivacy(true)} className="w-full flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium border border-gray-200">
                                    <span className="flex items-center gap-2"><Lock className="w-4 h-4 text-blue-500"/> Política de Privacidade</span>
                                </button>
                            </div>
                       </div>

                       <div className="mt-8 bg-red-50 p-6 rounded-2xl border border-red-100">
                            <h3 className="text-red-700 font-bold mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Zona de Perigo</h3>
                            <p className="text-red-600/80 text-sm mb-4">Ações irreversíveis relacionadas à sua conta.</p>
                            <button type="button" onClick={handleDeleteMe} className="w-full bg-white hover:bg-red-600 hover:text-white text-red-600 border border-red-200 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors">
                                <Trash2 className="w-4 h-4"/> Excluir Minha Conta
                            </button>
                       </div>
                   </div>
               )}
           </main>
       </div>

       {toastMessage && <div className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-xl text-white font-bold z-50 ${toastMessage.type === 'error' ? 'bg-red-600' : 'bg-gray-800'}`}>{toastMessage.text}</div>}

       {/* ... Modals (Add, Account, Payment, etc) ... */}
       {showAddModal && (
           <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] shadow-2xl animate-in zoom-in-95">
                   <div className="bg-red-500 p-4 text-white flex justify-between items-center">
                       <h3 className="font-bold text-lg">{editingTransactionId ? 'Editar Lançamento' : 'Novo Lançamento'}</h3>
                       <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6"/></button>
                   </div>
                   
                   <div className="p-6 overflow-y-auto">
                       {!editingTransactionId && <ReceiptUploader onDataExtracted={handleReceiptData} onImageSelected={()=>{}} availableCategories={[...incomeCategories, ...expenseCategories]} transactionHistory={transactions} />}
                       <form onSubmit={handleTransactionSubmit} className="space-y-5 mt-6">
                           <div className="flex bg-gray-100 p-1 rounded-xl">
                               <button type="button" onClick={() => setType(TransactionType.INCOME)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type===TransactionType.INCOME ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500'}`}>Entrada</button>
                               <button type="button" onClick={() => setType(TransactionType.EXPENSE)} className={`flex-1 py-2 rounded-lg font-bold text-sm transition-all ${type===TransactionType.EXPENSE ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500'}`}>Saída</button>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Valor Total (R$)</label><div className="relative"><DollarSign className="absolute left-3 top-3 text-gray-400 w-4 h-4"/><input type="text" placeholder="0,00" value={amount} onChange={handleAmountChange} className="w-full pl-9 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none font-bold text-gray-800" /></div></div>
                               <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">{type === TransactionType.INCOME ? 'Data da Entrada' : 'Data Compra'}</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-gray-800" /></div>
                           </div>
                           <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Descrição</label><div className="relative"><AlignLeft className="absolute left-3 top-3 text-gray-400 w-4 h-4"/><input type="text" placeholder="Ex: Geladeira Nova" value={description} onChange={e => setDescription(e.target.value)} className="w-full pl-9 p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none text-gray-800" /></div></div>
                           <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                               <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">Repetição</label>
                               <div className="flex gap-2 mb-3">
                                   {['single', 'fixed', 'installment'].map(m => (
                                       <button key={m} type="button" onClick={() => setRecurrenceMode(m as any)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all ${recurrenceMode === m ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>{m === 'single' ? 'Único' : (m === 'fixed' ? 'Fixo' : 'Parcelado')}</button>
                                   ))}
                               </div>
                               {recurrenceMode === 'fixed' && (<div className="animate-in fade-in slide-in-from-top-2"><div className="grid grid-cols-6 gap-2 mb-2">{['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, i) => (<button key={i} type="button" onClick={() => {const monthIndex = i + 1; if (frequencyMonths.includes(monthIndex)) setFrequencyMonths(prev => prev.filter(x => x !== monthIndex)); else setFrequencyMonths(prev => [...prev, monthIndex]);}} className={`py-1.5 text-[10px] rounded-lg font-bold transition-colors ${frequencyMonths.includes(i+1) ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-400 hover:border-gray-300'}`}>{m}</button>))}</div><button type="button" onClick={() => setFrequencyMonths(frequencyMonths.length === 12 ? [] : [1,2,3,4,5,6,7,8,9,10,11,12])} className="text-xs text-blue-600 font-bold hover:underline">Selecionar Todos</button></div>)}
                               {recurrenceMode === 'installment' && (<div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2"><span className="text-xs font-bold text-gray-600">Parcelas:</span><input type="number" min="2" max="60" value={installmentTotal} onChange={e => setInstallmentTotal(parseInt(e.target.value))} className="w-20 p-2 border border-gray-200 rounded-lg text-sm text-center font-bold" /></div>)}
                           </div>
                           <div>
                               <label className="text-[10px] font-bold text-gray-500 uppercase mb-2 block">{type === TransactionType.INCOME ? 'Forma de Recebimento' : 'Forma de Pagamento'}</label>
                               <div className="flex gap-2 mb-3">
                                   <button type="button" onClick={() => setPaymentMethod('DEBIT')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'DEBIT' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>Débito / Pix</button>
                                   <button type="button" onClick={() => setPaymentMethod('CREDIT')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'CREDIT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>Crédito</button>
                                   <button type="button" onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentMethod === 'CASH' ? 'bg-gray-100 border-gray-400 text-gray-700' : 'bg-white border-gray-200 text-gray-500'}`}>Dinheiro</button>
                               </div>
                               <div className="space-y-3">
                                   <div className={paymentMethod === 'CREDIT' ? 'opacity-50' : ''}>
                                       <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Conta Bancária / Carteira</label>
                                       <select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 text-sm">
                                            <option value="">Selecione a Conta...</option>
                                            {accounts.filter(a => a.type !== 'INVESTMENT').map(a => <option key={a.id} value={a.id}>{a.name} ({translateAccountType(a.type)})</option>)}
                                       </select>
                                   </div>
                                   <div className={paymentMethod !== 'CREDIT' ? 'opacity-50' : ''}>
                                       <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cartão de Crédito {paymentMethod !== 'CREDIT' && '(Opcional)'}</label>
                                       <select value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-purple-500 outline-none text-gray-700 text-sm">
                                            <option value="">Selecione o Cartão...</option>
                                            {accounts.flatMap(a => a.cards || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                       </select>
                                   </div>
                               </div>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Estabelecimento</label><div className="relative"><Store className="absolute left-3 top-3 text-gray-400 w-4 h-4"/><input type="text" placeholder="Opcional" value={store} onChange={e => setStore(e.target.value)} className="w-full pl-9 p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm" /></div></div>
                                <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Categoria</label><div className="relative"><Tag className="absolute left-3 top-3 text-gray-400 w-4 h-4"/><select value={category} onChange={e => setCategory(e.target.value)} className="w-full pl-9 p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm appearance-none"><option value="">Selecionar...</option>{(type === TransactionType.INCOME ? incomeCategories : expenseCategories).map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
                           </div>
                           <div><label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Observações</label><textarea placeholder="Detalhes opcionais..." value={notes} onChange={e => setNotes(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-sm h-20 resize-none" /></div>
                           <div className="flex gap-4 pt-2">
                               <button type="button" onClick={() => setIsPaid(!isPaid)} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${isPaid ? 'bg-green-100 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                   {isPaid ? <CheckCircle className="w-5 h-5"/> : <div className="w-5 h-5 border-2 border-gray-400 rounded-full"></div>}
                                   {type === TransactionType.INCOME ? (isPaid ? "Recebido" : "A Receber") : (isPaid ? "Pago" : "A Pagar")}
                                </button>
                               <button type="button" onClick={() => setIsPrivate(!isPrivate)} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all border ${isPrivate ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>{isPrivate ? 'Privado' : 'Público no Feed'}</button>
                           </div>
                           <button type="submit" disabled={isSubmitting} className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-red-200 transition-all active:scale-[0.98]">{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</button>
                       </form>
                   </div>
               </div>
           </div>
       )}

       {showAccountModal && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-sm p-6">
                   <h3 className="font-bold text-lg mb-4">{accountForm.type === 'CREDIT_CARD' ? 'Novo Cartão' : 'Nova Conta'}</h3>
                   <form onSubmit={handleAccountSubmit} className="space-y-4">
                       <input type="text" placeholder="Nome" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} className="w-full p-3 border rounded-xl" />
                       <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold">Salvar</button>
                       <button type="button" onClick={() => setShowAccountModal(false)} className="w-full text-gray-500 py-2">Cancelar</button>
                   </form>
               </div>
           </div>
       )}

       {paymentModal.isOpen && (
           <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
               <div className="bg-white rounded-2xl w-full max-w-sm p-6 overflow-hidden">
                   <h3 className="font-bold text-lg mb-4">Baixar Lançamento</h3>
                   <form onSubmit={handleConfirmPayment} className="space-y-4">
                       <input type="text" value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)} className="w-full p-2 border-b-2 text-2xl font-bold mb-4" />
                       <div className="flex gap-2 mb-2">
                           <button type="button" onClick={() => setPaymentConfirmMethod('DEBIT')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentConfirmMethod === 'DEBIT' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-gray-200 text-gray-500'}`}>Débito</button>
                           <button type="button" onClick={() => setPaymentConfirmMethod('CREDIT')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentConfirmMethod === 'CREDIT' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'bg-white border-gray-200 text-gray-500'}`}>Crédito</button>
                           <button type="button" onClick={() => setPaymentConfirmMethod('CASH')} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${paymentConfirmMethod === 'CASH' ? 'bg-gray-100 border-gray-400 text-gray-700' : 'bg-white border-gray-200 text-gray-500'}`}>Dinheiro</button>
                       </div>
                       <div className="space-y-3">
                           <div className={paymentConfirmMethod === 'CREDIT' ? 'opacity-50' : ''}>
                               <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Conta de Saída *</label>
                               <select value={paymentConfirmAccount} onChange={e => setPaymentConfirmAccount(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                                    <option value="">Selecione...</option>
                                    {accounts.filter(a => a.type !== 'INVESTMENT').map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                               </select>
                           </div>
                           {paymentConfirmMethod === 'CREDIT' && (
                               <div className="animate-in fade-in">
                                   <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Cartão *</label>
                                   <select value={paymentConfirmCard} onChange={e => setPaymentConfirmCard(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg bg-gray-50 text-sm">
                                        <option value="">Selecione...</option>
                                        {accounts.flatMap(a => a.cards || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                   </select>
                               </div>
                           )}
                       </div>
                       <div className="pt-4 flex gap-2">
                           <button type="button" onClick={() => setPaymentModal({isOpen: false, transaction: null})} className="flex-1 text-gray-500 py-3 font-bold border border-gray-200 rounded-xl hover:bg-gray-50">Cancelar</button>
                           <button type="submit" className="flex-1 bg-green-600 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-green-700">Confirmar</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {showClosureWizard && <MonthlyClosureWizard month={closureTargetDate ? closureTargetDate.month : (currentDate.getMonth() + 1)} year={closureTargetDate ? closureTargetDate.year : currentDate.getFullYear()} onClose={() => setShowClosureWizard(false)} onFinished={() => setShowClosureWizard(false)} />}
       {showImportModal && <ImportWizard accounts={accounts} existingTransactions={transactions} categories={[...incomeCategories, ...expenseCategories]} onClose={() => setShowImportModal(false)} onImportFinished={() => { setShowImportModal(false); loadData(); }} />}
       
       {showTerms && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="text-2xl font-bold">Termos de Uso</h3><button onClick={() => setShowTerms(false)}><X className="w-6 h-6"/></button></div>
                <div className="p-6 overflow-y-auto text-sm text-gray-600"><p>Termos de uso simplificados...</p></div>
            </div>
        </div>
       )}
       {showPrivacy && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center"><h3 className="text-2xl font-bold">Política de Privacidade</h3><button onClick={() => setShowPrivacy(false)}><X className="w-6 h-6"/></button></div>
                <div className="p-6 overflow-y-auto text-sm text-gray-600"><p>Política de privacidade e LGPD...</p></div>
            </div>
        </div>
       )}
    </div>
  );
}