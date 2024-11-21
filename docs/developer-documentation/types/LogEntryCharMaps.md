# Name

```TS
interface LogEntryCharMaps {
	firstCharIndexMap;
	lastCharIndexMap;
}
```

This type is used to represent an object containing two JavaScript [`Map`(s)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map). These maps store the first and last char indices of each log entry. These indices are used for the Segment Annotation and Structure Matching features and Search (with Regular Expressions).