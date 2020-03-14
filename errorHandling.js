'use babel';

export class AssertError extends Error {
	constructor(msg, context) {
console.log(msg);
		super(msg);
		this.context = context;
		Error.captureStackTrace(this, AssertError.constructor);
		// this.captureStackTrace()
		console.trace(msg);
		console.log(context);
	}
}


// https://www.geeksforgeeks.org/how-to-get-javascript-stack-trace-when-throw-an-exception/
//  console.trace('sum called with ', a, 'and', b);
//  console.log(new Error().stack); 
// // Stacktrace function  
// function stacktrace() { 
//   function st2(f) { 
//     var args = []; 
//     if (f) { 
//         for (var i = 0; i < f.arguments.length; i++) { 
//             args.push(f.arguments[i]); 
//         } 
//         var function_name = f.toString(). 
//         split('(')[0].substring(9); 
//         return st2(f.caller) + function_name +  
//         '(' + args.join(', ') + ')' + "\n"; 
//     } else { 
//         return ""; 
//     } 
//   } 
//   return st2(arguments.callee.caller); 
// } 
