import type {PokemonSet} from '../../sim/teams';
import {Teams} from '../../sim/teams';
import {
	type DraftPack,
	getDraftPack,
	getDraftPacks,
} from '../../config/draft-packs';

const DRAFT_FORMAT = 'gen9championsvgcclashdraft';
const DRAFT_ROUND_TIME = 30_000;
const COIN_REVEAL_DELAY = 1600;
const COIN_RESULT_DURATION = 2500;
const FINAL_DRAFT_DELAY = 1000;
const DRAFT_RECONNECT_GRACE = 3 * 60 * 1000;

interface DraftSession {
	id: string;

	p1: User;
	p2: User;

	p1Pack: DraftPack | null;
	p2Pack: DraftPack | null;

	selectedPack: DraftPack | null;

	phase:
	| 'pack-selection'
	| 'coin-toss'
	| 'drafting'
	| 'complete'
	| 'forfeited';

	coinTossWinner: 'p1' | 'p2' | null;
	coinTossRevealed: boolean;

	round: number;
	roundDeadline: number | null;
	roundTimer: NodeJS.Timeout | null;

	p1Connected: boolean;
	p2Connected: boolean;

	p1DisconnectDeadline: number | null;
	p2DisconnectDeadline: number | null;

	p1DisconnectTimer: NodeJS.Timeout | null;
	p2DisconnectTimer: NodeJS.Timeout | null;

	roundTimeRemaining: number | null;

	finalBattleTimer: NodeJS.Timeout | null;

	//full team,including both chosen and recieved
	p1Team: PokemonSet[];
	p2Team: PokemonSet[];

	//only chosen mons
	p1ChosenTeam: PokemonSet[];
	p2ChosenTeam: PokemonSet[];

	// Pokémon that have not been offered yet
	remainingPokemon: PokemonSet[];

	// Current round's choices
	p1Offer: [PokemonSet, PokemonSet] | null;
	p2Offer: [PokemonSet, PokemonSet] | null;

	p1Choice: 0 | 1 | null;
	p2Choice: 0 | 1 | null;

}


/**
 * Every currently active draft.
 */
const draftSessions = new Map<string, DraftSession>();


/**
 * Allows us to quickly find which draft a player is currently in.
 *
 * user.id -> session.id
 */
const userDraftSessions = new Map<ID, string>();

// challenger -> challenged player
const outgoingDraftChallenges = new Map<ID, ID>();

// challenged player -> everyone challenging them
const incomingDraftChallenges = new Map<ID, Set<ID>>();

//Match making queue shit
const draftMatchmakingQueue = new Set<ID>();


function createDraftSession(
	p1: User,
	p2: User,
): DraftSession {

	const id = `${p1.id}-${p2.id}-${Date.now()}`;

	const session: DraftSession = {
		id,

		p1,
		p2,

		p1Pack: null,
		p2Pack: null,

		selectedPack: null,

		phase: "pack-selection",

		coinTossWinner: null,
		coinTossRevealed: false,

		round: 0,
		roundDeadline: null,
		roundTimer: null,

		p1Connected: true,
		p2Connected: true,

		p1DisconnectDeadline: null,
		p2DisconnectDeadline: null,

		p1DisconnectTimer: null,
		p2DisconnectTimer: null,

		roundTimeRemaining: null,

		finalBattleTimer: null,

		p1Team: [],
		p2Team: [],

		p1ChosenTeam: [],
		p2ChosenTeam: [],

		remainingPokemon: [],

		p1Offer: null,
		p2Offer: null,

		p1Choice: null,
		p2Choice: null,
	};

	draftSessions.set(id, session);

	userDraftSessions.set(p1.id, id);
	userDraftSessions.set(p2.id, id);

	sendDraftStateToBoth(session, true);
	
	return session;
}

