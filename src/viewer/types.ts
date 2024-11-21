import { CustomDisplayString } from "./interfaces";

export namespace types {
    export type TracyLogData = string | number | boolean | Date | null | undefined | CustomDisplayString;
}