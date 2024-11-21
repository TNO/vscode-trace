import React from "react";
import Rule from "./rules/Rule";
import LogFile from "./lib/LogFile";
import { ColumnSelection, LogViewState, VsCode } from "./interfaces";
import {
	VSCodeButton
} from "@vscode/webview-ui-toolkit/react";
import ExportDialog from "./components/dialogs/ExportDialog";
import SelectColDialog from "./components/dialogs/SelectColDialog";
import StructureDialog from "./components/dialogs/StructureDialog";
import SearchBar from "./components/SearchBar";
import TracyIconButton, { IconType } from "./components/TracyIconButton";
import LogViewAndMinimap from "./components/LogViewAndMinimap";
import SideBySideAlignmentHandler from "./lib/SideBySideAlignmentHandler";
import ColorMappingHandler from "./lib/ColorMappingHandler";
import StatesDialog from "./components/dialogs/StatesDialog";
import FlagsDialog from "./components/dialogs/FlagsDialog";
import MinimapHeader from "./components/minimap/MinimapHeader";
import { constants } from "./constants";
import { enums } from "./enums";
import { isLoadFileForComparisonMessage, isReadExportPathMessage, isReadFileMessage } from "./hooks/useMessage";
import { createEmptyLogFile, createLogFile, toExportData } from "./hooks/useLogFile";
import { getVisibleColumnsMinimap } from "./hooks/useColumnSelection";
import RelativeTimeColumn, { HEADER as RELATIVE_TIME_HEADER, handleSetStartingPoint } from "./lib/columns/RelativeTimeColumn";
import { setVsState, storeAppState } from "./hooks/useVsCode";

export interface State {
	logFile: LogFile;
	rules: Rule[];

	// Comparison related
	comparisonFile?: LogFile;

	// UI settings
	showMinimapHeader: boolean;
	coloredTable: boolean;
	selectedColumns: ColumnSelection;
	currentDialog?: enums.DialogType;

	// Search related
	filterSearch: boolean;
	searchMatches: number[][];
	comparisonSearchMatches?: number[][];
	currentSearchMatch: number[];
}

let exportPath: string = "";

export default class App extends React.Component<{}, State> {
	// @ts-ignore
	vscode = acquireVsCodeApi() as VsCode;
	storedState = this.vscode.getState();

	primaryViewRef = React.createRef<LogViewAndMinimap>();
	comparisonViewRef = React.createRef<LogViewAndMinimap>();
	sideBySideAlignmentHandler: SideBySideAlignmentHandler;
	colorMappingHandler: ColorMappingHandler;
	
	constructor(props: any) {
		super(props);

		this.sideBySideAlignmentHandler = new SideBySideAlignmentHandler(this.primaryViewRef, this.comparisonViewRef);
		this.colorMappingHandler = new ColorMappingHandler();

		this.state = {
			rules: [],
			logFile: createEmptyLogFile(),
			coloredTable: false,
			showMinimapHeader: true,
			selectedColumns: {},
			filterSearch: false,
			searchMatches: [],
			currentSearchMatch: []
		};

		// Override default state with previous session state
		let comparisonFilePath: string | undefined;
		if (this.storedState !== undefined) {
			const { comparisonFile, ui } = this.storedState;
			this.state = { ...this.state, ...ui };
			comparisonFilePath = comparisonFile;
		}

		this.onMessage = this.onMessage.bind(this);
		this.handlePrimaryLogViewStateChange = this.handlePrimaryLogViewStateChange.bind(this);
		this.handleComparisonLogViewStateChange = this.handleComparisonLogViewStateChange.bind(this);
		
		window.addEventListener("message", this.onMessage);
		document.addEventListener("contextmenu", (event) => {
			event.preventDefault();
		});
		this.vscode.postMessage({ type: "readFile", comparisonFilePath });
	}

	componentDidUpdate(prevProps: any, prevState: State) {
		if (this.state !== prevState) {
			storeAppState(this.vscode, this.state);
		}
	}