function generateDraftRound(session: DraftSession): void {

	if (!session.selectedPack) {
		throw new Error(
			`Cannot generate a draft round before selecting a pack.`
		);
	}

	if (session.remainingPokemon.length < 4) {
		throw new Error(
			`Not enough Pokémon remain in ${session.selectedPack.name}.`
		);
	}

	const pokemon1 = takeRandomPokemon(
		session.remainingPokemon
	);

	const pokemon2 = takeRandomPokemon(
		session.remainingPokemon
	);

	const pokemon3 = takeRandomPokemon(
		session.remainingPokemon
	);

	const pokemon4 = takeRandomPokemon(
		session.remainingPokemon
	);


	session.p1Offer = [
		pokemon1,
		pokemon2,
	];

	session.p2Offer = [
		pokemon3,
		pokemon4,
	];

	session.round++;
	startDraftTimer(session);
}

function getUserDraftSession(user: User): DraftSession | null {

	const sessionID = userDraftSessions.get(user.id);

	if (!sessionID) return null;

	return draftSessions.get(sessionID) ?? null;
}

function performCoinToss(
	session: DraftSession
): User {

	if (
		!session.p1Pack ||
		!session.p2Pack
	) {
		throw new Error(
			`Cannot perform coin toss before both players select packs.`
		);
	}

	const p1Wins =
		Math.random() < 0.5;

	if (p1Wins) {

		session.coinTossWinner = 'p1';
		session.selectedPack =
			session.p1Pack;

	} else {

		session.coinTossWinner = 'p2';
		session.selectedPack =
			session.p2Pack;
	}

	session.remainingPokemon = [
		...session.selectedPack.pokemon
	];

	return p1Wins
		? session.p1
		: session.p2;
}

function beginCoinToss(
	session: DraftSession
): void {

	session.phase = 'coin-toss';
	session.coinTossRevealed = false;

	/*
	 * Server determines the result immediately,
	 * but the client isn't told yet.
	 */
	performCoinToss(session);

	/*
	 * Send initial coin-toss state.
	 * Winner is still hidden.
	 */
	sendDraftStateToBoth(session);


	/*
	 * Reveal the winning pack after the coin
	 * has had time to animate.
	 */
	setTimeout(() => {

		if (session.phase !== 'coin-toss') {
			return;
		}

		session.coinTossRevealed = true;

		sendDraftStateToBoth(session);


		/*
		 * Leave the result visible for a while
		 * before starting Round 1.
		 */
		setTimeout(() => {

			if (session.phase !== 'coin-toss') {
				return;
			}

			session.phase = 'drafting';

			generateDraftRound(session);

			sendDraftStateToBoth(session);

		}, COIN_RESULT_DURATION);


	}, COIN_REVEAL_DELAY);
}

function takeRandomPokemon(
	pokemon: PokemonSet[]
): PokemonSet {

	const index = Math.floor(
		Math.random() * pokemon.length
	);

	const [selected] = pokemon.splice(index, 1);

	return selected;
}

function resolveDraftRound(session: DraftSession): void {

	if (!session.p1Connected || !session.p2Connected) return;

	if (session.roundTimer) {
		clearTimeout(session.roundTimer);
		session.roundTimer = null;
	}

	session.roundDeadline = null;
	session.roundTimeRemaining = null;
	
	if (
		!session.p1Offer ||
		!session.p2Offer ||
		session.p1Choice === null ||
		session.p2Choice === null
	) {
		throw new Error(
			`Cannot resolve draft round before both players have chosen.`
		);
	}


	const p1Choice = session.p1Choice;
	const p2Choice = session.p2Choice;


	// What each player chose to KEEP
	const p1Kept = session.p1Offer[p1Choice];
	const p2Kept = session.p2Offer[p2Choice];


	// The other Pokémon gets SENT to the opponent
	const p1Sent = session.p1Offer[1 - p1Choice];
	const p2Sent = session.p2Offer[1 - p2Choice];


	//P1's chosen mon added to list
	session.p1ChosenTeam.push(p1Kept);

	// P1 keeps their choice and receives P2's rejected Pokémon
	session.p1Team.push(
		p1Kept,
		p2Sent
	);

	//P2's chosen mon added to list
	session.p2ChosenTeam.push(p2Kept);

	// P2 keeps their choice and receives P1's rejected Pokémon
	session.p2Team.push(
		p2Kept,
		p1Sent
	);


	// Clear the current round
	session.p1Offer = null;
	session.p2Offer = null;

	session.p1Choice = null;
	session.p2Choice = null;


	// Start another round if needed
	if (session.round < 3) {
		generateDraftRound(session);

		sendDraftStateToBoth(session);
	}
	else{
		session.phase = 'complete';

		/*
		* Send the completed draft state first.
		*
		* This lets the player actually see their
		* third chosen Pokémon appear.
		*/
		sendDraftStateToBoth(session);


		scheduleDraftBattleStart(session);
	}
}

