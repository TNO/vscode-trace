import { ColumnSelection } from "../interfaces";
import LogFile from "../lib/LogFile";

// Display priority: columnSelection, default value of custom column, def, true
export function isColumnVisibleLogView(header: string, logFile: LogFile, columnSelection: ColumnSelection, def: boolean = true) {
    return columnSelection[header]?.logView ?? logFile.customColumns[header]?.showInLogView ?? def;
}

// Display priority: columnSelection, default value of custom column, def, true
export function isColumnVisibleMinimap(header: string, logFile: LogFile, columnSelection: ColumnSelection, def: boolean = true) {
    return columnSelection[header]?.miniMap ?? logFile.customColumns[header]?.showInMinimap ?? def;
}

// Display priority: columnSelection, default value of custom column, def, true
export function getVisibleColumnsLogView(logFile: LogFile, columnSelection: ColumnSelection, def: boolean = true) {
    return logFile.getAllHeaders()
        .filter((h) => isColumnVisibleLogView(h, logFile, columnSelection));
}

// Display priority: columnSelection, default value of custom column, def, true
export function getVisibleColumnsMinimap(logFile: LogFile, columnSelection: ColumnSelection, def: boolean = true) {
    return logFile.getAllHeaders()
        .filter((h) => isColumnVisibleMinimap(h, logFile, columnSelection));
}