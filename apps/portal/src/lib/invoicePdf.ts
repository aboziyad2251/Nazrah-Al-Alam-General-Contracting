interface InvoiceData {
  id: number;
  amount_sar: number;
  vat_sar: number;
  total_sar: number;
  status: string;
  due_date: string | null;
  paid_at: string | null;
  created_at: string;
  projectName?: string | null;
  deliveryDate?: string | null;
  returnDate?: string | null;
}

interface ClientData {
  company: string | null;
  full_name: string | null;
  phone: string | null;
  vat_number?: string | null;
  billing_address?: string | null;
}

function fmt(n: number) {
  return n.toLocaleString('en-SA', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-SA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function printInvoicePdf(invoice: InvoiceData, client: ClientData) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Invoice #${invoice.id} — Nazrah Al Alam</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #0f1117; font-size: 13px; }
  @page { size: A4; margin: 20mm 18mm; }

  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; }
  .logo { font-size: 22px; font-weight: 800; color: #0e1f3a; letter-spacing: -0.5px; }
  .logo span { color: #c9a84c; }
  .logo-sub { font-size: 10px; color: #5a6573; margin-top: 2px; }

  .inv-meta { text-align: right; }
  .inv-title { font-size: 24px; font-weight: 700; color: #0e1f3a; }
  .inv-num { font-size: 13px; color: #5a6573; margin-top: 2px; }

  .divider { border: none; border-top: 2px solid #0e1f3a; margin: 0 0 24px; }
  .divider-light { border: none; border-top: 1px solid #e8eaed; margin: 16px 0; }

  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
  .section-label { font-size: 10px; font-weight: 700; color: #5a6573; text-transform: uppercase;
                   letter-spacing: 0.8px; margin-bottom: 6px; }
  .section-value { font-size: 13px; color: #0f1117; line-height: 1.6; }
  .section-value strong { font-weight: 600; }

  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #0e1f3a; color: white; font-size: 11px; font-weight: 600;
       text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 12px; text-align: left; }
  td { padding: 10px 12px; border-bottom: 1px solid #e8eaed; font-size: 13px; }
  tr:last-child td { border-bottom: none; }
  .text-right { text-align: right; }

  .totals { margin-left: auto; width: 260px; }
  .totals-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .totals-row.total { border-top: 2px solid #0e1f3a; margin-top: 8px; padding-top: 10px;
                      font-weight: 700; font-size: 15px; color: #0e1f3a; }

  .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px;
                  font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
  .status-issued   { background: #dbeafe; color: #1d4ed8; }
  .status-paid     { background: #d1fae5; color: #065f46; }
  .status-overdue  { background: #fee2e2; color: #991b1b; }
  .status-draft    { background: #f3f4f6; color: #374151; }

  .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #5a6573; line-height: 1.8; }
  .footer strong { color: #0e1f3a; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div class="header">
  <div>
    <div class="logo">NAZRAH <span>AL ALAM</span></div>
    <div class="logo-sub">General Contracting & Equipment Rental</div>
    <div class="logo-sub" style="margin-top:8px;color:#0f1117">
      CR: 1010XXXXXXX · VAT: 3XXXXXXXXXXXXXXXXX<br/>
      Riyadh, Kingdom of Saudi Arabia<br/>
      info@nazrah.sa · +966 11 XXX XXXX
    </div>
  </div>
  <div class="inv-meta">
    <div class="inv-title">INVOICE</div>
    <div class="inv-num">#${invoice.id}</div>
    <div style="margin-top:12px;font-size:12px;color:#5a6573">
      Date: <strong>${fmtDate(invoice.created_at)}</strong><br/>
      Due:  <strong>${fmtDate(invoice.due_date)}</strong>
      ${invoice.paid_at ? `<br/>Paid: <strong>${fmtDate(invoice.paid_at)}</strong>` : ''}
    </div>
    <div style="margin-top:10px">
      <span class="status-badge status-${invoice.status}">${invoice.status.toUpperCase()}</span>
    </div>
  </div>
</div>

<hr class="divider" />

<div class="grid2">
  <div>
    <div class="section-label">Bill To</div>
    <div class="section-value">
      <strong>${client.company ?? client.full_name ?? 'Client'}</strong><br/>
      ${client.full_name ? client.full_name + '<br/>' : ''}
      ${client.vat_number ? 'VAT: ' + client.vat_number + '<br/>' : ''}
      ${client.billing_address ?? ''}<br/>
      ${client.phone ?? ''}
    </div>
  </div>
  <div>
    <div class="section-label">Project</div>
    <div class="section-value">
      <strong>${invoice.projectName ?? '—'}</strong>
      ${invoice.deliveryDate ? '<br/>Start: ' + fmtDate(invoice.deliveryDate) : ''}
      ${invoice.returnDate ? '<br/>End: ' + fmtDate(invoice.returnDate) : ''}
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>Description</th>
      <th class="text-right">Amount (SAR)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Equipment rental services${invoice.projectName ? ' — ' + invoice.projectName : ''}</td>
      <td class="text-right">${fmt(invoice.amount_sar)}</td>
    </tr>
    <tr>
      <td style="color:#5a6573">VAT (15%)</td>
      <td class="text-right" style="color:#5a6573">${fmt(invoice.vat_sar)}</td>
    </tr>
  </tbody>
</table>

<div class="totals">
  <div class="totals-row">
    <span>Subtotal</span>
    <span>SAR ${fmt(invoice.amount_sar)}</span>
  </div>
  <div class="totals-row">
    <span>VAT (15%)</span>
    <span>SAR ${fmt(invoice.vat_sar)}</span>
  </div>
  <div class="totals-row total">
    <span>Total Due</span>
    <span>SAR ${fmt(invoice.total_sar)}</span>
  </div>
</div>

<div class="footer">
  <strong>Payment Instructions</strong><br/>
  Bank Transfer: IBAN SA00 0000 0000 0000 0000 0000 · Bank: Al Rajhi Bank<br/>
  Reference your invoice number #${invoice.id} when transferring.<br/><br/>
  Thank you for your business · شكراً لتعاملكم معنا
</div>

<script>
  window.onload = function () { window.print(); };
</script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank');
  if (win) {
    win.addEventListener('afterprint', () => URL.revokeObjectURL(url));
  }
}
