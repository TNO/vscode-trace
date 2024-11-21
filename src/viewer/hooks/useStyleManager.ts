import { constants } from "../constants";
import { RowProperty, StructureEntry } from "../interfaces";

const getLogViewRowStyle = (viewIndex: number, leftPadding: number): React.CSSProperties => {
	const rowStyle: React.CSSProperties = {
		left: leftPadding,
		position: "absolute",
		height: constants.LOG_ROW_HEIGHT,
		overflow: "hidden",
		top: viewIndex * constants.LOG_ROW_HEIGHT,
		userSelect: "text",
		borderRadius: "5px",
	};

	return rowStyle;
};

export const structureDialogBackdropStyle: React.CSSProperties = {
	bottom: "10px",
	width: "100%",
	backgroundColor: "#00000030",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
	overflow: "visible",
};

export const structureDialogDialogStyle: React.CSSProperties = {
	width: "98%",
	padding: "10px",
	display: "flex",
	flexDirection: "column",
	overflow: "scroll",
};

export const wildcardStyle: React.CSSProperties = {
	border: "1px solid",
	borderRadius: "2px",
	userSelect: "none",
};

export const getStructureTableHeaderStyle = (containerWidth: number): React.CSSProperties => {
	const headerStyle: React.CSSProperties = {
		width: containerWidth,
		height: constants.LOG_HEADER_HEIGHT,
		position: "relative",
		userSelect: "none",
		left: constants.STRUCTURE_WIDTH,
		display: "flex",
	};

	return headerStyle;
};

export const getHeaderColumnStyle = (
	columnWidth: number,
	height: number,
): React.CSSProperties => {
	const headerColumnStyle: React.CSSProperties = {
		overflow: "hidden",
		whiteSpace: "nowrap",
		display: "inline-block",
		height,
		width: columnWidth,
	};

	return headerColumnStyle;
};

export const getSegmentStyle = (columnWidth: number, height: number): React.CSSProperties => {
	const headerColumnStyle: React.CSSProperties = {
		overflow: "hidden",
		whiteSpace: "nowrap",
		display: "inline-block",
		height,
		width: columnWidth,
		position: "sticky",
		left: 0,
	};

	return headerColumnStyle;
};

export const getSegmentRowStyle = (segmentWidth: number, top: number): React.CSSProperties => {
	const segmentRowStyle: React.CSSProperties = {
		position: "absolute",
		height: constants.LOG_ROW_HEIGHT,
		top: top,
		width: segmentWidth,
	}
	return segmentRowStyle;
}
export const getHeaderColumnInnerStyle = (
	height: number,
	isHeader: boolean,
): React.CSSProperties => {
	const headerColumnInnerStyle: React.CSSProperties = {
		display: "flex",
		height,
		alignItems: "center",
		justifyContent: isHeader ? "center" : "left",
		paddingLeft: "2px",
		borderRight: constants.BORDER,
	};

	return headerColumnInnerStyle;
};

export const getStructureTableEntryIconStyle = (
	isRemovingStructureEntries: boolean,
): React.CSSProperties => {
	const structureEntryIconStyle: React.CSSProperties = {
		width: constants.STRUCTURE_WIDTH,
		height: constants.LOG_ROW_HEIGHT,
		display: "inline-block",
		verticalAlign: "top",
		textAlign: "center",
		lineHeight: `${constants.LOG_ROW_HEIGHT}px`,
		color: isRemovingStructureEntries ? "red" : "",
	};

	return structureEntryIconStyle;
};

export const getStructureTableRowStyle = (
	rowIndex: number,
	structureLinkIndex: number,
): React.CSSProperties => {
	const rowStyle: React.CSSProperties = {
		position: "absolute",
		height: constants.LOG_ROW_HEIGHT,
		top: rowIndex * constants.LOG_ROW_HEIGHT + structureLinkIndex * constants.STRUCTURE_LINK_HEIGHT,
		overflow: "hidden",
	};

	return rowStyle;
};

