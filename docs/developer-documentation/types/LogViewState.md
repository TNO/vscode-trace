# LogViewState
---
```TS
interface LogViewState {
    height: number,
    start: number,
    visibleItems: number,
    startFloor: number,
    endCeil: number,
    scrollTop: number,
    scrollLeft: number,
    rowHeight: number
}
```
This interface contains all the values for rendering the log view.

- `height` - the height of the log view canvas, it is an integer (px).
- `start` - this value represents (approximately) where the current log view starts according to the entire log. The value is calculated by scrollTop/rowHeight, it is a float.
- `visibleItems` - the number of visible items in the current log view, mostly equal to (height / rowHeight), it is a float.
- `startFloor` - the number of the first item in the log view, rounds down the value of `start`, it is an integer.
- `endCeil` - the number of the last item in the log view, it is an integer. It is written, but not used.
- `scrollTop` - the number in pixels that shows how far the log content is scrolled vertically from the top, it is a float.
- `scrollLeft` - the number in pixels that shows how far the log content is scrolled horizontally from the left, it is a float.
- `rowHeight` - it is a constant, the value 28px.
