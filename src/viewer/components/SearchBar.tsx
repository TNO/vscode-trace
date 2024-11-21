import { Tooltip } from "@mui/material";
import { VSCodeDropdown, VSCodeOption, VSCodeTextField, VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import React from "react";
import { returnSearchIndices } from "../hooks/useLogSearchManager";
import LogFile from "../lib/LogFile";
import { toDataGrid } from "../hooks/useLogFile";

interface Props {
	logFile: LogFile;
	comparisonLogFile?: LogFile;
	initialState?: State;
	onClear: () => void;
	onSearchResults: (filterSearch: boolean, searchMatches: number[], comparisonSearchMatches?: number[]) => void;
	onSearchHighlight: (resultIndex: number) => void;
	onStateChanged?: (newState: State) => void;
}

export interface State {
	searchColumn: string;
	searchText: string;

	// Search options
	reSearch: boolean; // Regex search
	wholeSearch: boolean; // Whole word search
	caseSearch: boolean; // case sensitive
	filterSearch: boolean; // Filter out none matching lines

	primarySearchMatches: number[];
	comparisonSearchMatches?: number[];
	currentSearchMatchIndex?: number;
}

const ALL_COLUMNS: string = "All";
const DEFAULT_SEARCH_STATE: State = {
	searchColumn: ALL_COLUMNS,
	searchText: '',
	reSearch: false,
	wholeSearch: false,
	caseSearch: false,
	filterSearch: false,
	primarySearchMatches: [],
	comparisonSearchMatches: [],
	currentSearchMatchIndex: undefined
}

export default class SearchBar extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.updateSearchMatches = this.updateSearchMatches.bind(this);

		if (props.initialState) {
			this.state = props.initialState;
			this.props.onSearchResults(this.state.filterSearch, this.state.primarySearchMatches, this.state.comparisonSearchMatches);
		} else {
			this.state = DEFAULT_SEARCH_STATE;
		}
	}

	componentDidUpdate(prevProps: Props, prevState: State) {
		const searchProperties = (state: State) => {
			return {
				searchColumn: state.searchColumn,
				reSearch: state.reSearch,
				wholeSearch: state.wholeSearch,
				caseSearch: state.caseSearch
			}
		}

		const searchProps = searchProperties(this.state);
		const prevSearchProps = searchProperties(prevState);
		// This seems to be the only way to compare two objects in js
		if (JSON.stringify(searchProps) !== JSON.stringify(prevSearchProps)) {
			this.updateSearchMatches();
		}

		if (this.props.onStateChanged) {
			this.props.onStateChanged(this.state);
		}
	}

	clearSearchField() {
		this.setState({
			searchText: '',
			filterSearch: false,
			primarySearchMatches: [],
			comparisonSearchMatches: [],
			currentSearchMatchIndex: undefined
		});
		this.props.onClear();
	}

	updateSearchMatches() {
		// Empty search field
		if (!this.state.searchText) {
			this.clearSearchField();
			return;
		}

		const { filterSearch } = this.state;
		const { logFile, comparisonLogFile } = this.props;

		let primarySearchMatches = this.preformSearchQuery(logFile) ?? [];
		let comparisonSearchMatches = comparisonLogFile ? this.preformSearchQuery(comparisonLogFile) : [];

		this.props.onSearchResults(filterSearch, primarySearchMatches, comparisonSearchMatches);

		this.setState({
			primarySearchMatches,
			comparisonSearchMatches,
			currentSearchMatchIndex: 0
		});
	}

	preformSearchQuery(logFile: LogFile): number[] | undefined {
		const { searchColumn, searchText, reSearch, wholeSearch, caseSearch } = this.state;

		const searchAllColums = searchColumn === ALL_COLUMNS;
		
		if (searchAllColums) {
			return returnSearchIndices(
				toDataGrid(logFile),
				searchText,
				reSearch,
				wholeSearch,
				caseSearch,
			);
		} else {
			return returnSearchIndices(
				logFile.values(searchColumn),
				searchText,
				reSearch,
				wholeSearch,
				caseSearch,
			);
		}
	}

	handleNavigation(isGoingForward: boolean) {
		let matches = this.state.primarySearchMatches;
		let currentMatchIndex = this.state.currentSearchMatchIndex;

		if (currentMatchIndex !== undefined) {
			if (isGoingForward) {
				currentMatchIndex =
					currentMatchIndex < matches.length - 1
						? currentMatchIndex + 1
						: 0;
			} else {
				currentMatchIndex =
					currentMatchIndex > 0
						? currentMatchIndex - 1
						: matches.length - 1;
			}

			this.setState({
				currentSearchMatchIndex: currentMatchIndex
			});
			this.props.onSearchHighlight(currentMatchIndex);
		}
	}

	setFilterSearch(enabled: boolean) {
		this.setState({filterSearch: enabled});
		this.props.onSearchResults(
			enabled, 
			this.state.primarySearchMatches, 
			this.state.comparisonSearchMatches
		);
	}

	render() {
		const selectionColumns = [...new Set([
			ALL_COLUMNS,
			...this.props.logFile.getAllHeaders(),
			...this.props.comparisonLogFile?.getAllHeaders() ?? []
		])];

		return (
			<>
				<VSCodeDropdown
					key="searchDropdown"
					value={this.state.searchColumn}
					style={{ marginRight: "5px" }}
					onChange={(e) => this.setState({searchColumn: e.target.value})}
				>
					{selectionColumns.map((col, col_i) => (
						<VSCodeOption key={col_i} value={col}>
							{col}
						</VSCodeOption>
					))}
				</VSCodeDropdown>
				<VSCodeTextField
					key="searchTextField"
					style={{ marginRight: "5px" }}
					placeholder="Search Text"
					value={this.state.searchText}
					onKeyDown={(e) => {if (e.key === 'Enter') this.updateSearchMatches()}}
					onInput={(e) => this.setState({searchText: e.target.value})}
				>
					<Tooltip title={<h3>Match Case</h3>} placement="bottom" arrow>
						<span
							slot="end"
							style={{
								backgroundColor: this.state.caseSearch ? "dodgerblue" : "",
								borderRadius: "20%",
								marginRight: "5px",
								cursor: "pointer",
							}}
							className="codicon codicon-case-sensitive"
							onClick={() => this.setState(({ caseSearch }) => ({ caseSearch: !caseSearch }))}
						></span>
					</Tooltip>
					<Tooltip title={<h3>Match Whole Word</h3>} placement="bottom" arrow>
						<span
							slot="end"
							style={{
								backgroundColor: this.state.wholeSearch ? "dodgerblue" : "",
								borderRadius: "20%",
								marginRight: "5px",
								cursor: "pointer",
							}}
							className="codicon codicon-whole-word"
							onClick={() => this.setState(({ wholeSearch }) => ({ wholeSearch: !wholeSearch }))}
						></span>
					</Tooltip>
					<Tooltip title={<h3>Use Regular Expression</h3>} placement="bottom" arrow>
						<span
							slot="end"
							style={{
								backgroundColor: this.state.reSearch ? "dodgerblue" : "",
								borderRadius: "20%",
								marginRight: "5px",
								cursor: "pointer",
							}}
							className="codicon codicon-regex"
							onClick={() => this.setState(({ reSearch }) => ({ reSearch: !reSearch }))}
						></span>
					</Tooltip>
					<Tooltip title={<h3>Clear</h3>} placement="bottom" arrow>
						<span
							slot="end"
							style={{ cursor: "pointer" }}
							className="codicon codicon-close"
							onClick={() => this.clearSearchField()}
						></span>
					</Tooltip>
				</VSCodeTextField>
				{" "}
				{this.state.primarySearchMatches.length === 0
					? "No Results"
					: `${this.state.currentSearchMatchIndex! + 1} of ${this.state.primarySearchMatches.length}`
				}
				<VSCodeButton
					className="structure-result-element"
					appearance="icon"
					disabled={this.state.primarySearchMatches.length < 2}
					onClick={() => this.handleNavigation(false)}
				>
					<i className="codicon codicon-chevron-up" />
				</VSCodeButton>
				<VSCodeButton
					className="structure-result-element"
					appearance="icon"
					disabled={this.state.primarySearchMatches.length < 2}
					onClick={() => this.handleNavigation(true)}
				>
					<i className="codicon codicon-chevron-down" />
				</VSCodeButton>
				<VSCodeButton
					className="structure-result-element"
					appearance="icon"
					disabled={this.state.primarySearchMatches.length < 1}
					onClick={() => this.setFilterSearch(!this.state.filterSearch) }
				>
					<i className={this.state.filterSearch ? 'codicon codicon-filter-filled' : 'codicon codicon-filter'} />
				</VSCodeButton>
			</>
		);
	}
}
