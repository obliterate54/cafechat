import type { SaleInvoice } from '@/types/pos';

export function printSaleReceipt(invoice: SaleInvoice) {
  const receiptWindow = window.open('', '_blank', 'width=400,height=700');
  if (!receiptWindow) return;

  const itemsHtml = invoice.items.map((item) => `
    <tr>
      <td>${item.name}</td>
      <td>${item.quantity}</td>
      <td>${item.price.toFixed(2)}</td>
      <td>${(item.price * item.quantity).toFixed(2)}</td>
    </tr>
  `).join('');

  receiptWindow.document.write(`
    <html dir="rtl">
      <head>
        <title>Receipt ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; width: 80mm; margin: 0 auto; padding: 12px; }
          h1, p { text-align: center; margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 12px; }
          td, th { font-size: 12px; padding: 4px 0; border-bottom: 1px dashed #ccc; text-align: right; }
          .total { font-weight: bold; font-size: 16px; margin-top: 12px; text-align: center; }
        </style>
      </head>
      <body>
        <h1>فاتورة بيع</h1>
        <p>${invoice.invoiceNumber}</p>
        <p>${invoice.date} ${invoice.time}</p>
        <p>الكاشير: ${invoice.cashier}</p>
        <table>
          <thead>
            <tr><th>الصنف</th><th>ك</th><th>سعر</th><th>الإجمالي</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">الإجمالي: ${invoice.total.toFixed(2)}</div>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}