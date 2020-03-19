'use babel';

import { Component } from './component'
import { Panel, PanelHeader, PanelBody } from './panels'

function replaceAll(str,mapObj){
    var re = new RegExp(Object.keys(mapObj).join("|"),"gi");

    return str.replace(re, function(matched){
        return mapObj[matched.toLowerCase()];
    });
}

class TextEditor extends Component {
	constructor(text, options) {
		super('atom-text-editor',Object.assign(options));
//		text = text.replace(new RegExp().)
		this.el.innerText = text;
		//atom.grammars.loadGrammar('source js', (g)=>this.setGrammar(g)) 
		// var grammarJS = atom.grammars.getGrammars().filter((g)=>{return (g.name == 'JavaScript')})
		// if (grammarJS)
		// 	atom.grammars.assignGrammar(this.el.getComponent().props.model, grammarJS);
	}

	// setGrammar(grammar) {
	// 	console.log("setGrammar called", grammar);
	// }
}


class OneDemoAndCodeView extends Panel {
	constructor(name, demo, code) {
		super({
			name: name,
			class: "BGOneExample"
		});
		this.mount([
			new Panel({name:"title", content: "Example "+name}),
			new Panel({name:"demo",  children: demo}),
			new TextEditor(code, {name:"code"})
		])
	}
}

class BGAtomRedomExamples extends Panel {
	constructor() {
		super();

		// addExamples
		Object.getOwnPropertyNames(BGAtomRedomExamples.prototype).forEach((name) => {
			if (/^example/.test(name)) {
				console.log(name + "= "+this[name]);
				this.mount(new OneDemoAndCodeView(
					name,
					this[name](),
					""+this[name]
				));
			}
		})

		// hide them all, initially
		for (var i=0; i<this.mounted.length; i++)
			this[this.mounted[i]].el.style.display="none";

		// init the selection mechanism and select the first example
		this.selectedIndex = 0;
		this.selectExample(0);
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
			console.log("selected "+this.mounted[this.selectedIndex]);
		}
	}
	selectNext() {
		this.selectExample((this.selectedIndex+1) % this.mounted.length);
	}
	selectPrevious() {
		this.selectExample((((this.selectedIndex-1) % this.mounted.length)+this.mounted.length) % this.mounted.length);
	}


	example1() {
		return new Panel({
			name: "example1",
			class: "BGExample",
			children: [
				new PanelHeader("Example 1"),
				"Woo hoo!!!"
			]
		});
	}

	example2() {
		return new Panel({
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
	}

	example3() {
		return new Panel({
			name: "panelWithHeaderAndText",
			class: "BGExample",
			children: [
				new PanelHeader("Panel With Header and Text"),
				"Some content..."
			]
		});
	}
}

export function BGToggleAtomRedomExamples() {
	if (!window.atom) return;

	if (!window.bgAtomRedomExamples) {
		var view = new BGAtomRedomExamples();
		bgAtomRedomExamples = atom.workspace.addModalPanel({
			item: view.el
		});
		bgAtomRedomExamples.view = view;
		bgAtomRedomExamples.getElement().classList.add('BGAtomRedomExamples')
		bgAtomRedomExamples.shown = true;
		bgAtomRedomExamples.toggle = () => {
			if (bgAtomRedomExamples.shown)
				bgAtomRedomExamples.hide();
			else
				bgAtomRedomExamples.show();
			bgAtomRedomExamples.shown = ! bgAtomRedomExamples.shown;
		}
	} else {
		bgAtomRedomExamples.toggle();
	}

}
