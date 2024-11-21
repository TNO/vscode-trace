import { State as SearchState } from "./components/SearchBar";
import { enums } from "./enums";
import LogFile from "./lib/LogFile";
import { types } from "./types";

export interface LogViewState {
	height: number;
	start: number;
	end: number;
	visibleItems: number;
	scrollTop: number;
	scrollLeft: number;
}

export interface StructureDefinition {
	headerColumns: string[],
	headerColumnsTypes: enums.StructureHeaderColumnType[],
	entries: StructureEntry[],
	wildcards: Wildcard[]
}

export interface StructureEntry {
	row: CellContents[][];
	cellSelection: boolean[];
	wildcardsIndices: number[][];
	structureLink?: enums.StructureLinkDistance;
}

export interface ContextMenuItem {
	text: string;
	callback: (anchorDiv: string) => void;
}

export interface Wildcard {
	wildcardSubstitutions: WildcardSubstitution[];
}

export interface WildcardSubstitution {
	entryIndex: number;
	cellIndex: number;
	contentsIndex: number;
}

export interface CellContents {
	contentsIndex: number;
	textValue: string;
	wildcardIndex: number | null;
}

export interface RowProperty {
	index: number;
	isRendered: boolean;
	isSelected: boolean;
	isQueried: boolean;
	isHighlighted: boolean;
}

export interface ColumnProperty {
	isRendered: boolean;
	name: string;
	index: number;
	width: number;
	colors: string[];
}

export interface Segment {
	start: number;
	end: number;
	level: number;
}

export interface LogEntryCharMaps {
	firstCharIndexMap: Map<number, number>;
	lastCharIndexMap: Map<number, number>;
}

export interface ColumnSelection {
	[column: string]: {logView?: boolean, miniMap?: boolean} | undefined;
}

export interface Message {
	type: string;
}

export interface LogFileData {
    filePath: string;
    headers: string[];
    rows: types.TracyLogData[][];
    dateTimeIndex?: number;
}

export interface ReadFileMessage extends Message {
    logFile: LogFileData;
	rules: [];
}

export interface LoadFileForComparisonMessage extends Message {
    logFile: LogFileData;
}

export interface ReadExportPathMessage extends Message {
    text: string;
}

export interface CustomColumn<T extends types.TracyLogData> {
	header: string;
	alignment?: 'left' | 'right';
	showInLogView?: boolean;
	showInMinimap?: boolean;
	toggleable?: boolean;
	width?: number;
	exportable?: boolean;
	getValues(logFile: LogFile): T[];
}

export interface CustomDisplayString {
	value: types.TracyLogData;
	display: string;
}

export interface UiStoredState {
	showMinimapHeader: boolean;
	coloredTable: boolean;
	selectedColumns: ColumnSelection;
	currentDialog?: enums.DialogType;
}

export interface TracyStoredState {
	comparisonFile?: string;
	ui?: UiStoredState;
	search?: SearchState;
	primaryView?: LogViewState;
	comparisonView?: LogViewState;
}

export interface VsCode {
	setState: (state: TracyStoredState) => void;
	getState: () => TracyStoredState | undefined;
	postMessage: (message: {}) => void;
}