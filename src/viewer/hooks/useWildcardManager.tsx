import React, { ReactNode } from "react";
import { wildcardStyle } from "./useStyleManager";
import { Wildcard, CellContents } from "../interfaces";

export const createWildcard = (
	structureEntryIndex: number,
	cellIndex: number,
	contentsIndex: number,
) => {
	const newWildcard: Wildcard = {
		wildcardSubstitutions: [
			{
				entryIndex: structureEntryIndex,
				cellIndex: cellIndex,
				contentsIndex: contentsIndex,
			},
		],
	};

	return newWildcard;
};

export const updateCellContentsIndices = (
	cellContents: CellContents[],
	startingIndex: number,
): CellContents[] => {
	let newIndex = startingIndex;
	const modifiedContents = cellContents;
	for (let i = 0; i < modifiedContents.length; i++) {
		modifiedContents[i].contentsIndex = newIndex;
		newIndex++;
	}

	return modifiedContents;
};

export const getIndicesForWildcardFromDivId = (divId: string): string[] => {
	const indicesForWildcard: string[] = [];
	const chars = divId.split("-");

	chars.map((val) => indicesForWildcard.push(val));

	return indicesForWildcard;
};

export const insertWildcardIntoCellsContents = (
	cellContents: CellContents[],
	wildcards: Wildcard[],
	structureEntryIndex: number,
	cellIndex: number,
	wildcardIndex: number,
	contentsIndex: number,
	startIndex: number,
	endIndex: number,
): {
	wildcards: Wildcard[];
	insertedWildcardContentsIndex: number;
	cellContents: CellContents[];
} => {
	let finalCellContents: CellContents[] = [];

	const contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
	const contentsAfterCurrent = cellContents.slice(contentsIndex + 1);

	const contentsToBeModified = cellContents[contentsIndex];
	const contentsToBeModifiedText = contentsToBeModified.textValue!;

	const isFirst = contentsBeforeCurrent.length === 0;
	const isLast = contentsAfterCurrent.length === 0;

	const cellContentsSplitResults = getCellContentsFromTextValue(
		contentsToBeModifiedText,
		wildcardIndex,
		contentsIndex,
		startIndex,
		endIndex,
	);

	if (!isFirst) finalCellContents.push(...contentsBeforeCurrent);

	finalCellContents.push(...cellContentsSplitResults.cellContents);

	if (!isLast) finalCellContents.push(...contentsAfterCurrent);

	wildcards.forEach((wildcard) => {
		const nrOfSteps = cellContentsSplitResults.cellContents.length - 1;

		for (let s = 0; s < wildcard.wildcardSubstitutions.length; s++) {
			if (
				wildcard.wildcardSubstitutions[s].entryIndex === structureEntryIndex &&
				wildcard.wildcardSubstitutions[s].cellIndex === cellIndex
			) {
				if (wildcard.wildcardSubstitutions[s].contentsIndex > contentsIndex) {
					wildcard.wildcardSubstitutions[s].contentsIndex =
						wildcard.wildcardSubstitutions[s].contentsIndex + nrOfSteps;
				}
			}
		}
	});

	finalCellContents = updateCellContentsIndices(finalCellContents, 0);

	return {
		wildcards: wildcards,
		insertedWildcardContentsIndex: cellContentsSplitResults.wildcardContentsIndex,
		cellContents: finalCellContents,
	};
};

const getCellContentsFromTextValue = (
	textValue: string,
	wildcardIndex: number,
	contentsIndex: number,
	startIndex: number,
	endIndex: number,
): { wildcardContentsIndex: number; cellContents: CellContents[] } => {
	const cellContents: CellContents[] = [];
	const chars = [...textValue];

	const stringBeforeWildcard = chars.slice(0, startIndex);
	const textToBeSubstitutedByWildcard = chars.slice(startIndex, endIndex);
	const stringAfterWildcard = chars.slice(endIndex);

	let textContentsAfterWildcard: CellContents;
	let newWildcardContentsIndex: number;

	if (stringBeforeWildcard.length > 0) {
		const textContentsBeforeWildcard = createCellContents(
			contentsIndex,
			stringBeforeWildcard.join(""),
			null,
		);
		cellContents.push(textContentsBeforeWildcard);

		newWildcardContentsIndex = contentsIndex + 1;
	} else {
		newWildcardContentsIndex = contentsIndex;
	}

	const wildcardContents = createCellContents(
		newWildcardContentsIndex,
		textToBeSubstitutedByWildcard.join(""),
		wildcardIndex,
	);
	cellContents.push(wildcardContents);

	if (stringAfterWildcard.length > 0) {
		textContentsAfterWildcard = createCellContents(
			newWildcardContentsIndex + 1,
			stringAfterWildcard.join(""),
			null,
		);
		cellContents.push(textContentsAfterWildcard);
	}

	return { wildcardContentsIndex: newWildcardContentsIndex, cellContents: cellContents };
};

