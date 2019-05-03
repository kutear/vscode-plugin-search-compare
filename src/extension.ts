// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import {TextEditorRevealType} from 'vscode';
import * as fs from 'fs';
import {searchKeywordByContent} from "./search_action";
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
const scheme = "search-compare";

export function activate(context: vscode.ExtensionContext) {

    const invokeScroll = (target: vscode.TextEditor) => {
        syncSideSearchComparePanel(target, target.visibleRanges);
    };

    // sync scroll
    const syncSideSearchComparePanel = (target: vscode.TextEditor, range: vscode.Range[]) => {
        const uriWithSamePath = (uri1: vscode.Uri, uri2: vscode.Uri): boolean => {
            return uri2.path === uri1.path;
        };

        // find the editor that need sync scroll
        const findSyncEditor = (target: vscode.TextEditor): vscode.TextEditor | undefined => {
            return vscode.window.visibleTextEditors.find((editor) => {
                return uriWithSamePath(editor.document.uri, target.document.uri) && editor.document.uri.scheme !== target.document.uri.scheme;
            });
        };

        const syncEditor = findSyncEditor(target);
        if (syncEditor) {
            syncEditor.revealRange(range[0], TextEditorRevealType.AtTop);
        } else {
            console.log(`not found side search compare panel for ${target.document.uri.path}`);
        }
    };

    const textEditorScrollEventListener = (event: vscode.TextEditorVisibleRangesChangeEvent) => {
        if (event.textEditor.document.uri.scheme !== scheme) {
            syncSideSearchComparePanel(event.textEditor, event.visibleRanges);
        }
    };

    const searchCompareProvider = new class implements vscode.TextDocumentContentProvider {
        onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
        onDidChange = this.onDidChangeEmitter.event;


        provideTextDocumentContent(uri: vscode.Uri, token: vscode.CancellationToken): vscode.ProviderResult<string> {
            const queryStr = uri.query;
            const keyValue = queryStr.split("=");
            const searchKeyword = keyValue[1];
            if (fs.existsSync(uri.path)) {
                const content = fs.readFileSync(uri.path);
                return searchKeywordByContent(content.toString(), searchKeyword);
            }
            return searchKeyword;
        }
    };

    context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(scheme, searchCompareProvider));

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "search-compare" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let registerCommandDisposable = vscode.commands.registerCommand('extension.search-compare', async () => {
        if (vscode.window.activeTextEditor) {
            const activeTextEditor = vscode.window.activeTextEditor;
            const search = await vscode.window.showInputBox({placeHolder: 'search compare keyword'});
            if (search) {
                const activeDocUri = activeTextEditor.document.uri;
                const searchCompareUri = vscode.Uri.parse(`${scheme}://${activeDocUri.path}?query=${search}`);
                const document = await vscode.workspace.openTextDocument(searchCompareUri);
                vscode.window.showTextDocument(document, vscode.ViewColumn.Two);
                setTimeout(() => {
                    invokeScroll(activeTextEditor);
                }, 500);
            } else {
                console.log("input nothing");
            }
        } else {
            console.log("no file is active");
        }
    });

    let windowsVisibleRangesDisposable = vscode.window.onDidChangeTextEditorVisibleRanges(textEditorScrollEventListener);
    context.subscriptions.push(registerCommandDisposable);
    context.subscriptions.push(windowsVisibleRangesDisposable);
}


// this method is called when your extension is deactivated
export function deactivate() {
}
