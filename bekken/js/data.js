// Oefeningen, routines, weekschema en infoteksten.
// type 'timer' = tijd aanhouden (secs), type 'reps' = herhalingen (reps, tempo = seconden per herhaling).

export const GROEPEN = {
  reset: 'Reset & controle',
  kracht: 'Kracht',
  mobiliteit: 'Mobiliteit',
};

export const OEFENINGEN = {
  adem90: {
    naam: '90/90-ademhaling', emoji: '🌬️', groep: 'reset', type: 'timer', sets: 1, secs: 90, rest: 15,
    doel: 'Leert je ribben en bekken in een neutrale stand te zetten en activeert de diepe buikspieren. De basis van alle andere oefeningen.',
    stappen: [
      'Lig op je rug met je voeten op een stoel of tegen de muur, heupen en knieën ongeveer 90°.',
      'Adem rustig in door je neus: je onderste ribben zetten zijwaarts uit.',
      'Adem lang en volledig uit door je mond (6–8 sec) alsof je een ballon leegblaast. Je ribben zakken naar beneden en je onderrug wordt zacht plat.',
      'Hou de onderrug licht tegen de grond zonder te forceren.',
    ],
    tips: ['Leg een hand op je onderste ribben: voel ze zakken bij het uitademen.', 'Langer uit- dan inademen.'],
    fouten: ['Je borst omhoog laten komen', 'Je onderrug hard platdrukken'],
  },
  bekkenkanteling: {
    naam: 'Bekkenkanteling (liggend)', emoji: '🔄', groep: 'reset', type: 'reps', sets: 2, reps: 10, hold: 3, tempo: 6, rest: 30,
    doel: 'Leer het gevoel van een achterwaartse bekkenkanteling: het tegenovergestelde van je gewoonte.',
    stappen: [
      'Lig op je rug, knieën gebogen, voeten plat op de grond op heupbreedte.',
      'Adem uit en kantel je bekken zodat je staartbeen iets omhoog komt en je onderrug richting de grond gaat.',
      'Gebruik je buik en billen, niet je benen. Hou 3 seconden vast.',
      'Adem in en laat langzaam terugzakken naar neutraal (niet helemaal hol).',
    ],
    tips: ['Stel je voor dat je je broekriem naar je kin trekt.', 'Kleine, gecontroleerde beweging.'],
    fouten: ['Duwen met je voeten', 'Adem inhouden'],
    makkelijker: 'Geen houdtijd, alleen de beweging.',
  },
  heupflexor: {
    naam: 'Heupflexor-stretch knielend', emoji: '🧎', groep: 'reset', type: 'timer', sets: 2, secs: 40, perSide: true, rest: 15,
    doel: 'Rekt de heupbuigers (psoas/rectus femoris). Met achterwaartse kanteling werkt de stretch beter dan zonder.',
    stappen: [
      'Kniel op één knie (kussen eronder), de andere voet ver naar voren.',
      'Span de bil van het achterste been aan en kantel je bekken naar achter (staartbeen omlaag).',
      'Ribben omlaag, borst rechtop. Schuif nu heel klein stukje naar voren.',
      'Je voelt rek aan de voorkant van de heup van het achterste been. Adem rustig door.',
    ],
    tips: ['Voel je het in je onderrug? Dan kantel je niet genoeg of ga je te ver.', 'Zet je hand op de ribben om holle rug te voorkomen.'],
    fouten: ['Holle onderrug', 'Te ver naar voren schuiven'],
    makkelijker: 'Gebruik een stoel of muur voor steun.',
    moeilijker: 'Strek de arm aan de kant van het achterste been omhoog en leun licht weg.',
  },
  deadbug: {
    naam: 'Dead bug', emoji: '🪲', groep: 'reset', type: 'reps', sets: 2, reps: 8, tempo: 6, perSide: true, rest: 30,
    doel: 'Traint de buikspieren om het bekken stabiel te houden terwijl armen en benen bewegen (anti-extensie).',
    stappen: [
      'Lig op je rug, armen recht omhoog, heupen en knieën 90°. Onderrug zacht richting grond (bekken licht achterover).',
      'Adem uit en laat langzaam één been en de tegenovergestelde arm zakken naar de grond.',
      'Je onderrug blijft plat. Zodra ze omhoog willen komen, ga je minder ver.',
      'Terug naar start en wissel. "Per kant" = 8 herhalingen met dezelfde combinatie.',
    ],
    tips: ['Ga traag: 3 sec naar beneden.', 'Uitademen tijdens het zakken.'],
    fouten: ['Onderrug van de grond laten komen', 'Te snel bewegen'],
    makkelijker: 'Beweeg alleen de benen of alleen de armen.',
    moeilijker: 'Hou een licht gewicht of kussen vast tussen handen en knieën.',
  },
  bridge: {
    naam: 'Glute bridge', emoji: '🌉', groep: 'reset', type: 'reps', sets: 3, reps: 12, hold: 2, tempo: 5, rest: 30,
    doel: 'Versterkt de bilspieren, de belangrijkste tegenhangers van een te grote voorwaartse bekkenkanteling.',
    stappen: [
      'Lig op je rug, knieën gebogen, voeten onder je knieën, hielen dichtbij je billen.',
      'Kantel eerst je bekken licht achterover (ribben omlaag).',
      'Duw door je hielen en til je heupen tot je lichaam een rechte lijn is van knie tot schouder. Knijp je billen samen.',
      'Hou 2 seconden vast bovenaan, zak langzaam terug.',
    ],
    tips: ['Stop op heuphoogte: niet verder hol trekken.', 'Voel het in je billen, niet in je onderrug of achterkant bovenbeen.'],
    fouten: ['Onderrug hol trekken bovenaan', 'Knieën naar binnen laten vallen'],
    makkelijker: 'Zonder houdtijd.',
    moeilijker: 'Doe de beweging op één been, of leg gewicht op je heupen.',
  },
  plank: {
    naam: 'Plank (bekken achterover)', emoji: '📏', groep: 'reset', type: 'timer', sets: 3, secs: 20, rest: 30,
    doel: 'Bouwt controle over een neutraal bekken onder belasting. Kort en strak is beter dan lang en slap.',
    stappen: [
      'Steun op onderarmen en tenen, ellebogen onder de schouders.',
      'Kantel je bekken naar achter, span billen en buik zo hard je kunt aan.',
      'Duw de grond weg, ribben omlaag, lijn van hoofd tot hiel.',
      'Adem rustig door. Stop zodra je onderrug begint door te zakken.',
    ],
    tips: ['Een korte plank met maximale spanning is effectiever dan een lange slappe.'],
    fouten: ['Hangende onderrug', 'Billen te hoog'],
    makkelijker: 'Plank op de knieën.',
    moeilijker: 'Verleng naar 30–45 sec of til afwisselend een voet op.',
  },
  muurhouding: {
    naam: 'Muurhouding (staand)', emoji: '🧱', groep: 'reset', type: 'timer', sets: 2, secs: 45, rest: 15,
    doel: 'Vertaalt de oefeningen naar je staande houding en leert je lichaam wat "neutraal" is.',
    stappen: [
      'Sta met hielen, billen, schouderbladen en achterhoofd tegen de muur.',
      'Er hoort een handbreedte ruimte te zijn tussen onderrug en muur; als je hand er makkelijk doorheen kan, ga je te hol.',
      'Kantel je bekken tot je hand er net doorheen past, ribben omlaag, kin licht naar binnen.',
      'Hou vast en adem rustig. Stap weg en probeer de houding te behouden.',
    ],
    tips: ['Doe dit ook eens tussendoor bij het wachten of aan je bureau.'],
    fouten: ['Knieën helemaal op slot', 'Borst naar voren duwen'],
  },
  birddog: {
    naam: 'Bird dog', emoji: '🐕', groep: 'kracht', type: 'reps', sets: 2, reps: 8, hold: 3, tempo: 7, perSide: true, rest: 30,
    doel: 'Traint romp en billen om het bekken stil te houden terwijl je ledematen bewegen.',
    stappen: [
      'Op handen en knieën, handen onder schouders, knieën onder heupen. Rug neutraal, bekken licht achterover.',
      'Strek tegelijk één arm en het tegenovergestelde been tot ze in lijn met je rug zijn.',
      'Hou 3 sec vast zonder dat je bekken kantelt of draait. Stel je voor dat er een glas water op je rug staat.',
      'Terug en wissel van kant.',
    ],
    tips: ['Duw je hiel naar achter in plaats van het been hoog op te tillen.'],
    fouten: ['Been te hoog, onderrug hol', 'Heupen draaien open'],
    makkelijker: 'Alleen been of alleen arm.',
  },
  bridgemarch: {
    naam: 'Bridge march', emoji: '🚶', groep: 'kracht', type: 'reps', sets: 2, reps: 8, tempo: 6, perSide: true, rest: 30,
    doel: 'Glute bridge met wisselend been: traint anti-rotatie en eenzijdige bilkracht.',
    stappen: [
      'Neem de bridge-positie aan (heupen omhoog, bekken achterover).',
      'Til zonder je heupen te laten zakken één knie naar je borst.',
      'Zet terug, wissel van been. Per kant tel je een herhaling bij elke keer dat dat been omhoog gaat.',
    ],
    tips: ['Blijf billen aanspannen; je heupen blijven waterpas.'],
    fouten: ['Heupen laten zakken of draaien'],
    makkelijker: 'Gewone glute bridge.',
  },
  rdl: {
    naam: 'Heupscharnier (Roemeense deadlift)', emoji: '🏋️', groep: 'kracht', type: 'reps', sets: 3, reps: 10, tempo: 5, rest: 45,
    doel: 'Versterkt hamstrings en billen. Bij een te grote kanteling zijn de hamstrings vaak lang en zwak, dus kracht is beter dan extra rekken.',
    stappen: [
      'Sta op heupbreedte, knieën licht gebogen, een gewicht (of rugzak) voor je dijen of lege handen.',
      'Duw je billen naar achter alsof je een deur dichtduwt, rug lang en neutraal, ribben omlaag.',
      'Zak tot je rek in de achterkant van de benen voelt (rond knie- tot scheenhoogte).',
      'Duw je heupen naar voren en knijp je billen samen bovenaan. Niet hol komen.',
    ],
    tips: ['Beweging komt uit de heup, niet uit je rug.', 'Houd het gewicht dicht tegen je benen.'],
    fouten: ['Ronde rug', 'Bovenaan holle rug door te ver achterover'],
    makkelijker: 'Zonder gewicht.',
    moeilijker: 'Eén been of zwaarder gewicht.',
  },
  zijplank: {
    naam: 'Zijplank', emoji: '↔️', groep: 'kracht', type: 'timer', sets: 2, secs: 20, perSide: true, rest: 20,
    doel: 'Versterkt zijdelingse romp- en heupspieren die je bekken waterpas houden.',
    stappen: [
      'Lig op je zij, steun op je onderarm, ellebogen onder schouder.',
      'Til je heupen tot je lichaam een rechte lijn vormt van hoofd tot voeten.',
      'Hou vast, bekken licht achterover, bovenste heup niet naar voren of achter laten vallen.',
    ],
    tips: ['Moeilijk? Knieën gebogen op de grond.'],
    fouten: ['Zakkende heup', 'Naar voren of achter draaien'],
    makkelijker: 'Op de knieën.',
  },
  reversecrunch: {
    naam: 'Omgekeerde crunch', emoji: '⬆️', groep: 'kracht', type: 'reps', sets: 2, reps: 10, tempo: 5, rest: 30,
    doel: 'Traint de onderste buikspieren die het bekken naar achteren kantelen.',
    stappen: [
      'Lig op je rug, heupen en knieën 90°, handen langs je lichaam.',
      'Adem uit en rol je bekken omhoog zodat je staartbeen van de grond komt (niet zwaaien).',
      'Zak langzaam terug, onderrug gecontroleerd weer op de grond.',
    ],
    tips: ['Kleine beweging van ongeveer 5–10 cm is genoeg.'],
    fouten: ['Zwaaien met de benen', 'Met je handen duwen'],
    makkelijker: 'Voeten blijven laag, beweeg minder ver.',
  },
  hollow: {
    naam: 'Hollow hold (makkelijke versie)', emoji: '🥣', groep: 'kracht', type: 'timer', sets: 3, secs: 15, rest: 30,
    doel: 'Statische buikspierkracht in een bekken-achterover positie.',
    stappen: [
      'Lig op je rug, knieën gebogen boven je heupen (90°).',
      'Til schouders en hoofd licht van de grond, onderrug plat.',
      'Strek je armen langs je lichaam. Hou vast.',
      'Zodra je onderrug loskomt, ga je rusten.',
    ],
    tips: ['Wil je het zwaarder, strek dan je benen verder.'],
    fouten: ['Onderrug loskomen', 'Adem inhouden'],
    makkelijker: 'Alleen benen boven heupen, hoofd op de grond.',
  },
  beenlift: {
    naam: 'Zijwaartse beenlift', emoji: '🦵', groep: 'kracht', type: 'reps', sets: 2, reps: 12, tempo: 4, perSide: true, rest: 20,
    doel: 'Activeert de zijkant van de billen (gluteus medius) voor een stabiel bekken.',
    stappen: [
      'Lig op je zij, onderste knie gebogen, bovenste been recht, heupen op elkaar.',
      'Til het bovenste been omhoog met de teen iets naar de grond gedraaid, bekken blijft stil.',
      'Langzaam terug zakken.',
    ],
    tips: ['Heupen niet achterover rollen.'],
    fouten: ['Bovenste been te ver naar voren'],
  },
  katkoe: {
    naam: 'Kat-koe (focus op kat)', emoji: '🐈', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 10, tempo: 5, rest: 15,
    doel: 'Warmt wervelkolom en bekken op, geeft een gevoel van beweging in beide richtingen.',
    stappen: [
      'Op handen en knieën, handen onder schouders, knieën onder heupen.',
      'Adem uit: rond je rug, kantel je bekken naar achter en kijk naar je navel (kat).',
      'Adem in: laat je rug zakken en kijk iets omhoog (koe), maar niet extreem.',
    ],
    tips: ['Leg de nadruk op de katbeweging (bekken achterover).'],
    fouten: ['Te snel bewegen', 'Armen laten inzakken'],
  },
  heupcars: {
    naam: 'Heupcirkels (gecontroleerd)', emoji: '⭕', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 5, tempo: 8, perSide: true, rest: 10,
    doel: 'Gecontroleerde cirkels in het heupgewricht. Verbetert controle over het hele bewegingsbereik.',
    stappen: [
      'Sta of ga op handen en knieën. Houd je romp stil.',
      'Trek je knie omhoog naar de zijkant en maak een zo groot mogelijke langzame cirkel met de knie.',
      'Beweeg alleen vanuit de heup; bekken en onderrug blijven stil. Wissel na de helft van de richting.',
    ],
    tips: ['Spanning in het hele been; maak het lastig en traag.'],
    fouten: ['Je rug gebruiken om de cirkel groter te maken'],
  },
  ninety: {
    naam: '90/90 heuprotatie', emoji: '🔃', groep: 'mobiliteit', type: 'reps', sets: 2, reps: 8, tempo: 4, rest: 20,
    doel: 'Traint interne en externe rotatie van beide heupen.',
    stappen: [
      'Zit op de grond, beide knieën 90° gebogen, een been voor je, een opzij.',
      'Laat beide knieën tegelijk naar de andere kant zakken, handen mogen steunen.',
      'Een herhaling = één wissel. Ga rustig en zit zo hoog mogelijk.',
    ],
    tips: ['Zit je scheef? Leg een kussen onder de zitbeen.'],
    fouten: ['Achteroverleunen', 'Met je handen duwen'],
    makkelijker: 'Zit op een verhoging.',
  },
  couch: {
    naam: 'Couch stretch', emoji: '🛋️', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 45, perSide: true, rest: 15,
    doel: 'Diepe rek van de voorkant van de bovenbeen en heupflexoren.',
    stappen: [
      'Kniel met je achterste scheen tegen een muur of bank, knie op een kussen.',
      'Zet de andere voet vooruit in lunge. Rug rechtop.',
      'Kantel je bekken achterover, span de bil aan en kom langzaam rechtop richting de muur.',
      'Voel de rek aan de voorkant van het achterste been.',
    ],
    tips: ['Begin zachter met een voet op een stoel in plaats van een muur.'],
    fouten: ['Hol in de onderrug', 'Pijn in de knie: ga minder diep'],
  },
  kikker: {
    naam: 'Kikkerstretch', emoji: '🐸', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 45, rest: 15,
    doel: 'Rekt de adductoren (binnenkant dij) en opent de heupen.',
    stappen: [
      'Ga op handen en knieën, knieën wijd uit elkaar, onderbenen evenwijdig, voeten gedraaid.',
      'Laat de heupen langzaam naar achter zakken; houd de onderrug neutraal.',
      'Adem rustig; stop bij milde spanning.',
    ],
    tips: ['Een opgevouwen handdoek onder de knieën helpt.'],
    fouten: ['Onderrug hol laten zakken'],
  },
  figuur4: {
    naam: 'Figuur-4 stretch (liggend)', emoji: '4️⃣', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 40, perSide: true, rest: 10,
    doel: 'Rekt de bilspieren en piriformis; een vriendelijke variant van de duif.',
    stappen: [
      'Lig op je rug, knieën gebogen. Leg de enkel van het ene been op de knie van het andere.',
      'Pak de achterkant van het onderste bovenbeen en trek zachtjes naar je toe.',
      'Druk de bovenste knie lichtjes weg met je elleboog.',
    ],
    tips: ['Hoofd en schouders blijven ontspannen.'],
    fouten: ['Knie pijn: ga minder diep'],
  },
  squat: {
    naam: 'Diepe squat hold', emoji: '🙇', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 45, rest: 15,
    doel: 'Bouwt heupmobiliteit en enkelmobiliteit tegelijk op.',
    stappen: [
      'Sta iets breder dan heupbreedte, tenen licht naar buiten.',
      'Zak zo diep als comfortabel, bekken neutraal, hielen op de grond.',
      'Duw de knieën rustig uit elkaar met je ellebogen en zit rechtop.',
    ],
    tips: ['Houd je vast aan een deurpost als je niet ver komt.', 'Hielen omhoog? Leg een boek of opgerolde handdoek eronder.'],
    fouten: ['Rug rond laten zakken', 'Knieën naar binnen laten vallen'],
    makkelijker: 'Ondersteund met handen.',
  },
  openboek: {
    naam: 'Open boek (borstrotatie)', emoji: '📖', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 8, tempo: 5, perSide: true, rest: 10,
    doel: 'Mobiliseert de borstwervelkolom en helpt je ribben bij het omlaag brengen (minder holle onderrug).',
    stappen: [
      'Lig op je zij, knieën 90° gebogen en op elkaar, armen voor je uitgestrekt.',
      'Open de bovenste arm als een boek richting de grond aan de andere kant, kijk mee.',
      'Je knieën blijven op elkaar. Terug en herhaal.',
    ],
    tips: ['Adem uit tijdens het openen.'],
    fouten: ['Knieën laten wegglijden'],
  },
  wgs: {
    naam: "Wereld-stretch (lunge met rotatie)", emoji: '🌍', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 5, tempo: 8, perSide: true, rest: 10,
    doel: 'Combineert heupflexorrek, heupopening en borstrotatie in één vloeiende oefening.',
    stappen: [
      'Begin in een diepe lunge, achterste knie van de grond of op de grond.',
      'Zet beide handen naast je voorste voet, ellebogen richting grond.',
      'Draai de binnenste arm naar het plafond, volg met je blik, en keer terug.',
    ],
    tips: ['Neem de tijd; adem in de stretch.'],
    fouten: ['Achterste been laten hangen'],
  },
};

