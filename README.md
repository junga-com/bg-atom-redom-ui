# bg-dom

# 2020-09 Status
This package is being evolved into a more general JS component UI framework and may not be limited to use in Atom. The only dependency
on Atom at this point is that it uses the Atom CSS classnames and the TextEditor editor component uses custom DOM objects provided by Atom.
As things that really are Atom specific are found, they will moved into the bg-atom-utils package which now depends on this package
instead of the other way around.

This is an NPM package that provides a Components library that is compliant with the Atom style guide and built on top of something
that was originally inspired by the REDOM library. The dependency on REDOM is also all but gone. I am now calling the components
BGComponents which are typically inherited from bg-dom::Component but do not have to be. Any REDOM style component or
plain DOM object can participate in the patterns.

The beauty of REDOM is that it is lightweight and requires very little from a JS object to be able to treat it like a REDOM component.
The main requirement is that it has an 'el' property that references its DOM object. This library continues that but also provides
enhanced ways to create components by composing knowledge implemented in different places at different points in the software lifecycle.

This is a work in progress. The idea is to explore programming in JS/DOM in more of a programming style than markup but still have good css separation.


# BGComponents...

A BGComponent is a JS-centric way of building and changing the DOM structure that focuses on initial construction and manipulation actions rather than the typical render pattern.

Components are recursive and composable.

There are two independent hierarchies that work together to produce the final DOM -- the Component Type hierarchy and the Component Object hierarchy. Every OO system has these two natures.

## Component Object Hierarchy

The Object Hierarchy is the DOM hierarchy. Each instance of a Component you create is mounted (aka inserted) into the DOM at a particular point and introduces a sub tree of the Object Hierarchy below it. The constructor of each component builds its sub tree content.

An important point to keep in mind is that you can build any Object Hierarchy you can imagine using only the Component base class. The Component constructor allows specifying the attributes and sub tree content in a a flexible way.

For each Component you create, you can define define these qualities.
* tagName : the type of HTML node -- div, span, button, <custom>, etc...
* id : optional. Not often used because its absolute on the page as opposed to relative to where it is so you can only use an id on singleton components that can not be created more than once in a page
* class : list of tags that classify the node.
* DOMProperties : any supported properties of the tagName
* StyleAttributes : any style
* content : the sub tree below this Component. Can be text string, html string, DOMNode, Component, object to construct a Component, or an array of any of those things.

As always with DOM programming, there is a dualism between the DOM nodes and the JS objects that are associated with them. The BGComponent instance Object hierarchy reflects the DOM node hierarchy but not completely. There will be subtree sections that are represented with known BGComponents that are linked via member variables so that JS code can navigate from one BGComponent to its children BGComponents but it typically wont be complete nor should it be.   

## Component Type Hierarchy

Even though the base Component class is sufficient to create any Object Hierarchy, it would be verbose and require a lot of repeated data declarations.  The Component Type Hierarchy allows us to eliminate those repeated declarations and make the syntax more compact and efficient.

The Component Type Hierarchy is a set of classes that extend from Component or another class that extends Component. A specific component class can have multiple classes in its super class chain before it gets back to Component (or a class that implements the same required features as Component).

Think of a class that extends Component as a template that specifies some of the qualities for the Component instance being created. For example, instead of having to specify that tagName="button" when constructing a Component, you can create a Button which extends Component so that is done for you.

The task of writing a specific type of component that extends Component is first of all, about specifying the new default qualities that the create DOM node should have. Component has reasonable default values that results in a very plain, generic, empty &lt;div&gt; element node but a more specific component Class changes those defaults so that it results in a different element being created with different properties by default and with a particular sub tree of content underneath it.

 A particular component class might have a deep hierarchy where each class in the hierarchy further refines or overrides the default qualities specified in the classes before it in the hierarchy.  The last conceptual 'class' in the hierarchy is the code that creates the component instance because that constructor can further refine or override the qualities of the component being created.

 The key to doing this efficiently is a pattern for writing the constructor functions of component classes so that they can easily accept information about the qualities from the class or new statement calling it, combine that in a sensible way with the information about the qualities that that class adds and then call its super() class constructor with the combined information.