function startDraftBattle(session: DraftSession): void {

	if (session.p1Team.length !== 6 || session.p2Team.length !== 6) {
		throw new Error(
			`Cannot start draft battle: both players must have 6 Pokémon.`
		);
	}


	// Convert PokemonSet[] into Showdown's packed team format
	const p1Team = Teams.pack(session.p1Team);
	const p2Team = Teams.pack(session.p2Team);


	const battleRoom = Rooms.createBattle({
		format: DRAFT_FORMAT,

		players: [
			{
				user: session.p1,
				team: p1Team,
			},

			{
				user: session.p2,
				team: p2Team,
			},
		],

		rated: false,
	});


	// Rooms.createBattle can return null if the server
	// is currently preventing new battles.
	if (!battleRoom) {
		session.p1.popup(
			`The battle could not be created.`
		);

		session.p2.popup(
			`The battle could not be created.`
		);

		return;
	}

	// Always run the timer for Clash Draft battles so an abandoned
	// battle cannot remain open forever.
	battleRoom.battle?.startTimer();

	// The draft is finished now.
	closeDraftPanel(
		session,
		session.p1
	);

	closeDraftPanel(
		session,
		session.p2
	);

	cleanupDraftSession(session);
}

function cleanupDraftSession(session: DraftSession): void {

	if (session.roundTimer) {
		clearTimeout(session.roundTimer);
		session.roundTimer = null;
	}

	if (session.p1DisconnectTimer) {
		clearTimeout(session.p1DisconnectTimer);
		session.p1DisconnectTimer = null;
	}

	if (session.p2DisconnectTimer) {
		clearTimeout(session.p2DisconnectTimer);
		session.p2DisconnectTimer = null;
	}

	if (session.finalBattleTimer) {
		clearTimeout(session.finalBattleTimer);
		session.finalBattleTimer = null;
	}

	draftSessions.delete(session.id);

	userDraftSessions.delete(session.p1.id);
	userDraftSessions.delete(session.p2.id);
}

function startDraftTimer(
	session: DraftSession,
	duration: number = DRAFT_ROUND_TIME
): void {
	if (session.roundTimer) {
		clearTimeout(session.roundTimer);
		session.roundTimer = null;
	}

	session.roundDeadline = null;

	// Do not run the draft timer while either player is disconnected.
	if (!session.p1Connected || !session.p2Connected) {
		session.roundTimeRemaining = duration;
		return;
	}

	session.roundTimeRemaining = null;
	session.roundDeadline = Date.now() + duration;

	session.roundTimer = setTimeout(() => {
		session.roundTimer = null;
		session.roundDeadline = null;

		if (session.phase !== 'drafting') return;

		// Defensive check. This should normally already have been
		// paused by the disconnect handler.
		if (!session.p1Connected || !session.p2Connected) return;

		if (session.p1Choice === null) {
			session.p1Choice = Math.random() < 0.5 ? 0 : 1;
		}

		if (session.p2Choice === null) {
			session.p2Choice = Math.random() < 0.5 ? 0 : 1;
		}

		resolveDraftRound(session);
	}, duration);
}

function pauseDraftTimer(session: DraftSession): void {
	if (session.roundDeadline !== null) {
		session.roundTimeRemaining = Math.max(
			0,
			session.roundDeadline - Date.now()
		);
	}

	if (session.roundTimer) {
		clearTimeout(session.roundTimer);
		session.roundTimer = null;
	}

	session.roundDeadline = null;
}

