/**
 * Campus360 — Calculadora de Notas Ponderada (FASE 4)
 * Sistema universitario con ponderacion individual por evaluacion.
 */

const DEFAULT_EVALUATIONS = [
    { id: 'eval-1', name: 'Prueba n\u00b01', grade: null, weight: 32 },
    { id: 'eval-2', name: 'Prueba n\u00b02', grade: null, weight: 12 },
    { id: 'eval-3', name: 'Prueba n\u00b03', grade: null, weight: 32 },
    { id: 'eval-4', name: 'Prueba n\u00b04', grade: null, weight: 12 },
    { id: 'eval-5', name: 'Prueba n\u00b05', grade: null, weight: 12 },
];

let evaluations = [];
let evalIdCounter = DEFAULT_EVALUATIONS.length + 1;

function parseGrade(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = parseFloat(normalized);
    return isFinite(parsed) ? parsed : NaN;
}

function formatGrade(value) {
    return isFinite(value) ? value.toFixed(2) : '\u2014';
}

function formatPercent(value) {
    if (!isFinite(value)) return '0%';
    const rounded = Math.round(value * 10) / 10;
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function getEvaluations() { return evaluations; }

function calculateAccumulatedPoints(evals) {
    return evals.filter(e => e.grade !== null && isFinite(e.grade))
        .reduce((acc, e) => acc + e.grade * (e.weight / 100), 0);
}

function calculateCompletedWeight(evals) {
    return evals.filter(e => e.grade !== null && isFinite(e.grade))
        .reduce((acc, e) => acc + e.weight, 0);
}

function calculatePendingWeight(evals) {
    return 100 - calculateCompletedWeight(evals);
}

function calculateCurrentWeightedAverage(evals) {
    const completedWeight = calculateCompletedWeight(evals);
    if (completedWeight === 0) return null;
    return calculateAccumulatedPoints(evals) / (completedWeight / 100);
}

function calculateProjectedFinalGrade(evals) {
    const allHaveGrade = evals.length > 0 && evals.every(e => e.grade !== null && isFinite(e.grade));
    if (!allHaveGrade) return null;
    return calculateAccumulatedPoints(evals);
}

function calculateRequiredPendingAverage(evals, minimumGrade) {
    const pendingWeight = calculatePendingWeight(evals);
    if (pendingWeight <= 0) return null;
    const accumulated = calculateAccumulatedPoints(evals);
    return (minimumGrade - accumulated) / (pendingWeight / 100);
}

function getStatusInfo(evals, minimumGrade) {
    const hasAnyGrade = evals.some(e => e.grade !== null && isFinite(e.grade));
    if (!hasAnyGrade) {
        return { status: 'Pendiente', statusClass: 'calculator-status--pending', advice: 'Ingresa tus primeras notas para iniciar el analisis academico.' };
    }
    const projected = calculateProjectedFinalGrade(evals);
    if (projected !== null) {
        if (projected >= minimumGrade) return { status: 'Aprobado', statusClass: 'calculator-status--success', advice: 'Tu avance actual es favorable. Manten un rendimiento constante en lo pendiente.' };
        return { status: 'Reprobado', statusClass: 'calculator-status--danger', advice: 'Con los datos actuales, aprobar no es matematicamente alcanzable solo con lo pendiente.' };
    }
    const required = calculateRequiredPendingAverage(evals, minimumGrade);
    if (required === null) return { status: 'Pendiente', statusClass: 'calculator-status--pending', advice: 'Ingresa tus notas para analizar tu situacion.' };
    if (required < 2) return { status: 'Buen escenario', statusClass: 'calculator-status--success', advice: 'Tu avance actual es favorable. Manten un rendimiento constante en lo pendiente.' };
    if (required > 7) return { status: 'No alcanzable', statusClass: 'calculator-status--danger', advice: 'Con los datos actuales, aprobar no es matematicamente alcanzable solo con lo pendiente.' };
    if (required >= 6) return { status: 'En riesgo', statusClass: 'calculator-status--warning', advice: 'Estas cerca del limite. Prioriza las evaluaciones con mayor ponderacion.' };
    return { status: 'Alcanzable', statusClass: 'calculator-status--info', advice: `Necesitas promediar ${formatGrade(required)} en las evaluaciones pendientes para alcanzar la nota minima.` };
}

function validateEvaluation(evaluation) {
    const errors = [];
    if (!evaluation.name.trim()) errors.push('Una evaluacion no tiene nombre. Completa todos los nombres.');
    if (evaluation.grade !== null && (!isFinite(evaluation.grade) || evaluation.grade < 2 || evaluation.grade > 7)) {
        errors.push(`La nota de "${evaluation.name || 'una evaluacion'}" debe estar entre 2.0 y 7.0.`);
    }
    if (!isFinite(evaluation.weight) || evaluation.weight < 0 || evaluation.weight > 100) {
        errors.push(`La ponderacion de "${evaluation.name || 'una evaluacion'}" debe estar entre 0 y 100.`);
    }
    return errors;
}

function validateWeights(evals) {
    const total = evals.reduce((acc, e) => acc + (isFinite(e.weight) ? e.weight : 0), 0);
    const rounded = Math.round(total * 100) / 100;
    if (rounded !== 100) return `La suma de ponderaciones debe ser 100%. Actualmente suma ${rounded}%.`;
    return null;
}

function setFieldInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle('is-invalid', !!invalid);
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
}

