'use babel';

import { el, list, mount as redomMount, setAttr, text } from 'redom';
import { AssertError } from './errorHandling'



// <div class='tooltip top'>
//   <div class='tooltip-arrow'></div>
//   <div class='tooltip-inner'>
//     With a keystroke <span class="keystroke">cmd-shift-o</span>
//   </div>
// </div>

// Tooltip.
// For normal atom tooltips, this is not needed. use atom.tooltips.add(this.el ... instead
// Params:
//     msg      : The text displayed in the tooltip
//     options  : an object with various optional keys
// Options:
//     attrs    : an object containing any attribute or property that can be set on the new DOM element
export class Tooltip {
	constructor(msg, options) {
		this.msg = text(msg);
		this.options = options || {};
		this.el = el("div.tooltip.top", this.options["attr"], [
			el("div.tooltip-arrow"),
			el("div.tooltip-inner", this.msg)
		]);
	}
}
