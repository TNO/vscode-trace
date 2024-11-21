import { CustomColumn } from "../interfaces";
import CachingColumn from "../lib/columns/CachingColumn";
import LogFile from "../lib/LogFile";

export default abstract class Rule {
	readonly column: string;
	readonly description: string;
	abstract readonly ruleType: string;
	static ruleType = "ShouldBeOverridden"; // TypeScript does not support abstract static

	constructor(column: string, description: string) {
		this.column = column;
		this.description = description;
		this.computeValues = this.computeValues.bind(this);
	}

	abstract reset(): Rule;
	abstract setColumn(string): Rule;
	abstract setDescription(string): Rule;
	abstract renderEdit(
		onEdit: (newRule: Rule) => void,
		keyWidth: string,
		textFieldWidth: string,
		user_columns: string[],
		logFile: LogFile,
		rules: Rule[]
	): JSX.Element;
	abstract computeValues(logFile: LogFile): string[];
	abstract toJSON(): { [s: string]: any };
	static fromJSON(json: { [s: string]: any }) {
		const lookup = {
			StateBasedRule: require("./StateBasedRule").default,
			FlagRule: require("./FlagRule").default,
		};
		return lookup[json.type]?.fromJSON(json);
	}

	toCustomColumn(): CustomColumn<string> {
		return new CachingColumn<string>(
			this.column,
			this.computeValues
		);
	}
}
