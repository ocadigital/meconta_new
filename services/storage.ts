
import { Transaction, User, BankAccount, CreditCard, Goal } from "../types";
import { CATEGORIES_INCOME, CATEGORIES_EXPENSE } from "../constants";

// Helper for API calls
// Changed base URL to empty string to use relative paths (/api/...) 
// which is standard for single-domain deployments or proxies.
const api = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = ''; 
  const currentUserId = localStorage.getItem('finance_current_user_id'); 
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...options.headers as any };
  if (currentUserId) headers['X-User-Id'] = currentUserId;
  
  try {
    const res = await fetch(`${baseUrl}/api/${endpoint}`, { ...options, headers });
    if (!res.ok) { 
        // Try to parse JSON error first
        let errorMessage = `API Error ${res.status}`;
        try {
            const jsonError = await res.json();
            if (jsonError.error) errorMessage = jsonError.error;
        } catch (e) {
            const text = await res.text().catch(() => "Unknown error");
            if (text) errorMessage = `${errorMessage}: ${text}`;
        }
        throw new Error(errorMessage); 
    }
    return await res.json();
  } catch (error) { 
      console.error(`Error fetching ${endpoint}:`, error); 
      throw error; 
  }
};

export const storageService = {
  // --- AUTH & USERS ---
  async login(email: string, passwordHash: string): Promise<{ user: User, familyUsers: User[] }> {
    const response = await api('users?action=login', { method: 'POST', body: JSON.stringify({ email, passwordHash }) });
    if (response.user) localStorage.setItem('finance_current_user_id', response.user.id);
    return response;
  },
  async register(user: User): Promise<void> { await api('users', { method: 'POST', body: JSON.stringify({ users: [user] }) }); },
  async getUsers(): Promise<User[]> { try { return await api('users'); } catch (e) { return []; } },
  async saveUsers(users: User[]): Promise<void> { try { await api('users', { method: 'POST', body: JSON.stringify({ users }) }); } catch (e) {} },
  async recoverPassword(email: string): Promise<void> { await api('users?action=recover', { method: 'POST', body: JSON.stringify({ email }) }); },
  async updatePassword(oldPassword: string, newPassword: string): Promise<void> { 
      await api('users?action=update_password', { method: 'POST', body: JSON.stringify({ oldPassword, newPassword }) }); 
  },
  rememberUserId(id: string): void { localStorage.setItem('finance_remember_user_id', id); },
  getRememberedUserId(): string | null { return localStorage.getItem('finance_remember_user_id'); },
  clearRememberedUser(): void { localStorage.removeItem('finance_remember_user_id'); localStorage.removeItem('finance_current_user_id'); },
  setCurrentSessionUser(id: string): void { localStorage.setItem('finance_current_user_id', id); },

  // --- ADMIN ---
  async getAllUsersAdmin(): Promise<User[]> { return await api('users?action=all_users'); },
  async updateUserStatus(targetUserId: string, updates: { isApproved?: boolean, plan?: string }): Promise<void> { 
      await api('users?action=update_user_status', { method: 'POST', body: JSON.stringify({ targetUserId, ...updates }) }); 
  },

  // --- ACCOUNTS ---
  async getAccounts(): Promise<BankAccount[]> { try { return await api('accounts'); } catch (e) { return []; } },
  async saveAccount(account: Partial<BankAccount>): Promise<void> { await api('accounts?type=account', { method: 'POST', body: JSON.stringify(account) }); },
  async deleteAccount(id: string): Promise<void> { await api(`accounts?entity=account&id=${id}`, { method: 'DELETE' }); },
  async saveCard(card: Partial<CreditCard>): Promise<void> { await api('accounts?type=card', { method: 'POST', body: JSON.stringify(card) }); },
  async deleteCard(id: string): Promise<void> { await api(`accounts?entity=card&id=${id}`, { method: 'DELETE' }); },

  // --- TRANSACTIONS ---
  async getTransactions(): Promise<Transaction[]> { try { return await api('transactions'); } catch (e) { return []; } },
  async getTransaction(id: string): Promise<Transaction> { return await api(`transactions?id=${id}`); },
  async addTransaction(transaction: Transaction): Promise<void> { await api('transactions', { method: 'POST', body: JSON.stringify(transaction) }); },
  async updateTransaction(transaction: Transaction): Promise<void> { await api('transactions', { method: 'POST', body: JSON.stringify(transaction) }); },
  async deleteTransaction(id: string): Promise<void> { await api(`transactions?id=${id}`, { method: 'DELETE' }); },

  // --- GOALS ---
  async getGoals(): Promise<Goal[]> { try { return await api('goals'); } catch (e) { return []; } },
  async saveGoal(goal: Partial<Goal>): Promise<void> { await api('goals', { method: 'POST', body: JSON.stringify(goal) }); },
  async deleteGoal(id: string): Promise<void> { await api(`goals?id=${id}`, { method: 'DELETE' }); },

  // --- CATEGORIES ---
  async getCategories(): Promise<{ income: string[], expense: string[] }> {
    try { const data = await api('categories'); if (data.income.length === 0 && data.expense.length === 0) return { income: CATEGORIES_INCOME, expense: CATEGORIES_EXPENSE }; return data; } 
    catch (e) { return { income: CATEGORIES_INCOME, expense: CATEGORIES_EXPENSE }; }
  },
  async saveCategories(income: string[], expense: string[]): Promise<void> { await api('categories', { method: 'POST', body: JSON.stringify({ income, expense }) }); },

  // --- NOTIFICATIONS ---
  async getIgnoredAlerts(): Promise<string[]> { try { const data = await api('users?action=notifications'); return data.ignoredKeys || []; } catch (e) { return []; } },
  async ignoreAlert(alertKey: string): Promise<void> { await api('users?action=ignore_alert', { method: 'POST', body: JSON.stringify({ alertKey }) }); },

  // --- LGPD & ACCOUNT ---
  async deleteMe(): Promise<void> { await api('users?action=delete_me', { method: 'DELETE' }); }
};