export const removeWildcardSubstitution = (
	wildcards: Wildcard[],
	wildcardIndex: number,
	entryIndex: number,
	cellIndex: number,
	contentsIndex: number,
): { wildcards: Wildcard[]; isWildcardDeleted: boolean } => {
	let modifiedWildcards = wildcards;
	let isDeleted;

	const filteredSubstitutions = modifiedWildcards[wildcardIndex].wildcardSubstitutions.filter(
		(value) =>
			entryIndex !== value.entryIndex ||
			cellIndex !== value.cellIndex ||
			contentsIndex !== value.contentsIndex,
	);

	modifiedWildcards[wildcardIndex].wildcardSubstitutions = filteredSubstitutions;

	if (filteredSubstitutions.length === 0) {
		modifiedWildcards = modifiedWildcards.filter((_val, ind) => ind !== wildcardIndex);
		isDeleted = true;
	}

	return { wildcards: modifiedWildcards, isWildcardDeleted: isDeleted };
};

export const removeWildcardSubstitutionsForStructureEntry = (
	wildcards: Wildcard[],
	entryIndex: number,
): { modifiedWildcards: Wildcard[]; indicesOfWildcardsToBeRemoved: number[] } => {
	const modifiedWildcards: Wildcard[] = [];
	const indicesOfWildcardsToBeRemoved: number[] = [];

	wildcards.forEach((wildcard, ind) => {
		const wildcardSubstitutionsInOtherEntries = wildcard.wildcardSubstitutions.filter(
			(substitution) => substitution.entryIndex !== entryIndex,
		);

		if (wildcardSubstitutionsInOtherEntries.length !== 0) {
			modifiedWildcards.push({ wildcardSubstitutions: wildcardSubstitutionsInOtherEntries });
		} else {
			indicesOfWildcardsToBeRemoved.push(ind);
		}
	});
	return { modifiedWildcards, indicesOfWildcardsToBeRemoved };
};

export const removeWildcardFromCellContent = (
	cellContents: CellContents[],
	wildcards: Wildcard[],
	entryIndex: number,
	cellIndex: number,
	contentsIndex: number,
): { wildcards: Wildcard[]; cellContents: CellContents[] } => {
	let finalCellContents: CellContents[] = [];
	const contentsToBeRemoved = cellContents[contentsIndex];
	let nrOfSteps = 1;

	if (contentsIndex === 0) {
		let contentsAfterCurrent = cellContents.slice(contentsIndex + 1);

		if (contentsAfterCurrent.length !== 0) {
			contentsAfterCurrent[0].textValue =
				contentsToBeRemoved.textValue + contentsAfterCurrent[0].textValue;

			contentsAfterCurrent = updateCellContentsIndices(contentsAfterCurrent, 0);

			finalCellContents = contentsAfterCurrent;
		} else {
			finalCellContents.push({
				contentsIndex: 0,
				textValue: contentsToBeRemoved.textValue,
				wildcardIndex: null,
			});
		}
	} else if (contentsIndex === cellContents.length - 1) {
		const contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
		contentsBeforeCurrent[contentsIndex - 1].textValue =
			contentsBeforeCurrent[contentsIndex - 1].textValue + contentsToBeRemoved.textValue;

		finalCellContents = contentsBeforeCurrent;

		nrOfSteps = 0;
	} else {
		let contentsBeforeCurrent = cellContents.slice(0, contentsIndex);
		let contentsAfterCurrent = cellContents.slice(contentsIndex + 1);
		let newCellContents: CellContents[] = [];

		if (
			contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex !== null &&
			contentsAfterCurrent[0].wildcardIndex !== null
		) {
			// Both are wildcards
			contentsToBeRemoved.wildcardIndex = null;

			newCellContents.push(...contentsBeforeCurrent);
			newCellContents.push(contentsToBeRemoved);
			newCellContents.push(...contentsAfterCurrent);

			nrOfSteps = 0;
		} else if (
			contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex === null &&
			contentsAfterCurrent[0].wildcardIndex === null
		) {
			// Both are text
			const newContentsTextValue =
				contentsBeforeCurrent[contentsBeforeCurrent.length - 1].textValue +
				contentsToBeRemoved.textValue +
				contentsAfterCurrent[0].textValue;
			const newContents: CellContents = {
				contentsIndex: contentsBeforeCurrent.length - 1,
				textValue: newContentsTextValue,
				wildcardIndex: null,
			};

			contentsBeforeCurrent = cellContents.slice(0, newContents.contentsIndex);
			contentsAfterCurrent = cellContents.slice(newContents.contentsIndex + 3, cellContents.length);

			if (contentsBeforeCurrent.length !== 0)
				newCellContents = newCellContents.concat(contentsBeforeCurrent);

			newCellContents.push(newContents);

			if (contentsAfterCurrent.length !== 0)
				newCellContents = newCellContents.concat(contentsAfterCurrent);

			nrOfSteps = 2;
		} else if (
			contentsBeforeCurrent[contentsBeforeCurrent.length - 1].wildcardIndex === null &&
			contentsAfterCurrent[0].wildcardIndex !== null
		) {
			// Before is text, after is wildcard
			const newContentsTextValue =
				contentsBeforeCurrent[contentsBeforeCurrent.length - 1] + contentsToBeRemoved.textValue;
			const newContents: CellContents = {
				contentsIndex: contentsBeforeCurrent.length - 1,
				textValue: newContentsTextValue,
				wildcardIndex: null,
			};

			contentsBeforeCurrent = cellContents.slice(0, newContents.contentsIndex);

			if (contentsBeforeCurrent.length !== 0)
				newCellContents = newCellContents.concat(contentsBeforeCurrent);

			newCellContents.push(newContents);
			newCellContents = newCellContents.concat(contentsAfterCurrent);
		} else {
			// Before is wildcard, after is text
			const newContentsTextValue =
				contentsToBeRemoved.textValue + contentsAfterCurrent[0].textValue;
			const newContents: CellContents = {
				contentsIndex: contentsIndex,
				textValue: newContentsTextValue,
				wildcardIndex: null,
			};

			contentsAfterCurrent = cellContents.slice(newContents.contentsIndex);

			newCellContents = newCellContents.concat(contentsBeforeCurrent);
			newCellContents.push(newContents);

			if (contentsAfterCurrent.length !== 0)
				newCellContents = newCellContents.concat(contentsAfterCurrent);
		}

		newCellContents = updateCellContentsIndices(newCellContents, 0);
		finalCellContents = newCellContents;
	}

	wildcards.forEach((wildcard) => {
		for (let s = 0; s < wildcard.wildcardSubstitutions.length; s++) {
			if (
				wildcard.wildcardSubstitutions[s].entryIndex === entryIndex &&
				wildcard.wildcardSubstitutions[s].cellIndex === cellIndex
			) {
				if (wildcard.wildcardSubstitutions[s].contentsIndex > contentsIndex) {
					wildcard.wildcardSubstitutions[s].contentsIndex =
						wildcard.wildcardSubstitutions[s].contentsIndex - nrOfSteps;
				}
			}
		}
	});

	return { wildcards: wildcards, cellContents: finalCellContents };
};

