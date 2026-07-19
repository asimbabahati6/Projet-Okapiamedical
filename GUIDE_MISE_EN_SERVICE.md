# Guide de mise en service — OKAPIA Medical

Le projet contient déjà tout : le site public **et** le backoffice complet
(espaces Médecin, Patient, Laboratoire, Radiologie, Pharmacie, Finance, Admin),
avec 197 migrations de base de données et 7 fonctions serveur.
Ce guide décrit les 5 étapes pour le rendre pleinement opérationnel.

---

## Étape 1 — Créer le projet Supabase (base de données + auth)

1. Créez un compte sur https://supabase.com (gratuit pour démarrer).
2. Créez un nouveau projet (choisissez une région proche, ex. `eu-central-1`).
3. Notez, dans **Settings → API** :
   - `Project URL` → ce sera `VITE_SUPABASE_URL`
   - `anon public key` → ce sera `VITE_SUPABASE_ANON_KEY`

## Étape 2 — Appliquer les migrations (structure de la base)

Avec la CLI Supabase (https://supabase.com/docs/guides/cli) :

```bash
npm install -g supabase
supabase login
supabase link --project-ref VOTRE_REF_PROJET
supabase db push          # applique les 197 migrations de supabase/migrations/
```

## Étape 3 — Déployer les fonctions serveur

```bash
supabase functions deploy create-admin-accounts
supabase functions deploy fetch-exchange-rates
supabase functions deploy generate-patient-fhir-record
supabase functions deploy notify-admin-registration
supabase functions deploy seed-demo-doctors
supabase functions deploy send-break-notification
supabase functions deploy send-punch-alert
```

## Étape 4 — Configurer et lancer le site

```bash
cp .env.example .env      # puis remplissez les 2 valeurs de l'étape 1
npm install
npm run dev               # http://localhost:5173
```

**Création des comptes administrateurs** : ouvrez `http://localhost:5173/admin-setup`.
Cette page appelle la fonction `create-admin-accounts` et vous affiche les
identifiants temporaires (à copier et changer à la première connexion via
`/change-password`).

**Données de démonstration (optionnel)** : les scripts SQL du dossier `scripts/`
(médecins, patients fictifs, données labo/radiologie) peuvent être exécutés
dans le SQL Editor du dashboard Supabase pour peupler l'interface.

## Étape 5 — Mettre en ligne

Le build est un site statique (Vite) :

```bash
npm run build             # génère dist/
```

Hébergeurs simples et gratuits pour commencer :
- **Netlify** : glissez-déposez `dist/` ou connectez le repo GitHub
  (build command `npm run build`, publish directory `dist`).
- **Vercel** : importez le repo, framework « Vite », mêmes réglages.

Dans les deux cas, ajoutez les 2 variables d'environnement
(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans les réglages de l'hébergeur.
Pour votre domaine `okapiamedical.com`, pointez-le vers l'hébergeur choisi
(les deux fournissent le HTTPS automatiquement).

---

## Récapitulatif des accès

| Zone | URL | Qui |
|---|---|---|
| Site public | `/` | Visiteurs, prise de rendez-vous |
| Initialisation admin | `/admin-setup` | Une seule fois, au premier déploiement |
| Connexion personnel | `/staff/login` | Médecins, labo, pharmacie, radiologie… |
| Connexion admin | `/admin` | Direction / administration |
| Changement de mot de passe | `/change-password` | Tous, à la première connexion |

## En cas de problème

- Écran blanc au démarrage → le `.env` est manquant ou mal rempli
  (le code s'arrête avec « Missing Supabase environment variables »).
- Erreurs de permissions dans le backoffice → vérifiez que **toutes** les
  migrations sont passées (`supabase db push` sans erreur) : le système de
  rôles (RBAC) en dépend.
- Les listes sont vides → normal sur une base neuve ; injectez les données
  de démo (`scripts/`) ou créez vos premières fiches via l'interface admin.
