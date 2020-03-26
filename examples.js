'use babel';

import { CompositeDisposable } from 'atom';
import { Component } from './component'
import { Panel, PanelHeader, PanelBody } from './panels'
import { TextEditor, Dragger } from './miscellaneous'

exampleData = {
	example1: `
		 new Panel({
		 	name: "example1",
		 	class: "BGExample",
		 	children: [
		 		new PanelHeader(" Example 1"),
		 		"Woo hoo!!!"
		 	]
		 });
	`,

	panelWithHeaderAndBody: `
		 new Panel({
		 	name: "panelWithHeaderAndBody",
		 	class: "BGExample",
		 	children: [
		 		new PanelHeader("Panel With Header and Body"),
		 		new PanelBody({
		 			children: [
		 				"Some content..."
		 			]
		 		}),
		 		
		 	]
		 });
	`,

	panelWithHeaderAndText: `
		 new Panel({
		 	name: "panelWithHeaderAndText",
		 	class: "BGExample",
		 	children: [
		 		new PanelHeader("Panel With Header and Text"),
		 		"Some content..."
		 	]
		 });
	`
}



function replaceAll(str,mapObj){
	var re = new RegExp("\\b"+Object.keys(mapObj).join("\\b|\\b")+"\\b","g");
	return str.replace(re, function(matched){
		return mapObj[matched];
	});
}



class OneDemoAndCodeView extends Panel {
	constructor(name, demo, code, ...p) {
		super({
			name: name,
			class: "BGOneExample",
			...p
		});
		this.mount([
			new Panel({name:"title", content: "Example "+name}),
			new Panel({name:"demo",  children: demo}),
			new TextEditor(code, {name:"code", tabIndex:1}),
			new Dragger((...p)=>this.onDrag(...p), {name:"dragger"})
		])
	}

	onDrag(delta, e) {
		var colWidthsStr = getComputedStyle(this.el).gridTemplateColumns;
		if (colWidthsStr) {
			const [cLeft, cDragger, cRight] = colWidthsStr.split(' ').map((v)=>{return parseInt(v)});
			var newPercent = (cLeft-cDragger/2+e.offsetX) / (cLeft+cDragger+cRight) * 100;
			newPercent = Math.min(Math.max(newPercent, 10), 90);
			this.el.style.gridTemplateColumns = `${newPercent}% ${cDragger}px auto`;
		}
	}
}


bableMap = {
	"Panel": "_panels.Panel",
	"PanelHeader": "_panels.PanelHeader",
	"PanelBody": "_panels.PanelBody",
	"Component": "_component.Component"
}

export class BGAtomRedomExamples extends Panel {
	// this is the static Entrypoint to enabled adding this view to Atom packages easily. This is in a node package so we cant
	// activate it automatically. A package can call BGAtomRedomExamples.Singleton('activate'), .'deactivate' and 'toggle' 
	static Singleton(cmd) {
		if (!window.atom) return;
		switch (cmd) {
			case 'activate':
				window.bgAtomRedomExamples = new BGAtomRedomExamples({class: 'BGAtomRedomExamples', tabIndex: 1});
				break;
			case 'deactivate':
				if (window.bgAtomRedomExamples) {
					window.bgAtomRedomExamples.disposables.dispose();
					delete window.bgAtomRedomExamples;
				}
				break;
			case 'show':
			case 'toggle':
				if (window.bgAtomRedomExamples)
					window.bgAtomRedomExamples.toggle((cmd=='show')?true:undefined);
				else {
					window.bgAtomRedomExamples = new BGAtomRedomExamples({class: 'BGAtomRedomExamples', tabIndex: 1});
					window.bgAtomRedomExamples.show();
				}
				break;
		}
	}
	static SetLocation(location) {
		if (BGAtomRedomExamples.location != location) {
			BGAtomRedomExamples.location = location;
			if (window.bgAtomRedomExamples) {
				var isShown = window.bgAtomRedomExamples.shown;
				window.bgAtomRedomExamples.destroy();
				delete window.bgAtomRedomExamples;
				window.bgAtomRedomExamples = new BGAtomRedomExamples({class: 'BGAtomRedomExamples', tabIndex: 1});
				if (isShown)
					window.bgAtomRedomExamples.show();
			}
		}
	}

