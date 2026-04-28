import { ApiError, getSesionActual, updateProfile } from '../services/api.js';

const dom = {
    fullName: document.getElementById('profile-fullname'),
    email: document.getElementById('profile-email'),
    role: document.getElementById('profile-role'),
    nombre: document.getElementById('nombre'),
    apellido: document.getElementById('apellido'),
    correo: document.getElementById('correo'),
    saveBtn: document.getElementById('btn-guardar-perfil'),
    feedback: document.getElementById('perfil-feedback'),
};

function roleLabel(role) {
    const value = String(role || '').toUpperCase();
    if (value === 'ADMIN') return 'Administrador';
    if (value === 'DOCENTE') return 'Docente';
    return 'Alumno';
}

function renderProfile(user) {
    const firstName = user?.first_name || '';
    const lastName = user?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim() || user?.email || 'Usuario';

    if (dom.fullName) dom.fullName.textContent = fullName;
    if (dom.email) dom.email.textContent = user?.email || '';
    if (dom.role) dom.role.textContent = roleLabel(user?.role);

    if (dom.nombre) dom.nombre.value = firstName;
    if (dom.apellido) dom.apellido.value = lastName;
    if (dom.correo) dom.correo.value = user?.email || '';
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

async function loadProfile() {
    try {
        const payload = await getSesionActual();
        renderProfile(payload?.user || null);
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        if (dom.fullName) dom.fullName.textContent = 'No se pudo cargar el perfil';
        if (dom.email) dom.email.textContent = '';
        if (dom.role) dom.role.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    dom.saveBtn?.addEventListener('click', handleSave);
});
