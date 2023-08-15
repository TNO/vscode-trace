import React, { ReactNode } from 'react';
import ReactResizeDetector from 'react-resize-detector'
import Tooltip from '@mui/material/Tooltip'
import { Header, StructureEntry, Wildcard } from '../types';
import { LOG_HEADER_HEIGHT, LOG_ROW_HEIGHT, BORDER_SIZE, LOG_COLUMN_WIDTH_LOOKUP, LOG_DEFAULT_COLUMN_WIDTH, STRUCTURE_WIDTH, STRUCTURE_LINK_HEIGHT, StructureLinkDistance} from '../constants';
import { getStructureTableColumnStyle, getStructureTableHeaderStyle, getHeaderColumnStyle, getHeaderColumnInnerStyle, 
         getStructureTableCellSelectionStyle, getStructureTableEntryIconStyle, getStructureTableRowStyle, getStructureTableLinkStyle } from '../hooks/useStyleManager';
import { getReactElementsFromCellContents } from '../hooks/useWildcardManager'; 
import isEqual from 'lodash/isEqual'; 
       

interface Props {
    headerColumns: Header[];
    structureEntries: StructureEntry[]; 
    wildcards: Wildcard[];
    isRemovingStructureEntries: boolean;
    onToggleStructureLink: (structureEntryIndex: number) => void;
    onStructureEntryRemoved: (structureEntryIndex: number) => void;
    onToggleIsCellSelected: (structureEntryIndex: number, cellIndex: number, isCtrlPressed: boolean, isShiftPressed: boolean) => void;
}

interface State {
    columnWidth: { [id: string]: number };
}

