import React from "react";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";

interface Props {
	filepath: string;
	onClose: () => void;
}

interface State {
}

const BACKDROP_STYLE: React.CSSProperties = {
	height: "100vh",
	width: "100vw",
	backgroundColor: "#00000030",
	position: "absolute",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
};

const DIALOG_STYLE: React.CSSProperties = {
	height: "100px",
	width: "600px",
	padding: "5px",
	display: "flex",
	overflow: "auto",
	zIndex: 100
};

export default class ExportDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
	}


	render() {
		return (
			<div style={BACKDROP_STYLE}>
				<div className="dialog" style={DIALOG_STYLE}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							flexDirection: "row",
							alignItems: "top",
							position: "relative",
						}}
					>
						<div 
							style={{
								marginBottom: "20px",
								
							}}
						>
							<p>Data has been successfully exported to filepath:</p>
							<p>{this.props.filepath}</p>
						</div>

						<VSCodeButton
							style={{
								position: "absolute",
								right: "10px",
								bottom: "10px",
							}}
							onClick={() => this.props.onClose()}
						>
							Ok
						</VSCodeButton>
					</div>
				</div>
			</div>
		);
	}
}
