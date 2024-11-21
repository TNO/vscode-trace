import React from "react";
import {
	getHeaderColumnInnerStyle,
	getHeaderColumnStyle,
	getLogViewRowSelectionStyle
} from "../hooks/useStyleManager";
import { ColumnProperty, ColumnSelection, LogViewState, RowProperty } from "../interfaces";
import LogFile from "../lib/LogFile";
import ReactResizeDetector from "react-resize-detector";
import RowSelectionHandler from "../lib/RowSelectionHandler";
import { logDataToString } from "../hooks/useTracyLogData";
import { constants } from "../constants";
import { enums } from "../enums";
import { isColumnVisibleLogView } from "../hooks/useColumnSelection";
import { types } from "../types";
import { createDefaultRowProperty } from "../hooks/useRowProperty";
import { isLight } from "../hooks/useColor";

interface Props {
	logFile: LogFile;
	columnSelection: ColumnSelection;
	previousSessionLogView?: LogViewState;
	forwardRef: React.RefObject<HTMLDivElement>;
	filterSearch: boolean;
	coloredTable: boolean;
	rowProperties: RowProperty[];
	currentSearchMatch?: number;
    onRequestColors: (column: string) => string[];
	onLogViewStateChanged: (trigger: enums.EventTrigger, state: LogViewState) => void;
	onSelectedRowsChanged: (selection: number[]) => void;
}

interface State {
	state?: LogViewState;
	logFile: LogFile;
	columnWidth: { [id: string]: number };
    isLoadingSavedState: boolean;
}

const HEADER_STYLE: React.CSSProperties = {
	width: "100%",
	height: constants.LOG_HEADER_HEIGHT,
	position: "relative",
	overflow: "hidden",
	borderBottom: constants.BORDER,
};

const VIEWPORT_STYLE: React.CSSProperties = { position: "relative", flex: 1, overflow: "auto" };

export default class LogView extends React.Component<Props, State> {
	private readonly viewport: React.RefObject<HTMLDivElement>;
	private readonly rowSelectionHandler: RowSelectionHandler;

	constructor(props: Props) {
		super(props);
		this.viewport = this.props.forwardRef;
		this.rowSelectionHandler = new RowSelectionHandler(props.onSelectedRowsChanged);
		this.updateState = this.updateState.bind(this);
		this.state = {
			columnWidth: this.getInitialColumnWidth(props.logFile),
			logFile: this.props.logFile,
            isLoadingSavedState: false
		};
	}

	componentDidMount(): void {
		window.addEventListener("resize", () => this.updateState());

		// Initial update needed to initialize LogViewState
		this.updateState();
		this.loadState();
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>): void {
		const { logFile, currentSearchMatch, rowProperties } = this.props;
		if (prevProps.logFile !== logFile) {
			this.updateState();
		}
		// Responsible for making sure the current search match is always visible in the log view
		if (currentSearchMatch !== undefined && prevProps.currentSearchMatch !== currentSearchMatch && this.state.state) {
			// Index in logView can be different to the index of in the log file if some rows are not rendered (e.g. when filter search is used)
			const logViewIndex = rowProperties.filter((r) => r.isRendered).findIndex((r) => r.index === currentSearchMatch);

			const { start, end } = this.state.state;
			// Check if search match is visible
			if (logViewIndex < start || logViewIndex > end) {
				this.updateState(logViewIndex);
			}
		}
        if (this.viewport.current && this.props.previousSessionLogView && this.state.isLoadingSavedState) {
            this.viewport.current.scrollTop = this.props.previousSessionLogView.scrollTop;
            this.setState({isLoadingSavedState:false});
        }
		if (prevProps.filterSearch !== this.props.filterSearch) {
			this.updateState(this.state.state?.start);
		}
		// scrollTop has been changed by updateState with currentMatchFirstRow
		if (this.viewport.current && this.state.state && this.state.state.scrollTop !== this.viewport.current.scrollTop) {
			this.viewport.current.scrollTo({top: this.state.state.scrollTop});
		}
	}

