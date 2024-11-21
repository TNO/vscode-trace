// When adding new rules, don't forget to update the lookup in Rule.fromJSON
import React from "react";
import Rule from "./Rule";
import FlagRule from "./FlagRule";
import LogFile from "../lib/LogFile";
import Table from "./Tables/Table";
import StateTable from "./Tables/StateTable";
import TransitionTable from "./Tables/TransitionTable";
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

interface State {
	name: string;
	transitions: Transition[];
}
interface Transition {
	destination: string;
	conditions: TransitionCondition[][];
}
interface TransitionCondition {
	Column: string;
	Operation: string;
	Text: string;
}

export default class StateBasedRule extends Rule {
	static ruleType = "State based rule";
	ruleType = StateBasedRule.ruleType;

	readonly ruleStates: State[];
	readonly initialStateIndex: number;
	readonly originIndex: number;
	readonly destinationIndex: number;

	public constructor(
		column: string,
		description: string,
		initialStateIndex: number,
		originIndex: number,
		destinationIndex: number,
		ruleStates: State[],
	) {
		super(column, description);
		this.ruleStates = ruleStates;
		this.originIndex = originIndex;
		this.destinationIndex = destinationIndex;
		this.initialStateIndex = initialStateIndex;
	}

	reset = () =>
		new StateBasedRule(
			this.column,
			this.description,
			this.initialStateIndex,
			0,
			0,
			this.ruleStates,
		);
	setColumn = (column: string) =>
		new StateBasedRule(
			column,
			this.description,
			this.initialStateIndex,
			this.originIndex,
			this.destinationIndex,
			this.ruleStates,
		);
	setDescription = (description: string) =>
		new StateBasedRule(
			this.column,
			description,
			this.initialStateIndex,
			this.originIndex,
			this.destinationIndex,
			this.ruleStates,
		);
	setInitialState = (initialStateIndex: number) =>
		new StateBasedRule(
			this.column,
			this.description,
			initialStateIndex,
			this.originIndex,
			this.destinationIndex,
			this.ruleStates,
		);
	setTransition = (originIndex: number, destinationIndex: number) =>
		new StateBasedRule(
			this.column,
			this.description,
			this.initialStateIndex,
			originIndex,
			destinationIndex,
			this.ruleStates,
		);
	setStates = (states: State[], initialStateIndex: number) =>
		new StateBasedRule(
			this.column,
			this.description,
			initialStateIndex,
			this.originIndex,
			this.destinationIndex,
			states,
		);

	public toJSON() {
		const { column, description, initialStateIndex, ruleStates } = this;
		const type = "StateBasedRule";
		return { column, type, description, initialStateIndex, ruleStates };
	}

	static fromJSON(json: { [s: string]: any }) {
		return new StateBasedRule(
			json.column,
			json.description,
			json.initialStateIndex,
			0,
			0,
			json.ruleStates,
		);
	}

	static cleanConditions(rule: Rule) {
		const stateRule = rule as StateBasedRule;
		let newStates = stateRule.ruleStates;
		for (let i = 0; i < newStates.length; i++) {
			for (let j = 0; j < newStates[i].transitions.length; j++) {
				for (let k = 0; k < newStates[i].transitions[j].conditions.length; k++)
					newStates[i].transitions[j].conditions[k] = newStates[i].transitions[j].conditions[k].filter(subCondition => ((subCondition.Column !== "") && (subCondition.Text !== "")))
				newStates[i].transitions[j].conditions = newStates[i].transitions[j].conditions.filter(li => li.length !== 0)
			}
		}
		return stateRule.setStates(newStates, stateRule.initialStateIndex);
	}

