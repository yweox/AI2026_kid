/**
 * SafeKids CSV Data Parser Module
 * Handles loading and parsing '전국어린이보호구역표준데이터.csv' with EUC-KR encoding
 */

window.CSVParser = (function () {
  /**
   * Reads and parses EUC-KR encoded CSV file
   * @param {string} filePath 
   * @returns {Promise<Array<Object>>} Parsed valid safety zone records
   */
  async function loadAndParseCSV(filePath = '전국어린이보호구역표준데이터.csv') {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`CSV file fetch error: ${response.statusText}`);
      }

      // Convert response arrayBuffer to EUC-KR string
      const buffer = await response.arrayBuffer();
      const decoder = new TextDecoder('euc-kr');
      const csvText = decoder.decode(buffer);

      return new Promise((resolve, reject) => {
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: function (results) {
            const rawData = results.data;
            console.log(`Parsed ${rawData.length} total rows from CSV.`);

            const sanitizedData = sanitizeData(rawData);
            console.log(`Sanitized ${sanitizedData.length} valid zone records.`);
            resolve(sanitizedData);
          },
          error: function (err) {
            reject(err);
          }
        });
      });
    } catch (error) {
      console.error("CSV Loading Error:", error);
      throw error;
    }
  }

  /**
   * Filters and normalizes raw CSV records
   */
  function sanitizeData(records) {
    const validRecords = [];

    records.forEach((row, index) => {
      // Key fields mapping
      const lat = parseFloat(row['위도']);
      const lng = parseFloat(row['경도']);
      const name = row['대상시설명'] ? row['대상시설명'].trim() : '';
      const type = row['시설종류'] ? row['시설종류'].trim() : '어린이보호구역';
      const address = row['소재지도로명주소'] || row['소재지지번주소'] || '주소 정보 없음';
      const cctvInstalled = (row['CCTV설치여부'] || '').trim().toUpperCase() === 'Y' ? 'Y' : 'N';
      const cctvCount = parseInt(row['CCTV설치대수']) || (cctvInstalled === 'Y' ? 1 : 0);
      const roadWidth = row['보호구역도로폭'] || '정보 없음';

      // Korea Coordinate Boundary Validation (Lat: 33~39, Lng: 124~132)
      if (
        !isNaN(lat) && !isNaN(lng) &&
        lat >= 33.0 && lat <= 39.0 &&
        lng >= 124.0 && lng <= 132.0 &&
        name.length > 0
      ) {
        validRecords.push({
          id: `zone-${index}`,
          name: name,
          type: type,
          address: address,
          lat: lat,
          lng: lng,
          cctvInstalled: cctvInstalled,
          cctvCount: cctvCount,
          roadWidth: roadWidth,
          raw: row
        });
      }
    });

    return validRecords;
  }

  return {
    loadAndParseCSV
  };
})();
