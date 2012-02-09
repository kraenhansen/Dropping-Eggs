(function($) {
	$.fn.droppingEggs = function() {
		$(this).each(function(){
			var page = $(".ui-page", this);
			//console.log(page);
			page.append(this.sky);
		});
	};
})(jQuery);