	private getInitialColumnWidth(logFile: LogFile) {
		const customColumns = logFile.getCustomColumns();
		const widths = {};
		for (let i = 0; i < customColumns.length; i++) {
			const column = customColumns[i];
			widths[column.header] = column.width ?? constants.LOG_DEFAULT_COLUMN_WIDTH;
		}

		return widths;
	}

	clearSelection = () => this.rowSelectionHandler.clearSelection();

	renderRows(selectedColumns: ColumnProperty[]) {
		// This method only renders the rows that are visible
		if (!this.state.state) return;
		const {
			start,
			end
		} = this.state.state;

		let firstRender = Math.floor(start);
		let lastRender = Math.ceil(end);
		let extraPaddingTop = start < 0 ? (-start) : 0;

		const {
			logFile,
			rowProperties
		} = this.props;

		const visibleRows = rowProperties.filter((r) => r.isRendered);

		const result: React.JSX.Element[] = [];
		for (let r = firstRender; r <= lastRender; r++) {
			const rowProperty = visibleRows[r] ?? createDefaultRowProperty(-1);
			result.push(
				<Row
					key={r}
					viewIndex={r + extraPaddingTop}
					rowProperties={rowProperty}
					selectedColumns={selectedColumns}
					row={logFile.getRow(rowProperty.index)}
					coloredTable={this.props.coloredTable}
					onClick={(event) => this.rowSelectionHandler.handleLogRowClick(rowProperty.index, event)}
				/>
			);
		}
		return result;
	}

	loadState() {
		if (!this.props.previousSessionLogView) return;
		this.setState({ state: this.props.previousSessionLogView, isLoadingSavedState: true });
		this.props.onLogViewStateChanged(enums.EventTrigger.Initalisation, this.props.previousSessionLogView);
	}

	handleScroll(scrollTop: number, scrollLeft: number) {
		if (this.state.state?.scrollTop !== scrollTop || this.state.state?.scrollLeft !== scrollLeft) {
			this.updateState();
		}
	}

	updateState(currentMatchFirstRow?: number) {
		if (!this.viewport.current) return;

		const logRows = this.props.logFile.amountOfRows();
		const height = this.viewport.current.clientHeight;
		const maxVisibleItems = height / constants.LOG_ROW_HEIGHT;
		const visibleItems = Math.min(logRows, maxVisibleItems);

		let scrollTop: number; 	// Number of pixels that the content is scrolled vertically
		let start: number; 		// First visible item, can be decimal if an item is half shown
		let trigger: enums.EventTrigger;

		// Set values based on currentMatchFirstRow
		if (currentMatchFirstRow !== undefined) {
			trigger = enums.EventTrigger.LogViewJump;
			scrollTop = currentMatchFirstRow * constants.LOG_ROW_HEIGHT;
			start = currentMatchFirstRow;
		} 
		// Set values based on scrolling
		else {
			trigger = enums.EventTrigger.UserScroll;
			scrollTop = this.viewport.current.scrollTop;
			start = scrollTop / constants.LOG_ROW_HEIGHT;
		}

		// Number of pixels that the content is scrolled horizontally
		const scrollLeft = this.viewport.current.scrollLeft;
		const end = start + maxVisibleItems - 1;

		const state: LogViewState = {
			height,
			scrollLeft,
			scrollTop,
			start,
			end,
			visibleItems
		};

		this.setState({ state });
		this.props.onLogViewStateChanged(trigger, state);
	}

	setColumnWidth(name: string, width: number) {
		//update the state for triggering the render
		this.setState((prevState) => {
			const columnWidth = { ...prevState.columnWidth };
			columnWidth[name] = width;
			return { columnWidth };
		});
	}

