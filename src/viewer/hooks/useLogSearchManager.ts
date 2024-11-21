import { logDataToString } from "./useTracyLogData";
import { LogEntryCharMaps } from "../interfaces";
import { types } from "../types";

export const escapeSpecialChars = (text: string): string => {
    let safeText = "";

    if (text !== undefined) {
        safeText = text.replace(/[\\]/g, "\\\\\\$&"); //double escaped slashes
        safeText = safeText.replace(/[\.\*\+\?\^\$\{\}\(\)\|\[\]\-]/g, "\\$&"); // replace special characters
        safeText = safeText.replace(/[\"]/g, "\\\\$&"); //double quotes
    }

    const regExpCarriageReturnAtEnd = /\r$/;

    if (regExpCarriageReturnAtEnd.test(text)) {
        safeText = safeText.replace(regExpCarriageReturnAtEnd, "\\\\r");
    }

    return safeText;
};

const getLogLine = (
    logData: types.TracyLogData[] | types.TracyLogData,
    caseSearchBool: boolean
): string => {
    var logText: string;
    if (Array.isArray(logData)) {
        logText = logData.join(" ");
    } else {
        logText = logDataToString(logData);
    }

    if (!caseSearchBool) {
        logText = logText.toLocaleLowerCase();
    }

    return logText;
}

const matchesSearchQuery = (
    logData: types.TracyLogData[] | types.TracyLogData,
    searchText: string,
    reSearchBool: boolean,
    wholeSearchBool: boolean,
    caseSearchBool: boolean,
): boolean => {
    let logLine = getLogLine(logData, caseSearchBool);

    if (reSearchBool) {
        let flags = caseSearchBool ? "gs" : "gsi";
        
        if (wholeSearchBool)
            searchText = "\\b" + searchText + "\\b";
        
        return useRegularExpressionSearch(flags, searchText, logLine);
    }

    if (wholeSearchBool) {
        return matchWholeString(logLine, searchText);
    }

    return logLine.indexOf(searchText) !== -1;
}

export const returnSearchIndices = (
    logData: types.TracyLogData[][] | types.TracyLogData[],
    searchText: string,
    reSearchBool: boolean,
    wholeSearchBool: boolean,
    caseSearchBool: boolean,
): number[] => {
    if (!caseSearchBool && !reSearchBool) searchText = searchText.toLowerCase();
    return logData.map((data) => matchesSearchQuery(data, searchText, reSearchBool, wholeSearchBool, caseSearchBool))
        .flatMap((match, i) => match ? [i] : []);
};

export const useRegularExpressionSearch = (
    flags: string,
    expression: string,
    text: string,
): boolean => {
    const structureQuery = new RegExp(expression, flags);
    const result = structureQuery.exec(escapeSpecialChars(text));
    if (result === null) return false;
    else return true;
};

export const getRegularExpressionMatches = (
    expression: string,
    logFileAsString: string,
    logEntryCharRanges: LogEntryCharMaps,
): number[] => {
    const searchIndices: number[] = [];
    const resultingMatches: number[] = [];
    const flags = "gs";
    const query = new RegExp(expression, flags);
    let result;

    while ((result = query.exec(logFileAsString)) !== null) {
        searchIndices.push(result.index);
    }

    if (searchIndices.length > 0) {
        searchIndices.forEach((searchIndex) => {

            const indexOfMatchedEntry = logEntryCharRanges.firstCharIndexMap.get(searchIndex);

            if (indexOfMatchedEntry)
                resultingMatches.push(indexOfMatchedEntry);
        });
    }

    return resultingMatches;
};



function matchWholeString(text: any, searchText: any) {
    if (text.indexOf(' ' + searchText + ' ') != -1)
        return true
    else if (text.indexOf(searchText + ' ') == 0)
        return true
    else if (text.indexOf(' ' + searchText) == (text.length - (searchText.length + 1)))
        return true
    else if (text === searchText)
        return true
    return false
}
