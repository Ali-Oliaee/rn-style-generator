import * as vscode from "vscode"
import * as React from "react"

export function activate(context: vscode.ExtensionContext) {
  const generateStyles = (file: any) => {
    const styles: string[] = []
    const fileContent = file?.document.getText()

    const styleRegex = /style\s*=\s*{\s*(styles\.[\w]+|\[.+\])\s*}/g
    let match

    while ((match = styleRegex.exec(fileContent)) !== null) {
      const styleValue = match[1]

      if (styleValue.startsWith("[")) {
        const arrayStyleRegex = /styles\.([\w]+)/g
        let arrayMatch
        while ((arrayMatch = arrayStyleRegex.exec(styleValue)) !== null) {
          const styleName = arrayMatch[1]
          if (styleName && !styles.includes(styleName)) {
            styles.push(styleName)
          }
        }
      } else {
        const styleName = styleValue.split(".")[1]
        if (styleName && !styles.includes(styleName)) {
          styles.push(styleName)
        }
      }
    }

    return styles
  }

  const generateStylesFile = async () => {
    const activeEditor = vscode.window.activeTextEditor
    const path = activeEditor?.document.fileName
    const createPath = path
      ?.split("/")
      .splice(0, path.split("/").length - 1)
      .join("/")
    if (checkFileContent(activeEditor)) {
      if (await checkFileExist(createPath!)) {
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${createPath}/styles.ts`),
          new TextEncoder().encode("")
        )

        const styles = generateStyles(activeEditor)
        const content = `import { StyleSheet } from 'react-native';\n
const styles = StyleSheet.create({
${styles.map((style: string) => `  ${style}: {}\n`)}
});\n
export default styles;`
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${createPath}/styles.ts`),
          new TextEncoder().encode(content)
        )
        vscode.window.showInformationMessage(
          "Styles generated successfully, Happy Coding!"
        )
      }
    } else vscode.window.showErrorMessage("This is not a valid component")
  }

  const generateTypesFile = async () => {
    const activeEditor = vscode.window.activeTextEditor
    const path = activeEditor?.document.fileName
    const createPath = path
      ?.split("/")
      .splice(0, path.split("/").length - 1)
      .join("/")
    if (checkFileContent(activeEditor)) {
      if (await checkFileExist(createPath!)) {
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${createPath}/types.ts`),
          new TextEncoder().encode("")
        )
        const content = `export interface Props {}\n`
        vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${createPath}/types.ts`),
          new TextEncoder().encode(content)
        )
        vscode.window.showInformationMessage(
          "Styles generated successfully, Happy Coding!"
        )
      }
    } else vscode.window.showErrorMessage("This is not a valid component")
  }

  const checkFileExist = async (createPath: string) => {
    try {
      await vscode.workspace.fs.stat(vscode.Uri.file(`${createPath}/styles.ts`))
    } catch (error: any) {
      if (error.code === "FileNotFound") {
        await vscode.workspace.fs.writeFile(
          vscode.Uri.file(`${createPath}/styles.ts`),
          new Uint8Array()
        )
        return true
      } else {
        return false
      }
    }
    try {
      const confirm = await vscode.window.showInformationMessage(
        "file already exists. Do you want to overwrite it?",
        { modal: true },
        "Yes",
        "No"
      )
      if (confirm === "Yes") return true
      else return false
    } catch {
      return false
    }
  }

  const checkFileContent = (file: any) => {
    try {
      const fileContent = file?.document.getText()
      const component = eval(fileContent)
      return React.isValidElement(component)
    } catch {
      return true
    }
  }

  const prependToCurrentFile = async () => {
    const prependContent = `import { Props } from './types'\nimport styles from './styles'\n`
    const activeEditor = vscode.window.activeTextEditor
    if (activeEditor) {
      const document = activeEditor.document
      const currentContent = document.getText()
      const newContent = prependContent + currentContent
      const edit = new vscode.WorkspaceEdit()
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(currentContent.length)
      )
      edit.replace(document.uri, fullRange, newContent)
      await vscode.workspace.applyEdit(edit)
      vscode.window.showInformationMessage(
        "Content prepended successfully, Happy Coding!"
      )
    } else vscode.window.showErrorMessage("No active editor found")
  }

  let disposable = vscode.commands.registerCommand(
    "rn-style-generator.gen-styles",
    () => {
      generateStylesFile()
      generateTypesFile()
      prependToCurrentFile()
    }
  )

  context.subscriptions.push(disposable)
}

export function deactivate() {}
