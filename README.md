# bg-atom-redom-ui

This is an NPM package that provides a Components library over the REDOM library that are compliant with the Atom style guide.

This is a work in progress. The idea is to explore programming in JS/DOM in more of a programming style than markup but still have good css separation.

Example...

	export class BGFontSizeControlView  {
	constructor() {
		this.panel = new Panel({
		  class: "bg-ui-font-sizer-dialog",
		  children: [
			[new Component('div.panel-heading', {children: el("h1","Keyboard Mode to Adjust Pane Tab Sizes - 'Escape' when done", {tabindex:1})})],
			["leftSide", new Component('div.inset-panel', {
			  children: [
					["left",   new OneShotButton("<p>Left Dock</p>"   ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["center", new OneShotButton(
						'<div>Workspace Center</div>'+
						'<div><kbd class="key-binding">tab</kbd><span>next Dock</span></div>'+
						'<div><kbd class="key-binding">shift-tab</kbd><span>previous Dock</span></div>'
					 	,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["right",  new OneShotButton("<p>Right Dock</p>"  ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))],
					["bottom", new OneShotButton("Bottom Dock" ,(dockSelection)=>this.setSelectedTabLocation(dockSelection))]
			  ]
			})],
			["rightSide", new Component('div.inset-panel', {
  			  children: [
					["escape",      new Button('<kbd class="key-binding">escape   </kbd><span>close this window</span>',     ()=>DispatchCommand('bg-tabs:toggle-size-dialog'))],
					["reset",       new Button('<kbd class="key-binding">Ctrl-0   </kbd><span>reset to default size</span>', ()=>DispatchCommand('bg-tabs:reset-font-size'))],
  					["fontBigger",  new Button('<kbd class="key-binding">Ctrl-+   </kbd><span>Bigger Font</span>',           ()=>DispatchCommand('bg-tabs:increase-font-size'))],
  					["fontSmaller", new Button('<kbd class="key-binding">Ctrl--   </kbd><span>Smaller Font</span>',          ()=>DispatchCommand('bg-tabs:decrease-font-size'))],
					["lineShorter", new Button('<kbd class="key-binding">Ctrl-up  </kbd><span>Shorter Line</span>',          ()=>DispatchCommand('bg-tabs:decrease-line-height'))],
  					["lineTaller",  new Button('<kbd class="key-binding">Ctrl-down</kbd><span>Taller Line</span>',           ()=>DispatchCommand('bg-tabs:increase-line-height'))]
  			  ]
			})]
		  ]
		});
		this.modalPanel = atom.workspace.addModalPanel({item: this.panel.el, visible: false, autoFocus:true});
		this.modalPanel.getElement().classList.add("bg-ui-font-sizer-dialog");

		this.setSelectedTabLocation("center");
	}



## Atom UI Hacking Resources

Style Guide  package. ctrl-shift-G

#### Available Less Variables
atom/static/variables/ui-variables.less

These are particularaly important for colors. Instead of making up your own color, fond a variable. When the user changes theme, 
the new theme will set these to a new value and your UI should respect that.  

#### Available CSS Classes
The style guide demonstrates some common class names but there is no list of available styles. 

In the atom project the core required styles seem to be in atom/static/atom-ui/_index.less  (not sure what ./static/core-ui/_index.less is)  

atom.styles -- global StyleManager object has an array containing each loaded stylesheet.

TODO: add a Atom command that gleans all the available class names from atom.styles, tagging the ones from the built-in atom-ui.less
as prefered and provides auto-complete (see css-spy package)
