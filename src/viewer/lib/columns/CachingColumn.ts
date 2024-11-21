import { CustomColumn } from "../../interfaces";
import { types } from "../../types";
import LogFile from "../LogFile";

export default class CachingColumn<T extends types.TracyLogData> implements CustomColumn<T> {

    header: string;
    getValuesFunction: (logFile: LogFile) => T[];
    values?: T[];

    constructor(header: string, getValuesFunction: (logFile: LogFile) => T[]) {
        this.header = header;
        this.getValuesFunction = getValuesFunction;
    }

    getValues(logFile: LogFile): T[] {
        if (!this.values) {
            this.values = this.getValuesFunction(logFile);
        }

        return this.values;
    }

}