import type { SessionSummary } from '@/types/pos';

const STORE_NAME_EN = 'cafe jehad';
const STORE_NAME_AR = 'كافيه جهاد';
const REPORT_TITLE = 'كشف حساب الوردية';
const CURRENCY = 'د.ل';

const formatMoney = (value: number) => `${Number(value || 0).toFixed(2)} ${CURRENCY}`;

const formatEnglishDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const formatEnglishTime = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function printSessionSummaryReceipt(summary: SessionSummary) {
  const receiptWindow = window.open('', '_blank', 'width=420,height=900');

  if (!receiptWindow) {
    console.warn('Could not open session summary print window.');
    return;
  }

  const rowsHtml = summary.products
    .map((item) => {
      return `
        <tr>
          <td class="name">${item.name}</td>
          <td class="qty">${item.quantity}</td>
          <td class="amount">${formatMoney(item.amount)}</td>
        </tr>
      `;
    })
    .join('');

  receiptWindow.document.open();
  receiptWindow.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>${REPORT_TITLE}</title>
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

          .title-en {
            font-size: 22px;
            font-weight: 800;
            margin: 6px 0 0;
          }

          .title-ar {
            font-size: 18px;
            font-weight: 700;
            margin: 4px 0;
          }

          .sub {
            font-size: 16px;
            font-weight: 700;
            margin: 8px 0;
          }

          .line {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }

          .meta {
            font-size: 13px;
            line-height: 1.8;
          }

          .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }

          thead th {
            font-size: 13px;
            padding: 4px 0 6px;
            border-bottom: 1px dashed #000;
          }

          tbody td {
            font-size: 13px;
            padding: 5px 0;
            border-bottom: 1px dotted #bbb;
            vertical-align: top;
          }

          .name {
            width: 52%;
            text-align: right;
            font-weight: 600;
          }

          .qty {
            width: 18%;
            text-align: center;
          }

          .amount {
            width: 30%;
            text-align: left;
            direction: ltr;
            font-weight: 600;
          }

          .totals {
            margin-top: 10px;
            font-size: 14px;
            line-height: 1.9;
          }

          .totals-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
          }

          .grand-total {
            font-size: 18px;
            font-weight: 800;
            margin-top: 6px;
          }

          .footer {
            text-align: center;
            margin-top: 14px;
            font-size: 13px;
            line-height: 1.7;
          }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="title-en">${STORE_NAME_EN}</div>
          <div class="title-ar">${STORE_NAME_AR}</div>
          <div class="sub">${REPORT_TITLE}</div>
        </div>

        <div class="line"></div>

        <div class="meta">
          <div class="meta-row">
            <span>تاريخ البداية</span>
            <span>${formatEnglishDate(summary.startedAt)}</span>
          </div>
          <div class="meta-row">
            <span>وقت البداية</span>
            <span>${formatEnglishTime(summary.startedAt)}</span>
          </div>
          <div class="meta-row">
            <span>تاريخ النهاية</span>
            <span>${formatEnglishDate(summary.endedAt)}</span>
          </div>
          <div class="meta-row">
            <span>وقت النهاية</span>
            <span>${formatEnglishTime(summary.endedAt)}</span>
          </div>
          <div class="meta-row">
            <span>عدد الفواتير</span>
            <span>${summary.totalInvoices}</span>
          </div>
        </div>

        <div class="line"></div>

        <table>
          <thead>
            <tr>
              <th>المادة</th>
              <th>الكمية</th>
              <th>المبلغ</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="line"></div>

        <div class="totals">
          <div class="totals-row">
            <span>إجمالي القطع</span>
            <span>${summary.totalItems}</span>
          </div>
          <div class="totals-row grand-total">
            <span>إجمالي المبيعات</span>
            <span>${formatMoney(summary.totalSalesAmount)}</span>
          </div>
        </div>

        ${
          summary.comments
            ? `
          <div class="line"></div>
          <div class="meta">
            <div><strong>ملاحظات:</strong></div>
            <div>${summary.comments}</div>
          </div>
        `
            : ''
        }

        <div class="line"></div>

        <div class="footer">
          <div>تم إنشاء كشف حساب الوردية</div>
          <div>${formatEnglishDate(new Date().toISOString())}</div>
        </div>
      </body>
    </html>
  `);

  receiptWindow.document.close();
  receiptWindow.focus();
  receiptWindow.print();
}