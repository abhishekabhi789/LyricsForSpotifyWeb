const manifestData = chrome.runtime.getManifest();
document.addEventListener('DOMContentLoaded', function () {
    const elSettingsRemoveBg = document.getElementById('removeBackground');
    const elSettingsCustomFont = document.getElementById('lyricsFont');
    const elSettingsEnableLogging = document.getElementById('enableLogging');
    const elSettingsEnableExtension = document.getElementById('enableExtension');

    chrome.storage.sync.get(['removeBackground', 'lyricsFont', 'enableLogging', 'enableExtension'], function (result) {
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
        if (result.lyricsFont != undefined) {
            elSettingsCustomFont.value = result.lyricsFont;
        }
        if (result.enableLogging != undefined) {
            elSettingsEnableLogging.checked = result.enableLogging;
        } else {
            elSettingsEnableLogging.checked = false;
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
    elSettingsCustomFont.addEventListener('change', function () {
        chrome.storage.sync.set({ lyricsFont: elSettingsCustomFont.value }, function () {
            console.log('Custom font config updated to ' + elSettingsCustomFont.value);
        });
    });
    elSettingsEnableLogging.addEventListener('change', function () {
        chrome.storage.sync.set({ enableLogging: elSettingsEnableLogging.checked }, function () {
            console.log('Enable Logging config updated to ' + elSettingsEnableLogging.checked);
        });
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
    versionLine.textContent = 'Version '+manifestData.version_name;
    footer.appendChild(versionLine);
}
attachFooter();