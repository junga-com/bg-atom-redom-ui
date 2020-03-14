'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import { Component, NormalizeComponentOptions, NormalizeComponentParameters } from './component'
import { Tooltip } from './tooltips'

// standard Button.
// Params:
//     [name:][icon-<icnName> ][label] : The first parameter is a string that contains 1 to 3 attributes of the button.
//           name : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback. A container component may also use this as the property name to store this button in.
//           icon-<icnName> : a name of one of the icons in the Atom Style Guide (ctrl-shift-G). The icon will appear to left of label
//           label: The text displayed in the button.
//     onActivatedCB(button,e) : a callback function invoked when the button is activated by click or keyboard. This object is passed
//                as the first parameter and the event that caused the activation, if any, is passed in the second parameter.
//     options  : an object with various optional keys. See Options: section below for details
//     paramNames : intended only for derived classes. a string with a space separated list of names of properties in options that
//                  the derviced class will process. Button will put those in this.optParams but otherwise ignore them.
// Options:
//     focusOnMouseClick : if true, change the focus to the button when its clicked with the mouse. This is the default for html
//             buttons but this component changes it so that it will not steal the focus with mouse clicked. The user can still give
//             it the focus by keyboard navigation. Setting this option to true, returns to the default behavior where the focus will
//             be left on the button after clicking. Typically toolbar buttons should not steal the focus but form buttons may want to.
//     style : sub-object containing style properties to add to the Button's this.el DOM element. Note that most style properties
//             can also be specified at the top level of options.
//     <Style properties> : any (most?) Style property can be specified (at the top level) and will be set in this Button's el.style 
//     <DOM properties> : any DOM property can be specified and will be set on the this.el DOM object
export class Button {
	constructor(nameIconLabel, onActivatedCB,  options, paramNames) {
		({tagIDClasses:nameIconLabel, options, paramNames, callback: onActivatedCB} = NormalizeComponentParameters(nameIconLabel, onActivatedCB, options, paramNames));
		var optChildren;
		[this.optRedom, this.optParams, optChildren] =  NormalizeComponentOptions(options, paramNames + " focusOnMouseClick");
		this.onActivatedCB = onActivatedCB;

		// parse the nameIconLabel with a regex with named groups to identify the matched parts.
		var matches = /^((?<name>[^:]*):)?((?<icon>icon-[-a-zA-Z0-9]*)\s?)?(?<label>.*)$/.exec(nameIconLabel);
		this.name     = matches.groups.name;
		this.label    = matches.groups.label;
		this.iconName = matches.groups.icon;
		
		if (this.name)
			this.optRedom.class += " "+name;

		if (this.iconName)
			this.optRedom.class += " icon "+this.iconName;

		this.el = el("button.btn", this.optRedom);
		this.setLabel(this.label)
		this.el.onclick = (e)=>{this.onClick(e)};

		if (! this.optParams["focusOnMouseClick"])
			this.el.onmousedown = ()=>{this.lastFocused=document.activeElement}

		// TODO: this should use the same algorithm as Component::mount
		if (optChildren)
			for (var i=0; i<optChildren.length; i++) {
				mount(this.el, optChildren[i]);	
			}
	}

	onClick(e) {
		this.lastFocused && this.lastFocused.focus(); this.lastFocused=null;
		this.onActivatedCB && this.onActivatedCB(this, e);
	}

	getLabel() {return this.label}

	setLabel(label) {
		this.label = label;
		if (/^<[^>]+>/.test(this.label))
			this.el.innerHTML = this.label;
		else
			this.el.innerText = this.label
	}
}

