import Rule from "../rules/Rule";
import { CustomColumn, LogFileData } from "../interfaces";
import { types } from "../types";

export default class LogFile {
	private readonly fileData: LogFileData;
	readonly customColumns: { [key: string]: CustomColumn<any> };

	constructor(fileData: LogFileData, customColumns: { [key: string]: CustomColumn<any> } = {}) {
		this.fileData = fileData;
		this.customColumns = customColumns;
	}

	updateLogFile(rules: Rule[]): LogFile {
		this.registerCustomColumns(rules.map((r) => r.toCustomColumn()));
		return new LogFile(this.fileData, this.customColumns);
	}

	registerCustomColumns(columns: CustomColumn<types.TracyLogData>[]) {
		for (let i = 0; i < columns.length; i++) {
			this.registerCustomColumn(columns[i]);
		}
	}

	registerCustomColumn(column: CustomColumn<types.TracyLogData>) {
		this.customColumns[column.header] = column;
	}

	unRegisterCustomColumn(header: string) {
		delete this.customColumns[header];
	}

	amountOfRows = () => this.fileData.rows.length;
	isEmpty = () => this.amountOfRows() === 0;

	getAllHeaders() {
		const customHeadersLeft = Object.keys(this.customColumns)
			.map((key) => this.customColumns[key])
			.filter((c) => (c.alignment ?? 'right') === 'left')
			.map((c) => c.header);
		const customHeadersRight = Object.keys(this.customColumns)
			.map((key) => this.customColumns[key])
			.filter((c) => (c.alignment ?? 'right') === 'right')
			.map((c) => c.header);
		return [
			...customHeadersLeft,
			...this.fileData.headers,
			...customHeadersRight
		];
	}

	getCustomColumns(): CustomColumn<types.TracyLogData>[] {
		return Object.keys(this.customColumns)
			.map((header) => this.customColumns[header]);
	}

	amountOfColumns = () => this.getAllHeaders().length;

	dateTimeColumn = () => this.fileData.dateTimeIndex !== undefined ? this.fileData.headers[this.fileData.dateTimeIndex] : undefined;

	filePath = () => this.fileData.filePath;

	values(column: string): types.TracyLogData[] {
		const customColumn = this.customColumns[column];
		if (customColumn) {
			return customColumn.getValues(this);
		}

		const columnIndex = this.fileData.headers
			.indexOf(column);
		if (columnIndex === -1) {
			return [];
		}
		
		return this.fileData.rows.map((r) => r[columnIndex]);
	}

	getRow(i: number): types.TracyLogData[] {
		if (i < 0 || i >= this.amountOfRows()) {
			return [];
		}

		const customColumnValuesLeft = Object.keys(this.customColumns)
			.map((key) => this.customColumns[key])
			.filter((c) => (c.alignment ?? 'right') === 'left')
			.map((c) => c.getValues(this)[i]);
		const customColumnValuesRight = Object.keys(this.customColumns)
				.map((key) => this.customColumns[key])
				.filter((c) => (c.alignment ?? 'right') === 'right')
				.map((c) => c.getValues(this)[i]);

		return [
			...customColumnValuesLeft,
			...this.fileData.rows[i],
			...customColumnValuesRight
		];
	}

	value(column: string, row: number): types.TracyLogData {
		return this.values(column)[row];
	}
}