function getDraftRoomID(session: DraftSession): RoomID {
	return `clashdraft-${session.id}` as RoomID;
}

function getPlayerDraftState(
	session: DraftSession,
	user: User
) {
	const isP1 = user === session.p1;

	const yourPack = isP1
		? session.p1Pack
		: session.p2Pack;

	const opponentPack = isP1
		? session.p2Pack
		: session.p1Pack;

	const offer = isP1
		? session.p1Offer
		: session.p2Offer;

	const chosenTeam = isP1
		? session.p1ChosenTeam
		: session.p2ChosenTeam;

	const choice = isP1
		? session.p1Choice
		: session.p2Choice;

	return {
		phase: session.phase,

		opponentName: isP1
			? session.p2.name
			: session.p1.name,

		opponentAvatar: isP1
			? String(session.p2.avatar)
			: String(session.p1.avatar),

		availablePacks: getDraftPacks().map(pack => ({
			id: pack.id,
			name: pack.name,
			description: pack.description ?? '',
		})),

		yourPack: yourPack
			? {
				id: yourPack.id,
				name: yourPack.name,
			}
			: null,

		/*
		 * During pack selection we DON'T reveal which
		 * pack the opponent picked.
		 */
		opponentHasChosenPack:
			opponentPack !== null,

		opponentPackName:
			session.phase !== 'pack-selection'
				? opponentPack?.name ?? null
				: null,

		selectedPackName:
			session.phase === 'coin-toss' &&
			!session.coinTossRevealed
				? null
				: session.selectedPack?.name ?? null,

		coinTossWinner:
			session.coinTossRevealed
				? session.coinTossWinner
				: null,

		round: session.round,

		offer,
		chosenTeam,

		hasChosen:
			choice !== null,
		
		currentChoice: choice,

		roundDeadline:
			session.roundDeadline,
	};
}

function getDraftSide(
	session: DraftSession,
	user: User
): 'p1' | 'p2' | null {
	if (session.p1.id === user.id) return 'p1';
	if (session.p2.id === user.id) return 'p2';

	return null;
}

function handleDraftDisconnect(
	session: DraftSession,
	user: User
): void {
	if (session.phase === 'forfeited') return;

	const side = getDraftSide(session, user);
	if (!side) return;

	// -------------------------
	// Mark player disconnected
	// and begin their grace timer
	// -------------------------

	if (side === 'p1') {
		// Prevent accidentally starting two disconnect timers.
		if (!session.p1Connected) return;

		session.p1Connected = false;
		session.p1DisconnectDeadline =
			Date.now() + DRAFT_RECONNECT_GRACE;

		if (session.p1DisconnectTimer) {
			clearTimeout(session.p1DisconnectTimer);
		}

		session.p1DisconnectTimer = setTimeout(() => {
			session.p1DisconnectTimer = null;

			// Session may already have ended normally.
			if (!draftSessions.has(session.id)) return;

			// Player came back before the grace period ended.
			if (session.p1Connected) return;

			forfeitDraft(
				session,
				session.p1
			);
		}, DRAFT_RECONNECT_GRACE);

	} else {
		if (!session.p2Connected) return;

		session.p2Connected = false;
		session.p2DisconnectDeadline =
			Date.now() + DRAFT_RECONNECT_GRACE;

		if (session.p2DisconnectTimer) {
			clearTimeout(session.p2DisconnectTimer);
		}

		session.p2DisconnectTimer = setTimeout(() => {
			session.p2DisconnectTimer = null;

			if (!draftSessions.has(session.id)) return;

			if (session.p2Connected) return;

			forfeitDraft(
				session,
				session.p2
			);
		}, DRAFT_RECONNECT_GRACE);
	}


	// -------------------------
	// Pause active draft timer
	// -------------------------

	if (session.phase === 'drafting') {
		pauseDraftTimer(session);
	}


	// -------------------------
	// Don't start the battle
	// while somebody is offline
	// -------------------------

	if (session.finalBattleTimer) {
		clearTimeout(session.finalBattleTimer);
		session.finalBattleTimer = null;
	}


	// Update whoever is still connected.
	sendDraftStateToBoth(session);
}

