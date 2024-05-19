const DEBUG = true;

// SPOTIFY CONSTANTS
const ID_BUTTON_LYRICS = 'lyrics-button';
const ID_TITLE = 'context-item-info-title';
const ID_ARTIST = 'context-item-info-artist';
const ID_WIDGET_NOW_PLAYING = 'now-playing-widget';
const ID_PLAYBACK_POSITION = 'playback-position';
const ID_PLAYBACK_PROGRESSBAR = 'progress-bar';
const ID_PLAYBACK_DURATION = 'playback-duration';
const CSS_ID = 'data-testid';
const ATTR_BUTTON_LYRICS_ACTIVE = "data-active";
const SF_CLASSNAME_LYRICS_CONTAINER = 'FUYNhisXTCmbzt9IDxnT';

// EXTENSION CONSTANTS
/** Class name of the custom lyrics div. */
const CLASSNAME_LYRICS_CONTAINER = 'lyrics_container'
/** Class name of the custom lyrics line div */
const CLASSNAME_LYRICS_ADDED = 'added-lyrics'
const CLASSNAME_LYRICS_PASSED = 'passed-lyrics';
const CLASSNAME_ACTIVE_LYRICS = 'active-lyrics';
const CLASSNAME_INACTIVE_LYRICS = 'inactive-lyrics';
/** This attribute holds timestamp in mm:ss format for each div. */
const ATTR_TIMESTAMP = 'timestamp';

const manifestData = chrome.runtime.getManifest();
const headers = new Headers({
    "Accept"       : "application/json",
    "Content-Type" : "application/json",
    "User-Agent"   : `${manifestData.short_name} ${manifestData.version_name} (${manifestData.homepage_url})`
});

/** Converts playback time to seconds */
function parseTimestamp(timestamp) {
    const [minutes, seconds] = timestamp.split(':').map(Number);
    return minutes * 60 + seconds;
}

/** Selects UI elements with it's [CSS_ID] */
function selectById(id) {
    return document.querySelector(`[${CSS_ID}="${id}"]`);
}

/** Observes the now playing widget for track change. */
const widgetObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type == 'attributes') {
            if (mutation.target.getAttribute(CSS_ID) == ID_WIDGET_NOW_PLAYING) {
                if (DEBUG) console.log('track changed');
                detachListener();
                init();
                break;
                //the observer resets the code flow.
            }
        }
    }
});

/** Observes the playback position */
const playbackObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type == "characterData") {
            if (mutation.target.parentNode.getAttribute(CSS_ID) == ID_PLAYBACK_POSITION) {
                updatePlayBackPosition();
                break;
            }
        }
    }
});

/** observes the lyrics button state */
const buttonObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
        if (mutation.type == 'attributes') {
            handleButtonEvent();
            break;
        }
    }
})
/** Starts to observe now playing widget for track change once it's available. */
function observeNowPlayingWidget() {
    const nowPlayingWidget = selectById(ID_WIDGET_NOW_PLAYING);
    if (nowPlayingWidget) {
        pullTrackInfo(); // trying to fetch and show lyrics, the observer will reset the flow  and lands here for next call too.
        widgetObserver.observe(nowPlayingWidget, { attributes: true, characterData: true, childList: true })
    }
    else {
        window.setTimeout(observeNowPlayingWidget, 1000);
    }
}

/** Called from playback observer to scroll lyrics position */
function updatePlayBackPosition() {
    const playback = selectById(ID_PLAYBACK_POSITION).innerHTML;
    const playbackTime = (playback.split(":")[0].length == 1) ? "0" + playback : playback;
    updateLyricsClassNames(playbackTime); // calling every seconds, to compansate manually changed playback position.
}

