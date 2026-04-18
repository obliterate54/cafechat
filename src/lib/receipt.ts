import type { SaleInvoice } from '@/types/pos';

const STORE_NAME_EN = 'cafe jehad';
const STORE_NAME_AR = 'كافيه جهاد';
const STORE_SLOGAN = 'اصنع لنفسك يوماً جميلاً';
const CURRENCY = 'د.ل';
const LOGO_URL = `${window.location.origin}/cafe-jehad-logo.jpg`;

const formatMoney = (value: number) => `${value.toFixed(2)} ${CURRENCY}`;

export function printSaleReceipt(invoice: SaleInvoice) {
  const receiptWindow = window.open('', '_blank', 'width=420,height=800');

  if (!receiptWindow) {
    console.warn('Could not open receipt print window.');
    return;
  }

  const itemsHtml = invoice.items
    .map((item) => {
      const lineTotal = item.price * item.quantity;

      return `
        <tr>
          <td class="item-name">${item.name}</td>
          <td class="item-center">${item.quantity}</td>
          <td class="item-center">${formatMoney(item.price)}</td>
          <td class="item-total">${formatMoney(lineTotal)}</td>
        </tr>
      `;
    })
    .join('');

  const cashierName = invoice.cashier || '-';

  receiptWindow.document.open();
  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>فاتورة ${invoice.invoiceNumber}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, "Segoe UI", sans-serif;
            width: 80mm;
            margin: 0 auto;
            padding: 10px;
            color: #111;
            background: #fff;
            direction: rtl;
          }

          .center {
            text-align: center;
          }

          .brand-en {
            font-size: 26px;
            font-weight: 800;
            text-transform: lowercase;
            line-height: 1.1;
            margin: 0;
          }

          .brand-ar {
            font-size: 16px;
            font-weight: 700;
            margin: 4px 0 0;
          }

          .slogan {
            font-size: 12px;
            margin: 4px 0 0;
          }

          .meta {
            margin-top: 10px;
            font-size: 12px;
            line-height: 1.7;
          }

          .divider {
            border: none;
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            table-layout: fixed;
          }

          th, td {
            font-size: 11px;
            padding: 6px 2px;
            border-bottom: 1px dashed #ccc;
            vertical-align: top;
          }

          th {
            font-weight: 700;
          }

          .item-name {
            width: 40%;
            word-break: break-word;
          }

          .item-center {
            width: 18%;
            text-align: center;
          }

          .item-total {
            width: 24%;
            text-align: left;
            direction: ltr;
          }

          .summary {
            margin-top: 10px;
            font-size: 13px;
          }

          .summary-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin: 4px 0;
          }

          .summary-row.total {
            font-size: 15px;
            font-weight: 800;
          }

          .footer {
            margin-top: 12px;
            text-align: center;
            font-size: 12px;
            line-height: 1.6;
          }

          @media print {
            body {
              width: 80mm;
              margin: 0;
              padding: 8px;
            }
          }
        </style>
      </head>
      <body>
        <div class="center">
          <img src="/cafe-jehad-logo.jpg" alt="Cafe Jehad" style="max-width: 160px; max-height: 70px; object-fit: contain; margin-bottom: 8px;" />
          <p class="brand-en">${STORE_NAME_EN}</p>
          <p class="brand-ar">${STORE_NAME_AR}</p>
          <p class="slogan">${STORE_SLOGAN}</p>
        </div>

        <hr class="divider" />

        <div class="meta center">
          <div>فاتورة بيع</div>
          <div>رقم الفاتورة: ${invoice.invoiceNumber}</div>
          <div>التاريخ: ${invoice.date}</div>
          <div>الوقت: ${invoice.time}</div>
          <div>الكاشير: ${cashierName}</div>
        </div>

        <hr class="divider" />

        <table>
          <thead>
            <tr>
              <th class="item-name">الصنف</th>
              <th class="item-center">الكمية</th>
              <th class="item-center">السعر</th>
              <th class="item-total">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary">
          <div class="summary-row total">
            <span>الإجمالي</span>
            <span>${formatMoney(invoice.total)}</span>
          </div>
        </div>

        <hr class="divider" />

        <div class="footer">
          <div>شكراً لزيارتكم</div>
          <div>${STORE_SLOGAN}</div>
        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
              setTimeout(function () {
                window.close();
              }, 400);
            }, 250);
          };
        </script>
      </body>
    </html>
  `);
  receiptWindow.document.close();
}