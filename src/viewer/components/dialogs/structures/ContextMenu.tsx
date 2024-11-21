import React from "react";
import { ContextMenuItem } from "../../../interfaces";
import { getContextMenuItemStyle, getContextMenuStyle } from "../../../hooks/useStyleManager";
import { motion } from "framer-motion";

interface Props {
	parentDivId: string;
	items: ContextMenuItem[];
}

interface State {
	xPos: number;
	yPos: number;
	showMenu: boolean;
	selectedItemIndex: number | null;
	anchorDivId: string;
}

export default class ContextMenu extends React.PureComponent<Props, State> {
	parentDiv: HTMLElement | null;

	constructor(props: Props) {
		super(props);
		this.state = {
			xPos: 0,
			yPos: 0,
			showMenu: false,
			selectedItemIndex: null,
			anchorDivId: "",
		};
	}

	componentDidMount(): void {
		this.parentDiv = document.getElementById(this.props.parentDivId);
		if (this.parentDiv) {
			this.parentDiv.addEventListener("click", this.handleClick);
			this.parentDiv.addEventListener("contextmenu", this.handleContextMenu);
		}
	}

	componentWillUnmount(): void {
		if (this.parentDiv) {
			this.parentDiv.removeEventListener("click", this.handleClick);
			this.parentDiv.removeEventListener("contextmenu", this.handleContextMenu);
		}
	}

	handleClick = () => {
		if (this.state.selectedItemIndex !== null) {
			this.props.items[this.state.selectedItemIndex].callback(this.state.anchorDivId);
		}

		if (this.state.showMenu) this.setState({ showMenu: false, selectedItemIndex: null });
	};

	handleContextMenu = (e) => {
		e.preventDefault();
		const path = e.composedPath();

		this.setState({
			xPos: e.pageX,
			yPos: e.pageY,
			showMenu: true,
			anchorDivId: path[0].id,
		});
	};

	toggleSelectedOptionIndex(selectedOptionIndex: number) {
		this.setState({ selectedItemIndex: selectedOptionIndex });
	}

	clearSelectedOptionIndex() {
		this.setState({ selectedItemIndex: null });
	}

	renderMenuOptions() {
		const { items, parentDivId } = this.props;
		const result: any = [];

		for (let o = 0; o < items.length; o++) {
			const isSelected = o === this.state.selectedItemIndex;
			const contextMenuItemStyle = getContextMenuItemStyle(isSelected);

			result.push(
				<div
					key={`${parentDivId}-context-menu-${o}`}
					style={contextMenuItemStyle}
					onMouseEnter={() => this.toggleSelectedOptionIndex(o)}
				>
					{items[o].text}
				</div>,
			);
		}

		return result;
	}

	render() {
		const { items } = this.props;
		const { showMenu, xPos, yPos } = this.state;
		const contextMenuHeight = items.length * 28;
		const contextMenuWidth = 120;

		const contextMenuStyle = getContextMenuStyle(contextMenuHeight, contextMenuWidth, xPos, yPos);

		if (showMenu)
			return (
				<div style={contextMenuStyle} onMouseLeave={() => this.clearSelectedOptionIndex()}>
					<motion.div
						className="dialog"
						style={{ left: xPos, top: yPos }}
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.5 }}
					>
						<div style={{ margin: "4px" }}>{this.renderMenuOptions()}</div>
					</motion.div>
				</div>
			);
		else return null;
	}
}