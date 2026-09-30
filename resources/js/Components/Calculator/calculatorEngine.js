/**
 * Safe calculator expression engine for VenQore Header Calculator.
 * Does NOT use eval(), Function(), or dynamic HTML execution.
 */

export const MAX_EXPRESSION_LENGTH = 30;
export const DISPLAY_PRECISION = 10;

/**
 * Format a numeric result value cleanly without floating-point artifacts.
 * (e.g. 0.30000000000000004 -> "0.3")
 */
export function formatResult(value) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return 'Cannot divide by zero';
    }

    // Round to DISPLAY_PRECISION decimal places
    const factor = Math.pow(10, DISPLAY_PRECISION);
    const rounded = Math.round((value + Number.EPSILON) * factor) / factor;

    const str = rounded.toString();
    if (str.includes('e') || str.includes('E')) {
        return Number(rounded.toFixed(DISPLAY_PRECISION)).toString();
    }
    return str;
}

/**
 * Preprocess percentage expressions:
 *  - "100 + 10%" => "100 + (100 * 10 / 100)"
 *  - "100 - 20%" => "100 - (100 * 20 / 100)"
 *  - "200 * 15%" => "200 * (15 / 100)"
 *  - "50 / 10%"  => "50 / (10 / 100)"
 *  - "50%"       => "(50 / 100)"
 */
export function preprocessPercentage(expr) {
    if (!expr || !expr.includes('%')) return expr;

    // Reject malformed repeated percentage like "%%" or "100%%"
    if (/%{2,}/.test(expr)) {
        throw new Error('Malformed expression');
    }

    let processed = expr;

    // Pattern for A + B% or A - B% (with optional negative numbers or decimals)
    processed = processed.replace(/(\-?[0-9\.]+)\s*([\+\-])\s*([0-9\.]+)%/g, (match, a, op, b) => {
        return `${a} ${op} (${a} * ${b} / 100)`;
    });

    // Pattern for A * B% or A / B%
    processed = processed.replace(/(\-?[0-9\.]+)\s*([\*\/])\s*([0-9\.]+)%/g, (match, a, op, b) => {
        return `${a} ${op} (${b} / 100)`;
    });

    // Standalone X%
    processed = processed.replace(/([0-9\.]+)%/g, '($1 / 100)');

    return processed;
}

/**
 * Safe tokenizer with strict malformed input checks.
 */
export function tokenize(expr) {
    const tokens = [];
    let i = 0;
    const len = expr.length;

    while (i < len) {
        const char = expr[i];

        if (/\s/.test(char)) {
            i++;
            continue;
        }

        if (/[0-9\.]/.test(char)) {
            let numStr = '';
            let decimalCount = 0;
            const startIdx = i;

            while (i < len && /[0-9\.]/.test(expr[i])) {
                if (expr[i] === '.') {
                    decimalCount++;
                }
                numStr += expr[i];
                i++;
            }

            // Reject numbers with multiple decimals (e.g. 1.2.3 or 2..5) or standalone '.'
            if (decimalCount > 1 || numStr === '.' || numStr.includes('..')) {
                throw new Error('Malformed expression');
            }

            // Check token adjacency: NUMBER followed by NUMBER without operator (e.g. "3 4")
            const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;
            if (prevToken && prevToken.type === 'NUMBER') {
                throw new Error('Malformed expression'); // Implicit numbers e.g. "3 4"
            }
            if (prevToken && prevToken.type === 'OPERATOR' && prevToken.value === ')') {
                throw new Error('Malformed expression'); // Implicit multiplication e.g. "(2)3"
            }

            tokens.push({ type: 'NUMBER', value: numStr });
            continue;
        }

        if (['+', '-', '*', '/', '%', '(', ')'].includes(char)) {
            const prevToken = tokens.length > 0 ? tokens[tokens.length - 1] : null;

            // Check adjacency for '(': NUMBER followed by '(' without operator (e.g. "2(3)")
            if (char === '(' && prevToken && (prevToken.type === 'NUMBER' || (prevToken.type === 'OPERATOR' && prevToken.value === ')'))) {
                throw new Error('Malformed expression');
            }

            // Check empty parentheses "()"
            if (char === ')' && prevToken && prevToken.type === 'OPERATOR' && prevToken.value === '(') {
                throw new Error('Malformed expression');
            }

            tokens.push({ type: 'OPERATOR', value: char });
            i++;
            continue;
        }

        throw new Error('Malformed expression');
    }

    // Trailing operator check: last token cannot be binary operator or '('
    if (tokens.length > 0) {
        const lastToken = tokens[tokens.length - 1];
        if (lastToken.type === 'OPERATOR' && ['+', '-', '*', '/', '%', '('].includes(lastToken.value)) {
            throw new Error('Malformed expression');
        }
    }

    return tokens;
}

/**
 * Evaluates tokens using Shunting-Yard and RPN evaluation.
 */
