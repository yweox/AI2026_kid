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

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        MapEngine.filterByKeyword(e.target.value);
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
