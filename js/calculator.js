/**
 * Calculadora Científica - Lógica Principal
 * Maneja evaluación de expresiones, teclado y UI
 */

// Estado de la calculadora
const state = {
    expression: '',
    lastAnswer: 0,
    history: []
};

// Referencias DOM
const elements = {
    expression: document.getElementById('expression'),
    result: document.getElementById('result'),
    pad: document.getElementById('pad')
};

/**
 * Actualiza la pantalla con expresión y resultado previo
 */
function updateDisplay() {
    elements.expression.textContent = state.expression || '0';
    elements.result.textContent = state.expression ? tryEvalPreview(state.expression) : '0';
}

/**
 * Intenta evaluar para mostrar preview en tiempo real
 */
function tryEvalPreview(expr) {
    try {
        const val = evaluateExpression(expr);
        if (val === undefined || val === null) return '';
        if (!isFinite(val)) return 'Error';
        if (Math.abs(val) > 1e12) return val.toExponential(6);
        return Number.isInteger(val) ? String(val) : String(Number(val.toFixed(10))).replace(/\.0+$/, '');
    } catch (e) {
        return '';
    }
}

/**
 * Limpia y prepara la expresión para evaluación
 */
function safeReplace(str) {
    return str
        .replace(/÷/g, '/')
        .replace(/×/g, '*')
        .replace(/−/g, '-')
        .replace(/π/g, 'pi');
}

/**
 * Evalúa expresiones matemáticas de forma segura
 */
function evaluateExpression(expr) {
    if (!expr) return 0;
    
    let processed = safeReplace(expr);

    // Constantes
    processed = processed.replace(/pi/g, `(${Math.PI})`);
    processed = processed.replace(/\be\b/g, `(${Math.E})`);
    
    // Potencias
    processed = processed.replace(/\^/g, '**');
    processed = processed.replace(/\*\*2/g, '**2');

    // Funciones Math
    processed = processed.replace(/\b(sin|cos|tan|asin|acos|atan|sqrt|exp|abs|floor|ceil|round)\(/g, 'Math.$1(');
    processed = processed.replace(/\bln\(/g, 'Math.log(');
    processed = processed.replace(/\blog10\(/g, 'Math.log10(');

    // Factorial
    const factorial = (n) => {
        n = Math.floor(Number(n));
        if (n < 0) throw new Error('Factorial negativo');
        if (n > 170) throw new Error('Factorial muy grande');
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    };

    // Evaluación segura con Function
    try {
        const fn = new Function('Math', 'fact', 'ans', 'return (' + processed + ')');
        return fn(Math, factorial, state.lastAnswer);
    } catch (e) {
        throw new Error('Sintaxis inválida');
    }
}

/**
 * Manejador de clicks en botones
 */
function handleButtonClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    const value = btn.getAttribute('data-value');
    const action = btn.getAttribute('data-action');

    switch (action) {
        case 'clear':
            state.expression = '';
            state.lastAnswer = 0;
            break;
            
        case 'back':
            state.expression = state.expression.slice(0, -1);
            break;
            
        case 'eval':
            try {
                const result = evaluateExpression(state.expression);
                state.lastAnswer = result;
                state.history.push({ expr: state.expression, res: result });
                state.expression = String(result);
            } catch (err) {
                elements.result.textContent = 'Error';
                shakeDisplay();
                return;
            }
            break;
            
        case 'ans':
            state.expression += String(state.lastAnswer);
            break;
            
        default:
            if (value) {
                if (value === 'pi' || value === 'e') {
                    state.expression += value;
                } else if (value === '^2') {
                    state.expression += '**2';
                } else {
                    state.expression += value;
                }
            }
    }
    
    updateDisplay();
}

/**
 * Efecto visual de error
 */
function shakeDisplay() {
    elements.expression.parentElement.style.animation = 'shake 0.3s';
    setTimeout(() => {
        elements.expression.parentElement.style.animation = '';
    }, 300);
}

/**
 * Manejador de teclado
 */
function handleKeyboard(e) {
    const key = e.key;
    
    // Números y operadores básicos
    if (/[0-9\.\+\-\*\/\(\)\^]/.test(key)) {
        e.preventDefault();
        if (key === '^') state.expression += '^';
        else state.expression += key;
        updateDisplay();
    }
    
    // Enter para evaluar
    if (key === 'Enter') {
        e.preventDefault();
        try {
            const result = evaluateExpression(state.expression);
            state.lastAnswer = result;
            state.expression = String(result);
            updateDisplay();
        } catch (err) {
            elements.result.textContent = 'Error';
            shakeDisplay();
        }
    }
    
    // Backspace
    if (key === 'Backspace') {
        e.preventDefault();
        state.expression = state.expression.slice(0, -1);
        updateDisplay();
    }
    
    // Escape para limpiar
    if (key === 'Escape') {
        e.preventDefault();
        state.expression = '';
        updateDisplay();
    }
    
    // Atajos de funciones
    const shortcuts = {
        's': 'sin(', 'c': 'cos(', 't': 'tan(',
        'l': 'ln(', 'L': 'log10(', 'S': 'sqrt(',
        'p': 'pi', 'E': 'exp('
    };
    
    if (shortcuts[key]) {
        e.preventDefault();
        state.expression += shortcuts[key];
        updateDisplay();
    }
}

// Event Listeners
elements.pad.addEventListener('click', handleButtonClick);
window.addEventListener('keydown', handleKeyboard);

// Animación CSS para error
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-5px); }
        75% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);

// Inicialización
updateDisplay();
console.log('🧮 Calculadora Científica cargada - v1.1');
