import TracyConverter from "./converter/TracyConverter";

export default interface ITracyAPI {
    registerCustomConverter: (converter: TracyConverter) => void;
}