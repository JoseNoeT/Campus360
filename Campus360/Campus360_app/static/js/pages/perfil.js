import { ApiError, getCart, getSesionActual, updateProfile } from '../services/api.js';

const dom = {
    page: document.querySelector('.profile-page'),
    avatar: document.getElementById('profile-avatar'),
    fullName: document.getElementById('profile-fullname'),
    email: document.getElementById('profile-email'),
    role: document.getElementById('profile-role'),
    completionValue: document.getElementById('profile-completion-value'),
    completionBar: document.getElementById('profile-completion-bar'),
    completionCopy: document.getElementById('profile-completion-copy'),
    summaryCompletion: document.getElementById('profile-summary-completion'),
    summaryCart: document.getElementById('profile-cart-count'),
    summaryCartNote: document.getElementById('profile-cart-note'),
    toolsUsed: document.getElementById('profile-tools-used'),
    toolsUsedNote: document.getElementById('profile-tools-note'),
    completionNote: document.getElementById('profile-completion-note'),
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    correo: document.getElementById('correo'),
    birthDate: document.getElementById('fecha-nacimiento'),
    address: document.getElementById('direccion'),
    photo: document.getElementById('foto'),
    saveBtn: document.getElementById('btn-guardar-perfil'),
    feedback: document.getElementById('perfil-feedback'),
};

const DEFAULT_AVATAR = dom.avatar?.getAttribute('src') || '';

function getProfileStorageKey(user) {
    const stableId = user?.id || user?.id_usuario || user?.email || 'anonymous';
    return `campus360-profile-extra:${stableId}`;
}

