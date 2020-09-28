import * as fs from 'fs'

const reEmptyLine   = /^\s*(((\/\/)|#).*)?$/;
const reParamLine   = /^\s*(?<name>[^=\s]*)\s*=\s*(?<value>.*)$/;
const reSectionLine = /^\s*\[\s*(?<name>[^\]]*)(?<a>\s*)\]\s*$/;

// read the contents of an ini style config file into a JS object
// Params:
//    <iniFile> : path to a ini style file
// Return Value:
//    (object)  : The structure of this object reflects the structure of the ini file contents.
//                The keys are either top level parameter names (before the first section line) or a section name.
//                The values of section name keys are objects that contain key,values pairs for the paramters in that section.
//                Native ini files can only have two levels of parameters. The bg-lib library often uses multipart sections names
//                delimitted by '.' to implement arbitrary nesting. In the future, this function may support that via an option.
//                This function supports an extension that an empty section line '[ ]' will make parameters in that section add to
//                the top level name space
export function iniParamGetAll(iniFile) {
	const ini = Object.create(null);
	if (!fs.existsSync(iniFile)) return ini;
	var curSect = ini;
	var lineNo=0
	for (var line of fs.readFileSync(iniFile, {encoding:'utf8'}).split('\n')) {
		var rematch;
		lineNo++;

		// skip full comment lines and empty lines
		if (reEmptyLine.test(line)) {
			continue;
		}

		// process parameter assignment lines
		if (rematch = reParamLine.exec(line)) {
			const {name, value} = rematch.groups;
			ini[name]=value

		// process section heading lines
	} else if (rematch = reSectionLine.exec(line)) {
			// remove trailing spaces which was (too) hard to do in the matching regex
			const name = rematch.groups.name.replace(/\s*$/,'');
			// remove quotes if present
			if (/(^".*"$)|(^'.*'$)/.exec(name))
				name = name.substr(1,name.length-2);
			if (name!='')
				curSect = ini[name] = Object.create(null);
			else
				curSect = ini;
			continue;
		} else {
			console.warning(false, 'unknown line syntax encounted reading iniFile', {iniFile,line,lineNo});
		}
	}
	return ini;
}