export const ROUTINES = {
  reset: {
    naam: 'Bekken-reset', emoji: '🎯', kleur: '#14b8a6',
    omschrijving: 'De kern van je programma: ademhaling, bekkencontrole, heupflexor-rek en activatie van buik en billen.',
    items: [{ id: 'adem90' }, { id: 'bekkenkanteling' }, { id: 'heupflexor' }, { id: 'deadbug' }, { id: 'bridge' }, { id: 'plank' }, { id: 'muurhouding' }],
  },
  kracht: {
    naam: 'Kracht & controle', emoji: '💪', kleur: '#f97316',
    omschrijving: 'Versterk billen, hamstrings en buik zodat je bekken in een betere stand blijft staan.',
    items: [{ id: 'birddog' }, { id: 'bridgemarch' }, { id: 'rdl' }, { id: 'zijplank' }, { id: 'reversecrunch' }, { id: 'hollow' }, { id: 'beenlift' }],
  },
  mobiliteit: {
    naam: 'Heup-mobiliteit', emoji: '🧘', kleur: '#8b5cf6',
    omschrijving: 'Houd je heupen soepel en beweeglijk in alle richtingen.',
    items: [{ id: 'katkoe' }, { id: 'heupcars' }, { id: 'ninety' }, { id: 'couch' }, { id: 'kikker' }, { id: 'figuur4' }, { id: 'squat' }, { id: 'openboek' }],
  },
  mini: {
    naam: 'Mini (5 min)', emoji: '⚡', kleur: '#eab308',
    omschrijving: 'Snelle routine voor drukke dagen of tussendoor aan je bureau.',
    items: [
      { id: 'adem90', secs: 45 },
      { id: 'muurhouding', sets: 1, secs: 45 },
      { id: 'heupflexor', sets: 1, secs: 30 },
      { id: 'bekkenkanteling', sets: 1 },
    ],
  },
};

