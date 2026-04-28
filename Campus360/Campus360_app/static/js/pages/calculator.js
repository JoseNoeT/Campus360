function parseGradeValue(value) {
    if (value === null || value === undefined) return null;
    const normalized = String(value).trim().replace(',', '.');
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function debounce(fn, delay) {
    let timerId;
    return function debounced(...args) {
        clearTimeout(timerId);
        timerId = window.setTimeout(() => fn.apply(this, args), delay);
    };
}

function formatGrade(value) {
    return Number.isFinite(value) ? value.toFixed(2) : '—';
}

function setFieldInvalid(input, invalid) {
    if (!input) return;
    input.classList.toggle('is-invalid', !!invalid);
    input.setAttribute('aria-invalid', invalid ? 'true' : 'false');
}

function focusFirstInvalidField() {
    const firstInvalid = document.querySelector('#calculator-form .is-invalid');
    if (firstInvalid) {
        firstInvalid.focus();
    }
}

function clearValidationErrors() {
    const alert = document.getElementById('calculator-error');
    if (alert) {
        alert.hidden = true;
        alert.textContent = '';
    }

    document.querySelectorAll('#calculator-form .is-invalid').forEach((element) => {
        setFieldInvalid(element, false);
    });
}

function showValidationError(message) {
    const alert = document.getElementById('calculator-error');
    if (!alert) return;

    alert.hidden = false;
    alert.textContent = message;
    alert.focus();
}

function getSoftWarningMessage(details) {
    if (details.invalidPartials) {
        return 'Revisa tus notas parciales. Deben estar entre 2.0 y 7.0.';
    }
    if (details.invalidExam) {
        return 'La nota del examen debe estar entre 2.0 y 7.0.';
    }
    if (details.invalidWeights) {
        return 'La configuración de ponderaciones debe sumar 100 y mantenerse en rangos válidos.';
    }
    if (details.invalidMinimumGrade) {
        return 'La nota mínima de aprobación debe estar entre 2.0 y 7.0.';
    }
    return 'Completa o corrige los datos para obtener una simulación precisa.';
}

function calculateAverage(notes) {
    if (!Array.isArray(notes) || !notes.length) return null;
    const sum = notes.reduce((acc, note) => acc + note, 0);
    return sum / notes.length;
}

function calculateFinalGrade(partialAverage, examGrade, partialWeight, examWeight) {
    if (!Number.isFinite(partialAverage) || !Number.isFinite(examGrade)) return null;
    return partialAverage * (partialWeight / 100) + examGrade * (examWeight / 100);
}

function calculateRequiredExamGrade(partialAverage, partialWeight, examWeight, minimumGrade) {
    if (!Number.isFinite(partialAverage) || !Number.isFinite(minimumGrade)) return null;
    if (examWeight === 0) {
        return partialAverage >= minimumGrade ? 2.0 : Infinity;
    }

    return (minimumGrade - partialAverage * (partialWeight / 100)) / (examWeight / 100);
}

function getStatusClass(status) {
    if (status === 'Pendiente') return 'result-status--pending';
    if (status === 'Aprobado') return 'result-status--success';
    if (status === 'En riesgo') return 'result-status--warning';
    return 'result-status--danger';
}

function getStatus(result) {
    if (result.status) {
        return result.status;
    }
    if (result.finalGrade !== null) {
        if (result.finalGrade >= result.minimumGrade) {
            return 'Aprobado';
        }
        return result.requiredExamGrade !== null && result.requiredExamGrade <= 7 ? 'En riesgo' : 'Reprobado';
    }

    if (result.requiredExamGrade !== null && result.requiredExamGrade <= 2) {
        return 'Aprobado';
    }
    if (result.requiredExamGrade !== null && result.requiredExamGrade <= 7) {
        return 'En riesgo';
    }
    return 'Reprobado';
}

function getAdvice(status) {
    if (status === 'Pendiente') {
        return 'Completa tus notas para obtener una recomendación.';
    }
    if (status === 'Aprobado') {
        return 'Vas bien. Mantén el ritmo y refuerza los contenidos principales.';
    }
    if (status === 'En riesgo') {
        return 'Estás cerca. Prioriza los temas con mayor dificultad antes del examen.';
    }
    return 'Necesitas reforzar contenidos y simular una nueva estrategia de estudio.';
}

function renderResult(result) {
    const averageOutput = document.getElementById('promedio');
    const finalOutput = document.getElementById('nota_final');
    const summaryAverage = document.getElementById('summary-average');
    const summaryFinal = document.getElementById('summary-final-grade');
    const summaryRequired = document.getElementById('summary-required-grade');
    const summaryStatus = document.getElementById('summary-status');
    const summaryAdvice = document.getElementById('summary-advice');

    const status = getStatus(result);
    const advice = result.advice || getAdvice(status);
    const requiredLabel = result.requiredLabel || (result.requiredExamGrade === Infinity
        ? 'No alcanzable'
        : formatGrade(result.requiredExamGrade));
    const finalLabel = result.finalLabel || (result.finalGrade === null ? 'Pendiente' : formatGrade(result.finalGrade));

    if (averageOutput) averageOutput.value = formatGrade(result.partialAverage);
    if (finalOutput) finalOutput.value = result.finalGrade === null ? '' : formatGrade(result.finalGrade);
    if (summaryAverage) summaryAverage.textContent = formatGrade(result.partialAverage);
    if (summaryFinal) summaryFinal.textContent = finalLabel;
    if (summaryRequired) summaryRequired.textContent = requiredLabel;
    if (summaryStatus) {
        summaryStatus.textContent = status;
        summaryStatus.className = `value ${getStatusClass(status)}`;
    }
    if (summaryAdvice) summaryAdvice.textContent = advice;
}

function evaluateCalculatorState(options = {}) {
    const { strict = false } = options;
    const partialWeightInput = document.getElementById('partial_weight');
    const examWeightInput = document.getElementById('exam_weight');
    const minimumGradeInput = document.getElementById('minimum_grade');
    const examInput = document.getElementById('nota_examen');
    const noteInputs = Array.from(document.querySelectorAll('.note-input'));

    const details = {
        hasEmptyPartials: false,
        invalidPartials: false,
        invalidExam: false,
        invalidWeights: false,
        invalidMinimumGrade: false,
    };

    const notes = [];
    noteInputs.forEach((input) => {
        const rawValue = input.value.trim();
        const parsed = parseGradeValue(rawValue);
        const empty = rawValue === '';
        const valid = Number.isFinite(parsed) && parsed >= 2 && parsed <= 7;

        if (empty) {
            details.hasEmptyPartials = true;
            setFieldInvalid(input, strict);
            return;
        }

        if (!valid) {
            details.invalidPartials = true;
            setFieldInvalid(input, strict);
            return;
        }

        setFieldInvalid(input, false);
        notes.push(parsed);
    });

    const partialWeight = parseGradeValue(partialWeightInput?.value);
    const examWeight = parseGradeValue(examWeightInput?.value);
    const minimumGrade = parseGradeValue(minimumGradeInput?.value);
    const examRawValue = examInput?.value.trim() || '';
    const examGrade = parseGradeValue(examRawValue);
    const examFilled = examRawValue !== '';

    const weightsInRange = Number.isFinite(partialWeight) && Number.isFinite(examWeight)
        && partialWeight >= 0 && partialWeight <= 100
        && examWeight >= 0 && examWeight <= 100;
    details.invalidWeights = !weightsInRange || partialWeight + examWeight !== 100;
    setFieldInvalid(partialWeightInput, strict && details.invalidWeights);
    setFieldInvalid(examWeightInput, strict && details.invalidWeights);

    details.invalidMinimumGrade = !(Number.isFinite(minimumGrade) && minimumGrade >= 2 && minimumGrade <= 7);
    setFieldInvalid(minimumGradeInput, strict && details.invalidMinimumGrade);

    details.invalidExam = examFilled && !(Number.isFinite(examGrade) && examGrade >= 2 && examGrade <= 7);
    setFieldInvalid(examInput, strict && details.invalidExam);

    if (strict) {
        if (details.invalidPartials || details.hasEmptyPartials) {
            throw new Error('Cada nota parcial debe estar entre 2.0 y 7.0 y no puede quedar vacía.');
        }
        if (details.invalidWeights) {
            throw new Error('La suma de los pesos debe ser exactamente 100 y cada peso debe estar entre 0 y 100.');
        }
        if (details.invalidMinimumGrade) {
            throw new Error('La nota mínima de aprobación debe estar entre 2.0 y 7.0.');
        }
        if (details.invalidExam) {
            throw new Error('La nota del examen debe estar entre 2.0 y 7.0.');
        }
    }

    if (!strict && (details.invalidPartials || details.invalidExam || details.invalidWeights || details.invalidMinimumGrade)) {
        return {
            partialAverage: notes.length ? calculateAverage(notes) : null,
            finalGrade: null,
            requiredExamGrade: null,
            minimumGrade: Number.isFinite(minimumGrade) ? minimumGrade : 4,
            status: 'En riesgo',
            finalLabel: 'Advertencia',
            requiredLabel: 'Revisar datos',
            advice: getSoftWarningMessage(details),
        };
    }

    if (!notes.length || details.hasEmptyPartials || !Number.isFinite(partialWeight) || !Number.isFinite(examWeight) || !Number.isFinite(minimumGrade)) {
        return {
            partialAverage: notes.length ? calculateAverage(notes) : null,
            finalGrade: null,
            requiredExamGrade: null,
            minimumGrade: Number.isFinite(minimumGrade) ? minimumGrade : 4,
            status: 'Pendiente',
            finalLabel: 'Pendiente',
            requiredLabel: 'Pendiente',
            advice: getAdvice('Pendiente'),
        };
    }

    const partialAverage = calculateAverage(notes);
    const finalGrade = examFilled ? calculateFinalGrade(partialAverage, examGrade, partialWeight, examWeight) : null;
    const requiredExamGrade = calculateRequiredExamGrade(partialAverage, partialWeight, examWeight, minimumGrade);

    return {
        partialAverage,
        finalGrade,
        requiredExamGrade,
        minimumGrade,
    };
}

function refreshLiveSummary() {
    clearValidationErrors();
    const result = evaluateCalculatorState({ strict: false });
    renderResult(result);
}

const refreshLiveSummaryDebounced = debounce(refreshLiveSummary, 250);

function clearCalculator() {
    clearValidationErrors();

    document.querySelectorAll('.note-input').forEach((input, index) => {
        input.value = '';
        const wrapper = input.closest('.calculator-note-group');
        if (index > 1 && wrapper) {
            wrapper.remove();
        }
    });

    const examInput = document.getElementById('nota_examen');
    const partialWeightInput = document.getElementById('partial_weight');
    const examWeightInput = document.getElementById('exam_weight');
    const minimumGradeInput = document.getElementById('minimum_grade');
    const averageOutput = document.getElementById('promedio');
    const finalOutput = document.getElementById('nota_final');
    const summaryAverage = document.getElementById('summary-average');
    const summaryFinal = document.getElementById('summary-final-grade');
    const summaryRequired = document.getElementById('summary-required-grade');
    const summaryStatus = document.getElementById('summary-status');
    const summaryAdvice = document.getElementById('summary-advice');

    if (examInput) examInput.value = '';
    if (partialWeightInput) partialWeightInput.value = '60';
    if (examWeightInput) examWeightInput.value = '40';
    if (minimumGradeInput) minimumGradeInput.value = '4.0';
    if (averageOutput) averageOutput.value = '';
    if (finalOutput) finalOutput.value = '';
    if (summaryAverage) summaryAverage.textContent = '—';
    if (summaryFinal) summaryFinal.textContent = '—';
    if (summaryRequired) summaryRequired.textContent = '—';
    if (summaryStatus) {
        summaryStatus.textContent = 'Pendiente';
        summaryStatus.className = 'value result-status--pending';
    }
    if (summaryAdvice) {
        summaryAdvice.textContent = 'Completa tus notas para obtener una recomendación.';
    }
}

function createNoteField(index) {
    const wrapper = document.createElement('div');
    wrapper.className = 'mb-3 calculator-note-group';

    const label = document.createElement('label');
    const input = document.createElement('input');

    input.type = 'number';
    input.className = 'form-control note-input';
    input.id = `nota${index}`;
    input.name = `nota${index}`;
    input.min = '2';
    input.max = '7';
    input.step = '0.1';
    input.inputMode = 'decimal';
    input.required = true;

    label.className = 'form-label';
    label.setAttribute('for', input.id);
    label.textContent = `Nota ${index}`;

    wrapper.appendChild(label);
    wrapper.appendChild(input);

    return wrapper;
}

function handleSubmit(event) {
    event.preventDefault();
    clearValidationErrors();

    try {
        const result = evaluateCalculatorState({ strict: true });
        renderResult(result);
    } catch (error) {
        showValidationError(error.message || 'Revisa los datos ingresados.');
        focusFirstInvalidField();
    }
}

function addNote() {
    clearValidationErrors();
    const container = document.querySelector('.additional-notes');
    if (!container) return;

    const nextIndex = container.querySelectorAll('.note-input').length + 1;
    container.appendChild(createNoteField(nextIndex));
    refreshLiveSummaryDebounced();
}

function removeLastNote() {
    clearValidationErrors();
    const groups = Array.from(document.querySelectorAll('.additional-notes .calculator-note-group'));
    if (groups.length <= 2) {
        showValidationError('Debes mantener al menos las dos notas base.');
        return;
    }

    groups[groups.length - 1].remove();
    refreshLiveSummaryDebounced();
}

function handleRealtimeInput(event) {
    const target = event.target;
    if (!target) return;

    const shouldRefresh = target.classList.contains('note-input')
        || ['nota_examen', 'partial_weight', 'exam_weight', 'minimum_grade'].includes(target.id);

    if (!shouldRefresh) return;
    refreshLiveSummaryDebounced();
}

function initCalculator() {
    const form = document.getElementById('calculator-form');
    const addNoteButton = document.getElementById('add-note-btn');
    const deleteNoteButton = document.getElementById('delete-note');
    const clearButton = document.getElementById('clear-calculator-btn');
    const errorAlert = document.getElementById('calculator-error');

    if (errorAlert) {
        errorAlert.setAttribute('tabindex', '-1');
    }

    if (form) {
        form.addEventListener('submit', handleSubmit);
        form.addEventListener('input', handleRealtimeInput);
        form.addEventListener('change', handleRealtimeInput);
    }
    if (addNoteButton) {
        addNoteButton.addEventListener('click', addNote);
    }
    if (deleteNoteButton) {
        deleteNoteButton.addEventListener('click', removeLastNote);
    }
    if (clearButton) {
        clearButton.addEventListener('click', clearCalculator);
    }

    refreshLiveSummary();
}

document.addEventListener('DOMContentLoaded', initCalculator);
