// Oefeningen, routines, weekschema en infoteksten.
// type 'timer' = tijd aanhouden (secs), type 'reps' = herhalingen (reps, tempo = seconden per herhaling).

export const GROEPEN = {
  reset: 'Bekkencontrole',
  kracht: 'Kracht',
  mobiliteit: 'Mobiliteit',
};

export const OEFENINGEN = {
  bekkenkanteling: {
    naam: 'Bekkenkanteling', groep: 'reset', type: 'reps', sets: 2, reps: 10, hold: 3, tempo: 6, rest: 30,
    kort: 'Kantel je bekken zodat je onderrug de grond raakt. Staartbeen omhoog, 3 seconden vasthouden.',
    doel: 'Leer het gevoel van een achterwaartse bekkenkanteling: het tegenovergestelde van je gewoonte.',
    stappen: [
      'Lig op je rug, knieën gebogen, voeten plat op heupbreedte.',
      'Kantel je bekken zodat je staartbeen iets omhoog komt en je onderrug richting de grond gaat.',
      'Gebruik je buik en billen, niet je benen. Hou 3 seconden vast.',
      'Zak langzaam terug naar neutraal (niet helemaal hol).',
    ],
    tips: ['Stel je voor dat je je broekriem naar je kin trekt.', 'Kleine, gecontroleerde beweging.'],
    fouten: ['Duwen met je voeten'],
    makkelijker: 'Geen houdtijd, alleen de beweging.',
  },
  heupflexor: {
    naam: 'Heupflexor-stretch', groep: 'reset', type: 'timer', sets: 2, secs: 40, perSide: true, rest: 15,
    kort: 'Knie op de grond, bil aanspannen en bekken achterover kantelen. Dan pas een stukje naar voren schuiven.',
    doel: 'Rekt de heupbuigers (psoas/rectus femoris). Met achterwaartse kanteling werkt de stretch beter dan zonder.',
    stappen: [
      'Kniel op één knie (kussen eronder), de andere voet ver naar voren.',
      'Span de bil van het achterste been aan en kantel je bekken naar achter (staartbeen omlaag).',
      'Borst rechtop, ribben omlaag. Schuif nu heel klein stukje naar voren.',
      'Je voelt rek aan de voorkant van de heup van het achterste been.',
    ],
    tips: ['Voel je het in je onderrug? Dan kantel je niet genoeg of ga je te ver.'],
    fouten: ['Holle onderrug', 'Te ver naar voren schuiven'],
    makkelijker: 'Gebruik een stoel of muur voor steun.',
    moeilijker: 'Strek de arm aan de kant van het achterste been omhoog en leun licht weg.',
  },
  deadbug: {
    naam: 'Dead bug', groep: 'reset', type: 'reps', sets: 2, reps: 8, tempo: 6, perSide: true, rest: 30,
    kort: 'Laat tegenovergestelde arm en been langzaam zakken zonder dat je onderrug loskomt.',
    doel: 'Traint de buikspieren om het bekken stabiel te houden terwijl armen en benen bewegen.',
    stappen: [
      'Lig op je rug, armen recht omhoog, heupen en knieën 90°. Onderrug zacht richting grond.',
      'Laat langzaam één been en de tegenovergestelde arm zakken naar de grond.',
      'Je onderrug blijft plat. Komt ze omhoog, ga dan minder ver.',
      'Terug naar start en wissel. "Per kant" = 8 herhalingen met dezelfde combinatie.',
    ],
    tips: ['Ga traag: 3 seconden naar beneden.'],
    fouten: ['Onderrug van de grond laten komen', 'Te snel bewegen'],
    makkelijker: 'Beweeg alleen de benen of alleen de armen.',
    moeilijker: 'Hou een licht gewicht of kussen vast tussen handen en knieën.',
  },
  bridge: {
    naam: 'Glute bridge', groep: 'reset', type: 'reps', sets: 3, reps: 12, hold: 2, tempo: 5, rest: 30,
    kort: 'Duw je heupen omhoog tot een rechte lijn van knie tot schouder en knijp je billen samen.',
    doel: 'Versterkt de bilspieren, de belangrijkste tegenhangers van een te grote voorwaartse bekkenkanteling.',
    stappen: [
      'Lig op je rug, knieën gebogen, hielen dichtbij je billen.',
      'Kantel eerst je bekken licht achterover.',
      'Duw door je hielen en til je heupen tot je lichaam een rechte lijn vormt van knie tot schouder. Knijp je billen samen.',
      'Hou 2 seconden vast, zak langzaam terug.',
    ],
    tips: ['Stop op heuphoogte: niet verder hol trekken.', 'Voel het in je billen, niet in je onderrug.'],
    fouten: ['Onderrug hol trekken bovenaan', 'Knieën naar binnen laten vallen'],
    makkelijker: 'Zonder houdtijd.',
    moeilijker: 'Doe de beweging op één been, of leg gewicht op je heupen.',
  },
  plank: {
    naam: 'Plank', groep: 'reset', type: 'timer', sets: 3, secs: 20, rest: 30,
    kort: 'Rechte lijn op je onderarmen, bekken licht achterover, billen en buik zo hard mogelijk aangespannen.',
    doel: 'Bouwt controle over een neutraal bekken onder belasting. Kort en strak is beter dan lang en slap.',
    stappen: [
      'Steun op onderarmen en tenen, ellebogen onder de schouders.',
      'Kantel je bekken naar achter, span billen en buik zo hard je kunt aan.',
      'Duw de grond weg, lijn van hoofd tot hiel.',
      'Stop zodra je onderrug begint door te zakken.',
    ],
    tips: ['Een korte plank met maximale spanning is effectiever dan een lange slappe.'],
    fouten: ['Hangende onderrug', 'Billen te hoog'],
    makkelijker: 'Plank op de knieën.',
    moeilijker: 'Verleng naar 30–45 seconden.',
  },
  muurhouding: {
    naam: 'Muurhouding', groep: 'reset', type: 'timer', sets: 2, secs: 45, rest: 15,
    kort: 'Sta met hielen, billen en schouders tegen de muur en kantel je bekken tot je onderrug de muur bijna raakt.',
    doel: 'Vertaalt de oefeningen naar je staande houding en leert je lichaam wat "neutraal" is.',
    stappen: [
      'Sta met hielen, billen, schouderbladen en achterhoofd tegen de muur.',
      'Er hoort een handbreedte ruimte te zijn tussen onderrug en muur. Past je hand er makkelijk door, dan ga je te hol.',
      'Kantel je bekken tot je hand er net doorheen past, kin licht naar binnen.',
      'Stap weg van de muur en probeer de houding te behouden.',
    ],
    tips: ['Doe dit ook eens tussendoor bij het wachten of aan je bureau.'],
    fouten: ['Knieën helemaal op slot', 'Borst naar voren duwen'],
  },
  birddog: {
    naam: 'Bird dog', groep: 'kracht', type: 'reps', sets: 2, reps: 8, hold: 3, tempo: 7, perSide: true, rest: 30,
    kort: 'Strek tegelijk één arm en het tegenovergestelde been; bekken en rug blijven volledig stil.',
    doel: 'Traint romp en billen om het bekken stil te houden terwijl je ledematen bewegen.',
    stappen: [
      'Op handen en knieën, handen onder schouders, knieën onder heupen. Rug neutraal.',
      'Strek tegelijk één arm en het tegenovergestelde been tot ze in lijn met je rug zijn.',
      'Hou 3 seconden vast zonder dat je bekken kantelt of draait.',
      'Terug en wissel van kant.',
    ],
    tips: ['Duw je hiel naar achter in plaats van het been hoog op te tillen.'],
    fouten: ['Been te hoog, onderrug hol', 'Heupen draaien open'],
    makkelijker: 'Alleen been of alleen arm.',
  },
  bridgemarch: {
    naam: 'Bridge march', groep: 'kracht', type: 'reps', sets: 2, reps: 8, tempo: 6, perSide: true, rest: 30,
    kort: 'Hou de bridge-positie en til afwisselend één knie op zonder dat je heupen zakken.',
    doel: 'Glute bridge met wisselend been: traint anti-rotatie en eenzijdige bilkracht.',
    stappen: [
      'Neem de bridge-positie aan (heupen omhoog, bekken achterover).',
      'Til zonder je heupen te laten zakken één knie naar je borst.',
      'Zet terug en wissel van been. Per kant telt een herhaling elke keer dat dat been omhoog gaat.',
    ],
    tips: ['Blijf billen aanspannen; je heupen blijven waterpas.'],
    fouten: ['Heupen laten zakken of draaien'],
    makkelijker: 'Gewone glute bridge.',
  },
  rdl: {
    naam: 'Heupscharnier', groep: 'kracht', type: 'reps', sets: 3, reps: 10, tempo: 5, rest: 45,
    kort: 'Duw je billen naar achter met een lange rug, zak tot je rek voelt in je hamstrings en kom op door je heupen.',
    doel: 'Versterkt hamstrings en billen. Bij een te grote kanteling zijn de hamstrings vaak lang en zwak, dus kracht is beter dan extra rekken.',
    stappen: [
      'Sta op heupbreedte, knieën licht gebogen, eventueel een gewicht of rugzak voor je dijen.',
      'Duw je billen naar achter alsof je een deur dichtduwt, rug lang en neutraal.',
      'Zak tot je rek voelt in de achterkant van je benen (rond scheenhoogte).',
      'Duw je heupen naar voren en knijp je billen samen bovenaan. Niet hol komen.',
    ],
    tips: ['De beweging komt uit de heup, niet uit je rug.', 'Houd het gewicht dicht tegen je benen.'],
    fouten: ['Ronde rug', 'Bovenaan holle rug door te ver achterover'],
    makkelijker: 'Zonder gewicht.',
    moeilijker: 'Op één been of met zwaarder gewicht.',
  },
  zijplank: {
    naam: 'Zijplank', groep: 'kracht', type: 'timer', sets: 2, secs: 20, perSide: true, rest: 20,
    kort: 'Op je zij op je onderarm: til je heupen tot een rechte lijn van hoofd tot voeten en houd vast.',
    doel: 'Versterkt zijdelingse romp- en heupspieren die je bekken waterpas houden.',
    stappen: [
      'Lig op je zij, steun op je onderarm, elleboog onder de schouder.',
      'Til je heupen tot je lichaam een rechte lijn vormt van hoofd tot voeten.',
      'Hou vast, bekken licht achterover, bovenste heup niet naar voren of achter laten vallen.',
    ],
    tips: ['Te zwaar? Knieën gebogen op de grond.'],
    fouten: ['Zakkende heup', 'Naar voren of achter draaien'],
    makkelijker: 'Op de knieën.',
  },
  reversecrunch: {
    naam: 'Omgekeerde crunch', groep: 'kracht', type: 'reps', sets: 2, reps: 10, tempo: 5, rest: 30,
    kort: 'Rol je bekken van de grond met je knieën richting je borst, zonder te zwaaien.',
    doel: 'Traint de onderste buikspieren die het bekken naar achteren kantelen.',
    stappen: [
      'Lig op je rug, heupen en knieën 90°, handen langs je lichaam.',
      'Rol je bekken omhoog zodat je staartbeen van de grond komt (niet zwaaien).',
      'Zak langzaam terug, onderrug gecontroleerd weer op de grond.',
    ],
    tips: ['Een kleine beweging van 5–10 cm is genoeg.'],
    fouten: ['Zwaaien met de benen', 'Met je handen duwen'],
    makkelijker: 'Voeten blijven laag, beweeg minder ver.',
  },
  hollow: {
    naam: 'Hollow hold', groep: 'kracht', type: 'timer', sets: 3, secs: 15, rest: 30,
    kort: 'Til je schouders en hoofd licht op terwijl je onderrug plat blijft, knieën gebogen boven je heupen.',
    doel: 'Statische buikspierkracht in een bekken-achterover positie (makkelijke versie).',
    stappen: [
      'Lig op je rug, knieën gebogen boven je heupen (90°).',
      'Til schouders en hoofd licht van de grond, onderrug plat.',
      'Strek je armen langs je lichaam en hou vast.',
      'Zodra je onderrug loskomt, ga je rusten.',
    ],
    tips: ['Wil je het zwaarder, strek dan je benen verder.'],
    fouten: ['Onderrug loskomen'],
    makkelijker: 'Alleen benen boven heupen, hoofd op de grond.',
  },
  beenlift: {
    naam: 'Zijwaartse beenlift', groep: 'kracht', type: 'reps', sets: 2, reps: 12, tempo: 4, perSide: true, rest: 20,
    kort: 'Op je zij: til het bovenste been omhoog zonder dat je bekken meebeweegt.',
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
    naam: 'Kat-koe', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 10, tempo: 5, rest: 15,
    kort: 'Rol je rug rond en kantel je bekken achter, daarna zacht terug naar hol. Langzaam.',
    doel: 'Warmt wervelkolom en bekken op, geeft een gevoel van beweging in beide richtingen.',
    stappen: [
      'Op handen en knieën, handen onder schouders, knieën onder heupen.',
      'Rond je rug, kantel je bekken naar achter en kijk naar je navel (kat).',
      'Laat daarna je rug zakken en kijk iets omhoog (koe), maar niet extreem.',
    ],
    tips: ['Leg de nadruk op de katbeweging (bekken achterover).'],
    fouten: ['Te snel bewegen', 'Armen laten inzakken'],
  },
  thomas: {
    naam: 'Knie naar borst', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 40, perSide: true, rest: 10,
    kort: 'Trek één knie naar je borst en laat het andere been rusten of hangen. Voel de rek voorin je heup.',
    doel: 'Houdt je bekken achterover terwijl de heupbuiger van het andere been wordt gerekt.',
    stappen: [
      'Lig op je rug op de rand van een bed of op de grond.',
      'Trek één knie met beide handen naar je borst tot je onderrug plat ligt.',
      'Laat het andere been ontspannen uitgestrekt rusten of over de rand hangen.',
      'Voel de rek aan de voorkant van de heup van het gestrekte been.',
    ],
    tips: ['Blijft het gestrekte been omhoog? Dan is de heupbuiger strak.'],
    fouten: ['Onderrug laten hol worden', 'Het gestrekte been optillen'],
  },
  couch: {
    naam: 'Couch stretch', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 45, perSide: true, rest: 15,
    kort: 'Achterste voet tegen de muur, knie op de grond. Kantel je bekken achterover en kom langzaam rechtop.',
    doel: 'Diepe rek van de voorkant van het bovenbeen en de heupflexoren.',
    stappen: [
      'Kniel met je achterste scheen tegen een muur of bank, knie op een kussen.',
      'Zet de andere voet vooruit in een lunge. Rug rechtop.',
      'Kantel je bekken achterover, span de bil aan en kom langzaam rechtop richting de muur.',
      'Voel de rek aan de voorkant van het achterste been.',
    ],
    tips: ['Begin zachter met een voet op een stoel in plaats van de muur.'],
    fouten: ['Hol in de onderrug', 'Pijn in de knie: ga minder diep'],
  },
  cossack: {
    naam: 'Zijwaartse lunge', groep: 'mobiliteit', type: 'reps', sets: 2, reps: 8, tempo: 5, perSide: true, rest: 15,
    kort: 'Zak diep naar één kant; het andere been blijft gestrekt. Wissel zacht van kant.',
    doel: 'Opent de binnenkant van de dij en de heupen in het zijwaartse vlak.',
    stappen: [
      'Sta ruimer dan heupbreed, tenen licht naar buiten.',
      'Verplaats je gewicht naar rechts en zak diep door je rechterknie, hiel blijft op de grond.',
      'Het linkerbeen blijft gestrekt, de tenen wijzen omhoog.',
      'Duw jezelf terug naar het midden en wissel.',
    ],
    tips: ['Houd je borst omhoog, ga niet verder dan je comfortabel kunt.'],
    fouten: ['Hiel van de grond', 'Knie naar binnen laten vallen'],
    makkelijker: 'Hou je vast aan een stoel of deurpost.',
  },
  squat: {
    naam: 'Diepe hurkzit', groep: 'mobiliteit', type: 'timer', sets: 2, secs: 45, rest: 15,
    kort: 'Zak in een diepe hurk met je hielen op de grond en duw je knieën licht naar buiten.',
    doel: 'Bouwt heupmobiliteit en enkelmobiliteit tegelijk op.',
    stappen: [
      'Sta iets breder dan heupbreedte, tenen licht naar buiten.',
      'Zak zo diep als comfortabel, bekken neutraal, hielen op de grond.',
      'Duw de knieën rustig uit elkaar met je ellebogen en zit rechtop.',
    ],
    tips: ['Houd je vast aan een deurpost als je niet ver komt.', 'Hielen omhoog? Leg een opgerolde handdoek eronder.'],
    fouten: ['Rug rond laten zakken', 'Knieën naar binnen laten vallen'],
    makkelijker: 'Ondersteund met je handen.',
  },
  wgs: {
    naam: 'Lunge met rotatie', groep: 'mobiliteit', type: 'reps', sets: 1, reps: 5, tempo: 8, perSide: true, rest: 10,
    kort: 'Diepe lunge, hand op de grond; draai de andere arm naar het plafond en volg met je blik.',
    doel: 'Combineert heupflexorrek, heupopening en borstrotatie in één vloeiende oefening.',
    stappen: [
      'Begin in een diepe lunge, achterste knie van de grond of op de grond.',
      'Zet beide handen naast je voorste voet.',
      'Draai de binnenste arm naar het plafond, volg met je blik en keer terug.',
    ],
    tips: ['Neem de tijd in elke positie.'],
    fouten: ['Achterste been laten hangen'],
  },
};

