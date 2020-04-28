import clonedeep from 'lodash.clonedeep'
import { el, list, mount as redomMount, unmount as redomUnmount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'

// redom does not export this function so repeat it
export function getEl (parent) {
	return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);
}

// compiled common Regular Expressions
export const reEmpty        = /^\s*$/;
export const reHTMLContent  = /^\s*<[^>]+>/;
export const reVarName      = /^[_a-zA-Z][_a-zA-Z0-9]*$/;

// reTagIDClasses makes tagName the default text 
// [name:][<tagName>][#<idName>][.className1[.className2...]][ textContent]
export const reTagIDClasses   = /^((?<name>[_a-zA-Z0-9]*):)?(?<tagName>[-_a-zA-Z0-9]*)?(#(?<idName>[-_a-zA-Z0-9]*))?(?<className>[.][-!_.a-zA-Z0-9]*)?([\s,]((?<icon>icon-[-_a-zA-Z0-9]+)([\s,]|$))?(?<label>.*))?$/;

// reContentIDClasses makes content the default text and changes tagName to require a leading $
// the re group names are the parameter names. This re must match '' (all groups are optional) 
// [name:][$<tagName>][#<idName>][.className1[.className2...]][ textContent]
export const reContentIDClasses = /^((?<name>[_a-zA-Z0-9]*):)?([$](?<tagName>[-_a-zA-Z0-9]*))?(#(?<idName>[-_a-zA-Z0-9]*))?(?<className>[.][-!_.a-zA-Z0-9]*)?[\s,]?((?<icon>icon-[-_a-zA-Z0-9]+)([\s,]|$))?(?<label>.*)?$/;

export const bgComponent=Symbol.for('bgComponent');

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



// Interpret and normalize information about a component being created that has come from multiple levels in the type hierarchy.
// This supports a very flexible yet reasonably efficient pattern of providing information from multiple places using a compact
// easy to use syntax.
//
// Levels:
//    user contruction params :(new SomeComponent(...))
//    componentClass1         :(added in class's ctor -- class being constructed)
//    componentClass2         :(added in class's ctor -- first super class)
//    componentClass...       :(added in class's ctor -- all the super classes in the hierarchy chain)
//    Component class         :(added in Component's ctor -- most super class invokes us to collect all the information)
//
//    The concept of 'levels' will be used to describe the functionality of ComponentParams. Each level is a place that can provide
//    information about how the component should be constructed. This is true in all class hierarchies but the special nature of
//    programming to the DOM makes it particularly useful to be flexible in allowing each level to provide (almost) any information.
//
//    Each level can add its own information to the parameter list that it received from its caller and pass the combined result
//    onto its base class. The last base class (which may or may not be Component) uses ComponentParams to reduce the arbitrarily
//    long parameter list into one normalized set of information that is required to create a new DOM Node. This refined information
//    is then available in each of the component class's constructors in the hierarchy.
//
//    Information earlier in the parameter list (more to the left) will supercede information later in the list (more to the right).
//    with the same name. A component class can use this to decide whether the information it provides will be a default value that
//    the level above it can override or whether it is a mandatory value that can not be overridden. 
//
// Passing Information as Named vs Unnamed (positional) :
//    No parameter passed to the ComponentParams constructor is identified by its position so there are really no positional parameters.
//    However, any of the supported unamed parameters can be specified in any order and can be repeated any number of times so there
//    are an arbitrarily large number of what is typically called 'positional parameters'. Named parameters are implemented by passing
//    an object whose keys are the names of the parameters. Some of the objects in the positional parameter list will be identified
//    and used this way to pass explicitly named parameters. Amoung these named parameter objects, several other types of
//    'positional parameters' are supported and identified by their types instead of their position.
//
//    Repeated params of the same logical type ocur when derived component classes pass through params from their constructor onto
//    their base component super class constructor. Each level can add its own parameters of any of the supported logical types
//    and sometimes will add two -- one on the left to contain mandatory value(s) and another on the right to conatin default value(s).
//
//    This support avoids each derived class in the component hierarchy from having to handle complicated merging of parameters
//    themselves. Not only would that make it harder to write and maintain components, but also each component might do it a little
//    differently making the hierarchy as a whole less consistent and harder to use.
//
//    The reason other parameter types besides named parameter objects are supported is to provide a more user friendly, compact
//    syntax for creating components.
//
// Named (Logical) Parameters :
// These are the named 'parameters' that can be explicitly specified in a named parameter object that apprears in the 
// 'positional parameter' list. Note that the names that are not in <> are the literal keys that will be recognized. Those that are
// in <> like <knownStyles> refer to a whole set of names that will be recognized -- in this case any of the CSS style attributes.
//    tagName       :string     : <tagName> The name of the dom/html element type
//    name          :string     : the variable name used for a component. Typically this is relative to its parent.
//    idName        :string     : the id attribute. Not typically used b/c it should only be used when it does not make sense for a page to contain more than one of the component class its used in.
//    classes       :stringSet  : space separated list of classNames
//    label         :string     : text that will be set as the direct content of this node. If is starts with an html tag (<div>) it will parsed as html
//    content       :<multiple> : innerHTML specified in multiple ways -- text, html, DOM node, Component instance, or an array of multiple of those
//    tagIDClasses  :string(aggregate): combined [<name>:][<tagName>][#<idName>][.<class>[.<class>...]][ <contentTestOrHTML>]
//    optParams     :object     : named parameters introduced by a component class for features it implements (as opposed to passed through to the DOM)
//    paramNames    :stringSet  : space separated list of optional parameter names that can be specified in the options object
//    props         :object     : Attributes / Properties to be set in the created DOM node
//    styles        :object     : css styles to be set in the created DOM node
//    unnamedCB     :function   : a function that will be registered in the component's default callback event. 
//    <paramNames>  :<any>      : in the options object, any name listed in 'paramNames' will be interpreted as if they were specified within 'optParams'
//    <knownStyles> :string     : in the options object, any name listed in knownStyleProperties will be interpreted as if it were specified inside 'styles'
//    <unknownNames>:string     : in the options object, any name that does not match any known name will be interpreted as if it were specified inside 'props'
//
// Flattening the Property, Styles, and optParam Namespaces:
//    An important way to make the syntax to build components more compact is the support to specify any (name,value) pair at the
//    top level of the named parameter object even if they really belong inside one of the optParam, styles, or props sub-objects.
//    The ComponentParams class will recognize what they are and move them into the correct sub-object so that component authors can
//    always access them in their proper place even if they were not specified there explicitly. 
//
//    For each name which is not one of the fixed, known names above that appears at the top level, a map lookup will be required
//    to identify what it is. I consider this an acceptable tradeoff, but if you do not, explicitly specifying those names in their
//    proper sub-objects will avoid that map lookup.
//
//    Another issue is whether this will create name conflicts if the same name appears in more than one of the 3 subobjects. I know
//    of no conflict between CSS style and DOM prop names and I think that optNames should not be a problem because they are all
//    logically attributes of the same component/DOM Node concept. If a component author creates a parameter name with the same
//    name as a style or prop, they probably are refering to the same thing and need to confront why they are not reusing the builtin
//    style or property.
//
//    A component author can purposely create an optParam name (see paramNames) with the same name as a style or prop to prevent
//    it's base classes from setting it in the DOM node or doing special processing on that value. By doing this, if the value is
//    specified at any level, it will be moved to the optParams sub-object where the component author can decide what to do with it.
//
// Unamed Params (positional):
// Note that a derived component class can define its own required or optional positional constructor params for users of that
// class to follow. After its own positional params, it must allow an arbitrary number of these Component class params in any order.
//   <tagIDClasses> : string parameters that reach this ComponentParams are always interpretted as a 'tagIDClasses'. Users can use
//          this to tersely specify any combination of <name>, <tagName>, <idName>, <class>, or <label> instead of explicitly
//          putting them inside a named parameter object.
//
//    <content>  : Arrays and also Objects with either an 'el' or 'nodeType' property are interpretted as childContent that will
//          be added to the new component instance. 
//
//    <options>  : any object param that does not match the content conditions are interpretted as a named parameter object. The
//          keys of these objects can contain any of the names listed in the Named Parameter Section.
//
//    <unnamedCB> : any function parameter will be added to this.unnamedCB[] where a derived class can access it. Its not uncommon
//          for a component type to support a callback that is unabiguous in the context of that component type so it can appear
//          anywhere in the parameter list and still be understood. Multiple levels could provide a callback in which case its
//          reasonable for the derived class to invoke each in turn when firing its event.
//
// Combining Knowledge Provided By Multiple Levels:
//   Each level in the hirarchy gets a chance to specify any of the information so repeated information will be inevitable. The process
//   of combining multiple sets of possibly overlapping information into one consistent set will be refered to in this class as 'reducing'.
//   i.e. we are reducing multiple sets into one set.
//
//   Named values are either single valued or multivalued. The default behavior is to read the information from left to right on
//   the parameter list and lock in the first ocurrance of each single valued named data and to append together each multivalued
//   named data.
//
//   A particular class in the component hierarchy can use this behavior to provide both default values that can be overriden by
//   things that use it or mandatory values that can not be overridden (by default). Parametes on the left override those on the right.
//
//   All named data except these are treated as single valued.
//     class : multivalued : classes are combined in a space separated list. If any className is prefixed with a '!' character, it
//           will cause class to become locked at that point and no additional classes will be added (as if it were a single valued)
//     paramNames : multivalued : will be combined into a space separated list. (does not support the '!' character like class does)
//     content : multivalued : content is kept in an array and each content parameter encountered will be appending to the array.
//           in the end, the array will be reversed so that the effect is that content provided by dervied classes will by default
//           appear after content provided in a base class.
//     unnamedCB : multivalued : combined into an array
//     optParams,props,styles : these are containers of named data and each key is treated separately according to its name.  
//
export class ComponentParams {
	// params can be any number of the following in any order
	//   tagIDClasses:string, options:object, callback:function, domEl:object(w/nodeType), component:object(w/el), or content:array
	constructor(...params) {
		// single valued params are defined as undefined and combinable params are initialized to their empty type
		this.tagName       = undefined;
		this.name          = undefined;
		this.idName        = undefined;
		this.className     = '';
		this.content       = [];
		this.optParams     = {};
		this.paramNames    = 'label icon ';
		this.props         = {};
		this.styles        = {};
		this.unnamedCB     = [];
		this.lockedParams = {};
		this.mapOfOptParamNames = {};

		// first, make a quick pass to assemble all the paramNames so that we can correctly classify optional parameters declared
		// by all the component classes in the hierarchy. paramNames can only be set in options objects.
		for (var i=0; i<params.length; i++) {
			if (params[i] && typeof params[i] == 'object' && typeof params[i].paramNames == 'string')
				this.paramNames += ' '+params[i].paramNames;
		}
		// make a map of the optParams names for efficient classification lookups.
		for (var name of this.paramNames.replace(/\s+/g,' ').split(' '))
			this.mapOfOptParamNames[name] = true;


		// now do a second pass through the params that does the real work. The purpose is to reduce the arbitrarily long list of
		// tagIDClasses, options, functions, and content into one set of information about the component instance being created.
		for (var i=0; i<params.length; i++) if (params[i]) {
			switch (typeof params[i]) {
				case 'object':
					// detect any content type object
					if (Array.isArray(params[i]) || ('nodeType' in params[i]) || ('el' in params[i]))
						// it would make sense to spread the array into the the content array except we are appending in the wrong 
						// direction. Its more efficient to append in the wrong direction and then in the end, reverse the array.
						this.reduceAttribute('content', params[i]);
					else {
						// its an options object that explicitly names the information so iterate and reduce the information inside
						for (var name in params[i])
							this.reduceAttribute(name, params[i][name]);
					}
					break;

				// note that we could check to see if the string matches the reContentIDClasses regex and treat it as content otherwise
				// but its more conservative to let reduceAttribute throw an exception since it could be a subtle error in syntax.
				case 'string':
					// its a tagIDClasses -- parse and process
					this.reduceAttribute('tagIDClasses', params[i]);
					break;

				case 'function':
					// its an unnamedCB
					this.reduceAttribute('unnamedCB', params[i]);
					break;
			}
		}

		// the content array may have aritrary nested arrays that could be flattened, but I think its not necessary because 
		// Component.mount handles it. Nesting arrays do not introduse a correspnding DOM Node layer -- mount will flatten them.
		this.content.reverse();

		// its actually class style but it seems like it should be called styles so make an alias so we can use either one.
		this.style = this.styles;
	}

	// return a classifier string which determines how to reduce the attribute 
	classifyAttribute(name) {
		if (/^(content|paramNames|tagIDClasses|unnamedCB)$/.test(name)) return name;
		else if (/(className|class|classes|classNames)/.test(name))     return 'className';
		else if (/(tagName|name|idName)/.test(name))                    return 'top';
		else if (name == 'children')                                    return 'content';
		else if (name == 'optParams')                                   return 'optParams';
		else if (name == 'styles')                                      return 'styles';
		else if (name == 'style')                                       return 'styles';
		else if (name == 'props')                                       return 'props';
		else if (name in this.mapOfOptParamNames)                       return 'optParams';
		else if (name in knownStyleProperties)                          return 'styles';
		else                                                            return 'props';
	}


	// this function is used to process the contents of an options object for which the value has a name (unlike positional params)
	// We will classify the attribute based on its name and then reduced them differently based on their classification
	reduceAttribute(name, value) {
		// skip if there is no value. 
		if (value == null)
			return;

		// the classifier will tell us how to reduce it
		var attrClassifier = this.classifyAttribute(name);

		var objContainer
		switch (attrClassifier) {
			case 'children':
			case 'content':
				this.content.push(value);
				return;

			case 'className':
				// classes are not first come first server except that '!' prevents additional classes from base classes from being added. 
				if (Array.isArray(value)) value = value.join(' ');
				if (/[!]/.test(value))
					this.lockedParams[name] = true;
				this.className += " "+value.replace(/[!.]/g, ' ');
				return;

			case 'paramNames':
				// we already collected the paramNames in a first pass so that we can classify in the second pass so just ignore here
				return;

			case 'tagIDClasses':
				var matched = reContentIDClasses.exec(value);
				if (!matched)
					throw new AssertError("invalid tagIDClasses string syntax. ", {name:name,value:value});

				// the group names in reContentIDClasses correspond to the real attribute names so matched.group can be reduced like 
				// any options object 
				for (var name in matched.groups)
					this.reduceAttribute(name, matched.groups[name]);
				return;

			case 'unnamedCB':
				this.unnamedCB.push(value);
				return;

			// set the objContainer on these so that we can handle them all with a common algorithm below
			case 'top':       objContainer = this;           break;
			case 'props':     objContainer = this.props;     break;
			case 'styles':    objContainer = this.styles;    break;
			case 'style':     objContainer = this.styles;    break;
			case 'optParams': objContainer = this.optParams; break;
		}

		// these are containers for these types of attributes so iterate and reduce each key in them
		if (/(optParams|styles|style|props)/.test(name)) {
			for (key in value)
				this.reduceClassifiedAttr(objContainer, attrClassifier,  key, value[key]);
		} else {
			// since props is the default when the name is not recognized, and we think that DOM properties can not be objects
			// (just string and numbers) send the attr to optParams if the value is an object
			if (attrClassifier=='props' && typeof value == 'object')
				this.reduceClassifiedAttr(this.optParams, 'optParams',  name, value);
			else
				this.reduceClassifiedAttr(objContainer, attrClassifier,  name, value);
		}
	}

	// this function is used when the attribute <name> is classified and its not onw of the special cases.
	// it sets the attributes value in the right place and records it as locked so that it wont be overwritten if a lower base class
	// also includes a value for it.
	reduceClassifiedAttr(obj, classification, name, value) {
		classification = (classification=='top') ? '' : classification+'.';
		if (classification+name in this.lockedParams)
			return;
		obj[name] = value;
		this.lockedParams[classification+name] = true;
	}

	// we can probably make the dom el more effieciently than redom's el now but we can optimize that later. 
	makeREDOMTagString() {
		var redomTagStr = this.tagName
		if (this.idName)
			redomTagStr += "#"+this.idName;
		if (this.className) {
			redomTagStr += "."+this.className.replace(/(^\s+)|(\s+$)/,'').replace(/\s+/g,'.')
		}
		return redomTagStr || '';
	}

	getUnnamedCB(force) {
		if (this.unnamedCB.length == 0)
			return (force) ? ()=>{} : null;
		else if (this.unnamedCB.length == 1)
			return this.unnamedCB[0];
		else
			return (...p)=>{
				for (let i=0; i<this.unnamedCB.length; i++)
					this.unnamedCB[i](...p)
			}
	}
}


// Form a parent<->child relationship between DOM Elements.
// This is a wrapper over the <domNode>.appendChild/insertBefore methods. It adds two features.
//    1. The child content can be specified in more flexible ways
//    2. It maintains named links in the prent to the child under these circumstances
//        * If a name is available for a child node
//        * the parent has the [bgComponent] key (indicating that it is opting into this behavior)
//
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
//                                       name reardless of whether the array itself is named. Typically, arrays will not be named
//                                       and there is no difference between adding the children individually or within an array.
// ComponentUnmount:
//     To avoid memory leaks, ComponentMount and ComponentUnmount should be called in matching pairs. If you call ComponentMount
//     then you should call ComponentUnmount to undo the cyclic references when the dom element is no longer needed. 
//     The exception to this is if the child is unamed. In that case no extra references are formed and the discarding the parent
//     DOM node is sufficient.
//
// Params:
//    name:string          : the variable-like name of the child. If not provided, <childContent>.name will be used. If that
//                           does not exist, childContent will be unamed with regard to its parent.
//                           The special name 'unnamed' is recognized as no name being passed. This could be useful to avoid ambiguity
//    childContent:<multi> : the content to be added to this component's children. It can be given in any of the types described above.
//    insertBefore:object  : (optional) the existing child to insert childContent before as a DOM Node or component object.
//                           Default is append to end fo existing
// Usage:
// The name parameter is optional but for readability, it is the second parameter if provided.
// Note that if first param is a single word content and the insertBefore is specified it will incorrectly be interpreted as
// Form1.  You can pass 'unnamed' as the first paramter avoid ambiguity and still result in an unnamed child.
//    Form1: ComponentMount(<parent>, <name>, <childContent> [,<insertBefore>])
//    Form2: ComponentMount(<parent>, <childContent> [,<insertBefore>])
export function ComponentMount(parent, p1, p2, p3) {
	// detect form1 and form2
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
				element.innerHTML = childContent.trim();
				element = element.firstChild;
			}
			else
				element = text(childContent);

			childContent = element;
			break;

		case 'object':
			// iterate an array of children and recursively add them
			if (Array.isArray(childContent)) {
				if (name && parent[bgComponent])
					parent[name]=[];
				for (var i =0; i<childContent.length; i++) {
					// recurse explicitly with all the params to avoid any ambiguity -- if insertBefore is undefined, pass null
					var mountedChild = ComponentMount(parent, null, childContent[i], insertBefore || null);
					if (name && parent[bgComponent])
						parent[name][i] = mountedChild;
				}
				return childContent;
			}
			break;

		default:
			throw new AssertError("Invalid arguments. ChildContent needs to be an object, array or string", {childContent:childContent,p1:p1,p2:p2,p3:p3, type:typeof childContent});
	}

	// do the work
	redomMount(parent, childContent, insertBefore);

	// if name was not explicitly passed in, see if we can get it from the content
	if (!name && typeof childContent == 'object' && childContent.name)
		name = childContent.name;

	if (parent[bgComponent]) {
		if (name) {
			parent[name] = childContent;
			childContent.name = name;
			if (!parent.mounted)
				parent.mounted = [];
			parent.mounted.push(name);
			var elNode = getEl(childContent); if (elNode && elNode.classList) elNode.classList.add(name);
		} else {
			if (!parent.mountedUnamed)
				parent.mountedUnamed = [];
			parent.mountedUnamed.push(childContent);
		}
	}

	if (childContent[bgComponent]) {
		if (childContent.parent)
			console.log('replacing childContent.parent = ',childContent.parent, ' with ', parent);
		childContent.parent = parent;
	}

	return childContent;
}

// Tear down the parent<->child relationship that ComponentMount created and remove the DOM child relationship also.
export function ComponentUnmount(parent, name) {
	var child = parent[name];
	assert(!!child, "unmounting a child with ComponentUnmount that does not exist in the parent")
	redomUnmount(parent, parent[name]);
	var i = parent.mounted.indexOf(name);
	if (i != -1) parent.mounted.splice(i,1);
	if (parent[name].parent === parent)
		delete parent[name].parent;
	delete parent[name];
	return child;
}
