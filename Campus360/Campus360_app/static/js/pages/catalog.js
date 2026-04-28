import {
    ApiError,
    getCart,
    addToCart,
    removeFromCart,
    checkoutOrder,
} from '../services/api.js';

// --- Funciones auxiliares para el carrito moderno ---
function createEmptyCartNode() {
    const empty = document.createElement('div');
    empty.className = 'cart-empty-state text-center text-muted py-3';
    empty.textContent = 'Tu carrito está vacío';
    return empty;
}

function updateTotal(items) {
    const totalNode = document.querySelector('.carrito-precio-total');
    if (!totalNode) return;
    const total = items.reduce((sum, item) => {
        const precio = Number(item.precio || 0);
        const cantidad = Number(item.cantidad || 1);
        return sum + precio * cantidad;
    }, 0);
    totalNode.textContent = formatCurrency(total);
}

function formatCurrency(value) {
    return new Intl.NumberFormat('es-CL', {
        style: 'currency',
        currency: 'CLP',
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}

// Stubs mínimos para funciones auxiliares si faltan
if (typeof announceCart !== 'function') {
    window.announceCart = function(msg) {
        const announcer = document.getElementById('cart-announcer');
        if (announcer) {
            announcer.textContent = msg;
        }
    };
}

if (typeof showCartMessage !== 'function') {
    window.showCartMessage = function(msg, type) {
        const feedback = document.getElementById('cart-feedback');
        if (!feedback) return;
        feedback.textContent = msg;
        feedback.hidden = false;
        feedback.className = 'cart-feedback cart-feedback--' + (type || 'info');
        setTimeout(() => { feedback.hidden = true; }, 2200);
    };
}

if (typeof getIsbnFromButton !== 'function') {
    window.getIsbnFromButton = function(btn) {
        return btn?.dataset?.isbn || '';
    };
}

if (typeof setAddButtonLoading !== 'function') {
    window.setAddButtonLoading = function(btn, loading) {
        if (!btn) return;
        btn.classList.toggle('is-loading', !!loading);
        btn.disabled = !!loading;
    };
}

if (typeof setCheckoutLoading !== 'function') {
    window.setCheckoutLoading = function(loading) {
        const btn = document.getElementById('cart-checkout');
        if (!btn) return;
        btn.classList.toggle('is-loading', !!loading);
        btn.disabled = !!loading;
    };
}


const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

// Referencias DOM centralizadas para evitar errores de referencia
const dom = {
    cartItems: document.getElementById('cart-items') || $("#cart-items"),
    checkoutButton: document.getElementById('cart-checkout') || $("#cart-checkout"),
    cartPanel: document.getElementById('carrito') || $("#carrito"),
    cartTotal: document.querySelector('.carrito-total'),
    cartEmptyMessage: document.querySelector('.cart-empty-message'),
    continueShoppingButton: document.getElementById('cart-continue-shopping') || $("#cart-continue-shopping"),
};

// Estado del catálogo (búsqueda, filtros, paginación)
const catalogState = {
    page: 1,
    page_size: 12,
    search: "",
    genero: "",
    min: "",
    max: "",
    ordering: "",
    loading: false,
    error: null,
    total: 0,
    results: [],
    genres: [],
};

// Estado del carrito
const cartState = {
    items: [],
    loading: false,
    error: null,
    pendingAddIsbns: new Set(),
    pendingRemoveIsbns: new Set(),
    checkoutLoading: false
};

const DEBUG_CATALOG = true;

function debugLog(scope, message, data) {
    if (!DEBUG_CATALOG) return;
    if (data === undefined) {
        console.log(`[${scope}] ${message}`);
        return;
    }
    console.log(`[${scope}] ${message}`, data);
}

function buildQuery(params) {
    const esc = encodeURIComponent;
    return Object.entries(params)
        .filter(([_, v]) => v !== "" && v !== null && v !== undefined)
        .map(([k, v]) => `${esc(k)}=${esc(v)}`)
        .join("&");
}

function updateCatalogCount(count) {
    const el = $("#catalog-count-value");
    if (el) el.textContent = count ?? '—';
}

async function fetchLibros(params = {}) {
    catalogState.loading = true;
    catalogState.error = null;
    renderLoading();
    try {
        const merged = { ...catalogState, ...params };
        const query = buildQuery({
            page: merged.page,
            page_size: merged.page_size,
            search: merged.search,
            genero: merged.genero,
            min: merged.min,
            max: merged.max,
            ordering: merged.ordering,
        });
        debugLog('catalog', 'Consultando API de catálogo', {
            page: merged.page,
            page_size: merged.page_size,
            search: merged.search,
            genero: merged.genero,
            min: merged.min,
            max: merged.max,
            ordering: merged.ordering,
        });
        const res = await fetch(`/api/catalogo/?${query}`, { credentials: "include" });
        if (!res.ok) throw new Error("Error al cargar catálogo");
        const data = await res.json();
        catalogState.results = data.results;
        catalogState.total = data.count;
        catalogState.loading = false;
        debugLog('catalog', 'Libros recibidos desde BD (API /api/catalogo/)', {
            totalEnBD: data.count,
            renderizadosEnPagina: Array.isArray(data.results) ? data.results.length : 0,
        });
        debugLog(
            'catalog',
            'Títulos recibidos (primeros 10)',
            (Array.isArray(data.results) ? data.results : []).slice(0, 10).map((libro) => ({
                isbn: libro?.isbn,
                titulo: libro?.titulo,
                autor: libro?.autor,
            }))
        );
        updateCatalogCount(data.count);
        renderCatalog(catalogState.results);
        renderPagination(data);
        renderFeatured(catalogState.results);
        debugLog('catalog', 'Catálogo cargado', { total: data.count, pageResults: data.results.length });
        if (!data.results.length) renderEmpty();
    } catch (e) {
        catalogState.error = e.message;
        renderError(e.message);
        catalogState.loading = false;
        updateCatalogCount(0);
        debugLog('catalog', 'Error cargando catálogo', e?.message || e);
    }
}

function renderCatalog(items) {
    const grid = $("#catalog-grid");
    if (!grid) return;
    grid.innerHTML = "";
    if (!items.length) {
        debugLog('catalog', 'No hay libros para renderizar en la grilla actual');
        return;
    }
    debugLog('catalog', 'Renderizando libros en catálogo', { cantidad: items.length });
    const frag = document.createDocumentFragment();
    for (const libro of items) {
        const card = document.createElement("div");
        card.className = "catalog-card card h-100 shadow-sm p-2";
        card.innerHTML = `
            <div class="catalog-img-wrap mb-2">
                <img src="${libro.imagen || '/static/img/book-placeholder.png'}" alt="${libro.titulo}" loading="lazy" decoding="async" class="catalog-img w-100 rounded" onerror="this.src='/static/img/book-placeholder.png'"/>
                <span class="badge bg-info position-absolute top-0 end-0 m-2">${libro.destacado ? 'Destacado' : ''}</span>
            </div>
            <div class="catalog-info">
                <h3 class="h6 mb-1">${libro.titulo}</h3>
                <p class="catalog-autor text-muted small mb-1">${libro.autor || ''}</p>
                <span class="badge bg-secondary mb-2">${libro.genero || ''}</span>
                <p class="catalog-precio fw-semibold mb-2">$${libro.precio.toLocaleString()}</p>
                <div class="d-flex gap-2">
                  <button class="btn btn-accent btn-sm flex-grow-1" data-action="add-to-cart" data-isbn="${libro.isbn}">Agregar al carrito</button>
                  <button class="btn btn-outline-secondary btn-sm" data-action="ver-detalle" data-isbn="${libro.isbn}">Ver detalle</button>
                </div>
            </div>
        `;
        frag.appendChild(card);
    }
    grid.appendChild(frag);
}

function renderFeatured(items) {
    const featured = $("#catalog-featured");
    if (!featured) return;
    featured.innerHTML = "";
    // Mostrar los primeros 4 libros como destacados
    const frag = document.createDocumentFragment();
    for (const libro of items.slice(0, 4)) {
        const card = document.createElement("div");
        card.className = "col-6 col-md-3";
        card.innerHTML = `
            <div class="card h-100 shadow-sm p-2">
                <img src="${libro.imagen || '/static/img/book-placeholder.png'}" alt="${libro.titulo}" loading="lazy" decoding="async" class="catalog-img w-100 rounded mb-2" onerror="this.src='/static/img/book-placeholder.png'"/>
                <h3 class="h6 mb-1">${libro.titulo}</h3>
                <p class="text-muted small mb-1">${libro.autor || ''}</p>
                <span class="badge bg-secondary mb-2">${libro.genero || ''}</span>
                <p class="fw-semibold mb-2">$${libro.precio.toLocaleString()}</p>
            </div>
        `;
        frag.appendChild(card);
    }
    featured.appendChild(frag);
}

function renderPagination(meta) {
    const pag = $("#catalog-pagination");
    if (!pag) return;
    pag.innerHTML = "";
    const totalPages = Math.ceil(meta.count / catalogState.page_size);
    if (totalPages <= 1) return;
    for (let i = 1; i <= totalPages; i++) {
        const btn = document.createElement("button");
        btn.textContent = i;
        btn.className = "btn btn-sm" + (i === catalogState.page ? " active" : "");
        btn.onclick = () => {
            catalogState.page = i;
            updateURL();
            fetchLibros();
        };
        pag.appendChild(btn);
    }
}

function renderLoading() {
    const grid = $("#catalog-grid");
    if (grid) {
        grid.innerHTML = '<div class="row g-3">' +
            Array(6).fill('').map(() => `
                <div class="col-12 col-sm-6 col-md-4">
                  <div class="card skeleton-card h-100 p-2">
                    <div class="skeleton-img mb-2"></div>
                    <div class="skeleton-line w-75 mb-1"></div>
                    <div class="skeleton-line w-50 mb-1"></div>
                    <div class="skeleton-line w-25 mb-2"></div>
                    <div class="skeleton-btn w-100"></div>
                  </div>
                </div>`).join('') + '</div>';
    }
    updateCatalogCount('—');
}

function renderError(msg) {
    const stateDiv = $("#catalog-state");
    if (stateDiv) {
        stateDiv.innerHTML = `
        <div class="card text-center p-4 my-4 mx-auto" style="max-width:400px;">
            <div class="mb-2" style="font-size:2.5rem;">❌</div>
            <h2 class="h5 mb-2">No pudimos cargar el catálogo</h2>
            <p class="text-muted mb-3">Intenta nuevamente o revisa tu conexión.</p>
            <button class="btn btn-accent" id="catalog-retry">Reintentar</button>
        </div>`;
        $("#catalog-retry").onclick = () => fetchLibros();
    }
}

function renderEmpty() {
    const stateDiv = $("#catalog-state");
    if (stateDiv) {
        stateDiv.innerHTML = `
        <div class="card text-center p-4 my-4 mx-auto" style="max-width:400px;">
            <div class="mb-2" style="font-size:2.5rem;">📭</div>
            <h2 class="h5 mb-2">No encontramos libros</h2>
            <p class="text-muted mb-3">Prueba cambiando los filtros o limpiando la búsqueda.</p>
            <button class="btn btn-outline-secondary" id="catalog-clear-empty">Limpiar filtros</button>
        </div>`;
        $("#catalog-clear-empty").onclick = () => clearFilters();
    }
    updateCatalogCount(0);
}

function clearFilters() {
    $("#catalog-search").value = "";
    $("#catalog-genero").value = "";
    $("#catalog-ordering").value = "";
    $("#catalog-min").value = "";
    $("#catalog-max").value = "";
    catalogState.search = "";
    catalogState.genero = "";
    catalogState.ordering = "";
    catalogState.min = "";
    catalogState.max = "";
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function updateURL() {
    const params = {
        page: catalogState.page,
        search: catalogState.search,
        genero: catalogState.genero,
        min: catalogState.min,
        max: catalogState.max,
        ordering: catalogState.ordering,
    };
    const query = buildQuery(params);
    window.history.replaceState({}, "", "?" + query);
}

function debounce(fn, ms) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), ms);
    };
}

