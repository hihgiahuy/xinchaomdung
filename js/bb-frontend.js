(function () {
	var BBV = "2.0";
	var loadScript = function (url, callback) {
		var script = document.createElement("script");
		script.type = "text/javascript";
		if (script.readyState) { // IE
			script.onreadystatechange = function () {
				if (script.readyState == "loaded" ||
					script.readyState == "complete") {
					script.onreadystatechange = null;
					callback();
				}
			};
		} else { // Others
			script.onload = function () {
				callback();
			};
		}
		script.src = url;
		document.getElementsByTagName("head")[0].appendChild(script);
	};
	var getUrlParameter = function (sParam) {
		var sPageURL = decodeURIComponent(window.location.search.substring(1)),
			sURLVariables = sPageURL.split('&'),
			sParameterName,
			i;

		for (i = 0; i < sURLVariables.length; i++) {
			sParameterName = sURLVariables[i].split('=');

			if (sParameterName[0] === sParam) {
				return sParameterName[1] === undefined ? true : sParameterName[1];
			}
		}
	};
	var logError = function (e) {
		var url = "https://api.brandbassador.com/tracking/log?ref=" + getUrlParameter("ref") + "&host=" + encodeURIComponent(window.location.host) + "&error=" + encodeURIComponent(e);
		if ((typeof jQuery === 'undefined') || (parseFloat(jQuery.fn.jquery) < 1.7)) {
			loadScript('//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js', function () {
				jQuery191 = jQuery.noConflict(true);
				jQuery191.get(url);
			});
		} else {
			jQuery.get(url);
		}
	};
	var setRef = function () {
		try {
			var ref = getUrlParameter("ref");
			if (ref) {
				localStorage.setItem("bb-ref", ref);
			}
		} catch (e) {
			logError(e);
		}
	};
	setRef();
})();