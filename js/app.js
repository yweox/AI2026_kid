/**
 * SafeKids Application Core Controller (app.js)
 * Coordinates data loading, map rendering, and dual-mode switcher
 */

document.addEventListener('DOMContentLoaded', async () => {
  let zonesData = [];
  let currentMode = 'kid'; // 'kid' or 'parent'

  // 1. Initialize Map Engine
  const map = MapEngine.initMap('map');

  // 2. Load and Parse CSV Data
  try {
    const loadingOverlay = document.getElementById('loading-overlay');
    zonesData = await CSVParser.loadAndParseCSV('전국어린이보호구역표준데이터.csv');
    
    if (loadingOverlay) {
      loadingOverlay.style.display = 'none';
    }

    // Render Initial Zone Markers
    MapEngine.renderZoneMarkers(zonesData);

    // Initial User Location (Default: first zone location or Icheon center)
    const initialPos = zonesData.length > 0 
      ? { lat: zonesData[0].lat, lng: zonesData[0].lng }
      : { lat: 37.28, lng: 127.44 };

    // 3. Initialize Sub-modules
    KidMode.init(zonesData, initialPos);
    ParentMode.init(zonesData);
    QuestEngine.init();

    // 4. Set Initial Map Theme to Kid Mode (Pastel Storybook Tiles)
    MapEngine.setMapTheme('kid');

    // 5. Bind Global Event Handlers
    bindGlobalEvents();

  } catch (err) {
    console.error("Application Startup Failure:", err);
    alert("데이터를 로드하는 중 오류가 발생했습니다: " + err.message);
  }

  /**
   * Binds mode switcher and search events
   */
  function bindGlobalEvents() {
    const btnKid = document.getElementById('btn-mode-kid');
    const btnParent = document.getElementById('btn-mode-parent');
    const searchInput = document.getElementById('search-input');

    if (btnKid) {
      btnKid.addEventListener('click', () => switchMode('kid'));
    }
    if (btnParent) {
      btnParent.addEventListener('click', () => switchMode('parent'));
    }

    const searchDropdown = document.getElementById('search-dropdown');

    if (searchInput && searchDropdown) {
      // 1. 실시간 입력 시 자동완성 드롭다운 렌더링
      searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        if (!keyword) {
          searchDropdown.classList.remove('active');
          searchDropdown.innerHTML = '';
          return;
        }

        // 전체 데이터에서 매칭되는 목록 검색 (최대 10개)
        const matched = zonesData.filter(z => 
          z.name.toLowerCase().includes(keyword) || 
          z.address.toLowerCase().includes(keyword) ||
          z.type.toLowerCase().includes(keyword)
        ).slice(0, 10);

        if (matched.length === 0) {
          searchDropdown.innerHTML = `<div class="search-no-results">검색 결과가 없습니다.</div>`;
        } else {
          searchDropdown.innerHTML = matched.map(zone => `
            <div class="search-item" data-id="${zone.id}" data-lat="${zone.lat}" data-lng="${zone.lng}">
              <div class="search-item-title">
                <i class="fas fa-school"></i> ${zone.name}
              </div>
              <div class="search-item-sub">
                ${zone.type} | ${zone.address}
              </div>
            </div>
          `).join('');

          // 항목 클릭 시 지도 이동 (FlyTo) 및 팝업 표시
          searchDropdown.querySelectorAll('.search-item').forEach(item => {
            item.addEventListener('click', () => {
              const lat = parseFloat(item.dataset.lat);
              const lng = parseFloat(item.dataset.lng);
              const zoneId = item.dataset.id;

              // 지도를 해당 위치로 부드럽게 이동 및 핀 팝업 오픈
              MapEngine.focusZone(lat, lng, zoneId);

              // 드롭다운 닫기
              searchDropdown.classList.remove('active');
              const titleText = item.querySelector('.search-item-title').textContent.trim();
              searchInput.value = titleText;
            });
          });
        }

        searchDropdown.classList.add('active');
      });

      // 2. Enter 키 입력 시 첫 번째 결과로 이동
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          const firstItem = searchDropdown.querySelector('.search-item');
          if (firstItem) {
            firstItem.click();
          }
        }
      });

      // 3. 검색창 외부 클릭 시 드롭다운 닫기
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchDropdown.contains(e.target)) {
          searchDropdown.classList.remove('active');
        }
      });
    }
  }

  /**
   * Switches active UI mode (Kid Mode vs Parent Mode)
   */
  function switchMode(mode) {
    if (currentMode === mode) return;
    currentMode = mode;

    const btnKid = document.getElementById('btn-mode-kid');
    const btnParent = document.getElementById('btn-mode-parent');
    const kidPanel = document.getElementById('kid-side-panel');
    const parentPanel = document.getElementById('parent-side-panel');
    const body = document.body;

    if (mode === 'kid') {
      body.classList.remove('parent-mode');
      btnKid.classList.add('active');
      btnParent.classList.remove('active');
      
      kidPanel.style.display = 'flex';
      parentPanel.style.display = 'none';

      // Switch to Child-Friendly Pastel Map Tiles
      MapEngine.setMapTheme('kid');

    } else {
      body.classList.add('parent-mode');
      btnParent.classList.add('active');
      btnKid.classList.remove('active');

      parentPanel.style.display = 'flex';
      kidPanel.style.display = 'none';

      // Switch to Parent Sleek Dark Map Tiles
      MapEngine.setMapTheme('parent');
    }

    // Invalidate Leaflet Map Size on layout change
    setTimeout(() => {
      MapEngine.getMap().invalidateSize();
    }, 200);
  }
});
