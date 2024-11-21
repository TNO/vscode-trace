import React from "react";
import LogFile from "../../lib/LogFile";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import { ColumnSelection } from "../../interfaces";

interface Props {
	logFile: LogFile;
	comparisonFile?: LogFile;
	selectedColumns: ColumnSelection;
	onClose: (selectedColumns: ColumnSelection) => void;
}

interface State {
	headers: string[];
	selectedColumns: ColumnSelection;
}

const BACKDROP_STYLE: React.CSSProperties = {
	width: "100vw",
	backgroundColor: "#00000030",
	position: "absolute",
	padding: "10px",
	zIndex: 100
};

const DIALOG_STYLE: React.CSSProperties = {
	height: "90",
	width: "70%",
	padding: "10px",
	display: "flex",
	flexDirection: "column",
	alignItems: "start",
	overflow: "auto",
};
const innerStyle: React.CSSProperties = {
	display: "flex",
	height: "20px",
	alignItems: "center",
	justifyContent: "center",
	flexDirection: "row",
	paddingLeft: "2px",
};

export default class SelectColDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		const { logFile, comparisonFile, selectedColumns } = this.props;

		const toggleablePrimaryHeaders = logFile.getAllHeaders()
			.filter((h) => logFile.customColumns[h]?.toggleable ?? true);
		const toggleableComparisonHeaders = comparisonFile?.getAllHeaders()
			.filter((h) => comparisonFile.customColumns[h]?.toggleable ?? true) ?? [];

		// Using a set to remove duplicate columns
		const headers: string[] = [...new Set([
			...toggleablePrimaryHeaders,
			...toggleableComparisonHeaders
		])];

		this.state = {
			selectedColumns,
			headers
		};
	}

	handleVisibilityChange(header: string, visibility: {logView?: boolean, miniMap?: boolean}) {
		// Update a clone of the original, original is compared to new in MinimapView.componentDidUpdate()
		const columns = {...this.state.selectedColumns};
		columns[header] = visibility;
		this.setState({selectedColumns: columns});
	}

	render() {
		return (
			<div style={BACKDROP_STYLE}>
				<div className="dialog" style={DIALOG_STYLE}>
					<div>
						<div style={innerStyle}>
							<div style={{ width: "150px" }}></div>
							<div style={{ width: "50px" }}>Table</div>
							<div style={{ width: "50px" }}>Minimap</div>
							<div style={{ marginLeft: "20px" }}>
								<VSCodeButton appearance="icon" onClick={() => this.props.onClose(this.state.selectedColumns)}>
									<i className="codicon codicon-close" />
								</VSCodeButton>
							</div>
						</div>
					</div>
					{
						this.state.headers.map((h, i) => (
							<ColumnItem
								key={i}
								header={h}
								visibility={this.state.selectedColumns[h]}
								onVisibilityChange={(visibility) => this.handleVisibilityChange(h, visibility)}
							/>
						))
					}
				</div>
			</div>
		);
	}
}

function ColumnItem(
	props: {
		header: string,
		visibility?: {logView?: boolean, miniMap?: boolean},
		onVisibilityChange: (visibility: {logView?: boolean, miniMap?: boolean}) => void
	}
) {
	return (
		<div>
			<div style={innerStyle}>
				<div style={{ width: "150px" }}>{props.header}</div>
				<div style={{ width: "50px" }}>
					<input
						type="checkbox"
						checked={props.visibility?.logView ?? true}
						onChange={(e) => props.onVisibilityChange({logView: e.target.checked, miniMap: props.visibility?.miniMap})}
					/>
				</div>
				<div style={{ width: "50px" }}>
					<input
						type="checkbox"
						checked={props.visibility?.miniMap ?? true}
						onChange={(e) => props.onVisibilityChange({logView: props.visibility?.logView, miniMap: e.target.checked})}
					/>
				</div>
			</div>
		</div>
	);
}