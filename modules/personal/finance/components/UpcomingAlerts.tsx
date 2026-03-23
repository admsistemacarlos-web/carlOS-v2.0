import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Receipt, Repeat, ChevronRight, Pencil, CheckCircle2 } from 'lucide-react';
import { Bill, Subscription } from '../types/finance.types';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AlertItem {
  id: string;
  name: string;
  amount: number;
  daysUntil: number;
  type: 'bill' | 'subscription';
  dateStr: string;
  originalBill?: Bill;
}

interface UpcomingAlertsProps {
  bills: Bill[];
  subscriptions: Subscription[];
  daysAhead?: number;
  onPayBill?: (bill: Bill) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getDaysUntilDate(dateStr: string): number {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function fmt(n: number) {
  return `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
}

function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`;
}

// ─── Urgency Badge ────────────────────────────────────────────────────────────

const UrgencyBadge: React.FC<{ daysUntil: number }> = ({ daysUntil }) => {
  if (daysUntil < 0) {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-destructive/60">
        Vencida
      </span>
    );
  }
  if (daysUntil === 0) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.15em] border border-border text-foreground">
        Hoje
      </span>
    );
  }
  if (daysUntil === 1) {
    return (
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
        Amanhã
      </span>
    );
  }
  return (
    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
      em {daysUntil} dias
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const UpcomingAlerts: React.FC<UpcomingAlertsProps> = ({
  bills,
  subscriptions,
  daysAhead = 7,
  onPayBill,
}) => {
  const navigate = useNavigate();

  const items = useMemo<AlertItem[]>(() => {
    const result: AlertItem[] = [];

    // Bills pendentes ou vencidas dentro da janela
    bills.forEach(b => {
      if (b.status === 'paid') return;
      const days = getDaysUntilDate(b.due_date);
      if (days <= daysAhead) {
        result.push({
          id: b.id,
          name: b.description,
          amount: b.amount,
          daysUntil: days,
          type: 'bill',
          dateStr: b.due_date,
          originalBill: b,
        });
      }
    });

    // Assinaturas ativas com próximo vencimento dentro da janela
    subscriptions.forEach(s => {
      if (s.status !== 'active' && s.status !== 'trial') return;
      const days = getDaysUntilDate(s.next_billing_date);
      if (days >= 0 && days <= daysAhead) {
        result.push({
          id: s.id,
          name: s.service_name,
          amount: s.amount,
          daysUntil: days,
          type: 'subscription',
          dateStr: s.next_billing_date,
        });
      }
    });

    // Ordena: vencidas primeiro (menor daysUntil), depois por proximidade
    return result.sort((a, b) => a.daysUntil - b.daysUntil);
  }, [bills, subscriptions, daysAhead]);

  const hasUrgent = items.some(i => i.daysUntil <= 0);
  const visible = items.slice(0, 5);
  const overflow = items.length - visible.length;

  return (
    <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${hasUrgent ? 'border-destructive/30 text-destructive' : 'bg-secondary border-border text-muted-foreground'}`}>
            <Bell size={15} />
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Alertas</p>
            <p className="text-sm font-semibold text-foreground tracking-tight leading-tight">
              Vencimentos Próximos
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${hasUrgent ? 'bg-secondary text-destructive' : 'bg-secondary text-muted-foreground'}`}>
            {items.length}
          </span>
        )}
      </div>

      {/* Divider */}
      <div className="h-px bg-border mx-6" />

      {/* Content */}
      {items.length === 0 ? (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-muted-foreground font-medium">
            Sem vencimentos nos próximos {daysAhead} dias.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {visible.map(item => (
            <div
              key={item.id}
              className="group flex items-center justify-between px-6 py-3.5 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground">
                  {item.type === 'bill'
                    ? <Receipt size={13} />
                    : <Repeat size={13} />
                  }
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground font-medium">
                    {item.type === 'bill' ? 'Conta' : 'Assinatura'}
                    <span className="mx-1.5 opacity-40">·</span>
                    {fmtDate(item.dateStr)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <UrgencyBadge daysUntil={item.daysUntil} />
                <span className={`text-sm font-bold tabular-nums ${item.daysUntil < 0 ? 'text-destructive' : 'text-foreground'}`}>
                  {fmt(item.amount)}
                </span>
                {item.type === 'bill' && item.originalBill && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {onPayBill && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onPayBill(item.originalBill!); }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg text-[9px] font-bold uppercase tracking-widest hover:opacity-80 transition-opacity"
                        title="Pagar conta"
                      >
                        <CheckCircle2 size={11} />
                        Pagar
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/personal/finance/bills/edit/${item.originalBill!.id}`); }}
                      className="p-1.5 rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      title="Editar conta"
                    >
                      <Pencil size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Ver mais */}
          {overflow > 0 && (
            <button
              onClick={() => navigate('/personal/finance/bills')}
              className="w-full px-6 py-3 flex items-center justify-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              +{overflow} mais
              <ChevronRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingAlerts;
