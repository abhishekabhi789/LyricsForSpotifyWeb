
/** Converts playback time to seconds */
function parseTimestamp(timestamp) {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
}

/** Selects UI elements with it's [CSS_ID] */
function selectById(id) {
    return document.querySelector(`[${CSS_ID}="${id}"]`);
}
