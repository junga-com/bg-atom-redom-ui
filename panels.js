import { Component } from './component'


// Panel is a the top-level container for an area of UI
// Classes:
//     padded  : pad the content of this area
// Params:
//    <tagIDClasses>:string : [name:][<tagName>][#<idName>][.className1[.className2...]][ textContent]
//    <content>:<multi>     : various content format. See Component
//    <namedParams>         : object with named parameters. See Component
// Named Params:
//    <DOM properties and styles and content> : Any key supported by Component.
// See Also:
//    See Component
export class Panel extends Component {
	constructor(...p) {
		super('$atom-panel', ...p);
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
	constructor(...p) {
		super('$div.inset-panel', ...p);
	}
}

// PanelHeader is a section inside a Panel or PanelInset
// Example:
//     MyPanel
//        |-inset1
//        |  |-header
//        |  '-content
//        '-inset2
// Supported Classes:
//     padded  : pad the content of this area
// Params:
//    <title>:string        : Content of the header. Must include a leading space because it is actually just a tagIDClasses parameter.
//                            'Hello'         -> ignored -- interpreted as tagName which is locked by this class. 
//                            ' Hello'        -> Text content is 'Hello'
//                            ' <b>Hello<p>'  -> html interpretted.
//                            '  <b>Hello<p>' -> html not interpretted -- text content is '<b>Hello<p>'.
//    <tagIDClasses>:string : [name:][<tagName>][#<idName>][.className1[.className2...]][ textContent]
//    <content>:<multi>     : various content format. See Component
//    <namedParams>         : object with named parameters. See Component
// Named Params:
//    <DOM properties and styles and content> : Any key supported by Component.
// See Also:
//    See Component
export class PanelHeader extends Component {
	// usage: new PanelHeader(<title> [,<tagIDClasses>] [,<options>] [,<childContent>] .. <in any order or repitition>)
	// usage: new PanelHeader(<options>)
	constructor(...p) {
		super('$div.panel-heading', ...p);
	}
}

// PanelBody is a container for an area of UI
// It is typically used to separate content from the PanelHeader
// Supported Classes:
//     padded  : pad the content of this area
// Params:
//    <tagIDClasses>:string : [name:][<tagName>][#<idName>][.className1[.className2...]][ textContent]
//    <content>:<multi>     : various content format. See Component
//    <namedParams>         : object with named parameters. See Component
// Named Params:
//    <DOM properties and styles and content> : Any key supported by Component.
// See Also:
//    See Component
export class PanelBody extends Component {
	// usage: new PanelBody([<tagIDClasses>] [,<options>] [,<childContent>] .. <in any order or repitition>)
	constructor(...componentInfo) {
		super('$div.panel-body', ...componentInfo);
	}
}