function handleDraftReconnect(
	session: DraftSession,
	user: User
): void {
	if (session.phase === 'forfeited') return;

	const side = getDraftSide(session, user);
	if (!side) return;

	if (side === 'p1') {
		session.p1Connected = true;
		session.p1DisconnectDeadline = null;

		if (session.p1DisconnectTimer) {
			clearTimeout(session.p1DisconnectTimer);
			session.p1DisconnectTimer = null;
		}
	} else {
		session.p2Connected = true;
		session.p2DisconnectDeadline = null;

		if (session.p2DisconnectTimer) {
			clearTimeout(session.p2DisconnectTimer);
			session.p2DisconnectTimer = null;
		}
	}

	/*
	 * This is the important part for browser refreshes.
	 *
	 * The browser has lost the synthetic clashdraft-* room entirely,
	 * so send a fresh |init| and the current server-authoritative state.
	 */
	sendDraftState(session, user, true);

	const bothConnected =
		session.p1Connected &&
		session.p2Connected;

	if (!bothConnected) {
		sendDraftStateToBoth(session);
		return;
	}

	if (session.phase === 'drafting') {
		/*
		 * It's possible both players had already clicked before one
		 * disconnected. Resolve immediately once both are back.
		 */
		if (
			session.p1Choice !== null &&
			session.p2Choice !== null
		) {
			resolveDraftRound(session);
			return;
		}

		const remaining =
			session.roundTimeRemaining ??
			DRAFT_ROUND_TIME;

		startDraftTimer(session, remaining);
		sendDraftStateToBoth(session);
		return;
	}

	if (session.phase === 'complete') {
		scheduleDraftBattleStart(session);
		return;
	}

	sendDraftStateToBoth(session);
}

function sendDraftState(
	session: DraftSession,
	user: User,
	init = false
): void {

	const roomID = getDraftRoomID(session);

	const state = getPlayerDraftState(
		session,
		user
	);

	const lines: string[] = [];

	if (init) {
		lines.push(
			`|init|clashdraft`,
			`|title|VGC Clash Draft`
		);
	}

	lines.push(
		`|draftstate|${JSON.stringify(state)}`
	);

	user.send(
		`>${roomID}\n${lines.join('\n')}`
	);
}

function sendDraftStateToBoth(
	session: DraftSession,
	init = false
): void {

	sendDraftState(
		session,
		session.p1,
		init
	);

	sendDraftState(
		session,
		session.p2,
		init
	);
}

function closeDraftPanel(
	session: DraftSession,
	user: User
): void {
	user.send(
		`>${getDraftRoomID(session)}\n|deinit|`
	);
}

function forfeitDraft(
	session: DraftSession,
	loser: User
): void {

	const winner =
		loser === session.p1
			? session.p2
			: session.p1;


	/*
	 * This is important because our delayed
	 * coin-toss/final-battle callbacks check phase.
	 */
	session.phase = 'forfeited';


	// Stop the active draft-round timer.
	if (session.roundTimer) {
		clearTimeout(session.roundTimer);
		session.roundTimer = null;
	}

	session.roundDeadline = null;


	loser.popup(
		`You forfeited the Clash Draft against ${winner.name}.`
	);

	winner.popup(
		`${loser.name} forfeited the Clash Draft. You win!`
	);


	// Ensure both draft panels disappear.
	closeDraftPanel(session, session.p1);
	closeDraftPanel(session, session.p2);


	cleanupDraftSession(session);
}

function addDraftChallenge(
	challenger: User,
	target: User
): void {
	outgoingDraftChallenges.set(
		challenger.id,
		target.id
	);

	let incoming =
		incomingDraftChallenges.get(target.id);

	if (!incoming) {
		incoming = new Set<ID>();

		incomingDraftChallenges.set(
			target.id,
			incoming
		);
	}

	incoming.add(challenger.id);
}

