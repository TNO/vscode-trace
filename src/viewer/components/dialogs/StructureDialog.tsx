import React from "react";
import Tooltip, { TooltipProps, tooltipClasses } from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import IconButton from "@mui/material/IconButton";
import StructureTable from "./structures/StructureTable";
import { ContextMenuItem, LogEntryCharMaps, StructureEntry, Wildcard } from "../../interfaces";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { useGetCharIndicesForLogEntries, useStructureQueryConstructor, useStructureRegularExpressionSearch } from "../../hooks/useStructureRegularExpressionManager";
import {
	constructStructureEntriesArray,
	appendNewStructureEntries,
	removeStructureEntryFromList,
	toggleCellSelection,
	toggleStructureLink,
	removeLastStructureLink,
	addWildcardToStructureEntry,
	removeWildcardFromStructureEntry,
	updateStructureEntriesAfterWildcardDeletion,
} from "../../hooks/useStructureEntryManager";
import {
	createWildcard,
	getIndicesForWildcardFromDivId,
	insertWildcardIntoCellsContents,
	removeWildcardSubstitution,
	removeWildcardSubstitutionsForStructureEntry,
	getWildcardIndex,
	removeWildcardFromCellContent,
} from "../../hooks/useWildcardManager";
import { structureDialogBackdropStyle, structureDialogDialogStyle } from "../../hooks/useStyleManager";
import isEqual from "react-fast-compare";
import cloneDeep from "lodash/cloneDeep";
import ContextMenu from "./structures/ContextMenu";
import { styled } from "@mui/material/styles";
import { enums } from "../../enums";
import LogFile from "../../lib/LogFile";
import { toStructureData } from "../../hooks/useLogFile";
import { types } from "../../types";

interface Props {
	logFile: LogFile;
	comparisonLogFile?: LogFile;
	selectedRows: number[];

	onClose: () => void;
	onSearchResults: (searchMatches: number[][], comparisonSearchMatches: number[][]) => void;
	onSearchHighlight: (match: number[]) => void;
}

interface LogFileProperties {
	logFileAsString: string;
	logEntryCharIndexMaps: LogEntryCharMaps;
	selectedRows: types.TracyLogData[][]
}

interface State {
	wildcards: Wildcard[];
	structureEntries: StructureEntry[];
	isRemovingStructureEntries: boolean;
	isLoadingStructureDefintion: boolean;
	isStructureMatching: boolean;
	logFileHeaders: string[];
	structureHeaderColumnsTypes: enums.StructureHeaderColumnType[];
	logFileProperties: LogFileProperties;
	comparisonLogFileProperties?: LogFileProperties;
	structureMatches: number[][];
	currentStructureMatchIndex?: number;
}

