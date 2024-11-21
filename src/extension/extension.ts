import * as vscode from 'vscode';
import fs from 'fs';
import TracyAPI from './TracyAPI';
import DefaultJsonConverter from './DefaultJsonConverter';
import TracyConverter from './api/converter/TracyConverter';

const API = new TracyAPI(new DefaultJsonConverter());
let chosenConverter: TracyConverter | undefined;

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('tracy.openDocument', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const converters = API.getConvertersForFile(editor.document.fileName);
			if (converters.length === 1) {
				chosenConverter = converters[0];
			} else {
				const choice = await vscode.window.showQuickPick(converters.map((c) => c.name));
				if (!choice) {
					return;
				}

				const converter = converters.filter((c) => c.name == choice).pop();
				if (!converter) {
					throw new Error('Chosen converter does not exist!');
				}
				
				chosenConverter = converter;
			}

			vscode.commands.executeCommand('vscode.openWith', editor.document.uri, 'tno.tracy');
		} else {
			vscode.window.showErrorMessage("Current document is not open in a text editor.");
		}
	});

	context.subscriptions.push(disposable);
	context.subscriptions.push(EditorProvider.register(context));
	return API;
}

export class EditorProvider implements vscode.CustomTextEditorProvider {

	public static register(context: vscode.ExtensionContext): vscode.Disposable {
		return vscode.window.registerCustomEditorProvider(EditorProvider.viewType, new EditorProvider(context));
	}

	private static readonly viewType = 'tno.tracy';