function removeDraftChallenge(
	challengerID: ID,
	targetID: ID
): void {
	outgoingDraftChallenges.delete(
		challengerID
	);

	const incoming =
		incomingDraftChallenges.get(targetID);

	if (!incoming) return;

	incoming.delete(challengerID);

	if (!incoming.size) {
		incomingDraftChallenges.delete(
			targetID
		);
	}
}

function removeFromDraftQueue(user: User): void {
	draftMatchmakingQueue.delete(user.id);
}

function findDraftOpponent(user: User): User | null {

	for (const userid of draftMatchmakingQueue) {

		if (userid === user.id) continue;

		const opponent = Users.get(userid);

		if (!opponent || !opponent.connected) {
			draftMatchmakingQueue.delete(userid);
			continue;
		}

		if (getUserDraftSession(opponent)) {
			draftMatchmakingQueue.delete(userid);
			continue;
		}

		return opponent;
	}

	return null;
}

function scheduleDraftBattleStart(
	session: DraftSession
): void {
	if (session.finalBattleTimer) {
		clearTimeout(session.finalBattleTimer);
		session.finalBattleTimer = null;
	}

	if (session.phase !== 'complete') return;

	if (!session.p1Connected || !session.p2Connected) {
		return;
	}

	session.finalBattleTimer = setTimeout(() => {
		session.finalBattleTimer = null;

		if (session.phase !== 'complete') return;
		if (!session.p1Connected || !session.p2Connected) return;

		startDraftBattle(session);
	}, FINAL_DRAFT_DELAY);
}

function clearDraftChallengesForUser(user: User): void {
	// This user challenged somebody else.
	const challengedID = outgoingDraftChallenges.get(user.id);

	if (challengedID) {
		outgoingDraftChallenges.delete(user.id);

		const incoming =
			incomingDraftChallenges.get(challengedID);

		if (incoming) {
			incoming.delete(user.id);

			if (!incoming.size) {
				incomingDraftChallenges.delete(challengedID);
			}
		}

		const challengedUser = Users.get(challengedID);

		if (challengedUser?.connected) {
			challengedUser.send(
				`|draftchallengecancelled|${user.name}`
			);
		}
	}

	// Other people challenged this user.
	const challengers =
		incomingDraftChallenges.get(user.id);

	if (challengers) {
		for (const challengerID of challengers) {
			outgoingDraftChallenges.delete(challengerID);

			const challenger = Users.get(challengerID);

			if (challenger?.connected) {
				challenger.send(
					`|draftchallengecancelled|${user.name}`
				);
			}
		}

		incomingDraftChallenges.delete(user.id);
	}
}