	onMessage(event: MessageEvent) {
		const message: unknown = event.data;
		if (isReadFileMessage(message)) {
			const rules = message.rules.map((r) => Rule.fromJSON(r)).filter((r) => r);
			const { dateTimeIndex } = message.logFile;
			let logFile = createLogFile(message.logFile, rules);
			if (dateTimeIndex !== undefined) {
				logFile.registerCustomColumn(new RelativeTimeColumn(true, false));
			}
			this.colorMappingHandler.computeAllColors(logFile, this.state.comparisonFile);
			
			this.setState({
				rules,
				logFile
			});
		}
		else if (isReadExportPathMessage(message)) {
			exportPath = message.text;
			this.setState({ currentDialog: enums.DialogType.ExportDialog });
		}
		else if (isLoadFileForComparisonMessage(message)) {
			const { headers, dateTimeIndex } = message.logFile;
			let comparisonFile = createLogFile(message.logFile, this.state.rules);

			const selectedColumns = this.state.selectedColumns;
			if (dateTimeIndex !== undefined) {
				comparisonFile.registerCustomColumn(new RelativeTimeColumn());
				
				selectedColumns[RELATIVE_TIME_HEADER] = {logView: true, miniMap: true};
				selectedColumns[headers[dateTimeIndex]] = {logView: true, miniMap: false};
			}
			comparisonFile.registerCustomColumn(new RelativeTimeColumn());

			this.colorMappingHandler.computeAllColors(this.state.logFile, comparisonFile);
			
			this.setState({ comparisonFile });
		}
	}

	handleAnnotationDialogClose(newRules: Rule[]) {
		this.vscode.postMessage({ type: "saveRules", rules: newRules.map((r) => r.toJSON()) });

		const oldRuleHeaders = this.state.rules.map((r) => r.column);
		const newRuleHeaders = newRules.map((r) => r.column);

		const { logFile } = this.state;

		oldRuleHeaders.filter((r) => !newRuleHeaders.includes(r))
			.forEach((h) => logFile.unRegisterCustomColumn(h));
		
		const updatedLogFile = this.state.logFile.updateLogFile(newRules);
		this.colorMappingHandler.computeAllColors(updatedLogFile, this.state.comparisonFile);

		this.setState({
			rules: newRules,
			logFile: updatedLogFile,
			currentDialog: undefined,
		});
	}

	handleSelectDialog(selectedColumns: ColumnSelection) {
		this.setState({
			selectedColumns: selectedColumns,
			currentDialog: undefined
		});
	}

	handleSetRelativeTimeStartingPoint() {
		let result = false;
		
		const primary = this.primaryViewRef.current;
		if (primary) {
			result = handleSetStartingPoint(primary) || result;
		}
		const comparison = this.comparisonViewRef.current;
		if (comparison) {
			result = handleSetStartingPoint(comparison) || result;
		}

		if (result) {
			this.colorMappingHandler.computeColors(RELATIVE_TIME_HEADER, this.state.logFile, this.state.comparisonFile);
			this.primaryViewRef.current?.forceUpdate();
			this.comparisonViewRef.current?.forceUpdate();
		}
		else {
			this.vscode.postMessage({ type: "showErrorMessage", message: 'Select 1 starting point row'});
		}
	}

	handlePrimaryLogViewStateChange(trigger: enums.EventTrigger, state: LogViewState) {
		this.sideBySideAlignmentHandler.handlePrimaryViewStateChange(trigger, state);
		setVsState(this.vscode, {
			primaryView: state
		});
	}

	handleComparisonLogViewStateChange(trigger: enums.EventTrigger, state: LogViewState) {
		this.sideBySideAlignmentHandler.handleComparisonViewStateChange(trigger, state);
		setVsState(this.vscode, {
			comparisonView: state
		});
	}

	exportData(exportIndices?: number[]) {
		const logFile = this.state.logFile;
		if (exportIndices?.length === 0 || this.state.filterSearch === false)
			exportIndices = undefined;
		
		const exportData = toExportData(logFile, exportIndices);
		this.vscode.postMessage({ type: "exportData", data: exportData });
	}

	showCompareFileDialog() {
		if (this.state.comparisonFile) {
			this.setState({ comparisonFile: undefined});
			this.colorMappingHandler.computeAllColors(this.state.logFile, undefined);
		} else {
			this.vscode.postMessage({
				type: 'showCompareFileDialog'
			});
		}
	}

