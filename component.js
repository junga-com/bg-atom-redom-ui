'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'
import clonedeep from 'lodash.clonedeep'

// redom does not export this function so repeat it
export function getEl (parent) {
  return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);
}

// compiled common Regular Expressions
const reEmpty=/^\s*$/;

// This map looks up a name and returns true if it is a known style property name. It is used to move options object's member names
// that the user puts at the top level into the 'style' sub-member. This makes it easier for users to specify just a few styles.
// without having the verbosity of creating the style sub-object.
// This list was created from https://www.w3schools.com/jsref/dom_obj_style.asp
const knownStyleProperties = {
	alignContent:            true,
	alignItems:              true,
	alignSelf:               true,
	animation:               true,
	animationDelay:          true,
	animationDirection:      true,
	animationDuration:       true,
	animationFillMode:       true,
	animationIterationCount: true,
	animationName:           true,
	animationTimingFunction: true,
	animationPlayState:      true,
	background:              true,
	backgroundAttachment:    true,
	backgroundColor:         true,
	backgroundImage:         true,
	backgroundPosition:      true,
	backgroundRepeat:        true,
	backgroundClip:          true,
	backgroundOrigin:        true,
	backgroundSize:          true,
	backfaceVisibility:      true,
	border:                  true,
	borderBottom:            true,
	borderBottomColor:       true,
	borderBottomLeftRadius:  true,
	borderBottomRightRadius: true,
	borderBottomStyle:       true,
	borderBottomWidth:       true,
	borderCollapse:          true,
	borderColor:             true,
	borderImage:             true,
	borderImageOutset:       true,
	borderImageRepeat:       true,
	borderImageSlice:        true,
	borderImageSource:       true,
	borderImageWidth:        true,
	borderLeft:              true,
	borderLeftColor:         true,
	borderLeftStyle:         true,
	borderLeftWidth:         true,
	borderRadius:            true,
	borderRight:             true,
	borderRightColor:        true,
	borderRightStyle:        true,
	borderRightWidth:        true,
	borderSpacing:           true,
	borderStyle:             true,
	borderTop:               true,
	borderTopColor:          true,
	borderTopLeftRadius:     true,
	borderTopRightRadius:    true,
	borderTopStyle:          true,
	borderTopWidth:          true,
	borderWidth:             true,
	bottom:                  true,
	boxDecorationBreak:      true,
	boxShadow:               true,
	boxSizing:               true,
	captionSide:             true,
	clear:                   true,
	clip:                    true,
	color:                   true,
	columnCount:             true,
	columnFill:              true,
	columnGap:               true,
	columnRule:              true,
	columnRuleColor:         true,
	columnRuleStyle:         true,
	columnRuleWidth:         true,
	columns:                 true,
	columnSpan:              true,
	columnWidth:             true,
	content:                 true,
	counterIncrement:        true,
	counterReset:            true,
	cursor:                  true,
	direction:               true,
	display:                 true,
	emptyCells:              true,
	filter:                  true,
	flex:                    true,
	flexBasis:               true,
	flexDirection:           true,
	flexFlow:                true,
	flexGrow:                true,
	flexShrink:              true,
	flexWrap:                true,
	cssFloat:                true,
	font:                    true,
	fontFamily:              true,
	fontSize:                true,
	fontStyle:               true,
	fontVariant:             true,
	fontWeight:              true,
	fontSizeAdjust:          true,
	fontStretch:             true,
	hangingPunctuation:      true,
	height:                  true,
	hyphens:                 true,
	icon:                    true,
	imageOrientation:        true,
	isolation:               true,
	justifyContent:          true,
	left:                    true,
	letterSpacing:           true,
	lineHeight:              true,
	listStyle:               true,
	listStyleImage:          true,
	listStylePosition:       true,
	listStyleType:           true,
	margin:                  true,
	marginBottom:            true,
	marginLeft:              true,
	marginRight:             true,
	marginTop:               true,
	maxHeight:               true,
	maxWidth:                true,
	minHeight:               true,
	minWidth:                true,
	navDown:                 true,
	navIndex:                true,
	navLeft:                 true,
	navRight:                true,
	navUp:                   true,
	objectFit:               true,
	objectPosition:          true,
	opacity:                 true,
	order:                   true,
	orphans:                 true,
	outline:                 true,
	outlineColor:            true,
	outlineOffset:           true,
	outlineStyle:            true,
	outlineWidth:            true,
	overflow:                true,
	overflowX:               true,
	overflowY:               true,
	padding:                 true,
	paddingBottom:           true,
	paddingLeft:             true,
	paddingRight:            true,
	paddingTop:              true,
	pageBreakAfter:          true,
	pageBreakBefore:         true,
	pageBreakInside:         true,
	perspective:             true,
	perspectiveOrigin:       true,
	position:                true,
	quotes:                  true,
	resize:                  true,
	right:                   true,
	tableLayout:             true,
	tabSize:                 true,
	textAlign:               true,
	textAlignLast:           true,
	textDecoration:          true,
	textDecorationColor:     true,
	textDecorationLine:      true,
	textDecorationStyle:     true,
	textIndent:              true,
	textJustify:             true,
	textOverflow:            true,
	textShadow:              true,
	textTransform:           true,
	top:                     true,
	transform:               true,
	transformOrigin:         true,
	transformStyle:          true,
	transition:              true,
	transitionProperty:      true,
	transitionDuration:      true,
	transitionTimingFunction:true,
	transitionDelay:         true,
	unicodeBidi:             true,
	userSelect:              true,
	verticalAlign:           true,
	visibility:              true,
	whiteSpace:              true,
	width:                   true,
	wordBreak:               true,
	wordSpacing:             true,
	wordWrap:                true,
	widows:                  true,
	zIndex:                  true
}