// 0 = zondag … 6 = zaterdag (zoals Date.getDay)
export const STANDAARD_SCHEMA = {
  1: ['reset', 'mobiliteit'],
  2: ['kracht'],
  3: ['reset', 'mobiliteit'],
  4: ['kracht'],
  5: ['reset', 'mobiliteit'],
  6: ['kracht', 'mobiliteit'],
  0: ['mini'],
};

export const DAGEN = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
export const DAGEN_LANG = ['zondag', 'maandag', 'dinsdag', 'woensdag', 'donderdag', 'vrijdag', 'zaterdag'];

export const BRONNEN = [
  { t: 'Warneke e.a. (2024) – Effects of Stretching or Strengthening Exercise on Spinal and Lumbopelvic Posture: systematic review met meta-analyse (Sports Medicine – Open)', u: 'https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-024-00733-5' },
  { t: 'Factors Influencing Pelvic Tilt: A Systematic Review', u: 'https://jshsr.atu.ac.ir/article_19639_en.html' },
  { t: 'Bandy & Irion (1994) – The effect of time on static stretch on the flexibility of the hamstring muscles (Physical Therapy)', u: 'https://pubmed.ncbi.nlm.nih.gov/8066111/' },
  { t: 'Physiopedia – Pelvic Tilt', u: 'https://www.physio-pedia.com/Pelvic_Tilt' },
  { t: 'Lopende studie NCT07098741 – fysiotherapie-interventies bij anterieure bekkenkanteling', u: 'https://clinicaltrials.gov/study/NCT07098741' },
];