export const ROUTINES = {
  reset: {
    naam: 'Bekken-reset',
    omschrijving: 'De kern van je programma: bekkencontrole, heupflexor-rek en activatie van buik en billen.',
    items: [{ id: 'bekkenkanteling' }, { id: 'heupflexor' }, { id: 'deadbug' }, { id: 'bridge' }, { id: 'plank' }, { id: 'muurhouding' }],
  },
  kracht: {
    naam: 'Kracht & controle',
    omschrijving: 'Versterk billen, hamstrings en buik zodat je bekken in een betere stand blijft staan.',
    items: [{ id: 'birddog' }, { id: 'bridgemarch' }, { id: 'rdl' }, { id: 'zijplank' }, { id: 'reversecrunch' }, { id: 'hollow' }, { id: 'beenlift' }],
  },
  mobiliteit: {
    naam: 'Heup-mobiliteit',
    omschrijving: 'Houd je heupen soepel en beweeglijk in alle richtingen.',
    items: [{ id: 'katkoe' }, { id: 'thomas' }, { id: 'couch' }, { id: 'cossack' }, { id: 'squat' }, { id: 'wgs' }],
  },
  mini: {
    naam: 'Mini',
    omschrijving: 'Korte routine voor drukke dagen of tussendoor aan je bureau.',
    items: [
      { id: 'bekkenkanteling', sets: 1 },
      { id: 'heupflexor', sets: 1, secs: 30 },
      { id: 'bridge', sets: 1, reps: 10 },
      { id: 'muurhouding', sets: 1, secs: 45 },
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
  const hold = ex.hold ? ` · ${ex.hold} sec vast` : '';
  return `${ex.sets} × ${ex.reps}${kant}${hold}`;
}
