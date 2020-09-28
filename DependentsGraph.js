import { Disposables } from './Disposables'

// enum for whether the get[O|C]Node methods should create the node on demand or return undefined if it does not exist
const GetMode = {NoCreate:true, CreateIfNeeded:false};

// This is the node object for the dependency graph data structure
//     this.deps   : is the forward relationship which is a map because it has state embodied in the PropagationFn callback
//                   the value of the Map entries is a function object that has the signature (obj, ...p) where <obj> is the
//     this.bkLinks is the reverse relationship which allows us to maintain the graph and no what depends on what
export class ObjectNode {
	constructor(obj) {
		this.obj = obj;
		this.channels = new Map();
		this.bkLinks = new Set();
		this.disposables = new Disposables();
		this._isNew = true;  // will be true if its empty when its retrieved
	}
	destroy() {
		this.disposables.dispose();

		for (const [channel, node] of this.channels)
			node.destroy;
		this.channels.clear();

		for (const {obj1,channel,backMap} of this.bkLinks)
			backMap.delete(this.obj);
		this.bkLinks.clear();

		this.obj=undefined;
	}
	isNew() {return this._isNew}
	isEmpty() {
		return this.channels.size == 0 && this.bkLinks.size == 0;
	}
	getCNode(channel, getMode=GetMode.CreateIfNeeded) {
		var cnode = this.channels.get(channel.toString());
		if (!cnode) {
			if (getMode==GetMode.CreateIfNeeded) {
				const obj1 = this.obj;
				const classCandidates = deps.cnodeClasses.filter((C)=>{return C.matchSource(obj1,channel)});
				switch (classCandidates.length) {
					case 0: cnode = new ChannelNode(obj1,channel);        break;
					case 1: cnode = new classCandidates[0](obj1,channel); break;
					default:
						console.warn("DependentsGraph:ObjectNode:getCNode: multiple registered ChannelNodeClasses match {obj1,channel}",{obj1,channel})
						cnode = new classCandidates[0](obj1,channel);
				}

				this.channels.set(channel.toString(), cnode);
			}
		} else
			cnode._isNew = this.isEmpty();
		return cnode;
	}
	releaseCNode(cnode) {
		if (cnode && cnode.isEmpty()) {
			this.channels.delete(cnode.channel.toString());
			cnode.destroy();
		}
	}
}

export class ChannelNode {
	constructor(obj1, channel) {
		this.obj1 = obj1;
		this.channel = channel;
		this.targets = new Map();
		this.defaultTargetMethodName = undefined;
		this.contextCount = 0;
		this.params = [];
		this.disposables = new Disposables();
		this._isNew = true;  // will be true if its empty when its retrieved
	}
	destroy() {
		this.disposables.dispose();

		for (const [obj2, propagationFn] of this.targets) {
			propagationFn.destroy && propagationFn.destroy();

			// remove the backwards link and remove onode2 if its becomes empty
			const onode2 = deps.getONode(obj2, GetMode.NoCreate);
			if (onode2) {
				onode2.bkLinks.delete(propagationFn.bkobj);
				deps.releaseONode(onode2);
			}
		}
		this.targets.clear();

		this.obj1=undefined;
		this.channel = undefined;
	}
	isNew() {return this._isNew}
	isEmpty() {
		return this.targets.size == 0;
	}
}