/** Updating classnames of lyrics with respect to playbackTime */
function updateLyricsClassNames(playbackTime) {
    const lyrics = document.querySelectorAll(`.${CLASSNAME_LYRICS_ADDED}`);
    //update progress only if its synced lyrics.
    if (lyrics[0].hasAttribute(ATTR_TIMESTAMP)) {
        const lyricsArray = Array.from(lyrics);
        function parseTimestamp(playbackTime) {
            const [minutes, seconds] = playbackTime.split(':').map(Number);
            return minutes * 60 + seconds;
        }
        // finding the lyrics for the current timestamp
        const playbackTimeSeconds = parseTimestamp(playbackTime);
        const currentLyrics = lyricsArray.reduce(function (prev, curr) {
            const prevLineTime = parseTimestamp(prev.getAttribute(ATTR_TIMESTAMP));
            const currLineTime = parseTimestamp(curr.getAttribute(ATTR_TIMESTAMP));
            return (Math.abs(currLineTime - playbackTimeSeconds) < Math.abs(prevLineTime - playbackTimeSeconds) && currLineTime <= playbackTimeSeconds) ? curr : prev;
        });
        // removing active lyrics class name from everyline 
        lyricsArray.forEach((lyric) => {
            lyric.classList.remove(CLASSNAME_ACTIVE_LYRICS);
            let lineTimeStamp = lyric.getAttribute(ATTR_TIMESTAMP);
            let cl = lyric.classList;
            if (lineTimeStamp <= playbackTime) {
                cl.remove(CLASSNAME_INACTIVE_LYRICS);
                cl.add(CLASSNAME_LYRICS_PASSED);
            } else {
                cl.remove(CLASSNAME_LYRICS_PASSED);
                cl.add(CLASSNAME_INACTIVE_LYRICS);
            }
        });
        // assigning active lyrics class only for the line for this timestamp
        currentLyrics.classList.add(CLASSNAME_ACTIVE_LYRICS);
        currentLyrics.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

/** This function handles the lyrics line clicks */
function changePlayBackPosition(timeStamp) {
    if (DEBUG) console.log('trying to change playback to ', timeStamp);
    const duration = selectById(ID_PLAYBACK_DURATION).textContent;
    const timeStampSeconds = parseTimestamp(timeStamp);
    const durationSeconds = parseTimestamp(duration);
    const progress = (timeStampSeconds / durationSeconds);
    const progressBar = selectById(ID_PLAYBACK_PROGRESSBAR);
    const progressBarRect = progressBar.getBoundingClientRect();
    const clickX = progressBarRect.x + (progressBarRect.width * progress);
    const clickY = progressBarRect.y + (progressBarRect.height / 2);
    const clickEvent = new MouseEvent(MouseEvent.MOUSE_DOWN, {
        view: window, bubbles: true, cancelable: true, clientX: clickX, clientY: clickY
    });
    progressBar.dispatchEvent(clickEvent);
}

/** makes lyrics div for lrc text. */
function lrcToDivs(lrcContent) {
    const lines = lrcContent.trim().split('\n');
    const lyricDiv = document.createElement('div');
    lyricDiv.className = CLASSNAME_LYRICS_CONTAINER;
    lines.forEach(line => {
        let matches = line.match(/\[(\d+:\d+\.\d+)\](.*)/);
        let lineDiv = document.createElement('div');
        lineDiv.classList.add(CLASSNAME_LYRICS_ADDED);
        if (matches && matches.length === 3) {
            // handling lrc lyrics
            let timestamp = matches[1].split(".")[0];
            let lyrics = matches[2].trim();
            lineDiv.classList.add(CLASSNAME_INACTIVE_LYRICS);
            lineDiv.setAttribute(ATTR_TIMESTAMP, timestamp);
            lineDiv.innerHTML = (lyrics == "") ? "♪" : lyrics;
            (function (ts) {
                lineDiv.onclick = () => changePlayBackPosition(ts);
            })(timestamp);
        } else {
            // process plain lyrics
            lineDiv.classList.add(ATTR_BUTTON_LYRICS_ACTIVE);
            lineDiv.innerHTML = (line == "") ? "♪" : line.trim();
        }
        lyricDiv.appendChild(lineDiv);
    });
    return lyricDiv;
}

/** hides the spotify ui elements for showing custom lyrics. */
function hideSpotifyLyricsUi(mainContent) {
    //remove any previously set lyrics.
    const oldLyrics = mainContent.querySelector(`.${CLASSNAME_LYRICS_CONTAINER}`);
    if (oldLyrics) {
        if (DEBUG) console.log('removing previous lyrics')
        oldLyrics.remove();
    }
    // hiding all other children of mainContent. it can't be removed, spotify need these for next track
    for (item of mainContent.children) {
        // item.style.visibility = 'hidden';
        item.style.display = 'none';
    }
}

/** Showing spotify lyrics UI, call this when custom lyrics are not available */
function showSpotifyLyricsUi() {
    const mainContent = document.querySelector(`.${SF_CLASSNAME_LYRICS_CONTAINER}`);
    const oldLyrics = mainContent.querySelector(`.${CLASSNAME_LYRICS_CONTAINER}`);
    if (oldLyrics) {
        if (DEBUG) console.log('removing previous lyrics')
        oldLyrics.remove();
    }
    // hiding all other children of mainContent. it can't be removed, spotify need these for next track
    for (item of mainContent.children) {
        // item.style.visibility = 'visible';
        item.style.display = 'flex';
    }
}

/** Replace the existing lyrics ui with new lyrics content. */
function replaceLyrics(lyrics) {
    const lyricDivs = lrcToDivs(lyrics);
    const mainContent = document.querySelector(`.${SF_CLASSNAME_LYRICS_CONTAINER}`);
    if (mainContent) {
        hideSpotifyLyricsUi(mainContent);
        mainContent.appendChild(lyricDivs);
        if (DEBUG) console.log('attaching playback observer')
        const timeStampElement = selectById(ID_PLAYBACK_POSITION);
        const config = {
            attributes: false,
            childList: true,
            subtree: true,
            characterData: true,
            characterDataOldValue: true
        };
        playbackObserver.observe(timeStampElement, config);
    } else {
        if (DEBUG) console.log('failed to determine lyrics layout');
    }
}

/** Pulling lyrics from internet and replacing it in UI*/
async function fetchAndShowLyrics(title, artist) {
    try {
        if (DEBUG) console.log('searching for lyrics');
        const url = `https://lrclib.net/api/search?track_name=${title}&artist_name=${artist}`;
        const response = await fetch(url, headers);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const lyricsData = await response.json();
        if (lyricsData.length > 0) {
            if (DEBUG) console.log('found ', lyricsData.length, ' results.');
            const lyricsItem = lyricsData.find(it => !it.instrumental);
            if (lyricsItem) {
                const lyrics = lyricsItem.syncedLyrics || lyricsItem.plainLyrics;
                replaceLyrics(lyrics);
            } else {
                if (DEBUG) console.log('failed to parse result for ', trackTitle);
                showSpotifyLyricsUi();
            }
        } else {
            if (DEBUG) console.log('No lyrics found');
            showSpotifyLyricsUi();
        }
    } catch (error) {
        console.error('Error fetching lyrics:', error);
        showSpotifyLyricsUi();
    }
}

/** Preaparing trackInfo for network request */
function pullTrackInfo() {
    const trackTitle = selectById(ID_TITLE).textContent;
    const artist = selectById(ID_ARTIST).textContent;
    if (DEBUG) console.log('currentTrack: ', trackTitle)
    fetchAndShowLyrics(trackTitle, artist);
}

/** Handle the state changes of lyrics button in now playing bar */
function handleButtonEvent() {
    const lyricsUiVisible = selectById(ID_BUTTON_LYRICS).getAttribute(ATTR_BUTTON_LYRICS_ACTIVE) == 'true';
    if (DEBUG) console.log('lyrics UI visible: ', lyricsUiVisible);
    if (lyricsUiVisible) {
        observeNowPlayingWidget();
    }
    else {
        detachListener(); // stopping extension when lyrics ui closed
    }
}

/** Disconnects all observers */
function detachListener() {
    if (DEBUG) console.log('disconnecting widget and playback observer')
    widgetObserver.disconnect();
    playbackObserver.disconnect();
}

/** Initializing extension */
function init() {
    const lyricsButton = selectById(ID_BUTTON_LYRICS);
    if (lyricsButton) {
        if (DEBUG) console.log('starting observers');
        buttonObserver.disconnect(); // disconnecting previous, if any
        buttonObserver.observe(lyricsButton, { attributes: true, attributeFilter: [ATTR_BUTTON_LYRICS_ACTIVE], childList: false })
        observeNowPlayingWidget();
    }
    else {
        if (DEBUG) console.log('lyrics button not found')
        window.setTimeout(init, 1000);
    }
}

/** Styling for the custom lyrics UI. */
function applyStyling() {
    const style = document.createElement('style');
    style.textContent = `
        .${CLASSNAME_LYRICS_CONTAINER}{
            text-align:center;
            background-color: var(--lyrics-color-background);
            padding: 64px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            cursor:default;
        }
        .${CLASSNAME_LYRICS_ADDED}{
            transition: all .35s cubic-bezier(0.64, 0.39, 0.51, 0.9);
            font-family: Arial, sans-serif;
            font-size: 1.5rem;
            margin: 16px;
            font-weight: 700;
            color: var(--lyrics-color-active);
            font-family: sans-serif;
            line-height: 1em;
            max-width: -webkit-max-content;
            max-width: -moz-max-content;
            max-width: max-content;
            position: relative;
            display:block;
            cursor:pointer;
        }
        .${CLASSNAME_LYRICS_PASSED}{
            color: var(--lyrics-color-passed, rgba(255, 255, 255, 0.7));
        }
        .${CLASSNAME_INACTIVE_LYRICS}{
            color: var(--lyrics-color-inactive, rgb(0, 0, 0))
        }
        .${CLASSNAME_ACTIVE_LYRICS}{
            color: var(--lyrics-color-active, rgb(255, 255, 255));
            font-size:  1.8rem;
        }
    `;
    document.head.appendChild(style);
}

window.addEventListener('load', function () {
    init();
    applyStyling();
    if (DEBUG) console.log('extension loaded');
});