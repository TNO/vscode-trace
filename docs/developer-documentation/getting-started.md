# Getting started

## Prerequesites
- [Node.js](https://nodejs.org/en/) (version 18+ recommended) 
- [Git](https://git-scm.com/)
- [Visual Studio Code](https://code.visualstudio.com/)

## Useful links
- [Architecture](architecture.md)
- [Developer Guidelines](dev-guidlines.md)
- [Debugging](debugging.md)

## Developing
To develop Tracy:

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
To create a new release, go to the [CI GitHub action](https://github.com/TNO/vscode-tracy/actions/workflows/ci.yml) -> *Run workflow* -> adjust type accordingly -> *Run workflow*. Wait till build completes and add the [release notes](https://github.com/TNO/vscode-tracy/releases/latest).