// DependentsGraph is the class of the global.deps object. It is an alternative to the emitter pattern. The idea is that reactive
// programming has a core component that JS objects depend on other JS objects. This standardizes that functionality into a global
// dependency graph that records what is dependent on what and vice-a-versa.  It considers functional programming of callbacks as an
// anti-pattern. Instead, behavior is returned to the objects themselves as the 'onDepChanged' method which handles the object
// reacting to one of its dependencies changing state. The 'onDepChanged' method can be seen as the generic catch all for changes.
// Several optimization patterns are supportted to preserve the state of knowlege through the firing of dependencies through the
// graph. For is example. The first unoptimized version of an object might receive the onDepChanged msg and then query the state
// of all its dependent objects to calulate what state it is in. This should always work functionally but may result in duplicated
// work.  A more refined implementation may connect a particular dependency change channel to a particular method which does only
// what it needs to respond to that specific event.
//
// Each dependent relation is a triplet {$obj1,obj2,propagationFn} where <$obj1> is the source <obj1> with an optional <channel> that
// identifies a type of change to <obj1>, <obj2> is the dependent object that will receive change notifications, and propagationFn
// is the action that will happen when the change is propagated.
//
// The default propagationFn calls <obj2>.onDepChanged(...). The <obj1> class can register integrations with DependentsGraph so that
// a different <obj2> method will be called that is specific to it and its suportted channels. For example, the atom.config mechanism
// makes it so <obj2>.onConfigChanged(...) will be called if it exists instead of onDepChanged.  When a relation is added, the propagationFn
// can be overrided so a very action is taken. Typically, those propagationFn should be kept simple, just calling a specific <obj2>.<method>(),
// possibly conditionally to filter out uneeded propagation, and possibly rearranging the arguments to comply with what <method>
// expects.
//
// The propagationFn can also be modified with some builtin behaviors like debouncing. Instead of passing in a null, or a function
// as the value of propagationFn, you can pass in an object that specifies attributes of the propagationFn like {debounce:500}
//
// Data Structure:
//    The DependentsGraph is a multileveled data structure. It stores relationships between a source {object (obj1) plus a channel}
//    and destination object (obj2). The relationship is stored as a pair of forward and reverse links so that the graph can be
//    navigated in both directions. It is effiecient to add and remove relationships. Each relationship has a PropagationFn object.
//    The PropagationFn is called to invoke propagation of changes through the graph and it also is used as an object to store
//    information about the relationship.
//
//    First Level is a Map of (Object,ObjectNode). ObjectNode contains a Set of Objects that this Object depends on (bkLinks) and
//      'channels' which is the second level of the data structure.
//    Second Level is a Map of (channel, ChannelNode). Channel is object class specific. It can be any type and value that makes
//      sense for that type of object. A channel represents a state in the object that can change independently from other state in
//      the object. The special channel deps.fAll represents the entire object (i.e. any state changed without specifying further)
//    Third Level is a Map of (Object,PropagationFn) where these objects are the destination objects of relationships and the
//      PropagationFn is the state of the relationship.
//
//    Relations are always between an (object,channel) as the source and an (object) as the destination. The destination depends on
//    the source such that when the source changes, the destination may need to react and the PropagationFn is invoked to make that
//    reaction happen.
//
//    Each object is represented by one ObjectNode which is used for all relationships -- both those where that object is the source
//    and those where it is the destination. The ChannelNodes contained by an ObjectNode hold only the source object side of the
//    relationships. The ObjectNodes contain the bkLink set which is the destination side of the relationship.
// Params:
// Theses are the common parameters and variable names used in various methods in this mechanism
//    <obj1>   : the source object of the relationship  (<obj2> is dependent on <obj1>)
//    <obj2>   : the destination object of the relationship (<obj2> is dependent on <obj1>)
//    <channel>: a value that identifies a subset of changes to <obj1> that the relationship concerns
//    <$obj1>  : <obj1> or {obj,channel}. Either <obj1> directly which implies that channel==deps.fAll, or an object that contains
//               both <obj1> and <channel>
//    <propagationFn> : The propagationFn can be specified in several ways.
//             null   : the default calls <obj2>.onDepChanged or a more specific method identified by the ChannelNode object
//                      representing the relation. e.g. if cnode.defaultTargetMethodName=='onConfigChanged' then <obj2.onConfigChanged
//                      will be called.
//             type 'function' : if <propagationFn> is a function, it will be used directly
//             type 'object'   : if <propagationFn> is an object, a propagation function will be created using the values of any
//                               recognized keys.
//                               <debounce> : integer value to debounce the propagation. if 0, the default value will be used (500ms)
//                               <propagationFn> : the function to invoke after applying any other specified attributes (like debounnce)
export class DependentsGraph {
	constructor() {
		this.nodes = new Map();
		this.cnodeClasses = [];
		this.fireCount = 0;
		this.fAll = Symbol('fAll');
	}
	destroy() {
		this.nodes.forEach((node)=>{node.destroy()})
		this.nodes.clear()
	}

	registerCNodeClass(cnodeClass) {
		this.cnodeClasses.push(cnodeClass);
	}

