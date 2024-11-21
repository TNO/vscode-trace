import { State as AppState } from "../App";
import { TracyStoredState, VsCode } from "../interfaces";

export function setVsState(vscode: VsCode, partialState: Partial<TracyStoredState>) {
    const state = {...vscode.getState(), ...partialState};
    vscode.setState(state);
}

export function storeAppState(vscode: VsCode, state: AppState) {
    const {
        comparisonFile,
        showMinimapHeader,
        coloredTable,
        selectedColumns,
        currentDialog
    } = state;

    setVsState(vscode, {
        comparisonFile: comparisonFile?.filePath(),
        ui: {
            showMinimapHeader,
            coloredTable,
            selectedColumns,
            currentDialog
        }
    });
}