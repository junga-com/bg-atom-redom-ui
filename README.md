# bg-atom-redom-ui

This is a node package that can be used in atom packages to aid in creating Atom style guide compliant UI features.



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
