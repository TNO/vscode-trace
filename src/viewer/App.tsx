import React from 'react';
import LogView from './log/LogView';
import MinimapView from './minimap/MinimapView';
import { LogFile, LogViewState } from './types';
import { LOG_HEADER_HEIGHT, MINIMAP_COLUMN_WIDTH, BORDER } from './constants';
import MinimapColors from './minimap/MinimapColors';

interface Props {
}
interface State {
    logFile: LogFile | undefined;
    minimapColors: MinimapColors | undefined;
    logViewState: LogViewState | undefined;
    showRulesDialog: boolean;
}

const COLUMN_2_HEADER_STYLE = {
    height: LOG_HEADER_HEIGHT, display: 'flex', justifyContent: 'center', alignItems: 'center', borderLeft: BORDER, borderBottom: BORDER
};

export default class App extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {logFile: undefined, logViewState: undefined, minimapColors: undefined, showRulesDialog: false};

        window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
                const logFile = JSON.parse(message.text);
                const minimapColors = new MinimapColors(logFile);
                this.setState({logFile, minimapColors});
            }
        });

        // @ts-ignore
	    const vscode = acquireVsCodeApi();
        vscode.postMessage({type: 'update'});
    }

    render() {
        if (!this.state.logFile || !this.state.minimapColors) return;
        const minimapWidth = Object.keys(this.state.minimapColors.columnColors).length * MINIMAP_COLUMN_WIDTH;
        return (
            <div style={{display: 'flex', flexDirection: 'row', height: '100%'}}>
                <div style={{flex: 1, display: 'flex'}}>
                    <LogView 
                        logFile={this.state.logFile} 
                        onLogViewStateChanged={(logViewState) => this.setState({logViewState})}
                    />
                </div>
                <div style={{display: 'flex', flexDirection: 'column', width: minimapWidth}}>
                    <div className='header-background' style={COLUMN_2_HEADER_STYLE}>
                        {/* <VSCodeButton onClick={() => this.setState({showRulesDialog: true})}>Manage rules</VSCodeButton> */}
                    </div>
                    {this.state.logViewState && 
                        <MinimapView 
                            logFile={this.state.logFile} 
                            logColors={this.state.minimapColors} 
                            logViewState={this.state.logViewState}/>
                    }
                </div>
                {/* { this.state.showRulesDialog && <RulesDialog onClose={() => this.setState({showRulesDialog: false})}/> } */}
            </div>
        );
    }
}
