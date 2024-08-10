const manifestData = chrome.runtime.getManifest();
const headers = new Headers({
    "Accept": "application/json",
    "Content-Type": "application/json",
    "User-Agent": `${manifestData.short_name} ${manifestData.version_name} (${manifestData.homepage_url})`
});



class LyricsManager {
    /** A map to store all the lyrics data for current session with key as trackTitle-artist */
    #lyricsCache = new Map();
    #emptyLine = "♪";
    #INFO_LINE = (() => {
        const infoLine = document.createElement('div');
        infoLine.classList.add(CLASSNAME_INFOLINE);

        const paragraph = document.createElement('p');
        paragraph.textContent = 'Lyrics powered by ';

        const link = document.createElement('a');
        link.href = manifestData.homepage_url;
        link.textContent = manifestData.name;
        link.target = '_blank'; //should open always in a new tab

        paragraph.appendChild(link);
        infoLine.appendChild(paragraph);

        return infoLine;
    })();
    async getLyrics(trackTitle, artist) {
        const cacheKey = `${trackTitle}-${artist}`;
        if (this.#lyricsCache.has(cacheKey)) {
            if (DEBUG) console.log('Using cached lyrics for:', cacheKey);
            return this.#lyricsCache.get(cacheKey);
        }

        try {
            if (DEBUG) console.log('Fetching lyrics for:', cacheKey);
            const url = `https://lrclib.net/api/search?track_name=${trackTitle}&artist_name=${artist}`;
            const response = await fetch(url, headers);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const lyricsData = await response.json();
            if (lyricsData.length > 0) {
                var lyricsItem = lyricsData.find(it => it.syncedLyrics !== null);
                if (!lyricsItem) {
                    lyricsItem = lyricsData.find(it => it.plainLyrics !== null);
                }
                const lyrics = lyricsItem ? (lyricsItem.syncedLyrics || lyricsItem.plainLyrics) : null;
                if (lyrics == null) {
                    console.log("no lyrics found for", trackTitle, artist);
                    return null
                };
                const lyricsDiv = this.#lrcToDivs(lyrics);
                this.#lyricsCache.set(cacheKey, lyricsDiv);
                return lyricsDiv;
            } else {
                this.#lyricsCache.set(cacheKey, null);
                return null;
            }
        } catch (error) {
            console.error('Error fetching lyrics:', error);
            this.#lyricsCache.set(cacheKey, null);
            return null;
        }
    }

    #lrcToDivs(lrcContent) {
        const lines = lrcContent.trim().split('\n');
        const lyricDiv = document.createElement('div');
        lyricDiv.className = CLASSNAME_LYRICS_CONTAINER;
        lines.forEach((line, index) => {
            let matches = line.match(/\[(\d+:\d+\.\d+)\](.*)/);
            let lineDiv = document.createElement('div');
            lineDiv.classList.add(CLASSNAME_LYRICS_ADDED);
            if (matches && matches.length === 3) {
                // handling lrc lyrics
                let timestamp = matches[1].split(".")[0];
                let lyrics = matches[2].trim();
                lineDiv.classList.add(CLASSNAME_INACTIVE_LYRICS);
                lineDiv.setAttribute(ATTR_TIMESTAMP, timestamp);
                lineDiv.innerHTML = (lyrics == "") ? this.#emptyLine : lyrics;
                (function (ts) {
                    lineDiv.onclick = () => changePlayBackPosition(ts);
                })(timestamp);
                if (index == 0) {
                    if (timestamp > '00:05') {
                        const firstLine = lineDiv.cloneNode();
                        firstLine.innerHTML = this.#emptyLine;
                        firstLine.setAttribute(ATTR_TIMESTAMP, '00:00');
                        lyricDiv.appendChild(firstLine);
                    }
                }
            } else {
                // process plain lyrics
                lineDiv.classList.add(ATTR_BUTTON_LYRICS_ACTIVE);
                lineDiv.innerHTML = (line == "") ? this.#emptyLine : line.trim();
            }
            lyricDiv.appendChild(lineDiv);
        });
        lyricDiv.appendChild(this.#INFO_LINE);
        return lyricDiv;
    }
}