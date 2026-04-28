/**
 * Campus360 — Biblioteca Page
 * Academic exploration page powered by external references + local fallback.
 */
import { showLoading, clearState } from '../components/ui-states.js';
import { buscarOpenLibrary, getLibros, ApiError } from '../services/api.js';

const searchInput = document.getElementById('search-box');
const searchBtn = document.getElementById('search');
const resultsState = document.querySelector('#list-output .biblioteca-state');
const resultsGrid = document.querySelector('#list-output .row');
const quickSearchButtons = Array.from(document.querySelectorAll('.biblioteca-chip'));
const announcer = document.getElementById('biblioteca-announcer');
const catalogBaseUrl = document.getElementById('list-output')?.dataset.catalogUrl || '/venta-libro/';

function announce(message) {
    if (announcer) {
        announcer.textContent = message;
    }
}

function setStateMarkup(markup = '') {
    if (!resultsState) return;
    resultsState.innerHTML = markup;
}

function setResultsBusy(message) {
    if (!resultsGrid) return;
    setStateMarkup('');
    showLoading(resultsGrid, message);
}

function clearResults() {
    if (!resultsGrid) return;
    clearState(resultsGrid);
}

function renderInitialState() {
    clearResults();
    setStateMarkup(`
        <div class="biblioteca-state-card" role="status" aria-live="polite">
            <h3 class="h5 mb-2">Empieza buscando un tema académico.</h3>
            <p class="mb-0 biblioteca-empty-hint">Prueba con una palabra clave o usa una de estas sugerencias para iniciar tu exploración.</p>
            <div class="biblioteca-state-card__chips" aria-label="Sugerencias de búsqueda inicial">
                <button type="button" class="biblioteca-state-suggestion" data-query="Python">Python</button>
                <button type="button" class="biblioteca-state-suggestion" data-query="Cálculo">Cálculo</button>
                <button type="button" class="biblioteca-state-suggestion" data-query="Literatura">Literatura</button>
                <button type="button" class="biblioteca-state-suggestion" data-query="Historia">Historia</button>
            </div>
        </div>
    `);
    announce('Biblioteca360 lista para iniciar una búsqueda académica.');
}

function renderFriendlyEmpty(query) {
    clearResults();
    setStateMarkup(`
        <div class="biblioteca-state-card" role="status" aria-live="polite">
            <h3 class="h5 mb-2">No encontramos referencias para “${escapeHtml(query)}”.</h3>
            <p class="mb-0 biblioteca-empty-hint">Prueba con otro tema, un autor o una palabra clave más amplia.</p>
        </div>
    `);
    announce(`No se encontraron resultados para ${query}.`);
}

function renderFallbackMessage() {
    setStateMarkup(`
        <div class="biblioteca-message" role="status" aria-live="polite">
            La búsqueda externa no está disponible temporalmente. Mostrando recomendaciones locales.
        </div>
    `);
}

function getSourceLabel(source) {
    if (source === 'openlibrary') return 'Fuente externa';
    if (source === 'local_recommended') return 'Recomendación local';
    if (source === 'local') return 'Referencia local';
    return 'Referencia';
}

function getYearLabel(publishedDate) {
    const year = String(publishedDate || '').trim();
    return year || 'Año no disponible';
}

function getCatalogSearchUrl(title, authors) {
    const seed = [title, authors].filter(Boolean).join(' ');
    const url = new URL(catalogBaseUrl, window.location.origin);
    if (seed) {
        url.searchParams.set('q', seed);
    }
    return `${url.pathname}${url.search}`;
}

function createResultCard(item, source) {
    const info = item?.volumeInfo || {};
    const title = info.title || 'Sin título';
    const authors = (info.authors || ['Autor desconocido']).join(', ');
    const year = getYearLabel(info.publishedDate);
    const cover = info.imageLinks?.thumbnail || 'https://via.placeholder.com/320x420?text=Sin+portada';
    const previewUrl = info.previewLink || '#';
    const sourceLabel = getSourceLabel(source);
    const hasPreview = previewUrl && previewUrl !== '#';

    const col = document.createElement('div');
    col.className = 'col-12 col-sm-6 col-lg-4';
    col.innerHTML = `
        <article class="biblioteca-result-card">
            <div class="biblioteca-result-card__cover-wrap">
                <img
                    src="${escapeAttr(cover)}"
                    alt="Portada de ${escapeHtml(title)}"
                    class="biblioteca-result-card__cover"
                    loading="lazy"
                    width="320"
                    height="420">
            </div>
            <div class="biblioteca-result-card__body">
                <div class="biblioteca-result-card__meta">
                    <h3 class="biblioteca-result-card__title">${escapeHtml(title)}</h3>
                    <p class="biblioteca-result-card__author">${escapeHtml(authors)}</p>
                    <p class="biblioteca-result-card__year">${escapeHtml(year)}</p>
                </div>
                <div class="biblioteca-result-card__badges">
                    <span class="biblioteca-badge biblioteca-badge--source">${escapeHtml(sourceLabel)}</span>
                </div>
                <div class="biblioteca-result-card__actions">
                    ${hasPreview
                        ? `<a class="btn btn-accent btn-sm" href="${escapeAttr(previewUrl)}" target="_blank" rel="noopener">Ver más</a>`
                        : '<button class="btn btn-outline-secondary btn-sm" type="button" disabled>Ver más</button>'}
                    <a class="btn btn-outline-secondary btn-sm" href="${escapeAttr(getCatalogSearchUrl(title, authors))}">Buscar en catálogo</a>
                </div>
            </div>
        </article>
    `;
    return col;
}

