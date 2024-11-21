import React from "react";
import LogFile from "../../lib/LogFile";
import { ColumnSelection, LogViewState, RowProperty } from "../../interfaces";
import { constants } from "../../constants";
import { isColumnVisibleMinimap } from "../../hooks/useColumnSelection";

interface Props {
	logFile: LogFile;
	columnSelection: ColumnSelection;
	logViewState: LogViewState;
	visibleItems: number;
	forwardRef: React.RefObject<HTMLDivElement>;
	rowProperties: RowProperty[];
    onRequestColors: (column: string) => string[];
	onMinimapScaleChange(visibleItems: number): void;
}

interface State {
	controlDown: boolean;
}

export default class MinimapView extends React.Component<Props, State> {
	canvasRef: React.RefObject<HTMLCanvasElement>;

	constructor(props: Props) {
		super(props);
		this.canvasRef = React.createRef();
		this.handleWheel = this.handleWheel.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.state = { controlDown: false };
	}

	componentDidMount(): void {
		window.addEventListener("resize", () => this.draw());
		window.addEventListener("keydown", (e) => this.controlDownListener(e));
		window.addEventListener("keyup", (e) => this.controlUpListener(e));
		this.draw();
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: State): void {
		if (
			prevProps.logViewState !== this.props.logViewState ||
			prevProps.visibleItems !== this.props.visibleItems ||
			prevProps.logFile !== this.props.logFile ||
			prevProps.columnSelection !== this.props.columnSelection
		) {
			this.draw();
		}
	}

	draw() {
		// Clear and scale the canvas
		const canvas = this.canvasRef.current;
		if (!canvas || !this.props.logViewState) return;
		canvas.height = canvas.clientHeight * window.devicePixelRatio;
		canvas.width = canvas.clientWidth * window.devicePixelRatio;
		const ctx = canvas.getContext("2d")!;
		ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Hide Minimap if search did not return any rows
		if (this.props.logFile.amountOfRows() === 0) return;

		const {
			logViewState,
			visibleItems,
			logFile,
			columnSelection,
			rowProperties
		} = this.props;
		const {
			height, // Height of logView (pixels)
			scrollTop,
		} = logViewState;
		const maxVisibleItems = rowProperties.filter((r) => r.isRendered).length;
		const minVisibleItems = height / constants.LOG_ROW_HEIGHT;
		const fileHeight = maxVisibleItems * constants.LOG_ROW_HEIGHT;
		
		// Set minimap scale to number between 0 & 1. (1 = minimap 1:1, 0.5 = minimap 1:2)
		const scale = minVisibleItems / visibleItems;
		ctx.scale(1, scale);
		ctx.translate(0, scrollTop * -1);

		// Extra padding at the top is used when empty rows are displayed at the top of the logview
		const extraPaddingTop = scrollTop < 0 ? (-scrollTop) : 0;

		// Compute center & end
		const minimapEnd = scrollTop + height / scale;					// End of last visible part
		const minimapCenter = scrollTop + (minimapEnd - scrollTop) / 2;	// Center of visible part
		const logEnd = scrollTop + height + extraPaddingTop;			// End of last visible part
		const logCenter = scrollTop + (logEnd - scrollTop) / 2;			// Center of visible part

		// Try to center the logview port in the center of the minimap.
		// This is only possible when the user scrolled enough from top.
		// This code also makes sure that when scrolled to the end of the log file and zoomed out, the minimap stops at the bottom of the screen.
		const logMinimapCenterDiff = minimapCenter - logCenter;
		const miniMapScrollTop = Math.min(logMinimapCenterDiff, scrollTop);

		let scrollBottom =
			fileHeight < height
				? 0
				: Math.min(fileHeight + miniMapScrollTop - minimapEnd, 0);

		// If the logView is displaying empty lines at the bottom of the screen (in side-by-side), continue scrolling up the minimap until it disapears.
		if (logEnd > fileHeight && scrollBottom !== 0) {
			scrollBottom -= (fileHeight - logEnd);
		}

		ctx.translate(0, miniMapScrollTop - scrollBottom);

		// Draw blocks
		let index = 0; //for caculating the position
		for (let columnIndex = 0; columnIndex < logFile.amountOfColumns(); columnIndex++) {
			const header = logFile.getAllHeaders()[columnIndex];
			if (isColumnVisibleMinimap(header, logFile, columnSelection)) {
				const colors = this.props.onRequestColors(header);
				let counter = 0; //increase only when row is rendered
				for (let i = 0; i < colors.length; i++) {
					if (
						rowProperties[i].isRendered
					) {
						ctx.beginPath();
						ctx.fillStyle = colors[i];
						ctx.fillRect(
							index * constants.MINIMAP_COLUMN_WIDTH,
							(counter * constants.LOG_ROW_HEIGHT + extraPaddingTop),
							constants.MINIMAP_COLUMN_WIDTH,
							constants.LOG_ROW_HEIGHT,
						);
						ctx.stroke();
						counter++;
					}
				}
				index++;
			}
		}

		// Draw the log viewport on top of the minimap (grey block)
		ctx.beginPath();
		ctx.fillStyle = "#d3d3d380";
		ctx.fillRect(0, scrollTop + extraPaddingTop, canvas.width, logEnd - (scrollTop + extraPaddingTop));
		ctx.stroke();
	}

