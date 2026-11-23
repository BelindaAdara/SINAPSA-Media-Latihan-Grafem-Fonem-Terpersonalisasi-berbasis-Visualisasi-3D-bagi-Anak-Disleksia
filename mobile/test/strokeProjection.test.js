const assert = require('node:assert/strict');
const test = require('node:test');
const { projectStrokes } = require('../src/three/strokeProjection');

const strokes = [
  { type: 'line', closed: false, points: [[0.2, 0.2], [0.8, 0.8]] },
  { type: 'dot', closed: false, points: [[0.5, 0.9]] },
];

test('projects stroke paths and dots as extruded geometry', () => {
  const geometry = projectStrokes(strokes, { yaw: 0.5, pitch: 0.1 });
  assert.equal(geometry.frontPaths.length, 1);
  assert.equal(geometry.backPaths.length, 1);
  assert.equal(geometry.faces.length, 1);
  assert.equal(geometry.frontDots.length, 1);
  assert.equal(geometry.backDots.length, 1);
});

test('changes the projected shape when rotated or mirrored', () => {
  const front = projectStrokes(strokes, { yaw: 0, pitch: 0 }).frontPaths[0].points;
  const rotated = projectStrokes(strokes, { yaw: 0.8, pitch: 0.2 }).frontPaths[0].points;
  const mirrored = projectStrokes(strokes, { yaw: 0, pitch: 0 }, true).frontPaths[0].points;

  assert.notEqual(rotated, front);
  assert.notEqual(mirrored, front);
});
