import React from "react";
import LogFile from "../../lib/LogFile";
import { VSCodeButton, VSCodeTextField } from "@vscode/webview-ui-toolkit/react";
import Rule from "../../rules/Rule";
import FlagRule from "../../rules/FlagRule";
import StateBasedRule from "../../rules/StateBasedRule";
import Table from "../../rules/Tables/Table";

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

export default class StatesDialog extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = { showEdit: false, selectedRule: -1, rules: props.initialRules };
	}

	updateRule(rule: Rule, index: number) {
		const rules = [...this.state.rules];
		if (rules[index].column != rule.column) {
			for (let i = 0; i < rules.length; i++) {
				if (rules[i].ruleType === "Flag rule") {
					const updatedRule = rules[i] as FlagRule;
					const updatedFlags = updatedRule.flags;
					for (let j = 0; j < updatedFlags.length; j++)
						for (let k = 0; k < updatedFlags[j].conditions.length; k++)
							for (let l = 0; l < updatedFlags[j].conditions[k].length; l++)
								if (updatedFlags[j].conditions[k][l].Column === rules[index].column)
									updatedFlags[j].conditions[k][l].Column = rule.column;
					updatedRule.setFlags(updatedFlags);
					rules[i] = updatedRule;
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

	onDialogClick(isClose: boolean) {
		const ruleIndex = this.state.selectedRule;
		if (ruleIndex !== -1) {
			const rule = StateBasedRule.cleanConditions(this.state.rules[ruleIndex].reset());
			this.updateRule(rule, ruleIndex);
		}
		this.setState({ selectedRule: -1, showEdit: false }, () => {
			if (isClose === true) this.props.onClose(this.state.rules);
			else this.props.onReturn(this.state.rules);
		});
	}

	renderManage() {
		const onAddAction = () => {
			const newRule = new StateBasedRule(
				`StateRule${this.state.rules.filter((r) => r.ruleType === "State based rule").length + 1}`,
				"",
				0,
				0,
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
				(x) => x === this.state.rules.filter((r) => r.ruleType === "State based rule")[tableIndex],
			);
			this.setState({ showEdit: true, selectedRule: index });
		};

		const onDeleteAction = (tableIndex: number) => {
			const index = this.state.rules.findIndex(
				(x) => x === this.state.rules.filter((r) => r.ruleType === "State based rule")[tableIndex],
			);
			if (this.state.selectedRule === index) this.setState({ selectedRule: -1 });
			this.setState({ rules: this.state.rules.filter((r, i) => i !== index) });
		};

		return (
			<div style={{ marginTop: "10px" }}>
				<Table
					// title='Manage rules'
					columns={[
						{ name: "Name", width: "150px" },
						{ name: "Type", width: "150px" },
						{ name: "Description", width: "" },
					]}
					rows={this.state.rules
						.filter((r) => r.ruleType === "State based rule")
						.map((rule) => [rule.column, rule.ruleType, rule.description])}
					noRowsText={"No rules have been defined (click + to add)"}
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
					key="Description"
					onInput={(e) => this.updateRule(rule.setDescription(e.target.value), ruleIndex)}
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
					this.state.rules
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
						{!this.state.showEdit && (
							<div className="title-big">State-Based Annotation Columns</div>
						)}
						{this.state.showEdit && (
							<div className="title-big">Edit State-Based Annotation Column</div>
						)}
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
