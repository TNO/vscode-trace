import React from "react";
import LogView from "./LogView";
import MinimapView from "./minimap/MinimapView";
import LogFile from "../lib/LogFile";
import { LogViewState, RowProperty, ColumnSelection } from "../interfaces";
import { constants } from "../constants";
import { enums } from "../enums";
import { createDefaultRowProperties } from "../hooks/useRowProperty";
import { getVisibleColumnsMinimap } from "../hooks/useColumnSelection";

interface State {
	logViewState?: LogViewState;
    visibleItemsMinimap?: number;
	rowProperties: RowProperty[];
}

interface Props {
	logFile: LogFile;
	initialLogViewState?: LogViewState;
	onLogViewStateChanged?: (trigger: enums.EventTrigger, state: LogViewState) => void;
	onMinimapVisibleItemsChanged?: (trigger: enums.EventTrigger, visibleItems: number) => void;
    onRequestColors: (column: string) => string[];

	// UI settings
	coloredTable: boolean;
	selectedColumns: ColumnSelection;
    alignMinimap: 'left' | 'right';

	// Search related
    searchMatches: number[][];
	filterSearch: boolean;
	currentSearchMatch: number[]; // A match can consist of multiple rows
}

export default class LogViewAndMinimap extends React.Component<Props, State> {
	private child = React.createRef<HTMLDivElement>();
	private logViewRef = React.createRef<LogView>();

    constructor(props: Props) {
        super(props)

        this.handleLogViewStateChanged = this.handleLogViewStateChanged.bind(this);
        this.handleSelectedRowsChanged = this.handleSelectedRowsChanged.bind(this);

        const rowProperties = createDefaultRowProperties(props.logFile.amountOfRows());
        this.state = { rowProperties, logViewState: props.initialLogViewState };
    }

	componentDidUpdate(prevProps: Props, prevState: State) {
        const { searchMatches, filterSearch, currentSearchMatch } = this.props;
        if (prevProps.searchMatches !== searchMatches
                || prevProps.filterSearch !== filterSearch) {
            
            this.updateVisibleSearchMatches(searchMatches.flatMap((m) => m), filterSearch);
        }

        if (prevProps.currentSearchMatch !== currentSearchMatch) {
            this.updateHighlightedMatche(currentSearchMatch);
        }
    }

    setLogViewStart(start: number) {
        this.logViewRef.current?.updateState(start);
    }

    setMinimapVisibleItems(trigger: enums.EventTrigger, visibleItems: number) {
        this.setState({visibleItemsMinimap: visibleItems});

        if (this.props.onMinimapVisibleItemsChanged) {
            this.props.onMinimapVisibleItemsChanged(trigger, visibleItems);
        }
    }

	clearSelection() {
		this.logViewRef.current?.clearSelection();
	}

	updateVisibleSearchMatches(searchMatches: number[], filterSearch: boolean) {
		const rowProperties: RowProperty[] = [... this.state.rowProperties];
		for (let i = 0; i < rowProperties.length; i++) {
			const queried = searchMatches.includes(i);
			rowProperties[i].isQueried = queried;
			rowProperties[i].isRendered = !filterSearch || queried;
		}
		
		this.setState({ rowProperties });
	}

	updateHighlightedMatche(match: number[]) {
		const rowProperties: RowProperty[] = [... this.state.rowProperties];
		for (let i = 0; i < rowProperties.length; i++) {
			rowProperties[i].isHighlighted = match.includes(i);
		}
		
		this.setState({ rowProperties });
	}

	handleSelectedRowsChanged(selection: number[]) {
		const rowProperties: RowProperty[] = [...this.state.rowProperties];
		for (let i = 0; i < rowProperties.length; i++) {
			rowProperties[i].isSelected = selection.includes(i);
		}
		
        this.setState({ rowProperties })
	}

    handleLogViewStateChanged(trigger: enums.EventTrigger, state: LogViewState) {
        this.setState({ logViewState: state });
        
        if (this.props.onLogViewStateChanged) {
            this.props.onLogViewStateChanged(trigger, state);
        }
    }

    renderLogView() {
        return (
            <div style={{ flex: 1, display: "flex" }}>
                <LogView
                    ref={this.logViewRef}
                    logFile={this.props.logFile}
                    previousSessionLogView={this.props.initialLogViewState}
                    columnSelection={this.props.selectedColumns}
                    onLogViewStateChanged={this.handleLogViewStateChanged}
                    forwardRef={this.child}
                    filterSearch={this.props.filterSearch}
                    coloredTable={this.props.coloredTable}
                    rowProperties={this.state.rowProperties}
                    currentSearchMatch={this.props.currentSearchMatch[0]}
                    onSelectedRowsChanged={this.handleSelectedRowsChanged}
                    onRequestColors={this.props.onRequestColors}
                />
            </div>
        );
    }

    renderMinimap() {
		const minimapHeaders = getVisibleColumnsMinimap(this.props.logFile, this.props.selectedColumns);
		const minimapWidth = minimapHeaders.length * constants.MINIMAP_COLUMN_WIDTH;

        return (
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    width: minimapWidth,
                    boxSizing: "border-box",
                }}
            >
                <div className="header-background" style={constants.COLUMN_0_HEADER_STYLE} />
                {this.state.logViewState && (
                    <MinimapView
                        logFile={this.props.logFile}
                        columnSelection={this.props.selectedColumns}
                        logViewState={this.state.logViewState}
                        visibleItems={this.state.visibleItemsMinimap ?? this.state.logViewState.height / constants.LOG_ROW_HEIGHT}
                        forwardRef={this.child}
                        rowProperties={this.state.rowProperties}
                        onRequestColors={this.props.onRequestColors}
                        onMinimapScaleChange={(items) => this.setMinimapVisibleItems(enums.EventTrigger.UserScroll, items)}
                    />
                )}
            </div>
        );
    }

    render() {
        if (this.props.alignMinimap === 'left') {
            return (
                <>
                    { this.renderMinimap() }
                    { this.renderLogView() }
                </>
            )
        } else {
            return (
                <>
                    { this.renderLogView() }
                    { this.renderMinimap() }
                </>
            )
        }
    }
}