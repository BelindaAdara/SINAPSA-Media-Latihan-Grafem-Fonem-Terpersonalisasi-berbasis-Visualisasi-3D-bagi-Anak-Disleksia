import { CatmullRomCurve3, SphereGeometry, TubeGeometry, Vector3 } from 'three';

export function createStrokeGeometries(strokes) {
  const allPoints = strokes.flatMap((stroke) => stroke.points);
  if (!allPoints.length) throw new Error('Data goresan huruf kosong.');

  const bounds = allPoints.reduce((box, [x, y]) => ({
    minX: Math.min(box.minX, x),
    maxX: Math.max(box.maxX, x),
    minY: Math.min(box.minY, y),
    maxY: Math.max(box.maxY, y),
  }), { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity });
  const width = Math.max(bounds.maxX - bounds.minX, 0.1);
  const height = Math.max(bounds.maxY - bounds.minY, 0.1);
  const scale = 1.5 / Math.max(width, height);
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const toVector = ([x, y]) => new Vector3((x - centerX) * scale, (y - centerY) * scale, 0);

  const entries = strokes.map((stroke) => {
    const points = stroke.points.map(toVector);
    if (stroke.type === 'dot') {
      return { type: 'dot', position: points[0] };
    }
    if (points.length < 2) throw new Error(`Goresan ${stroke.order} tidak memiliki cukup titik.`);
    const curve = new CatmullRomCurve3(points, Boolean(stroke.closed), 'centripetal');
    return {
      type: 'line',
      geometry: new TubeGeometry(curve, 32, 0.06, 8, Boolean(stroke.closed)),
      start: points[0],
      end: points[points.length - 1],
    };
  });
  return { entries, capGeometry: new SphereGeometry(0.06, 12, 12) };
}
