export type TracyLogData = string | number | boolean | null | undefined;

export default interface TracyLogFile {
    filePath: string;
    headers: string[];
    rows: TracyLogData[][];
    dateTimeIndex?: number;
}