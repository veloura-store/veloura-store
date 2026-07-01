/**
 * ============================================================
 *  productStore.js — Veloura Admin | Product Data Module
 *  Handles all product CRUD operations via Supabase database
 *  with a localStorage fallback.
 * ============================================================
 */

const STORAGE_KEY = 'products';

// ─────────────────────────────────────────────────────────────
//  Helper – generate a unique ID
// ─────────────────────────────────────────────────────────────
function generateId() {
  return 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ─────────────────────────────────────────────────────────────
//  Helper – read raw array from localStorage (fallback)
// ─────────────────────────────────────────────────────────────
function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('[productStore] Failed to parse localStorage data:', err);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
//  Helper – persist array back to localStorage (fallback)
// ─────────────────────────────────────────────────────────────
function writeStorage(products) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
  } catch (err) {
    console.error('[productStore] Failed to write to localStorage:', err);
  }
}

// ─────────────────────────────────────────────────────────────
//  getProducts()
//  Returns all products from Supabase (fallback to localStorage).
// ─────────────────────────────────────────────────────────────
async function getProducts() {
  if (!window.supabaseClient) {
    console.warn('[productStore] Supabase client not initialized. Using localStorage.');
    return readStorage();
  }
  try {
    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .order('createdAt', { ascending: false });
    if (error) throw error;
    console.log(`[productStore] getProducts → ${data.length} product(s) found in Supabase.`);
    return data || [];
  } catch (err) {
    console.error('[productStore] getProducts failed, using localStorage fallback:', err);
    return readStorage();
  }
}

// ─────────────────────────────────────────────────────────────
//  getProductById(id)
//  Returns a single product object or null.
// ─────────────────────────────────────────────────────────────
async function getProductById(id) {
  if (!id) return null;
  if (!window.supabaseClient) {
    return readStorage().find(p => p.id === id) || null;
  }
  try {
    const { data, error } = await window.supabaseClient
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  } catch (err) {
    console.error(`[productStore] getProductById(${id}) failed, using localStorage fallback:`, err);
    return readStorage().find(p => p.id === id) || null;
  }
}

// ─────────────────────────────────────────────────────────────
//  addProduct(product)
//  Accepts a plain object, uploads to Supabase (fallback to localStorage).
// ─────────────────────────────────────────────────────────────
async function addProduct(product) {
  if (!product || typeof product !== 'object') {
    console.error('[productStore] addProduct → invalid argument; expected an object.');
    return null;
  }

  const { name, price, image, description, affiliateLink } = product;

  if (!name || name.trim() === '') {
    console.error('[productStore] addProduct → "name" is required.');
    return null;
  }
  if (price === undefined || price === null || isNaN(Number(price))) {
    console.error('[productStore] addProduct → "price" must be a valid number.');
    return null;
  }

  const newProduct = {
    id           : generateId(),
    name         : name.trim(),
    price        : parseFloat(Number(price).toFixed(2)),
    image        : (image || '').trim(),
    images       : product.images || [],
    description  : (description || '').trim(),
    affiliateLink: (affiliateLink || '').trim(),
    category     : (product.category || '').trim(),
    createdAt    : new Date().toISOString()
  };

  if (!newProduct.image && newProduct.images.length > 0) {
    newProduct.image = newProduct.images[0];
  }

  if (!window.supabaseClient) {
    const products = readStorage();
    products.push(newProduct);
    writeStorage(products);
    return newProduct;
  }

  try {
    const { error } = await window.supabaseClient
      .from('products')
      .insert([newProduct]);
    if (error) throw error;
    console.log('[productStore] addProduct → Product added to Supabase:', newProduct);
    return newProduct;
  } catch (err) {
    console.error('[productStore] addProduct failed, falling back to localStorage:', err);
    const products = readStorage();
    products.push(newProduct);
    writeStorage(products);
    return newProduct;
  }
}