	handleClick(e: React.MouseEvent<HTMLElement>) {
		const canvas = this.canvasRef?.current;
		if (!canvas) return;

		const bounding = canvas.getBoundingClientRect();
		let y = e.clientY;
		if (bounding != undefined) {
			y = e.clientY - bounding.top;
		}
		const { logViewState, visibleItems, logFile } = this.props;
		const {
			visibleItems: minVisibleItems,
			height,
			start: logStart,
			scrollTop: logScrollTop,
		} = logViewState;
		const maxVisibleItems = logFile.amountOfRows();
		const scaleItem = minVisibleItems / visibleItems;

		const minimapEnd = logScrollTop + height / scaleItem;
		const minimapCenter = logScrollTop + (minimapEnd - logScrollTop) / 2;
		const logEnd = (logStart + minVisibleItems) * constants.LOG_ROW_HEIGHT;
		const logCenter = logScrollTop + (logEnd - logScrollTop) / 2;

		const logMinimapCenterDiff = minimapCenter - logCenter;
		const scrollTopBox = Math.min(logMinimapCenterDiff, logScrollTop);
		const scrollBottom =
			minVisibleItems === maxVisibleItems
				? 0
				: Math.min(logFile.amountOfRows() * constants.LOG_ROW_HEIGHT + scrollTopBox - minimapEnd, 0);
		let nrOfRows = 0;
		let scrollTop = 0;
		if (scrollBottom < 0) {
			//scrollBottom becomes smaller than 0, when the log view scrolls to the last part of the log.
			nrOfRows = ((scrollTopBox - scrollBottom) * scaleItem - y) / (height / visibleItems); //number of rows to move, can be positive or negative
			scrollTop = (logStart - nrOfRows) * constants.LOG_ROW_HEIGHT;
		} else {
			nrOfRows = (y - scrollTopBox * scaleItem) / (height / visibleItems); //number of rows to move, can be positive or negative
			scrollTop = (logStart + nrOfRows) * constants.LOG_ROW_HEIGHT;
		}
		//when grey box meet the bottom of the log, the scroll top will not increase.
		const maximumScrollTop = (maxVisibleItems - minVisibleItems) * constants.LOG_ROW_HEIGHT;
		scrollTop = Math.min(maximumScrollTop, scrollTop);
		
		if (!this.props.forwardRef.current) return;
		this.props.forwardRef.current.scrollTo({top: scrollTop});
		this.draw();
	}

	handleWheel(e: React.WheelEvent<HTMLCanvasElement>) {
		if (!this.state.controlDown) {
			this.updateState(e.deltaY);
			return;
		}

		const maxVisibleItems = this.props.rowProperties.filter((r) => r.isRendered).length;
		const minVisibleItems = this.props.logViewState.visibleItems;

		// The hardcoded numbers in this formula don't have a meaning, they are used to tune the zooming speed.
		const newLines = e.deltaY / 30 * (this.props.visibleItems / maxVisibleItems * 20 + 1);

		// Limits the new visible item count between the max item count and item in log view
		const visibleItems = Math.max(Math.min(maxVisibleItems, this.props.visibleItems + newLines), minVisibleItems);

		this.props.onMinimapScaleChange(visibleItems);
	}

	updateState(scroll: number) {
		if (!this.props.forwardRef.current) return;
		const logViewElement = this.props.forwardRef.current;
		logViewElement.scrollTop = logViewElement.scrollTop + scroll;
	}

	controlDownListener(e: any) {
		if (e.key === "Control" && this.state.controlDown === false)
			this.setState({ controlDown: true });
	}

	controlUpListener(e: any) {
		if (e.key === "Control" && this.state.controlDown) this.setState({ controlDown: false });
	}

	render() {
		return (
			<div style={{ flex: 1, overflow: "hidden", display: "flex" }}>
				<canvas
					id="canvas"
					ref={this.canvasRef}
					style={{ width: "100%", height: "100%" }}
					onWheel={this.handleWheel}
					onClick={this.handleClick}
				/>
			</div>
		);
	}
}