	getONode(obj, getMode=GetMode.CreateIfNeeded) {
		var onode = this.nodes.get(obj);
		if (!onode) {
			if (getMode==GetMode.CreateIfNeeded) {
				onode = new ObjectNode(obj);
				this.nodes.set(obj, onode);
			}
		} else
			onode._isNew = onode.isEmpty();
		return onode;
	}

	releaseONode(onode) {
		if (onode && onode.isEmpty()) {
			onode.destroy();
			this.nodes.delete(onode.obj);
		}
	}

	getCNode(obj1, channel, getMode=GetMode.CreateIfNeeded) {
		const onode = this.getONode(obj1, getMode);
		return (!onode)
			? undefined
			: onode.getCNode(channel, getMode);
	}

	_normalizeSourceObject($obj) {
		if (typeof $obj.obj != 'undefined' && $obj.channel != 'undefined') {
			return [$obj.obj, $obj.channel];
		} else {
			return [$obj, this.fAll];
		}
	}


	// record that obj2 depends on obj1
	// Params:
	//    <$obj1> : {obj1,channel} or <obj1>. this defines the source of the dependency relationship.
	//          <obj1>    : this is the object whose state change will initiate action for this relationship.
	//          <channel> : default==deps.fAll(Symbol). the optional channel represents a type of change in <obj1>. A complex object
	//                      may have different parts that can change independently from each other. Specifying a channel makes the
	//                      propagation fire only when the relavent channel fires and avoided uneccessary propagation.
	//    <obj2>  : this object is depedent on the state of obj1 and will receive a propagation call when <obj1> fires
	//    <propagationFnParams> : this is the callback that handles the the proagation of change from obj1 to obj2
	//               (null)     : if none is provided, the default behavior is defined in the defaultPropagationFn method of this class.
	//               (function) : if a function is provided, it will be called like callback(obj2, ...p) where <obj> is the target
	//                            being notified that a dependent has changed and ...p are passed from the call to deps.fire(obj1, ...p)
	//               (object)   : if an object is passed in for this parameter createPropagationFn will create a custom PropagationFn
	//                            that reflects the specifications provide.
	// See Also:
	//    createPropagationFn : to see what attributes are recognized to create custom PropagationFn
	add($obj1, obj2, propagationFnParams) {
		const [obj1, channel] = this._normalizeSourceObject($obj1);
		const cnode1 = this.getCNode(obj1, channel);
		const onode2 = this.getONode(obj2);

		const propagationFn = this.createPropagationFn(cnode1, onode2, propagationFnParams);
		cnode1.targets.set(obj2, propagationFn);
		propagationFn.bkobj = {obj1,channel,backMap:cnode1.targets};
		onode2.bkLinks.add(propagationFn.bkobj);

		return cnode1;
	}

	// removed the dependency relationship between obj1 and obj2
	remove($obj1, obj2) {
		const [obj1, channel] = this._normalizeSourceObject($obj1);
		var cnode1, propagationFn;

		// remove the forward link -> call the relationship destroy fn if needed and remove cnode1,onode1 if they are now empty
		const onode1 = this.getONode(obj1, GetMode.NoCreate);
		if (onode1) {
			cnode1 = onode1.getCNode(channel, GetMode.NoCreate);
			if (cnode1) {
				propagationFn = cnode1.targets.get(obj2);
				propagationFn && propagationFn.destroy && propagationFn.destroy();
				cnode1.targets.delete(obj2);
				onode1.releaseCNode(cnode1);
			}
			this.releaseONode(onode1);
		}

		// remove the backwards link -> and remove onode2 if its now empty
		const onode2 = this.getONode(obj2, GetMode.NoCreate);
		if (onode2) {
			propagationFn && onode2.bkLinks.delete(propagationFn.bkobj);
			this.releaseONode(onode2);
		}

		return cnode1;
	}


	// record that obj is being destroyed so it should be completely removed from the graph including any relationship where it is
	// the source (obj1) or target (obj2)
	objectDestroyed(obj) {
		const onode = this.getONode(obj, GetMode.NoCreate);
		if (onode) {
			onode.destroy();
			this.nodes.delete(obj);
		}
	}

