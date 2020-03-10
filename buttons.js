'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import { Component } from './component'
import { Tooltip } from './tooltips'

// standard Button.
// Params:
//     label    : The text displayed in the button or an icon ID if it begins with 'icon-'. (icon-<iconName>) See Style guide (ctrl-shift-G)
//                for available iconNames (hover over the icon)
//     onActivatedCB(button) : a callback function invoked when the button is activated by click or keyboard. This object is passed
//                as a parameter.
//     options  : an object with various optional keys
// Options:
//     name     : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback.
//     focusOnMouseClick : if true, change the focus to the button when its clicked with the mouse. This is the default for html
//         buttons but this component changes it so that it will not steal the focus with mouse clicked. The user can still give
//         it the focus by keyboard navigation. Setting this option to true, returns to the default behavior where the focus will
//         be left on the button after clicking. Typically toolbar buttons should not steal the focus but form buttons may want to.
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class Button {
	constructor(label, onActivatedCB,  options) {
		this.onActivatedCB = onActivatedCB;
		this.options = options || {};
		var matches;
		if (matches = label.match(/^(icon-[-a-zA-Z0-9]*)(.*)$/)) {
			var iconName = matches[1];
			label = matches[2];
			if (!this.options["attr"]) this.options.attr = {}
			this.options.attr.class += " icon "+iconName;
		}
		this.el = el("button.btn", this.label = text(label), this.options["attr"]);

		this.el.onclick = ()=>{this.onClick()};
		// redomMount(this.el, new Tooltip("hey you"));
		if (! this.options["focusOnMouseClick"])
			this.el.onmousedown = ()=>{this.lastFocused=document.activeElement}
	}
	onClick() {
		this.lastFocused && this.lastFocused.focus(); this.lastFocused=null;
		this.onActivatedCB && this.onActivatedCB(this);
	}
}

// ToggleButton is two-state. When activated it toggles between pressed(true) and unpressed(false). The callback is passed the 
// pressed state. The presence of the .pressed class determines the current state and styling 
// Params:
//     label    : The text displayed in the button or an icon ID if it begins with 'icon-'. (icon-<iconName>) See Style guide (ctrl-shift-G)
//                for available iconNames (hover over the icon)
//     onActivatedCB(isPressed, this) : a callback function invoked when the button is activated by click or keyboard. The current
//                 pressed state and this object are passed as parameters 
//     options  : an object with various optional keys
// Options:
//     pressed  : if true, the button will start in the pressed state
//     name     : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback.
//     focusOnMouseClick : if true, change the focus to the button when its clicked with the mouse. This is the default for html
//         buttons but this component changes it so that it will not steal the focus with mouse clicked. The user can still give
//         it the focus by keyboard navigation. Setting this option to true, returns to the default behavior where the focus will
//         be left on the button after clicking. Typically toolbar buttons should not steal the focus but form buttons may want to.
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class ToggleButton extends Button {
	constructor(label, onActivatedCB,  options) {
		super(label, onActivatedCB,  options);
		this.setPressedState(Boolean(this.options["pressed"]));
	}
	onClick() {
		this.lastFocused && this.lastFocused.focus(); this.lastFocused=null;
		this.el.classList.toggle("selected");
		this.onActivatedCB && this.onActivatedCB(this.isPressed(), this);
	}
	isPressed() {
		return this.el.classList.contains("selected");
	}
	setPressedState(state) {
		this.el.classList.toggle("selected", state);
	}
}


