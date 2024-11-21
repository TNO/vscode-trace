import { LoadFileForComparisonMessage, ReadExportPathMessage, ReadFileMessage } from "../interfaces";

export function isReadFileMessage(message: unknown): message is ReadFileMessage {
    return message !== null && 
        typeof(message) === "object" && 
        message['type'] === 'readFile';
}

export function isLoadFileForComparisonMessage(message: unknown): message is LoadFileForComparisonMessage {
    return message !== null && 
        typeof(message) === "object" && 
        message['type'] === 'loadFileForComparison';
}

export function isReadExportPathMessage(message: unknown): message is ReadExportPathMessage {
    return message !== null && 
        typeof(message) === "object" && 
        message['type'] === 'readExportPath';
}