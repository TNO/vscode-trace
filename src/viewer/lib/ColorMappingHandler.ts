import { scaleSequential } from "d3-scale";
import { interpolateTurbo } from "d3-scale-chromatic";
import { extent } from "d3-array";
import LogFile from "./LogFile";
import { containsOnlyNumericValues, getNumericValue } from "../hooks/useTracyLogData";
import { types } from "../types";

export default class ColorMappingHandler {

    private primaryColors: {[column: string]: string[]} = {};
    private comparisonColors: {[column: string]: string[]} = {};

    constructor() {
        this.getPrimaryColors = this.getPrimaryColors.bind(this);
        this.getComparisonColors = this.getComparisonColors.bind(this);
    }

    getPrimaryColors(column: string): string[] {
        return this.primaryColors[column];
    }

    getComparisonColors(column: string): string[] {
        return this.comparisonColors[column];
    }

    computeAllColors(logFile: LogFile, comparisonLogFile?: LogFile) {
        const headers = [
            ...logFile.getAllHeaders(),
            ...comparisonLogFile?.getAllHeaders() ?? []
        ];

        for (let i = 0; i < headers.length; i++) {
            this.computeColors(headers[i], logFile, comparisonLogFile);
        }
    }

    computeColors(header: string, logFile: LogFile, comparisonLogFile?: LogFile) {
        const logFileValues = logFile.values(header);
        const comparisonFileValues = comparisonLogFile?.values(header) ?? [];
        const allValues: types.TracyLogData[] = [
            ...logFileValues,
            ...comparisonFileValues
        ];

		if (containsOnlyNumericValues(allValues)) {
			const uniqueSorted = [...new Set(allValues)]
                .map(getNumericValue)
                .flatMap((n) => n === undefined ? [] : [n]) // Using flat map to prevent having to cast (number | undefined)[] to number[] after filtering out undefined.
                .sort(function (a, b) { return a - b; });

			const colorizer = scaleSequential().domain(extent(uniqueSorted) as [number, number]).interpolator(interpolateTurbo);
            this.primaryColors[header] = logFileValues.map((v) => colorizer(getNumericValue(v) ?? 0));
            this.comparisonColors[header] = comparisonFileValues.map((v) => colorizer(getNumericValue(v) ?? 0));
            return;
		}
        
		const uniqueValues = [...new Set(allValues)].sort();
		const colorizer = (v: types.TracyLogData) => interpolateTurbo(uniqueValues.indexOf(v) / uniqueValues.length);
        this.primaryColors[header] = logFileValues.map((v) => colorizer(v));
        this.comparisonColors[header] = comparisonFileValues.map((v) => colorizer(v));
    }

}