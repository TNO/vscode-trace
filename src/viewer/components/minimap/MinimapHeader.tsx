import React from "react";
import { constants } from "../../constants";
import LogFile from "../../lib/LogFile";
import { getVisibleColumnsMinimap } from "../../hooks/useColumnSelection";
import { ColumnSelection } from "../../interfaces";

export default function MinimapHeader(
	props: {
		logFile: LogFile,
		selectedColumns: ColumnSelection,
		borderRight: boolean
	}
) {
	const minimapHeaders = getVisibleColumnsMinimap(props.logFile, props.selectedColumns);
	const minimapWidth = minimapHeaders.length * constants.MINIMAP_COLUMN_WIDTH;

	const style: any = { width: minimapWidth, ...constants.COLUMN_2_HEADER_STYLE };
	if (props.borderRight) {
		style.borderRight = constants.BORDER;
	}

	return (
		<div
			className="header-background"
			style={style}
		>
			<div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
				{
					minimapHeaders
						.map((h, i) => <HeaderItem key={i} header={h}/>)
				}
			</div>
		</div>
	)
}

function HeaderItem(
	props: {
		header: string
	}
) {
	const style: React.CSSProperties = {
		whiteSpace: "nowrap",
		width: constants.MINIMAP_COLUMN_WIDTH,
		display: "inline-block",
	};
	const innerStyle: React.CSSProperties = {
		display: "flex",
		height: "100%",
		paddingLeft: "2px",
	};
	return (
		<div key={props.header} style={style}>
			<div style={innerStyle} className="rotate">
				{props.header}
			</div>
		</div>
	);
}