export const getStructureTableLinkStyle = (
	rowIndex: number,
	structureLinkIndex: number,
): React.CSSProperties => {
	const structureLinkStyle: React.CSSProperties = {
		position: "absolute",
		height: constants.STRUCTURE_LINK_HEIGHT,
		top: (rowIndex + 1) * constants.LOG_ROW_HEIGHT + structureLinkIndex * constants.STRUCTURE_LINK_HEIGHT,
		overflow: "hidden",
		userSelect: "none",
		width: constants.STRUCTURE_WIDTH,
		textAlign: "center",
	};

	return structureLinkStyle;
};

export const getStructureTableColumnStyle = (
	columnWidth: number,
	columnIndex: number,
): React.CSSProperties => {
	const columnStyle: React.CSSProperties = {
		overflow: "hidden",
		whiteSpace: "nowrap",
		display: "inline-block",
		height: constants.LOG_ROW_HEIGHT,
		width: columnWidth,
		verticalAlign: "top",
		borderLeft: columnIndex !== 0 ? constants.BORDER : "",
		borderTop: constants.BORDER,
		borderBottom: constants.BORDER,
	};

	return columnStyle;
};

export const getStructureTableCellSelectionStyle = (
	structureEntries: StructureEntry[],
	rowIndex: number,
	cellIndex: number,
): React.CSSProperties => {
	let cellSelectionStyle: React.CSSProperties;

	if (!structureEntries[rowIndex].cellSelection[cellIndex]) {
		cellSelectionStyle = {
			display: "flex",
			height: constants.LOG_ROW_HEIGHT,
			alignItems: "center",
			justifyContent: "left",
			paddingLeft: "2px",
			color: "var(--vscode-titleBar-inactiveForeground)",
			background:
				"repeating-linear-gradient(-55deg, #222222b3, #222222b3 10px, #333333b3 10px, #333333b3 20px)",
			userSelect: "none",
		};
	} else {
		cellSelectionStyle = {
			display: "flex",
			height: constants.LOG_ROW_HEIGHT,
			alignItems: "center",
			justifyContent: "left",
			paddingLeft: "2px",
			backgroundColor: "transparent",
			userSelect: "text",
		};
	}

	return cellSelectionStyle;
};

export const getLogViewRowSelectionStyle = (
	rowProperties: RowProperty,
	viewIndex: number
): React.CSSProperties => {
	let rowSelectionStyle: React.CSSProperties = {};

	// Row selection has priority over search results
	if (rowProperties.isSelected) {
		rowSelectionStyle = {
			borderBottom: constants.BORDER_SELECTED_ROW,
			borderTop: constants.BORDER_SELECTED_ROW,
			backgroundColor: constants.BACKGROUND_COLOR_SELECTED_ROW,
		};
	} else if (rowProperties.isQueried) {
		rowSelectionStyle = {
			backgroundColor: rowProperties.isHighlighted ? constants.BACKGROUND_COLOR_SEARCH_HIGHLIGHTED_ROW : constants.BACKGROUND_COLOR_SEARCH_ROW,
		};
	} else {
		rowSelectionStyle = {
			borderBottom: constants.BORDER,
		};
	}

	rowSelectionStyle = { ...getLogViewRowStyle(viewIndex, 0), ...rowSelectionStyle };

	return rowSelectionStyle;
};

