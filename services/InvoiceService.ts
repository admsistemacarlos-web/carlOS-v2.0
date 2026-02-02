
import { supabase } from '../integrations/supabase/client';
import { CreditCard, Transaction } from '../types';

export const InvoiceService = {
  /**
   * Calcula o período da fatura atual baseada no dia de fechamento.
   * Se hoje < dia_fechamento, a fatura é do mês atual.
   * Se hoje >= dia_fechamento, a fatura aberta é do mês seguinte.
   */
  getInvoicePeriod: (closingDay: number, referenceDate: Date = new Date()) => {
    const currentDay = referenceDate.getDate();
    const currentMonth = referenceDate.getMonth();
    const currentYear = referenceDate.getFullYear();

    let startDate: Date;
    let endDate: Date;

    if (currentDay < closingDay) {
      // Estamos dentro do ciclo atual (ex: hoje dia 5, fecha dia 10)
      // Ciclo começou mês passado dia 10
      startDate = new Date(currentYear, currentMonth - 1, closingDay);
      // Termina neste mês dia 9
      endDate = new Date(currentYear, currentMonth, closingDay - 1);
    } else {
      // Já virou a fatura (ex: hoje dia 15, fechou dia 10)
      // Ciclo começou este mês dia 10
      startDate = new Date(currentYear, currentMonth, closingDay);
      // Termina mês que vem dia 9
      endDate = new Date(currentYear, currentMonth + 1, closingDay - 1);
    }

    // Ajustar horas para cobrir o dia todo
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    return { startDate, endDate };
  },

  /**
   * Busca transações abertas (não travadas) para um cartão específico.
   * Útil para calcular o valor parcial da fatura.
   */
  getOpenTransactions: async (cardId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('credit_card_id', cardId)
      .eq('is_locked', false) // Apenas transações que ainda não foram fechadas em fatura
      .order('date', { ascending: false });

    if (error) throw error;
    return data as Transaction[];
  },

  /**
   * Fecha a fatura:
   * 1. Gera um registro na tabela 'bills' (Contas a Pagar).
   * 2. Atualiza as transações relacionadas para is_locked = true (para não serem somadas novamente).
   */
  closeInvoice: async (
    card: CreditCard,
    amount: number,
    transactionsToLock: Transaction[],
    userId: string
  ) => {
    if (amount <= 0) throw new Error("O valor da fatura deve ser maior que zero.");

    // Calcular data de vencimento
    const today = new Date();
    let dueMonth = today.getMonth();
    let dueYear = today.getFullYear();

    // Se hoje já passou do fechamento, o vencimento é no próximo mês (ou no atual se a due_day for longe)
    // Lógica simplificada: Vencimento é no próximo mês relativo ao fechamento
    if (today.getDate() >= card.closing_day) {
      dueMonth++;
    }
    
    // Ajuste de virada de ano
    if (dueMonth > 11) {
      dueMonth = 0;
      dueYear++;
    }

    // FIX CRÍTICO: Data ancorada no meio-dia (12:00:00) para evitar fuso horário
    const dueDate = new Date(dueYear, dueMonth, card.due_day, 12, 0, 0);
    const monthName = dueDate.toLocaleDateString('pt-BR', { month: 'long' });

    // 1. Criar a Bill
    const { data: billData, error: billError } = await supabase
      .from('bills')
      .insert({
        description: `Fatura ${card.name} - ${monthName}/${dueYear}`,
        amount: amount,
        due_date: dueDate.toISOString(),
        status: 'pending',
        user_id: userId,
        category: 'Cartão de Crédito', // Faturas de cartão tem categoria fixa
        type: 'variable'
      })
      .select()
      .single();

    if (billError) throw billError;

    // 2. Travar as transações
    if (transactionsToLock.length > 0) {
      const ids = transactionsToLock.map(t => t.id);
      const { error: lockError } = await supabase
        .from('transactions')
        .update({ is_locked: true })
        .in('id', ids);

      if (lockError) {
        // Rollback manual (perigoso em prod sem transactions reais, mas funcional para MVP)
        await supabase.from('bills').delete().eq('id', billData.id);
        throw lockError;
      }
    }

    return billData;
  },

  /**
   * Paga uma fatura (Bill):
   * 1. Cria transação(ões) de saída na conta bancária OU cartão de crédito.
   * 2. Atualiza o status da Bill para 'paid'.
   * 3. Atualiza o saldo da conta (SE for conta bancária).
   */
  payInvoice: async (
    billId: string,
    amount: number,
    sourceId: string, // ID da Conta ou do Cartão
    description: string,
    userId: string,
    paymentDate?: string, // YYYY-MM-DD
    category?: string,
    rawDescription?: string,
    sourceType: 'account' | 'card' = 'account',
    installments: number = 1 // Novo parâmetro para parcelamento
  ) => {
    
    // 1. Se for CONTA BANCÁRIA, verifica saldo antes (opcional, mas bom para UX)
    let currentAccountBalance = 0;
    if (sourceType === 'account') {
      const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', sourceId)
        .single();

      if (accError) throw accError;
      currentAccountBalance = account.balance || 0;
    }

    // 2. Preparar data base de pagamento
    let baseDateObj: Date;
    if (paymentDate) {
      const [year, month, day] = paymentDate.split('-').map(Number);
      baseDateObj = new Date(year, month - 1, day, 12, 0, 0);
    } else {
      const now = new Date();
      baseDateObj = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
    }

    // Define a descrição base e categoria
    const finalCategory = category || 'Pagamento de Fatura';
    const baseDescription = rawDescription || (description.startsWith('Fatura') ? `Pgto: ${description}` : description);

    let firstTransactionId: string | null = null;

    // 3. Criar Transação(ões)
    // Lógica de Parcelamento (Apenas para Cartão e parcelas > 1)
    if (sourceType === 'card' && installments > 1) {
        // Cálculo de valores para evitar dízimas
        const baseAmount = Math.floor((amount / installments) * 100) / 100;
        const remainder = Number((amount - (baseAmount * installments)).toFixed(2));

        const transactionsToInsert = [];

        for (let i = 0; i < installments; i++) {
            const isFirst = i === 0;
            // O resto (centavos) vai na primeira parcela
            const currentAmount = isFirst ? Number((baseAmount + remainder).toFixed(2)) : baseAmount;
            
            // Calcular data (Adicionar meses)
            const installmentDate = new Date(baseDateObj);
            installmentDate.setMonth(baseDateObj.getMonth() + i);
            
            const payload = {
                description: `${baseDescription} (${i + 1}/${installments})`,
                amount: currentAmount,
                type: 'expense',
                status: 'paid', // No cartão, a compra é "efetivada"
                category: finalCategory,
                date: installmentDate.toISOString(),
                payment_date: installmentDate.toISOString(),
                user_id: userId,
                bill_id: billId,
                is_locked: false,
                credit_card_id: sourceId,
                account_id: null,
                installment_current: i + 1,
                installment_total: installments,
                is_installment: true
            };
            transactionsToInsert.push(payload);
        }

        const { data: insertedData, error: transError } = await supabase
            .from('transactions')
            .insert(transactionsToInsert)
            .select('id'); // Retorna IDs para vincular o primeiro à Bill

        if (transError) throw transError;
        
        // Pega o ID da primeira parcela para vincular na Bill
        if (insertedData && insertedData.length > 0) {
            firstTransactionId = insertedData[0].id;
        }

    } else {
        // Transação Única (À vista no cartão ou Débito em Conta)
        const finalPaymentDate = baseDateObj.toISOString();
        
        const transactionPayload: any = {
            description: baseDescription,
            amount: Math.abs(amount),
            type: 'expense',
            status: 'paid',
            category: finalCategory,
            date: finalPaymentDate,
            payment_date: finalPaymentDate,
            user_id: userId,
            bill_id: billId, 
            is_locked: false
        };

        if (sourceType === 'account') {
            transactionPayload.account_id = sourceId;
        } else {
            transactionPayload.credit_card_id = sourceId;
        }

        const { data: transaction, error: transError } = await supabase
            .from('transactions')
            .insert(transactionPayload)
            .select()
            .single();

        if (transError) throw transError;
        firstTransactionId = transaction.id;
    }

    // 4. Atualizar Status e Data de Pagamento da Bill
    const { error: billUpdateError } = await supabase
      .from('bills')
      .update({ 
        status: 'paid',
        payment_date: baseDateObj.toISOString(),
        transaction_id: firstTransactionId
      })
      .eq('id', billId);

    if (billUpdateError) throw billUpdateError;

    // 5. Se for CONTA BANCÁRIA, Atualizar Saldo Manualmente
    if (sourceType === 'account') {
      const newBalance = currentAccountBalance - Math.abs(amount);
      const { error: balanceError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', sourceId);

      if (balanceError) throw balanceError;
    }

    return true;
  }
};
