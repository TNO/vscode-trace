import LogFile from "../lib/LogFile";
import { LogFileData } from "../interfaces";
import Rule from "../rules/Rule";
import LineNumberingColumn from "../lib/columns/LineNumberingColumn";
import { types } from "../types";
import { logDataToString } from "./useTracyLogData";

export function createEmptyLogFile(): LogFile {
    const fileData: LogFileData = {
        filePath: '',
        headers: [],
        rows: []
    }
    return new LogFile(fileData);
}

export function createLogFile(
    data: LogFileData,
    rules: Rule[]
): LogFile {
    const { rows, dateTimeIndex } = data;
    let parsedRows: types.TracyLogData[][] = rows;
    if (dateTimeIndex !== undefined) {
        parsedRows = rows.map((row) => {
            let value = row[dateTimeIndex];
            if (typeof(value) === 'string') {
                if (!value.includes('Z')) {
                    value = value + 'Z';
                }
                const date = new Date(value);

                // If date time is not a number, date-time string is not valid.
                if (!isNaN(date.getTime())) {
                    row[dateTimeIndex] = date;
                }
            }
            return row;
        });
    }

    const parsedData: LogFileData = { ...data, rows: parsedRows}
    const logFile = new LogFile(parsedData);
    logFile.registerCustomColumn(new LineNumberingColumn());
    return logFile.updateLogFile(rules);
}

export function toExportData(logFile: LogFile, exportIndices?: number[]): {[key: string]: string}[] {
    if (exportIndices === undefined) {
		exportIndices = Array.from(Array(logFile.amountOfRows()).keys());
    }

	var exportData: {[key: string]: string}[] = []
	const originalColumns = logFile.getAllHeaders();

	for (var index of exportIndices) {
		var rowObject: {[key: string]: string} = {};
		const row = logFile.getRow(index);
		for (var columnIndex = 0; columnIndex <= originalColumns.length - 1; columnIndex++) {
			if (logFile.customColumns[originalColumns[columnIndex]]?.exportable !== false) {
				rowObject[originalColumns[columnIndex]] = logDataToString(row[columnIndex]);
			}
		}
		exportData.push(rowObject);
	}

    return exportData;
}

export function toStructureData(logFile: LogFile): {[key: string]: string}[] {
	var exportData: {[key: string]: string}[] = []
	const originalColumns = logFile.getAllHeaders();

	for (var i = 0; i < logFile.amountOfRows(); i++) {
		var rowObject: {[key: string]: string} = {};
		const row = logFile.getRow(i);
		for (var columnIndex = 0; columnIndex < originalColumns.length; columnIndex++) {
            rowObject[originalColumns[columnIndex]] = logDataToString(row[columnIndex]);
		}
		exportData.push(rowObject);
	}

    return exportData;
}

export function toDataGrid(logFile: LogFile): types.TracyLogData[][] {
    const rows: types.TracyLogData[][] = [];

	for (var i = 0; i < logFile.amountOfRows(); i++) {
		rows.push(logFile.getRow(i));
	}

    return rows;
}