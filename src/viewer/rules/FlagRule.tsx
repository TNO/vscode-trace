// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from "react";
import Rule from "./Rule";
import StateBasedRule from "./StateBasedRule";
import LogFile from "../lib/LogFile";
import Table from "./Tables/Table";
import FlagTable from "./Tables/FlagTable";
import {
	VSCodeTextField,
	VSCodeDropdown,
	VSCodeOption,
	VSCodePanels,
	VSCodePanelTab,
	VSCodePanelView,
} from "@vscode/webview-ui-toolkit/react";
import { useRegularExpressionSearch } from "../hooks/useLogSearchManager";
import { logDataToString } from "../hooks/useTracyLogData";

interface Flag {
	name: string;
	conditions: Condition[][];
}
interface Condition {
	Column: string;
	Operation: string;
	Text: string;
}

export default class FlagRule extends Rule {
	static ruleType = "Flag rule";
	ruleType = FlagRule.ruleType;

	readonly flags: Flag[];
	readonly defaultValue: string;
	readonly flagType: string;
	readonly selectedFlag: number;

	public constructor(
		column: string,
		description: string,
		defaultValue: string,
		flagType: string,
		selectedFlag: number,
		flags: Flag[],
	) {
		super(column, description);
		this.defaultValue = defaultValue;
		this.flagType = flagType;
		this.selectedFlag = selectedFlag;
		this.flags = flags;
	}

	reset = () =>
		new FlagRule(this.column, this.description, this.defaultValue, this.flagType, 0, this.flags);
	setColumn = (column: string) =>
		new FlagRule(
			column,
			this.description,
			this.defaultValue,
			this.flagType,
			this.selectedFlag,
			this.flags,
		);
	setDescription = (description: string) =>
		new FlagRule(
			this.column,
			description,
			this.defaultValue,
			this.flagType,
			this.selectedFlag,
			this.flags,
		);
	setFlagType = (flagType: string) =>
		new FlagRule(
			this.column,
			this.description,
			this.defaultValue,
			flagType,
			this.selectedFlag,
			this.flags,
		);
	setSelected = (selectedFlag: number) =>
		new FlagRule(
			this.column,
			this.description,
			this.defaultValue,
			this.flagType,
			selectedFlag,
			this.flags,
		);
	setDefault = (defaultValue: string) =>
		new FlagRule(
			this.column,
			this.description,
			defaultValue,
			this.flagType,
			this.selectedFlag,
			this.flags,
		);
	setFlags = (flags: Flag[]) =>
		new FlagRule(
			this.column,
			this.description,
			this.defaultValue,
			this.flagType,
			this.selectedFlag,
			flags,
		);

	public toJSON() {
		const { column, description, defaultValue, flagType, flags } = this;
		const type = "FlagRule";
		return { column, type, description, defaultValue, flagType, flags };
	}

	static fromJSON(json: { [s: string]: any }) {
		return new FlagRule(
			json.column,
			json.description,
			json.defaultValue,
			json.flagType,
			0,
			json.flags,
		);
	}

	static cleanConditions(rule: Rule) {
		const flagRule = rule as FlagRule;
		let newFlags = flagRule.flags;
		for (let i = 0; i < newFlags.length; i++) {
			for (let j = 0; j < newFlags[i].conditions.length; j++)
				newFlags[i].conditions[j] = newFlags[i].conditions[j].filter(subCondition => ((subCondition.Column !== "") && (subCondition.Text !== "")))
			newFlags[i].conditions = newFlags[i].conditions.filter(li => li.length !== 0)
		}
		// Could also remove flags without any conditions
		// newFlags = newFlags.filter(i => i.conditions.length !== 0)
		return flagRule.setFlags(newFlags);
	}

