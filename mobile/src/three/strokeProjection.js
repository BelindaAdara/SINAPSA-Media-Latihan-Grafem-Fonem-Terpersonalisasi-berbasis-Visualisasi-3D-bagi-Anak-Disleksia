const VIEW_CENTER = 80;
const VIEW_SCALE = 96;
const FOCAL_LENGTH = 3.2;
const DEPTH = 0.2;

function projectPoint([pointX, pointY], depth, rotation, mirrored) {
  const mirror = mirrored ? -1 : 1;
  const x = (pointX - 0.5) * 1.25 * mirror;
  const y = (0.5 - pointY) * 1.25;
  const cosYaw = Math.cos(rotation.yaw);
  const sinYaw = Math.sin(rotation.yaw);
  const cosPitch = Math.cos(rotation.pitch);
  const sinPitch = Math.sin(rotation.pitch);
  const rotatedX = x * cosYaw - depth * sinYaw;
  const rotatedZ = x * sinYaw + depth * cosYaw;
  const rotatedY = y * cosPitch - rotatedZ * sinPitch;
  const finalZ = y * sinPitch + rotatedZ * cosPitch;
  const perspective = FOCAL_LENGTH / (FOCAL_LENGTH - finalZ);

  return {
    x: VIEW_CENTER + rotatedX * VIEW_SCALE * perspective,
    y: VIEW_CENTER - rotatedY * VIEW_SCALE * perspective,
  };
}

function formatPoint({ x, y }) {
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function projectStrokes(strokes, rotation, mirrored = false) {
  const faces = [];
  const backPaths = [];
  const frontPaths = [];
  const backDots = [];
  const frontDots = [];

  strokes.forEach((stroke, strokeIndex) => {
    if (!Array.isArray(stroke.points) || stroke.points.length === 0) return;

    if (stroke.type === 'dot') {
      backDots.push({ key: `back-dot-${strokeIndex}`, ...projectPoint(stroke.points[0], -DEPTH, rotation, mirrored) });
      frontDots.push({ key: `front-dot-${strokeIndex}`, ...projectPoint(stroke.points[0], DEPTH, rotation, mirrored) });
      return;
    }

    const front = stroke.points.map((point) => projectPoint(point, DEPTH, rotation, mirrored));
    const back = stroke.points.map((point) => projectPoint(point, -DEPTH, rotation, mirrored));
    frontPaths.push({ key: `front-${strokeIndex}`, points: front.map(formatPoint).join(' ') });
    backPaths.push({ key: `back-${strokeIndex}`, points: back.map(formatPoint).join(' ') });

    const first = stroke.points[0];
    const last = stroke.points[stroke.points.length - 1];
    const needsClosingSegment = stroke.closed && (first[0] !== last[0] || first[1] !== last[1]);
    const segmentCount = stroke.points.length - 1 + (needsClosingSegment ? 1 : 0);

    for (let index = 0; index < segmentCount; index += 1) {
      const next = (index + 1) % stroke.points.length;
      faces.push({
        key: `face-${strokeIndex}-${index}`,
        points: [
          front[index],
          front[next],
          back[next],
          back[index],
        ].map(formatPoint).join(' '),
      });
    }
  });

  return { faces, backPaths, frontPaths, backDots, frontDots };
}

module.exports = { projectStrokes };
