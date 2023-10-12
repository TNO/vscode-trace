import React from "react";
import Rule from "../Rule";
import LogFile from "../../LogFile";
import FlagRule from "../FlagRule";
import StateBasedRule from "../StateBasedRule";
import Table from "../Tables/Table";
import {
	VSCodeButton,
	VSCodeTextField,
	VSCodeDropdown,
	VSCodeOption,
} from "@vscode/webview-ui-toolkit/react";

interface Props {
	onReturn: (rules: Rule[]) => void;
	onClose: (rules: Rule[]) => void;
	initialRules: Rule[];
	logFile: LogFile;
}

interface State {
	showEdit: boolean;
	rules: Rule[];
	selectedRule: number;
}

const BACKDROP_STYLE: React.CSSProperties = {
	height: "100vh",
	width: "100vw",
	backgroundColor: "#00000030",
	position: "absolute",
	display: "flex",
	justifyContent: "center",
	alignItems: "center",
};

const DIALOG_STYLE: React.CSSProperties = {
	height: "95%",
	width: "95%",
	padding: "10px",
	display: "flex",
	flexDirection: "column",
	overflow: "auto",
	zIndex: 100
};

export default class FlagsDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { showEdit: false, selectedRule: -1, rules: props.initialRules };
	}

	updateRule(rule: Rule, index: number) {
		const rules = [...this.state.rules];
		if (rules[index].column != rule.column) {
			for (let i = 0; i < rules.length; i++) {
				if (rules[i].ruleType === "Flag rule") {
					const updateRule = rules[i] as FlagRule;
					const updatedFlags = updateRule.flags;
					for (let j = 0; j < updatedFlags.length; j++)
						for (let k = 0; k < updatedFlags[j].conditions.length; k++)
							for (let l = 0; l < updatedFlags[j].conditions[k].length; l++)
								if (updatedFlags[j].conditions[k][l].Column === rules[index].column)
									updatedFlags[j].conditions[k][l].Column = rule.column;
					updateRule.setFlags(updatedFlags);
					rules[i] = updateRule;
				} else if (rules[i].ruleType === "State based rule") {
					const updatedRule = rules[i] as StateBasedRule;
					const updatedStates = updatedRule.ruleStates;
					for (let j = 0; j < updatedStates.length; j++) {
						for (let k = 0; k < updatedStates[j].transitions.length; k++) {
							for (let l = 0; l < updatedStates[j].transitions[k].conditions.length; l++) {
								for (let m = 0; m < updatedStates[j].transitions[k].conditions[l].length; m++) {
									if (
										updatedStates[j].transitions[k].conditions[l][m].Column === rules[index].column
									)
										updatedStates[j].transitions[k].conditions[l][m].Column = rule.column;
								}
							}
						}
					}
					updatedRule.setStates(updatedStates, updatedRule.initialStateIndex);
					rules[i] = updatedRule;
				}
			}
		}
		rules[index] = rule;
		this.setState({ rules });
	}

	updateFlagProperty(rule: Rule, property: string, new_value: string, index: number) {
		const rules = [...this.state.rules];
		const flagRule = rule as FlagRule;
		if (property === "defaultValue") rules[index] = flagRule.setDefault(new_value);
		else if (property === "flagType") rules[index] = flagRule.setFlagType(new_value);
		this.setState({ rules });
	}

	onDialogClick(isClose: boolean) {
		const ruleIndex = this.state.selectedRule;
		if (ruleIndex !== -1) {
			const rule = FlagRule.cleanConditions(this.state.rules[ruleIndex].reset());
			this.updateRule(rule, ruleIndex);
		}
		this.setState({ selectedRule: -1, showEdit: false }, () => {
			if (isClose === true) this.props.onClose(this.state.rules);
			else this.props.onReturn(this.state.rules);
		});
	}

	renderManage() {
		const onAddAction = () => {
			const newRule = new FlagRule(
				`FlagRule${this.state.rules.filter((r) => r.ruleType === "Flag rule").length + 1}`,
				"",
				"",
				"User Defined",
				0,
				[],
			);
			this.setState({
				rules: [...this.state.rules, newRule],
				selectedRule: this.state.rules.length,
				showEdit: true,
			});
		};

		const onEditAction = (tableIndex: number) => {
			const index = this.state.rules.findIndex(
				(x) => x === this.state.rules.filter((r) => r.ruleType === "Flag rule")[tableIndex],
			);
			this.setState({ showEdit: true, selectedRule: index });
		};

		const onDeleteAction = (tableIndex: number) => {
			const index = this.state.rules.findIndex(
				(x) => x === this.state.rules.filter((r) => r.ruleType === "Flag rule")[tableIndex],
			);
			if (this.state.selectedRule === index) this.setState({ selectedRule: -1 });
			this.setState({ rules: this.state.rules.filter((r, i) => i !== index) });
		};

		const tableRows = this.state.rules
			.filter((r) => r.ruleType === "Flag rule")
			.map((rule) => {
				const flagRule = rule as FlagRule;
				return [rule.column, flagRule.flagType, rule.description];
			});

		return (
			<div style={{ marginTop: "10px" }}>
				<Table
					// title='Manage flags'
					columns={[
						{ name: "Name", width: "150px" },
						{ name: "Type", width: "150px" },
						{ name: "Description", width: "" },
					]}
					rows={tableRows}
					noRowsText={"No flags have been defined (click + to add)"}
					onAddAction={onAddAction}
					onEditAction={onEditAction}
					onDeleteAction={onDeleteAction}
				/>
			</div>
		);
	}

	renderEdit() {
		if (this.state.selectedRule === -1) return;
		const ruleIndex = this.state.selectedRule;
		const rule = this.state.rules[ruleIndex];
		const ruleAsFlag = rule as FlagRule;
		const defaultValue = ruleAsFlag.defaultValue;
		const flagType = ruleAsFlag.flagType;
		const userColumns = this.state.rules
			.map((r, i) => r.column)
			.filter((name) => name != rule.column);
		const keyWidth = "100px";
		const textFieldWidth = "250px";
		const rows = [
			[
				"Name",
				<VSCodeTextField
					style={{ width: textFieldWidth, marginBottom: "2px" }}
					value={rule.column}
					key="Name"
					placeholder="Required"
					onInput={(e) =>
						this.updateRule(rule.setColumn(e.target.value), ruleIndex)
					}
				/>,
			],
			[
				"Description",
				<VSCodeTextField
					style={{ width: textFieldWidth, marginBottom: "2px" }}
					value={rule.description}
					key="Name"
					onInput={(e) => this.updateRule(rule.setDescription(e.target.value), ruleIndex)}
				/>,
			],
			[
				"Type",
				<VSCodeDropdown
					disabled={ruleAsFlag.flags.length > 0}
					style={{ width: textFieldWidth, marginBottom: "2px" }}
					value={flagType}
					key="Type"
					onChange={(e) => this.updateFlagProperty(rule, "flagType", e.target.value, ruleIndex)}
				>
					<VSCodeOption value={"User Defined"} key={0}>
						User Defined
					</VSCodeOption>
					<VSCodeOption value={"Capture Match"} key={1}>
						Capture Match
					</VSCodeOption>
				</VSCodeDropdown>,
			],
			[
				"Default Value",
				<VSCodeTextField
					style={{ width: textFieldWidth, marginBottom: "2px" }}
					value={defaultValue}
					key="Default"
					onInput={(e) => this.updateFlagProperty(rule, "defaultValue", e.target.value, ruleIndex)}
				/>,
			],
		];

		return (
			<div style={{ marginTop: "25px" }}>
				<Table
					// title='Edit rule'
					hideHeader={true}
					rows={rows}
					columns={[{ width: "100px" }, { width: "" }]}
				/>
				{rule.renderEdit(
					(newRule) => this.updateRule(newRule, ruleIndex),
					keyWidth,
					textFieldWidth,
					userColumns,
					this.props.logFile,
				)}
			</div>
		);
	}

	render() {
		return (
			<div style={BACKDROP_STYLE}>
				<div className="dialog" style={DIALOG_STYLE}>
					<div
						style={{
							display: "flex",
							justifyContent: "space-between",
							flexDirection: "row",
							alignItems: "top",
						}}
					>
						{!this.state.showEdit && <div className="title-big">Flag Annotation Columns</div>}
						{this.state.showEdit && <div className="title-big">Edit Flag Annotation Column</div>}
						{this.state.showEdit && (
							<VSCodeButton
								appearance="icon"
								style={{ marginLeft: "auto" }}
								disabled={this.state.rules[this.state.selectedRule].column === ''}
								onClick={() => this.onDialogClick(false)}
							>
								<i className="codicon codicon-arrow-left" />
							</VSCodeButton>

						)}
						<VSCodeButton
							appearance="icon"
							disabled={(this.state.selectedRule === -1) || ((this.state.selectedRule !== -1) && (this.state.rules[this.state.selectedRule].column !== '')) ? false : true}
							onClick={() => this.onDialogClick(true)}
						>
							<i className="codicon codicon-close" />
						</VSCodeButton>
					</div>
					<div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
						{!this.state.showEdit && this.renderManage()}
						{this.state.showEdit && this.renderEdit()}
					</div>
				</div>
			</div>
		);
	}
}
