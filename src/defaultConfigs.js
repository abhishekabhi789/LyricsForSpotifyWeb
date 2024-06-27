// default style configurations
const allLyricsDefaultStyle =
    ['transition: all .4s ease-in-out;',
        'font-size: 1.5rem;',
        'line-height: 2.4em;',
        'cursor: pointer;'].join('\n');
const passedLDefaultStyles = ['color: rgba(255, 255, 255, 0.85);'].join('\n');
const activeLDefaultStyles = ['font-size: 1.6rem;',
    'text-shadow: 2px 2px 4px black;',
    'color: var(--lyrics-color-active);'].join('\n');
const inactiveLDefaultStyles = ['color: rgba(255, 255, 255, 0.5);'].join('\n');

// default fonts
const defaultLyricsFontMap = new Map([
    //[FONT DISPLAY NAME, VALUE STRING]
    ["Arial (Default)", "Arial, sans-serif"],
    ["Times New Roman", "'Times New Roman', serif"],
    ["Georgia", "Georgia, serif"],
    ["Palatino", "Palatino, 'Palatino Linotype', serif"],
    ["Garamond", "Garamond, serif"],
    ["Verdana", "Verdana, sans-serif"],
    ["Tahoma", "Tahoma, sans-serif"],
    ["Trebuchet MS", "'Trebuchet MS', sans-serif"],
    ["Segoe UI", "'Segoe UI', sans-serif"],
    ["Calibri", "Calibri, sans-serif"],
    ["Lucida Sans", "'Lucida Sans', sans-serif"],
    ["Courier New (monospace)", "'Courier New', monospace"],
    ["Comic Sans", "'Comic Sans MS'"],
    ["Brush Script MT (cursive)", "'Brush Script MT', cursive"],
    ["Lucida Handwriting (cursive)", "'Lucida Handwriting', cursive"],
    ["Copperplate (fantasy)", "Copperplate, fantasy"],
    ["Papyrus (fantasy)", "Papyrus, fantasy"]
]);
