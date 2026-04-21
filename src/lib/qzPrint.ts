import qz from 'qz-tray';
import type { SaleInvoice, SessionSummary } from '@/types/pos';

const CURRENCY = 'د.ل';
const STORE_NAME_EN = 'cafe jehad';
const STORE_NAME_AR = 'كافيه جهاد';
const STORE_SLOGAN = 'اصنع لنفسك يوماً جميلاً';
const DEFAULT_PRINTER_NAME = 'XP-80T';

function formatMoney(value: number) {
  return `${value.toFixed(2)} ${CURRENCY}`;
}

function formatEnglishDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function formatEnglishTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function buildEscPosReceipt(invoice: SaleInvoice): string[] {
  const lines: string[] = [];

  lines.push('\x1B\x40');
  lines.push('\x1B\x61\x01');

  lines.push(`${STORE_NAME_EN}\n`);
  lines.push(`${STORE_NAME_AR}\n`);
  lines.push(`${STORE_SLOGAN}\n`);
  lines.push('--------------------------------\n');

  lines.push('\x1B\x61\x02');
  lines.push(`فاتورة بيع\n`);
  lines.push(`رقم الفاتورة: ${invoice.invoiceNumber}\n`);
  lines.push(`التاريخ: ${invoice.date}\n`);
  lines.push(`الوقت: ${invoice.time}\n`);
  lines.push(`الكاشير: ${invoice.cashier || '-'}\n`);
  lines.push('--------------------------------\n');

  for (const item of invoice.items) {
    const total = item.price * item.quantity;
    lines.push(`${item.name}\n`);
    lines.push(`  ${item.quantity} x ${formatMoney(item.price)} = ${formatMoney(total)}\n`);
  }

  lines.push('--------------------------------\n');
  lines.push(`الإجمالي: ${formatMoney(invoice.total)}\n`);
  lines.push('--------------------------------\n');
  lines.push('\x1B\x61\x01');
  lines.push('شكراً لزيارتكم\n');
  lines.push(`${STORE_SLOGAN}\n\n\n`);
  lines.push('\x1D\x56\x00');

  return lines;
}

function buildEscPosSessionSummaryReceipt(summary: SessionSummary): string[] {
  const lines: string[] = [];

  lines.push('\x1B\x40');
  lines.push('\x1B\x61\x01');

  lines.push(`${STORE_NAME_EN}\n`);
  lines.push(`${STORE_NAME_AR}\n`);
  lines.push('كشف حساب الوردية\n');
  lines.push('--------------------------------\n');

  lines.push('\x1B\x61\x02');
  lines.push(`تاريخ البداية: ${formatEnglishDate(summary.startedAt)}\n`);
  lines.push(`وقت البداية: ${formatEnglishTime(summary.startedAt)}\n`);
  lines.push(`تاريخ النهاية: ${formatEnglishDate(summary.endedAt)}\n`);
  lines.push(`وقت النهاية: ${formatEnglishTime(summary.endedAt)}\n`);
  lines.push(`عدد الفواتير: ${summary.totalInvoices}\n`);
  lines.push('--------------------------------\n');

  for (const item of summary.products) {
    lines.push(`${item.name}\n`);
    lines.push(`  الكمية: ${item.quantity} | المبلغ: ${formatMoney(item.amount)}\n`);
  }

  lines.push('--------------------------------\n');
  lines.push(`إجمالي القطع: ${summary.totalItems}\n`);
  lines.push(`إجمالي المبيعات: ${formatMoney(summary.totalSalesAmount)}\n`);

  if (summary.comments) {
    lines.push('--------------------------------\n');
    lines.push(`ملاحظات:\n${summary.comments}\n`);
  }

  lines.push('--------------------------------\n');
  lines.push('\x1B\x61\x01');
  lines.push('تم إنشاء كشف حساب الوردية\n');
  lines.push(`${STORE_SLOGAN}\n\n\n`);
  lines.push('\x1D\x56\x00');

  return lines;
}

async function ensureQzConnection() {
  if (!qz.websocket.isActive()) {
    await qz.websocket.connect();
  }
}

export async function findReceiptPrinter(preferredName = DEFAULT_PRINTER_NAME) {
  await ensureQzConnection();

  const printers = await qz.printers.find();
  if (Array.isArray(printers)) {
    const exact = printers.find((p) => p.toLowerCase() === preferredName.toLowerCase());
    if (exact) return exact;
    const partial = printers.find((p) => p.toLowerCase().includes(preferredName.toLowerCase()));
    if (partial) return partial;
    return printers[0] || null;
  }

  return printers || null;
}

export async function printSaleReceiptQz(invoice: SaleInvoice, printerName?: string) {
  await ensureQzConnection();

  const resolvedPrinter = printerName || await findReceiptPrinter();
  if (!resolvedPrinter) {
    throw new Error('No printer found via QZ Tray');
  }

  const config = qz.configs.create(resolvedPrinter);

  const data = [{
    type: 'raw',
    format: 'command',
    flavor: 'plain',
    data: buildEscPosReceipt(invoice),
  }];

  await qz.print(config, data);
}

export async function printSessionSummaryReceiptQz(summary: SessionSummary, printerName?: string) {
  await ensureQzConnection();

  const resolvedPrinter = printerName || await findReceiptPrinter();
  if (!resolvedPrinter) {
    throw new Error('No printer found via QZ Tray');
  }

  const config = qz.configs.create(resolvedPrinter);

  const data = [{
    type: 'raw',
    format: 'command',
    flavor: 'plain',
    data: buildEscPosSessionSummaryReceipt(summary),
  }];

  await qz.print(config, data);
}

export async function getInstalledPrinters() {
  await ensureQzConnection();
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [printers];
}