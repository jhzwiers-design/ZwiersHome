// Run with: node --test src/lib/dial.test.ts  (Node 22+ strips the types)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { angleFromPoint, fracFromAngle, fracFromValue, pointOnArc, valueFromFrac } from './dial.ts';

test('arc start, middle and end map to 0, 0.5 and 1', () => {
  assert.equal(fracFromAngle(135), 0);
  assert.equal(fracFromAngle(270), 0.5); // straight up
  assert.equal(fracFromAngle(45), 1);
});

test('the bottom gap snaps to the nearer end', () => {
  assert.equal(fracFromAngle(80), 1); // just past the end, right side
  assert.equal(fracFromAngle(100), 0); // just before the start, left side
});

test('dragging past the end never wraps to the start', () => {
  assert.equal(fracFromAngle(120, 0.98), 1); // pointer swung into the left part of the gap
  assert.equal(fracFromAngle(140, 0.99), 1); // pointer swung round to the very start
  assert.equal(fracFromAngle(60, 0.02), 0); // and the reverse at the minimum end
});

test('values snap to 1° steps and respect limits', () => {
  assert.equal(valueFromFrac(0, 55, 85, 1), 55);
  assert.equal(valueFromFrac(1, 55, 85, 1), 85);
  assert.equal(valueFromFrac(0.51, 55, 85, 1), 70);
  assert.equal(valueFromFrac(1.4, 55, 85, 1), 85);
});

test('value and arc position round-trip', () => {
  for (const v of [55, 62, 70, 77, 85]) {
    assert.equal(valueFromFrac(fracFromValue(v, 55, 85), 55, 85, 1), v);
  }
});

test('pointer position round-trips through the geometry', () => {
  for (const f of [0, 0.25, 0.5, 0.75, 1]) {
    const p = pointOnArc(f, 84);
    const back = fracFromAngle(angleFromPoint(100, 100, p.x, p.y));
    assert.ok(Math.abs(back - f) < 1e-9, `f=${f} back=${back}`);
  }
});
