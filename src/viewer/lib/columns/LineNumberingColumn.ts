import CachingColumn from "./CachingColumn";

export default class LineNumberingColumn extends CachingColumn<number> {

    alignment: "left" | "right" = 'left';
    toggleable: boolean = false;
    showInMinimap: boolean = false;
    width = 30;
    exportable = false;

    constructor() {
        super('#', (logFile) => Array.from({length: logFile.amountOfRows()}, (_, i) => i + 1));
    }
    
}