'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'

// Component is base class to make writing DOM components easier.   
// Params:
//     tagIDClasses : the REDOM syntax for the el() and html() functions. The default tag is 'div', ID and Classes are optional.
//                    <tagName>[#<idName>][.className1[.className2...]]
//                    Note that classes can also be specified in the attr option in addition to those specified here
//     options : an object with various optional keys
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
//     children : array of children components to add. See Element.mount for the array syntax
export class Component {
	constructor(tagIDClasses, options) {
		this.options = options || {};
		this.el = el(tagIDClasses, this.options["attr"]);
		this.mounted = [];
		if (this.options["children"]) {
			this.mount(this.options["children"]);
		}
	}

	// add children to the DOM under this Element.
	// Each child must have a unique variable-like name. After this call, the child can be accessed as a member variable of this
	// object by that name. Children are also 
	// Params:
	// This is an overloaded function with two forms.
	// Form1:
	//     (p1) name   : the variable like name of the child
	//     (p2) childElement : a REDOM component or DOM object (a REDOM component is any object with DOM element named 'el')
	//     (p3) insertBefore : (optional) the existing child to insert childElement before. Default is append to end fo existing
	// Form2:
	//     (p1) childElement : a REDOM component or DOM object (a REDOM component is any object with DOM element named 'el')
	//     (p2) insertBefore : (optional) the existing child to insert childElement before. Default is append to end fo existing
	// Form3:
	//     (p1) children  : arrary of children to mounted. Each array element can be one of ....
	//                      a DOM element
	//                      a REDOM component (a REDOM component is any object with DOM element named 'el')
	//                      an array of 2 or 3 parameters matching Form1
	//     (p2) insertBefore : (optional) the existing child to insert childElement before. If any arrays contain a third parameter,
	//                         it will override this insertBefore
	mount(p1, p2, p3) {
		if (typeof p1 == 'string' ) {
			const name = p1;
			const element = p2;
			const insertDefore = p3;
			redomMount(this, element);
			this[name] = element;
			this.mounted.push(name);

		} else if (Array.isArray(p1)) {
			const elements = p1;
			const defaultInsertBefore = p2;
			for (var i =0; i<elements.length; i++) {
				if (Array.isArray(elements[i])) {
					const name = elements[i][0];
					const element = elements[i][1];
					const insertDefore = elements[i][2];
					this.mount(name, element, insertDefore || defaultInsertBefore);
				} else {
					this.mount(elements[i], defaultInsertBefore);
				}
			}

		} else if (typeof p1 == 'object') {
			const name = "unamed"+this.mounted.length;
			const element = p1;
			const insertDefore = p2;
			redomMount(this, element);
			this[name] = element;
			this.mounted.push(name);

		} else {
			throw new AssertError("unknown parameter types", {p1:p1,p2:p2});
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
		}
	}
}
