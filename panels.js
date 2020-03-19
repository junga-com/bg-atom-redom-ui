'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import { Component, NormalizeComponentOptions, NormalizeComponentParameters } from './component'


// Panel is a container for an area of UI
// Classes:
//     padded  : pad the content of this area
// Params:
//     options : an object with various optional keys
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class Panel extends Component {
	constructor(options) {
		super('atom-panel', options);
	}
}

// PanelInset is a subsection inside a Panel that displays as a separate section to other insets.
// Example:
//     MyPanel
//        |-inset1
//        '-inset2
// Classes:
//     padded  : pad the content of this area
// Params:
//     options : an object with various optional keys
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class PanelInset extends Component {
	constructor(options) {
		super('div.inset-panel', options);
	}
}

// PanelHeader is a section inside a Panel or PanelInset
// Example:
//     MyPanel
//        |-inset1
//        |  |-header
//        |  '-content
//        '-inset2
// Classes:
//     padded  : pad the content of this area
// Params:
//     options : an object with various optional keys
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class PanelHeader extends Component {
	constructor(title, options) {
		if (typeof title == 'object' && typeof options == 'undefined') {
			options = title;
			title = undefined;
		}
		super({
			tagIDClasses: 'div.panel-heading',
			content: title,
			options: options
		});
	}
}

// PanelBody is a container for an area of UI
// Classes:
//     padded  : pad the content of this area
// Params:
//     options : an object with various optional keys
// Options:
//     <DOM properties and styles>    : See Component
//     children : array of children components passed to Component::mount. See Component::mount
export class PanelBody extends Component {
	constructor(options) {
		super('div.panel-body', options);
	}
}