	public renderEdit(
		onEdit: (newRule: Rule) => void,
		keyWidth: string,
		textFieldWidth: string,
		user_columns: string[],
		logFile: LogFile,
		rules: Rule[]
	) {
		const editStateName = (stateIndex: number, value: string) => {
			const states = [...this.ruleStates];
			const previousName = states[stateIndex].name;
			for (let i = 0; i < states.length; i++) {
				for (let j = 0; j < states[i].transitions.length; j++) {
					if (states[i].transitions[j].destination === previousName)
						states[i].transitions[j].destination = value;
				}
			}
			states[stateIndex] = { ...states[stateIndex], ["name"]: value };
			onEdit(this.setStates(states, this.initialStateIndex));
		};

		const stateRows = this.ruleStates.map((r, i) => {
			return [
				<VSCodeTextField
					value={r.name}
					key="Text"
					onInput={(e) => editStateName(i, e.target.value)}
				/>,
			];
		});

		const onSetInitialState = (index: number) => {
			onEdit(this.setInitialState(index));
		};

		const onAddState = () => {
			let newName;
			const existingStates = this.ruleStates.map((n, i) => n.name);
			for (let i = 1; i < this.ruleStates.length + 2; i++) {
				newName = "State " + i.toString();
				if (existingStates.indexOf(newName) == -1) break;
			}
			onEdit(
				this.setStates(
					[
						...this.ruleStates,
						{ name: newName, transitions: [{ destination: newName, conditions: [] }] },
					],
					this.initialStateIndex,
				),
			);
		};

		const onDeleteState = (index: number) => {
			const states = [...this.ruleStates];
			const stateName = states[index].name;
			for (let i = 0; i < states.length; i++)
				states[i].transitions = states[i].transitions.filter((r, i) => r.destination != stateName);
			if (index === this.initialStateIndex)
				onEdit(
					this.setStates(
						states.filter((r, i) => index !== i),
						0,
					),
				);
			else if (index < this.initialStateIndex)
				onEdit(
					this.setStates(
						states.filter((r, i) => index !== i),
						this.initialStateIndex - 1,
					),
				);
			else
				onEdit(
					this.setStates(
						states.filter((r, i) => index !== i),
						this.initialStateIndex,
					),
				);
		};

		const allColumns = ["", ...logFile.getAllHeaders().filter((h) => h !== this.column)];

		const transitionRows: any[][] = [];
		if (this.ruleStates.length > 0) {
			if (
				this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions.length === 0
			)
				transitionRows.push([]);
			for (
				let transitionIndex = 0;
				transitionIndex <
				this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions.length;
				transitionIndex++
			) {
				const conditionSet =
					this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions[
					transitionIndex
					];
				transitionRows.push(
					conditionSet.map((r, c_i) => {
						let setMap: any[] = [];
						setMap.push(
							<VSCodeDropdown
								style={{ width: "100%", marginBottom: "2px" }}
								value={r.Column}
								key="editTransitionColumn"
								onChange={(e) => editTransition(transitionIndex, c_i, "Column", e.target.value)}
							>
								{allColumns.map((col, col_i) => (
									<VSCodeOption value={col} key={col_i}>
										{col}
									</VSCodeOption>
								))}
							</VSCodeDropdown>
						);
						setMap.push(
							<VSCodeDropdown
								style={{ width: "100%" }}
								value={r.Operation}
								key="editTransitionOperation"
								onChange={(e) => editTransition(transitionIndex, c_i, "Operation", e.target.value)}
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
						if (user_columns.includes(r.Column)) {
							const dropdownRule = rules.filter(rule => rule.column === r.Column)[0];
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
									value={r.Text}
									onInput={(e) => editTransition(transitionIndex, c_i, "Text", e.target.value)}
									key="editTransitionText"
								/>
							);
						}
						else {
							setMap.push(
								<VSCodeDropdown
									style={{ width: "100%" }}
									value={r.Text}
									key="editTransitionTextDropdown"
									onChange={(e) => editTransition(transitionIndex, c_i, "Text", e.target.value)}
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

		const onAddCondition = (transitionIndex: number) => {
			const states = [...this.ruleStates];
			if (states[this.originIndex].transitions[this.destinationIndex].conditions.length === 0)
				states[this.originIndex].transitions[this.destinationIndex].conditions[transitionIndex] = [
					{ Column: "", Operation: "contains", Text: "" },
				];
			else
				states[this.originIndex].transitions[this.destinationIndex].conditions[
					transitionIndex
				].push({ Column: "", Operation: "contains", Text: "" });
			onEdit(this.setStates(states, this.initialStateIndex));
		};

		const editTransition = (
			transitionIndex: number,
			conditionIndex: number,
			field: "Column" | "Operation" | "Text",
			value: string,
		) => {
			const existingConditions = [
				...this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions,
			];
			existingConditions[transitionIndex][conditionIndex] = {
				...existingConditions[transitionIndex][conditionIndex],
				[field]: value,
			};
			this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions =
				existingConditions;
			onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
		};

		const onDeleteCondition = (transitionIndex: number, conditionIndex: number) => {
			const updatedConditions = this.ruleStates[this.originIndex].transitions[
				this.destinationIndex
			].conditions[transitionIndex].filter((r, i) => conditionIndex !== i);
			this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions[
				transitionIndex
			] = updatedConditions;
			onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
		};

		const onAddTransition = () => {
			const states = [...this.ruleStates];
			states[this.originIndex].transitions[this.destinationIndex].conditions.push([]);
			onEdit(this.setStates(states, this.initialStateIndex));
		};

		const onDeleteTransition = (transitionIndex: number) => {
			const updatedConditions = this.ruleStates[this.originIndex].transitions[
				this.destinationIndex
			].conditions.filter((r, i) => transitionIndex !== i);
			this.ruleStates[this.originIndex].transitions[this.destinationIndex].conditions =
				updatedConditions;
			onEdit(this.setStates(this.ruleStates, this.initialStateIndex));
		};

		const onOriginChange = (origin_name: string) => {
			const destinationName =
				this.ruleStates[this.originIndex].transitions[this.destinationIndex].destination;

			const newOrigin = this.ruleStates.findIndex((x) => x.name === origin_name);
			const newDestination = this.ruleStates[newOrigin].transitions.findIndex(
				(x) => x.destination === destinationName,
			);

			if (newDestination > -1) onEdit(this.setTransition(newOrigin, newDestination));
			else {
				this.ruleStates[newOrigin].transitions.push({
					destination: destinationName,
					conditions: [],
				});
				onEdit(this.setTransition(newOrigin, this.ruleStates[newOrigin].transitions.length - 1));
			}
		};

		const onDestinationChange = (destinationName: string) => {
			const newDestination = this.ruleStates[this.originIndex].transitions.findIndex(
				(x) => x.destination === destinationName,
			);
			if (newDestination > -1) onEdit(this.setTransition(this.originIndex, newDestination));
			else {
				this.ruleStates[this.originIndex].transitions.push({
					destination: destinationName,
					conditions: [],
				});
				onEdit(
					this.setTransition(
						this.originIndex,
						this.ruleStates[this.originIndex].transitions.length - 1,
					),
				);
			}
		};

		const stateDropdownRows = [
			[
				"From:",
				<VSCodeDropdown
					style={{ marginLeft: "20px" }}
					key="From"
					onChange={(e) => onOriginChange(e.target.value)}
				>
					{this.ruleStates.map((state, index) => (
						<VSCodeOption value={state.name} key={index}>
							{state.name}
						</VSCodeOption>
					))}
				</VSCodeDropdown>,
			],
			[
				"To:",
				<VSCodeDropdown
					style={{ marginLeft: "20px" }}
					key="To"
					onChange={(e) => onDestinationChange(e.target.value)}
				>
					{this.ruleStates.map((state, index) => (
						<VSCodeOption value={state.name} key={index}>
							{state.name}
						</VSCodeOption>
					))}
				</VSCodeDropdown>,
			],
		];

		return (
			<div style={{ height: "100%", width: "100%", display: "flex" }}>
				<VSCodePanels aria-label="Logic-Panels">
					<VSCodePanelTab id="tab-1">States</VSCodePanelTab>
					<VSCodePanelTab id="tab-2">Transitions</VSCodePanelTab>
					<VSCodePanelView id="view-1">
						<StateTable
							columns={[{ name: "Name", width: "" }]}
							rows={stateRows}
							start_state={this.initialStateIndex}
							noRowsText={"No states have been defined (click + to add)"}
							onAddAction={onAddState}
							onSetAction={onSetInitialState}
							onDeleteAction={onDeleteState}
						/>
					</VSCodePanelView>
					<VSCodePanelView id="view-2">
						<div style={{ marginTop: "20px", marginRight: "50px" }}>
							<Table
								hideHeader={true}
								rows={stateDropdownRows}
								columns={[{ width: "70px" }, { width: "" }]}
							/>
						</div>

						<div style={{ width: "100%", float: "right", margin: "1%" }}>
							<TransitionTable
								columns={[
									{ width: "30px" },
									{ name: "Column", width: "150px" },
									{ name: "Operation", width: "150px" },
									{ name: "Text", width: "" },
								]}
								rows={transitionRows}
								noRowsText={"No conditions have been defined (click + to add)"}
								onAddConditionAction={onAddCondition}
								onDeleteConditionAction={onDeleteCondition}
								onAddTransitionAction={onAddTransition}
								onDeleteTransitionAction={onDeleteTransition}
							/>
						</div>
					</VSCodePanelView>
				</VSCodePanels>
			</div>
		);
	}

	public computeValues(logFile: LogFile): string[] {
		let currentState;
		const values: string[] = [];
		if (this.ruleStates.length === 0) {
			for (let r = 0; r < logFile.amountOfRows(); r++) values[r] = "";
		} else {
			currentState = this.ruleStates[this.initialStateIndex].name;
			values[0] = currentState;
			for (let r = 1; r < logFile.amountOfRows(); r++) {
				let stateTransitions = this.ruleStates.filter((st) => st.name === currentState)[0]
					.transitions;
				stateTransitions = stateTransitions.filter((tr) => tr.conditions.length > 0);
				for (const transition of stateTransitions) {
					let transitionFound = false;
					for (const conditionSet of transition.conditions) {
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
							currentState = transition.destination;
							transitionFound = true;
							break;
						}
					}
					if (transitionFound === true) break;
				}
				values[r] = currentState;
			}
		}
		return values;
	}
}
