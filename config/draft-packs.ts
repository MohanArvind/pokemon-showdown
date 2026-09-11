import {Teams} from '../sim/teams';
import type {PokemonSet} from '../sim/teams';
import {toID} from '../sim/dex';

/**
 * Finds a draft pack from either its ID or a user-entered version
 * of its name.
 *
 * Examples:
 *
 * getDraftPack("testpack")
 * getDraftPack("Test Pack")
 *
 * Both resolve to the same pack.
 */
export function getDraftPack(packName: string): DraftPack | null {
	const id = toID(packName);

	return DraftPacks[id] ?? null;
}
 

/**
 * Returns every available pack.
 *
 * Useful later when creating the pack-selection UI.
 */
export function getDraftPacks(): DraftPack[] {
	return Object.values(DraftPacks);
}

export interface DraftPack {
	id: string;
	name: string;
	description?: string;

	pokemon: PokemonSet[];
}

export const DraftPacks: Record<string, DraftPack> = {

/*	testpack: {
		id: 'testpack',
		name: 'Test Pack',
		description: 'Temporary pack used while developing the draft system.',

		pokemon: Teams.import(`

Floette-Eternal @ Floettite
Ability: Flower Veil
Level: 50
Timid Nature
- Moonblast
- Dazzling Gleam
- Light of Ruin
- Protect

Garchomp @ Leftovers
Ability: Rough Skin
Level: 50
Jolly Nature
- Earthquake
- Dragon Claw
- Swords Dance
- Protect

Raichu @ Raichunite Y  
Ability: Lightning Rod  
Level: 50  
Modest Nature  
- Protect  
- Zap Cannon  
- Focus Blast  
- Fake Out  

Basculegion (M) @ Mystic Water  
Ability: Adaptability  
Level: 50  
Adamant Nature  
- Protect  
- Wave Crash  
- Last Respects  
- Aqua Jet  

Whimsicott @ Focus Sash  
Ability: Prankster  
Level: 50    
Timid Nature  
- Protect  
- Moonblast  
- Tailwind  
- Encore  

Gholdengo @ Life Orb  
Ability: Good as Gold  
Level: 50  
Modest Nature  
- Protect  
- Make It Rain  
- Nasty Plot  
- Shadow Ball  

Staraptor @ Staraptite  
Ability: Intimidate  
Level: 50  
Jolly Nature  
- Brave Bird  
- Close Combat  
- Roost  
- Protect  

Typhlosion-Hisui @ Choice Scarf  
Ability: Frisk  
Level: 50  
Modest Nature  
- Eruption  
- Heat Wave  
- Burn Up  
- Shadow Ball  

Grimmsnarl (M) @ Roseli Berry  
Ability: Prankster  
Level: 50  
Careful Nature  
- Fake Tears  
- Spirit Break  
- Parting Shot  
- Scary Face  

Incineroar @ Sitrus Berry  
Ability: Intimidate  
Level: 50  
Sassy Nature  
- Fake Out  
- Parting Shot  
- Flare Blitz  
- Throat Chop  

Sinistcha @ Kasib Berry  
Ability: Hospitality  
Level: 50  
Calm Nature  
- Matcha Gotcha  
- Strength Sap  
- Rage Powder  
- Trick Room  

Sneasler @ Focus Sash  
Ability: Poison Touch  
Level: 50  
Jolly Nature  
- Protect  
- Dire Claw  
- Close Combat  
- Fake Out  
					`)!,
	},*/

	//add new packs here
	worldspack2026: {
		id: 'worldspack2026',
		name: "World's Pack",
		description: 'Made with sets of all unique mons from top teams from Worlds 2026.',

		pokemon: Teams.import(`

Floette-Eternal @ Floettite  
Ability: Flower Veil  
Timid Nature  
- Moonblast  
- Dazzling Gleam  
- Light of Ruin  
- Protect  

Basculegion @ Life Orb  
Ability: Adaptability  
Adamant Nature  
- Wave Crash  
- Last Respects  
- Aqua Jet  
- Protect  

Kingambit @ Chople Berry  
Ability: Defiant  
Adamant Nature  
- Sucker Punch  
- Kowtow Cleave  
- Low Kick  
- Iron Head  

Dragonite @ Dragoninite  
Ability: Multiscale  
Modest Nature  
- Dragon Pulse  
- Heat Wave  
- Extreme Speed  
- Protect  

Sneasler @ Focus Sash  
Ability: Poison Touch  
Jolly Nature  
- Close Combat  
- Dire Claw  
- Fake Out  
- Feint  

Garchomp @ Sitrus Berry  
Ability: Rough Skin  
Jolly Nature  
- Dragon Claw  
- Earthquake  
- Rock Slide  
- Protect  

Charizard @ Charizardite Y  
Ability: Blaze  
Timid Nature  
- Heat Wave  
- Weather Ball  
- Ancient Power  
- Protect  

Whimsicott @ Focus Sash  
Ability: Prankster  
Timid Nature  
- Moonblast  
- Tailwind  
- Encore  
- Protect  

Froslass @ Froslassite  
Ability: Cursed Body  
Timid Nature  
- Blizzard  
- Shadow Ball  
- Aurora Veil  
- Protect  

Lycanroc-Dusk @ Focus Sash  
Ability: Tough Claws  
Adamant Nature  
- Rock Slide  
- Close Combat  
- Accelerock  
- Protect  

Scovillain @ Scovillainite  
Ability: Moody  
Bold Nature  
- Overheat  
- Giga Drain  
- Rage Powder  
- Protect  

Incineroar @ Sitrus Berry  
Ability: Intimidate  
Impish Nature  
- Fake Out  
- Parting Shot  
- Flare Blitz  
- Protect  

Toxapex @ Leftovers  
Ability: Regenerator  
Relaxed Nature  
- Baneful Bunker  
- Infestation  
- Toxic  
- Wide Guard  

Venusaur @ Focus Sash  
Ability: Chlorophyll  
Modest Nature  
- Protect  
- Sludge Bomb  
- Earth Power  
- Sleep Powder  

Sylveon @ Fairy Feather  
Ability: Pixilate  
Quiet Nature  
- Detect  
- Hyper Voice  
- Quick Attack  
- Yawn  

Aerodactyl @ Aerodactylite  
Ability: Unnerve  
Jolly Nature  
- Rock Slide  
- Dual Wingbeat  
- Tailwind  
- Ice Fang  

Farigiraf @ Sitrus Berry  
Ability: Armor Tail  
Bold Nature  
- Psychic  
- Thunderbolt  
- Trick Room  
- Protect  

Arcanine-Hisui @ Focus Sash  
Ability: Rock Head  
Jolly Nature  
- Flare Blitz  
- Extreme Speed  
- Head Smash  
- Protect  

Staraptor @ Staraptite  
Ability: Intimidate  
Jolly Nature  
- Dual Wingbeat  
- Close Combat  
- Tailwind  
- Protect  

Raichu @ Raichunite Y  
Ability: Lightning Rod  
Timid Nature  
- Fake Out  
- Zap Cannon  
- Focus Blast  
- Protect  

Tsareena @ Focus Sash  
Ability: Queenly Majesty  
Jolly Nature  
- Power Whip  
- Triple Axel  
- Low Kick  
- Protect  

Sinistcha-Masterpiece @ Colbur Berry  
Ability: Hospitality  
Bold Nature  
- Matcha Gotcha  
- Rage Powder  
- Trick Room  
- Protect  

Blastoise @ Blastoisinite  
Ability: Rain Dish  
Modest Nature  
- Water Spout  
- Dark Pulse  
- Shell Smash  
- Protect  

Delphox @ Delphoxite  
Ability: Blaze  
Timid Nature  
- Heat Wave  
- Psychic  
- Nasty Plot  
- Protect  

Primarina @ Life Orb  
Ability: Liquid Voice  
Quiet Nature  
- Protect  
- Hyper Voice  
- Moonblast  
- Aqua Jet  

Torkoal @ Charcoal  
Ability: Drought  
Quiet Nature  
- Weather Ball  
- Helping Hand  
- Eruption  
- Protect  

Blaziken @ Blazikenite  
Ability: Speed Boost  
Adamant Nature  
- Flare Blitz  
- Close Combat  
- Rock Slide  
- Detect  

Kleavor @ Focus Sash  
Ability: Sharpness  
Adamant Nature  
- Protect  
- Stone Axe  
- X-Scissor  
- Feint  

Metagross @ Metagrossite  
Ability: Clear Body  
Jolly Nature  
- Protect  
- Iron Head  
- Psychic Fangs  
- Ice Punch  

Pelipper @ Sitrus Berry  
Ability: Drizzle  
Modest Nature  
- Hurricane  
- Weather Ball  
- Wide Guard  
- Tailwind  

Archaludon @ Leftovers  
Ability: Stamina  
Calm Nature  
- Protect  
- Dragon Pulse  
- Flash Cannon  
- Electro Shot  

Grimmsnarl @ Light Clay  
Ability: Prankster  
Sassy Nature  
- Light Screen  
- Spirit Break  
- Reflect  
- Parting Shot  

Swampert @ Swampertite  
Ability: Torrent  
Adamant Nature  
- Ice Punch  
- Wave Crash  
- Earthquake  
- Protect  

Camerupt @ Cameruptite  
Ability: Solid Rock  
Quiet Nature  
- Protect  
- Earth Power  
- Heat Wave  
- Ancient Power  

Kangaskhan @ Life Orb  
Ability: Scrappy  
Brave Nature  
- Double-Edge  
- Fake Out  
- Hammer Arm  
- Ice Punch  

Excadrill @ Focus Sash  
Ability: Sand Rush  
Adamant Nature  
- High Horsepower  
- Iron Head  
- Rock Slide  
- Protect  

Milotic @ Sitrus Berry  
Ability: Competitive  
Calm Nature  
- Scald  
- Ice Beam  
- Icy Wind  
- Protect  

Gholdengo @ Life Orb  
Ability: Good as Gold  
Modest Nature  
- Make It Rain  
- Shadow Ball  
- Nasty Plot  
- Protect  

Tyranitar @ Tyranitarite  
Ability: Sand Stream  
Jolly Nature  
- Rock Slide  
- Knock Off  
- Low Kick  
- Protect  

					`)!,
	},

	firewatergrass: {
		id: 'firewatergrass',
		name: 'Fire-Water-Grass Core',
		description: 'VGC Pros swear that having a fire-water-grass synergy is very good, so here you go.',

		pokemon: Teams.import(`

Blaziken-Mega @ Blazikenite  
Ability: Speed Boost  
- Protect  
- Coaching  
- Close Combat  
- Fire Blast  

Charizard-Mega-X @ Charizardite X  
Ability: Solar Power  
- Protect  
- Dragon Dance  
- Dragon Claw  
- Fire Punch  

Delphox-Mega @ Delphoxite  
Ability: Magician  
- Protect  
- Heat Wave  
- Nasty Plot  
- Dazzling Gleam  

Volcarona @ Life Orb  
Ability: Flame Body  
- Protect  
- Bug Buzz  
- Fiery Dance  
- Quiver Dance  

Talonflame @ Focus Sash  
Ability: Gale Wings  
- Protect  
- Tailwind  
- Brave Bird  
- Overheat  

Rotom-Heat @ Magnet  
Ability: Levitate  
- Protect  
- Volt Switch  
- Overheat  
- Thunderbolt  

Ninetales @ Heat Rock  
Ability: Drought  
- Protect  
- Energy Ball  
- Encore  
- Fire Blast  

Armarouge @ Focus Sash  
Ability: Flash Fire  
- Protect  
- Trick Room  
- Psychic  
- Armor Cannon  

Infernape @ Life Orb  
Ability: Iron Fist  
- Protect  
- Thunder Punch  
- Mach Punch  
- Fire Punch  

Arcanine @ Leftovers  
Ability: Intimidate  
- Protect  
- Will-O-Wisp  
- Temper Flare  
- Extreme Speed  

Venusaur-Mega @ Venusaurite  
Ability: Chlorophyll  
- Protect  
- Sleep Powder  
- Solar Beam  
- Sludge Bomb  

Abomasnow-Mega @ Abomasite  
Ability: Snow Warning  
- Substitute  
- Aurora Veil  
- Blizzard  
- Giga Drain  

Meganium-Mega @ Meganiumite  
Ability: Leaf Guard  
- Protect  
- Solar Beam  
- Weather Ball  
- Dazzling Gleam  

Meowscarada @ Life Orb  
Ability: Protean  
- Protect  
- Knock Off  
- Flower Trick  
- Acrobatics  

Tsareena @ White Herb  
Ability: Queenly Majesty  
- Protect  
- Trop Kick  
- Triple Axel  
- U-turn  

Hydrapple @ Rocky Helmet  
Ability: Regenerator  
- Protect  
- Fickle Beam  
- Body Press  
- Giga Drain  

Decidueye-Hisui @ Focus Sash  
Ability: Scrappy  
- Protect  
- Triple Arrows  
- Leaf Blade  
- Swords Dance  

Whimsicott @ Focus Sash  
Ability: Prankster  
- Protect  
- Tailwind  
- Moonblast  
- Encore  

Sinistcha-Masterpiece @ Leftovers  
Ability: Hospitality  
- Protect  
- Rage Powder  
- Matcha Gotcha  
- Shadow Ball  

Torterra @ White Herb  
Ability: Shell Armor  
- Protect  
- Shell Smash  
- Headlong Rush  
- Seed Bomb  

Blastoise-Mega @ Blastoisinite  
Ability: Rain Dish  
- Protect  
- Shell Smash  
- Water Spout  
- Dark Pulse  

Swampert-Mega @ Swampertite  
Ability: Damp  
- Protect  
- Yawn  
- Earthquake  
- Wave Crash  

Slowbro-Mega @ Slowbronite  
Ability: Shell Armor  
- Protect  
- Trick Room  
- Body Press  
- Psychic  

Politoed @ Damp Rock  
Ability: Drizzle  
- Protect  
- Weather Ball  
- Perish Song  
- Helping Hand  

Palafin @ Mystic Water  
Ability: Zero to Hero  
- Protect  
- Jet Punch  
- Wave Crash  
- Close Combat  

Araquanid @ Mystic Water  
Ability: Water Bubble  
- Protect  
- Liquidation  
- Sticky Web  
- Infestation  

Azumarill @ Life Orb  
Ability: Huge Power  
- Protect  
- Play Rough  
- Aqua Jet  
- Liquidation  

Tauros-Paldea-Aqua @ Sitrus Berry  
Ability: Cud Chew  
- Protect  
- Aqua Jet  
- Close Combat  
- Bulk Up  

Rotom-Wash @ Leftovers  
Ability: Levitate  
- Protect  
- Thunderbolt  
- Hydro Pump  
- Volt Switch  

Samurott-Hisui @ Life Orb  
Ability: Sharpness  
- Protect  
- Sacred Sword  
- Night Slash  
- Razor Shell  



					`)!,
	},

};