function renderResults(items, options = {}) {
    const { source = 'reference', fallback = false, announcement = '' } = options;
    clearResults();
    if (fallback) {
        renderFallbackMessage();
    } else {
        setStateMarkup('');
    }

    const fragment = document.createDocumentFragment();
    items.forEach((item) => {
        fragment.appendChild(createResultCard(item, source));
    });

    resultsGrid.appendChild(fragment);
    announce(announcement || `${items.length} resultados cargados en Biblioteca360.`);
}

async function handleSearch(forcedQuery = null) {
    const query = (forcedQuery ?? searchInput?.value ?? '').trim();

    if (!resultsGrid || !searchInput) {
        return;
    }

    if (!query) {
        renderInitialState();
        searchInput.focus();
        return;
    }

    searchInput.value = query;
    setResultsBusy('Buscando referencias académicas…');

    try {
        const data = await buscarOpenLibrary(query);

        if (data?.source === 'openlibrary' && Array.isArray(data.items) && data.items.length) {
            renderResults(data.items, {
                source: 'openlibrary',
                announcement: `Se encontraron ${data.items.length} referencias externas para ${query}.`,
            });
            return;
        }

        if ((data?.source === 'local' || data?.source === 'local_recommended') && Array.isArray(data.items) && data.items.length) {
            renderResults(data.items, {
                source: data.source,
                fallback: true,
                announcement: `Mostrando ${data.items.length} recomendaciones locales para ${query}.`,
            });
            return;
        }

        const localResults = await buscarEnCatalogoLocal(query);
        if (localResults.length) {
            renderResults(localResults.map(mapLocalBookToItem), {
                source: 'local',
                fallback: true,
                announcement: `Mostrando ${localResults.length} resultados locales para ${query}.`,
            });
            return;
        }

        renderFriendlyEmpty(query);
    } catch (error) {
        const localResults = await safeGetLocalFallback(query);
        if (localResults.length) {
            renderResults(localResults, {
                source: 'local',
                fallback: true,
                announcement: `La fuente externa no respondió. Se muestran ${localResults.length} recomendaciones locales para ${query}.`,
            });
            return;
        }

        if (error instanceof ApiError) {
            renderFriendlyEmpty(query);
            return;
        }

        renderFriendlyEmpty(query);
    }
}

async function buscarEnCatalogoLocal(query) {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) return [];

    const libros = await getLibros();
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

    return filtrados;
}

async function obtenerRecomendadosLocales(limit = 12) {
    const libros = await getLibros();
    if (!Array.isArray(libros)) return [];
    return libros.slice(0, Math.max(1, Number(limit || 12)));
}

async function safeGetLocalFallback(query) {
    try {
        const localResults = await buscarEnCatalogoLocal(query);
        if (localResults.length) {
            return localResults.map(mapLocalBookToItem);
        }

        const recommended = await obtenerRecomendadosLocales(12);
        return recommended.map(mapLocalBookToItem);
    } catch {
        return [];
    }
}

function mapLocalBookToItem(item) {
    return {
        id: String(item?.isbn || item?.titulo || ''),
        volumeInfo: {
            title: item?.titulo || 'Sin título',
            authors: [item?.autor || 'Autor desconocido'],
            publishedDate: item?.anio ? String(item.anio) : '',
            imageLinks: {
                thumbnail: item?.imagen || '',
            },
            previewLink: '#',
        },
    };
}

function handleSuggestionClick(event) {
    const button = event.target.closest('[data-query]');
    if (!button) return;

    const query = button.dataset.query || '';
    handleSearch(query);
}

searchBtn?.addEventListener('click', () => handleSearch());

searchInput?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        event.preventDefault();
        handleSearch();
    }
});

document.querySelector('.biblioteca-quick-search')?.addEventListener('click', handleSuggestionClick);
document.querySelector('#list-output .biblioteca-state')?.addEventListener('click', handleSuggestionClick);

renderInitialState();

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
