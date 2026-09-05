import * as THREE from 'three';

/**
 * Ultra-realistic equirectangular Earth texture generators (4096 x 2048)
 * Creates Day Map, Night City Lights Map, Specular Ocean Map, and Atmospheric Cloud Map.
 */

// Helper to convert (lon, lat) to canvas pixel coordinates (W=4096, H=2048)
function lonLatToXY(lon, lat, W = 4096, H = 2048) {
  const x = ((lon + 180) / 360) * W;
  const y = ((90 - lat) / 180) * H;
  return [x, y];
}

// Draw polygon from array of [lon, lat] points
function drawLonLatPolygon(ctx, points, color, strokeColor = null, W = 4096, H = 2048) {
  if (!points || points.length === 0) return;
  ctx.beginPath();
  const [startX, startY] = lonLatToXY(points[0][0], points[0][1], W, H);
  ctx.moveTo(startX, startY);

  for (let i = 1; i < points.length; i++) {
    const [px, py] = lonLatToXY(points[i][0], points[i][1], W, H);
    ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
}

// 1. Day Surface Texture Generator
export function getEarthDayTexture() {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Deep Ocean Base Layer
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0.0, '#091522'); // Arctic Ocean
  oceanGrad.addColorStop(0.2, '#0B1C2D');
  oceanGrad.addColorStop(0.5, '#061320'); // Equatorial Deep Water
  oceanGrad.addColorStop(0.8, '#0B1C2D');
  oceanGrad.addColorStop(1.0, '#091522'); // Antarctic Ocean
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  // Shallow Coastal Shelf Layer
  ctx.fillStyle = '#123954';
  ctx.globalAlpha = 0.35;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 1.0;

  // Major Geographic Landmass Polygons
  const landmasses = [
    // North America
    {
      pts: [[-168, 65], [-140, 70], [-100, 75], [-60, 60], [-55, 48], [-66, 44], [-80, 25], [-97, 26], [-105, 20], [-117, 32], [-124, 48], [-140, 60], [-168, 65]],
      fill: '#2B4F26', stroke: '#1D3B1A'
    },
    // Central America
    {
      pts: [[-105, 20], [-88, 15], [-77, 8], [-82, 9], [-90, 14], [-100, 18]],
      fill: '#244820', stroke: '#1B3617'
    },
    // South America
    {
      pts: [[-77, 8], [-60, 10], [-35, -5], [-38, -18], [-55, -34], [-68, -54], [-75, -45], [-70, -30], [-81, -5], [-77, 8]],
      fill: '#1D451B', stroke: '#133012' // Amazon green
    },
    // Europe
    {
      pts: [[-10, 36], [0, 42], [3, 47], [-5, 50], [-4, 58], [10, 60], [25, 71], [30, 60], [40, 50], [28, 41], [22, 38], [14, 38], [9, 44], [-9, 43], [-10, 36]],
      fill: '#345729', stroke: '#213B1A'
    },
    // Africa (North Sahara to South)
    {
      pts: [[-17, 31], [11, 37], [32, 31], [43, 12], [51, 11], [40, -15], [33, -27], [18, -34], [12, -17], [9, 5], [-14, 12], [-17, 31]],
      fill: '#695733', stroke: '#4A3C21' // Arid tan / savanna
    },
    // Sahara Desert overlay
    {
      pts: [[-15, 30], [10, 35], [34, 30], [38, 15], [20, 12], [-10, 15]],
      fill: '#A48951', stroke: null
    },
    // Asia
    {
      pts: [[32, 31], [40, 50], [60, 68], [100, 75], [170, 68], [160, 55], [140, 50], [130, 42], [120, 30], [108, 20], [100, 10], [96, 16], [80, 20], [60, 25], [44, 15], [32, 31]],
      fill: '#314E29', stroke: '#1F341A'
    },
    // Arabia Desert
    {
      pts: [[35, 30], [58, 24], [54, 16], [43, 12], [35, 30]],
      fill: '#9E824A', stroke: null
    },
    // India
    {
      pts: [[68, 24], [78, 30], [88, 22], [80, 12], [77, 8], [73, 15], [68, 24]],
      fill: '#3B5E2C', stroke: '#253D1B'
    },
    // Australia
    {
      pts: [[114, -22], [130, -12], [142, -11], [153, -28], [148, -38], [138, -35], [115, -34], [114, -22]],
      fill: '#8C5A2B', stroke: '#5E3B1B' // Outbacks ochre
    },
    // Indonesia & SE Asia Islands
    {
      pts: [[95, 5], [105, -6], [115, -8], [125, -8], [140, -3], [150, -10], [140, -8], [110, 0], [95, 5]],
      fill: '#1D451B', stroke: null
    },
    // Greenland
    {
      pts: [[-55, 60], [-20, 70], [-25, 82], [-60, 82], [-55, 60]],
      fill: '#E2F1F8', stroke: '#B0D4E3'
    }
  ];

  landmasses.forEach(lm => drawLonLatPolygon(ctx, lm.pts, lm.fill, lm.stroke, W, H));

  // Polar Ice Caps
  // Arctic (North)
  ctx.fillStyle = '#EAF4F9';
  ctx.fillRect(0, 0, W, H * 0.08);

  // Antarctic (South)
  ctx.fillStyle = '#EAF4F9';
  ctx.fillRect(0, H * 0.90, W, H * 0.10);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 2. Night City Lights Texture Generator
export function getEarthNightTexture() {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Pitch black base
  ctx.fillStyle = '#010204';
  ctx.fillRect(0, 0, W, H);

  // Helper to place city light clusters at (lon, lat)
  const addCityCluster = (lon, lat, radiusPx, count = 60, intensity = 1.0) => {
    const [cx, cy] = lonLatToXY(lon, lat, W, H);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.pow(Math.random(), 1.6) * radiusPx;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const size = (Math.random() * 2.5 + 0.8) * intensity;

      const grad = ctx.createRadialGradient(x, y, 0, x, y, size * 2.5);
      grad.addColorStop(0, 'rgba(255, 220, 110, 0.95)');
      grad.addColorStop(0.3, 'rgba(255, 160, 40, 0.65)');
      grad.addColorStop(1, 'rgba(255, 140, 20, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, size * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Major Metropolitan City Clusters across the globe
  // US East Coast & Midwest
  addCityCluster(-74, 40, 90, 140, 1.2); // NYC / BosWash
  addCityCluster(-87, 41, 60, 90, 1.0);  // Chicago
  addCityCluster(-96, 32, 70, 90, 1.0);  // Texas Triangle
  addCityCluster(-118, 34, 75, 110, 1.1); // Los Angeles / SoCal
  addCityCluster(-122, 37, 50, 80, 1.0);  // SF Bay Area

  // Europe & UK
  addCityCluster(-0.1, 51.5, 70, 120, 1.2); // London / UK
  addCityCluster(2.3, 48.8, 65, 110, 1.2);  // Paris
  addCityCluster(7.0, 51.2, 85, 130, 1.2);  // Benelux / Ruhr
  addCityCluster(-3.7, 40.4, 45, 70, 1.0);  // Madrid
  addCityCluster(12.5, 41.9, 50, 80, 1.0);  // Rome / Italy

  // Nile & Middle East
  addCityCluster(31.2, 30.0, 55, 100, 1.2); // Cairo / Nile Delta
  addCityCluster(55.3, 25.2, 50, 90, 1.1);  // Dubai / Persian Gulf

  // India & South Asia
  addCityCluster(77.2, 28.6, 90, 160, 1.3); // Delhi NCR
  addCityCluster(72.8, 19.0, 80, 140, 1.3); // Mumbai
  addCityCluster(88.3, 22.5, 70, 120, 1.1); // Kolkata
  addCityCluster(77.5, 12.9, 75, 130, 1.2); // Bengaluru / South India

  // East Asia
  addCityCluster(116.4, 39.9, 90, 150, 1.3); // Beijing
  addCityCluster(121.4, 31.2, 100, 170, 1.3); // Shanghai / Yangtze Delta
  addCityCluster(113.2, 23.1, 100, 170, 1.3); // Pearl River Delta
  addCityCluster(126.9, 37.5, 70, 120, 1.2); // Seoul
  addCityCluster(139.6, 35.6, 110, 190, 1.4); // Tokyo / Kanto

  // South America
  addCityCluster(-46.6, -23.5, 75, 110, 1.1); // Sao Paulo
  addCityCluster(-58.3, -34.6, 60, 90, 1.0);  // Buenos Aires

  // Australia
  addCityCluster(151.2, -33.8, 55, 80, 1.0); // Sydney
  addCityCluster(144.9, -37.8, 50, 70, 1.0); // Melbourne

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 3. Specular Ocean Mask Texture Generator (White = Water/Glint, Black = Land)
export function getEarthSpecularTexture() {
  const W = 2048;
  const H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Oceans are highly specular (Pure White)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, W, H);

  // Land is non-specular matte (Pure Black)
  const landmasses = [
    [[-168, 65], [-140, 70], [-100, 75], [-60, 60], [-55, 48], [-66, 44], [-80, 25], [-97, 26], [-105, 20], [-117, 32], [-124, 48], [-140, 60], [-168, 65]],
    [[-105, 20], [-88, 15], [-77, 8], [-82, 9], [-90, 14], [-100, 18]],
    [[-77, 8], [-60, 10], [-35, -5], [-38, -18], [-55, -34], [-68, -54], [-75, -45], [-70, -30], [-81, -5], [-77, 8]],
    [[-10, 36], [0, 42], [3, 47], [-5, 50], [-4, 58], [10, 60], [25, 71], [30, 60], [40, 50], [28, 41], [22, 38], [14, 38], [9, 44], [-9, 43], [-10, 36]],
    [[-17, 31], [11, 37], [32, 31], [43, 12], [51, 11], [40, -15], [33, -27], [18, -34], [12, -17], [9, 5], [-14, 12], [-17, 31]],
    [[32, 31], [40, 50], [60, 68], [100, 75], [170, 68], [160, 55], [140, 50], [130, 42], [120, 30], [108, 20], [100, 10], [96, 16], [80, 20], [60, 25], [44, 15], [32, 31]],
    [[68, 24], [78, 30], [88, 22], [80, 12], [77, 8], [73, 15], [68, 24]],
    [[114, -22], [130, -12], [142, -11], [153, -28], [148, -38], [138, -35], [115, -34], [114, -22]],
    [[-55, 60], [-20, 70], [-25, 82], [-60, 82], [-55, 60]]
  ];

  landmasses.forEach(pts => drawLonLatPolygon(ctx, pts, '#000000', null, W, H));

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// 4. Earth Swirl Cloud Texture Generator
export function getEarthCloudTexture() {
  const W = 4096;
  const H = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, W, H);

  // Soft white/gray organic cloud swirls following atmospheric trade wind belts
  ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * W;
    const y = Math.random() * (H - 300) + 150;
    const rx = Math.random() * 220 + 60;
    const ry = Math.random() * 50 + 15;
    const angle = (Math.random() - 0.5) * 0.35;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}
