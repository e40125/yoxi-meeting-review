/* Local Taipei basemap. © OpenStreetMap contributors.
   Six tiles are bundled; route and vehicle are illustrative demo content. */
(function () {
  'use strict';
  const assetRoot = document.currentScript && document.currentScript.src
    ? new URL('./assets/map/', document.currentScript.src).href
    : './assets/map/';
  const z = 13;
  const worldSize = 256 * Math.pow(2, z);
  const center = [25.0448, 121.53885];
  let instance = 0;

  function mercator(lat, lon) {
    return [
      (lon + 180) / 360 * worldSize,
      (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * worldSize
    ];
  }

  window.renderTripMap = function renderTripMap({ compact = false, enroute = false } = {}) {
    const w = 390, h = compact ? 200 : 290;
    const id = 'yoxi-map-' + (++instance);
    const c = mercator(center[0], center[1]);
    const point = (lat, lon) => {
      const p = mercator(lat, lon);
      return [p[0] - c[0] + w / 2, p[1] - c[1] + h / 2];
    };
    const routeCoordinates = [
      [25.0478, 121.5170], [25.0461, 121.5172],
      [25.0459, 121.5200], [25.04555, 121.5237],
      [25.04475, 121.5275], [25.0430, 121.5300],
      [25.0422, 121.5324], [25.0417, 121.5350],
      [25.04165, 121.5490], [25.04145, 121.5539],
      [25.04165, 121.5572], [25.04175, 121.5607],
      [25.0437, 121.5607]
    ];
    const route = routeCoordinates.map(([lat, lon], i) => {
      const p = point(lat, lon);
      return (i ? 'L' : 'M') + p.map(v => v.toFixed(2)).join(',');
    }).join(' ');
    const start = point(25.0478, 121.5170);
    const destination = point(25.0437, 121.5607);
    const pickup = point(25.0422, 121.5324);
    const car = point(25.04415, 121.5284);
    let tiles = '';
    for (let x = 6860; x <= 6862; x++) {
      for (let y = 3506; y <= 3507; y++) {
        tiles += `<image href="${assetRoot}${z}-${x}-${y}.png" x="${(x * 256 - c[0] + w / 2).toFixed(3)}" y="${(y * 256 - c[1] + h / 2).toFixed(3)}" width="256.2" height="256.2"/>`;
      }
    }
    const label = (p, text, width, dy, emphasized = false) => {
      const x = Math.max(10, Math.min(w - width - 10, p[0] - width / 2));
      const y = p[1] + dy;
      return `<g filter="url(#${id}-shadow)"><rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${width}" height="28" rx="9" fill="${emphasized ? '#262c2a' : '#fff'}"/>` +
        `<text x="${(x + width / 2).toFixed(2)}" y="${(y + 18.3).toFixed(2)}" text-anchor="middle" font-size="11.5" font-weight="650" fill="${emphasized ? '#fff' : '#343a37'}">${text}</text></g>`;
    };
    const marker = (p, color, r = 5.5) => `<circle cx="${p[0]}" cy="${p[1]}" r="${r + 3}" fill="#fff"/><circle cx="${p[0]}" cy="${p[1]}" r="${r}" fill="${color}"/><circle cx="${p[0]}" cy="${p[1]}" r="2" fill="#fff"/>`;

    return `<div class="trip-map" data-map-state="${enroute ? 'enroute' : 'planned'}" style="position:relative;overflow:hidden;background:#edf0ed;isolation:isolate">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" role="img" aria-label="台北車站至松山文創園區的路線示意${enroute ? '，途經忠孝新生接人；車輛位置為示意' : ''}" style="display:block;width:100%;height:auto;font-family:Inter,'Noto Sans TC',-apple-system,BlinkMacSystemFont,sans-serif">
        <defs>
          <filter id="${id}-paper" color-interpolation-filters="sRGB"><feColorMatrix type="saturate" values=".12"/><feComponentTransfer><feFuncR type="linear" slope=".72" intercept=".26"/><feFuncG type="linear" slope=".74" intercept=".255"/><feFuncB type="linear" slope=".73" intercept=".25"/></feComponentTransfer></filter>
          <filter id="${id}-shadow" x="-30%" y="-50%" width="160%" height="210%"><feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#283b31" flood-opacity=".13"/></filter>
          <linearGradient id="${id}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8faf7" stop-opacity=".25"/><stop offset="1" stop-color="#f8faf7" stop-opacity="0"/></linearGradient>
          <clipPath id="${id}-clip"><rect width="${w}" height="${h}"/></clipPath>
        </defs>
        <g clip-path="url(#${id}-clip)">
          <g filter="url(#${id}-paper)">${tiles}</g>
          <rect width="${w}" height="${h}" fill="url(#${id}-fade)"/>
          <path d="${route}" fill="none" stroke="#fff" stroke-width="9.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="${route}" fill="none" stroke="#d94446" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/>
          ${marker(start, '#454b48')}
          ${marker(destination, '#d94446', 6)}
          ${label(start, '台北車站', 78, -45)}
          ${label(destination, '松山文創園區', 106, -48)}
          ${enroute ? `${marker(pickup, '#d94446', 6)}${label(pickup, '忠孝新生接你', 106, 14, true)}
          <g transform="translate(${car[0]},${car[1]}) rotate(24)" filter="url(#${id}-shadow)">
            <rect x="-17" y="-10" width="34" height="20" rx="8" fill="#fff"/>
            <rect x="-10" y="-7" width="20" height="14" rx="4" fill="#d94446"/>
            <rect x="-4" y="-5" width="7" height="10" rx="2" fill="#fff"/>
            <path d="M7 -4v8M-7 -4v8" stroke="#66272d" stroke-width="1.2"/>
          </g>` : ''}
          <g transform="translate(12,12)"><rect width="${enroute ? 110 : 62}" height="23" rx="11.5" fill="#fff" fill-opacity=".95"/><text x="${enroute ? 55 : 31}" y="15.3" text-anchor="middle" fill="#626b65" font-size="10" font-weight="550">${enroute ? '路線・車輛位置示意' : '路線示意'}</text></g>
          <rect x="${w - 177}" y="${h - 18}" width="177" height="18" fill="#fff" fill-opacity=".9"/>
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer"><text x="${w - 7}" y="${h - 6}" text-anchor="end" fill="#66716b" font-size="8.6">© OpenStreetMap contributors</text></a>
        </g>
      </svg>
    </div>`;
  };
}());
