const {
  saveEarthquakeEvent
} = require("./saveEarthquakeEvent");

const {
  saveStationIntensities
} = require("./saveStationIntensities");

async function saveParsedEarthquake(data) {
  try {
    await saveEarthquakeEvent(data);

    if (
      data?.eventId &&
      Array.isArray(data.points) &&
      data.points.length > 0
    ) {
      await saveStationIntensities(
        data.eventId,
        data.points
      );
    }
  }
  catch (error) {
    console.error("地震情報DB保存失敗:");
    console.error(error);
  }
}

module.exports = {
  saveParsedEarthquake
};
