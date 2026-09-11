export const Formats: import('../sim/dex-formats').FormatList = [

	{
		section: "Champions",
	},

	{
		name: "[Gen 9 Champions] VGC Clash-Draft",
		mod: "champions",
		gameType: "doubles",
		team: "random",

		ruleset: [
			"Flat Rules",
			"VGC Timer",
			"Force Open Team Sheets",
		],

		searchShow: true,
		challengeShow: true,
		tournamentShow: true,
		rated: false,
	},

];