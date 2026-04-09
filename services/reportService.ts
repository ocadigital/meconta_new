import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Transaction, TransactionType, User } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('pt-BR').format(date);
};

export const generateMonthlyReport = (
  transactions: Transaction[],
  currentDate: Date,
  currentUser: User | null
) => {
  // Cast to any to access autoTable plugin and standard methods without strict type augmentation issues
  const doc: any = new jsPDF();

  // --- CORES ---
  const colorPrimary = '#2563eb'; // Blue 600
  const colorGreen = '#509573'; // Updated Sage Green (#509573)
  const colorRed = '#dc2626'; // Red 600
  const colorGray = '#4b5563'; // Gray 600

  // --- CABEÇALHO ---
  doc.setFontSize(22);
  doc.setTextColor(colorPrimary);
  doc.text("MeConta", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(colorGray);
  doc.text("Extrato de Fluxo de Caixa Mensal", 14, 26);
  
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  doc.setFontSize(12);
  doc.setTextColor('#000000');
  doc.text(`Período: ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`, 14, 35);

  if (currentUser) {
    doc.setFontSize(10);
    doc.text(`Gerado por: ${currentUser.name}`, 14, 40);
    doc.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}`, 14, 45);
  }

  // --- CÁLCULOS ---
  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // --- RESUMO FINANCEIRO (CARD) ---
  const startY = 55;
  const boxWidth = 60;
  const boxHeight = 25;
  const gap = 5;

  // Box Entrada
  doc.setDrawColor(colorGreen);
  doc.setFillColor(240, 253, 244); // light green bg
  doc.roundedRect(14, startY, boxWidth, boxHeight, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(colorGreen);
  doc.text("Entradas Totais", 19, startY + 8);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(formatCurrency(totalIncome), 19, startY + 18);

  // Box Saída
  doc.setDrawColor(colorRed);
  doc.setFillColor(254, 242, 242); // light red bg
  doc.roundedRect(14 + boxWidth + gap, startY, boxWidth, boxHeight, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(colorRed);
  doc.text("Saídas Totais", 19 + boxWidth + gap, startY + 8);
  doc.setFontSize(14);
  doc.text(formatCurrency(totalExpense), 19 + boxWidth + gap, startY + 18);

  // Box Saldo
  const balanceColor = balance >= 0 ? colorPrimary : colorRed;
  doc.setDrawColor(balanceColor);
  doc.setFillColor(239, 246, 255); // light blue bg
  doc.roundedRect(14 + (boxWidth + gap) * 2, startY, boxWidth, boxHeight, 3, 3, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(balanceColor);
  doc.text("Saldo do Período", 19 + (boxWidth + gap) * 2, startY + 8);
  doc.setFontSize(14);
  doc.text(formatCurrency(balance), 19 + (boxWidth + gap) * 2, startY + 18);

  // --- TABELA DE LANÇAMENTOS ---
  // Preparar dados
  const tableData = transactions
    .sort((a, b) => {
        // Ordenar por data
        return new Date(a.date).getTime() - new Date(b.date).getTime();
    })
    .map(t => {
      // Ajustar data visual para fixos
      let displayDate = formatDate(t.date);
      if (t.isFixed) {
          const [y, _, d] = t.date.split('-');
          const m = currentDate.getMonth() + 1;
          displayDate = `${d}/${m.toString().padStart(2, '0')}/${currentDate.getFullYear()}`;
      }

      return [
        displayDate,
        t.description + (t.store ? ` (${t.store})` : ''),
        t.category,
        t.type === TransactionType.INCOME ? 'Entrada' : 'Saída',
        t.isPaid ? 'Pago' : 'Pendente',
        formatCurrency(t.amount)
      ];
    });

  doc.autoTable({
    startY: startY + boxHeight + 15,
    head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Status', 'Valor']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [37, 99, 235] }, // Blue header
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 25 }, // Data
      5: { halign: 'right', fontStyle: 'bold' } // Valor
    },
    didParseCell: function(data: any) {
      if (data.section === 'body' && data.column.index === 5) {
        // Colorir valor
        const rawValue = data.row.raw[5]; 
        // Hack simples: se o tipo (index 3) for Saída, pintar de vermelho
        if (data.row.raw[3] === 'Saída') {
            data.cell.styles.textColor = [220, 38, 38];
        } else {
            // New Sage Green [80, 149, 115]
            data.cell.styles.textColor = [80, 149, 115];
        }
      }
    }
  });

  // --- FOOTER ---
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10);
    doc.text(`MeConta - Relatório Gerado Automaticamente`, 14, doc.internal.pageSize.height - 10);
  }

  // Download
  doc.save(`Extrato_MeConta_${currentDate.getFullYear()}_${(currentDate.getMonth()+1).toString().padStart(2, '0')}.pdf`);
};