// ToggleButton is two-state. When activated it toggles between pressed(true) and unpressed(false). The callback is passed the 
// pressed state. The presence of the .pressed class determines the current state and styling 
// Params:
//     [name:][icon-<icnName> ][label] : The first parameter is a string that contains 1 to 3 attributes of the button.
//           name : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback. A container component may also use this as the property name to store this button in.
//           icon-<icnName> : a name of one of the icons in the Atom Style Guide (ctrl-shift-G). The icon will appear to left of label
//           label: The text displayed in the button.
//     onActivatedCB(isPressed, this) : a callback function invoked when the button is activated by click or keyboard. The current
//                 pressed state and this object are passed as parameters 
//     options  : an object with various optional keys
// Options:
//     pressed  : if true, the button will start in the pressed state
//     focusOnMouseClick : if true, change the focus to the button when its clicked with the mouse. This is the default for html
//         buttons but this component changes it so that it will not steal the focus with mouse clicked. The user can still give
//         it the focus by keyboard navigation. Setting this option to true, returns to the default behavior where the focus will
//         be left on the button after clicking. Typically toolbar buttons should not steal the focus but form buttons may want to.
//     style : sub-object containing style properties to add to the Button's this.el DOM element. Note that most style properties
//             can also be specified at the top level of options.
//     <Style properties> : any (most?) Style property can be specified (at the top level) and will be set in this Button's el.style 
//     <DOM properties> : any DOM property can be specified and will be set on the this.el DOM object
export class ToggleButton extends Button {
	constructor(nameIconLabel, onActivatedCB,  options) {
		super(nameIconLabel, onActivatedCB,  options, "pressed");
		this.setPressedState(Boolean(this.optParams["pressed"]));
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
//     cmdName  : the Atom command that the button will invoke. Same syntax as keymaps.
//     [name:][icon-<icnName> ][label] : The second parameter is a string that contains 1 to 3 attributes of the button.
//           name : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback. A container component may also use this as the property name to store this button in.
//           icon-<icnName> : a name of one of the icons in the Atom Style Guide (ctrl-shift-G). The icon will appear to left of label
//           label: The text displayed in the button.
//     options  : an object with various optional keys
// Options:
//     target   : target context node for the command. default is atom.workspace.getElement()
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class CommandButton extends Button {
	constructor(cmdName, nameIconLabel, options) {
		super(nameIconLabel, ()=>this.onClick(),  options, "target");
		this.cmdName = cmdName;

		this.cmdTarget = this.optParams["target"] || atom.workspace.getElement();
		const allCommands = atom.commands.findCommands({target: this.cmdTarget});
		const command = allCommands.filter((command) => command.name === cmdName)[0];

		if (!this.getLabel() && !this.iconName) {
			this.setLabel(command.displayName);
			this.toolTipTitle = command.description;
		} else
			this.toolTipTitle = command.displayName;

		setTimeout(()=>{
			this.toolTipDispose = atom.tooltips.add(this.el, {title: this.toolTipTitle, keyBindingCommand: this.cmdName}); //,  keyBindingTarget: this.cmdTarget
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
export class Toolbar extends Component {
	constructor(options) {
		super("div.btn-toolbar", options);
	}
}

// A ToolGroup is a container for buttons or other controls that are related. Typically, a Toolbar can have multiple ToolGroups
// and individual tool items like buttons.  The grouped tools typically are spaced next to each other without space.
// Options:
export class ToolGroup extends Component {
	constructor(options) {
		super('div.btn-group', options)
	}
}


// OneShotButton stays pressed when its activated and wont fire its onActivatedCB again until it is reset. Calling reset makes it
// appear unpressed and it can then be pressed (activated) again. It is used by RadioButtonGroup which resets all the other buttons
// when any button in the group is pressed.
// Params:
//     [name:][icon-<icnName> ][label] : The first parameter is a string that contains 1 to 3 attributes of the button.
//           name : variable-like name used for the button. Useful to identify which button was activated when multiple buttons share
//                a single onActivatedCB callback. A container component may also use this as the property name to store this button in.
//           icon-<icnName> : a name of one of the icons in the Atom Style Guide (ctrl-shift-G). The icon will appear to left of label
//           label: The text displayed in the button.
//     onActivatedCB(isPressed, this) : a callback function invoked when the button is activated by click or keyboard. The current
//                 pressed state and this object are passed as parameters 
//     options  : an object with various optional keys
// Options:
//     pressed  : if true, the button will start in the pressed state
//     focusOnMouseClick : if true, change the focus to the button when its clicked with the mouse. This is the default for html
//         buttons but this component changes it so that it will not steal the focus with mouse clicked. The user can still give
//         it the focus by keyboard navigation. Setting this option to true, returns to the default behavior where the focus will
//         be left on the button after clicking. Typically toolbar buttons should not steal the focus but form buttons may want to.
//     style : sub-object containing style properties to add to the Button's this.el DOM element. Note that most style properties
//             can also be specified at the top level of options.
//     <Style properties> : any (most?) Style property can be specified (at the top level) and will be set in this Button's el.style 
//     <DOM properties> : any DOM property can be specified and will be set on the this.el DOM object
export class OneShotButton extends ToggleButton {
	constructor(nameIconLabel, onActivatedCB, options) {
		super(nameIconLabel, onActivatedCB,  options);
	}
	reset() {
		this.setPressedState(false);
	}
	onClick() {
		this.lastFocused && this.lastFocused.focus(); this.lastFocused=null;
		if (!this.isPressed()) {
			this.el.classList.toggle("selected", true);
			this.onActivatedCB && this.onActivatedCB(this.name || this.el.id, this);
		}
	}
}

// A RadioButtonGroup is a container of OneShotButton in which exactly one is pressed at a time.
// Params:
//     onChangeCB(buttonName) : a callback that gets called whenever the selection changes.
//     selectedButtonName     : the button that is pressed initially
//     buttonsData   : an array describing the buttons. The button data is the information needed for the Button constructor. 
//              string button data: the [name:][icon-<icnName> ][label] accepted by the Button class.
//              object button data: the options object accepted by the Button class additionally with a 'label' property containing
//                                  the [name:][icon-<icnName> ][label] parameter.
//     options : the properties recognized in the options param are described in the Options section
// Options:
export class RadioButtonGroup extends Component {
	constructor(onChangeCB, selectedButtonName, buttonsData, options) {
		super('div.btn-group.mutex', options);
		this.onChangeCB = onChangeCB;
		this.value = selectedButtonName;
		for (var i=0; buttonsData && i<buttonsData.length; i++) {
			if (typeof buttonsData[i] == 'string') {
				var btn = new OneShotButton(buttonsData[i], (buttonName)=>this.onChange(buttonName));
			} else {
				var btn = new OneShotButton(buttonsData[i]["label"], (buttonName)=>this.onChange(buttonName), buttonsData[i], "label");
			}
			btn.name = (btn.name) ? btn.name : "btn"+i;
			this[btn.name] = btn;
			btn.setPressedState(btn.name == selectedButtonName)
			redomMount(this, this[btn.name]);
			this.mounted.push(btn.name);
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
		super('test:div.atom-panel', options);
	}
}
