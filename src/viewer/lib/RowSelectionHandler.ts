export default class RowSelectionHandler {

	private lastSelectedRow?: number;
    private readonly selectedRows: boolean[];
    private readonly onSelectionChange: (selection: number[]) => void;

    constructor(onSelectionChange: (selection: number[]) => void) {
        this.selectedRows = [];
        this.onSelectionChange = onSelectionChange;
    }
    
	handleLogRowClick(rowIndex: number, event: React.MouseEvent) {
		if (!event.ctrlKey) {
			return;
		}

		const setSelected: boolean = !this.selectedRows[rowIndex];
		
		// (de)select section
		if (event.shiftKey && this.lastSelectedRow) {
			const start = Math.min(this.lastSelectedRow, rowIndex);
			const end = Math.max(this.lastSelectedRow, rowIndex);
			
			for (let i = start; i <= end; i++) {
				this.selectedRows[i] = setSelected;
			}
		} 
		// (de)select row
		else {
			this.selectedRows[rowIndex] = setSelected;
		}

        this.lastSelectedRow = rowIndex;

        const selectedRowIndices: number[] = [];
        for (let i = 0; i < this.selectedRows.length; i++) {
            if (this.selectedRows[i]) {
                selectedRowIndices.push(i);
            }
        }

        this.onSelectionChange(selectedRowIndices);
	}

	clearSelection() {
		this.lastSelectedRow = undefined;
		for (let i = 0; i < this.selectedRows.length; i++) {
			delete this.selectedRows[i];
		}

		this.onSelectionChange([]);
	}
}