## Component Behavior

We just finished discussing how one major feature of component hierarchy classes is to add knowledge about the default qualities of the component being constructed at each stage of the class hierarchy and combining them into one description of the node to be created. There is a second major feature also.

Dynamic features of a page come from JS code that executes in response to events. Those function often changes the structure or qualities of the existing DOM Object Hierarchy.

Similar to how you could create any DOM structure with just the base Component class, you could write all the JS functions in your top level application file and attachment them where needed by specifying them as properties of various DOM nodes. The Component Type Hierarchy gives us a way to organize those functions so that they are reusable and modular.

Typically a specific component class will define functions for each behavior and attach them where appropriate to DOM nodes in the content sub tree it creates and manages.



# Example...

	export class BGFontSizeControlView  {
	constructor() {
		this.panel = new Panel({
		  class: "bg-ui-font-sizer-dialog",
		  children: [
			[new Component('div.panel-heading', {children: el("h1","Keyboard Mode to Adjust Pane Tab Sizes - 'Escape' when done", {tabindex:1})})],
			["leftSide", new Component('div.inset-panel', {
			  children: [
					["left",   new OneShotButton("<p>Left Dock</p>"   ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["center", new OneShotButton(
						'<div>Workspace Center</div>'+
						'<div><kbd class="key-binding">tab</kbd><span>next Dock</span></div>'+
						'<div><kbd class="key-binding">shift-tab</kbd><span>previous Dock</span></div>'
					 	,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["right",  new OneShotButton("<p>Right Dock</p>"  ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["bottom", new OneShotButton("Bottom Dock" ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))]
			  ]
			})],
			["rightSide", new Component('div.inset-panel', {
  			  children: [
					["escape",      new Button('<kbd class="key-binding">escape   </kbd><span>close this window</span>',     ()=>DispatchCommand('bg-tabs:toggle-size-dialog'))],
					["reset",       new Button('<kbd class="key-binding">Ctrl-0   </kbd><span>reset to default size</span>', ()=>DispatchCommand('bg-tabs:reset-font-size'))],
  					["fontBigger",  new Button('<kbd class="key-binding">Ctrl-+   </kbd><span>Bigger Font</span>',           ()=>DispatchCommand('bg-tabs:increase-font-size'))],
  					["fontSmaller", new Button('<kbd class="key-binding">Ctrl--   </kbd><span>Smaller Font</span>',          ()=>DispatchCommand('bg-tabs:decrease-font-size'))],
					["lineShorter", new Button('<kbd class="key-binding">Ctrl-up  </kbd><span>Shorter Line</span>',          ()=>DispatchCommand('bg-tabs:decrease-line-height'))],
  					["lineTaller",  new Button('<kbd class="key-binding">Ctrl-down</kbd><span>Taller Line</span>',           ()=>DispatchCommand('bg-tabs:increase-line-height'))]
  			  ]
			})]
		  ]
		});
		this.modalPanel = atom.workspace.addModalPanel({item: this.panel.el, visible: false, autoFocus:true});
		this.modalPanel.getElement().classList.add("bg-ui-font-sizer-dialog");

		this.setSelectedTabLocation("center");
	}



## Atom UI Hacking Resources

Style Guide  package. ctrl-shift-G

#### Available Less Variables
atom/static/variables/ui-variables.less

These are particularly important for colors. Instead of making up your own color, fond a variable. When the user changes theme,
the new theme will set these to a new value and your UI should respect that.  

#### Available CSS Classes
The style guide demonstrates some common class names but there is no list of available styles.

In the atom project the core required styles seem to be in atom/static/atom-ui/_index.less  (not sure what ./static/core-ui/_index.less is)  

atom.styles -- global StyleManager object has an array containing each loaded stylesheet.

TODO: add a Atom command that gleans all the available class names from atom.styles, tagging the ones from the built-in atom-ui.less
as prefered and provides auto-complete (see css-spy package)
