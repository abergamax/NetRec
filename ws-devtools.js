console.log("hello from devtools");
chrome.devtools.panels.create(
	"Webstats", // title
	"record.png", // icon
	"ws-panel.html", // html file for panel
	function(panel) { console.log("hello from webstats panel callback"); } // callback fired when panel is created
);