export const commands: Chat.ChatCommands = {

	draftpick(target, room, user) {

		const session = getUserDraftSession(user);

		if (!session) {
			return this.errorReply(
				`You are not currently in a draft.`
			);
		}


		// -------------------------
		// Validate choice
		// -------------------------

		const choiceNumber = Number(target.trim());

		if (choiceNumber !== 1 && choiceNumber !== 2) {
			return this.errorReply(
				`Usage: /draftpick 1 or /draftpick 2`
			);
		}


		// Internally we use array indexes 0 and 1.
		const choice = (choiceNumber - 1) as 0 | 1;


		// -------------------------
		// Player 1
		// -------------------------

		if (user === session.p1) {

			if (!session.p1Offer) {
				return this.errorReply(
					`You currently have no Pokémon to choose from.`
				);
			}

			if (session.p1Choice !== null) {
				return this.errorReply(
					`You have already made your choice this round.`
				);
			}


			session.p1Choice = choice;

			this.sendReply(
				`You selected ${session.p1Offer[choice].species}.`
			);
			
			sendDraftStateToBoth(session);
		}


		// -------------------------
		// Player 2
		// -------------------------

		else if (user === session.p2) {

			if (!session.p2Offer) {
				return this.errorReply(
					`You currently have no Pokémon to choose from.`
				);
			}

			if (session.p2Choice !== null) {
				return this.errorReply(
					`You have already made your choice this round.`
				);
			}


			session.p2Choice = choice;

			this.sendReply(
				`You selected ${session.p2Offer[choice].species}.`
			);

			sendDraftStateToBoth(session);

		}


		// Should theoretically never happen.
		else {
			return this.errorReply(
				`You are not a player in this draft.`
			);
		}


		// -------------------------
		// Wait for both players
		// -------------------------

		if (
			session.p1Choice === null ||
			session.p2Choice === null
		) {
			return this.sendReply(
				`Waiting for the other player to make their choice.`
			);
		}

		if (!session.p1Connected || !session.p2Connected) {
			return;
		}
		// -------------------------
		// Resolve round
		// -------------------------

		const finishedRound = session.round;

		resolveDraftRound(session);


		if (finishedRound >= 3) {
			this.sendReply(
				`Draft complete!`
			);
		} else {
			this.sendReply(
				`Round ${finishedRound} complete. Round ${session.round} has started.`
			);
		}
	},

	draftpack(target, room, user) {
		const session = getUserDraftSession(user);

		if (!session) {
			return this.errorReply(
				`You are not currently in a draft.`
			);
		}

		if (session.phase !== 'pack-selection') {
			return this.errorReply(
				`Pack selection has already ended.`
			);
		}

		const pack = getDraftPack(target.trim());

		if (!pack) {
			return this.errorReply(
				`Draft pack "${target.trim()}" does not exist.`
			);
		}

		if (user === session.p1) {

			if (session.p1Pack) {
				return this.errorReply(
					`You have already selected a pack.`
				);
			}

			session.p1Pack = pack;

		} else if (user === session.p2) {

			if (session.p2Pack) {
				return this.errorReply(
					`You have already selected a pack.`
				);
			}

			session.p2Pack = pack;

		} else {
			return this.errorReply(
				`You are not part of this draft.`
			);
		}

		sendDraftStateToBoth(session);

		/*
		* Only proceed once BOTH players have chosen.
		*/
		if (
			session.p1Pack &&
			session.p2Pack
		) {
			beginCoinToss(session);
		}
	},

	draftforfeit(target, room, user) {

		const session = getUserDraftSession(user);

		/*
		* Keep this silent.
		*
		* A stale client could theoretically send this
		* after the battle has already started.
		*/
		if (!session) return;

		forfeitDraft(
			session,
			user
		);
	},

	draftchallenge(target, room, user) {

		const opponentName = target.trim();

		if (!opponentName) {
			return this.errorReply(
				`Usage: /draftchallenge [username]`
			);
		}


		const opponent = Users.get(opponentName);

		if (!opponent || !opponent.connected) {
			return this.errorReply(
				`"${opponentName}" is not online.`
			);
		}


		if (opponent === user) {
			return this.errorReply(
				`You cannot challenge yourself.`
			);
		}


		if (getUserDraftSession(user)) {
			return this.errorReply(
				`You are already in a draft.`
			);
		}


		if (getUserDraftSession(opponent)) {
			return this.errorReply(
				`${opponent.name} is already in a draft.`
			);
		}


		if (outgoingDraftChallenges.has(user.id)) {
			return this.errorReply(
				`You already have an outgoing Clash Draft challenge.`
			);
		}


		const incoming =
			incomingDraftChallenges.get(opponent.id);

		if (incoming?.has(user.id)) {
			return this.errorReply(
				`You have already challenged ${opponent.name}.`
			);
		}


		addDraftChallenge(
			user,
			opponent
		);

		user.send(
			`|draftchallengesent|${opponent.name}`
		);

		/*
		* Custom global protocol message.
		* We'll make the client show Accept / Reject.
		*/
		opponent.send(
			`|draftchallenge|${user.name}`
		);


		this.sendReply(
			`You challenged ${opponent.name} to a VGC Clash Draft.`
		);
	},

	draftaccept(target, room, user) {

		const challengerName = target.trim();

		const challenger =
			Users.get(challengerName);

		if (!challenger) {
			return this.errorReply(
				`That player could not be found.`
			);
		}


		const incoming =
			incomingDraftChallenges.get(user.id);


		if (!incoming?.has(challenger.id)) {
			return this.errorReply(
				`You do not have a Clash Draft challenge from ${challenger.name}.`
			);
		}


		if (!challenger.connected) {

			removeDraftChallenge(
				challenger.id,
				user.id
			);

			return this.errorReply(
				`${challenger.name} is no longer online.`
			);
		}


		if (
			getUserDraftSession(user) ||
			getUserDraftSession(challenger)
		) {

			removeDraftChallenge(
				challenger.id,
				user.id
			);

			return this.errorReply(
				`One of the players is already in a draft.`
			);
		}


		removeDraftChallenge(
			challenger.id,
			user.id
		);


		challenger.send(
			`|draftchallengeaccepted|${user.name}`
		);
		/*
		* THIS replaces /draftstart.
		*/
		createDraftSession(
			challenger,
			user
		);
	},

	draftreject(target, room, user) {

		const challengerName =
			target.trim();

		const challenger =
			Users.get(challengerName);


		if (!challenger) {
			return this.errorReply(
				`That player could not be found.`
			);
		}


		const incoming =
			incomingDraftChallenges.get(user.id);


		if (!incoming?.has(challenger.id)) {
			return this.errorReply(
				`You do not have a Clash Draft challenge from ${challenger.name}.`
			);
		}


		removeDraftChallenge(
			challenger.id,
			user.id
		);


		challenger.send(
			`|draftchallengerejected|${user.name}`
		);
	},

	draftcancel(target, room, user) {

		const targetID =
			outgoingDraftChallenges.get(user.id);

		if (!targetID) {
			return this.errorReply(
				`You do not have an outgoing Clash Draft challenge.`
			);
		}


		const opponent =
			Users.get(targetID);


		removeDraftChallenge(
			user.id,
			targetID
		);

		user.send(
			`|draftchallengecleared|`
		);


		if (opponent) {
			opponent.send(
				`|draftchallengecancelled|${user.name}`
			);
		}


		this.sendReply(
			`Your Clash Draft challenge was cancelled.`
		);
	},

	draftsearch(target, room, user) {

		if (getUserDraftSession(user)) {
			return this.errorReply(
				`You are already in a Clash Draft.`
			);
		}

		if (draftMatchmakingQueue.has(user.id)) {
			return this.errorReply(
				`You are already searching for a Clash Draft.`
			);
		}


		const opponent = findDraftOpponent(user);


		/*
		* Nobody available yet.
		*/
		if (!opponent) {

			draftMatchmakingQueue.add(user.id);

			user.send(
				`|draftsearch|1`
			);

			return;
		}


		/*
		* We found someone.
		*/
		removeFromDraftQueue(opponent);


		user.send(
			`|draftsearch|0`
		);

		opponent.send(
			`|draftsearch|0`
		);


		createDraftSession(
			opponent,
			user
		);
	},

	draftcancelsearch(target, room, user) {

		if (!draftMatchmakingQueue.has(user.id)) {
			return;
		}

		removeFromDraftQueue(user);

		user.send(
			`|draftsearch|0`
		);
	},

	draftpickhelp: [
		`/draftpick [1 or 2] - Selects which offered Pokémon you want to keep.`,
	],

	draftpackhelp: [
		`/draftpack [pack] - Selects your Clash Draft pack.`,
	],

};

export const handlers = {
	onDisconnect(user: User) {
		// Never leave disconnected players sitting in matchmaking.
		removeFromDraftQueue(user);

		// Pending direct challenges are not persistent sessions.
		clearDraftChallengesForUser(user);

		const session = getUserDraftSession(user);

		if (session) {
			handleDraftDisconnect(session, user);
		}
	},
};

export function loginfilter(
	user: User,
	oldUser: User | null,
	userType: string
): void {
	/*
	 * oldUser exists when Showdown has merged the newly connected
	 * Guest into an existing username.
	 */
	if (!oldUser) return;

	const session = getUserDraftSession(user);

	if (!session) return;

	handleDraftReconnect(session, user);
}

