import { CustomDisplayString } from "../interfaces";
import { types } from "../types";

export function logDataToString(data: types.TracyLogData): string {
    if (data === undefined || data === null) {
        return '';
    } else if (typeof(data) === 'string') {
        return data;
    } else if (data instanceof Date) {
        return data.toISOString();
    } else if (isCustomDisplayString(data)) {
        return data.display;
    } else {
        return String(data);
    }
}

export function isNumericNullOrUndefined(item: types.TracyLogData): boolean {
    return isNumeric(item) || isNullUndefined(item);
}

export function isNumeric(item: types.TracyLogData): boolean {
    return typeof(item) === 'number' || item instanceof Date || isCustomDisplayString(item) && isNumericNullOrUndefined(item.value);
}

export function isNullUndefined(item: types.TracyLogData): boolean {
    return item === null || item === undefined || item === '';
}

export function isCustomDisplayString(item: types.TracyLogData): item is CustomDisplayString {
    return item instanceof Object && 'value' in item && 'display' in item;
}

export function getNumericValue(item: types.TracyLogData): number | undefined {
    if (typeof(item) === 'number') {
        return item;
    }
    if (item instanceof Date) {
        return item.getTime();
    }
    if (isCustomDisplayString(item)) {
        return getNumericValue(item.value);
    }
}

export function containsOnlyNumericValues(items: types.TracyLogData[]): boolean {
    return !items.some((i) => !isNumericNullOrUndefined(i));
}