function showValidationError(message) {
    const alert = document.getElementById('calculator-error');
    if (!alert) return;
    alert.textContent = message;
    alert.hidden = false;
    alert.focus();
}

function clearValidationError() {
    const alert = document.getElementById('calculator-error');
    if (!alert) return;
    alert.hidden = true;
    alert.textContent = '';
    document.querySelectorAll('#calculator-form .is-invalid').forEach(el => {
        el.classList.remove('is-invalid');
        el.setAttribute('aria-invalid', 'false');
    });
}

function focusFirstInvalidField() {
    const first = document.querySelector('#calculator-form .is-invalid');
    if (first) first.focus();
}

function escapeAttr(str) {
    return String(str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function renderEvaluations() {
    const list = document.getElementById('evaluations-list');
    if (!list) return;
    list.innerHTML = '';
    evaluations.forEach((ev, index) => {
        const item = document.createElement('div');
        item.className = 'evaluation-item';
        item.dataset.evalId = ev.id;
        const canRemove = evaluations.length > 1;
        item.innerHTML = `
            <div class="evaluation-item__header">
                <span class="evaluation-item__number" aria-hidden="true">${index + 1}</span>
                <div class="evaluation-item__name-wrap">
                    <label for="name-${ev.id}" class="visually-hidden">Nombre de la evaluacion ${index + 1}</label>
                    <input type="text" id="name-${ev.id}" class="form-control evaluation-name" placeholder="Nombre de la evaluacion" value="${escapeAttr(ev.name)}" data-eval-id="${ev.id}" data-field="name" aria-label="Nombre de evaluacion ${index + 1}">
                </div>
                ${canRemove ? `<button type="button" class="btn btn-outline-danger btn-sm evaluation-remove" data-eval-id="${ev.id}" aria-label="Eliminar ${escapeAttr(ev.name) || 'evaluacion ' + (index + 1)}">&times;</button>` : ''}
            </div>
            <div class="evaluation-item__fields">
                <div class="evaluation-field">
                    <label for="grade-${ev.id}" class="form-label">Nota</label>
                    <input type="number" id="grade-${ev.id}" class="form-control evaluation-grade" placeholder="Vacio = pendiente" min="2" max="7" step="0.1" inputmode="decimal" value="${ev.grade !== null ? ev.grade : ''}" data-eval-id="${ev.id}" data-field="grade" aria-label="Nota de ${escapeAttr(ev.name) || 'evaluacion ' + (index + 1)}">
                </div>
                <div class="evaluation-field">
                    <label for="weight-${ev.id}" class="form-label">Ponderacion %</label>
                    <input type="number" id="weight-${ev.id}" class="form-control evaluation-weight" placeholder="0-100" min="0" max="100" step="0.1" inputmode="decimal" value="${ev.weight}" data-eval-id="${ev.id}" data-field="weight" aria-label="Ponderacion de ${escapeAttr(ev.name) || 'evaluacion ' + (index + 1)}">
                </div>
            </div>
        `;
        list.appendChild(item);
    });
    updateWeightTotal();
}

function updateWeightTotal() {
    const totalEl = document.getElementById('weight-total');
    const summaryEl = document.getElementById('weight-summary');
    if (!totalEl || !summaryEl) return;
    const total = evaluations.reduce((acc, e) => acc + (isFinite(e.weight) ? e.weight : 0), 0);
    const rounded = Math.round(total * 100) / 100;
    totalEl.textContent = `${rounded}%`;
    const isOk = rounded === 100;
    totalEl.className = `weight-summary__value ${isOk ? 'weight-ok' : 'weight-warn'}`;
    summaryEl.setAttribute('aria-label', `Suma de ponderaciones: ${rounded}%. ${isOk ? 'Correcto.' : 'Debe sumar 100%.'}`);
}

function renderSummary() {
    const minimumGrade = parseGrade(document.getElementById('minimum_grade')?.value) ?? 4;
    const evals = getEvaluations();
    const accumulated = calculateAccumulatedPoints(evals);
    const completedWeight = calculateCompletedWeight(evals);
    const pendingWeight = calculatePendingWeight(evals);
    const average = calculateCurrentWeightedAverage(evals);
    const projected = calculateProjectedFinalGrade(evals);
    const required = calculateRequiredPendingAverage(evals, minimumGrade);
    const { status, statusClass, advice } = getStatusInfo(evals, minimumGrade);

    const set = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };

    set('summary-points', formatGrade(accumulated));
    set('summary-average', average !== null ? formatGrade(average) : '\u2014');
    set('summary-completed-weight', formatPercent(completedWeight));
    set('summary-pending-weight', formatPercent(pendingWeight));
    set('summary-final-grade', projected !== null ? formatGrade(projected) : 'Pendiente');

    if (required === null) set('summary-required-grade', '\u2014');
    else if (!isFinite(required) || required > 7) set('summary-required-grade', 'No alcanzable');
    else if (required < 2) set('summary-required-grade', '< 2.00');
    else set('summary-required-grade', formatGrade(required));

    const statusEl = document.getElementById('summary-status');
    if (statusEl) { statusEl.textContent = status; statusEl.className = `value calculator-status ${statusClass}`; }

    const progressCompletedEl = document.getElementById('summary-progress-completed');
    const progressPendingEl = document.getElementById('summary-progress-pending');
    const progressBarEl = document.getElementById('summary-progress-bar');
    const progressTrackEl = document.getElementById('summary-progress-track');
    const boundedCompleted = Math.max(0, Math.min(100, completedWeight));
    const boundedPending = Math.max(0, Math.min(100, pendingWeight));
    if (progressCompletedEl) progressCompletedEl.textContent = formatPercent(boundedCompleted);
    if (progressPendingEl) progressPendingEl.textContent = formatPercent(boundedPending);
    if (progressBarEl) progressBarEl.style.width = `${boundedCompleted}%`;
    if (progressTrackEl) {
        progressTrackEl.setAttribute('aria-valuenow', String(Math.round(boundedCompleted)));
        progressTrackEl.setAttribute('aria-valuetext', `Ponderacion rendida ${formatPercent(boundedCompleted)}. Ponderacion pendiente ${formatPercent(boundedPending)}.`);
    }
    set('summary-advice', advice);
}

function syncFieldToState(evalId, field, rawValue) {
    const ev = evaluations.find(e => e.id === evalId);
    if (!ev) return;
    if (field === 'name') {
        ev.name = rawValue;
    } else if (field === 'grade') {
        const trimmed = rawValue.trim();
        ev.grade = trimmed ? (isFinite(parseGrade(trimmed)) ? parseGrade(trimmed) : null) : null;
    } else if (field === 'weight') {
        const parsed = parseFloat(rawValue);
        ev.weight = isFinite(parsed) ? parsed : 0;
    }
}

function addEvaluation() {
    const id = `eval-${evalIdCounter++}`;
    evaluations.push({ id, name: `Evaluacion ${evaluations.length + 1}`, grade: null, weight: 0 });
    renderEvaluations();
    renderSummary();
    const nameInput = document.getElementById(`name-${id}`);
    if (nameInput) nameInput.focus();
}

function removeEvaluation(id) {
    if (evaluations.length <= 1) return;
    evaluations = evaluations.filter(e => e.id !== id);
    renderEvaluations();
    renderSummary();
}

function resetCalculator() {
    evaluations = DEFAULT_EVALUATIONS.map(e => ({ ...e }));
    evalIdCounter = DEFAULT_EVALUATIONS.length + 1;
    const minInput = document.getElementById('minimum_grade');
    if (minInput) minInput.value = '4.0';
    clearValidationError();
    renderEvaluations();
    renderSummary();
}

function validateAll() {
    const allErrors = [];
    evaluations.forEach(ev => validateEvaluation(ev).forEach(e => allErrors.push(e)));
    const weightError = validateWeights(evaluations);
    if (weightError) allErrors.push(weightError);
    const minGrade = parseGrade(document.getElementById('minimum_grade')?.value);
    const minInvalid = minGrade === null || !isFinite(minGrade) || minGrade < 2 || minGrade > 7;
    setFieldInvalid(document.getElementById('minimum_grade'), minInvalid);
    if (minInvalid) allErrors.push('La nota minima de aprobacion debe estar entre 2.0 y 7.0.');
    return allErrors;
}

function debounce(fn, delay) {
    let timerId;
    return function debounced(...args) {
        clearTimeout(timerId);
        timerId = window.setTimeout(() => fn.apply(this, args), delay);
    };
}

const debouncedRefresh = debounce(() => { updateWeightTotal(); renderSummary(); }, 250);

function handleFormInput(event) {
    const target = event.target;
    if (!target) return;
    const evalId = target.dataset.evalId;
    const field = target.dataset.field;
    if (evalId && field) { syncFieldToState(evalId, field, target.value); debouncedRefresh(); return; }
    if (target.id === 'minimum_grade') debouncedRefresh();
}

function handleRemoveClick(event) {
    const btn = event.target.closest('.evaluation-remove');
    if (!btn) return;
    const evalId = btn.dataset.evalId;
    if (evalId) removeEvaluation(evalId);
}

function handleSubmit(event) {
    event.preventDefault();
    clearValidationError();
    const errors = validateAll();
    if (errors.length) { showValidationError(errors[0]); focusFirstInvalidField(); return; }
    renderSummary();
}

function initCalculator() {
    const form = document.getElementById('calculator-form');
    const addBtn = document.getElementById('add-eval-btn');
    const clearBtn = document.getElementById('clear-calculator-btn');
    const errorAlert = document.getElementById('calculator-error');
    if (errorAlert) errorAlert.setAttribute('tabindex', '-1');
    if (form) {
        form.addEventListener('submit', handleSubmit);
        form.addEventListener('input', handleFormInput);
        form.addEventListener('change', handleFormInput);
        form.addEventListener('click', handleRemoveClick);
    }
    if (addBtn) addBtn.addEventListener('click', addEvaluation);
    if (clearBtn) clearBtn.addEventListener('click', resetCalculator);
    resetCalculator();
}

document.addEventListener('DOMContentLoaded', initCalculator);