// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { HelloWorldView } from './views/HelloWorldView';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "code-inserter" is now active!');

	const helloWorldProvider = new HelloWorldView(context.extensionUri);
	
	// WebviewViewProviderを登録
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			HelloWorldView.viewType,
			helloWorldProvider
		)
	);

	// この古いコマンド登録は不要になったため、削除か無効化してもOK
	const disposable = vscode.commands.registerCommand('code-inserter.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Code Inserter!');
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