export const createCellContents = (
	contentsIndex: number,
	textValue: string,
	wildcardIndex: number | null,
): CellContents => {
	const newCellContent: CellContents = {
		contentsIndex: contentsIndex,
		textValue: textValue,
		wildcardIndex: wildcardIndex,
	};

	return newCellContent;
};

export const getReactElementsFromCellContents = (
	entryIndex: number,
	cellIndex: number,
	contentsIndex: number,
	wildcardIndex: number | null,
	textValue: string | null,
): ReactNode => {
	if (wildcardIndex !== null) {
		return (
			<div
				key={`w-${entryIndex}-${cellIndex}-${contentsIndex}`}
				id={`w-${entryIndex}-${cellIndex}-${contentsIndex}`}
				style={wildcardStyle}
			>
				?{wildcardIndex + 1}
			</div>
		);
	} else {
		return (
			<div
				key={`t-${entryIndex}-${cellIndex}-${contentsIndex}`}
				id={`t-${entryIndex}-${cellIndex}-${contentsIndex}`}
			>
				{textValue}
			</div>
		);
	}
};

export const getWildcardIndex = (
	wildcards: Wildcard[],
	structureEntryIndex: number,
	cellIndex: number,
	contentsIndex: number,
) => {
	let wildcardIndex = -1;

	for (let w = 0; w < wildcards.length; w++) {
		const substitutions = wildcards[w].wildcardSubstitutions;

		for (let s = 0; s < substitutions.length; s++) {
			if (
				substitutions[s].entryIndex === structureEntryIndex &&
				substitutions[s].cellIndex === cellIndex &&
				substitutions[s].contentsIndex == contentsIndex
			) {
				wildcardIndex = w;
			}
		}
	}

	return wildcardIndex;
};

export const isSubstitutionFirstForWildcard = (
	wildcard: Wildcard,
	structureEntryIndex: number,
	cellIndex: number,
	contentsIndex: number,
): boolean => {
	let isSubstitutionFirst = false;
	let smallestStructureEntry,
		smallestcellIndex,
		smallestContentsIndex: number | null = null;

	wildcard.wildcardSubstitutions.forEach((substitution) => {
		if (smallestStructureEntry == null || smallestStructureEntry > substitution.entryIndex)
			smallestStructureEntry = substitution.entryIndex;
	});

	wildcard.wildcardSubstitutions.forEach((substitution) => {
		if (
			smallestcellIndex == null ||
			(smallestStructureEntry === structureEntryIndex && smallestcellIndex > substitution.cellIndex)
		)
			smallestcellIndex = substitution.cellIndex;
	});

	wildcard.wildcardSubstitutions.forEach((substitution) => {
		if (
			smallestContentsIndex == null ||
			(smallestStructureEntry === structureEntryIndex &&
				smallestcellIndex === substitution.cellIndex &&
				smallestContentsIndex > substitution.contentsIndex)
		)
			smallestContentsIndex = substitution.contentsIndex;
	});

	if (
		structureEntryIndex === smallestStructureEntry &&
		cellIndex === smallestcellIndex &&
		contentsIndex === smallestContentsIndex
	)
		isSubstitutionFirst = true;

	return isSubstitutionFirst;
};
