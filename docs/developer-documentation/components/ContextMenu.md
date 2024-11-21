# Component name
(Screenshot of component - Optional)

---
(Short description)

## Relations to other components

- **Parent:** ParentComponent
- **Children:**
	- Child1
	- Child2

## Props

| Name | Type | Description |
| ---- | ---- | ----------- |
| `prop1` | `type1` | short description |
| `prop2` | `type2` | short description |
| `prop3` | `type3` | short description |

## State

| Name | Type | Initial Value | Description |
| ---- | ---- | ------------- | ----------- |
| `stateObj1` | `type1` | `init value` | short description |
| `stateObj2` | `type1` | `init value` | short description |
| `stateObj3` | `type1` | `init value` | short description |

## Functions
### Component lifecycle functions
- ### `constructor(...)`
	- **Params:** 
	    - `props: Props`
	- **Description:**  Is invoked the first time the `StructureDialog` is opened. It constructs an array containing [StructureEntries](..\Types\StructureEntry.md) from the `logSelectedRows` props and updates the state accordingly.
	- **Returns:** -

- ### `shouldComponentUpdate(...)`
	- **Params:**
        - `nextProps: Readonly<Props>`
        - `nextState: Readonly<State>`
        - `nextContext: any`
	- **Description:** This function returns a `boolean` value that indicates whether or not rendering should be skipped. It returns `true` if ..., and ... otherwise.
	- **Returns:** `boolean`

- ### `render()`
	- **Description:**
	- **Returns:** Div of type `JSX.Element` containing....

### Functionality-related functions
- ### `exampleFunctionWithNoParams()`
	- **Description:** short description of what happens in the function.
	- **Returns:** -

- ### `exampleFunctionWithParams(...)`
	- **Params:**
	    - `name: type`
	- **Description:** short description of what happens in the function.
	- **Returns:** -
