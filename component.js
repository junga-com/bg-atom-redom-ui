'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import { getEl, NormalizeComponentParameters, NormalizeComponentOptions, reEmpty, ComponentParams, reHTMLContent, reVarName } from './componentUtils'

export * from './componentUtils'

// Component is a base class to make writing DOM components easier.
// The spirit of this Component class is that writing interactive UI applications in Javascript, be they delivered by web or be they
// local applications, should draw the line of separation between presentation and structure differently than HTML centric designs.
//
// This component class does not use a render pattern and does not try to get involved with reducing DOM changes for the developer.
// Instead it provides a clean syntax for the developer to create their component instance structure which produces the corresponding
// DOM structure. The developer then takes the responsibilty of modifying the DOM as needed in response to its own behavior.
//
// Features:
//    * uses ComponentParams class to create a compact, flexible constructor syntax. (Note you can create your own component base
//      class that uses ComponentParams to provide compatible constructor syntax
//    * get/set label with is the direct text content of this node. The label can be easily specified in the construction syntax
//    * mount/umount methods to add/remove children easily. See Component::mount for details. Lifecyle of children are managed.
//       ** name children become properties of the component so that code can easily navigate to them via <parent>.<child>.
//    * collects multiple content/children parameters in the constructor and uses mount() to make them children
//    * onmount,onunmount, and onremount virtual functions can be overridden (feature from redom)
//
// Examples:
//     new Component('$span.explanation This is how it is done'); // <span class="explanation">This is how it is done</span>
//     new Component('explanation:$span This is how it is done'); // 'explanation' will be a class and also the name used for component navigation.
//     new Component({color:'blue'});                            // CSS styles...
//     new Component({tabIndex:3});                              // DOM properties...
//     new Component(new Component('myChild:.leftSide'));        // sub component child content
//     new Component(treeView.getElement());                     // DOM node child content
//     new Component('How you doin?');                           // Set direct text content of the new DOM node
//     new Component('<div><div>How you doin?</div><div>Wasss uuppp!</div></div>');        // Define the DOM node directly with HTML
//     new Component([new Component('Hi'), new Component('there'), ['yall']]);             // multiple child node content
//     new Component({color:'blue'}, {tabIndex:3}, new Component('yes'), 'myCom:$span.bigger'); // many parameters, in any order will work.
//
//     new Component('increaseFont:$button.coolLook Make it bigger', {
//         onClick: () => {this.increaseFont(1)},
//         color: 'blue'
//     })
//
// Note a few things...
//     * an arbitrary number of string, object, or function construction parameters can be specified in any order. 
//     * information in parameters on the left, override the same information provided by parameters on their right.
//     * a string parameter will always be parsed as a tagIDClasses syntax
//       * the string prameter is the text label by default but can be adorn with the component name, tag, id, can classes. 
//     * parameters that are Component instances, DOM Nodes, and Arrays will be recognized as child content to add.
//     * Any other object parameter will be a container for any number of named parameters.
//
// Named Params:
// Any of these can be specified as a named parameter inside an object passed to this class's constructor. Alternatively, the
// values of tagIDClasses, content, and unnamedCB can be specifed directly on the command line. tagIDClasses is a string syntax
// for specifying name, tagName, idName, class, and (text) content in one string so any of those can be specified without using
// the object literal syntax. See examples section. See ComponentParams for more details.
//
//    name:string    : a variable name used for this component. Typically this makes sense relative to its parent. 
//                     * Will be added to classList so its a shortcut for adding this one, special className
//                     * If this component is mounted to a parent component, it will be available as <parent>.<name>
//    tagName:string : <tagName> The name of the dom/html element type. <div> is the default.
//    idName:string  : #id property on the DOM object. Should not be used for reusable components but useful for high level singlton components.
//    class:stringSet: space separated list of classNames
//    label:string   : text that will be set as the direct content of the node. If it begins with a tag it will be parsed as html.
//    tagIDClasses : shortcut syntax multiple common data about the component.
//                   [name:][$<tagName>][#<idName>][.className1[.className2...]][ icon-<name>][ textContent]
//                   Note that each part of this string has a unique character that identifies it. name's character is a suffix,
//                   the others are prefix. If present, each part must be in the given order.  The first space or comma will cause
//                   everything after it to be textContent even if it contains one of the speacial characters (:$#.). If the text
//                   content starts with a valid html tag (<something... >), textContent will be treated as HTML, otherwise it will
//                   be plain text. If you want valid HTML to be treated as plain text, prefix it with an extra space.
//                   If you are only providing textContent in the string that comes from a variable, it is safest to prefix it with
//                   a space or comma in case the text happens to contain a [:$#.] character before the first space or comma. 
//    content:<multiple> : innerHTML specified in multiple ways -- text, html, DOM node, Component instance, or an array of multiple of those
//    paramNames:stringSet: (specified by derived classes) space separated list of additional parameter names that this type of component supports.
//    unnamedCB:function: a function that will be registered in the component's default callback event. 
//    <Additional Component properties>  :<any> : any name documented by any class in the component hierarchy being created can specified
//    <Style properties>:string: any style name can be specified. This library maintains a map of known style names. If you find that
//                   it does not recognize the name you specify as a style, you can force it by moving it into a {styl: ..} sub-object. 
//    <DOM properties>:string: any name that is not otherwise recognize will be set in the DOM Node that is created. 
// See Also:
//    ComponentParams
// Usage:
//    new Component(<tagIDClasses> [,<content>] [,options] [,<callback>])
export class Component {
	componentParams
	name
	optParams
	mounted = []
	mountedUnamed = []
	el

