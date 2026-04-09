
export enum TransactionType {
  INCOME = 'Entrada',
  EXPENSE = 'Saída'
}

export enum Category {
  // Income
  EMPRESTIMOS_ENTRADA = 'Empréstimos - Entrada',
  SERVICO_PRESTADO = 'Serviço Prestado',
  OUTRAS_ENTRADA = 'Outras - Entrada',
  
  // Expense
  ALIMENTACAO = 'Alimentação',
  MORADIA = 'Moradia',
  CONTADOR = 'Contador',
  IMPOSTOS_TAXAS_MULTAS = 'Impostos, Taxas e multas',
  SAUDE = 'Saúde',
  ATIVIDADE_FISICA = 'Atividade Física',
  EDUCACAO = 'Educação',
  LAZER_PASSEIO = 'Lazer / Passeio',
  OUTRAS_SAIDA = 'Outras - Saída',
  EMPRESTIMOS_SAIDA = 'Empréstimos - Saída',
  PENSAO_NOAH = 'Pensão Noah'
}

export type UserPlan = 'basic' | 'family' | 'pro';
export type PaymentMethod = 'PIX' | 'DEBIT' | 'CREDIT' | 'CASH' | 'BILL' | 'TRANSFER';

export interface User {
  id: string;
  familyId: string; // Group ID to link couples/families
  name: string;
  email: string;
  phone?: string; // WhatsApp/Phone number
  passwordHash: string; // In a real app, never store plain text. Here we simulate storage.
  avatarColor: string;
  isAdmin?: boolean; // SaaS Super Admin
  isApproved?: boolean; // Account approval status
  lastLoginAt?: string; // Tracking engagement
  createdAt?: string;
  plan: UserPlan; // Subscription Tier
  trialEndsAt?: string; // ISO Date for trial expiration
}

export interface Transaction {
  id: string;
  userId: string; // ID of the user who CREATED the transaction (Audit)
  memberId: string; // ID of the family member who SPENT/EARNED the money
  date: string; // ISO String YYYY-MM-DD (Data de Compra/Referência)
  dueDate?: string; // ISO String YYYY-MM-DD (Data de Vencimento da Parcela)
  description: string;
  store: string;
  amount: number; // Valor Efetivo (Pago ou Previsto atual)
  amountPlanned?: number; // Valor Originalmente Previsto
  amountPaid?: number; // Valor Efetivamente Pago (se isPaid)
  type: TransactionType;
  category: string;
  paymentMethod: PaymentMethod;
  accountId?: string; // Linked Bank Account (for Debit/Pix/Cash)
  cardId?: string; // Linked Credit Card (for Credit)
  isFixed: boolean;
  isPaid: boolean; // Status check: Paid/Received vs Projected
  isPrivate?: boolean; // NEW: If true, only visible to creator in Feed (but counts in totals)
  isImported?: boolean; // Identifies transactions imported via OFX/PDF
  frequencyMonths?: number[]; // 1-12 representing Jan-Dec
  receiptImage?: string; // Base64 or URL
  notes?: string; // Optional observations
  
  // Installment Logic
  installmentNumber?: number; // 1
  installmentTotal?: number; // 12
  parentTransactionId?: string; // Links installments together
  
  // Feed Logic (populated on fetch)
  reactions?: { [key: string]: number }; // e.g., { 'LIKE': 2, 'SAD': 1 }
  userReaction?: string | null; // The reaction of the current user
}

export interface Goal {
  id: string;
  userId: string;
  familyId: string;
  description: string;
  amount: number;
  imageUrl: string; // Base64 or URL
  isPublic: boolean; // Toggle for Feed
  createdAt?: string;
}

export interface FixedTransactionTemplate {
  description: string;
  category: Category;
  defaultType: TransactionType;
}

// Chat types
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  audioData?: string; // Base64 audio
}

export type ImageSize = '1K' | '2K' | '4K';

// --- NEW WALLET TYPES ---

export type BankAccountType = 'CHECKING' | 'SAVINGS' | 'INVESTMENT' | 'CASH' | 'WALLET';
export type CardType = 'DEBIT' | 'CREDIT' | 'BOTH';
export type CardBrand = 'VISA' | 'MASTERCARD' | 'ELO' | 'AMEX' | 'HIPERCARD' | 'OTHER';

export interface CreditCard {
  id: string;
  accountId: string; // Parent Bank Account (for payments)
  ownerId: string; // Family member who owns this card
  name: string; // "Nubank Roxinho"
  type: CardType;
  brand: CardBrand;
  last4Digits?: string;
  limit?: number;
  closingDay?: number;
  dueDay?: number;
}

export interface BankAccount {
  id: string;
  userId: string; // Creator
  ownerId: string; // Family member who owns this account
  familyId: string; // For querying scoping
  name: string; // "Itaú", "Inter"
  type: BankAccountType;
  color: string;
  balance?: number; // Optional initial balance for future logic
  cards: CreditCard[]; // Populated on fetch
}

// --- CLOSURE TYPES ---
export interface MonthlyClosureStats {
  month: number;
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  topCategory: { name: string, value: number };
  topSpender: { name: string, value: number };
  pendingCount: number;
  pendingTransactions: Transaction[];
}