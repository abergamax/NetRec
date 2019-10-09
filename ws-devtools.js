console.log("ws-devtools.js");
chrome.devtools.panels.create(
	"Webstats", // title
	"record.png", // icon
	"ws-panel.html", // html file for panel
	function(panel) { console.log("webstats panel callback"); } // callback fired when panel is created
);