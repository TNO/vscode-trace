import { LogEntryCharMaps } from "../types";

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

// Long function to reduce number of checks
export const returnSearchIndices = (
    rows: string[][],
    columnIndex: number,
    searchText: string,
    reSearchBool: boolean,
    wholeSearchBool: boolean,
    caseSearchBool: boolean,
): number[] => {
    let loglineText: string;
    const indices: number[] = [];
    if (!caseSearchBool && !reSearchBool) searchText = searchText.toLowerCase();
    if (!reSearchBool) {
        if (!wholeSearchBool) {
            if (columnIndex === -1) {
                if (!caseSearchBool) {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i].join(" ").toLowerCase();
                        if (loglineText.indexOf(searchText) != -1)
                            indices.push(i);
                    }
                } else {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i].join(" ");
                        if (loglineText.indexOf(searchText) != -1)
                            indices.push(i);
                    }
                }
            } else {
                if (!caseSearchBool) {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i][columnIndex].toLowerCase();
                        if (loglineText.indexOf(searchText) != -1)
                            indices.push(i);
                    }
                } else {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i][columnIndex];
                        if (loglineText.indexOf(searchText) != -1)
                            indices.push(i);
                    }
                }
            }
        }
        else {
            if (columnIndex === -1) {
                if (!caseSearchBool) {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i].join(" ").toLowerCase();
                        if (matchWholeString(loglineText, searchText))
                            indices.push(i);
                    }
                } else {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i].join(" ");
                        if (matchWholeString(loglineText, searchText))
                            indices.push(i);
                    }
                }
            } else {
                if (!caseSearchBool) {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i][columnIndex].toLowerCase();
                        if (matchWholeString(loglineText, searchText))
                            indices.push(i);
                    }
                } else {
                    for (let i = 0; i < rows.length; i++) {
                        loglineText = rows[i][columnIndex];
                        if (matchWholeString(loglineText, searchText))
                            indices.push(i);
                    }
                }
            }
        }
    } else {
        let flags: string;
        if (!caseSearchBool) flags = "gsi";
        else flags = "gs";
        if (wholeSearchBool)
            searchText = "\\b" + searchText + "\\b";
        if (columnIndex === -1) {
            for (let i = 0; i < rows.length; i++) {
                loglineText = rows[i].join(" ");
                if (useRegularExpressionSearch(flags, searchText, loglineText))
                    indices.push(i);
            }
        } else {
            for (let i = 0; i < rows.length; i++) {
                loglineText = rows[i][columnIndex];
                if (useRegularExpressionSearch(flags, searchText, loglineText))
                    indices.push(i);
            }
        }
    }
    return indices;
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
