'use babel';

import clonedeep from 'lodash.clonedeep'

// redom does not export this function so repeat it
export function getEl (parent) {
  return (parent.nodeType && parent) || (!parent.el && parent) || getEl(parent.el);
}

// compiled common Regular Expressions
export const reEmpty=/^\s*$/;

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
console.log(options);
	// first remove the children array if any since it could be big and we dont want to deep clone it
	const children = options["children"] 
	if ("children" in options) delete options["children"];

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
