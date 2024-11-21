import TracyLogFile from "./TracyLogFile";

export default interface TracyConverter {
    name: string;
    fileExtentions: string[];
    parseLogFile: (filePath: string) => Promise<TracyLogFile>;
    parseLog: (filePath: string, content: string) => Promise<TracyLogFile>;
}