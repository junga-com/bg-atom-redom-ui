import { Component } from './component'

export class TextEditor extends Component {
	constructor(text, ...options) {
		super('$atom-text-editor',Object.assign(...options));
		this.textEditor = this.el.getComponent().props.model;

		this.textEditor.setText(text);

		var grammarJS = atom.grammars.grammarForScopeName('source.js');
		if (grammarJS)
			this.textEditor.setGrammar(grammarJS);
	}
}

export class Dragger extends Component {
	constructor(dragCB, ...options) {
		super('$div.dragger', ...options)
		this.dragCB = dragCB;
		this.el.onpointerdown = (e)=>this.onDragStart(e);
	}
	onDragStart(e) {
		this.el.setPointerCapture(e.pointerId);
		this.capturedId = e.pointerId;
		this.dragStart = {x:0,y:0};
		({x:this.dragStart.x, y:this.dragStart.y} = e);
		this.el.onpointermove  = (e)=>this.onDragMove(e);
		this.el.onpointerup    = (e)=>this.onDragEnd(e);
		this.el.onpointercancel= (e)=>this.onDragEnd(e);
	}
	onDragMove(e) {
		if (e.pointerId = this.capturedId) {
			const pos = {x:0,y:0};
			({x:pos.x, y:pos.y} = e);
			var delta = {
				x: pos.x - this.dragStart.x,
				y: pos.y - this.dragStart.y,
				toString: function() {return "("+this.x+","+this.y+")"}
			}
			if (this.dragCB)
				this.dragCB(delta, e, this);
		}
	}
	onDragEnd(e) {
		if (e.pointerId = this.capturedId) {
			this.el.onpointermove = null;
			this.el.onpointerup   = null;
			this.el.onpointercancel= null;
			this.el.releasePointerCapture(e.pointerId);
			this.capturedId - null;
		}
	}
}