export const getLogViewStructureMatchStyle = (
	currentStructureMatch: number[],
	structureMatches: number[][],
	rowIndex: number,
	left: number,
): React.CSSProperties => {
	const isCurrentMatch = currentStructureMatch.includes(rowIndex) ? true : false;
	let structureMatchRowStyle = getLogViewRowStyle(rowIndex, left);
	const currentStructureMatchLastIndex = currentStructureMatch.length - 1;

	const structureMatchFirstAndLastRowStyle = {
		borderTop: isCurrentMatch ? constants.BORDER_STRUCTURE_MATCH_CURRENT : constants.BORDER_STRUCTURE_MATCH_OTHER,
		borderBottom: isCurrentMatch ? constants.BORDER_STRUCTURE_MATCH_CURRENT : constants.BORDER_STRUCTURE_MATCH_OTHER,
		backgroundColor: isCurrentMatch
			? constants.BACKGROUND_COLOR_MATCHED_ROW_CURRENT
			: constants.BACKGROUND_COLOR_MATCHED_ROW_OTHER,
	};
	const structureMatchFirstRowStyle = {
		borderTop: isCurrentMatch ? constants.BORDER_STRUCTURE_MATCH_CURRENT : constants.BORDER_STRUCTURE_MATCH_OTHER,
		borderBottom: constants.BORDER,
		backgroundColor: isCurrentMatch
			? constants.BACKGROUND_COLOR_MATCHED_ROW_CURRENT
			: constants.BACKGROUND_COLOR_MATCHED_ROW_OTHER,
	};
	const structureMatchMiddleRowStyle = {
		backgroundColor: isCurrentMatch
			? constants.BACKGROUND_COLOR_MATCHED_ROW_CURRENT
			: constants.BACKGROUND_COLOR_MATCHED_ROW_OTHER,
		borderBottom: constants.BORDER,
	};
	const structureMatchLastRowStyle = {
		borderBottom: isCurrentMatch ? constants.BORDER_STRUCTURE_MATCH_CURRENT : constants.BORDER_STRUCTURE_MATCH_OTHER,
		backgroundColor: isCurrentMatch
			? constants.BACKGROUND_COLOR_MATCHED_ROW_CURRENT
			: constants.BACKGROUND_COLOR_MATCHED_ROW_OTHER,
	};

	if (rowIndex === currentStructureMatch[0] && currentStructureMatch.length === 1) {
		structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstAndLastRowStyle };
	} else if (rowIndex === currentStructureMatch[0]) {
		structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstRowStyle };
	} else if (rowIndex === currentStructureMatch[currentStructureMatchLastIndex]) {
		structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchLastRowStyle };
	} else if (
		currentStructureMatch[0] < rowIndex &&
		rowIndex < currentStructureMatch[currentStructureMatchLastIndex]
	) {
		structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchMiddleRowStyle };
	} else {
		structureMatches = structureMatches.filter((match) => match !== currentStructureMatch);

		for (let i = 0; i < structureMatches.length; i++) {
			const match = structureMatches[i];

			if ((match.length > 1 && rowIndex <= match[match.length - 1]) || rowIndex <= match[0]) {
				if (rowIndex === match[0] && match.length === 1) {
					structureMatchRowStyle = {
						...structureMatchRowStyle,
						...structureMatchFirstAndLastRowStyle,
					};
				} else if (rowIndex === match[0]) {
					structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchFirstRowStyle };
				} else if (rowIndex === match[match.length - 1]) {
					structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchLastRowStyle };
				} else {
					structureMatchRowStyle = { ...structureMatchRowStyle, ...structureMatchMiddleRowStyle };
				}

				break;
			}
		}
	}

	return structureMatchRowStyle;
};

export const getContextMenuStyle = (
	contextMenuHeight: number,
	contextMenuWidth: number,
	xPos: number,
	yPos: number,
): React.CSSProperties => {
	const contextMenuStyle: React.CSSProperties = {
		height: contextMenuHeight,
		width: contextMenuWidth,
		top: yPos,
		left: xPos,
		position: "fixed",
		userSelect: "none",
	};

	const vw = document.documentElement.clientWidth;
	const vh = document.documentElement.clientHeight;

	if (xPos + contextMenuWidth > vw) contextMenuStyle.left = vw - contextMenuWidth;

	if (yPos + contextMenuHeight > vh) contextMenuStyle.top = vh - contextMenuHeight;

	return contextMenuStyle;
};

export const getContextMenuItemStyle = (isSelected: boolean): React.CSSProperties => {
	const contextMenuItemStyle: React.CSSProperties = {
		height: "28px",
		lineHeight: "28px",
		paddingLeft: "5px",
		paddingRight: "5px",
		borderRadius: "4px",
		cursor: "pointer",
		textOverflow: "ellipsis",
		background: isSelected ? "var(--vscode-menu-selectionBackground)" : "",
		color: isSelected ? "var(--vscode-menu-selectionForeground)" : "",
	};

	return contextMenuItemStyle;
};
