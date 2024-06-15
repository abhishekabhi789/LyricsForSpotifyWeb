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