	renderDialog() {
		switch(this.state.currentDialog) {
			case enums.DialogType.ExportDialog:
				return (
					<ExportDialog
						filepath={exportPath}
						onClose={() => this.setState({ currentDialog: undefined })}
					/>
				);
			case enums.DialogType.FlagsDialog:
				return (
					<FlagsDialog
						logFile={this.state.logFile}
						initialRules={this.state.rules}
						onClose={(newRules) => this.handleAnnotationDialogClose(newRules)}
						onReturn={() => {}}
					/>
				);
			case enums.DialogType.SelectDialog:
				return (
					<SelectColDialog
						logFile={this.state.logFile}
						comparisonFile={this.state.comparisonFile}
						selectedColumns={this.state.selectedColumns}
						onClose={(selectedColumns) =>
							this.handleSelectDialog(selectedColumns)
						}
					/>
				);
			case enums.DialogType.StatesDialog:
				return (
					<StatesDialog
						logFile={this.state.logFile}
						initialRules={this.state.rules}
						onClose={(newRules) => this.handleAnnotationDialogClose(newRules)}
						onReturn={() => {}}
					/>
				);
			case enums.DialogType.StructureDialog:
				const selectedRows = this.primaryViewRef.current?.state.rowProperties.filter((r) => r.isSelected).map((r) => r.index) ?? [];
				if (selectedRows.length === 0) {
					this.vscode.postMessage({ type: "showErrorMessage", message: 'No rows selected'});
					this.state = { ...this.state, currentDialog: undefined };
					break;
				}
				return (
					<div id="StructureDialog" style={{ display: "flex", position: "relative", boxSizing: "border-box" }}>
						<StructureDialog
							logFile={this.state.logFile}
							comparisonLogFile={this.state.comparisonFile}
							selectedRows={selectedRows}
							
							onClose={() => this.setState({currentDialog: undefined, currentSearchMatch: [], searchMatches: [], comparisonSearchMatches: []})}
							onSearchResults={(searchMatches: number[][], comparisonSearchMatches: number[][]) => this.setState({ searchMatches, currentSearchMatch: searchMatches[0] , comparisonSearchMatches})}
							onSearchHighlight={(match: number[]) => this.setState({currentSearchMatch: match})}
						/>
					</div>
				);
		}
	}

	renderHeaderButtons() {
		return (
			<>
			<VSCodeButton
				style={{ marginLeft: "5px", height: "25px", width: "125px" }}
				onClick={() => this.setState({ currentDialog: enums.DialogType.SelectDialog })}
			>
				Choose Columns
			</VSCodeButton>
			<VSCodeButton
				style={{ marginLeft: "5px", height: "25px", width: "110px" }}
				onClick={() => this.exportData(this.state.searchMatches.flatMap((m) => m))}
			>
				Export
			</VSCodeButton>
			<VSCodeButton
				style={{ marginLeft: "5px", height: "25px", width: "110px" }}
				onClick={() => this.showCompareFileDialog()}
			>
				{this.state.comparisonFile ? 'End Comparison' : 'Compare'}
			</VSCodeButton>
			<div style={{ marginLeft: "5px", height: "25px"}}>
				<TracyIconButton
					tooltip="Create a structure from selected rows"
					icon={IconType.ThreeBars}
					onClick={() => this.setState({ currentDialog: enums.DialogType.StructureDialog })}
				/>
				<TracyIconButton
					tooltip="Create/Modify Flag Annotations Columns"
					icon={IconType.Tag}
					onClick={() => this.setState({ currentDialog: enums.DialogType.FlagsDialog })}
				/>
				<TracyIconButton
					tooltip="Create/Modify State-Based Annotation Columns"
					icon={IconType.SettingsGear}
					onClick={() => this.setState({ currentDialog: enums.DialogType.StatesDialog })}
				/>
				<TracyIconButton
					tooltip="Toggle color mapping in logview"
					icon={IconType.SymbolColor}
					onClick={() => this.setState(({ coloredTable }) => ({ coloredTable: !coloredTable }))}
				/>
				{
					this.state.logFile.dateTimeColumn() !== undefined && (
						<TracyIconButton
							tooltip="Set relative time starting point to selected row"
							icon={IconType.Calendar}
							onClick={() => this.handleSetRelativeTimeStartingPoint()}
						/>
					)
				}
				{
					this.state.comparisonFile && (
						<TracyIconButton
							tooltip="Toggle syncronous scrolling"
							icon={IconType.Link}
							onClick={() => this.sideBySideAlignmentHandler.toggleSynchonizedScrolling()}
						/>
					)
				}
			</div>
			</>
		)
	}

	renderMinimapHeaders () {
		if (this.state.comparisonFile) {
			return (
				<>
				<MinimapHeader logFile={this.state.logFile} selectedColumns={this.state.selectedColumns} borderRight={false} />
				<MinimapHeader logFile={this.state.comparisonFile} selectedColumns={this.state.selectedColumns} borderRight={true} />
				</>
			)
		} else {
			return (
				<MinimapHeader logFile={this.state.logFile} selectedColumns={this.state.selectedColumns} borderRight={false} />
			)
		}
	}

