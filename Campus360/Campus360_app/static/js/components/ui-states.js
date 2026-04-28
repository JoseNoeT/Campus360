/**
 * Campus360 — UI State Components
 * Reusable loading / error / empty state renderers.
 * All functions modify a container's innerHTML declaratively.
 *
 * Usage:
 *   import { showLoading, showError, showEmpty, clearState }
 *     from '/static/js/components/ui-states.js';
 */

// ── Loading ────────────────────────────────────────────
/**
 * @param {Element} container
 * @param {string}  [message]
 */
export function showLoading(container, message = 'Cargando…') {
    container.setAttribute('aria-busy', 'true');
    container.innerHTML = `
        <div class="ui-state ui-state--loading" role="status" aria-live="polite">
            <span class="ui-state__spinner" aria-hidden="true"></span>
            <p class="ui-state__msg">${escapeHtml(message)}</p>
        </div>`;
}

// ── Error ──────────────────────────────────────────────
/**
 * @param {Element}  container
 * @param {string}   [message]
 * @param {Function} [onRetry]  callback for retry button
 */
export function showError(container, message = 'Algo salió mal.', onRetry = null) {
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = `
        <div class="ui-state ui-state--error" role="alert">
            <span class="ui-state__icon" aria-hidden="true">⚠️</span>
            <p class="ui-state__msg">${escapeHtml(message)}</p>
            ${onRetry ? '<button class="btn btn-accent btn-sm ui-state__retry">Reintentar</button>' : ''}
        </div>`;

    if (onRetry) {
        container.querySelector('.ui-state__retry').addEventListener('click', onRetry);
    }
}

// ── Empty ──────────────────────────────────────────────
/**
 * @param {Element} container
 * @param {string}  [message]
 * @param {string}  [icon]
 */
export function showEmpty(container, message = 'No hay resultados.', icon = '📭') {
    container.setAttribute('aria-busy', 'false');
    container.innerHTML = `
        <div class="ui-state ui-state--empty">
            <span class="ui-state__icon" aria-hidden="true">${icon}</span>
            <p class="ui-state__msg">${escapeHtml(message)}</p>
        </div>`;
}

// ── Clear ──────────────────────────────────────────────
export function clearState(container) {
    container.removeAttribute('aria-busy');
    container.innerHTML = '';
}

// ── Internal ───────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}
