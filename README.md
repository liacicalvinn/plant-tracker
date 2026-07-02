# 🌿 Plantgezondheid

Een mobiele webapp (PWA) waarmee je foto's van je planten maakt en een AI direct de
gezondheid analyseert: score, diagnose, problemen en concreet verzorgingsadvies —
allemaal in het Nederlands, met geschiedenis per plant zodat je het verloop ziet.

**Kosten: €0 hosting.** De app is 100% statisch (GitHub Pages), alle data staat in de
browseropslag van je eigen telefoon (IndexedDB) en je betaalt alleen de paar centen
Azure AI-gebruik per analyse.

## ✨ Functies

- 📷 Foto maken of kiezen uit galerij, automatisch gecomprimeerd
- 🤖 AI-analyse via Azure OpenAI: gezondheidsscore (0–100), status, diagnose, problemen en advies
- 📈 Geschiedenis per plant met scoreverloop (sparkline) en tijdlijn
- 🪴 Meerdere planten beheren
- 🔐 Simpele login + API-sleutel alleen op je eigen toestel
- 📱 Installeerbaar op je beginscherm (PWA), donkere modus, werkt offline (behalve analyses)

## 🚀 Eénmalige installatie

### 1. GitHub Pages aanzetten

1. Ga naar deze repo → **Settings → Pages**
2. Kies bij *Build and deployment* → *Source*: **Deploy from a branch**
3. Kies de branch met deze code en map `/ (root)` → **Save**
4. Na ±1 minuut staat de app op `https://<gebruikersnaam>.github.io/plant-tracker/`

### 2. Azure AI instellen

1. Maak in de [Azure Portal](https://portal.azure.com) een **Azure OpenAI**-resource
2. Deploy daarin (via Azure AI Foundry) een goedkoop vision-model, bijv. **`gpt-4.1-mini`** of `gpt-4o-mini`
3. Kopieer van de resource het **endpoint** (`https://<naam>.openai.azure.com`) en **sleutel 1**
4. Open de app → log in → ⚙️ **Instellingen** → vul endpoint, deploymentnaam en sleutel in → **Opslaan** → **Test verbinding**

> 🔒 De sleutel wordt alleen in de browseropslag van jouw toestel bewaard en staat
> nooit in deze (publieke) repository.

### 3. Op je telefoon zetten

Open de URL op je telefoon en kies in het browsermenu **"Zet op beginscherm"**
(iOS: deelknop → *Voeg toe aan beginscherm*). De app opent daarna fullscreen als
een echte app.

## 🧭 Gebruik

1. Log in
2. Voeg een plant toe met de **+** knop
3. Tik op de plant → **Nieuwe foto & analyse**
4. Bekijk score, diagnose en advies; elke analyse wordt bewaard in de tijdlijn

## 🛠 Techniek

| Onderdeel | Keuze |
|---|---|
| UI | [Ionic](https://ionicframework.com) web components, zelf gehost in `vendor/` — geen build-stap of CDN nodig |
| Opslag | IndexedDB (foto's als gecomprimeerde blobs) + localStorage (instellingen) |
| AI | Azure OpenAI *chat completions* met vision, rechtstreeks vanuit de browser |
| Hosting | GitHub Pages (statisch, gratis) |
| Offline | Service worker met app-shell-cache |

> ⚠️ De login (client-side) is een drempel tegen toevallige bezoekers, geen echte
> beveiliging — op een statische site kan dat niet. Het enige geheim, je Azure-sleutel,
> verlaat je toestel niet.
