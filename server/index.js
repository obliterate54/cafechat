import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

const PORT = Number(process.env.PORT || 3001);
const MONGODB_URI = process.env.MONGODB_URI;
const FRONTEND_URL = process.env.FRONTEND_URL;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing from environment variables.');
  process.exit(1);
}

const app = express();

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked for origin: ${origin}`));
  }
}));

app.use(express.json({ limit: '1mb' }));

const seed = {
  categories: [
    { name: 'مشروبات', description: '', color: '#3B82F6' },
    { name: 'وجبات خفيفة', description: '', color: '#10B981' },
    { name: 'حلويات', description: '', color: '#F59E0B' }
  ],
  products: [
    { name: 'كوكا كولا', price: 2.5, stock: 50, barcode: '12345', category: 'مشروبات' },
    { name: 'شيبس', price: 1.5, stock: 30, barcode: '67890', category: 'وجبات خفيفة' },
    { name: 'شوكولاتة', price: 3.0, stock: 25, barcode: '11111', category: 'حلويات' },
    { name: 'عصير برتقال', price: 4.0, stock: 20, barcode: '22222', category: 'مشروبات' }
  ],
  purchaseInvoices: [
    {
      invoiceNumber: 'INV-001',
      supplier: 'شركة التوزيع الشاملة',
      date: '2024-01-15',
      time: '10:30',
      items: [
        { productName: 'كوكا كولا', barcode: '1234567890123', quantity: 50, purchasePrice: 2, salePrice: 2.5, category: 'مشروبات' },
        { productName: 'شيبس', barcode: '1234567890124', quantity: 30, purchasePrice: 1, salePrice: 1.5, category: 'وجبات خفيفة' }
      ],
      total: 130
    }
  ],
  salesInvoices: [
    {
      invoiceNumber: 'INV-20241202-1234',
      date: '2024-12-02',
      time: '14:30',
      items: [
        { productId: null, name: 'كوكا كولا', price: 2.5, quantity: 2, barcode: '12345' },
        { productId: null, name: 'شيبس', price: 1.5, quantity: 1, barcode: '67890' }
      ],
      total: 6.5,
      cashier: 'البائع الرئيسي'
    }
  ]
};

const toClientId = (value) => String(value);

const withClientId = (doc) => {
  if (!doc) return doc;
  const raw = doc.toObject ? doc.toObject({ versionKey: false }) : doc;
  const { _id, ...rest } = raw;
  return { id: toClientId(_id), ...rest };
};

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#3B82F6' }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  barcode: { type: String, default: '', index: true },
  category: { type: String, default: '' }
}, { timestamps: true });

const purchaseItemSchema = new mongoose.Schema({
  productName: { type: String, required: true },
  barcode: { type: String, default: '' },
  quantity: { type: Number, required: true, min: 0 },
  purchasePrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  category: { type: String, default: '' }
}, { _id: false });

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1 },
  barcode: { type: String, default: '' }
}, { _id: false });

const purchaseInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  supplier: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  items: { type: [purchaseItemSchema], default: [] },
  total: { type: Number, required: true, min: 0 }
}, { timestamps: true });

const salesInvoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, trim: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  items: { type: [saleItemSchema], default: [] },
  total: { type: Number, required: true, min: 0 },
  cashier: { type: String, default: '' }
}, { timestamps: true });

const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const PurchaseInvoice = mongoose.model('PurchaseInvoice', purchaseInvoiceSchema);
const SalesInvoice = mongoose.model('SalesInvoice', salesInvoiceSchema);

function sameDay(dateStr, from, to) {
  if (!dateStr) return false;
  if (from && dateStr < from) return false;
  if (to && dateStr > to) return false;
  return true;
}

async function ensureCategory(categoryName) {
  if (!categoryName) return;
  await Category.updateOne(
    { name: categoryName },
    { $setOnInsert: { name: categoryName, description: '', color: '#6B7280' } },
    { upsert: true }
  );
}

async function upsertProductFromPurchase(item) {
  const byBarcode = item.barcode ? await Product.findOne({ barcode: item.barcode }) : null;
  const existing = byBarcode || await Product.findOne({ name: item.productName });

  if (existing) {
    existing.stock = Number(existing.stock || 0) + Number(item.quantity || 0);
    existing.price = Number(item.salePrice || existing.price || 0);
    existing.barcode = item.barcode || existing.barcode;
    existing.category = item.category || existing.category;
    await existing.save();
    return existing;
  }

  return Product.create({
    name: item.productName,
    price: Number(item.salePrice || 0),
    stock: Number(item.quantity || 0),
    barcode: item.barcode || '',
    category: item.category || ''
  });
}

async function seedDatabaseIfEmpty() {
  const [categoryCount, productCount, purchaseCount, salesCount] = await Promise.all([
    Category.countDocuments(),
    Product.countDocuments(),
    PurchaseInvoice.countDocuments(),
    SalesInvoice.countDocuments()
  ]);

  if (categoryCount + productCount + purchaseCount + salesCount > 0) {
    return;
  }

  const categories = await Category.insertMany(seed.categories);
  const products = await Product.insertMany(seed.products);
  await PurchaseInvoice.insertMany(seed.purchaseInvoices);

  const productMap = new Map(products.map((product) => [product.name, product._id]));
  const sales = seed.salesInvoices.map((invoice) => ({
    ...invoice,
    items: invoice.items.map((item) => ({
      ...item,
      productId: productMap.get(item.name) || null
    }))
  }));

  await SalesInvoice.insertMany(sales);

  for (const item of sales[0]?.items || []) {
    if (!item.productId) continue;
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -Number(item.quantity || 0) } });
  }

  console.log(`Seeded MongoDB with ${categories.length} categories and ${products.length} products.`);
}

async function buildReports(from, to) {
  const [salesInvoices, purchaseInvoices, products] = await Promise.all([
    SalesInvoice.find().lean(),
    PurchaseInvoice.find().lean(),
    Product.find().lean()
  ]);

  const sales = salesInvoices.filter((invoice) => sameDay(invoice.date, from, to));
  const purchases = purchaseInvoices.filter((invoice) => sameDay(invoice.date, from, to));

  const salesByDate = new Map();
  for (const invoice of sales) {
    const current = salesByDate.get(invoice.date) || { date: invoice.date, invoices: 0, items: 0, total: 0 };
    current.invoices += 1;
    current.items += (invoice.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    current.total += Number(invoice.total || 0);
    salesByDate.set(invoice.date, current);
  }

  const purchasesByDate = new Map();
  for (const invoice of purchases) {
    const current = purchasesByDate.get(invoice.date) || { date: invoice.date, invoices: 0, items: 0, total: 0 };
    current.invoices += 1;
    current.items += (invoice.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    current.total += Number(invoice.total || 0);
    purchasesByDate.set(invoice.date, current);
  }

  const allDates = [...new Set([...salesByDate.keys(), ...purchasesByDate.keys()])].sort();
  const profitReportData = allDates.map((date) => {
    const salesTotal = salesByDate.get(date)?.total || 0;
    const purchaseTotal = purchasesByDate.get(date)?.total || 0;
    return { date, sales: salesTotal, purchases: purchaseTotal, profit: salesTotal - purchaseTotal };
  });

  const soldMap = new Map();
  for (const invoice of sales) {
    for (const item of invoice.items || []) {
      const key = item.name;
      const current = soldMap.get(key) || { name: key, quantity: 0, revenue: 0 };
      current.quantity += Number(item.quantity || 0);
      current.revenue += Number(item.quantity || 0) * Number(item.price || 0);
      soldMap.set(key, current);
    }
  }

  const purchasedMap = new Map();
  for (const invoice of purchases) {
    for (const item of invoice.items || []) {
      const key = item.productName;
      const current = purchasedMap.get(key) || { name: key, quantity: 0, cost: 0 };
      current.quantity += Number(item.quantity || 0);
      current.cost += Number(item.quantity || 0) * Number(item.purchasePrice || 0);
      purchasedMap.set(key, current);
    }
  }

  const soldItems = products.map((product) => {
    const sold = soldMap.get(product.name);
    return {
      name: product.name,
      quantity: sold?.quantity || 0,
      remaining: Number(product.stock || 0)
    };
  }).sort((a, b) => b.quantity - a.quantity);

  return {
    salesReportData: Array.from(salesByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    purchaseReportData: Array.from(purchasesByDate.values()).sort((a, b) => a.date.localeCompare(b.date)),
    profitReportData,
    topSellingProducts: Array.from(soldMap.values()).sort((a, b) => b.quantity - a.quantity),
    purchasedItems: Array.from(purchasedMap.values()).sort((a, b) => b.quantity - a.quantity),
    soldItems
  };
}

app.get('/api/health', async (_req, res) => {
  const state = mongoose.connection.readyState;
  res.json({ ok: true, database: state === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/categories', async (_req, res) => {
  const categories = await Category.find().sort({ createdAt: 1 });
  res.json(categories.map(withClientId));
});

app.post('/api/categories', async (req, res) => {
  const category = await Category.create({
    name: req.body.name,
    description: req.body.description || '',
    color: req.body.color || '#3B82F6'
  });
  res.status(201).json(withClientId(category));
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { previousName, ...updates } = req.body;

  const category = await Category.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(404).json({ message: 'التصنيف غير موجود' });
  }

  if (previousName && previousName !== updates.name && updates.name) {
    await Product.updateMany({ category: previousName }, { $set: { category: updates.name } });
  }

  res.json(withClientId(category));
});

app.delete('/api/categories/:id', async (req, res) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (category) {
    await Product.updateMany({ category: category.name }, { $set: { category: '' } });
  }
  res.status(204).end();
});

app.get('/api/products', async (_req, res) => {
  const products = await Product.find().sort({ createdAt: 1 });
  res.json(products.map(withClientId));
});

app.post('/api/products', async (req, res) => {
  const product = await Product.create({
    ...req.body,
    price: Number(req.body.price || 0),
    stock: Number(req.body.stock || 0)
  });
  await ensureCategory(product.category);
  res.status(201).json(withClientId(product));
});

app.put('/api/products/:id', async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    {
      ...req.body,
      price: Number(req.body.price || 0),
      stock: Number(req.body.stock || 0)
    },
    { new: true, runValidators: true }
  );

  if (!product) {
    return res.status(404).json({ message: 'المنتج غير موجود' });
  }

  await ensureCategory(product.category);
  res.json(withClientId(product));
});

app.delete('/api/products/:id', async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

app.get('/api/purchases', async (_req, res) => {
  const invoices = await PurchaseInvoice.find().sort({ date: -1, time: -1, createdAt: -1 });
  res.json(invoices.map(withClientId));
});

app.post('/api/purchases', async (req, res) => {
  const invoice = await PurchaseInvoice.create(req.body);
  for (const item of invoice.items || []) {
    await ensureCategory(item.category);
    await upsertProductFromPurchase(item);
  }
  res.status(201).json(withClientId(invoice));
});

app.get('/api/sales', async (_req, res) => {
  const invoices = await SalesInvoice.find().sort({ date: -1, time: -1, createdAt: -1 });
  res.json(invoices.map((invoice) => ({
    ...withClientId(invoice),
    items: (invoice.items || []).map((item) => ({
      id: item.productId ? String(item.productId) : '',
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      barcode: item.barcode || ''
    }))
  })));
});

app.post('/api/sales', async (req, res) => {
  const normalizedItems = [];

  for (const item of req.body.items || []) {
    const product = await Product.findById(item.id);
    if (!product) {
      return res.status(400).json({ message: `المنتج غير موجود: ${item.name}` });
    }
    if (Number(product.stock || 0) < Number(item.quantity || 0)) {
      return res.status(400).json({ message: `المخزون غير كافٍ للمنتج: ${item.name}` });
    }

    normalizedItems.push({
      productId: product._id,
      name: item.name,
      price: Number(item.price || 0),
      quantity: Number(item.quantity || 0),
      barcode: item.barcode || ''
    });
  }

  for (const item of normalizedItems) {
    await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -Number(item.quantity || 0) } });
  }

  const invoice = await SalesInvoice.create({
    ...req.body,
    items: normalizedItems,
    total: Number(req.body.total || 0)
  });

  res.status(201).json({
    ...withClientId(invoice),
    items: normalizedItems.map((item) => ({
      id: String(item.productId),
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      barcode: item.barcode || ''
    }))
  });
});

app.get('/api/reports/summary', async (req, res) => {
  const from = String(req.query.from || '');
  const to = String(req.query.to || '');
  const report = await buildReports(from, to);
  res.json(report);
});

app.use((_req, res) => {
  res.status(404).json({ message: 'Not found' });
});

app.use((error, _req, res, _next) => {
  if (error instanceof mongoose.Error.ValidationError) {
    return res.status(400).json({ message: Object.values(error.errors)[0]?.message || 'بيانات غير صالحة' });
  }
  if (error?.code === 11000) {
    return res.status(400).json({ message: 'هذه القيمة موجودة مسبقًا' });
  }
  console.error(error);
  res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
});

async function start() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  await seedDatabaseIfEmpty();

  app.listen(PORT, () => {
    console.log(`POS backend running on port ${PORT}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});