/**
 * Campus360 — Biblioteca Page
 * Replaces the old jQuery-based Biblioteca360.js.
 * Uses the service layer and ui-states components.
 */
import { showLoading, showError, showEmpty, clearState } from '../components/ui-states.js';
import { buscarOpenLibrary, getLibros, ApiError } from '../services/api.js';

const DEBUG_BIBLIOTECA = true;

function debugLog(message, data) {
    if (!DEBUG_BIBLIOTECA) return;
    if (data === undefined) {
        console.log(`[biblioteca] ${message}`);
        return;
    }
    console.log(`[biblioteca] ${message}`, data);
}

// ── DOM refs ───────────────────────────────────────────
const searchInput  = document.getElementById('search-box');
const searchBtn    = document.getElementById('search');
const resultsGrid  = document.querySelector('#list-output .row');

if (!searchBtn || !resultsGrid) {
    console.warn('[biblioteca] Required DOM elements not found.');
}

// ── Search handler ─────────────────────────────────────
async function handleSearch() {
    const query = searchInput?.value.trim();
    debugLog('Búsqueda iniciada', { query });

    if (!query) {
        showError(resultsGrid, 'Escribe un término para buscar.', handleSearch);
        searchInput?.focus();
        debugLog('Búsqueda cancelada: query vacío');
        return;
    }

    showLoading(resultsGrid, 'Buscando libros…');

    try {
        const data = await buscarOpenLibrary(query);
        debugLog('Respuesta API Biblioteca recibida', {
            source: data?.source,
            totalItems: data?.totalItems,
            items: Array.isArray(data?.items) ? data.items.length : 0,
        });

        if (!data.totalItems || data.totalItems === 0) {
            // Si API externa no trae resultados, intenta con el catalogo local
            const localResults = await buscarEnCatalogoLocal(query);
            debugLog('API externa sin resultados, usando fallback local', {
                localCount: localResults.length,
            });
            if (!localResults.length) {
                const recomendados = await obtenerRecomendadosLocales(12);
                debugLog('Sin coincidencias exactas. Mostrando recomendados locales', {
                    recommendedCount: recomendados.length,
                });
                if (recomendados.length) {
                    renderLocalBooks(recomendados);
                    return;
                }
                showEmpty(resultsGrid, 'No se encontraron resultados para esa búsqueda.', '📚');
                return;
            }
            renderLocalBooks(localResults);
            return;
        }

        renderBooks(data.items);
        debugLog('Render externo completado', { rendered: data.items?.length || 0 });

    } catch (err) {
        debugLog('Error en API externa', err?.message || err);
        // Fallback robusto si falla el proveedor externo
        try {
            const localResults = await buscarEnCatalogoLocal(query);
            if (localResults.length) {
                debugLog('Fallback local exitoso tras error externo', { localCount: localResults.length });
                renderLocalBooks(localResults);
                return;
            }

            const recomendados = await obtenerRecomendadosLocales(12);
            if (recomendados.length) {
                debugLog('Sin coincidencias exactas tras error de Google. Mostrando recomendados locales', {
                    recommendedCount: recomendados.length,
                });
                renderLocalBooks(recomendados);
                return;
            }
        } catch (_) {
            // Si también falla el fallback, mostramos el error original
            debugLog('Fallback local también falló');
        }

        const msg = err instanceof ApiError
            ? err.message
            : 'Error al conectar con el servidor de búsqueda.';
        showError(resultsGrid, `${msg}. Sin resultados en API externa ni catálogo local.`, handleSearch);
    }
}

// ── Render ─────────────────────────────────────────────
function renderBooks(items) {
    clearState(resultsGrid);
    debugLog('Renderizando resultados externos', { count: items?.length || 0 });

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const info      = item.volumeInfo || {};
        const title     = info.title     || 'Sin título';
        const authors   = (info.authors  || ['Autor desconocido']).join(', ');
        const cover     = info.imageLinks?.thumbnail
            || 'https://via.placeholder.com/128x180?text=Sin+portada';
        const previewUrl = info.previewLink || '#';

        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-3';
        col.innerHTML = `
            <article class="book-card h-100 d-flex flex-column p-2">
                <a href="${escapeAttr(previewUrl)}" target="_blank" rel="noopener"
                   aria-label="Ver vista previa de ${escapeHtml(title)}">
                    <img
                        src="${escapeAttr(cover)}"
                        alt="Portada de ${escapeHtml(title)}"
                        class="book-cover w-100 rounded mb-2"
                        loading="lazy"
                        width="128"
                        height="180">
                </a>
                <p class="fw-semibold small mb-0 flex-grow-1">${escapeHtml(title)}</p>
                <p class="text-muted" style="font-size:var(--text-xs)">${escapeHtml(authors)}</p>
            </article>`;

        fragment.appendChild(col);
    });

    resultsGrid.appendChild(fragment);
}

async function buscarEnCatalogoLocal(query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const libros = await getLibros();
    debugLog('Catálogo local cargado', { totalLibros: Array.isArray(libros) ? libros.length : 0 });
    if (!Array.isArray(libros)) return [];

    const filtrados = libros.filter((libro) => {
        const titulo = normalizeText(libro?.titulo);
        const autor = normalizeText(libro?.autor);
        const genero = normalizeText(libro?.genero);
        const editorial = normalizeText(libro?.editorial);

        return (
            titulo.includes(normalizedQuery)
            || autor.includes(normalizedQuery)
            || genero.includes(normalizedQuery)
            || editorial.includes(normalizedQuery)
        );
    });

    debugLog('Resultados filtrados en catálogo local', {
        query: normalizedQuery,
        count: filtrados.length,
    });

    return filtrados;
}

function renderLocalBooks(items) {
    clearState(resultsGrid);
    debugLog('Renderizando resultados locales', { count: items?.length || 0 });

    const fragment = document.createDocumentFragment();

    items.forEach((item) => {
        const title = item?.titulo || 'Sin título';
        const authors = item?.autor || 'Autor desconocido';
        const cover = item?.imagen || 'https://via.placeholder.com/128x180?text=Sin+portada';

        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2 mb-3';
        col.innerHTML = `
            <article class="book-card h-100 d-flex flex-column p-2">
                <img
                    src="${escapeAttr(cover)}"
                    alt="Portada de ${escapeHtml(title)}"
                    class="book-cover w-100 rounded mb-2"
                    loading="lazy"
                    width="128"
                    height="180">
                <p class="fw-semibold small mb-0 flex-grow-1">${escapeHtml(title)}</p>
                <p class="text-muted" style="font-size:var(--text-xs)">${escapeHtml(authors)}</p>
            </article>`;

        fragment.appendChild(col);
    });

    resultsGrid.appendChild(fragment);
}

async function obtenerRecomendadosLocales(limit = 12) {
    const libros = await getLibros();
    if (!Array.isArray(libros)) return [];
    return libros.slice(0, Math.max(1, Number(limit || 12)));
}

// ── Event listeners ────────────────────────────────────
searchBtn?.addEventListener('click', handleSearch);

searchInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSearch();
});

// ── Helpers ────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function escapeAttr(str) {
    return String(str).replace(/"/g, '%22').replace(/'/g, '%27');
}

function normalizeText(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}
