# Getting Started

## Installation
To install Tracy in Visual Studio Code:
1. Obtain the plugin `.vsix` file:
    - If you want to install the latest release, go to the [Latest release](https://github.com/TNO/vscode-tracy/releases/latest) and download the `vscode-tracy-X.X.X.vsix` file under *Assests*.
    - If you want to install a specific commit, click on the :heavy_check_mark: next to the commit -> *Details* -> *Summary* -> under *Artifacts*, *vscode-vsix* and extract the downloaded `vscode-vsix.zip`.
1. Open Visual Studio Code, in the side bar go to *Extensions* -> `···` (right top) -> *Install from VSIX...* -> open the downloaded `vscode-tracy-X.X.X.vsix`.
1. Tracy is now installed and will be used as the default viewer for all `*.tracy.json` files. You can download an `example.tracy.json` from [here](https://github.com/TNO/vscode-tracy/raw/main/examples/dummy.tracy.json.zip) (extract before opening).
1. If you want to upgrade Tracy in the future, repeat the instructions above.

## User Guide

### Log format

Tracy assumes that a log is represented in JSON format. The log must be a list of JSON objects, with each object representing an event. Every event is assumed to have the same fields, with the first field being the timestamp of the event. Thus, the log can be viewed as a table where each row is an event and each column an event field, with the first column containing the timestamps.

Files with extension `*.tracy.json` will be automatically opened in Tracy.

### The minimap

A prominent feature is the minimap, which allows navigation and analysis of a log by representing information in the form of glyphs (colored rectangles). In the minimap, each column of the log is represented as a column of glyphs. Every value in the log column maps to a glyph, in such a way that different values map to different colors. For timestamp values, nearby timestamps map to nearby colors, so that a gradual progress of time shows as a smooth gradient in the first minimap column.

The minimap can be scaled (zoomed out and in) by holding the Control key and at the same time turning the mouse wheel, while the pointer is positioned over the minimap. The lines (rows) of the log that are visible, are indicated by a shaded area in the minimap. Scrolling the log is done with the scroll bar immediately to the left of the minimap, or by using the mouse wheel while the pointer is positioned over the log.