export function evaluateTokens(tokens) {
    const processed = [];
    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        const prev = i > 0 ? processed[processed.length - 1] : null;

        if (token.type === 'OPERATOR' && token.value === '-') {
            const isUnary = !prev || (prev.type === 'OPERATOR' && prev.value !== ')') || (prev.type === 'OPERATOR' && prev.value === '(');
            if (isUnary) {
                processed.push({ type: 'UNARY_MINUS', value: 'u-' });
                continue;
            }
        }
        processed.push(token);
    }

    // Check if last token after unary resolution is unary minus
    if (processed.length > 0 && processed[processed.length - 1].type === 'UNARY_MINUS') {
        throw new Error('Malformed expression');
    }

    const outputQueue = [];
    const operatorStack = [];

    const precedence = {
        'u-': 4,
        '%': 3,
        '*': 3,
        '/': 3,
        '+': 2,
        '-': 2,
    };

    const associativity = {
        'u-': 'Right',
        '%': 'Left',
        '*': 'Left',
        '/': 'Left',
        '+': 'Left',
        '-': 'Left',
    };

    for (let i = 0; i < processed.length; i++) {
        const token = processed[i];

        if (token.type === 'NUMBER') {
            outputQueue.push(parseFloat(token.value));
        } else if (token.type === 'UNARY_MINUS') {
            operatorStack.push('u-');
        } else if (token.type === 'OPERATOR') {
            const op = token.value;

            if (op === '(') {
                operatorStack.push('(');
            } else if (op === ')') {
                while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
                    outputQueue.push(operatorStack.pop());
                }
                if (operatorStack.length === 0) {
                    throw new Error('Malformed expression'); // Mismatched parentheses
                }
                operatorStack.pop();
            } else {
                while (
                    operatorStack.length > 0 &&
                    operatorStack[operatorStack.length - 1] !== '(' &&
                    (
                        (associativity[op] === 'Left' && precedence[op] <= precedence[operatorStack[operatorStack.length - 1]]) ||
                        (associativity[op] === 'Right' && precedence[op] < precedence[operatorStack[operatorStack.length - 1]])
                    )
                ) {
                    outputQueue.push(operatorStack.pop());
                }
                operatorStack.push(op);
            }
        }
    }

    while (operatorStack.length > 0) {
        const op = operatorStack.pop();
        if (op === '(' || op === ')') {
            throw new Error('Malformed expression'); // Mismatched parentheses
        }
        outputQueue.push(op);
    }

    const evalStack = [];
    for (const token of outputQueue) {
        if (typeof token === 'number') {
            evalStack.push(token);
        } else if (token === 'u-') {
            if (evalStack.length < 1) throw new Error('Malformed expression');
            const val = evalStack.pop();
            evalStack.push(-val);
        } else if (['+', '-', '*', '/', '%'].includes(token)) {
            if (evalStack.length < 2) throw new Error('Malformed expression');
            const b = evalStack.pop();
            const a = evalStack.pop();

            let res;
            if (token === '+') res = a + b;
            else if (token === '-') res = a - b;
            else if (token === '*') res = a * b;
            else if (token === '/') {
                if (b === 0) throw new Error('Cannot divide by zero');
                res = a / b;
            } else if (token === '%') {
                res = (a * b) / 100;
            }
            evalStack.push(res);
        }
    }

    if (evalStack.length !== 1) {
        throw new Error('Malformed expression');
    }

    const finalValue = evalStack[0];
    if (isNaN(finalValue) || !isFinite(finalValue)) {
        throw new Error('Cannot divide by zero');
    }

    return finalValue;
}

/**
 * Main evaluation function.
 * Returns { status: 'ok', value: string, numberValue: number } or { status: 'error', error: string }
 */
export function evaluateExpression(rawExpr) {
    if (!rawExpr || rawExpr.trim() === '') {
        return { status: 'ok', value: '0', numberValue: 0 };
    }

    try {
        const preprocessed = preprocessPercentage(rawExpr.trim());
        const tokens = tokenize(preprocessed);
        if (tokens.length === 0) {
            return { status: 'ok', value: '0', numberValue: 0 };
        }
        const rawNumVal = evaluateTokens(tokens);
        const formatted = formatResult(rawNumVal);
        if (formatted === 'Cannot divide by zero') {
            return { status: 'error', error: 'Cannot divide by zero' };
        }
        const numVal = parseFloat(formatted);
        return { status: 'ok', value: formatted, numberValue: isNaN(numVal) ? rawNumVal : numVal };
    } catch (err) {
        if (err.message === 'Cannot divide by zero') {
            return { status: 'error', error: 'Cannot divide by zero' };
        }
        return { status: 'error', error: 'Malformed expression' };
    }
}

/**
 * Helper to append input character to current expression while obeying rules:
 * - Length limit (MAX_EXPRESSION_LENGTH)
 * - Decimal point rules (no multiple decimals in same current number)
 */
export function appendCharacter(expr, char) {
    if (expr.length >= MAX_EXPRESSION_LENGTH) {
        return expr;
    }

    // Decimal point check
    if (char === '.') {
        const parts = expr.split(/[\+\-\*\/\%\(\)]/);
        const currentPart = parts[parts.length - 1];
        if (currentPart.includes('.')) {
            return expr; // Prevent duplicate decimal in current number
        }
        if (currentPart === '' || expr === '') {
            return expr + '0.';
        }
    }

    // Avoid duplicate operators (except minus as unary)
    if (['+', '*', '/', '%'].includes(char)) {
        if (expr === '') return expr;
        const lastChar = expr[expr.length - 1];
        if (['+', '-', '*', '/', '%'].includes(lastChar)) {
            return expr.slice(0, -1) + char;
        }
    }

    return expr + char;
}

/**
 * Toggle positive/negative sign of current expression or number.
 */
export function toggleSign(expr) {
    if (!expr || expr === '0') return '-';
    if (expr === '-') return '';

    if (expr.startsWith('-') && !expr.slice(1).match(/[\+\*\/]/)) {
        return expr.slice(1);
    }

    if (expr.match(/[\+\-\*\/\%]/)) {
        return `-(${expr})`;
    }

    return `-${expr}`;
}

/**
 * Backspace: remove last character.
 */
export function backspace(expr) {
    if (!expr || expr.length === 0) return '';
    return expr.slice(0, -1);
}
