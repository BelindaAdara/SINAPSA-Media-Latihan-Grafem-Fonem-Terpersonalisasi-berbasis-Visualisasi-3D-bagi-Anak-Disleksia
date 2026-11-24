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
    z: finalZ,
  };
}

function formatPoint({ x, y }) {
  return `${x.toFixed(2)},${y.toFixed(2)}`;
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function mixHex(base, amount) {
  const hex = base.replace('#', '');
  const channel = (index) => parseInt(hex.slice(index, index + 2), 16);
  const blend = (value) => Math.max(0, Math.min(255, Math.round(value + (255 - value) * amount)));
  return `#${[0, 2, 4].map((index) => blend(channel(index)).toString(16).padStart(2, '0')).join('')}`;
}

function projectStrokes(strokes, rotation, mirrored = false, colors = {}) {
  const faces = [];
  const backPaths = [];
  const frontPaths = [];
  const backDots = [];
  const frontDots = [];
  const frontColor = colors.body || '#FF7A59';
  const backColor = colors.shadow || '#D8D2FF';
  const sideColor = mixHex(frontColor, 0.28);

  strokes.forEach((stroke, strokeIndex) => {
    if (!Array.isArray(stroke.points) || stroke.points.length === 0) return;

    if (stroke.type === 'dot') {
      const rear = projectPoint(stroke.points[0], -DEPTH, rotation, mirrored);
      const fore = projectPoint(stroke.points[0], DEPTH, rotation, mirrored);
      backDots.push({ key: `back-dot-${strokeIndex}`, depth: rear.z, ...rear });
      frontDots.push({ key: `front-dot-${strokeIndex}`, depth: fore.z, ...fore });
      return;
    }

    const front = stroke.points.map((point) => projectPoint(point, DEPTH, rotation, mirrored));
    const back = stroke.points.map((point) => projectPoint(point, -DEPTH, rotation, mirrored));
    backPaths.push({ key: `back-${strokeIndex}`, points: back.map(formatPoint).join(' '), depth: average(back.map((point) => point.z)) });
    frontPaths.push({ key: `front-${strokeIndex}`, points: front.map(formatPoint).join(' '), depth: average(front.map((point) => point.z)) });

    const first = stroke.points[0];
    const last = stroke.points[stroke.points.length - 1];
    const needsClosingSegment = stroke.closed && (first[0] !== last[0] || first[1] !== last[1]);
    const segmentCount = stroke.points.length - 1 + (needsClosingSegment ? 1 : 0);

    for (let index = 0; index < segmentCount; index += 1) {
      const next = (index + 1) % stroke.points.length;
      const points = [front[index], front[next], back[next], back[index]];
      faces.push({
        key: `face-${strokeIndex}-${index}`,
        points: points.map(formatPoint).join(' '),
        depth: average(points.map((point) => point.z)),
        fill: sideColor,
      });
    }
  });

  faces.sort((left, right) => left.depth - right.depth);
  backPaths.sort((left, right) => left.depth - right.depth);
  frontPaths.sort((left, right) => left.depth - right.depth);
  backDots.sort((left, right) => left.depth - right.depth);
  frontDots.sort((left, right) => left.depth - right.depth);

  return { faces, backPaths, frontPaths, backDots, frontDots, backColor, frontColor };
}

module.exports = { projectStrokes };
