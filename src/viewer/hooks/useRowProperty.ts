import { RowProperty, Segment } from "../interfaces";

export const maximumSegmentation = 4;

export function isSelected(rowProperty: RowProperty) {
	return rowProperty.isSelected;
}

export const constructNewSegment = (start: number, end: number, level: number) => {
	const newSegment: Segment = { start, end, level };
	return newSegment;
};

export const getSegmentMaxLevel = (segments: { [key: number]: Segment }) => {
	const levels = Object.values(segments).map((segment) => segment.level);
	if (levels !== undefined && levels.length > 0) {
		return Math.min(maximumSegmentation, Math.max(...levels));
	} else {
		return -1;
	}
};

export const getSegment = (segments: Segment[], start: number) => {
	return segments.map((segment) => {
		if (segment.start == start) {
			return segment;
		}
	});
};

export function createDefaultRowProperties(n: number): RowProperty[] {
	let rowProperties: RowProperty[] = [];

	for (let i = 0; i < n; i++) {
		rowProperties.push(createDefaultRowProperty(i));
	}

	return rowProperties;
}

export function createDefaultRowProperty(index: number): RowProperty {
    return {
		index,
        isRendered: true,
        isSelected: false,
        isQueried: false,
		isHighlighted: false
    };
}