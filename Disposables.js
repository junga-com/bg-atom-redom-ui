// This was inspired by the Atom Disposable and CompositeDisposable classes. This adds destroy as a synonym for dispose and treats
// functions objects the same as <obj>.dispose so that one class does it all.
// The idea is that if your class needs to keep track of things to cleanup with its objects are destroyed/disposed, then add a
// disposables = new Disposables() member and add any function or object that has a dispose or destroy method to the it. Then in your
// class's destroy or dispose method, call this.disposables.dispose() or Disposables.DisposeOfMembers(this).
export class Disposables {
	// this iterates the direct members of <obj> and for each member that is an 'object' type and has a dispose or destroy method
	// it calls that method.  If abused, this could become inefficient, iterating every object and nested object too frequently.
	// It should be used when the object is a high level one that does not get created and destroyed many times within a user
	// transaction.
	static DisposeOfMembers(obj) {
		for (const name of Object.getOwnPropertyNames(obj)) {
			const prop = obj[name];
			if (prop && typeof prop == 'object' && typeof prop.dispose == 'function') {
				//console.log(`!!!found ${name} to dispose`);
				prop.dispose();

			} else if (prop && typeof prop == 'object' && typeof prop.destroy == 'function') {
				//console.log(`!!!found ${name} to destroy`);
				prop.destroy();
			}
		}
	}

	constructor(...disposables) {
		this.cbs = [];
		this.add(disposables)
	}

	// add one or more disposables that will be invoked when this disposable is disposed.
	// Params:
	//     <disposables> : one or more <disposable>. They can be passed as multiple arguments and/or as an array of <disposable>
	//     <disposable>  : a callback that will be invoked when this classes dispose() method is called. It can be one of these...
	//                   (function) : if its a function, it will be invoked directly
	//                   (object)   : if its an object, and has a dispose method, that will be invoked otherwise if it has a
	//                                destroy methods, that will be invoked.
	//                   (null),(undefined) : no action. it will be ignored
	//                   (other)    : if none of the above, its an invalid <disposable> and an assertion will be thrown.
	add(...disposables) {
		disposables = disposables.flat();
		this.cbs=this.cbs.concat(
			disposables.map((cb)=>{
				switch (typeof cb) {
					case 'function': return cb;
					case 'object':
						if (typeof cb.dispose == 'function') return cb.dispose.bind(cb);
						if (typeof cb.destroy == 'function') return cb.destroy.bind(cb);
					case 'null':
					case 'undefined': return undefined;
				}
				console.assert(false, 'Parameters passed to Disposable must be a function or an Object with a "dispose" or "destroy" method. parameter='+cb)
			})
		);
	}
	dispose() {
		var cb;
		while (cb = this.cbs.shift()) {
			cb();
		}
	}
}