	constructor(...options) {
		super(...options);
		this.disposables = new CompositeDisposable();
		this.uri = 'bg://uiExamples';

		for (const name in exampleData) {
			this.addExample(name, exampleData[name]);
		}

		// hide them all, initially
		for (var i=0; i<this.mounted.length; i++)
			this[this.mounted[i]].el.style.display="none";

		// init the selection mechanism and select the first example
		this.selectedIndex = 0;
		this.selectExample(0);

		switch (BGAtomRedomExamples.location) {
			case 'ModalPanel':    this.paneledParent = atom.workspace.addModalPanel({   item: this.el, visible: false, autoFocus: true}); break;
			case 'TopPanel':      this.paneledParent = atom.workspace.addTopPanel({     item: this.el, visible: false}); break;
			case 'BottomPanel':   this.paneledParent = atom.workspace.addBottomPanel({  item: this.el, visible: false}); break;
			case 'LeftPanel':     this.paneledParent = atom.workspace.addLeftPanel({    item: this.el, visible: false}); break;
			case 'RightPanel':    this.paneledParent = atom.workspace.addRightPanel({   item: this.el, visible: false}); break;
			case 'HeaderPanel':   this.paneledParent = atom.workspace.addHeaderPanel({  item: this.el, visible: false}); break;
			case 'FooterPanel':   this.paneledParent = atom.workspace.addFooterPanel({  item: this.el, visible: false}); break;
			default:
				this.disposables.add(atom.workspace.addOpener((uri) => {
					if (uri == this.uri)
						return this;
				}));
				break;
		}

		if (this.paneledParent) {
			this.paneledParent.view = this;
			this.paneledParent.getElement().classList.add('BGAtomRedomExamples')
		}

		atom.commands.add('atom-workspace', {
			'BGAtomRedomExamples:selectNext':     ()=>this.selectNext(),
			'BGAtomRedomExamples:selectPrevious': ()=>this.selectPrevious()
		});
	}

	show()   {
		if (this.paneledParent)
			this.paneledParent.show();
		else
			atom.workspace.open(this.uri)
		this.shown = true;
		this.el.focus();
	}
	hide()   {
		if (this.paneledParent)
			this.paneledParent.hide();
		else
			atom.workspace.hide(this.uri)
		this.shown = false;
	}
	toggle(state) {
		if ((typeof state != 'undefined') ? state : !this.shown)
			this.show();
		else
			this.hide();
	}

	addExample(name, codeText) {
		codeText = codeText.replace(/(^\t+ )|(^\n*)|(\s*$)/gm,'');
		// var displayText = codeText.replace(/^\t+ /gm,'|');
		// var displayText = codeText.replace(/^\n*/gm,'<');
		// var displayText = codeText.replace(/\s*$/gm,'>');
		this.mount(new OneDemoAndCodeView(
			name,
			eval( replaceAll(codeText, bableMap)),
			codeText
			// "function "+name+"(\n{\n"+codeText+"\n}\n"
		))
	}

	selectExample(name) {
		if (typeof name == 'string') {
			for (var i=0; i<this.mounted.length && this.mounted[i]!=name; i++);
			if (i<this.mounted.length)
				this.selectExample(i);
		} else if (name>=0 && name<this.mounted.length) {
			this[this.mounted[this.selectedIndex]].el.style.display = "none";
			this.selectedIndex = name;
			this[this.mounted[this.selectedIndex]].el.style.display = "";
			this[this.mounted[this.selectedIndex]].code.el.focus();
		}
	}
	selectNext() {
		this.selectExample((this.selectedIndex+1) % this.mounted.length);
	}
	selectPrevious() {
		this.selectExample((((this.selectedIndex-1) % this.mounted.length)+this.mounted.length) % this.mounted.length);
	}

	getTitle()            {return 'bg-atom-redom-ui Examples';}
	getElement()          {return this.el;}
	getDefaultLocation()  {return 'bottom';}
	getAllowedLocations() {return ['left','right','center','bottom'];}
	getURI()              {return this.uri;}
	isPermanentDockItem() {return false}
	onDidDestroy(callback) {
		this.onDidDestroy = callback;
		return {dispose: ()=>{this.onDidDestroy=null}}
	}

	dispose() {
		this.disposables.dispose();
	}

	destroy() {
		this.dispose();
		if (this.paneledParent)
			this.paneledParent.destroy();
		else
			if (this.onDidDestroy)
				this.onDidDestroy();
	}
}

BGAtomRedomExamples.location = ''
