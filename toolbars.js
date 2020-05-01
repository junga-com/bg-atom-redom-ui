import { Component } from './component'

// A Toolbar is a container for buttons and other input and informational controls
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class Toolbar extends Component {
	constructor(...options) {
		super("$div.btn-toolbar", ...options);
	}
}

// A ToolGroup is a container for buttons or other controls that are related. Typically, a Toolbar can have multiple ToolGroups
// and individual tool items like buttons.  The grouped tools typically are spaced next to each other without space.
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class ToolGroup extends Component {
	constructor(...options) {
		super('$div.btn-group', ...options)
	}
}
