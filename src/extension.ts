import * as vscode from 'vscode';
import * as React from 'react';

export function activate(context: vscode.ExtensionContext) {

	const generateStyles = (file: any) => {
		const styles: string[] = [];
		const fileContent = file?.document.getText();
		fileContent.split('\n').forEach((line: string) => {
			if (line.includes('style={')) {
				const styleName = line.split('style={')[1].split('}')[0].split('.')[1];
				if(styleName && !styles.includes(styleName)){
					styles.push(styleName);
				}
			}
		});
		return styles;
	};

	const generateFile = async () => {
		const activeEditor = vscode.window.activeTextEditor;
		const path = activeEditor?.document.fileName;
		const createPath = path?.split('/').splice(0, path.split('/').length - 1).join('/');
		if (checkFileContent(activeEditor)){
			if (await checkFileExist(createPath!)){
			vscode.workspace.fs.writeFile(vscode.Uri.file(`${createPath}/styles.ts`), new TextEncoder().encode(''));

			const styles = generateStyles(activeEditor);
			const content = `import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
${styles.map((style: string) => `  ${style}: {}`).join(',\n')}
});

export default styles;`;
			vscode.workspace.fs.writeFile(vscode.Uri.file(`${createPath}/styles.ts`), new TextEncoder().encode(content));
			vscode.window.showInformationMessage('Styles generated successfully, Happy Coding!');
			}
		} else {
			vscode.window.showErrorMessage('This is not a valid component');
		}
	};

	const checkFileExist = async (createPath: string) => {
		try {
			await vscode.workspace.fs.stat(vscode.Uri.file(`${createPath}/styles.ts`));
		  } catch (error: any) {
			if (error.code === 'FileNotFound') {
			  await vscode.workspace.fs.writeFile(vscode.Uri.file(`${createPath}/styles.ts`), new Uint8Array());
			  return true;
			} else {
				return false;
			}
		  }
		try{
			const confirm = await vscode.window.showInformationMessage('style file already exists. Do you want to overwrite it?', { modal: true }, 'Yes', 'No');
			if(confirm === 'Yes'){
				return true;
			}else {
				return false;
			}
		}catch{
			return false;
		}
	};

	const checkFileContent = (file: any) => {
		try{
			const fileContent = file?.document.getText();
			const component = eval(fileContent);
			return React.isValidElement(component);
		}catch{
			return true;
		}
	};


	let disposable = vscode.commands.registerCommand('rn-style-generator.gen-styles', () => {
		generateFile();		
	});

	context.subscriptions.push(disposable);
}

export function deactivate() {}