	render() {
		const selection = getSelection();

		if (selection !== null) {
			// empty unwanted text selection resulting from Shift-click
			selection.empty();
		}

		const { logFile, columnSelection, rowProperties } = this.props;

		const selectedColumns: ColumnProperty[] = logFile.getAllHeaders()
			.map((h, i) => ({
				index: i,
				name: h,
				isRendered: isColumnVisibleLogView(h, logFile, columnSelection),
				width: this.state.columnWidth[h] ?? constants.LOG_DEFAULT_COLUMN_WIDTH,
				colors: this.props.onRequestColors(h)
			}))
			.filter((h) => h.isRendered);

		const containerHeight = rowProperties.filter((r) => r.isRendered).length * constants.LOG_ROW_HEIGHT;
		const containerWidth = 
			selectedColumns.length * constants.BORDER_SIZE + // All vertical deviders
			selectedColumns.reduce((sum, c) => sum + c.width,
				0,
			);
		
		return (
			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				<Header
					selectedColumns={selectedColumns}
					width={containerWidth}
					scrollLeft={this.state.state?.scrollLeft}
					onColumnWidthChange={(header, width) => this.setColumnWidth(header, width)}
				/>
				<div style={VIEWPORT_STYLE} ref={this.viewport} onScroll={(e) => this.handleScroll(e.currentTarget.scrollTop, e.currentTarget.scrollLeft)}>
					<div style={{ width: containerWidth, height: containerHeight, position: "absolute" }}>
						{this.renderRows(selectedColumns)}
					</div>
				</div>
			</div>
		);
	}
}

function Cell(
	props: {
		value: types.TracyLogData,
		width: number,
		colorMap?: string
	}
) {
	let color = "transparent";
	let fontColor = "";

	if (props.colorMap) {
		color = props.colorMap;
		if (isLight(color)) {
			fontColor = "#000000";
		} else {
			fontColor = "#ffffff";
		}
	}

	const columnHeaderStyle = getHeaderColumnStyle(props.width, constants.LOG_ROW_HEIGHT);
	const columnHeaderInnerStyle = getHeaderColumnInnerStyle(constants.LOG_ROW_HEIGHT, false);
	const colorStyle: React.CSSProperties = { backgroundColor: color, color: fontColor };
	const innerStyle = { ...columnHeaderInnerStyle, ...colorStyle };

	return (
		<div style={columnHeaderStyle}>
			<div style={innerStyle}>{logDataToString(props.value)}</div>
		</div>
	);
}

function HeaderCell(
	props: {
		value: string,
		width: number,
		onWidthChange: (newWidth: number) => void
	}
) {
	const columnHeaderStyle = getHeaderColumnStyle(props.width, constants.LOG_HEADER_HEIGHT);
	const columnHeaderInnerStyle = getHeaderColumnInnerStyle(constants.LOG_HEADER_HEIGHT, true);

	return (
		<ReactResizeDetector
			handleWidth
			onResize={(newWidth) => newWidth && props.onWidthChange(newWidth)}
		>
			<div className="resizable-content" style={columnHeaderStyle} key={props.value}>
				<div style={columnHeaderInnerStyle}>{props.value}</div>
			</div>
		</ReactResizeDetector>
	);
}

function Row(
	props: {
		viewIndex: number,
		rowProperties: RowProperty,
		selectedColumns: ColumnProperty[],
		row: types.TracyLogData[],
		coloredTable: boolean,
		onClick: (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => void
	}
) {
	const rowStyle = getLogViewRowSelectionStyle(props.rowProperties, props.viewIndex);
	
	return (
		<div key={props.rowProperties.index} style={{ display: "flex", flexDirection: "row", flexWrap: "nowrap" }}>
			<div
				key={props.viewIndex}
				style={rowStyle}
				onClick={props.onClick}
			>
				{
					props.selectedColumns.map((c, i) => (
						<Cell
							key={i}
							value={props.row[c.index]}
							width={c.width}
							colorMap={props.coloredTable ? c.colors[props.rowProperties.index] : undefined}
						/>
					))
				}
			</div>
		</div>
	);
}

function Header(
	props: {
		selectedColumns: ColumnProperty[],
		width: number,
		scrollLeft?: number,
		onColumnWidthChange: (header: string, newWidth: number) => void
	}
) {
	const style: React.CSSProperties = {
		width: props.width,
		height: "100%",
		position: "absolute",
		left: props.scrollLeft ? props.scrollLeft * -1 : 0,
	};
	return (
		<div style={HEADER_STYLE} className="header-background">
			<div style={style}>
				{
					props.selectedColumns.map((c, i) => (
						<HeaderCell
							key={i}
							value={c.name}
							width={c.width}
							onWidthChange={(newWidth) => props.onColumnWidthChange(c.name, newWidth)}
						/>
					))
				}
			</div>
		</div>
	);
}