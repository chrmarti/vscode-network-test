import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';

export function activate(context: vscode.ExtensionContext) {
	
	let disposable = vscode.commands.registerCommand('vscode-network-test.testNetwork', async () => {
		const url = await vscode.window.showInputBox({
			value: 'https://update.code.visualstudio.com/api/update/server-linux-x64/stable/latest',
		});
		if (url) {
			const document = await vscode.workspace.openTextDocument({ content: `HTTP Proxy Setting: ${vscode.workspace.getConfiguration('http').get('proxy') ?? '<unset>'}
HTTP_PROXY: ${process.env.HTTP_PROXY ?? '<unset>'}
HTTPS_PROXY: ${process.env.HTTPS_PROXY ?? '<unset>'}
NO_PROXY: ${process.env.NO_PROXY ?? '<unset>'}
ALL_PROXY: ${process.env.ALL_PROXY ?? '<unset>'}

Node HTTP GET:
${await nodeGetInfo(url)}

Electron HTTP GET:
${await electronGetInfo(url)}
` });
			await vscode.window.showTextDocument(document);
		}
	});

	context.subscriptions.push(disposable);
}

function nodeGetInfo(url: string) {
	return new Promise<string>(resolve => {
		const httpx = url.startsWith('https:') ? https : http;
		const req = httpx.get(url, res => {
			const result = `Status Code: ${res.statusCode}
Status Message: ${res.statusMessage}
Headers: ${JSON.stringify(res.headers, undefined, '  ')}`;
			res.destroy();
			resolve(result);
		});
		req.on('error', err => {
			resolve(err && (err.stack || err.message) || String(err));
		});
		req.end();
	});
}

async function electronGetInfo(url: string) {
	try {
		const result: vscode.Uri | undefined = await vscode.commands.executeCommand('_workbench.downloadResource', vscode.Uri.parse(url));
		return result ? 'succeeded' : 'failed';
	} catch (err: any | undefined) {
		return err && (err.stack || err.message) || String(err);
	}
}