export default class StructureTable extends React.Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {columnWidth: LOG_COLUMN_WIDTH_LOOKUP};
    }

    shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, _nextContext: any): boolean {
        const areStructureEntriesUpdating = !(isEqual(this.props.structureEntries, nextProps.structureEntries));
        const areWildcardsUpdating = !(isEqual(this.props.wildcards, nextProps.wildcards));
        const isRemovingStructureEntriesUpdating = !(isEqual(this.props.isRemovingStructureEntries, nextProps.isRemovingStructureEntries));
        const isColumnWidthUpdating = !(isEqual(this.state.columnWidth, nextState.columnWidth));

        if(areStructureEntriesUpdating || areWildcardsUpdating || isRemovingStructureEntriesUpdating || isColumnWidthUpdating){
            return true;
        }

        return false;
    }

    setColumnWidth(name: string, width: number) {
        this.setState(prevState => {
            const columnWidth = {...prevState.columnWidth};
            columnWidth[name] = width;
            return {columnWidth};
        });
    }

    columnWidth(name: string) {
        return this.state.columnWidth[name] ?? LOG_DEFAULT_COLUMN_WIDTH;
    }

    renderHeaderColumn(value: string, columnIndex: number, width: number) {
        const height = LOG_HEADER_HEIGHT;
        const widthNew = columnIndex !== 0 ? width + BORDER_SIZE : width;
        const headerColumnStyle = getHeaderColumnStyle(widthNew, columnIndex, height);
        const headerColumnInnerStyle = getHeaderColumnInnerStyle(height, true);
        return (
            <ReactResizeDetector handleWidth key={columnIndex} onResize={(width)=>this.setColumnWidth(value, width!)}>
            <div className="resizable-content" style={headerColumnStyle} key={columnIndex}>
                <div style={headerColumnInnerStyle}>
                    {value}
                </div>
            </div>
            </ReactResizeDetector>
        );
    }

    renderHeader(containerWidth: number) {
        const style = getStructureTableHeaderStyle(containerWidth);

        return (
            <div id='structureHeader' style={style}>
                <div className="header-background">
                    {this.props.headerColumns.map((h, i) => this.renderHeaderColumn(h.name, i, this.columnWidth(h.name)))}
                </div>
            </div> 
        );
    }

    renderColumn(rowIndex: number, cellIndex: number, width: number) {
        const {structureEntries} = this.props;
        const widthNew = cellIndex !== 0 ? width + BORDER_SIZE : width;
        const columnStyle = getStructureTableColumnStyle(widthNew, cellIndex);
        const columnInnerStyle = getStructureTableCellSelectionStyle(structureEntries, rowIndex, cellIndex);

        const allCellContents:ReactNode[] = [];

        structureEntries[rowIndex].row[cellIndex].forEach(contentsPart => {
            const contentPartDiv = getReactElementsFromCellContents(rowIndex, cellIndex,contentsPart.contentsIndex, contentsPart.wildcardIndex, contentsPart.textValue);
            allCellContents.push(contentPartDiv);
        });

        return (
            <div style={columnStyle} key={cellIndex}>
                <div id={`${rowIndex}-${cellIndex}`} style={columnInnerStyle} onClick={(event) => this.props.onToggleIsCellSelected(rowIndex, cellIndex, event.ctrlKey, event.shiftKey)}>
                    {allCellContents.map(value => value)}
                </div>
            </div>
        );
    }

    renderRows(containerWidth: number, containerHeight: number) {
        const newContainerWidth = containerWidth + STRUCTURE_WIDTH;
        const result: ReactNode[] = [];
        const {structureEntries, isRemovingStructureEntries, headerColumns, onStructureEntryRemoved} = this.props;
        const structureEntryIconStyle = getStructureTableEntryIconStyle(isRemovingStructureEntries);
        let structureLinkIndex = 0;

        for (let r = 0; r < structureEntries.length; r++) {
            const rowStyle = getStructureTableRowStyle(r, structureLinkIndex);

            result.push(
                <div key={r} style={rowStyle}>
                    {!isRemovingStructureEntries && <div style={structureEntryIconStyle}><i style={{padding: '6px'}}className='codicon codicon-circle-filled'/></div>}
                    {isRemovingStructureEntries && <div style={structureEntryIconStyle} onClick={() => {onStructureEntryRemoved(r)}}><i style={{padding: '6px', cursor:'pointer'}} className='codicon codicon-close'/></div>}
                    {headerColumns.map((h, c) => 
                        this.renderColumn(r, c, this.columnWidth(h.name)))
                    }
                </div>
            );

            if(r !== structureEntries.length - 1) {
                const structureLinkStyle = getStructureTableLinkStyle(r, structureLinkIndex);

                const structureLinkDistance = structureEntries[r].structureLink;

                result.push(
                    <div key={'l' + structureLinkIndex} style={structureLinkStyle} onClick={() => this.props.onToggleStructureLink(r)}>
                        {structureLinkDistance === StructureLinkDistance.Max && <Tooltip title={<h3>Allow maximal number of rows in-between</h3>} placement="right" arrow><i className='codicon codicon-kebab-vertical' /></Tooltip>}
                        {structureLinkDistance === StructureLinkDistance.None && <Tooltip title={<h3>Disallow rows in-between</h3>} placement="right" arrow><i className='codicon codicon-arrow-down' /></Tooltip>}
                        {structureLinkDistance === StructureLinkDistance.Min && <Tooltip title={<h3>Allow minimal number of rows in-between</h3>} placement="right" arrow><i className='codicon codicon-ellipsis' /></Tooltip>}
                    </div>
                );
                structureLinkIndex++;
            }
        }

        return(
            <div id="structureRows" style={{width: newContainerWidth, height: containerHeight, position: 'relative', overflow: 'auto'}}>
                {result}
            </div>
        );
    }

    render() {
        const {headerColumns, structureEntries} = this.props;
        const numberOfRows = structureEntries.length;
        const containerHeight = numberOfRows * LOG_ROW_HEIGHT + (numberOfRows - 1) * STRUCTURE_LINK_HEIGHT;
        const containerWidth = ((headerColumns.length - 1) * BORDER_SIZE) +
        headerColumns.reduce((partialSum: number, h) => partialSum + this.columnWidth(h.name), 0);
        
        return (
            <div id="structureTable" style={{flex: 1, display: 'inline-block', flexDirection: 'column', overflow: 'auto'}}>
                    {this.renderHeader(containerWidth)}
                    {this.renderRows(containerWidth, containerHeight)}
            </div>
    );
    }
}