// ─────────────────────────────────────────────────────────────
//  deleteProduct(id)
//  Removes the product with the given id.
// ─────────────────────────────────────────────────────────────
async function deleteProduct(id) {
  if (!id) {
    console.error('[productStore] deleteProduct → id is required.');
    return false;
  }

  if (!window.supabaseClient) {
    const products = readStorage();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    writeStorage(products);
    return true;
  }

  try {
    const { error } = await window.supabaseClient
      .from('products')
      .delete()
      .eq('id', id);
    if (error) throw error;
    console.log(`[productStore] deleteProduct(${id}) → Deleted from Supabase.`);
    return true;
  } catch (err) {
    console.error(`[productStore] deleteProduct(${id}) failed, falling back to localStorage:`, err);
    const products = readStorage();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return false;
    products.splice(index, 1);
    writeStorage(products);
    return true;
  }
}

// ─────────────────────────────────────────────────────────────
//  updateProduct(id, updatedData)
//  Merges updatedData fields into the existing product.
// ─────────────────────────────────────────────────────────────
async function updateProduct(id, updatedData) {
  if (!id) {
    console.error('[productStore] updateProduct → id is required.');
    return null;
  }
  if (!updatedData || typeof updatedData !== 'object') {
    console.error('[productStore] updateProduct → updatedData must be an object.');
    return null;
  }

  const { id: _ignoreId, createdAt: _ignoreDate, ...safeData } = updatedData;

  if (safeData.price !== undefined) {
    safeData.price = parseFloat(Number(safeData.price).toFixed(2));
  }

  const updatePayload = {
    ...safeData,
    updatedAt: new Date().toISOString()
  };

  if (!window.supabaseClient) {
    const products = readStorage();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    const updated = { ...products[index], ...updatePayload };
    products[index] = updated;
    writeStorage(products);
    return updated;
  }

  try {
    const { data, error } = await window.supabaseClient
      .from('products')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    console.log(`[productStore] updateProduct(${id}) → Updated in Supabase:`, data);
    return data;
  } catch (err) {
    console.error(`[productStore] updateProduct(${id}) failed, falling back to localStorage:`, err);
    const products = readStorage();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    const updated = { ...products[index], ...updatePayload };
    products[index] = updated;
    writeStorage(products);
    return updated;
  }
}

// ─────────────────────────────────────────────────────────────
//  searchProducts(query)
//  Returns products matching the query.
// ─────────────────────────────────────────────────────────────
async function searchProducts(query) {
  const q = (query || '').toLowerCase().trim();
  if (!window.supabaseClient) {
    const products = readStorage();
    return q
      ? products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      : products;
  }
  try {
    let req = window.supabaseClient.from('products').select('*');
    if (q) {
      req = req.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
    }
    const { data, error } = await req.order('createdAt', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('[productStore] searchProducts failed, falling back to localStorage:', err);
    const products = readStorage();
    return q
      ? products.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
      : products;
  }
}

// ─────────────────────────────────────────────────────────────
//  clearProducts()
//  Removes ALL products.
// ─────────────────────────────────────────────────────────────
async function clearProducts() {
  if (!window.supabaseClient) {
    writeStorage([]);
    console.warn('[productStore] clearProducts → All products removed from localStorage.');
    return;
  }
  try {
    const { error } = await window.supabaseClient.from('products').delete().neq('id', '');
    if (error) throw error;
    console.warn('[productStore] clearProducts → All products removed from Supabase.');
  } catch (err) {
    console.error('[productStore] clearProducts failed:', err);
    writeStorage([]);
  }
}

// ─────────────────────────────────────────────────────────────
//  Initialize – ensure the storage key exists (fallback)
// ─────────────────────────────────────────────────────────────
(function init() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeStorage([]);
  }
})();

// ─────────────────────────────────────────────────────────────
//  Public API — attach to window so any page script can use it
// ─────────────────────────────────────────────────────────────
window.ProductStore = {
  getProducts,
  getProductById,
  addProduct,
  deleteProduct,
  updateProduct,
  searchProducts,
  clearProducts
};