	logStatusForObj(obj) {
		const onode = this.getONode(obj, GetMode.NoCreate);
		console.log('DependentsGraph Status for <obj>=',{obj});
		console.log('<obj> receives change propagation from these objects');
		if (onode && onode.bkLinks.size>0) {
			for (const {obj1,channel,backMap} of onode.bkLinks)
				console.log('   <...',{obj1,channel});
		} else
			console.log('    < <none>');

		console.log('<obj> propagates changes to these objects...');
		if (onode && onode.channels.size>0) {
			for (const [channel, cnode] of onode.channels) {
				console.log('   channel:'+channel.toString());
				for (const [obj2, propagationFn] of cnode.targets)
					console.log('   >...',{obj2, propagationFn});
			}
		} else
			console.log('    > <none>');

		const changingCnodes = this.getChangesInProgress();
		if (changingCnodes.length > 0) {
			console.warn('Change propagation is supressed for these {obj,channels}...');
			for (const cnode of changingCnodes)
				console.warn('   :'+{refCnt:cnode.contextCount,obj1:cnode.obj1,channel:cnode.channel});
		}
	}

	logStatus() {
		console.log('Object Count '.padEnd(15)+": "+this.nodes.size);
		console.log('Fire Count '.padEnd(15)+": "+this.fireCount);
		console.log('Use logStatusForObj(<obj>) to see details of relationships for <obj>');
		this.logChangesInProgress();
	}

	logChangesInProgress() {
		const changingCnodes = this.getChangesInProgress();
		if (changingCnodes.length > 0) {
			console.warn('Change propagation is supressed for these {obj,channels}...');
			for (const cnode of changingCnodes)
				console.warn('   :'+{refCnt:cnode.contextCount,obj1:cnode.obj1,channel:cnode.channel});
		} else {
			console.log('no changes currently in progress');
		}
	}

	// To help debug missmatched changeStart/changeEnd calls this prints any that have started but not yet ended.
	getChangesInProgress() {
		var changingCnodes=[];
		for (const [obj1, onode] of this.nodes) {
			for (const [channel, cnode] of onode.channels) {
				if (cnode.contextCount>0) {
					changingCnodes.push(cnode);
				}
			}
		}
		return changingCnodes;
	}

	// changeStart/changeEnd should be called in pairs to start and end a sub transaction.
	// alternatively, fire(obj, ...p) can be called after the change if there are not multiple steps in the algorithm making the
	// change.  All 3 methods nest correctly so that an algorithm that starts the change on obj can directly or indirectly call
	// other algorithms that change obj and it will produce the optimum propagation of change events.
	// TODO: support debugging mode that records stack information so that miss-matched changeStart/changeEnd calls can be detected
	//       and identified.
	changeStart($obj1) {
		const [obj1, channel] = this._normalizeSourceObject($obj1);
		this.getCNode(obj1, channel).contextCount++;
	}

	// compliment to changeStart. If this is the topmost pair for obj, it will result in fire(obj) being called to propagate changes.
	// if extra parameters, p, are provided, they will be used in the call to fire(obj, p) but if not, the parameters provided by
	// the last nested call to changeEnd(obj,...p) or fire(obj,...p) that provided parameters will be used.
	// TODO: consider if params should be merged or composited using some yet to be determined algorithm if more than one nested
	//       call provides parameters
	changeEnd($obj1, ...p) {
		const [obj1, channel] = this._normalizeSourceObject($obj1);
		const cnode1 = this.getCNode(obj1, channel);
		console.assert((cnode1 && cnode1.contextCount>0), "unmatched DependentsGraph::changeEnd called. Better debugger will be coming. See comments on changeEnd");
		if (cnode1.contextCount>1) {
			cnode1.contextCount--;
			if (p.length >0)
				cnode1.params = p;
		} else {
			if (p.length==0)
				p = cnode1.params;
			cnode1.contextCount=0;
			cnode1.params = [];
			this.fire($obj1, p);
		}
	}

