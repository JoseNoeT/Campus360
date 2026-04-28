/**
 * Campus360 — API Service Layer
 * Central point for all backend communication.
 * All fetch calls go through apiFetch() for consistent
 * CSRF handling, JSON parsing and error normalization.
 *
 * Usage (from other modules):
 *   import { getLibros, buscarLibros } from '/static/js/services/api.js';
 */

// ── CSRF ───────────────────────────────────────────────
export function getCookie(name) {
    if (!name || typeof document === 'undefined') return '';
    const cookies = document.cookie ? document.cookie.split(';') : [];
    for (const cookie of cookies) {
        const trimmed = cookie.trim();
        if (trimmed.startsWith(`${name}=`)) {
            return decodeURIComponent(trimmed.slice(name.length + 1));
        }
    }
    return '';
}

export function getCSRFToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    const metaToken = meta ? (meta.getAttribute('content') || '').trim() : '';
    if (metaToken) return metaToken;
    return getCookie('csrftoken');
}

// ── Base fetch wrapper ─────────────────────────────────
/**
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<any>} Parsed JSON or throws ApiError
 */
export async function apiFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const needsCsrf = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    const defaults = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (needsCsrf) {
        defaults.headers['X-CSRFToken'] = getCSRFToken();
    }

    const config = {
        ...defaults,
        ...options,
        headers: { ...defaults.headers, ...(options.headers || {}) },
    };

    let response;
    try {
        response = await fetch(url, config);
    } catch (networkError) {
        throw new ApiError('Sin conexión. Revisa tu red.', 0, null);
    }

    if (!response.ok) {
        let body = null;
        try { body = await response.json(); } catch (_) { /* ignore */ }
        throw new ApiError(
            body?.detail || `Error ${response.status}`,
            response.status,
            body
        );
    }

    // 204 No Content
    if (response.status === 204) return null;

    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }
    return null;
}

// ── Error type ─────────────────────────────────────────
export class ApiError extends Error {
    constructor(message, status, body) {
        super(message);
        this.name    = 'ApiError';
        this.status  = status;
        this.body    = body;
    }
}

// ── Endpoints ──────────────────────────────────────────

/** GET /api/libros/ */
export const getLibros = () => apiFetch('/api/libros/');

/** GET /api/buscar-libros/?q=... */
export const buscarLibros = (q) =>
    apiFetch(`/api/buscar-libros/?q=${encodeURIComponent(q)}`);

/** POST /api/auth/register/ */
export const registrarUsuario = (data) =>
    apiFetch('/api/auth/register/', {
        method: 'POST',
        body: JSON.stringify(data),
    });

/** POST /api/auth/login/ */
export const iniciarSesion = ({ email, password }) =>
    apiFetch('/api/auth/login/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
    });

/** POST /api/auth/logout/ */
export const cerrarSesion = () =>
    apiFetch('/api/auth/logout/', {
        method: 'POST',
    });

/** GET /api/auth/me/ */
export const getSesionActual = () => apiFetch('/api/auth/me/');

/** PUT /api/auth/me/ — actualiza first_name y last_name del usuario autenticado */
export const updateProfile = ({ first_name, last_name }) =>
    apiFetch('/api/auth/me/', {
        method: 'PUT',
        body: JSON.stringify({ first_name, last_name }),
    });

/** Biblioteca search API (backend: Open Library + fallback local) */
export const buscarOpenLibrary = (q) =>
    apiFetch(
        `/api/biblioteca/search/?q=${encodeURIComponent(q)}&maxResults=20`
    );

// Backward-compatible alias while modules migrate naming.
export const buscarGoogleBooks = buscarOpenLibrary;

/** GET /api/cart/ */
export const getCart = () => apiFetch('/api/cart/');

/** POST /api/cart/items/ */
export const addToCart = ({ isbn, cantidad = 1 }) =>
    apiFetch('/api/cart/items/', {
        method: 'POST',
        body: JSON.stringify({ isbn, cantidad }),
    });

/** DELETE /api/cart/items/:isbn/ */
export const removeFromCart = (isbn) =>
    apiFetch(`/api/cart/items/${encodeURIComponent(isbn)}/`, {
        method: 'DELETE',
    });

/** POST /api/orders/checkout/ */
export const checkoutOrder = () =>
    apiFetch('/api/orders/checkout/', {
        method: 'POST',
    });
