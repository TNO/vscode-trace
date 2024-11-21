import ITracyAPI from "./api/ITracyAPI";
import TracyConverter from "./api/converter/TracyConverter";

export default class TracyAPI implements ITracyAPI {

    private readonly customConverters: TracyConverter[] = [];

    constructor(...defaultConverters: TracyConverter[]) {
        defaultConverters.forEach((e) => this.registerCustomConverter(e));
    }

    registerCustomConverter(converter: TracyConverter) {
        this.customConverters.push(converter);
        console.log(`Registered custom converter: ${converter.name} for file extentions: ${converter.fileExtentions}`);
    }

    getConvertersForFile(filePath: string): TracyConverter[] {
        const extention = filePath.split('.').pop();
        if (!extention) return [];
        
        return this.getConvertersForFileExtention(extention);
    }

    getConvertersForFileExtention(extention: string): TracyConverter[] {
        return this.customConverters.filter((c) => c.fileExtentions.some((e) => e === extention));
    }

    getSuportedFileExtentions(): string[] {
        return this.customConverters.flatMap((e) => e.fileExtentions);
    }

}