	renderHeader() {
		const { logFile, selectedColumns, showMinimapHeader } = this.state;
		const minimapHeadersPrimary = getVisibleColumnsMinimap(logFile, selectedColumns);
		const minimapWidthPrimary = minimapHeadersPrimary.length * constants.MINIMAP_COLUMN_WIDTH;
		const headerHight = showMinimapHeader ? "100px" : "30px";

		return (
			<div
				id="header"
				style={{
					display: "flex",
					flexDirection: "row",
					height: headerHight,
					width: '100%',
					boxSizing: "border-box",
				}}
			>
				<div style={{ display: 'flex', width: `calc(50% - ${minimapWidthPrimary}px)` }}>
					{
						this.renderHeaderButtons()
					}
				</div>
				{ this.state.showMinimapHeader && this.state.comparisonFile && this.renderMinimapHeaders() }
				<div style={{ flex: 1, display: "flex", justifyContent: "end" }}>
					<SearchBar
						logFile={this.state.logFile}
						comparisonLogFile={this.state.comparisonFile}
						initialState={this.storedState?.search}
						onClear={() => this.setState({ searchMatches: [], comparisonSearchMatches: undefined, filterSearch: false })}
						onSearchResults={(filterSearch: boolean, primarySearchMatches: number[], comparisonSearchMatches?: number[]) => this.setState({ searchMatches: primarySearchMatches.map((m) => [m]), filterSearch, comparisonSearchMatches: comparisonSearchMatches?.map((m) => [m]), currentSearchMatch: [primarySearchMatches[0]] })}
						onSearchHighlight={(resultIndex: number) => this.setState({currentSearchMatch: this.state.searchMatches[resultIndex]})}
						onStateChanged={(state) => setVsState(this.vscode, { search: state })}
					/>
					<TracyIconButton
						tooltip={this.state.showMinimapHeader ? "Hide minimap headers" : "Show minimap headers"}
						icon={this.state.showMinimapHeader ? IconType.ArrowUp : IconType.ArrowDown}
						onClick={() => this.setState(({ showMinimapHeader }) => ({ showMinimapHeader: !showMinimapHeader }))}
					/>
				</div>
				
				{ this.state.showMinimapHeader && !this.state.comparisonFile && this.renderMinimapHeaders() }
			</div>
		)
	}

	render() {
		// logFile is initialized with an empty object
		if (this.state.logFile.isEmpty()) {
			return undefined;
		}

		const headerHight = this.state.showMinimapHeader ? "100px" : "30px";

		return (
			<div
				id="container"
				style={{
					display: "flex",
					flexDirection: "column",
					height: "100vh",
					boxSizing: "border-box",
				}}
			>
				{
					this.renderHeader()
				}
				<div
					id="LogViewAndMinimap"
					style={{
						display: "flex",
						flexDirection: "row",
						height: `calc(100% - ${headerHight})`,
						overflow: "auto",
						boxSizing: "border-box",
					}}
				>
					<div style={{ display: 'flex', width: `${this.state.comparisonFile ? 50 : 100}%` }}>
						<LogViewAndMinimap
							ref={this.primaryViewRef}
							logFile={this.state.logFile}
							initialLogViewState={this.storedState?.primaryView}
							onLogViewStateChanged={this.handlePrimaryLogViewStateChange}
							onMinimapVisibleItemsChanged={this.sideBySideAlignmentHandler.handlePrimaryMinimapScaleChange}
							onRequestColors={this.colorMappingHandler.getPrimaryColors}
						
							// UI settings
							coloredTable={this.state.coloredTable}
							selectedColumns={this.state.selectedColumns}
							alignMinimap="right"
						
							// Search related
							searchMatches={this.state.searchMatches}
							filterSearch={this.state.filterSearch}
							currentSearchMatch={this.state.currentSearchMatch}
						/>
					</div>
					{
						this.state.comparisonFile && (
							<div style={{ display: 'flex', width: '50%' }}>
								<LogViewAndMinimap
									ref={this.comparisonViewRef}
									logFile={this.state.comparisonFile}
									initialLogViewState={this.storedState?.comparisonView}
									onLogViewStateChanged={this.handleComparisonLogViewStateChange}
									onMinimapVisibleItemsChanged={this.sideBySideAlignmentHandler.handleComparisonMinimapScaleChange}
									onRequestColors={this.colorMappingHandler.getComparisonColors}
								
									// UI settings
									coloredTable={this.state.coloredTable}
									selectedColumns={this.state.selectedColumns}
									alignMinimap="left"
								
									// Search related
									searchMatches={this.state.comparisonSearchMatches ?? []}
									filterSearch={this.state.filterSearch}
									currentSearchMatch={this.state.currentSearchMatch}
								/>
							</div>
						)
					}
				</div>
				{
					this.renderDialog()
				}
			</div>
		);
	}
}
