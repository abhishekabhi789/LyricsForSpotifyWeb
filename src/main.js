var DEBUG = false;
var keepLyricsBySpotify = true;
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
const ID_STOCK_LYRICS_LINE = "fullscreen-lyric";

// EXTENSION CONSTANTS
/** Class name of the custom lyrics div. */
const CLASSNAME_LYRICS_CONTAINER = 'lyrics-container';
const CUSTOM_STYLE_ELEMENT_ID = 'custom-lyrics-styles';
/** Class name of the custom lyrics line div */
const CLASSNAME_LYRICS_ADDED = 'added-lyrics';
const CLASSNAME_LYRICS_PASSED = 'passed-lyrics';
const CLASSNAME_ACTIVE_LYRICS = 'active-lyrics';
const CLASSNAME_INACTIVE_LYRICS = 'inactive-lyrics';
const CLASSNAME_INFOLINE = 'info-line-container';
/** This attribute holds timestamp in mm:ss format for each div. */
const ATTR_TIMESTAMP = 'timestamp';
const lyricsManager = new LyricsManager();


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

// This observer is disabled since it is not observeing the button attribute changes as needed
// /** observes the lyrics button state */
// const buttonObserver = new MutationObserver((mutations) => {
//     for (const mutation of mutations) {
//         console.log(mutation)
//         if (mutation.type == 'attributes') {
//             handleButtonEvent();
//             break;
//         }
//     }
// })
/** This block will be called whenever the address bar URL changes. From there lyrics panel visibility is identified */
const buttonListener = (e) => {
    if (e.destination.url.endsWith("/lyrics")) {
        if (DEBUG) console.log("lyrics view opened");
        window.setTimeout(observeNowPlayingWidget, 1000);
    } else {
        if (DEBUG) console.log("lyrics view closed");
        detachListener();
    }
}

/** Function that checks if the current playing track has lyrics provided by spotify. */
function hasStockLyrics() {
    if (selectById(ID_BUTTON_LYRICS).getAttribute(ATTR_BUTTON_LYRICS_ACTIVE) == 'true') {
        const stockLyricsContainer = document.querySelector(`.${SF_CLASSNAME_LYRICS_CONTAINER}`)
        const lyrics = stockLyricsContainer.querySelectorAll(`div[${CSS_ID}="${ID_STOCK_LYRICS_LINE}"]`)
        return lyrics ? lyrics.length > 0 : false
    } else {
        if (DEBUG) console.log("lyrics window not opened")
        return false
    }
}

/** Starts to observe now playing widget for track change once it's available. */
function observeNowPlayingWidget() {
    const nowPlayingWidget = selectById(ID_WIDGET_NOW_PLAYING);
    if (nowPlayingWidget) {
        widgetObserver.observe(nowPlayingWidget, { attributes: true, characterData: true, childList: true });
        pullTrackInfo();
    }
    else {
        if (DEBUG) console.log('now playing widget not found');
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
        currentLyrics.classList.remove(CLASSNAME_LYRICS_PASSED); // prevent multiple classes
        // assigning active lyrics class only for the line for this timestamp
        currentLyrics.classList.add(CLASSNAME_ACTIVE_LYRICS);
        currentLyrics.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    }
}

