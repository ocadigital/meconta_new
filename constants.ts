import { Category, FixedTransactionTemplate, TransactionType } from './types';

export const APP_VERSION = 'v3.5-LIVE';

export const CATEGORIES_INCOME = [
  Category.EMPRESTIMOS_ENTRADA,
  Category.SERVICO_PRESTADO,
  Category.OUTRAS_ENTRADA
];

export const CATEGORIES_EXPENSE = [
  Category.ALIMENTACAO,
  Category.MORADIA,
  Category.CONTADOR,
  Category.IMPOSTOS_TAXAS_MULTAS,
  Category.SAUDE,
  Category.ATIVIDADE_FISICA,
  Category.EDUCACAO,
  Category.LAZER_PASSEIO,
  Category.OUTRAS_SAIDA,
  Category.EMPRESTIMOS_SAIDA
];

export const FIXED_TRANSACTIONS_EXAMPLES: FixedTransactionTemplate[] = [
  { description: 'BairesDev Lendingtree', category: Category.SERVICO_PRESTADO, defaultType: TransactionType.INCOME },
  { description: 'Aldo Imóveis - Google Ads', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'Aldo Imóveis - Hospedagem', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'ADMV - Hospedagem', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'Extorno Receita Fazenda', category: Category.OUTRAS_ENTRADA, defaultType: TransactionType.INCOME },
  { description: 'NeoRede - Internet (Casa)', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'MK Contabilidade - Atrasados', category: Category.CONTADOR, defaultType: TransactionType.EXPENSE },
  { description: 'Jiu-Jitsu Noah', category: Category.ATIVIDADE_FISICA, defaultType: TransactionType.EXPENSE },
  { description: 'Unimed Noah', category: Category.SAUDE, defaultType: TransactionType.EXPENSE },
  { description: 'Claro Celular', category: Category.OUTRAS_SAIDA, defaultType: TransactionType.EXPENSE },
  { description: 'PMF Multa (Casa)', category: Category.IMPOSTOS_TAXAS_MULTAS, defaultType: TransactionType.EXPENSE },
  { description: 'PMF IPTU (Casa)', category: Category.IMPOSTOS_TAXAS_MULTAS, defaultType: TransactionType.EXPENSE },
  { description: 'Casan (Casa)', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'DAS - Imposto Mensal do Simples Nacional', category: Category.IMPOSTOS_TAXAS_MULTAS, defaultType: TransactionType.EXPENSE },
  { description: 'BX+ - Contador Mensalidade', category: Category.CONTADOR, defaultType: TransactionType.EXPENSE },
  { description: 'DAS - Parcelamento Regularização do MEI', category: Category.IMPOSTOS_TAXAS_MULTAS, defaultType: TransactionType.EXPENSE },
  { description: 'Parcela Emprestimo CNPJ - Banco do Empreendedor', category: Category.EMPRESTIMOS_SAIDA, defaultType: TransactionType.EXPENSE },
  { description: 'Celesc (Casa)', category: Category.MORADIA, defaultType: TransactionType.EXPENSE },
  { description: 'Farmácia - Bombinha Noah + Remédios', category: Category.SAUDE, defaultType: TransactionType.EXPENSE },
  { description: 'Cabelo', category: Category.SAUDE, defaultType: TransactionType.EXPENSE }
];

export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];