	public renderEdit(
		onEdit: (newRule: Rule) => void,
		keyWidth: string,
		textFieldWidth: string,
		user_columns: string[],
		logFile: LogFile,
		rules: Rule[]
	) {
		const allColumns = ["", ...logFile.getAllHeaders().filter((h) => h !== this.column)];

		const editFlagName = (index: number, value: string) => {
			const flags = [...this.flags];
			flags[index] = { ...flags[index], ["name"]: value };
			onEdit(this.setFlags(flags));
		};

		const editCaptureCondition = (index: number, field: string, value: string) => {
			const flags = [...this.flags];
			const existingConditions = { ...flags[index].conditions[0][0], [field]: value };
			flags[index].conditions[0][0] = existingConditions;
			onEdit(this.setFlags(flags));
		};

		const onAddFlag = () => {
			let newName;
			const existingFlags = this.flags.map((n, i) => n.name);
			for (let i = 1; i < this.flags.length + 2; i++) {
				newName = "Flag " + i.toString();
				if (existingFlags.indexOf(newName) == -1) break;
			}
			onEdit(this.setFlags([...this.flags, { name: newName, conditions: [] }]));
		};

		const onDeleteFlag = (index: number) => {
			const flags = [...this.flags];
			onEdit(this.setFlags(flags.filter((r, i) => index !== i)));
		};

		const onAddCaptureFlag = () => {
			onEdit(
				this.setFlags([
					...this.flags,
					{ name: "", conditions: [[{ Column: "All", Operation: "capture", Text: "" }]] },
				]),
			);
		};

		const onAddCondition = () => {
			const flags = [...this.flags];
			flags[this.selectedFlag].conditions.push([]);
			onEdit(this.setFlags(flags));
		};

		const onDeleteCondition = (transitionIndex: number) => {
			const newConditions = this.flags[this.selectedFlag].conditions.filter(
				(r, i) => transitionIndex !== i,
			);
			this.flags[this.selectedFlag].conditions = newConditions;
			onEdit(this.setFlags(this.flags));
		};

		const onAddSubcondition = (conditionIndex: number) => {
			const flags = [...this.flags];
			if (flags[this.selectedFlag].conditions.length === 0)
				flags[this.selectedFlag].conditions[conditionIndex] = [
					{ Column: "", Operation: "contains", Text: "" },
				];
			else
				flags[this.selectedFlag].conditions[conditionIndex].push({
					Column: "",
					Operation: "contains",
					Text: "",
				});
			onEdit(this.setFlags(flags));
		};

		const editSubcondition = (
			conditionIndex: number,
			subconditionIndex: number,
			field: "Column" | "Operation" | "Text",
			value: string,
		) => {
			const existingConditions = [...this.flags[this.selectedFlag].conditions];
			existingConditions[conditionIndex][subconditionIndex] = {
				...existingConditions[conditionIndex][subconditionIndex],
				[field]: value,
			};
			this.flags[this.selectedFlag].conditions = existingConditions;
			onEdit(this.setFlags(this.flags));
		};

		const onDeleteSubcondition = (conditionIndex: number, subconditionIndex: number) => {
			const updatedConditions = this.flags[this.selectedFlag].conditions[conditionIndex].filter(
				(r, i) => subconditionIndex !== i,
			);
			this.flags[this.selectedFlag].conditions[conditionIndex] = updatedConditions;
			onEdit(this.setFlags(this.flags));
		};

		const onFlagDropdownSelect = (val: string) => {
			const index = this.flags.findIndex((x) => x.name === val);
			onEdit(this.setSelected(index));
		};

		const flagDropdownRows = [
			[
				<VSCodeDropdown
					style={{ marginLeft: "5px" }}
					key="Dropdown"
					onChange={(e) => onFlagDropdownSelect(e.target.value)}
				>
					{this.flags.map((state, index) => (
						<VSCodeOption value={state.name} key={index}>
							{state.name}
						</VSCodeOption>
					))}
				</VSCodeDropdown>,
			],
		];

		const flagRows: any[][] = [];
		const conditionRows: any[][] = [];

		if (this.flagType === "User Defined") {
			for (let i = 0; i < this.flags.length; i++)
				flagRows.push([
					<VSCodeTextField
						style={{ width: "100%", marginBottom: "2px" }}
						value={this.flags[i].name}
						key="Text"
						onInput={(e) => editFlagName(i, e.target.value)}
					/>,
				]);

			if (this.flags.length > 0) {
				if (this.flags[this.selectedFlag].conditions.length === 0) conditionRows.push([]);
				for (
					let columnIndex = 0;
					columnIndex < this.flags[this.selectedFlag].conditions.length;
					columnIndex++
				) {
					const conditionSet = this.flags[this.selectedFlag].conditions[columnIndex];
					conditionRows.push(
						conditionSet.map((sub, s_i) => {
							let setMap: any[] = [];
							setMap.push(
								<VSCodeDropdown
									style={{ width: "100%", marginBottom: "2px" }}
									value={sub.Column}
									key="editSubconditionColumn"
									onChange={(e) => editSubcondition(columnIndex, s_i, "Column", e.target.value)}
								>
									{allColumns.map((col, col_i) => (
										<VSCodeOption key={col_i} value={col}>
											{col}
										</VSCodeOption>
									))}
								</VSCodeDropdown>
							);
							setMap.push(
								<VSCodeDropdown
									style={{ width: "100%" }}
									value={sub.Operation}
									key="editSubconditionOperation"
									onChange={(e) => editSubcondition(columnIndex, s_i, "Operation", e.target.value)}
								>
									<VSCodeOption key="0" value="contains">
										contains
									</VSCodeOption>
									<VSCodeOption key="1" value="equals">
										equals
									</VSCodeOption>
									<VSCodeOption key="2" value="regexSearch">
										regex search
									</VSCodeOption>
									<VSCodeOption key="3" value="startsWith">
										startsWith
									</VSCodeOption>
									<VSCodeOption key="4" value="endsWith">
										endsWith
									</VSCodeOption>
									<VSCodeOption key="5" value="lessThan">
										less than
									</VSCodeOption>
									<VSCodeOption key="6" value="moreThan">
										more than
									</VSCodeOption>
								</VSCodeDropdown>
							);
							
							let isDropdown = false;
							let dropdownOptions: string[] = [];
							if (user_columns.includes(sub.Column)) {
								const dropdownRule = rules.filter(r => r.column === sub.Column)[0];
								if (dropdownRule.ruleType === "Flag rule") {
									let dropdownFlagRule = dropdownRule as FlagRule;
									dropdownOptions = dropdownFlagRule.flags.map(f => f.name);
									dropdownOptions.push(dropdownFlagRule.defaultValue);
									if (dropdownFlagRule.flagType === "User Defined" && dropdownOptions.length > 0)
										isDropdown = true;
								}
								else if (dropdownRule.ruleType === "State based rule") {
									let dropdownStateRule = dropdownRule as StateBasedRule;
									dropdownOptions = dropdownStateRule.ruleStates.map(s => s.name);
									if (dropdownOptions.length > 0)
										isDropdown = true;
								}
							}
							dropdownOptions = dropdownOptions.filter(opt => opt != "")
							if (!isDropdown) {
								setMap.push(
									<VSCodeTextField
										style={{ width: "100%" }}
										value={sub.Text}
										key="editSubconditionText"
										onInput={(e) => editSubcondition(columnIndex, s_i, "Text", e.target.value)}
									/>,
								);
							}
							else {
								setMap.push(
									<VSCodeDropdown
										style={{ width: "100%" }}
										value={sub.Text}
										key="editSubconditionTextDropdown"
										onChange={(e) => editSubcondition(columnIndex, s_i, "Text", e.target.value)}
									>
										{dropdownOptions.map((option, optionIndex) => (
											<VSCodeOption key={optionIndex} value={option}>
												{option}
											</VSCodeOption>
										))}
									</VSCodeDropdown>
								);
							}
							return setMap;
						}),
					);
				}
			}
		} else if (this.flagType === "Capture Match") {
			for (let i = 0; i < this.flags.length; i++)
				flagRows.push([
					<VSCodeTextField
						style={{ width: "100%", marginBottom: "2px" }}
						value={this.flags[i].conditions[0][0].Text}
						key="Text"
						onInput={(e) => editCaptureCondition(i, "Text", e.target.value)}
					/>,
					<VSCodeDropdown
						style={{ width: "100%", marginBottom: "2px" }}
						value={this.flags[i].conditions[0][0].Column}
						key="Column"
						onChange={(e) => editCaptureCondition(i, "Column", e.target.value)}
					>
						<VSCodeOption key={allColumns.length} value={"All"}>
							All
						</VSCodeOption>
						{allColumns.map((col, col_i) => (
							<VSCodeOption key={col_i} value={col}>
								{col}
							</VSCodeOption>
						))}
					</VSCodeDropdown>,
				]);
		}

		return (
			<div style={{ height: "100%", width: "100%", display: "flex" }}>
				{this.flagType === "User Defined" && (
					<VSCodePanels aria-label="Logic-Panels">
						<VSCodePanelTab id="tab-1">Flags</VSCodePanelTab>
						<VSCodePanelTab id="tab-2">Conditions</VSCodePanelTab>
						<VSCodePanelView id="view-1">
							<Table
								columns={[{ name: "Name", width: "" }]}
								rows={flagRows}
								noRowsText={"No flags have been defined (click + to add)"}
								onAddAction={onAddFlag}
								onDeleteAction={onDeleteFlag}
							/>
						</VSCodePanelView>
						<VSCodePanelView id="view-2">
							<div style={{ marginTop: "20px", marginRight: "50px" }}>
								<Table hideHeader={true} rows={flagDropdownRows} columns={[{ width: "" }]} />
							</div>

							<div style={{ width: "100%", float: "right", margin: "1%" }}>
								<FlagTable
									columns={[
										{ width: "30px" },
										{ name: "Column", width: "150px" },
										{ name: "Operation", width: "150px" },
										{ name: "Text", width: "" },
									]}
									rows={conditionRows}
									noRowsText={"No conditions have been defined (click + to add)"}
									onAddConditionAction={onAddCondition}
									onDeleteConditionAction={onDeleteCondition}
									onAddSubconditionAction={onAddSubcondition}
									onDeleteSubconditionAction={onDeleteSubcondition}
								/>
							</div>
						</VSCodePanelView>
					</VSCodePanels>
				)}
				{this.flagType === "Capture Match" && (
					<VSCodePanels aria-label="Logic-Panels">
						<VSCodePanelTab id="tab-1">Capture Groups</VSCodePanelTab>

						<VSCodePanelView id="view-1">
							<Table
								columns={[
									{ name: "Regex", width: "200px" },
									{ name: "Column", width: "150px" },
								]}
								rows={flagRows}
								noRowsText={"No capture flags have been defined (click + to add)"}
								onAddAction={onAddCaptureFlag}
								onDeleteAction={onDeleteFlag}
							/>
						</VSCodePanelView>
					</VSCodePanels>
				)}
			</div>
		);
	}

