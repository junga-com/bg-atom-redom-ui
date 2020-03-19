'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import { getEl, NormalizeComponentParameters, NormalizeComponentOptions, reEmpty } from './componentUtils'
export * from './componentUtils'

// Component is a base class to make writing DOM components easier.  Components do not have to derive from this class. Any object
// with a 'el' property that is a DOM element is a valid REDOM compnent.
// Note that 
// Features:
//    * uses NormalizeComponentOptions() to identify and separate the top level properties from the options object the user passes in.
//       ** this.optParams : is populated with any optional parameters for the derived class to process. 
//       ** the user creating a Component can put style props, component optional params and DOM element props all in the top level 
//    * creates the el member using REDOM.el() and the information passed in options.
//    * mount/umount methods to add/remove children easily. See Component::mount for details. Lifecyle of children are managed.
//       ** children become properties of the component so that code can easily access them. 'unamed<index>' is the default child name
//       ** the name of the child is added to its classes
//    * mounts children passed in options.children so that the whole DOM subtree can be created in the new Component(..) block.
//       ** several formats of the children option are supported. See Component::mount()
//    * onmount,onunmount, and onremount virtual functions can be overridden (feature from redom)
// Params:
//     name         : variable-like name for this component. The name can be specified in the tagIDClasses param or separately
//     tagIDClasses : the REDOM syntax for the el() and html() functions. The default tag is 'div', ID and Classes are optional.
//                    <tagName>[#<idName>][.className1[.className2...]]
//                    Note that classes can also be specified in the attr option in addition to those specified here
//     options : an object with various optional keys
//     paramNames : a string with a space separated list of optional parameter names supportted by the derived class. This is
//        provided by the derived class Component designer and not passed on to the constructor that a Component user would use. 
//        Any top level property name in options that matches a name in this list will be moved to the this.optParams property.
//        If a DOM or style property is included in this list, if the end usser creating the Component specifies that property,
//        it will be moved to this.optParams and not automatically set on this.el. This allows the derived class designed to do special
//        processing for that property if desired.
// Options:
//     tagIDClasses : the tagIDClasses string can be specified inside the options as well as a separate parameter
//     content : string with content that will be added as either textContent or innerHtML depending on whether is it begins with a tag
//     children : children components to add under the Component. See Component.mount for several supported syntax
//     <optionalComponentParams>  : any name listed in paramNames will be moved to this.optParams for the derived class to use.
//     <Style properties> : any (most?) Style property can be specified (at the top level) and will be set in this.el.style 
//     <DOM properties> : any DOM property can be specified and will be set on the this.el DOM object
//     style    : sub-object containing style properties to add to the Component's this.el DOM element. Note that most style properties
//                can also be specified at the top level and will be auto detected as styles but this can be used to make it more
//                explicit if needed.
export class Component {
	constructor(tagIDClasses, options, paramNames) {
		({tagIDClasses, options, paramNames} = NormalizeComponentParameters(tagIDClasses, options, paramNames));
		var optChildren; [this.optRedom, this.optParams, optChildren] = NormalizeComponentOptions(options, "tagIDClasses content name " + paramNames);

		({name:this.name, tagIDClasses} = /^((?<name>[^:]*):)?(?<tagIDClasses>.*)?$/.exec(tagIDClasses).groups)

		if (this.optParams.name)
			this.name = this.optParams.name;

		this.el = el(tagIDClasses || this.optParams.tagIDClasses, this.optRedom);
		this.mounted = [];
		this.mountedUnamed = [];

		if (this.optParams.content) {
			this.content = this.optParams.content;
			if (/^<[^>]+>/.test(this.optParams.content))
				this.el.innerHTML = this.this.optParams.content;
			else
				this.el.innerText = this.optParams.content
		}

		if (optChildren) {
			this.mount(optChildren);
		}
	}

	// add children to the DOM under this Element.
	// Each child must have a unique variable-like name. After this call, the child can be accessed as a member variable of this
	// object by that name. Children are also 
	// Params:
	// This is an overloaded function with multiple forms.
	// Form1:
	//     (p1) name:string         : the variable like name of the child
	//     (p2) childElement:object : a REDOM component or DOM object (a REDOM component is any object with DOM element named 'el')
	//     (p3) insertBefore:object : (optional) the existing child to insert childElement before. Default is append to end fo existing
	// Form2:
	//     (p1) childElement:object : a REDOM component or DOM object (a REDOM component is any object with DOM element named 'el')
	//     (p2) insertBefore:object : (optional) the existing child to insert childElement before. Default is append to end fo existing
	// Form3:
	//     (p1) children:array      : arrary of children to mounted. Each array element can be one of ....
	//                                * a REDOM component or DOM object (a REDOM component is any object with DOM element named 'el')
	//                                * an array of 2 or 3 parameters matching Form1
	//     (p2) insertBefore : (optional) the existing child to insert childElement before. If any arrays contain a third parameter,
	//                         it will override this insertBefore
	// Form4:
	//     (p1) content:string  : content will be turned into a DOM node and appended to this component
	mount(p1, p2, p3) {
		if (typeof p1 == 'string' && !p2 ) {
			this.mount(null, text(p1));

		} else if (!p1 || typeof p1 == 'string') {
			if (typeof p2 != 'object')
				throw new AssertError("Invalid arguments. p2 needs to be an object", {p1:p1,p2:p2,p3:p3})
			const name = (p1 && !p1.match(reEmpty) && p1) || (p2.name && !p2.name.match(/^\s*$/) && p2.name);
			const element = p2;
			const insertDefore = p3;
			redomMount(this, element);
			if (name) {
				//"unamed"+this.mounted.length
				this[name] = element;
				element.name = name;
				this.mounted.push(name);
				//setAttr(element,"class", name); // not sure why, but this overrote the existing classes. setAttr code seems to be OK
				getEl(element).classList.add(name);
			} else {
				this.mountedUnamed.push(element);
			}

		} else if (Array.isArray(p1)) {
			const elements = p1;
			const defaultInsertBefore = p2;
			for (var i =0; i<elements.length; i++) {
				if (Array.isArray(elements[i])) {
					let name, element, insertDefore;
					if (typeof elements[i][0] != 'object')
						[name, element, insertDefore] = elements[i];
					else
						[element, insertDefore, name] = elements[i];
					this.mount(name, element, insertDefore || defaultInsertBefore);
				} else if (elements[i]) {
					this.mount(elements[i], defaultInsertBefore);
				}
			}

		} else if (p1 && typeof p1 == 'object') {
			this.mount(p1.name, p1, p2);

		} else {
			throw new AssertError("Invalid arguments. p1 needs to be a string, array, or object", {p1:p1,p2:p2});
		}
	}

	// remove a child from this element including its DOM ele
	unmount(name) {
		redomUnmount(this, this[name]);
		delete this[name];
	}


	// override these to take actions when the component is added or removed from the DOM
	onmount() {}
	onunmount() {}
	onremount() {}

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