function readStoredProfile(user) {
    try {
        const raw = window.localStorage.getItem(getProfileStorageKey(user));
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}

function persistStoredProfile(user, data) {
    try {
        window.localStorage.setItem(getProfileStorageKey(user), JSON.stringify(data));
    } catch {
        // Ignore storage failures to avoid blocking profile usage.
    }
}

function roleLabel(role) {
    const value = String(role || '').toUpperCase();
    if (value === 'ADMIN') return 'Administrador';
    if (value === 'DOCENTE') return 'Docente';
    return 'Alumno';
}

function readFormSnapshot(user) {
    const stored = readStoredProfile(user);
    return {
        birthDate: stored.birthDate || '',
        address: stored.address || '',
        avatar: stored.avatar || DEFAULT_AVATAR,
    };
}

function getCompletionData(user) {
    const firstName = (dom.nombre?.value || user?.first_name || '').trim();
    const lastName = (dom.apellido?.value || user?.last_name || '').trim();
    const email = (dom.correo?.value || user?.email || '').trim();
    const birthDate = (dom.birthDate?.value || '').trim();
    const address = (dom.address?.value || '').trim();

    const fields = [firstName, lastName, email, address, birthDate];
    const completed = fields.filter(Boolean).length;
    const percentage = Math.round((completed / fields.length) * 100);

    return {
        completed,
        percentage,
    };
}

function renderCompletion(user) {
    const { percentage, completed } = getCompletionData(user);
    const message = percentage >= 100
        ? 'Perfil académico completo. Tu experiencia ya está personalizada.'
        : percentage >= 60
            ? 'Vas avanzando. Completa los campos pendientes para fortalecer tu perfil académico.'
            : 'Completa tu perfil para personalizar tu experiencia.';

    if (dom.completionValue) dom.completionValue.textContent = `${percentage}%`;
    if (dom.summaryCompletion) dom.summaryCompletion.textContent = `${percentage}%`;
    if (dom.completionBar) dom.completionBar.style.width = `${percentage}%`;
    if (dom.completionCopy) dom.completionCopy.textContent = message;
    if (dom.completionNote) {
        dom.completionNote.textContent = percentage >= 60
            ? 'Buen progreso. Sigue completando tu información académica.'
            : 'Completa tu perfil para personalizar tu experiencia.';
    }

    const purchaseCount = Number(dom.page?.dataset.purchaseCount || 0);
    const cartCount = Number(dom.summaryCart?.dataset.count || dom.page?.dataset.cartCount || 0);
    const usedTools = [purchaseCount > 0, cartCount > 0, completed >= 4].filter(Boolean).length;
    if (dom.toolsUsed) {
        dom.toolsUsed.textContent = usedTools > 0 ? String(usedTools) : 'Sin registros aún';
    }
    if (dom.toolsUsedNote) {
        dom.toolsUsedNote.textContent = usedTools > 0
            ? 'Tu actividad académica empieza a consolidarse.'
            : 'Sin registros aún';
    }
}

function renderProfile(user) {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Usuario';
    const stored = readFormSnapshot(user);

    if (dom.fullName) dom.fullName.textContent = fullName;
    if (dom.email) dom.email.textContent = user?.email || '';
    if (dom.role) dom.role.textContent = roleLabel(user?.role);

    if (dom.nombre) dom.nombre.value = firstName;
    if (dom.apellido) dom.apellido.value = lastName;
    if (dom.correo) dom.correo.value = user?.email || '';
    if (dom.birthDate) dom.birthDate.value = stored.birthDate;
    if (dom.address) dom.address.value = stored.address;
    if (dom.avatar) dom.avatar.src = stored.avatar || DEFAULT_AVATAR;

    renderCompletion(user);
}

function showFeedback(message, isError = false) {
    if (!dom.feedback) return;
    dom.feedback.textContent = message;
    dom.feedback.className = `perfil-feedback ${isError ? 'perfil-feedback--error' : 'perfil-feedback--success'}`;
    dom.feedback.hidden = false;
    clearTimeout(dom.feedback._timer);
    dom.feedback._timer = setTimeout(() => {
        dom.feedback.hidden = true;
    }, 4000);
}

async function handleSave(event) {
    event.preventDefault();

    const first_name = (dom.nombre?.value || '').trim();
    const last_name = (dom.apellido?.value || '').trim();

    if (!first_name) {
        showFeedback('El nombre no puede estar vacío.', true);
        dom.nombre?.focus();
        return;
    }

    if (dom.saveBtn) {
        dom.saveBtn.disabled = true;
        dom.saveBtn.textContent = 'Guardando...';
    }

    try {
        const result = await updateProfile({ first_name, last_name });
        persistStoredProfile(result.user, {
            birthDate: dom.birthDate?.value || '',
            address: (dom.address?.value || '').trim(),
            avatar: dom.avatar?.src || DEFAULT_AVATAR,
        });
        renderProfile(result.user);
        showFeedback('Cambios guardados correctamente.');
    } catch (error) {
        const msg = error instanceof ApiError
            ? (error.data?.detail || 'Error al guardar cambios.')
            : 'Error de red. Intenta de nuevo.';
        showFeedback(msg, true);
    } finally {
        if (dom.saveBtn) {
            dom.saveBtn.disabled = false;
            dom.saveBtn.textContent = 'Guardar cambios';
        }
    }
}

function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

async function handleAvatarChange(event) {
    const file = event.target?.files?.[0];
    if (!file || !dom.avatar) return;

    try {
        const dataUrl = await fileToDataUrl(file);
        dom.avatar.src = dataUrl;
    } catch {
        showFeedback('No se pudo cargar la imagen seleccionada.', true);
    }
}

async function loadCartSummary() {
    if (!dom.summaryCart) return;

    try {
        const cart = await getCart();
        const count = Number(cart?.count || 0);
        dom.summaryCart.dataset.count = String(count);
        dom.summaryCart.textContent = count > 0 ? String(count) : 'Sin registros aún';
        if (dom.summaryCartNote) {
            dom.summaryCartNote.textContent = count > 0
                ? 'Tienes materiales listos para continuar.'
                : 'Tu carrito está vacío. Explora el catálogo para comenzar.';
        }
    } catch {
        dom.summaryCart.textContent = 'Sin registros aún';
        if (dom.summaryCartNote) {
            dom.summaryCartNote.textContent = 'Tu carrito está vacío. Explora el catálogo para comenzar.';
        }
    }
}

async function loadProfile() {
    try {
        const payload = await getSesionActual();
        const user = payload?.user || null;
        renderProfile(user);
        await loadCartSummary();
        renderCompletion(user);
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            window.location.href = '/login/';
            return;
        }

        if (dom.fullName) dom.fullName.textContent = 'No se pudo cargar el perfil';
        if (dom.email) dom.email.textContent = '';
        if (dom.role) dom.role.textContent = '';
    }
}

function bindCompletionInputListeners() {
    const updateCompletion = () => renderCompletion({
        first_name: dom.nombre?.value || '',
        last_name: dom.apellido?.value || '',
        email: dom.correo?.value || '',
    });

    [dom.nombre, dom.apellido, dom.birthDate, dom.address].forEach((field) => {
        field?.addEventListener('input', updateCompletion);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    dom.saveBtn?.addEventListener('click', handleSave);
    dom.photo?.addEventListener('change', handleAvatarChange);
    bindCompletionInputListeners();
});
