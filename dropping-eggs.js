(function($) {
	var cloud_xvelocity_min = 50; // px pr sec
	var cloud_xvelocity_max = 200; // px pr sec
	var cloud_update_delay = 50; // ms pr update
	var egg_rotation = 360; // deg pr sec
	var egg_update_delay = 10; // ms pr update
	
	var methods = {
		init: function(options) {
			var defaults = {
				n: 20,
				eggs: 2
			}; //default options
			var options = $.extend(defaults, options);
			return $(this).each(function() {
				with({$this:$(this)}) {
					$this.data('options', options); // Remember the initial options.
					
					// Insert n levels ...
					$levelContainer = $this.find(".skyscraper-levels");
					$levelContainer.empty();
					for(var l = 0; l < options.n; l++) {
						$level = $("<div class='skyscraper-level'>"+(options.n-l)+"</div>");
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

					$scrollableWorld = $this.find(".scrollable-view");

					/*
					$scrollableContainer.parent().bind('scrollstop', function(e) {
						console.log(e);
					});
					*/
					
					$levels = $this.find(".skyscraper-level");
					$levels.live("click", function(){
						var egg = $this.data('egg');
						if(typeof egg === 'undefined' || egg === null) {
							// Spawn egg
							egg = $("<div class='egg'></div>").hide().appendTo($scrollableWorld);
							egg.show();
							console.log("Throwing ",egg," from ",this);

							egg.data("level", $(this));
							egg.data("body", $this);
							egg.data("scrollableWorld", $scrollableWorld);
							var updateInterval = setInterval(function(){
								egg.droppingEggs("updateEgg");
							}, egg_update_delay);
							egg.data("updateInterval", updateInterval);
							egg.droppingEggs("updateEgg");

							$this.data('tries', $this.data('tries') + 1);
							$this.droppingEggs("updateHID");
							
							$this.data("egg", egg);
						} else {
							console.log("Cannot throw egg from ",this," as we already have an egg in the air");
						}
					});
					
					$this.droppingEggs("gameover");
					
					$this.find(".startButton").live('click', function() {
						$this.droppingEggs("start");
					});
					
					// Initialize the scrollview
					var skyscraperHeight = $(".skyscraper").innerHeight();
					$(".moveable-view").css('height', skyscraperHeight);
					
					/*
					var criticalLevel = Math.round(Math.random()*(options.n));
					//var criticalLevel = 0;
					//var criticalLevel = options.n;
					console.log("Pst.. Critical level is "+criticalLevel);
					$this.data('criticalLevel', criticalLevel);
					*/
				}
			}).droppingEggs('resized');
		},
		resized: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					// Adjust the body height to fit everything ..
					//$this.css('min-height', 10000);
					/*
					var skyscraperHeight = $this.find('.skyscraper').outerHeight();
					$this.css('min-height', skyscraperHeight);
					*/
					//console.log($this.find('.skyscraper').offset());
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
						var top = $bestLevel.position().top+$bestLevel.parent().position().top+$bestLevel.parent().parent().position().top;
						$(".bar.green", $this).css('top', top).fadeIn('fast');
					}

					if($worstLevel === undefined || $worstLevel === null) {
						$(".bar.red", $this).hide();
					} else {
						//var top = $worstLevel.position().top + $worstLevel.parent().position().top + $worstLevel.parent().parent().position().top + $worstLevel.parent().parent().parent().position().top;
						var top = $worstLevel.position().top + $worstLevel.parent().position().top + $worstLevel.parent().parent().position().top;
						$(".bar.red", $this).css('height', top + $worstLevel.outerHeight(true)).fadeIn('fast');
					}
				}
			});
		},
		updateClouds: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					var minLeft = -$this.width();
					var maxLeft = $this.parent().width();
					var minTop = 0;
					var maxTop = $this.parent().height()/2-$this.height();
					if($this.data("initialized") === true) {
						if(parseInt($this.css("left")) < maxLeft) {
							// Update position
							$this.data("left", $this.data("left") + cloud_update_delay*$this.data("xvelocity")/1000);
						} else {
							// Initialize
							$this.data("left", minLeft);
							$this.data("top", Math.random()*(maxTop-minTop) + minTop);
							$this.data("xvelocity", Math.random()*(cloud_xvelocity_max-cloud_xvelocity_min) + cloud_xvelocity_min);
						}
					} else {
						$this.data("left", Math.random()*(maxLeft-minLeft) + minLeft);
						$this.data("top", Math.random()*(maxTop-minTop) + minTop);
						$this.data("xvelocity", Math.random()*(cloud_xvelocity_max-cloud_xvelocity_min) + cloud_xvelocity_min);
						$this.data("initialized",true);
					}
					$this.css("left", Math.round($this.data("left")));
					$this.css("top", Math.round($this.data("top")));
				}
			});
		},
		updateEgg: function() {
			return $(this).each(function() {
				with({$this:$(this), $body:$(this).data('body'), $scrollableWorld:$(this).data('scrollableWorld'), $scrollableView:$(this).data('scrollableWorld').parent(), $level:$(this).data('level')}) {
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
							// Stop the sound
							$body.find("#sound-air").get(0).pause();
							// Reload to rewind
							$body.find("#sound-air").get(0).load();
							// Did it crack?
							if($level.data('l') >= $body.data('criticalLevel')) {
								// Yes
								console.log("Cracked!");
								$this.addClass('cracked');
								$body.data('worstLevel', $level);
								$body.data('eggsUsed', $body.data('eggsUsed') + 1);
								$body.find(".yoak").fadeTo('fast', $body.data('eggsUsed')/$body.data('options').eggs);
								$body.droppingEggs('updateHID');
								// Set the red bar to this level.
								// Make some noise.
								$body.find("#sound-impact-crack").get(0).play();
							} else {
								// No
								console.log("It didn't crack!");
								$body.data('bestLevel', $level);
								// Make some noise.
								$body.find("#sound-impact-normal").get(0).play();
							}
							// Clear interval
							clearInterval($this.data("updateInterval"));
							// We are not flying anymore ..
							$this.data("flying", false);
							// Update the bars.
							$body.droppingEggs('updateBars');
							// Fade out
							$this.fadeOut(500, function() {
								// Delete the egg...
								$(this).remove();
								// Check for "win" condition
								$body.droppingEggs('checkWinCondition');
								// Get ready for the next egg.
								$body.data('egg', null);
								// Scroll to the previous position
								//$scrollableView.scrollview('scrollTo', $body.data("scrollPosition").x, $body.data("scrollPosition").y, 1000);
							});
						}
					} else {
						$this.data("rotation", 0.0);
						var leveltop = $level.position().top + $level.parent().position().top + $level.parent().parent().position().top;
						// Calculate the eggs motion constants.
						motion = {
							p1: { // Initial position
								x: $level.position().left+$level.innerWidth(),
								y: $scrollableWorld.innerHeight() - leveltop - $level.outerHeight(true)/2
							},
							p2: { // Position at impact
								x: $scrollableWorld.innerWidth()/2, // In the middle of the screen
								y: $scrollableWorld.find(".ground").outerHeight()/2
							},
							v1: { // Initial velocity
								x:0.0, // Unknown for the moment
								y:200.0
								//y:0.0
							},
							a: { // Constant acceleration
								x:0.0,
								//y:-9.82 // Gravity is a bitch.
								y:-1000.0 // Gravity is a bitch.
							},
							p: function(t) { // Calculate the position at time t
								if(this.hasCollided(t)) {
									return this.p2;
								} else {
									return {
										x: this.p1.x + this.v1.x * t + 0.5*this.a.x*Math.pow(t,2),
										y: this.p1.y + this.v1.y * t + 0.5*this.a.y*Math.pow(t,2)
									};
								}
							},
							T: function() { // Calculate the time on impact (y = 0)
								//(-1.*v1y+sqrt(v1y^2-2.*ay*p1y))/ay, -(1.*(v1y+sqrt(v1y^2-2.*ay*p1y)))/ay
								//var t1 = (-this.v1.y + Math.sqrt(Math.pow(this.v1.y, 2) - 2*this.a.y+this.p1.y))/this.a.y;
								//var t2 = -(this.v1.y + Math.sqrt(Math.pow(this.v1.y, 2) - 2*this.a.y+this.p1.y))/this.a.y;
								
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
								/*
								var p = this.p(t);
								return (this.p2.y > p.y);
								*/
								return t >= this.T();
							},
							rotation: function(t) {
								return egg_rotation*t;
							}
						};
						
						motion.calculateInitialVelocity();
						
						$this.data("motion", motion);
						// Play sounds
						$body.find("#sound-air").get(0).play();
						//$this.data("air-sound").play();
						// Scrolling when throwing an egg.
						/*
						$body.data("scrollPosition", $scrollableView.scrollview('getScrollPosition'));
						// Scroll to bottom, take as long as it takes to drop the egg.
						//$scrollableView.scrollview('scrollTo', 0, $scrollableView.innerHeight()-$scrollableWorld.innerHeight(), motion.T());
						// Wait 0.5 sec before following the egg.
						setTimeout(function() {
							// Scroll to ground, fast enough.
							$scrollableView.scrollview('scrollTo', 0, $scrollableWorld.innerHeight()-$scrollableView.innerHeight(), Math.max(motion.T()*1000-500, 0));
						},500);
						*/
						$this.data("flying", true);
					}
					var t = motion.t();
					var rotation = Math.round(motion.rotation(t));
					var p = motion.p(t);
					var left = Math.round(p.x)-$this.outerWidth()/2;
					var top = $scrollableWorld.innerHeight()-Math.round(p.y)-$this.outerHeight()/2;
					
					// Update dom
					$this.css("-webkit-transform", "rotate("+rotation+"deg)");
					$this.css("left", left);
					$this.css("top", top);
					
					//console.log(top);
					// Scroll to egg..
					if($this.data("flying") === true) {
						// We are in the air
						/*
						var scrollTop = -top+$scrollableView.innerHeight()/2; // The egg in the center ...
						console.log($scrollableView.innerHeight()/2 - $scrollableWorld.innerHeight(), scrollTop);
						scrollTop = Math.max($scrollableView.innerHeight() - $scrollableWorld.innerHeight(), scrollTop);
						scrollTop = Math.min(0, scrollTop);
						*/
					} else {
						//$scrollableView.scrollview('scrollTo', $this.data("scrollPosition").x, $this.data("scrollPosition").y, 1000);
					}
				}
			});
		},
		checkWinCondition: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					var worstLevelNumber = undefined;
					if($this.data('worstLevel') !== undefined && $this.data('worstLevel') !== null) {
						worstLevelNumber = $this.data('worstLevel').data('l');
					}
					var bestLevelNumber = undefined;
					if($this.data('bestLevel') !== undefined && $this.data('bestLevel') !== null) {
						bestLevelNumber = $this.data('bestLevel').data('l');
					}
					var highestLevelL = $this.data('options').n - 1;
					if(worstLevelNumber === 0 || bestLevelNumber === highestLevelL || worstLevelNumber-bestLevelNumber <= 1) {
						//alert("You found the critical level!");
						$this.droppingEggs('gameover', false, $this.data('tries'), $this.data('eggsUsed'));
					} else if($this.data('eggsUsed') >= $this.data('options').eggs) {
						// We havn't won, but we have used all the eggs.
						$this.droppingEggs('gameover', true, $this.data('tries'), $this.data('eggsUsed'));
					}
					console.log("eggsUsed: ", $this.data('eggsUsed'), "tries: " + $this.data('tries'));
				}
			});
		},
		gameover: function(failed, tries, eggsCracked) {
			return $(this).each(function() {
				with({$this:$(this)}) {
					$this.find(".text").hide();
					if(failed === false && eggsCracked === 0) {
						$this.find(".text.wintext-1").show();
					} else if(failed === false && eggsCracked !== 0) {
						$this.find(".text.wintext-2").show();
					} else if(failed === true) {
						$this.find(".text.failtext").show();
					} else {
						$this.find(".text.starttext").show();
					}
					
					if(failed === false && tries > 6) {
						$this.find(".egg-hint").fadeIn('slow');
					} else {
						$this.find(".egg-hint").hide();
					}
					if(tries !== undefined) {
						$this.find(".tries-label").text(tries);
					}
					if(eggsCracked !== undefined) {
						$this.find(".eggs-label").text(eggsCracked);
					}
					$this.find(".modal-shadow").fadeIn();
				}
			});
		},
		start: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					$this.find(".modal-shadow").hide();
					var criticalLevel = Math.floor(Math.random()*($this.data("options").n+1));
					if(Math.random() > 0.66) {
						// With 1/3 chance, make the criticalLevel the worst case.
						criticalLevel = $this.data("options").n-1;
					}
					//var criticalLevel = 0;
					//var criticalLevel = options.n;
					console.log("Pst.. Critical level is "+criticalLevel);
					$this.data('criticalLevel', criticalLevel);
					$this.data('eggsUsed', 0);
					$this.data('tries', 0);
					$this.data('worstLevel', null);
					$this.data('bestLevel', null);
					// Whipe up yoak
					$this.find(".yoak").hide();
					$this.droppingEggs('updateBars');
					$this.droppingEggs("updateHID");
				}
			});
		},
		updateHID: function() {
			return $(this).each(function() {
				with({$this:$(this)}) {
					var $hid = $this.find(".hid");
					if($this.data("tries") > 6) {
						$hid.addClass("bad");
					} else {
						$hid.removeClass("bad");
					}
					$hid.find(".hid-eggs-thrown").text($this.data("tries"));
					$hid.find(".hid-eggs-used").text($this.data("eggsUsed"));
					$hid.find(".hid-eggs-total").text($this.data("options").eggs);
				}
			});
		},
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
