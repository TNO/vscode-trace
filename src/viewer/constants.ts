export namespace constants {

	const RGB_LIME_GREEN = "0, 208, 0";
	const RGB_TURQUOISE = "69, 205, 191";
	const RGB_OFFICE_GREEN = "0, 100, 0";
	const RGB_OFF_ORANGE = "244, 157, 71";

	export const MINIMAP_COLUMN_WIDTH = 15;

	export const LOG_HEADER_HEIGHT = 40;

	export const LOG_ROW_HEIGHT = 28;

	export const LOG_DEFAULT_COLUMN_WIDTH = 100;

	export const BORDER_SIZE = 1;

	export const STRUCUTURE_MATCH_BORDER_SIZE = 3;

	export const SELECTED_ROW_BORDER_SIZE = 2;

	export const BORDER = `${BORDER_SIZE}px solid grey`;

	export const BORDER_SELECTED_ROW = `${SELECTED_ROW_BORDER_SIZE}px solid rgb(${RGB_TURQUOISE})`;

	export const BACKGROUND_COLOR_SELECTED_ROW = `rgba(${RGB_TURQUOISE}, 0.5)`;

	export const BACKGROUND_COLOR_SEARCH_ROW = `rgba(${RGB_OFF_ORANGE}, 0.5)`;

	export const BACKGROUND_COLOR_SEARCH_HIGHLIGHTED_ROW = `rgba(${RGB_OFF_ORANGE}, 0.7)`;

	export const BORDER_COLOR_CURRENT_SEARCH_ROW = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_OFF_ORANGE})`;

	export const BORDER_STRUCTURE_MATCH_CURRENT = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_LIME_GREEN})`;

	export const BACKGROUND_COLOR_MATCHED_ROW_CURRENT = `rgba(${RGB_LIME_GREEN}, 0.5)`;

	export const BORDER_STRUCTURE_MATCH_OTHER = `${STRUCUTURE_MATCH_BORDER_SIZE}px solid rgb(${RGB_OFFICE_GREEN})`;

	export const BACKGROUND_COLOR_MATCHED_ROW_OTHER = `rgba(${RGB_OFFICE_GREEN}, 0.5)`;

	export const BORDER_SELECTED_ROW_RADIUS = `5px`;

	export const COLUMN_0_HEADER_STYLE = {
		height: LOG_HEADER_HEIGHT,
		display: "flex",
		justifyContent: "center",
		alignItems: "center",
		borderLeft: BORDER,
		borderBottom: BORDER,
	};

	export const COLUMN_2_HEADER_STYLE = {
		height: "100%",
		display: "flex",
		borderLeft: BORDER,
	};

	export const STRUCTURE_WIDTH = 28;

	export const STRUCTURE_LINK_HEIGHT = 16;
	
}