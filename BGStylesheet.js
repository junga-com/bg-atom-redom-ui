
export class BGStylesheet {
	constructor() {
		var styleEl = document.createElement("style");
		document.head.appendChild(styleEl);
		this.dynStyles = styleEl.sheet;
		this.freeIDs = [];
		// consume the '0' index b/c 0 is not a valid ruleID
		this.dynStyles.insertRule('#NOTHING {border: none}', 0);
		//window.r=this; // for console inspection
	}

	isEmpty() { return this.dynStyles.cssRules.length == 0}

	addRule(cssText) {
		if (this.freeIDs.length > 0) {
			var ruleID = this.freeIDs.pop();
			return this.updateRule(ruleID, cssText)
		} else {
			var ruleID = this.dynStyles.cssRules.length;
			this.dynStyles.insertRule(cssText, ruleID);
			return ruleID;
		}
	}
	updateRule(ruleID, cssText) {
		if (!ruleID)
			return this.addRule(cssText)
		this.dynStyles.deleteRule(ruleID);
		this.dynStyles.insertRule(cssText, ruleID);
		return ruleID;
	}
	deleteRule(ruleID) {
		this.updateRule(ruleID, '#NOTHING {}')
		this.freeIDs.push(ruleID);
		return 0;
	}
	deleteAllRules() {
		while (this.dynStyles.cssRules.length > 0) {
			this.dynStyles.deleteRule(this.dynStyles.cssRules.length -1);
		}
		this.freeIDs = [];
	}
	addAllRules(ruleArray) {
		this.deleteAllRules();
		for (var i=0; i< ruleArray.length; i++) {
			this.dynStyles.insertRule(ruleArray[i], i);
		}
	}
}