	public computeValues(logFile: LogFile): string[] {
		const values: string[] = [];
		for (let r = 0; r < logFile.amountOfRows(); r++) {
			values[r] = this.defaultValue;
			if (this.flagType === "User Defined") {
				for (const flag of this.flags) {
					let flagFound = false;
					for (const conditionSet of flag.conditions) {
						let allConditionsSatisfied = true;
						for (const condition of conditionSet) {
							const logValue = logDataToString(logFile.value(condition.Column, r));
							if (condition.Operation === "contains") {
								if (!logValue.includes(condition.Text)) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "equals") {
								if (logValue !== condition.Text) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "startsWith") {
								if (!logValue.startsWith(condition.Text)) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "endsWith") {
								if (!logValue.endsWith(condition.Text)) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "regexSearch") {
								if (useRegularExpressionSearch("gs", condition.Text, logValue) === false) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "lessThan") {
								if (parseFloat(logValue) >= parseFloat(condition.Text)) {
									allConditionsSatisfied = false;
									break;
								}
							} else if (condition.Operation === "moreThan") {
								if (parseFloat(logValue) <= parseFloat(condition.Text)) {
									allConditionsSatisfied = false;
									break;
								}
							}
						}
						if (allConditionsSatisfied === true) {
							flagFound = true;
							break;
						}
					}
					if (flagFound === true) {
						values[r] = flag.name;
						break;
					}
				}
			} else if (this.flagType === "Capture Match") {
				for (const flag of this.flags) {
					const logValue = logDataToString(logFile.value(flag.conditions[0][0].Column, r));
					const flagFound = logValue.match(flag.conditions[0][0].Text);
					if (flagFound !== null) values[r] = flagFound[1];
				}
			}
		}
		return values;
	}
}