function handleSearch(e) {
    catalogState.search = e.target.value;
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function handleGenero(e) {
    catalogState.genero = e.target.value;
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function handleOrdering(e) {
    catalogState.ordering = e.target.value;
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function handleMin(e) {
    catalogState.min = e.target.value;
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function handleMax(e) {
    catalogState.max = e.target.value;
    catalogState.page = 1;
    updateURL();
    fetchLibros();
}

function handleCategoryChip(e) {
    const cat = e.target.dataset.category;
    if (cat) {
        $("#catalog-genero").value = cat;
        catalogState.genero = cat;
        catalogState.page = 1;
        updateURL();
        fetchLibros();
    }
}

document.addEventListener("DOMContentLoaded", () => {
    $("#catalog-search").addEventListener("input", debounce(handleSearch, 300));
    $("#catalog-genero").addEventListener("change", handleGenero);
    $("#catalog-ordering").addEventListener("change", handleOrdering);
    $("#catalog-min").addEventListener("input", debounce(handleMin, 300));
    $("#catalog-max").addEventListener("input", debounce(handleMax, 300));
    $$(".category-chip").forEach(btn => btn.addEventListener("click", handleCategoryChip));
    $("#catalog-clear").addEventListener("click", clearFilters);
    $("#catalog-apply").addEventListener("click", fetchLibros);
    fetchLibros();
});

function createCartItemNode(item) {
    const wrapper = document.createElement('div');
    wrapper.className = 'carrito-item';
    wrapper.dataset.isbn = item.isbn;

    const image = document.createElement('img');
    image.src = item.imagen || '';
    image.width = 80;
    image.height = 80;
    image.loading = 'lazy';
    image.alt = `Portada de ${item.titulo || 'libro'}`;

    const details = document.createElement('div');
    details.className = 'carrito-item-detalles';

    const title = document.createElement('span');
    title.className = 'carrito-item-titulo';
    title.textContent = item.titulo || 'Libro';

    const qty = document.createElement('div');
    qty.className = 'selector-cantidad';
    qty.textContent = `Cantidad: ${Number(item.cantidad || 1)}`;

    const price = document.createElement('span');
    price.className = 'carrito-item-precio';
    price.textContent = formatCurrency(item.precio || 0);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'btn-eliminar';
    removeButton.dataset.action = 'remove-from-cart';
    removeButton.dataset.isbn = item.isbn;
    removeButton.setAttribute('aria-label', `Eliminar ${item.titulo || 'libro'} del carrito`);
    removeButton.textContent = 'Eliminar';

    details.appendChild(title);
    details.appendChild(qty);
    details.appendChild(price);

    wrapper.appendChild(image);
    wrapper.appendChild(details);
    wrapper.appendChild(removeButton);

    return wrapper;
}

function syncCartVisibility(items) {
    const hasItems = Array.isArray(items) && items.length > 0;

    if (dom.cartPanel) {
        dom.cartPanel.hidden = false;
        dom.cartPanel.style.display = '';
    }

    if (dom.cartEmptyMessage) {
        dom.cartEmptyMessage.style.display = hasItems ? 'none' : '';
    }

    if (dom.continueShoppingButton) {
        dom.continueShoppingButton.style.display = hasItems ? '' : 'none';
    }
}

function renderCart(items) {
    if (!dom.cartItems) return;

    dom.cartItems.textContent = '';
    syncCartVisibility(items);

    if (!items.length) {
        dom.cartItems.appendChild(createEmptyCartNode());
        updateTotal([]);
        announceCart('Carrito vacío.');
        return;
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        fragment.appendChild(createCartItemNode(item));
    });

    dom.cartItems.appendChild(fragment);
    updateTotal(items);

    const count = items.reduce((sum, item) => sum + Number(item.cantidad || 0), 0);
    announceCart(`${count} libros en el carrito.`);
}

function applyCartPayload(payload) {
    const items = Array.isArray(payload?.items) ? payload.items : [];
    cartState.items = items;
    cartState.error = null;
    renderCart(items);
    debugLog('cart', 'Carrito sincronizado', { items: items.length });
}

async function bootstrapCart() {
    cartState.loading = true;
    debugLog('cart', 'Inicializando carrito');
    try {
        const payload = await getCart();
        applyCartPayload(payload);
    } catch (error) {
        cartState.error = error;
        cartState.items = [];
        renderCart([]);
        showCartMessage('No se pudo cargar el carrito.', 'error');
        debugLog('cart', 'Error inicializando carrito', error?.message || error);
    } finally {
        cartState.loading = false;
    }
}

async function handleAddClick(button) {
    if (!button) return;

    const isbn = getIsbnFromButton(button);
    if (!isbn || cartState.pendingAddIsbns.has(isbn)) return;

    cartState.pendingAddIsbns.add(isbn);
    setAddButtonLoading(button, true);
    debugLog('cart', 'Agregando libro al carrito', { isbn });

    try {
        const payload = await addToCart({ isbn, cantidad: 1 });
        applyCartPayload(payload);
        showCartMessage('Libro agregado al carrito.', 'success');
        debugLog('cart', 'Libro agregado', { isbn });
    } catch (error) {
        if (error instanceof ApiError) {
            showCartMessage(error.message || 'Error al agregar libro.', 'error');
        } else {
            showCartMessage('Sin conexión con el servidor.', 'warning');
        }
        debugLog('cart', 'Error agregando libro', error?.message || error);
    } finally {
        cartState.pendingAddIsbns.delete(isbn);
        setAddButtonLoading(button, false);
    }
}

async function handleRemoveClick(removeButton) {
    if (!removeButton) return;

    const isbn = removeButton.dataset.isbn;
    if (!isbn || cartState.pendingRemoveIsbns.has(isbn)) return;

    cartState.pendingRemoveIsbns.add(isbn);
    removeButton.disabled = true;
    debugLog('cart', 'Eliminando libro del carrito', { isbn });

    try {
        const payload = await removeFromCart(isbn);
        applyCartPayload(payload);
        showCartMessage('Libro eliminado del carrito.', 'success');
        debugLog('cart', 'Libro eliminado', { isbn });
    } catch (error) {
        removeButton.disabled = false;
        if (error instanceof ApiError) {
            showCartMessage(error.message || 'Error al eliminar libro.', 'error');
        } else {
            showCartMessage('No se pudo eliminar el libro.', 'warning');
        }
        debugLog('cart', 'Error eliminando libro', error?.message || error);
    } finally {
        cartState.pendingRemoveIsbns.delete(isbn);
    }
}

async function handleCheckout() {
    if (cartState.checkoutLoading) return;
    if (!cartState.items.length) {
        showCartMessage('Agrega al menos un libro al carrito.', 'warning');
        return;
    }

    cartState.checkoutLoading = true;
    setCheckoutLoading(true);
    debugLog('cart', 'Iniciando checkout', { items: cartState.items.length });

    try {
        const payload = await checkoutOrder();
        cartState.items = [];
        renderCart([]);
        showCartMessage('Compra realizada con éxito.', 'success');

        const redirectUrl = payload?.confirmation_url || '/checkout/confirmacion/';
        debugLog('cart', 'Checkout exitoso', { redirectUrl });
        window.setTimeout(() => {
            window.location.href = redirectUrl;
        }, 650);
    } catch (error) {
        if (error instanceof ApiError) {
            showCartMessage(error.message || 'No se pudo completar el checkout.', 'error');
        } else {
            showCartMessage('Sin conexión con el servidor.', 'warning');
        }
        debugLog('cart', 'Error en checkout', error?.message || error);
    } finally {
        cartState.checkoutLoading = false;
        setCheckoutLoading(false);
    }
}

function initEvents() {
    document.addEventListener('click', (event) => {
        const addButton = event.target.closest('[data-action="add-to-cart"]');
        if (addButton) {
            handleAddClick(addButton);
            return;
        }

        const removeButton = event.target.closest('[data-action="remove-from-cart"]');
        if (removeButton) {
            handleRemoveClick(removeButton);
        }
    });

    dom.checkoutButton?.addEventListener('click', (event) => {
        event.preventDefault();
        handleCheckout();
    });

    dom.continueShoppingButton?.addEventListener('click', (event) => {
        event.preventDefault();
        const grid = document.getElementById('catalog-grid');
        if (grid) {
            grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    debugLog('catalog', 'Inicializando página de catálogo');
    initEvents();
    await bootstrapCart();
});
