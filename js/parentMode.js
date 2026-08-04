/**
 * SafeKids Parent Mode Module
 * Manages parent dashboard stats and CCTV-missing danger zone list
 */

window.ParentMode = (function () {
  let allZones = [];
  let dangerZones = [];

  /**
   * Initializes Parent Mode dashboard
   * @param {Array<Object>} zones 
   */
  function init(zones) {
    allZones = zones;
    dangerZones = zones.filter(z => z.cctvInstalled === 'N');

    renderDashboardStats();
    renderDangerZoneList();
  }

  /**
   * Calculates and renders dashboard summary metrics
   */
  function renderDashboardStats() {
    const totalCount = allZones.length;
    const installedCount = allZones.filter(z => z.cctvInstalled === 'Y').length;
    const missingCount = dangerZones.length;
    const installRate = totalCount > 0 ? ((installedCount / totalCount) * 100).toFixed(1) : 0;

    const elTotal = document.getElementById('stat-total-zones');
    const elInstalled = document.getElementById('stat-installed-cctv');
    const elRate = document.getElementById('stat-cctv-rate');
    const elMissing = document.getElementById('stat-missing-cctv');

    if (elTotal) elTotal.textContent = totalCount.toLocaleString();
    if (elInstalled) elInstalled.textContent = installedCount.toLocaleString();
    if (elRate) elRate.textContent = `${installRate}%`;
    if (elMissing) elMissing.textContent = missingCount.toLocaleString();

    const elDangerBadge = document.getElementById('danger-list-count');
    if (elDangerBadge) elDangerBadge.textContent = `${missingCount}개소`;
  }

  /**
   * Renders the danger zone (CCTV 미설치) sidebar list
   */
  function renderDangerZoneList() {
    const listContainer = document.getElementById('danger-zone-scroll');
    if (!listContainer) return;

    listContainer.innerHTML = '';

    if (dangerZones.length === 0) {
      listContainer.innerHTML = `
        <div style="text-align: center; color: #94A3B8; padding: 20px;">
          <i class="fas fa-check-circle" style="font-size: 2rem; color: #10B981; margin-bottom: 8px;"></i>
          <p>모든 스쿨존에 CCTV가 설치되어 있습니다!</p>
        </div>
      `;
      return;
    }

    // Display first 100 items for smooth DOM performance
    const displayList = dangerZones.slice(0, 100);

    displayList.forEach(zone => {
      const card = document.createElement('div');
      card.className = 'danger-item-card';
      card.innerHTML = `
        <div class="danger-item-title">⚠️ ${zone.name}</div>
        <div class="danger-item-sub">
          <span>${zone.type} | ${zone.address}</span>
          <strong style="color: #F43F5E;">CCTV 미설치</strong>
        </div>
      `;

      card.addEventListener('click', () => {
        MapEngine.focusZone(zone.lat, zone.lng, zone.id);
      });

      listContainer.appendChild(card);
    });
  }

  return {
    init
  };
})();