	// Alternative to changeStart/changeEnd that indicates that obj has changed and its deps should be notified acording to the
	// PropagationFn registered for the relationship. note that we do not propagate changes past the first relationship because that
	// is handled by the PropagationFn of each relationship. The default propagationFn will continue to fire events to its deps if the object
	// does not implement an onDepChanged but if it does, the onDepChanged implementation is responsible to propagate changes if needed.
	fire($obj1, ...p) {
		const [obj1, channel] = this._normalizeSourceObject($obj1);
		const onode1 = this.getONode(obj1, GetMode.NoCreate);
		if (onode1) {
			const cnode1 = onode1.getCNode(channel, GetMode.NoCreate);
			if (cnode1) {
				if (cnode1.contextCount>0) {
					if (p.length>0) cnode1.params = p;
				} else {
					for (const [obj2,propagationFn] of cnode1.targets) {
						this.fireCount++;
						propagationFn(...p)
					}
					onode1.releaseCNode(cnode1);
				}
			}
			this.releaseONode(onode1);
		}
	}

	// this defines the firing relationship between two dependent objects if one is not explicitly provided.
	// the default is ...
	//    1) invoke the obj2 method passed in from the cnode of the relationship (defaultTargetMethodName) if it exists
	//    2) invoke the gerenic onDepChanged method on obj2 if that exists
	//    3) dont invoke any method, but fire the generic change event for obj2 to pass through the change propagation
	// Params:
	//    <context>  : keys are obj1(source), obj2(destination) and defaultTargetMethodName(method to call on obj2 if it exists)
	defaultPropagationFn(context, ...p) {
		if (typeof context.obj2[context.defaultTargetMethodName] == 'function')
			return context.obj2[context.defaultTargetMethodName](...p);
		else if (typeof context.obj2.onDepChanged == 'function')
			return context.obj2.onDepChanged({obj:context.obj1,channel:context.channel}, ...p)
		else
			return this.fire(context.obj2, ...p);
	}

	// This handles the case when an object is passed to add() as the propagationFn parameter. It takes the object as a parameter and
	// and returns the propagation function that reflects the specifications provided in that that object.
	// This is th WIP. It is anticipated that debouncing and other common behaviors will be supportted.
	// Params:
	//    <node1>  : the DependentsNode structure representing the source object of the change propagation
	//    <node2>  : the DependentsNode structure representing the destination object of the change propagation
	//    <params> : a variable type parameter that is used to specify the PropagationFn for this particular node1->node2 relationship
	// Properties Supported in <params> Parameter:
	//    (function) : if <params> is of type function, it is returned untouched. The caller can set the .destroy() method on the
	//               function object. If passed in the propagationFn property, then any property set on the fn object will be lost.
	//    .propagationFn : if specicified, this value will be used at the PropagationFn and wrapped in a generated fn that may
	//               implement other features. The difference between this and passing the fn as params itself is that there is an
	//               opportunity to activate other features in conjunction with the params.propagationFn behavior.
	//    .debounce : (integer) this will cause the PropagationFn to be wrapped in a debouncer. A value of 0 or null will result in
	//               the default value of 500 (ms) being used. Otherwise its value should be the number of ms that the PropagationFn
	//               will be invoked after the last change happens.  This is done last so the PropagationFn that gets called after
	//               the timeout will be what ever the other properties result in.
	//    .onDestroy : (function) this function will be invoked when the relationship is removed.
	createPropagationFn(cnode1, onode2, params) {
		var fn = (...p)=>{this.defaultPropagationFn({obj1:cnode1.obj1,obj2:onode2.obj,defaultTargetMethodName:cnode1.defaultTargetMethodName}, ...p)};
		if (params) switch (typeof params) {
			case 'function' : return params;
			case 'object'   :

				if (params.propagationFn)
					fn = (...p)=>params.propagationFn(...p);

				if (typeof params.debounce != "undefined") {
					let timeout;
					fn = (...p)=>{
						clearTimeout(timeout);
						timeout = setTimeout(()=>{fn(...p)}, params.debounce || 500);
					}
				}
				break;
		}
		return fn;
	}
}


DependentsGraph.instance = new DependentsGraph();
if (typeof global.bg == 'undefined') global.bg = Object.create(null)
global.bg.DependentsGraph = DependentsGraph;

// since DependentsGraph is a very common api, we create a global shortcut so that we can access it more tersely;
global.deps = DependentsGraph.instance;