	constructor(tagIDClasses, options, ...moreOptionsOrParamNames) {
		this.componentParams = new ComponentParams(tagIDClasses, options, ...moreOptionsOrParamNames);

		this.name = this.componentParams.name;
		this.optParams = this.componentParams.optParams;

		// we are probably ready to end this dependency on redom since we have already done the tough work of creating the construction data.
		this.el = el(this.componentParams.makeREDOMTagString(), Object.assign({}, this.componentParams.props, {style:this.componentParams.styles}));

		this.setLabel(this.componentParams.optParams.label);

		this.mount(this.componentParams.content);
	}

	// add children to the DOM under this Element.
	// This not only adds the childContent in the DOM but also maintains member variables in the parent to navigate to its children
	// if childContent contains name(s).
	// ChildContent Types:
	// Several types of children content are supported.
	//     component : object(w/.el)       : any JS object with a 'el' property (el should be a DOM Node)
	//     DOMNode   : object(w/.nodeType) : DOMNodes are identified by having a 'nodeType' property
	//     plain text: string(s[0]!="<")   : Plain text will be appended as a text node. 
	//     html text : string(s[0]=="<")   : HTML test will be converted to a component whose outerHTML is the provided text
	//     multiple Children : array       : multiple children can be given in an array. Each array element can be any of the 
	//                                       supported types including a nested array. Array nesting will not affect how the child
	//                                       hiearchy is built -- all children will be traversed and added to this component directly.
	//                                       The one difference is if name is specified and content is an array, the <name> property
	//                                       created in the parent will be an array with elements poiting to the children. Any 
	//                                       children in the array that have a name property will have a reference added as that
	//                                       name reardless of whether the array itself is named. Tyically, arrays will not be named
	//                                       and there is no difference between adding the children individually or within an array.
	// Params:
	//    name:string          : the variable-like name of the child. If not provided, <childContent>.name will be used. If that
	//                           does not exist, childContent will be unamed with regard to its parent.
	//                           The special name 'unnamed' is recognized as no name being pass. This could be useful to avoid ambiguity
	//    childContent:<multi> : the content to be added to this component's children. It can be given in any of the types described above.
	//    insertBefore:object  : (optional) the existing child to insert childContent before as a DOM Node or component object.
	//                           Default is append to end fo existing
	// Usage:
	// Note that if first param is a single word content and the insertBefore is specified it will incorrectly be interpreted as
	// Form1.  You can pass 'unnamed' as the first paramter avoid ambiguity and still result in an unnamed child.
	//    Form1: <obj>.mount(<name>, <childContent> [,<insertBefore>])
	//    Form2: <obj>.mount(<childContent> [,<insertBefore>])
	mount(p1, p2, p3) {
		// detected form1 and form2
		var name, childContent, insertBefore;
		// if p3 is specified the user maust have called with 3 params so it must be form 1
		// The only other form 1 cases is when p2 is specified and p1 is a valid name
		// When p1 is content that happens to also be a valid name and insertBefore is specified, it will be incorrectly classified.
		const p2Specified = (typeof p2 != 'undefined');
		const p3Specified = (typeof p3 != 'undefined');
		const p1CanBeAName= (typeof p1 == 'string' && reVarName.test(p1));
		if ((p3Specified) || (p2Specified && p1CanBeAName)) {
			name         = p1; if (name == "unnamed") name='';
			childContent = p2
			insertBefore = p3
		} else {
			childContent = p1
			insertBefore = p2
		}

		// when specifying children content, sometimes its convenient to allow the expression to result null, so just ignore this case
		if (childContent == null)
			return;

		switch (typeof childContent) {
			// ChildContent can be null but not undefined. This is either a logic error in Form1/Form2 detection or the caller explicitly
			// passed 'undefined' as the content
			case 'undefined':
				throw AssertError("ChildContent can be null but not undefined.");

			case 'string':
				var element;
				if (reHTMLContent.test(childContent)) {
					// it begins with an html tag so interpret it as html
					element = el('');
					element.outerHTML = childContent;
				}
				else
					element = text(childContent);

				childContent = element;
				break;

			case 'object':
				// iterate an array of children and recursively add them
				if (Array.isArray(childContent)) {
					if (name)
						this[name]=[];
					for (var i =0; i<childContent.length; i++) {
						// explicitly call it with 3 params to avoid any ambiguity -- if insertBefore is undefined, pass null
						var mountedChild = this.mount(null, childContent[i], insertBefore || null);
						if (name)
							this[name][i] = mountedChild;
					}
					return childContent;
				}
				break;

			default:
				throw new AssertError("Invalid arguments. ChildContent needs to be an object, array or string", {childContent:childContent,p1:p1,p2:p2,p3:p3, type:typeof childContent});
		}

		// do the work
		redomMount(this, childContent, insertBefore);

		// if name was not explicitly passed in, see if we can get it from the content
		if (!name && typeof childContent == 'object' && childContent.name)
			name = childContent.name;

		if (name) {
			this[name] = childContent;
			childContent.name = name;
			this.mounted.push(name);
			getEl(childContent).classList.add(name);
		} else {
			this.mountedUnamed.push(childContent);
		}

		if (childContent.parent)
			console.log(childContent.parent);
		childContent.parent = this;

		return childContent;
	}

	// remove a child from this element including its DOM element
	// if a child is unamed, you cant remove it with this function but you could still find its DOM element and remove it that way.
	unmount(name) {
		redomUnmount(this, this[name]);
		var i = this.mounted.indexOf(name);
		if (i != -1) this.mounted.splice(i,1);
		if (this[name].parent === this)
			delete this[name].parent;
		delete this[name];
	}


	// override these to take actions when the component is added or removed from the DOM
	onmount() {}
	onunmount() {}
	onremount() {}

	getLabel() {
		return this.label || '';
	}

	setLabel(label) {
		this.label = label;
		if (reHTMLContent.test(this.label))
			this.el.innerHTML = this.label;
		else
			this.el.textContent = this.label;
	}

	destroy() {
		var child;
		while (child = this.mounted.pop()) {
			this.unmount(child);
			child.destroy();
		}
		while (child = this.mountedUnamed.pop()) {
			redomUnmount(this, child);
			typeof child.destroy == 'function' && child.destroy();
		}
	}
}