/** This function handles the lyrics line clicks */
function changePlayBackPosition(timeStamp) {
    if (DEBUG) console.log('trying to change playback to', timeStamp);
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

/** hides the spotify ui elements for showing custom lyrics. */
function hideSpotifyLyricsUi(mainContent) {
    if (DEBUG) console.log('hiding spotify original UI');
    //remove any previously set lyrics.
    const oldLyrics = mainContent.querySelector(`.${CLASSNAME_LYRICS_CONTAINER}`);
    if (oldLyrics) {
        if (DEBUG) console.log('removing previous lyrics')
        oldLyrics.remove();
    }
    // hiding all other children of mainContent. it shouldn't be removed, spotify need these for next track
    if (mainContent.children.length != 0) {
        for (const item of mainContent.children) {
            // item.style.visibility = 'hidden';
            item.style.display = 'none';
        }
    } else {
        //children are not available to hide.
        let attempts = 0;
        const maxAttempts = 10;
        const interval = setInterval(() => {
            if (mainContent.childList.length != 0 || attempts >= maxAttempts) {
                clearInterval(interval);
            } else {
                if (DEBUG) console.log('re attempting to hide spotify lyrics UI');
                attempts++;
                hideSpotifyLyricsUi(mainContent);
            }
        }, 100);
    }
}

/** Showing spotify lyrics UI, call this when custom lyrics are not available */
function showSpotifyLyricsUi() {
    if (DEBUG) console.log('showing spotify original UI');
    const mainContent = document.querySelector(`.${SF_CLASSNAME_LYRICS_CONTAINER}`);
    if (mainContent) {
        const oldLyrics = mainContent.querySelector(`.${CLASSNAME_LYRICS_CONTAINER}`);
        if (oldLyrics) {
            if (DEBUG) console.log('removing previous lyrics');
            oldLyrics.remove();
        }

        // hiding all other children of mainContent. it can't be removed, spotify need these for next track
        for (const item of mainContent.children) {
            // item.style.visibility = 'visible';
            item.style.display = 'flex';
        }
    }
}

/** Replace the existing lyrics ui with new lyrics content. */
function replaceLyrics(lyricDivs) {
    let retries = 3;
    if (DEBUG) console.log('replacing lyrics UI');
    const retryInterval = 1000; // 1 second interval between retries

    const tryReplaceLyrics = () => {
        const mainContent = document.querySelector(`.${SF_CLASSNAME_LYRICS_CONTAINER}`);
        if (mainContent) {
            hideSpotifyLyricsUi(mainContent);
            mainContent.appendChild(lyricDivs);
            if (DEBUG) console.log('attaching playback observer');
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
            if (retries > 0) {
                retries--;
                setTimeout(tryReplaceLyrics, retryInterval);
            } else {
                if (DEBUG) console.log('failed to determine lyrics layout');
            }
        }
    };

    tryReplaceLyrics();
}

/** Preaparing trackInfo for network request */
async function pullTrackInfo() {
    if (keepLyricsBySpotify) {
        const lyricsButton = selectById(ID_BUTTON_LYRICS);
        if (lyricsButton.getAttribute(ATTR_BUTTON_LYRICS_ACTIVE) == 'true') {
            if (hasStockLyrics()) {
                if (DEBUG) console.log("Lyrics are available, won't be removed");
                return;
            } else {
                if (DEBUG) console.log("stock lyrics not available, trying to add custom lyrics");
            }
        } else {
            if (DEBUG) console.log("lyrics UI not visible, aborting task");
            return;
        }
    } else {
        if (DEBUG) console.log("replacing with custom lyrics UI");
    }
    const trackTitle = selectById(ID_TITLE).textContent;
    const artist = selectById(ID_ARTIST).textContent;
    if (trackTitle && artist) {
        const lyricsDiv = await lyricsManager.getLyrics(trackTitle, artist);
        if (lyricsDiv != null) {
            replaceLyrics(lyricsDiv);
        }
        else showSpotifyLyricsUi();
    }
}

// disabled since observer fails to monitor the attribute change
// /** Handle the state changes of lyrics button in now playing bar */
// function handleButtonEvent() {
//     const lyricsUiVisible = selectById(ID_BUTTON_LYRICS).getAttribute(ATTR_BUTTON_LYRICS_ACTIVE) == 'true';
//     if (DEBUG) console.log('lyrics UI visible:', lyricsUiVisible);
//     if (lyricsUiVisible) {
//         observeNowPlayingWidget();
//     }
//     else {
//         detachListener(); // stopping extension when lyrics ui closed
//     }
// }

/** Disconnects all observers */
function detachListener() {
    if (DEBUG) console.log('detaching playback observer');
    playbackObserver.disconnect();
}

/** Initializing extension */
function init() {
    const lyricsButton = selectById(ID_BUTTON_LYRICS);
    if (lyricsButton) {
        if (DEBUG) console.log('starting observers');
        // buttonObserver.disconnect(); // disconnecting previous, if any
        // buttonObserver.observe(lyricsButton, { attributes: true,attributeFilter: [ATTR_BUTTON_LYRICS_ACTIVE], childList: true });
        navigation.removeEventListener("navigate", buttonListener);
        navigation.addEventListener("navigate", buttonListener);
        observeNowPlayingWidget();
    }
    else {
        if (DEBUG) console.log('lyrics button not found');
        window.setTimeout(init, 1000);
    }
}
// listening for config changes
chrome.storage.onChanged.addListener(function (changes, namespace) {
    if (namespace === 'sync') {
        if (changes.enableExtension != undefined) {
            if (DEBUG) console.log('EXTENSION', changes.enableExtension.newValue ? "ENABLED" : "DISABLED");
            if (changes.enableExtension.newValue == true) {
                console.log('Restarting plugin services')
                init();
            } else {
                console.log('Stopping plugin services')
                detachListener();
                widgetObserver.disconnect();
                // buttonObserver.disconnect();
                navigation.removeEventListener("navigate", buttonListener);
                showSpotifyLyricsUi();
            }
        }
        if (changes.removeBackground != undefined) {
            const bgColor = changes.removeBackground.newValue == true ? 'transparent' : 'var(--lyrics-color-background)';
            if (DEBUG) console.log('changing background to:', bgColor);
            document.querySelector(`.${CLASSNAME_LYRICS_CONTAINER}`).style.backgroundColor = bgColor;
        }
        if (changes.keepLyricsBySpotify != undefined) {
            keepLyricsBySpotify = changes.keepLyricsBySpotify.newValue;
            if (keepLyricsBySpotify == true) {
                if (DEBUG) console.log("stock lyrics will be shown");
                if (hasStockLyrics()) {
                    detachListener();
                    showSpotifyLyricsUi();
                }
            } else {
                if (DEBUG) console.log("stock lyrics will be replaced");
                pullTrackInfo();
            }
        }
        if (changes.lyricsFont != undefined) {
            if (DEBUG) console.log('changing font:', changes.lyricsFont.newValue);
            document.querySelector(':root').style.setProperty('--lyrics-font', changes.lyricsFont.newValue);
        }
        if (changes.lyricsAlignment != undefined) {
            if (DEBUG) console.log('Lyrics Alignment changed to', changes.lyricsAlignment.newValue);
            refreshTheme();
        }
        if (changes.enableLogging != undefined) {
            const value = changes.enableLogging.newValue;
            console.log('Debugging', value ? "enabled" : "disabled");
            DEBUG = value;
        }
        if (changes.enableCustomStyles != undefined) {
            //refreshes when enable or disable custom theme checkbox
            refreshTheme();
        }
        //refreshes when any of the custom styles updates
        if (changes.allLyricsStyle != undefined || changes.passedLyricsStyles != undefined || changes.activeLyricsStyles != undefined || changes.inactiveLyricsStyles != undefined) {
            refreshTheme();
        }
    }
});

/** applying styles for the custom lyrics UI. */
function applyStyling(bgColor, lyricsAlignment, lyricsFont, allLyricsStyle, passedLStyles, activeLStyles, inactiveLStyles) {
    const style = document.createElement('style');
    style.id = CUSTOM_STYLE_ELEMENT_ID;
    style.textContent = `
        :root{
            --lyrics-font: ${lyricsFont};
        }
        .${CLASSNAME_LYRICS_CONTAINER}{
            text-align: ${lyricsAlignment};
            padding: 64px;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: ${lyricsAlignment};
            cursor: default;
            font-family: var(--lyrics-font);
            background-color: ${bgColor};
        }
        .${CLASSNAME_LYRICS_ADDED}{
           ${allLyricsStyle}
        }
        .${CLASSNAME_LYRICS_PASSED}{
            ${passedLStyles}
        }
        .${CLASSNAME_INACTIVE_LYRICS}{
            ${inactiveLStyles}
        }
        .${CLASSNAME_ACTIVE_LYRICS}{
            ${activeLStyles}
        }
        .${CLASSNAME_INFOLINE} p{
            font-size: 0.8rem;
            font-weight: 500;
            font-style: italic;
            color:  rgba(255, 255, 255, 0.5);
            text-decoration: none;
        }
    `;
    document.head.appendChild(style);

}
/** replaces the theme as per the configs. */
function refreshTheme() {
    if (DEBUG) console.log('refreshing theme');
    const currentStyle = document.getElementById(CUSTOM_STYLE_ELEMENT_ID);
    chrome.storage.sync.get(['removeBackground', 'lyricsAlignment', 'lyricsFont', 'enableCustomStyles', 'allLyricsStyle', 'passedLyricsStyles', 'activeLyricsStyles', 'inactiveLyricsStyles'], function (results) {
        if (DEBUG) console.log('configs', 'enableCustomStyles', 'allLyricsStyle', results.allLyricsStyle, 'enableCustomStyles', results.enableCustomStyles, 'passedLyricsStyles', results.passedLyricsStyles, 'activeLyricsStyles', results.activeLyricsStyles, 'inactiveLyricsStyles', results.inactiveLyricsStyles);
        const lyricsAlignment = results.lyricsAlignment != undefined ? results.lyricsAlignment : 'center';
        const lyricsFont = results.lyricsFont != undefined ? results.lyricsFont : 'Arial sans';
        const bgColor = results.removeBackground == true ? 'transparent' : 'var(--lyrics-color-background)';
        if (DEBUG) console.log('Configs:', 'font', lyricsFont, '| color', bgColor, '| alignment', lyricsAlignment);
        if (results.enableCustomStyles == true) {
            if (DEBUG) console.log('adding custom styles');
            const allLyricsStyle = results.allLyricsStyle != undefined ? results.allLyricsStyle : allLyricsDefaultStyle;
            const passedLStyles = results.passedLyricsStyles != undefined ? results.passedLyricsStyles : passedLDefaultStyles;
            const activeLStyles = results.activeLyricsStyles != undefined ? results.activeLyricsStyles : activeLDefaultStyles;
            const inactiveLStyles = results.inactiveLyricsStyles != undefined ? results.inactiveLyricsStyles : inactiveLDefaultStyles;
            if (currentStyle != undefined) { currentStyle.remove(); }
            applyStyling(bgColor, lyricsAlignment, lyricsFont, allLyricsStyle, passedLStyles, activeLStyles, inactiveLStyles);
        } else {
            if (DEBUG) console.log('removing custom styles');
            if (currentStyle != undefined) { currentStyle.remove(); }
            applyStyling(bgColor, lyricsAlignment, lyricsFont, allLyricsDefaultStyle, passedLDefaultStyles, activeLDefaultStyles, inactiveLDefaultStyles);
        }
    });
}

window.addEventListener('load', function () {
    chrome.storage.sync.get(['removeBackground', 'lyricsFont', 'enableLogging', 'enableExtension'], function (results) {
        DEBUG = results.enableLogging == true ? true : false;
        const extensionEnabled = results.enableExtension == false ? false : true; //if undefined, enable extension
        if (extensionEnabled) {
            init();
            refreshTheme();
            console.log('extension loaded');
        }
    });
});
