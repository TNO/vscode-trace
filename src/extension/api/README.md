# Creating a custom converter
1. Add Tracy as a depencency to your extension `package.json`
``` JSON
"extensionDependencies": [
    "TNO.vscode-tracy"
]
```
2. To use the Tracy API, copy this `api` folder to the extension project
3. Create a custom converter
``` Typescript
import TracyConverter from "./api/converter/TracyConverter";
import TracyLogFile, { TracyLogData } from "./api/converter/TracyLogFile";

export default class MyCustomTracyConverter implements TracyConverter {
    name = 'MyCustomTracyConverter';
    fileExtentions = ['csv'];

    async parseLogFile(filePath: string): Promise<TracyLogFile> {
        // Parse file at filePath
        const content = 'file content';

        return this.parseLog(filePath, content);
    }
    
    async parseLog(filePath: string, content: string): Promise<TracyLogFile> {
        // Parse file from content string
        
        return {
            filePath,
            headers: [
                'DateTime',
                'Text',
                'ThreadName',
                'EventOrigin'
            ],
            rows,
            dateTimeIndex: 0
        }
    }
}
```
4. Register the custom converter
``` Typescript
export function activate(context: vscode.ExtensionContext) {
	const exports = vscode.extensions.getExtension('TNO.vscode-tracy')?.exports;
	if (!exports) {
		vscode.window.showErrorMessage("Tracy is not installed! Could not register custom Tracy Converters.");
		return;
	}

	const tracyAPI = exports as ITracyAPI;
	tracyAPI.registerCustomConverter(new MyCustomTracyConverter());
}
```