// This function is used by Component and other Component-like classes (e.g. Button) to allow the user to specify only the positional
// parameters they need without having to specify other parameters just because they are positional parameters before the one they need.
export function NormalizeComponentParameters(tagIDClasses, options, paramNames, callback) {
	var params = [tagIDClasses, options, paramNames, callback];
	tagIDClasses = null; options = null; paramNames = null; callback = null;
	for (var i=0; i<params.length; i++) {
		switch (typeof params[i]) {
			case 'string':
				if (tagIDClasses) {
					if (typeof params[i-1] == 'undefined') {
						options = params[i-1];
						paramNames = params[i]
					} else
						throw new AssertError("Invalid call to component style constructor -- a second string that does not follow the options object was encountered at param["+i+"]", {params: params, tagIDClasses: tagIDClasses, options: options, paramNames: paramNames, callback: callback})
				} else
					tagIDClasses = params[i];
				break;
			case 'function':
				if (callback)
					throw new AssertError("Invalid call to component style constructor -- a second callback was encountered at param["+i+"]", {params: params, tagIDClasses: tagIDClasses, options: options, paramNames: paramNames, callback: callback})
				callback = params[i];
				break;
			case 'object':
				if (options)
					throw new AssertError("Invalid call to component style constructor -- a second object was encountered at param["+i+"]. options shuould be the only object", {params: params, tagIDClasses: tagIDClasses, options: options, paramNames: paramNames, callback: callback})
				options = params[i];
				if (typeof params[i+1] == 'string') {
					paramNames = params[i+1]
					i++;
				}
				break;
		}
	}

	// console.log({
	// 	msg: "!!!NormCompParams!!!",
	// 	in: params,
	// 	out: {
	// 		tagIDClasses:tagIDClasses,
	// 		options:    options,
	// 		paramNames: paramNames,
	// 		callback:   callback
	// 	}
	// });
	return {tagIDClasses: tagIDClasses || "", options: options || {}, paramNames: paramNames || "", callback: callback}
}

// The idea behind this function is that when creating a component, its important to allow the user to specify any of the properties
// that can be set on a DOM element and other information supportd by the Component author but not require them to create a verbose,
// deeply nested object structure.
// This allows the user to set DOM properties, Styles, and Component specific options all at the top level of the options object.
// Name conflicts are not generally a problem because all these things refer to contruction information about the same DOM element.
// Optional Parameters:
//    These are names that the component author comes up with for the user to control features of the component. They are identified
//    by the author passing in a spacce separate list of these names. They will be moved from the top level of the options object
//    into a subobject called 'params'
export function NormalizeComponentOptions(options, paramNames) {

	// first remove the children array if any since it could be big and we dont want to deep clone it
	const children = options["children"] 
	if (options["children"]) delete options["children"];

	// deep clone the options because we are going to modify it and the input options might be used to create multiple Components 
	options = clonedeep(options);

	if (!options)
		options = {}
	paramNames = (paramNames) ?paramNames:"";

	if (typeof options != 'object')
		throw new AssertError("The options parameter must be either null or an object.", {options: options})

	// make sure our known subobjects exist so that we dont have to guard everywhere that we use them
	if (typeof options["style"] != 'object')
		options["style"] = {};

	// separate member vars at the top level into sub members if they match knowns names. 
	var params = {};
	var paramNamesRegEx = RegExp('^(' + paramNames.replace(/\s+/g, '|') + ')$')
	for (var name in options) {
		if (paramNamesRegEx.test(name)) {
			params[name] = options[name];
			delete options[name];
		} else if (name in knownStyleProperties) {
			options["style"][name] = options[name];
			delete options[name];
		}
	}

	// support common aliases of className property
	for (const name of ["className","classes"])
		if (options[name]) {
			options["class"] += " "+options[name]
			delete options[name];
		}

	if (!( "class" in options))
		options["class"] = '';

	return [options, params, children];
}



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
//     children : children components to add under the Component. See Element.mount for several supported syntax
//     style    : sub-object containing style properties to add to the Component's this.el DOM element. Note that most style properties
//                can also be specified at the top level and will be auto detected as styles but this can be used to make it more
//                explicit if needed.
//     <optionalComponentParams>  : any name listed in paramNames will be moved to this.optParams for the derived class to use.
//     <Style properties> : any (most?) Style property can be specified (at the top level) and will be set in this.el.style 
//     <DOM properties> : any DOM property can be specified and will be set on the this.el DOM object
export class Component {
	constructor(tagIDClasses, options, paramNames) {
		({tagIDClasses, options, paramNames} = NormalizeComponentParameters(tagIDClasses, options, paramNames));
		var optChildren; [this.optRedom, this.optParams, optChildren] = NormalizeComponentOptions(options, paramNames);
		({name:this.name, tagIDClasses} = /^((?<name>[^:]*):)?(?<tagIDClasses>.*)?$/.exec(tagIDClasses).groups)
		this.el = el(tagIDClasses, this.optRedom);
		this.mounted = [];
		this.mountedUnamed = [];
		if (optChildren) {
			this.mount(optChildren);
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
		if (typeof p1 == 'string' || typeof p1 == 'undefined' ) {
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

		} else if (typeof p1 == 'object') {
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