// ---------- helpers ----------

/** Combineert een basisoefening met overrides uit de routine. */
export function oefening(item) {
  const basis = OEFENINGEN[item.id];
  if (!basis) throw new Error('Onbekende oefening ' + item.id);
  return { ...basis, ...item };
}

export function routineOefeningen(routineId) {
  return ROUTINES[routineId].items.map(oefening);
}

/** Geschatte duur van één oefening in seconden (incl. kanten en sets, excl. rust). */
export function werkSeconden(ex) {
  const kanten = ex.perSide ? 2 : 1;
  const perSet = ex.type === 'timer' ? ex.secs : ex.reps * (ex.tempo || 4);
  return perSet * ex.sets * kanten;
}

export function routineMinuten(routineId) {
  const exs = routineOefeningen(routineId);
  const sec = exs.reduce((s, ex) => s + werkSeconden(ex) + ex.rest * ex.sets, 0);
  return Math.round(sec / 60);
}

export function dosering(ex) {
  const kant = ex.perSide ? ' per kant' : '';
  if (ex.type === 'timer') return `${ex.sets} × ${ex.secs} sec${kant}`;
  const hold = ex.hold ? ` (${ex.hold} sec vasthouden)` : '';
  return `${ex.sets} × ${ex.reps}${kant}${hold}`;
}
