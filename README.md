# Tracy
Tracy is a Visual Studio Code extension for the analysis of logs. It is meant as a research platform to experiment with novel concepts.

<div align="center">
    <a href="https://github.com/TNO/vscode-tracy">
        <img height="500" src=".github/screenshot.png">
    </a>
</div>

## Installation
To install Tracy in Visual Studio Code: test
1. Obtain the plugin `.vsix` file:
    - If you want to install the latest release, go to the [Latest release](https://github.com/TNO/vscode-tracy/releases/latest) and download the `vscode-tracy-X.X.X.vsix` file under *Assests*.
    - If you want to install a specific commit, click on the :heavy_check_mark: next to the commit -> *Details* -> *Summary* -> under *Artifacts*, *vscode-vsix* and extract the downloaded `vscode-vsix.zip`.
1. Open Visual Studio Code, in the side bar go to *Extensions* -> `···` (right top) -> *Install from VSIX...* -> open the downloaded `vscode-tracy-X.X.X.vsix`.
1. Tracy is now installed and will be used as the default viewer for all `*.tracy.json` files. You can download an `example.tracy.json` from [here](https://github.com/TNO/vscode-tracy/raw/main/examples/dummy.tracy.json.zip) (extract before opening).
1. If you want to upgrade Tracy in the future, repeat the instructions above.

## User Guide

### Input File Format Guidelines

Tracy is designed to process log files represented in JSON format. The input log file must adhere to specific criteria outlined below to ensure optimal utilization of Tracy's capabilities.

1. **File Format:**
   - The input log file must be formatted in JSON. Specifically, it should be structured as a list of JSON objects, where each object represents a distinct event.
   - All events within the log file must possess identical fields, rendering the log as a tabular structure with rows representing events and columns representing event fields.
   - It is recommended that the input file contains only UTF-8 encoded characters. Non-UTF characters may lead to unexpected behavior or errors during processing by Tracy.

2. **Automated File Recognition:**
   - Files with the extension `*.tracy.json` will be automatically recognized and opened by Tracy without any additional configuration.

3. **Transformation for Non-JSON Files:**
   - If the input log file is not in JSON format, users are required to transform it before using Tracy.
   - To facilitate this transformation, an open source converter has been developed. This converter can be accessed [here](https://github.com/TNO/vscode-tracy-csv-converter), and it streamlines the process of converting non-JSON log files into the required JSON format.

4. **Column Configuration:**
   - If the input log file contains a column that indicates the timestamp of each event, then it should be explicitly named "Timestamp". Furthermore, for ease of use we suggest that such a column corresponds to the first column of each event.
   - Users are advised against including two specific column names, namely "Line" and "Structure," as these columns are utilized internally by Tracy.

### The minimap

A prominent feature is the minimap, which allows navigation and analysis of a log by representing information in the form of glyphs (colored rectangles). In the minimap, each column of the log is represented as a column of glyphs. Every value in the log column maps to a glyph, in such a way that different values map to different colors. For timestamp values, nearby timestamps map to nearby colors, so that a gradual progress of time shows as a smooth gradient in the first minimap column.

The minimap can be scaled (zoomed out and in) by holding the Control key and at the same time turning the mouse wheel, while the pointer is positioned over the minimap. The lines (rows) of the log that are visible, are indicated by a shaded area in the minimap. Scrolling the log is done with the scroll bar immediately to the left of the minimap, or by using the mouse wheel while the pointer is positioned over the log.

## User and Developer Documentation
For more information, check the [Tracy user and developer documentation](https://tno.github.io/vscode-tracy/).

## Developing
To develop Tracy:
1. Make sure that [Node.js](https://nodejs.org/en/) (version 18+ recommended) and [Git](https://git-scm.com/) are installed.
1. Execute: 
    ```bash
    # Clone the repository
    git clone https://github.com/TNO/vscode-tracy.git
    cd vscode-tracy
    # Install dependencies
    npm ci 
    # Open the repository in Visual Studio Code
    code .
    # Start the viewer in watch mode such that changes to src/viewer/* are applied on-the-fly
    npm run watch-viewer
    ```
1. In Vistual Studio Code, go to *Run* (menu bar) -> *Start Debugging*. A new Visual Studio Code instance (*Extension Development Host*) will be started with Tracy installed. Open a `*.tracy.json` file to see the viewer.
    - Changes made to `src/viewer/*` are applied on-the-fly as long as `npm run watch-viewer` from the previous step is running. You only need to close the viewer and re-open the `*.tracy.json` file.
    - Changes made to `src/extension/*` are **NOT** applied on-the-fly, to apply them go to *Run* (menu bar) -> *Restart Debugging*.

## Creating a new release
To create a new release, go to the [CI GitHub action](https://github.com/TNO/vscode-tracy/actions/workflows/ci.yml) -> *Run workflow* -> Choose *Branch*: **main** -> adjust the *Release type* accordingly -> *Run workflow*. Wait till build completes and add the [release notes](https://github.com/TNO/vscode-tracy/releases/latest).
