import fs from 'fs';
import TracyConverter from "./api/converter/TracyConverter";
import TracyLogFile from "./api/converter/TracyLogFile";

export default class DefaultJsonConverter implements TracyConverter {
    name = 'DefaultJsonConverter';
    fileExtentions = ['json'];

    async parseLogFile(filePath: string): Promise<TracyLogFile> {
        const content = await fs.promises.readFile(filePath, "utf-8");
        return this.parseLog(filePath, content);
    }

    async parseLog(filePath: string, content: string): Promise<TracyLogFile> {
        const json = JSON.parse(content);
		const headers = this.getHeaders(json);
		const rows = json.map((l: any) => headers.map((h) => l[h]));
        let dateTimeIndex = this.searchForDateTimeColumn(headers);

        return {
            filePath,
            headers,
            rows,
            dateTimeIndex
        }
    }

	// Headers are all keys that are present in the first object (row)
	private getHeaders(content: { [s: string]: string }[]) {
		const firstRow = content[0] ?? {};
		const contentHeaders = Object.keys(firstRow);
		return contentHeaders;
	}

    private searchForDateTimeColumn(headers: string[]) {
        const dateTimeIndex = headers.findIndex((h) => h.toLowerCase().includes('time'));
        if (dateTimeIndex !== -1) {
            return dateTimeIndex;
        }
    }

}