// CommandButton is a Button that invokes a Atom command when clicked. It is constructed from the command name and handles the 
// onActivatedCB itself. It gleans default values to create a tool tip
// properties
// Params:
//     options  : an object with various optional keys
// Options:
//     target   : target context node for the command. default is atom.workspace.getElement()
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class CommandButton extends Button {
	constructor(cmdName, label, options) {
		options = options || {}
		const cmdTarget = options["target"] || atom.workspace.getElement();
		const allCommands = atom.commands.findCommands({target: cmdTarget});
		const command = allCommands.filter((command) => command.name === cmdName)[0];

		super(label || command.displayName, ()=>this.onClick(),  options);
		this.cmdName = cmdName;
		this.cmdTarget = cmdTarget;

		setTimeout(()=>{
			this.toolTipDispose = atom.tooltips.add(this.el, {title: (label) ? command.displayName : command.description, keyBindingCommand: this.cmdName}); //,  keyBindingTarget: this.cmdTarget
		}, 1000);
	}
	onClick() {
		atom.commands.dispatch(this.cmdTarget, this.cmdName);
	}
	destroy() {
		this.toolTipDispose.dispose();
	}
}



// A Toolbar is a container for buttons and other input and informational controls
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
//     children : array of children components to add to the Toolbara. See Element.mount
export class Toolbar extends Component {
	constructor(options) {
		super("div.btn-toolbar", options);
	}
}

// A ToolGroup is a container for buttons or other controls that are related. Typically, a Toolbar can have multiple ToolGroups
// and individual tool items like buttons.  The grouped tools typically are spaced next to each other without space.
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
//     children : array of children components to add to the Toolbara. See Element.mount
export class ToolGroup extends Component {
	constructor(options) {
		super('div.btn-group', options)
	}
}



// This class is mainly meant to be used by the RadioButtonGroup component but its possible you might find other uses for it. 
// It is like a ToggleButton but it stays pressed when clicked multiple times. It relies on the RadioButtonGroup to un-press it
// when another button in the group is pressed
class MutexToggleButton extends ToggleButton {
	constructor(label, onActivatedCB, isPressed, options) {
		super(label, onActivatedCB,  options);
		this.setPressedState(isPressed);
	}
	onClick() {
		this.lastFocused && this.lastFocused.focus(); this.lastFocused=null;
		if (!this.isPressed()) {
			this.el.classList.toggle("selected", true);
			this.onActivatedCB && this.onActivatedCB(this.el.id, this);
		}
	}
	isPressed() {
		return this.el.classList.contains("selected");
	}
	setPressedState(state) {
		this.el.classList.toggle("selected", state);
	}
}

// A RadioButtonGroup is a container of MutexToggleButton in which exactly one is pressed at a time.
// Params:
//     onChangeCB(buttonName) : a callback that gets called whenever the selection changes.
//     selectedButtonName     : the button that is pressed initially
//     buttonsData            : an array of objects describing the buttons. Each object can have these attributes.
//                              name : (required) variable-like name that is the value when that button is pressed
//                              label: the text displayed in the button
//                              <styles and properties> : additional settings for the button element
//     options : the properties recognized in the options param are described in the Options section
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class RadioButtonGroup extends Component {
	constructor(onChangeCB, selectedButtonName, buttonsData, options) {
		super('div.btn-group.mutex', options);
		this.onChangeCB = onChangeCB;
		this.value = selectedButtonName;
		for (var i=0; buttonsData && i<buttonsData.length; i++) {
			var name = buttonsData[i]["name"];
			this[name] = new MutexToggleButton(buttonsData[i]["label"], (name == selectedButtonName), (buttonName)=>this.onChange(), buttonsData[i]);
			redomMount(this, this[name]);
			this.mounted.push(name);
		}
	}
	onChange(buttonName) {
		this.value = buttonName;
		for (var i=0; i>this.mounted.length; i++) {
			this[this.mounted[i]].setPressedState((this.mounted[i] == buttonName));
		}
		this.onChangeCB(buttonName);
	}
	setValue(buttonName) {
		this.onChange(buttonName);
		this.value = buttonName;
	}
}




// Panel is a container for an area of UI
// Params:
//     options : an object with various optional keys
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
//     children : array of children components to add. See Element.mount for the array syntax
export class Panel extends Component {
	constructor(options) {
		super('div.atom-panel', options);
	}
}