export default class StructureDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);

		const { logFile, comparisonLogFile } = props;
		const logFileAsString = JSON.stringify(toStructureData(logFile), null, 2);
		const logEntryCharIndexMaps = useGetCharIndicesForLogEntries(logFileAsString);

		let comparisonLogFileProperties: LogFileProperties | undefined;
		if (comparisonLogFile) {
			const comparisonLogFileAsString = JSON.stringify(toStructureData(comparisonLogFile), null, 2);
			const comparisonLogEntryCharIndexMaps = useGetCharIndicesForLogEntries(comparisonLogFileAsString);
			comparisonLogFileProperties = {
				logFileAsString: comparisonLogFileAsString,
				logEntryCharIndexMaps: comparisonLogEntryCharIndexMaps,
				selectedRows: []
			}
		}

		const headers = logFile.getAllHeaders();
		const headerColumnTypes: enums.StructureHeaderColumnType[] = [];
		for (let header in headers) {
			if (logFile.customColumns[header]) {
				headerColumnTypes.push(enums.StructureHeaderColumnType.Custom);
			} else {
				headerColumnTypes.push(enums.StructureHeaderColumnType.Selected);
			}
		}

		const selectedRows = props.selectedRows
			.map((i) => logFile.getRow(i));

		let structureEntries = constructStructureEntriesArray(headerColumnTypes, selectedRows);
		structureEntries = removeLastStructureLink(structureEntries);

		this.state = {
			isRemovingStructureEntries: false,
			isLoadingStructureDefintion: false,
			isStructureMatching: false,
			logFileHeaders: logFile.getAllHeaders(),
			structureHeaderColumnsTypes: headerColumnTypes,
			structureEntries: structureEntries,
			wildcards: [],
			logFileProperties: {
				logFileAsString,
				logEntryCharIndexMaps,
				selectedRows
			},
			comparisonLogFileProperties,
			structureMatches: []
		};

		//bind context for all functions used by the context and dropdown menus:
		this.createWildcard = this.createWildcard.bind(this);
	}

	shouldComponentUpdate(
		nextProps: Readonly<Props>,
		nextState: Readonly<State>,
		_nextContext: any,
	): boolean {
		const isLoadingStructureDefinition = false;
		const islogFileUpdating = !isEqual(
			this.props.logFile,
			nextProps.logFile,
		);
		const isNumberOfMatchesUpdating = !isEqual(
			this.state.structureMatches.length,
			nextState.structureMatches.length,
		);

		const areHeaderColumnTypesUpdating = !isEqual(
			this.state.structureHeaderColumnsTypes,
			nextState.structureHeaderColumnsTypes,
		);
		const areStateEntriesUpdating = !isEqual(
			this.state.structureEntries,
			nextState.structureEntries,
		);
		const areWildcardsUpdating = !isEqual(this.state.wildcards, nextState.wildcards);
		const isRemovingStructureEntriesUpdating = !isEqual(
			this.state.isRemovingStructureEntries,
			nextState.isRemovingStructureEntries,
		);
		const isStructureMatchingUpdating = !isEqual(
			this.state.isStructureMatching,
			nextState.isStructureMatching,
		);

		if (
			isLoadingStructureDefinition ||
			islogFileUpdating ||
			isNumberOfMatchesUpdating ||
			areHeaderColumnTypesUpdating ||
			areStateEntriesUpdating ||
			areWildcardsUpdating ||
			isRemovingStructureEntriesUpdating ||
			isStructureMatchingUpdating
		) {
			return true;
		}

		return false;
	}

	getContextMenuItems() {
		const contextMenuItems: ContextMenuItem[] = [];

		const createWildcardItem: ContextMenuItem = {
			text: "Create wildcard",
			callback: () => this.createWildcard(),
		};

		contextMenuItems.push(createWildcardItem);

		if (this.state.wildcards.length > 0) {
			this.state.wildcards.forEach((wc, index) => {
				const useWildcardItem: ContextMenuItem = {
					text: `Use wildcard ?${index + 1}`,
					callback: () => this.useWildcard(index),
				};

				contextMenuItems.push(useWildcardItem);
			});

			const removeWildcardItem: ContextMenuItem = {
				text: "Remove wildcard",
				callback: (anchorDivId) => this.removeWildcard(anchorDivId),
			};

			contextMenuItems.push(removeWildcardItem);
		}

		return contextMenuItems;
	}

	removeStructureEntry(rowIndex: number) {
		const { structureEntries, wildcards } = this.state;
		const wildcardsCopy = cloneDeep(wildcards);

		const wildcardRemovalResults = removeWildcardSubstitutionsForStructureEntry(
			wildcardsCopy,
			rowIndex,
		);
		const modifiedWildcards = wildcardRemovalResults.modifiedWildcards;

		const remainingEntries = removeStructureEntryFromList(structureEntries, rowIndex);

		wildcardRemovalResults.indicesOfWildcardsToBeRemoved.forEach((index) => {
			updateStructureEntriesAfterWildcardDeletion(remainingEntries, modifiedWildcards, index);
		});

		if (remainingEntries.length === 0) {
			this.props.onClose();
		} else {
			this.setState({
				structureEntries: remainingEntries,
				wildcards: modifiedWildcards,
				isStructureMatching: false,
			});
		}
	}

	toggleIsRemovingStructureEntries() {
		const isRemovingStructureEntries = this.state.isRemovingStructureEntries;
		this.setState({
			isRemovingStructureEntries: !isRemovingStructureEntries,
		});
	}

	toggleIsCellSelected(
		structureEntryIndex: number,
		cellIndex: number,
		isCtrlPressed: boolean,
		isShiftPressed: boolean,
	) {
		if (isCtrlPressed) {
			const { structureHeaderColumnsTypes, structureEntries } = this.state;
			let structureEntriesCopy = cloneDeep(structureEntries);

			structureEntriesCopy = toggleCellSelection(
				structureHeaderColumnsTypes,
				structureEntriesCopy,
				structureEntryIndex,
				cellIndex,
				isShiftPressed,
			);

			this.setState({ structureEntries: structureEntriesCopy });
		}
	}

	toggleStructureLink(structureEntryIndex: number) {
		let { structureEntries } = this.state;
		const structureEntriesCopy = cloneDeep(structureEntries);

		structureEntries = toggleStructureLink(structureEntriesCopy, structureEntryIndex);

		this.setState({ structureEntries: structureEntries });
	}

	matchStructure() {
		// pass list of wildcards and use those in regular expression construction
		const structureRegExp = useStructureQueryConstructor(
			this.state.logFileHeaders,
			this.state.structureHeaderColumnsTypes,
			this.state.structureEntries,
			this.state.wildcards,
		);

		this.handleStructureMatching(structureRegExp)
		this.setState({ isStructureMatching: true });
	}

	handleStructureMatching(expression: string) {
		const primaryMatches = this.findStructureMatches(expression, this.state.logFileProperties);
		const comparisonMatches = (this.state.comparisonLogFileProperties && this.findStructureMatches(expression, this.state.comparisonLogFileProperties)) ?? [];
		let currentStructureMatchIndex: number | undefined;
		let currentStructureMatch: number[];

		if (primaryMatches.length >= 1) {
			currentStructureMatchIndex = 0;
			currentStructureMatch = primaryMatches[0];
		} else {
			currentStructureMatchIndex = undefined;
			currentStructureMatch = [];
		}

		this.props.onSearchResults(primaryMatches, comparisonMatches);

		this.setState({
			structureMatches: primaryMatches,
			currentStructureMatchIndex
		});
	}

	findStructureMatches(expression: string, logFileProperties: LogFileProperties) {
		const { logFileAsString, logEntryCharIndexMaps } = logFileProperties;

		return useStructureRegularExpressionSearch(
			expression,
			logFileAsString,
			logEntryCharIndexMaps,
		);
	}

	handleStructureNavigation(isGoingForward: boolean) {
		const { structureMatches } = this.state;
		const matchCount = structureMatches.length;
		let currentMatchIndex = this.state.currentStructureMatchIndex;

		if (currentMatchIndex === undefined) {
			return;
		}

		currentMatchIndex += isGoingForward ? 1 : -1;

		if (currentMatchIndex === matchCount) {
			currentMatchIndex = 0;
		}
		if (currentMatchIndex < 0) {
			currentMatchIndex = matchCount -1;
		}

		const match = structureMatches[currentMatchIndex];
		this.props.onSearchHighlight(match);

		this.setState({
			currentStructureMatchIndex: currentMatchIndex,
		}, () => this.forceUpdate());
	}

	createWildcard() {
		const selection = getSelection();
		const range = selection!.getRangeAt(0);
		const startNode = range.startContainer;
		const endNode = range.endContainer;
		const startOffset = range.startOffset;
		const endOffset = range.endOffset;
		const parentDivId = (startNode.parentNode as Element).id;

		if (startNode.textContent === endNode.textContent && startOffset !== endOffset) {
			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);

			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const newWildcard = createWildcard(entryIndex, cellIndex, contentsIndex);

			wildcardsCopy.push(newWildcard);

			const wildcardIndex = wildcardsCopy.length - 1;
			const modifiedStructureEntries = addWildcardToStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const insertionResults = insertWildcardIntoCellsContents(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
				contentsIndex,
				startOffset,
				endOffset,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
			wildcardsCopy = insertionResults.wildcards;

			wildcardsCopy[wildcardIndex].wildcardSubstitutions[0].contentsIndex =
				insertionResults.insertedWildcardContentsIndex;

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
			});
		}
	}

	useWildcard(wildcardIndex: number) {
		const selection = getSelection();
		const range = selection!.getRangeAt(0);
		const startNode = range.startContainer;
		const endNode = range.endContainer;
		const startOffset = range.startOffset;
		const endOffset = range.endOffset;
		const parentDivId = (startNode.parentNode as Element).id;

		if (startNode.textContent === endNode.textContent && startOffset !== endOffset) {
			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const indicesForWildcard = getIndicesForWildcardFromDivId(parentDivId);

			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const modifiedStructureEntries = addWildcardToStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const insertionResults = insertWildcardIntoCellsContents(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
				contentsIndex,
				startOffset,
				endOffset,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = insertionResults.cellContents;
			wildcardsCopy = insertionResults.wildcards;

			const newWildcardSubstitution = {
				entryIndex: entryIndex,
				cellIndex: cellIndex,
				contentsIndex: insertionResults.insertedWildcardContentsIndex,
			};
			wildcardsCopy[wildcardIndex].wildcardSubstitutions.push(newWildcardSubstitution);

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
			});
		}
	}

	removeWildcard(anchorDivId: string) {
		const isAnchorDivWildcard = anchorDivId[0] === "w";

		if (isAnchorDivWildcard) {
			const indicesForWildcard = anchorDivId.split("-");
			const entryIndex = +indicesForWildcard[1];
			const cellIndex = +indicesForWildcard[2];
			const contentsIndex = +indicesForWildcard[3];

			const { structureEntries, wildcards } = this.state;
			const structureEntriesCopy: StructureEntry[] = cloneDeep(structureEntries);
			let wildcardsCopy: Wildcard[] = cloneDeep(wildcards);

			const wildcardIndex = getWildcardIndex(wildcardsCopy, entryIndex, cellIndex, contentsIndex);

			const wildcardsUpdateResult = removeWildcardSubstitution(
				wildcardsCopy,
				wildcardIndex,
				entryIndex,
				cellIndex,
				contentsIndex,
			);
			wildcardsCopy = wildcardsUpdateResult.wildcards;

			let modifiedStructureEntries = removeWildcardFromStructureEntry(
				structureEntriesCopy,
				entryIndex,
				cellIndex,
				wildcardIndex,
			);

			const removalResults = removeWildcardFromCellContent(
				structureEntriesCopy[entryIndex].row[cellIndex],
				wildcardsCopy,
				entryIndex,
				cellIndex,
				contentsIndex,
			);
			structureEntriesCopy[entryIndex].row[cellIndex] = removalResults.cellContents;

			wildcardsCopy = removalResults.wildcards;

			if (wildcardsUpdateResult.isWildcardDeleted) {
				modifiedStructureEntries = updateStructureEntriesAfterWildcardDeletion(
					modifiedStructureEntries,
					wildcardsCopy,
					wildcardIndex,
				);
			}

			this.setState({
				structureEntries: modifiedStructureEntries,
				wildcards: wildcardsCopy,
				isStructureMatching: false,
			});
		}
	}

	render() {
		const { structureEntries, wildcards, isRemovingStructureEntries, isStructureMatching } =
			this.state;
		const structureEntriesCopy = cloneDeep(structureEntries);
		const wildcardsCopy = cloneDeep(wildcards);
		const contextMenuItems = this.getContextMenuItems();

		const CustomWidthTooltip = styled(({ className, ...props }: TooltipProps) => (
			<Tooltip {...props} classes={{ popper: className }} />
		))({
			[`& .${tooltipClasses.tooltip}`]: {
				maxWidth: 900,
			},
		});

		const selection = getSelection();

		if (selection !== null) {
			// empty unwanted text selection resulting from Shift-click
			selection.empty();
		}

		return (
			<div style={structureDialogBackdropStyle}>
				<div className="dialog" style={structureDialogDialogStyle}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							flexDirection: "row",
							alignItems: "top",
						}}
					>
						<div className="title-small">Structure Matching</div>
						<div
							style={{
								display: "flex",
								flexDirection: "row",
								alignItems: "center",
								justifyContent: "space-between",
							}}
						>
							<CustomWidthTooltip
								title={
									<>
										<h2 style={{ fontSize: "32px", fontWeight: "bold" }}>Help</h2>
										<ul>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Ignoring cells</b>: Hold <b>CTRL</b> and click on a cell to ignore it or
												stop ignoring it. Hold <b>SHIFT+CTRL</b> to ignore the cell and stop
												ignoring all others, or ignore all other cells instead.{" "}
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Constraining distance between structure rows</b>: Change the constraint
												on the distance between two rows by clicking on the link icon between them.
												This icon is three horizontal dots by default.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Creating wildcards</b>: Selecting a part of the text in a cell, right
												click and select &quot;<i>Create wildcard</i>&quot; to create a new
												wildcard. A wildcard can be used to abstract away any specific data.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Using wildcards</b>: Selecting a part of the text in a cell, right click
												and select &quot;<i>Use wildcard wildcard id</i>&quot;. Any value could be
												abstracted by the wildcard, but the value has to be the same in all places
												where this wildcard is used.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Removing wildcards</b>: Hover over a wildcard, right click and select
												&quot;<i>Remove wildcard</i>&quot;. If the wildcard is used in multiple
												places, only the selected one will be removed.
											</li>
											<li style={{ fontSize: "14px", padding: "10px", listStyleType: "circle" }}>
												<b>Removing rows</b>: Click on the <b>Remove rows</b> button on the bottom
												right of the dialogue. A red cross will appear to the left of every row in
												the structure, by clicking on a cross, the row will be removed from the
												structure. Click the<b>Done</b> button afterwards.
											</li>
										</ul>
									</>
								}
								sx={{ m: 1 }}
								placement="right"
								arrow
							>
								<i className="codicon codicon-question" />
							</CustomWidthTooltip>
							<IconButton
								id="close-button"
								aria-label="close"
								size="small"
								style={{ flex: 1 }}
								onClick={() => this.props.onClose()}
							>
								<CloseIcon className="structure-dialog-icon" fontSize="small" />
							</IconButton>
						</div>
					</div>
					<StructureTable
						headerColumns={this.state.logFileHeaders}
						structureEntries={structureEntriesCopy}
						wildcards={wildcardsCopy}
						isRemovingStructureEntries={isRemovingStructureEntries}
						onToggleIsCellSelected={(
							structureEntryIndex,
							cellIndex,
							isCtrlPressed,
							isShiftPressed,
						) =>
							this.toggleIsCellSelected(
								structureEntryIndex,
								cellIndex,
								isCtrlPressed,
								isShiftPressed,
							)
						}
						onToggleStructureLink={(structureEntryIndex) =>
							this.toggleStructureLink(structureEntryIndex)
						}
						onStructureEntryRemoved={(structureEntryIndex) =>
							this.removeStructureEntry(structureEntryIndex)
						}
					/>
					<ContextMenu items={contextMenuItems} parentDivId="StructureDialog" />
					<div style={{ textAlign: "right", padding: "5px" }}>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.toggleIsRemovingStructureEntries();
							}}
						>
							{isRemovingStructureEntries ? "Done" : "Remove rows"}
						</VSCodeButton>
						<VSCodeButton
							className="structure-result-element"
							onClick={() => {
								this.matchStructure();
							}}
							disabled={isRemovingStructureEntries}
						>
							Search for Structure
						</VSCodeButton>
						{isStructureMatching && (
							<>
								<div
									className="structure-result-element"
									style={{
										display: "inline-block",
										padding: "3.75px",
									}}
								>
									{" "}
									{(this.state.currentStructureMatchIndex ?? -1) + 1}{" "}
									of {this.state.structureMatches.length}
								</div>
								{this.state.structureMatches.length > 1 && (
									<>
										<VSCodeButton
											className="structure-result-element"
											appearance="icon"
											onClick={() => this.handleStructureNavigation(false)}
										>
											<i className="codicon codicon-chevron-up" />
										</VSCodeButton>
										<VSCodeButton
											className="structure-result-element"
											appearance="icon"
											onClick={() => this.handleStructureNavigation(true)}
										>
											<i className="codicon codicon-chevron-down" />
										</VSCodeButton>
									</>
								)}
							</>
						)}
					</div>
				</div>
			</div>
		);
	}
}