const manifestData = chrome.runtime.getManifest();

function showCustomStyleConfigs(enabled) {
    const elStylesMainContainer = document.getElementById('allLyricsStyle');
    const elStylesPassed = document.getElementById('passedLyricsStyles');
    const elStylesActive = document.getElementById('activeLyricsStyles');
    const elStylesInactive = document.getElementById('inactiveLyricsStyles');
    document.querySelectorAll('.custom-styles').forEach(element => {
        element.style.display = enabled ? 'flex' : 'none';
    });
    if (enabled) {
        chrome.storage.sync.get(['mainContainerStyles', 'allLyricsStyle', 'passedLyricsStyles', 'activeLyricsStyles', 'inactiveLyricsStyles'], function (result) {
            elStylesMainContainer.value = result.allLyricsStyle != undefined ? result.allLyricsStyle : allLyricsDefaultStyle;
            elStylesPassed.value = result.passedLyricsStyles != undefined ? result.passedLyricsStyles : passedLDefaultStyles;
            elStylesActive.value = result.activeLyricsStyles != undefined ? result.activeLyricsStyles : activeLDefaultStyles;
            elStylesInactive.value = result.inactiveLyricsStyles != undefined ? result.inactiveLyricsStyles : inactiveLDefaultStyles;
        });

        [elStylesMainContainer, elStylesPassed, elStylesActive, elStylesInactive].forEach((el) => {
            el.addEventListener('input', function () {
                chrome.storage.sync.set({ [el.id]: el.value });
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const elSettingsRemoveBg = document.getElementById('removeBackground');
    const elSettingsCustomFont = document.getElementById('lyricsFont');
    const elSettingsKeepStockLyrics = document.getElementById('keepLyricsBySpotify');
    const elSettingsEnableLogging = document.getElementById('enableLogging');
    const elSettingsEnableExtension = document.getElementById('enableExtension');
    const elSettingsCustomStyles = document.getElementById('enableCustomStyles');

    chrome.storage.sync.get(['removeBackground', 'lyricsFont', 'keepLyricsBySpotify', 'lyricsAlignment', 'enableLogging', 'enableExtension', 'enableCustomStyles'], function (result) {
        if (result.enableExtension != undefined) {
            elSettingsEnableExtension.checked = result.enableExtension;
        } else {
            elSettingsEnableExtension.checked = true; //default value
        }
        if (result.removeBackground != undefined) {
            elSettingsRemoveBg.checked = result.removeBackground;
        } else {
            elSettingsRemoveBg.checked = false;
        }
        if (result.keepLyricsBySpotify != undefined) {
            elSettingsKeepStockLyrics.checked = result.keepLyricsBySpotify;
        } else {
            elSettingsKeepStockLyrics.checked = true; //default value, to reduce traffic
        }
        if (result.lyricsFont != undefined) {
            elSettingsCustomFont.value = result.lyricsFont;
        }
        if (result.lyricsAlignment != undefined) {
            document.querySelector(`input[name="lyricsAlignment"][id="${result.lyricsAlignment}"]`).checked = true;
        }
        if (result.enableLogging != undefined) {
            elSettingsEnableLogging.checked = result.enableLogging;
        } else {
            elSettingsEnableLogging.checked = false;
        }
        if (result.enableCustomStyles != undefined) {
            const enabled = result.enableCustomStyles;
            elSettingsCustomStyles.checked = enabled;
            showCustomStyleConfigs(enabled);
        } else {
            elSettingsCustomStyles.checked = false;
        }
    });

    elSettingsEnableExtension.addEventListener('change', function () {
        const shouldEnable = elSettingsEnableExtension.checked;
        chrome.storage.sync.set({ enableExtension: shouldEnable }, function () {
            console.log('Extension enabled', shouldEnable);
        });
    });
    elSettingsRemoveBg.addEventListener('change', function () {
        chrome.storage.sync.set({ removeBackground: elSettingsRemoveBg.checked }, function () {
            console.log('Remove background config updated to ' + elSettingsRemoveBg.checked);
        });
    });
    elSettingsKeepStockLyrics.addEventListener('change', function () {
        chrome.storage.sync.set({ keepLyricsBySpotify: elSettingsKeepStockLyrics.checked }, function () {
            console.log('Keep stock lyrics config updated to ' + elSettingsKeepStockLyrics.checked);
        });
    });
    elSettingsCustomFont.addEventListener('change', function () {
        chrome.storage.sync.set({ lyricsFont: elSettingsCustomFont.value }, function () {
            console.log('Custom font config updated to ' + elSettingsCustomFont.value);
        });
    });
    document.getElementById('lyrics-alignment-config').querySelectorAll('input[type=radio][name=lyricsAlignment]').forEach(function (element) {
        element.addEventListener('click', function () {
            const choice = element.getAttribute('id');
            chrome.storage.sync.set({ lyricsAlignment: choice });
        })
    });
    elSettingsEnableLogging.addEventListener('change', function () {
        chrome.storage.sync.set({ enableLogging: elSettingsEnableLogging.checked }, function () {
            console.log('Enable Logging config updated to ' + elSettingsEnableLogging.checked);
        });
    });
    elSettingsCustomStyles.addEventListener('change', function () {
        const customStylesEnabled = elSettingsCustomStyles.checked;
        chrome.storage.sync.set({ enableCustomStyles: customStylesEnabled }, function () {
            console.log('Enable Custom Styling config updated to ' + customStylesEnabled);
            showCustomStyleConfigs(customStylesEnabled);
        });
    });
    defaultLyricsFontMap.forEach((value, key) => {
        const option = document.createElement('option');
        option.value = value;
        option.text = key;
        option.style.fontFamily = value
        elSettingsCustomFont.appendChild(option)
    });
});

function attachFooter() {
    const footer = document.getElementById('footer');
    const repoLinkContainer = document.createElement('p');
    repoLinkContainer.textContent = 'View on GitHub ';

    const link = document.createElement('a');
    link.href = manifestData.homepage_url;
    link.textContent = manifestData.name;
    link.target = '_blank'; //should open always in a new tab

    repoLinkContainer.appendChild(link);
    footer.appendChild(repoLinkContainer);
    const versionLine = document.createElement('p');
    versionLine.textContent = 'Version ' + manifestData.version_name;
    footer.appendChild(versionLine);
}
attachFooter();