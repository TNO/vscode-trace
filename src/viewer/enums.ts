export namespace enums {
	
	export enum StructureLinkDistance {
		None = "NONE",
		Min = "MIN",
		Max = "MAX",
	}

	export enum StructureHeaderColumnType {
		Unselected = "UNSELECTED",
		Selected = "SELECTED",
		Custom = "CUSTOM",
	}

	export enum DialogType {
		ExportDialog,
		StatesDialog,
		FlagsDialog,
		SelectDialog,
		StructureDialog
	}

	export enum EventTrigger {
		Initalisation,
		UserScroll,
		LogViewJump,
		Syncronize
	}
	
}