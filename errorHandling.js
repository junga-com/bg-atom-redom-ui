'use babel';

export class AssertError extends Error {
	constructor(message, context) {
		super(message);
		this.context = context;
		Error.captureStackTrace(this, AssertError.constructor);
		// this.captureStackTrace()
		console.trace();
	}
}
