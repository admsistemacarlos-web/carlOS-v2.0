import React from 'react';
import ClientProposals from './ClientProposals';
import ClientContracts from './ClientContracts';
import ClientPaymentReceipts from './ClientPaymentReceipts';

export default function ClientDocumentsTab({ clientId }: { clientId: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <ClientProposals clientId={clientId} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientContracts clientId={clientId} />
        <ClientPaymentReceipts clientId={clientId} />
      </div>
    </div>
  );
}