	constructor(
		private readonly context: vscode.ExtensionContext
	) { }

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken
	): Promise<void> {
		const rulesFile = `${document.fileName}.rules`;
		const structureDefinitionFile = `${document.fileName}.structure`;

		// Setup initial content for the webview
		webviewPanel.webview.options = {
			enableScripts: true,
		};
		webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

		function updateWebview(message_type: string) {
			let converter: TracyConverter;
			if (chosenConverter) {
				converter = chosenConverter;
				chosenConverter = undefined;
			} else {
				converter = API.getConvertersForFile(document.fileName)[0];
				if (!converter) {
					vscode.window.showErrorMessage(`No converter found for: ${document.fileName}`);
					return;
				}
			}

			converter.parseLog(document.fileName, document.getText())
				.then((logFile) => {
					webviewPanel.webview.postMessage({
						type: message_type,
						logFile,
						rules: fs.existsSync(rulesFile) ? JSON.parse(fs.readFileSync(rulesFile, { encoding: 'utf8' })) : [],
					});
				}).catch(console.log);
		}

		// Hook up event handlers so that we can synchronize the webview with the text document.
		//
		// The text document acts as our model, so we have to sync change in the document to our
		// editor and sync changes in the editor back to the document.
		// 
		// Remember that a single text document can also be shared between multiple custom
		// editors (this happens for example when you split a custom editor)

		const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
			if (e.document.uri.toString() === document.uri.toString()) {
				updateWebview('readFile');
			}
		});

		// Make sure we get rid of the listener when our editor is closed.
		webviewPanel.onDidDispose(() => {
			changeDocumentSubscription.dispose();
		});

		// Receive message from the webview.
		webviewPanel.webview.onDidReceiveMessage(e => {
			if (e.type === 'readFile') {
				updateWebview('readFile');
				if (e.comparisonFilePath) {
					this.convertComparisonFile(e.comparisonFilePath, webviewPanel);
				}
			} else if (e.type === 'saveRules') {
				fs.writeFileSync(rulesFile, JSON.stringify(e.rules));
			} else if (e.type === 'showCompareFileDialog') {
				this.showCompareFileDialog(document, webviewPanel);
			}
			else if (e.type === 'saveStructureDefinition') {

				const options: vscode.SaveDialogOptions = {
					title: 'Save Structure Definition',
					defaultUri: vscode.Uri.joinPath(document.uri, structureDefinitionFile),
					filters: {
						'Stucture files': ['structure']
				   }
			   	};
				vscode.window.showSaveDialog(options).then(fileUri => {
					if (fileUri) {
						fs.writeFileSync(fileUri.fsPath, e.structureDefinition);
					}
				});				
			}
			else if (e.type === 'loadStructureDefinition') {
				const options: vscode.OpenDialogOptions = {
					title: 'Load Structure Definition',
					canSelectMany: false,
					openLabel: 'Load',
					filters: {
					   'Stucture files': ['structure']
				   }
			   	};
				vscode.window.showOpenDialog(options).then(fileUri => {

					if (fileUri && fileUri[0]) {
						const filePath = fileUri[0].fsPath;

						webviewPanel.webview.postMessage({
							type: 'loadedStructureDefinition', 
							structureDefinition: fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, {encoding: 'utf8'})) : []
						});
					}

				});				
			}
			else if (e.type === 'exportData') {
				let filename = document.fileName;
				const splitItems = [".tracy", ".json", ".txt", ".csv", "_Tracy_export_"];
				splitItems.forEach(item => { filename = filename.split(item)[0]; });
				const tzoffset = (new Date()).getTimezoneOffset() * 60000; //offset in milliseconds
				const _date = new Date(Date.now() - tzoffset).toISOString().slice(0, 10).replace(/-/g, "");
				const _time = new Date(Date.now() - tzoffset).toISOString().slice(11, 19).replace(/:/g, "");
				const exportFile = `${filename}_Tracy_export_${_date}_${_time}.tracy.json`;
				const options: vscode.SaveDialogOptions = {
					title: 'Export Data',
					defaultUri: vscode.Uri.joinPath(document.uri, exportFile),
					filters: {
						'Tracy files': ['json']
				   }
			   	};
				vscode.window.showSaveDialog(options).then(fileUri => {
					if (fileUri) {
						fs.writeFileSync(fileUri.fsPath, JSON.stringify(e.data));
					}
				});
			}
			else if (e.type === 'showErrorMessage') {
				vscode.window.showErrorMessage(e.message);
			}
		});
	}

	private showCompareFileDialog(document: vscode.TextDocument, webviewPanel: vscode.WebviewPanel) {
		const options: vscode.OpenDialogOptions = {
			title: 'Select Log File',
			defaultUri: document.uri,
			canSelectFolders: false,
			canSelectMany: false,
			filters: {
				'Tracy files': API.getSuportedFileExtentions()
		   }
		};
		
		vscode.window.showOpenDialog(options).then(fileUri => {
			if (!fileUri) {
				return;
			}

			const path = fileUri[0].fsPath;
			this.convertComparisonFile(path, webviewPanel);
		});	
	}

	private convertComparisonFile(path: string, webviewPanel: vscode.WebviewPanel) {
		const converter = API.getConvertersForFile(path)[0];
		if (!converter) {
			vscode.window.showErrorMessage(`No converter found for: ${path}`);
			return;
		}

		converter.parseLogFile(path)
			.then((logFile) => {
				webviewPanel.webview.postMessage({
					type: 'loadFileForComparison',
					logFile
				});
			}).catch(console.log);
	}

	/**
	 * Get the static html used for the editor webviews.
	 */
	private getHtmlForWebview(webview: vscode.Webview): string {
		// Local path to script and css for the webview
		const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'out', 'viewer', 'viewer.js'));

		const styleResetUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'reset.css'));

		const styleVSCodeUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'vscode.css'));

		const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(
			this.context.extensionUri, 'media', 'style.css'));

		// Use a nonce to whitelist which scripts can be run
		const nonce = getNonce();

		return /* html */`
			<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
				Use a content security policy to only allow loading images from https or from our extension directory,
				and only allow scripts that have a specific nonce.
				-->
				<!--<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
				-->
				<meta name="viewport" content="width=device-width, initial-scale=1.0">

				<link href="${styleResetUri}" rel="stylesheet" />
				<link href="${styleVSCodeUri}" rel="stylesheet" />
				<link href="${styleUri}" rel="stylesheet" />

				<title>Tracy</title>
			</head>
			<body>
				<div id='root'/>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}