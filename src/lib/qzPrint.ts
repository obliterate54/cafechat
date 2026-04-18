import qz from 'qz-tray';
import type { SaleInvoice } from '@/types/pos';

const CURRENCY = 'د.ل';
const STORE_NAME_EN = 'cafe jehad';
const STORE_NAME_AR = 'كافيه جهاد';
const STORE_SLOGAN = 'اصنع لنفسك يوماً جميلاً';

// Change this to the exact Windows printer name if you want to hard-target it.
// Or leave it empty and search dynamically.
const DEFAULT_PRINTER_NAME = 'XP-80T';

function formatMoney(value: number) {
  return `${value.toFixed(2)} ${CURRENCY}`;
}

function buildEscPosReceipt(invoice: SaleInvoice): string[] {
  const lines: string[] = [];

  // ESC/POS basics. These commands are common, but exact support depends on printer/firmware.
  // QZ Tray docs note raw commands depend on the printer language and model compatibility.
  lines.push('\x1B\x40'); // init
  lines.push('\x1B\x61\x01'); // center

  lines.push(`${STORE_NAME_EN}\n`);
  lines.push(`${STORE_NAME_AR}\n`);
  lines.push(`${STORE_SLOGAN}\n`);
  lines.push('--------------------------------\n');

  lines.push('\x1B\x61\x02'); // right align for Arabic-ish display fallback
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
  lines.push('\x1B\x61\x01'); // center
  lines.push('شكراً لزيارتكم\n');
  lines.push(`${STORE_SLOGAN}\n\n\n`);

  // Feed + cut. Cut support depends on the printer.
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

  // QZ raw printing docs use qz.print(config, data) with raw/plain command arrays.
  const data = [{
    type: 'raw',
    format: 'command',
    flavor: 'plain',
    data: buildEscPosReceipt(invoice),
  }];

  await qz.print(config, data);
}

export async function getInstalledPrinters() {
  await ensureQzConnection();
  const printers = await qz.printers.find();
  return Array.isArray(printers) ? printers : [printers];
}