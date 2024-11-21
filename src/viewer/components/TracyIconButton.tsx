import { Tooltip } from "@mui/material";
import { VSCodeButton } from "@vscode/webview-ui-toolkit/react";
import React from "react";

interface Props {
    tooltip: string;
    icon: IconType;
    onClick: () => void;
}

export enum IconType {
    Tag = 'codicon codicon-tag',
    SettingsGear = 'codicon codicon-settings-gear',
    SymbolColor = 'codicon codicon-symbol-color',
    ArrowUp = 'codicon codicon-arrow-up',
    ArrowDown = 'codicon codicon-arrow-down',
    Link = 'codicon codicon-link',
    Calendar = 'codicon codicon-calendar',
    ThreeBars = 'codicon codicon-three-bars'
}

export default class TracyIconButton extends React.Component<Props, {}> {
    render() {
        return (
            <Tooltip
                title={<h3>{this.props.tooltip}</h3>}
                placement="bottom"
                arrow={true}
            >
                <VSCodeButton
                    appearance="icon"
                    onClick={this.props.onClick}
                >
                    <i className={this.props.icon} />
                </VSCodeButton>
            </Tooltip>
        );
    }
}