(function ($) {

	$.qjax = function( o ) {
		var opt = $.extend( {
				timeout: null,
				onStart: null,
				onStop: null,
				onError: null,
				onTimeout: null,
				onQueueChange: null,
				queueChangeDelay: 0,
				ajaxSettings: {
					contentType: 'application/x-www-form-urlencoded; charset=UTF-8',
					type: 'GET'
				}
			}, o ), _queue = [], _currentReq = null, _timeoutRef = null, _this = this, _started = false,

			TriggerStartEvent = function() {
				if ( !_started ) {
					_started = true;
					//If we have a timeout handler, a timeout interval, and we have at least one thing in the queue...
					if ( opt.onTimeout && opt.timeout && $.isFunction( opt.onTimeout ) ) {
						//Kill the old timeout handle
						if ( _timeoutRef ) {
							clearTimeout( _timeoutRef );
						}
						//Create a new timeout, that calls the event when elapsed.
						_timeoutRef = setTimeout( $.proxy( function() {
							opt.onTimeout.call( this, _currentReq.options );
						}, this ), opt.timeout );
					}
					//If we have an onStart handler, call it.
					if ( opt.onStart && $.isFunction( opt.onStart ) ) {
						opt.onStart( this, _currentReq.options );
					}
				}
			},
			TriggerStopEvent = function() {
				//If we've started, and the queue is empty...
				if ( _started && _queue.length <= 0 ) {
					_started = false;
					if ( _timeoutRef ) {
						clearTimeout( _timeoutRef );
					}
					//Mark as stopped, and fire the onStop handler if possible.
					if ( opt.onStop && $.isFunction( opt.onStop ) ) {
						opt.onStop( this, _currentReq.options );
					}
				}
			},
			TriggerQueueChange = function() {
				if ( opt.onQueueChange ) {
					opt.onQueueChange.call( _this, _queue.length );
				}
				//Only start a new request if we have at least one, and another isn't in progress.
				if ( _queue.length >= 1 && !_currentReq ) {
					//Pull off the next request.
					_currentReq = _queue.shift();
					if ( _currentReq.options.isCallback ) {
						//It's a queued function... just call it.
						_currentReq.options.complete();
					} else {
						//Create the new ajax request, and assign any promise events.
						TriggerStartEvent();
						var request = $.ajax( _currentReq.options );
						for ( var i in _currentReq.promise ) {
							for ( var x in _currentReq.promise[i] ) {
								request[i].call( this, _currentReq.promise[i][x] );
							}
						}
					}
				}
			};

		var QueueObject = function( options, complete, context ) {
			this.options = options;
			this.complete = complete;
			this.context = context;
			this.promise = {done: [], then: [], always: [], fail: []};
		};
		QueueObject.prototype._promise = function( n, h ) {
			if ( this.promise[n] ) {
				this.promise[n].push( h );
			}
			return this;
		};
		QueueObject.prototype.done = function( handler ) {
			return this._promise( 'done', handler );
		};
		QueueObject.prototype.then = function( handler ) {
			return this._promise( 'then', handler );
		};
		QueueObject.prototype.always = function( handler ) {
			return this._promise( 'always', handler );
		};
		QueueObject.prototype.fail = function( handler ) {
			return this._promise( 'fail', handler );
		};

		this.Clear = function() {
			_queue = [];
		};
		this.Queue = function( obj, thisArg ) {
			var _o = {}, origComplete = null;
			if ( obj instanceof Function ) {
				//If the obj var is a function, set the options to reflect that, and set the origComplete var to the passed function.
				_o = {isCallback: true};
				origComplete = obj;
			} else {
				//The obj is an object of ajax settings. Extend the options with the instance ones, and store the complete function.
				_o = $.extend( {}, opt.ajaxSettings, obj || {} );
				origComplete = _o.complete;
			}
			//Create our own custom complete handler...
			_o.complete = function( request, status ) {
				if ( status == 'error' && opt.onError && $.isFunction( opt.onError ) ) {
					opt.onError.call( _currentReq.context || this, request, status );
				}
				if ( _currentReq ) {
					if ( _currentReq.complete ) {
						_currentReq.complete.call( _currentReq.context || this, request, status );
					}
					TriggerStopEvent();
					_currentReq = null;
					TriggerQueueChange();
				}
			};
			//Push the queue object into the queue, and notify the user that the queue length changed.
			var obj = new QueueObject( _o, origComplete, thisArg );
			_queue.push( obj );
			setTimeout( TriggerQueueChange, opt.queueChangeDelay );
			return obj;
		};
		return this;
	};

	var stepNumber = 0;
	var numberOfSteps = 30;
	var $result = $('#stepped-importer-results');
	var this_data = {};

	var qInst = $.qjax( {
		timeout: 5000,
		ajaxSettings: {
			type: "POST",
			url: ajaxurl
		},
		onQueueChange: function( length ) {

			if ( length == 0 ) {
				if ( res.errors == false ) {

					setTimeout( function() {
						$result.append( '<i>Done</i><br />' );
					}, 1000 );

					setTimeout( function() {
						$result.append( '<h3>Hello</p>' );
					}, 1000 );

				} else {
					setTimeout( function() {
						$result.append( '<i>Failed</i><br />' );
					}, 1000 );
				}
			}
		},
		onError: function() {
			//stop everything on error
			if ( res.errors != null && res.errors != false ) {
				qInst.Clear();
			}
		},
		onStart: function() {
		},
		onStop: function() {
			//stop everything on error
			if ( res.errors != null && res.errors != false ) {
				qInst.Clear();
			}
		}
	} );

	function ajax_import_posts_pages_stepped() {
		//add to queue the calls to import the posts, pages, custom posts, etc
		stepNumber = 0;
		while ( stepNumber < numberOfSteps ) {
			stepNumber++;
			qInst.Queue( {
					type: "POST",
					url: ajaxurl,
					data: {
						action: 'stepped_import',
						step_number: stepNumber,
						number_of_steps: numberOfSteps
					}
				} )
				.fail( function( response ) {
					$result.append( '<i style="color:red">Failed</i><br />' );
				} )
				.done( function( response ) {
					$result.append( '<i style="color:red">'+ response +'</i><br />' );
				} );
		}
	}

	$(document).ready(function () {
		$('#stepped_importer_trigger').on('click', function () {
			ajax_import_posts_pages_stepped()
		});
	});
})(jQuery);