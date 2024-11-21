import LogViewAndMinimap from "../../components/LogViewAndMinimap";
import { isSelected } from "../../hooks/useRowProperty";
import { isNullUndefined } from "../../hooks/useTracyLogData";
import { CustomColumn, CustomDisplayString } from "../../interfaces";
import LogFile from "../LogFile";

export const HEADER = 'Relative Time';

export default class RelativeTimeColumn implements CustomColumn<CustomDisplayString> {

    header = HEADER;
    alignment: "left" | "right" = 'left';
    exportable = false;
	showInLogView?: boolean;
	showInMinimap?: boolean;
    
    startingRow: number;
    values?: CustomDisplayString[];
    
    constructor(showInLogView?: boolean, showInMinimap?: boolean) {
        this.showInLogView = showInLogView;
        this.showInMinimap = showInMinimap;
        this.startingRow = 0;
    }

    getValues(logFile: LogFile): CustomDisplayString[] {
        if (!this.values) {
            this.values = getRelativeTimestamps(logFile, this.startingRow);
        }

        return this.values;
    }

}

export function handleSetStartingPoint(logViewAndMinimap: LogViewAndMinimap): boolean {
    const column = logViewAndMinimap.props.logFile.customColumns[HEADER];
    if (!(column instanceof RelativeTimeColumn)) {
        return false;
    }

    const selectedCount = logViewAndMinimap.state.rowProperties.filter(isSelected).length;
    const selected = logViewAndMinimap.state.rowProperties.findIndex(isSelected);
    if (selectedCount !== 1 || selected === -1) {
        return false;
    }
    
    column.startingRow = selected;
    column.values = undefined; // Values set to undefines to regenerate them the next time they are requested.
    logViewAndMinimap.clearSelection();
    return true;
}

function getRelativeTimestamps(logFile: LogFile, startingRow: number) {
    if (logFile.isEmpty()) {
        return [];
    }

    const dateTimeColumn = logFile.dateTimeColumn();
    if (dateTimeColumn === undefined) {
        return [];
    }

    const dateTimeValues = logFile.values(dateTimeColumn);
    if (isNullUndefined(dateTimeValues[startingRow])) {
        return [];
    }
    
    const startDateTime = (dateTimeValues[startingRow] as Date).getTime();

    return dateTimeValues
        .map((d) => d instanceof Date ? d.getTime() - startDateTime : undefined)
        .map((t) => ({
            value: t,
            display: t !== undefined ? getTimeDuration(t) : ''
        }));
}

function getTimeDuration(miliseconds: number): string {
    const negative = miliseconds < 0;
    miliseconds = Math.abs(miliseconds);
    let seconds = Math.floor(miliseconds/1000);
    let minutes = Math.floor(seconds/60);
    let hours = Math.floor(minutes/60);

    miliseconds -= seconds * 1000;
    seconds -= minutes * 60;
    minutes -= hours * 60;

    return `${negative ? '-' : ''}${hours}:${numToString(minutes, 2)}:${numToString(seconds, 2)}.${numToString(miliseconds, 3)}`
}

function numToString(num: number, digits: number) {
    return String(num).padStart(digits, '0');
}