/**
 * ============================================================
 *  productStore.js — Veloura Admin | Product Data Module
 *  Handles all product CRUD operations via localStorage.
 *
 *  Storage Key : "products"
 *  Product Shape:
 *    {
 *      id          : string   – unique identifier (timestamp-based)
 *      name        : string
 *      price       : number
 *      image       : string   – URL or relative path
 *      description : string
 *      affiliateLink : string
 *      createdAt   : string   – ISO date string
 *    }
 * ============================================================
 */

const STORAGE_KEY = 'products';

// ─────────────────────────────────────────────────────────────
//  Helper – generate a unique ID
// ─────────────────────────────────────────────────────────────
function generateId() {
  // Combines timestamp + random suffix for near-zero collision chance
  return 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}

// ─────────────────────────────────────────────────────────────
//  Helper – read raw array from localStorage
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
//  Helper – persist array back to localStorage
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
//  Returns all products as an array (empty if none yet).
// ─────────────────────────────────────────────────────────────
function getProducts() {
  const products = readStorage();
  console.log(`[productStore] getProducts → ${products.length} product(s) found.`);
  return products;
}

// ─────────────────────────────────────────────────────────────
//  getProductById(id)
//  Returns a single product object or null.
// ─────────────────────────────────────────────────────────────
function getProductById(id) {
  const products = readStorage();
  const product = products.find(p => p.id === id) || null;
  if (product) {
    console.log(`[productStore] getProductById(${id}) → found:`, product);
  } else {
    console.warn(`[productStore] getProductById(${id}) → not found.`);
  }
  return product;
}

// ─────────────────────────────────────────────────────────────
//  addProduct(product)
//  Accepts a plain object (without id/createdAt – both are added here).
//  Returns the newly created product object.
// ─────────────────────────────────────────────────────────────
function addProduct(product) {
  // Validate required fields
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
    images       : product.images || [],  // Store the full images array
    description  : (description || '').trim(),
    affiliateLink: (affiliateLink || '').trim(),
    category     : (product.category || '').trim(),
    createdAt    : new Date().toISOString()
  };

  // If images array has items but image is empty, use first image
  if (!newProduct.image && newProduct.images.length > 0) {
    newProduct.image = newProduct.images[0];
  }

  const products = readStorage();
  products.push(newProduct);
  writeStorage(products);

  console.log('[productStore] addProduct → Product added successfully:', newProduct);
  return newProduct;
}

// ─────────────────────────────────────────────────────────────
//  deleteProduct(id)
//  Removes the product with the given id.
//  Returns true if deleted, false if not found.
// ─────────────────────────────────────────────────────────────
function deleteProduct(id) {
  if (!id) {
    console.error('[productStore] deleteProduct → id is required.');
    return false;
  }

  const products = readStorage();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    console.warn(`[productStore] deleteProduct(${id}) → product not found; nothing deleted.`);
    return false;
  }

  const [removed] = products.splice(index, 1);
  writeStorage(products);

  console.log(`[productStore] deleteProduct(${id}) → Deleted:`, removed);
  return true;
}

// ─────────────────────────────────────────────────────────────
//  updateProduct(id, updatedData)
//  Merges updatedData fields into the existing product.
//  Returns the updated product, or null if not found.
// ─────────────────────────────────────────────────────────────
function updateProduct(id, updatedData) {
  if (!id) {
    console.error('[productStore] updateProduct → id is required.');
    return null;
  }
  if (!updatedData || typeof updatedData !== 'object') {
    console.error('[productStore] updateProduct → updatedData must be an object.');
    return null;
  }

  const products = readStorage();
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    console.warn(`[productStore] updateProduct(${id}) → product not found; nothing updated.`);
    return null;
  }

  // Prevent overwriting the id or createdAt
  const { id: _ignoreId, createdAt: _ignoreDate, ...safeData } = updatedData;

  // Normalize price if provided
  if (safeData.price !== undefined) {
    safeData.price = parseFloat(Number(safeData.price).toFixed(2));
  }

  const updatedProduct = {
    ...products[index],
    ...safeData,
    updatedAt: new Date().toISOString()
  };

  products[index] = updatedProduct;
  writeStorage(products);

  console.log(`[productStore] updateProduct(${id}) → Updated:`, updatedProduct);
  return updatedProduct;
}

// ─────────────────────────────────────────────────────────────
//  searchProducts(query)
//  Returns products whose name or description matches the query.
// ─────────────────────────────────────────────────────────────
function searchProducts(query) {
  const q = (query || '').toLowerCase().trim();
  const products = readStorage();
  const results = q
    ? products.filter(
        p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      )
    : products;
  console.log(`[productStore] searchProducts("${query}") → ${results.length} result(s).`);
  return results;
}

// ─────────────────────────────────────────────────────────────
//  clearProducts()
//  Removes ALL products (use with caution — for dev/testing).
// ─────────────────────────────────────────────────────────────
function clearProducts() {
  writeStorage([]);
  console.warn('[productStore] clearProducts → All products have been removed.');
}

// ─────────────────────────────────────────────────────────────
//  Initialize – ensure the storage key always exists
// ─────────────────────────────────────────────────────────────
(function init() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeStorage([]);
    console.log('[productStore] Initialized empty products store in localStorage.');
  } else {
    console.log('[productStore] Existing products store detected — ready.');
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
