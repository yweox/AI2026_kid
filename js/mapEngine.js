/**
 * SafeKids Leaflet Map Engine Module
 * Kid Mode: Stamen Watercolor 수채화 동화풍 지도 타일
 * Parent Mode: CartoDB Dark Matter 슬레이트 지도 타일
 */

window.MapEngine = (function () {
  let map = null;
  let markerClusterGroup = null;
  let userMarker = null;
  let userAccuracyCircle = null;
  let allZonesData = [];
  let zoneMarkersMap = new Map();

  let kidTileLayer = null;
  let parentTileLayer = null;
  let currentTheme = 'kid';

  /**
   * Initializes Leaflet Map with dual-theme tile layers
   * @param {string} containerId 
   * @param {Array<number>} centerCoords 
   * @param {number} zoom 
   */
  function initMap(containerId = 'map', centerCoords = [37.28, 127.44], zoom = 13) {
    if (map) return map;

    map = L.map(containerId, {
      zoomControl: false
    }).setView(centerCoords, zoom);

    L.control.zoom({ position: 'topright' }).addTo(map);

    // 1. 🎮 어린이용 지도 타일 (CartoDB Voyager - 학부모 모드와 동일)
    kidTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO | SafeKids Map'
    });

    // 2. 🛡️ 학부모용 시인성 높은 시원한 지도 타일 (CartoDB Voyager)
    parentTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors © CARTO | SafeKids Map'
    });

    // Default: Kid Tile Layer
    kidTileLayer.addTo(map);

    // MarkerCluster Group with cute rounded badges
    markerClusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      maxClusterRadius: 50,
      disableClusteringAtZoom: 16,
      iconCreateFunction: function (cluster) {
        const count = cluster.getChildCount();
        const isKid = currentTheme === 'kid';
        return L.divIcon({
          html: `<div class="custom-cluster-badge ${isKid ? 'kid-cluster' : 'parent-cluster'}">${count}</div>`,
          className: 'custom-cluster-wrap',
          iconSize: L.point(44, 44)
        });
      }
    });

    map.addLayer(markerClusterGroup);
    return map;
  }

  /**
   * Switches Map Tile Theme (Kid Mode vs Parent Mode)
   * @param {string} mode ('kid' | 'parent')
   */
  function setMapTheme(mode) {
    if (!map || currentTheme === mode) return;
    currentTheme = mode;

    const mapContainer = document.getElementById('map');

    if (mode === 'kid') {
      if (parentTileLayer) map.removeLayer(parentTileLayer);
      if (kidTileLayer) kidTileLayer.addTo(map);
      if (mapContainer) mapContainer.classList.remove('parent-map-theme');
      if (mapContainer) mapContainer.classList.add('kid-map-theme');
    } else {
      if (kidTileLayer) map.removeLayer(kidTileLayer);
      if (parentTileLayer) parentTileLayer.addTo(map);
      if (mapContainer) mapContainer.classList.remove('kid-map-theme');
      if (mapContainer) mapContainer.classList.add('parent-map-theme');
    }
  }

  /**
   * Renders cute markers on map
   * @param {Array<Object>} zones 
   */
  function renderZoneMarkers(zones) {
    if (!map || !markerClusterGroup) return;

    allZonesData = zones;
    markerClusterGroup.clearLayers();
    zoneMarkersMap.clear();

    zones.forEach(zone => {
      const isSafe = zone.cctvInstalled === 'Y';
      
      // Cute HTML Marker Icon
      const iconHtml = isSafe 
        ? `<div class="custom-marker safe" title="${zone.name}"><i class="fas fa-shield-cat"></i></div>`
        : `<div class="custom-marker warning" title="${zone.name}"><i class="fas fa-triangle-exclamation"></i></div>`;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-leaflet-icon',
        iconSize: [42, 42],
        iconAnchor: [21, 21],
        popupAnchor: [0, -20]
      });

      const marker = L.marker([zone.lat, zone.lng], { icon: customIcon });

      // Popup HTML content
      const popupHtml = `
        <div class="zone-popup-card">
          <span class="zone-tag ${isSafe ? 'safe' : 'danger'}">
            ${isSafe ? '🛡️ 안심 스쿨존 (CCTV 설치)' : '⚠️ 주의 구역 (CCTV 미설치)'}
          </span>
          <h4>${zone.name}</h4>
          <p style="font-size: 0.82rem; color: #64748B; margin-bottom: 8px;">
            <i class="fas fa-map-marker-alt"></i> ${zone.address}
          </p>
          <div class="zone-detail-row">
            <span>시설 종류:</span>
            <strong>${zone.type}</strong>
          </div>
          <div class="zone-detail-row">
            <span>CCTV 설치대수:</span>
            <strong>${zone.cctvCount}대</strong>
          </div>
          <div class="zone-detail-row">
            <span>보호구역 도로폭:</span>
            <strong>${zone.roadWidth}m</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markerClusterGroup.addLayer(marker);
      zoneMarkersMap.set(zone.id, marker);
    });
  }

  /**
   * Updates or creates the User Current Position Marker on map
   */
  function updateUserMarker(lat, lng) {
    if (!map) return;

    const userIcon = L.divIcon({
      html: `<div class="custom-marker user-kid"><i class="fas fa-child-reaching"></i></div>`,
      className: 'user-kid-icon-wrap',
      iconSize: [48, 48],
      iconAnchor: [24, 24]
    });

    if (!userMarker) {
      userMarker = L.marker([lat, lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
      userMarker.bindPopup("<b>내 위치 (아이) 🎒</b>");
    } else {
      userMarker.setLatLng([lat, lng]);
    }

    if (!userAccuracyCircle) {
      userAccuracyCircle = L.circle([lat, lng], {
        radius: 300,
        color: '#FFB703',
        fillColor: '#FFB703',
        fillOpacity: 0.18,
        weight: 3
      }).addTo(map);
    } else {
      userAccuracyCircle.setLatLng([lat, lng]);
    }
  }

  /**
   * Focuses on specific zone
   */
  function focusZone(lat, lng, zoneId = null) {
    if (!map) return;

    map.flyTo([lat, lng], 17, { duration: 1.2 });

    if (zoneId && zoneMarkersMap.has(zoneId)) {
      const marker = zoneMarkersMap.get(zoneId);
      setTimeout(() => {
        markerClusterGroup.zoomToShowLayer(marker, () => {
          marker.openPopup();
        });
      }, 500);
    }
  }

  /**
   * Filter zones by keyword search
   */
  function filterByKeyword(keyword) {
    if (!keyword) return renderZoneMarkers(allZonesData);
    const lowerKey = keyword.toLowerCase().trim();
    const filtered = allZonesData.filter(z => 
      z.name.toLowerCase().includes(lowerKey) || 
      z.address.toLowerCase().includes(lowerKey) ||
      z.type.toLowerCase().includes(lowerKey)
    );
    renderZoneMarkers(filtered);
  }

  return {
    initMap,
    setMapTheme,
    renderZoneMarkers,
    updateUserMarker,
    focusZone,
    filterByKeyword,
    getMap: () => map
  };
})();
