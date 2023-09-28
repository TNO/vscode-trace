import { CellContents, Header, LogEntryCharMaps, StructureEntry, Wildcard } from "../types";
import { StructureHeaderColumnType, StructureLinkDistance } from "../constants";
import { isSubstitutionFirstForWildcard } from "./useWildcardManager";

const regExpAnyCharMin = ".+?";
const regExpAnyCharMax = ".+";
const regExpLineFeed = "\\n";
const regExpTimeStampPattern = "[A-Za-z0-9 ,:_=@|*+.\\(\\)\\[\\]\\/\\-]*?";
const regExpValuePattern = "[A-Za-z0-9 ,:;~`'\"_=@#%&|!$^*+<>?.{}()\\[\\]\\/\\\\-]*?";
const regExpjsonObject = "{.+?},?\\n";
const flags = "gs";

const getRegExpExactWhiteSpace = (amountOfWhitespace: number): string =>
    `\\s{${amountOfWhitespace}}`;

const escapeSpecialChars = (text: string): string => {
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

const getLineEndString = (amountOfWhiteSpace: number): string => {
    return regExpLineFeed + getRegExpExactWhiteSpace(amountOfWhiteSpace);
};

function getHeaderValue(text: string) {
    let headerValue = text;
    const regExpCarriageReturnAtEnd = /\r$/;

    if (regExpCarriageReturnAtEnd.test(headerValue))
        headerValue = headerValue.replace(regExpCarriageReturnAtEnd, "\\\\r");

    headerValue = `"${headerValue}"`;

    return headerValue;
}

const getCellValue = (
    content: CellContents[],
    rowIndex: number,
    cellIndex: number,
    header: Header,
    headerColumnType: StructureHeaderColumnType,
    isSelected: boolean,
    wildcards: Wildcard[],
): string => {
    let value: string;

    if (isSelected && headerColumnType !== StructureHeaderColumnType.Custom) {
        if (content[0].textValue == null) value = "null";
        else {
            const valueParts: string[] = [];

            for (let i = 0; i < content.length; i++) {
                if (content[i].wildcardIndex == null) {
                    valueParts.push(`${escapeSpecialChars(content[i].textValue)}`);
                } else {
                    const isFirstSubstitution = isSubstitutionFirstForWildcard(
                        wildcards[content[i].wildcardIndex!],
                        rowIndex,
                        cellIndex,
                        i,
                    );

                    if (isFirstSubstitution) {
                        valueParts.push(`(?<c${content[i].wildcardIndex!}>${regExpValuePattern})`);
                    } else {
                        valueParts.push(`\\k<c${content[i].wildcardIndex!}>`);
                    }
                }
            }

            value = '"' + valueParts.join("") + '"';
        }
    } else {
        value =
            header.name.toLowerCase() === "timestamp"
                ? `"${regExpTimeStampPattern}"`
                : `"${regExpValuePattern}"`;
    }

    return value;
};

const getRegExpForLogEntry = (
    logHeaders: Header[],
    headerTypes: StructureHeaderColumnType[],
    row: CellContents[][],
    rowIndex: number,
    cellSelection: boolean[],
    wildcards: Wildcard[],
): string => {
    let objectString = "{" + getLineEndString(4);
    let rowString = "";
    let hasProcessedLastUsableColumn = false;

    for (let c = row.length - 1; c >= 0; c--) {

        const headerString = getHeaderValue(logHeaders[c].name);

        const headerType = headerTypes[c];
        const isCellSelected = cellSelection[c];

        if (headerType !== StructureHeaderColumnType.Custom && row[c] !== undefined) {
            let valueString = getCellValue(
                row[c],
                rowIndex,
                c,
                logHeaders[c],
                headerType,
                isCellSelected,
                wildcards,
            );
            let headerAndCellString = "";

            if (hasProcessedLastUsableColumn) {
                valueString = valueString.concat(",");
                headerAndCellString = headerAndCellString.concat(
                    headerString,
                    ": ",
                    valueString,
                    getLineEndString(4),
                );
            } else {
                headerAndCellString = headerAndCellString.concat(
                    headerString,
                    ": ",
                    valueString,
                    getLineEndString(2),
                );
            }

            rowString = headerAndCellString.concat(rowString);

            hasProcessedLastUsableColumn = true;
        }
    }

    objectString = objectString.concat(rowString, "},?", regExpLineFeed);

    return objectString;
};

export const useStructureQueryConstructor = (
    logHeaders: Header[],
    headerColumnTypes: StructureHeaderColumnType[],
    structureEntries: StructureEntry[],
    wildcards: Wildcard[],
): string => {
    let regularExp = "";

    for (let r = 0; r < structureEntries.length; r++) {
        const structureEntry = structureEntries[r];

        const rowRegExp = getRegExpForLogEntry(
            logHeaders,
            headerColumnTypes,
            structureEntry.row,
            r,
            structureEntry.cellSelection,
            wildcards,
        );
        regularExp = regularExp.concat(rowRegExp);

        if (structureEntry.structureLink !== undefined) {
            let structureLinkRegExp = "";

            switch (structureEntry.structureLink) {
                case StructureLinkDistance.None:
                    structureLinkRegExp = getRegExpExactWhiteSpace(2);
                    break;
                case StructureLinkDistance.Min:
                    structureLinkRegExp = regExpAnyCharMin;
                    break;
                case StructureLinkDistance.Max:
                    structureLinkRegExp = regExpAnyCharMax;
                    break;
            }

            regularExp = regularExp.concat(structureLinkRegExp);
        }
    }

    return regularExp;
};

export const useGetCharIndicesForLogEntries = (logFileAsString: string): LogEntryCharMaps => {
    const perfStart = performance.now();
    const jsonObjectsRegExp = new RegExp(regExpjsonObject, flags);
    const firstCharIndexMap = new Map();
    const lastCharIndexMap = new Map();
    let logEntryIndex = 0;

    let result = jsonObjectsRegExp.exec(logFileAsString);

    if (result !== null) {
        do {
            firstCharIndexMap.set(result.index, logEntryIndex);
            lastCharIndexMap.set(jsonObjectsRegExp.lastIndex, logEntryIndex);
            logEntryIndex++;
        } while ((result = jsonObjectsRegExp.exec(logFileAsString)) !== null);
    }

    const perfEnd = performance.now();
    console.log(`Execution time (mapLogFileTextIndicesToObject()): ${perfEnd - perfStart} ms`);

    return { firstCharIndexMap: firstCharIndexMap, lastCharIndexMap: lastCharIndexMap };
};

export const useStructureRegularExpressionSearch = (
    expression: string,
    logFileAsString: string,
    logEntryCharIndexMaps: LogEntryCharMaps,
): number[][] => {
    console.log("Starting Structure Matching");
    const perfStart = performance.now();
    const textRanges: number[][] = [];
    const resultingMatches: number[][] = [];
    const structureQuery = new RegExp(expression, flags);
    let result;

    while ((result = structureQuery.exec(logFileAsString)) !== null) {
        textRanges.push([result.index, structureQuery.lastIndex]);
    }

    const perfEnd = performance.now();
    console.log(`Execution time (regular expression run): ${perfEnd - perfStart} ms`);

    console.log(textRanges);

    const transStart = performance.now();

    textRanges.forEach((matchRanges) => {
        const indexesOfEntriesInMatch: number[] = [];

        const indexOfFirstObjectInMatch = logEntryCharIndexMaps.firstCharIndexMap.get(matchRanges[0]);
        const indexOfLastObjectInMatch = logEntryCharIndexMaps.lastCharIndexMap.get(matchRanges[1]);

        if (indexOfFirstObjectInMatch && indexOfLastObjectInMatch) {

            for (let i = indexOfFirstObjectInMatch; i <= indexOfLastObjectInMatch; i++) {
                indexesOfEntriesInMatch.push(i);
            }

            resultingMatches.push(indexesOfEntriesInMatch);
        }
    });

    const transEnd = performance.now();
    console.log(`Execution time (translation from char indices to logFile.rows indices): ${transEnd - transStart} ms`);

    return resultingMatches;
};