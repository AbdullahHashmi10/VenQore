import { describe, it, expect } from 'vitest';
import {
    evaluateExpression,
    formatResult,
    appendCharacter,
    toggleSign,
    backspace,
    preprocessPercentage,
    MAX_EXPRESSION_LENGTH,
} from '../Components/Calculator/calculatorEngine';

describe('Calculator Engine Unit Tests (Hardened)', () => {

    it('evaluates standard operator precedence correctly (* and / before + and -)', () => {
        expect(evaluateExpression('2 + 3 * 4')).toEqual({ status: 'ok', value: '14', numberValue: 14 });
        expect(evaluateExpression('10 - 6 / 2')).toEqual({ status: 'ok', value: '7', numberValue: 7 });
        expect(evaluateExpression('2 + 3 * 4 - 5 / 5')).toEqual({ status: 'ok', value: '13', numberValue: 13 });
    });

    it('respects parentheses in expressions', () => {
        expect(evaluateExpression('(2 + 3) * 4')).toEqual({ status: 'ok', value: '20', numberValue: 20 });
        expect(evaluateExpression('10 / (2 + 3)')).toEqual({ status: 'ok', value: '2', numberValue: 2 });
        expect(evaluateExpression('((2 + 3) * (4 - 1)) / 5')).toEqual({ status: 'ok', value: '3', numberValue: 3 });
    });

    it('handles decimal values and blocks duplicate decimal points in a single number', () => {
        expect(evaluateExpression('0.1 + 0.2')).toEqual({ status: 'ok', value: '0.3', numberValue: 0.3 });
        expect(evaluateExpression('2.5 * 4')).toEqual({ status: 'ok', value: '10', numberValue: 10 });

        let expr = '3.14';
        expr = appendCharacter(expr, '.');
        expect(expr).toBe('3.14'); // Duplicate decimal rejected
    });

    it('handles negative results and nested unary negatives', () => {
        expect(evaluateExpression('-5 + 3')).toEqual({ status: 'ok', value: '-2', numberValue: -2 });
        expect(evaluateExpression('-5 - 10')).toEqual({ status: 'ok', value: '-15', numberValue: -15 });
        expect(evaluateExpression('5 * -3')).toEqual({ status: 'ok', value: '-15', numberValue: -15 });
        expect(evaluateExpression('-(-5)')).toEqual({ status: 'ok', value: '5', numberValue: 5 });
        expect(evaluateExpression('-(-(-5))')).toEqual({ status: 'ok', value: '-5', numberValue: -5 });
        expect(toggleSign('5')).toBe('-5');
        expect(toggleSign('-5')).toBe('5');
    });

    it('handles percentage behavior accurately (additive, subtractive, multiplicative, standalone, negative, decimal, parenthesized)', () => {
        expect(evaluateExpression('100 + 10%')).toEqual({ status: 'ok', value: '110', numberValue: 110 });
        expect(evaluateExpression('100 - 10%')).toEqual({ status: 'ok', value: '90', numberValue: 90 });
        expect(evaluateExpression('200 * 15%')).toEqual({ status: 'ok', value: '30', numberValue: 30 });
        expect(evaluateExpression('50 / 10%')).toEqual({ status: 'ok', value: '500', numberValue: 500 });
        expect(evaluateExpression('50%')).toEqual({ status: 'ok', value: '0.5', numberValue: 0.5 });
        expect(evaluateExpression('-100 + 10%')).toEqual({ status: 'ok', value: '-110', numberValue: -110 });
        expect(evaluateExpression('100 + 5.5%')).toEqual({ status: 'ok', value: '105.5', numberValue: 105.5 });
        expect(evaluateExpression('(100 + 10%)')).toEqual({ status: 'ok', value: '110', numberValue: 110 });
        expect(evaluateExpression('100%%')).toEqual({ status: 'error', error: 'Malformed expression' });
    });

    it('handles repeated calculations using previous result', () => {
        const res1 = evaluateExpression('10 + 5');
        expect(res1).toEqual({ status: 'ok', value: '15', numberValue: 15 });

        const res2 = evaluateExpression(`${res1.value} * 2`);
        expect(res2).toEqual({ status: 'ok', value: '30', numberValue: 30 });
    });

    it('returns friendly Cannot divide by zero error', () => {
        expect(evaluateExpression('10 / 0')).toEqual({ status: 'error', error: 'Cannot divide by zero' });
        expect(evaluateExpression('5 / (2 - 2)')).toEqual({ status: 'error', error: 'Cannot divide by zero' });
    });

    it('strictly rejects malformed numeric inputs with Malformed expression', () => {
        expect(evaluateExpression('1.2.3')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('.')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('2..5')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('3 4')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('()')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('2(3)')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('(2)3')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('(2+3')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('2+3)')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('2+')).toEqual({ status: 'error', error: 'Malformed expression' });
        expect(evaluateExpression('5*')).toEqual({ status: 'error', error: 'Malformed expression' });
    });

    it('handles large-but-supported values cleanly', () => {
        const res = evaluateExpression('1000000 * 1000000');
        expect(res.status).toBe('ok');
        expect(res.value).toBe('1000000000000');
    });

    it('rounds floating-point tails cleanly without displaying exponential garbage or tails', () => {
        expect(formatResult(0.1 + 0.2)).toBe('0.3');
        expect(formatResult(1 / 3)).toBe('0.3333333333');
        expect(formatResult(0.30000000000000004)).toBe('0.3');
    });

    it('supports backspace and clear operations', () => {
        expect(backspace('1234')).toBe('123');
        expect(backspace('1')).toBe('');
        expect(backspace('')).toBe('');
    });

    it('enforces expression length limits at exact limit', () => {
        const exactLimitExpr = '1'.repeat(MAX_EXPRESSION_LENGTH);
        expect(exactLimitExpr.length).toBe(30);
        expect(appendCharacter(exactLimitExpr, '9')).toBe(exactLimitExpr); // Blocked when length >= 30
        const evalRes = evaluateExpression('1'.repeat(30));
        expect(evalRes.status).toBe('ok');
    });
});
