(function($) {
	var cloud_xvelocity_min = 10; // px pr sec
	var cloud_xvelocity_max = 30; // px pr sec
	var cloud_update_delay = 100; // ms pr update
	var egg_rotation = 360; // deg pr sec
	var egg_update_delay = 10; // ms pr update
	
	var methods = {
		init: function(options) {
			var defaults = {
				n: 5
			}; //default options
			var options = $.extend(defaults, options);
			return $(this).each(function() {
				with({$this:$(this)}) {
					// Insert n levels ...
					$levelContainer = $this.find(".skyscraper-levels");
					$levelContainer.empty();
					for(var l = 0; l < options.n; l++) {
						$level = $("<div class='skyscraper-level'></div>");
						$level.data('l', options.n-l-1);
						$level.appendTo($levelContainer);
					}
					
					// Updates the position of all clouds, later on
					var cloudsInterval = setInterval(function(){
						$this.find(".cloud").droppingEggs("updateClouds");
					}, cloud_update_delay);
					// Remember the interval used to update clouds
					$this.data("cloudsInterval", cloudsInterval);
					// Initalizes all clouds
					$this.find(".cloud").droppingEggs("updateClouds");
					
					$levels = $this.find(".skyscraper-level");
					$levels.live("click", function(){
						var egg = $this.data('egg');
						if(typeof egg === 'undefined' || egg === null) {
							// Spawn egg
							egg = $("<div class='egg'></div>").hide().appendTo($this);
							egg.fadeIn('fast');
							console.log("Throwing ",egg," from ",this);

							egg.data("level", $(this));
							egg.data("body", $this);
							var updateInterval = setInterval(function(){
								egg.droppingEggs("updateEgg");
							}, egg_update_delay);
							egg.data("updateInterval", updateInterval);
							egg.droppingEggs("updateEgg");
							
							$this.data('egg', egg);
						} else {
							console.log("Cannot throw egg from ",this," as we already have an egg in the air");
						}
					});
					
					var criticalLevel = Math.floor(Math.random()*(options.n-1));
					console.log("Pst.. Critical level is "+criticalLevel);
					$this.data('criticalLevel', criticalLevel);
				}
			}).droppingEggs('resized');
		},
		resized: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					// ..
				}
			}).droppingEggs('updateBars');
		},
		updateBars: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					$bestLevel = $this.data('bestLevel');
					$worstLevel = $this.data('worstLevel');
					// Hide the bars
					if($bestLevel === undefined || $bestLevel === null) {
						$(".bar.green", $this).hide();
					} else {
						$(".bar.green", $this).css('top', $bestLevel.offset().top).fadeIn('fast');
					}

					if($worstLevel === undefined || $worstLevel === null) {
						$(".bar.red", $this).hide();
					} else {
						$(".bar.red", $this).css('height', $worstLevel.offset().top + $worstLevel.outerHeight()).fadeIn('fast');
					}

				}
			});
		},
		updateClouds: function() {
			return $(this).each(function() {
				var $this = $(this);
				var minx = -$this.width();
				var maxx = $this.parent().width();
				var miny = 0;
				var maxy = 100;
				//console.log(minx, maxx);
				if($this.data("initialized") === true) {
					// Update position
					var xvelocity = $this.data("xvelocity");
					var newx = parseInt($this.css("left")) + cloud_update_delay*xvelocity/1000;
					if(newx > maxx) {
						// Reinitalize next time.
						$this.css("left", minx);
						$this.css("top", Math.random()*(maxy-miny) + miny);
						$this.data("xvelocity", Math.random()*(cloud_xvelocity_max-cloud_xvelocity_min) + cloud_xvelocity_min);
					} else {
						$this.css("left", newx);
					}
				} else {
					// Initialize
					$this.css("left", Math.random()*(maxx-minx) + minx);
					$this.css("top", Math.random()*(maxy-miny) + miny);
					$this.data("xvelocity", Math.random()*(cloud_xvelocity_max-cloud_xvelocity_min) + cloud_xvelocity_min);
					$this.data("initialized",true);
				}
			});
		},
		updateEgg: function() {
			return $(this).each(function() {
				var $this = $(this);
				var $body = $this.data('body');
				var $level = $this.data('level');
				var motion;
				if($this.data("flying") === true) {
					motion = $this.data("motion");
					var t = motion.t();
					if(!motion.hasCollided(t)) {
						var p = motion.p(t);
						//console.log(p.x, p.y);
					} else {
						// Impact!
						console.log("Boom!");
						// Did it crack?
						if($level.data('l') > $body.data('criticalLevel')) {
							// Yes
							console.log("Cracked!");
							$this.addClass('cracked');
							$body.data('worstLevel', $level);
							$body.droppingEggs('updateBars');
							// Set the red bar to this level.
						} else {
							// No
							console.log("It didn't crack!");
							$body.data('bestLevel', $level);
							$body.droppingEggs('updateBars');
						}
						// Clear interval
						clearInterval($this.data("updateInterval"));
						$this.data("flying", false);
						// Fade out
						$this.fadeOut('slow');
						// Get ready for the next egg.
						$body.data('egg', null);
					}
				} else {
					$this.data("rotation", 0.0);
					// Calculate the eggs motion constants.
					motion = {
						p1: { // Initial position
							x: $level.offset().left+$level.innerWidth(),
							y: $body.innerHeight() - $level.offset().top - $level.innerHeight()/2
						},
						p2: { // Position at impact
							x: $body.innerWidth()/2, // In the middle of the screen
							y: $this.outerHeight()/2
						},
						v1: { // Initial velocity
							x:0.0, // Unknown for the moment
							y:200.0
						},
						a: { // Constant acceleration
							x:0.0,
							//y:-9.82 // Gravity is a bitch.
							y:-1000.0 // Gravity is a bitch.
						},
						p: function(t) { // Calculate the position at time t
							return {
								x: this.p1.x + this.v1.x * t + 0.5*this.a.x*Math.pow(t,2),
								y: this.p1.y + this.v1.y * t + 0.5*this.a.y*Math.pow(t,2)
							};
						},
						T: function() { // Calculate the time on impact (y = 0)
							/*
							//(-1.*v1y+sqrt(v1y^2-2.*ay*p1y))/ay, -(1.*(v1y+sqrt(v1y^2-2.*ay*p1y)))/ay
							var t1 = (-this.v1.y + Math.sqrt(Math.pow(this.v1.y, 2) - 2*this.a.y+this.p1.y))/this.a.y;
							var t2 = -(this.v1.y + Math.sqrt(Math.pow(this.v1.y, 2) - 2*this.a.y+this.p1.y))/this.a.y;
							*/
							//(-1.*v1y+sqrt(v1y^2-2.*ay*p1y+2.*ay*p2y))/ay, -(1.*(v1y+sqrt(v1y^2-2.*ay*p1y+2.*ay*p2y)))/ay
							var t1 = (-1.*this.v1.y+Math.sqrt(Math.pow(this.v1.y,2)-2.*this.a.y*this.p1.y+2.*this.a.y*this.p2.y))/this.a.y;
							var t2 = -(1.*(this.v1.y+Math.sqrt(Math.pow(this.v1.y,2)-2.*this.a.y*this.p1.y+2.*this.a.y*this.p2.y)))/this.a.y;
							
							if(t1 >= 0) {
								return t1;
							} else {
								return t2;
							}
						},
						calculateInitialVelocity: function() { // Calculate the x component of the initial velocity
							var T = this.T();
							this.v1.x = (this.p2.x - this.p1.x - 0.5*this.a.x*Math.pow(T,2))/T;
						},
						t1: new Date(),
						t: function() {
							return ((new Date()) - this.t1) / 1000.0;
						},
						hasCollided: function(t) {
							var p = this.p(t);
							return (this.p2.y > p.y);
						},
						rotation: function(t) {
							return egg_rotation*t;
						}
					};
					
					motion.calculateInitialVelocity();
					
					$this.data("motion", motion);
					$this.data("flying", true);
				}
				var t = motion.t();
				var rotation = Math.round(motion.rotation(t));
				var p = motion.p(t);
				var left = Math.round(p.x)-$this.outerWidth()/2;
				var top = $body.innerHeight()-Math.round(p.y)-$this.outerHeight()/2;
				
				// Update dom
				$this.css("-webkit-transform", "rotate("+rotation+"deg)");
				$this.css("left", left);
				$this.css("top", top);
			});
		}
	};
	
	$.fn.droppingEggs = function(method) {
		if(methods[method]) {
			return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
		} else if ( typeof method === "object" || ! method ) {
			return methods.init.apply( this, arguments );
		} else {
			$.error("Method " +  method + " does not exist on jQuery.droppingEggs" );
		}   
	};
})(jQuery);