# OKAPIA Design System

Refonte visuelle premium — identité ancrée dans l'okapi (RDC) plutôt que le bleu médical générique.

## Palette

| Token | Hex | Usage |
|---|---|---|
| `ink` | `#10201B` | Encre vert-profond : sidebars, footer, sections sombres, texte fort |
| `brand-600` | `#146B52` | Émeraude primaire : boutons, états actifs, liens |
| `brand-50…900` | — | Déclinaisons (fonds légers `brand-50`, hover `brand-700`) |
| `sand` | `#F7F6F2` | Ivoire : fonds de section et des espaces internes |
| `bronze` | `#A9803E` | Accent okapi : eyebrows et détails uniquement (parcimonie) |
| `line` | `#E5E4DC` | Bordures hairline |

Les palettes historiques `navy` et `medical` restent disponibles pour compatibilité.

## Typographie

- **Bricolage Grotesque** (`font-display`) — titres. Classes prêtes : `.display-xl`, `.display-lg`.
- **Instrument Sans** (`font-sans`) — corps de texte et UI (défaut du `body`).
- **IBM Plex Mono** (`font-mono`) — labels techniques : `.eyebrow` / `.eyebrow--light`.

Fonts chargées via Google Fonts dans `index.html`.

## Composants CSS (src/index.css)

- `.btn-primary` / `.btn-secondary` / `.btn-on-dark` / `.btn-ghost-dark` — boutons pill
- `.card` + `.card-hover` — cartes hairline avec ombre douce
- `.eyebrow` — label mono uppercase au-dessus des titres
- `.hairline` — séparateur fin
- `.okapi-stripes` — **signature** : rayures verticales irrégulières (utiliser avec `text-{couleur}` + `opacity-[0.04]`)
- `.rise`, `.rise-1..3` — apparition douce au chargement (respecte `prefers-reduced-motion`)

## Espaces internes : AppShell

`src/components/ui/AppShell.tsx` est la coquille partagée des dashboards (sidebar encre, header épuré, notifications). Déjà adoptée par : `DoctorLayout`, `PatientLayout`, `LaboratoryLayout`, `PharmacyLayout`. `RadiologyLayout` (sidebar repliable + permissions) a été restylé aux mêmes couleurs.

Pour migrer un autre espace :

```tsx
<AppShell
  spaceLabel="Espace Finance"
  greeting={`Bonjour, ${profile?.first_name}`}
  menuItems={[{ path: '/finance/dashboard', label: 'Dashboard', icon: LayoutDashboard }]}
  settingsPath="/finance/settings"   // optionnel
  onSignOut={handleSignOut}
  initials="JK"
  notifications={notifications}
  unreadCount={unreadCount}
  markAsRead={markAsRead}
/>
```

## Propager le style aux pages restantes

Remplacements types dans les pages non encore migrées :

| Avant | Après |
|---|---|
| `bg-blue-600 text-white … rounded-lg` (bouton) | `btn-primary` |
| `bg-white rounded-xl shadow-sm` (carte) | `card` ou `card card-hover` |
| `text-3xl font-bold text-gray-900` (titre) | `display-lg` |
| `text-gray-600` | `text-ink-muted` |
| `bg-gray-50` / `bg-gray-100` (fonds) | `bg-sand` |
| `text-blue-600` (accent) | `text-brand-600` |

## Fichiers modifiés

- `index.html` — fonts + titre
- `tailwind.config.js` — thème complet
- `src/index.css` — fondations du design system (ajout en fin de fichier)
- `src/components/public/Header.tsx`, `Footer.tsx`, `HeroSlider.tsx` — refonte
- `src/pages/public/Home.tsx` — restylée (logique et traductions intactes)
- `src/components/ui/AppShell.tsx` — nouveau
- `src/modules/{doctor,patient,laboratory,pharmacy}/…Layout.tsx` — migrés vers AppShell
- `src/modules/radiology/RadiologyLayout.tsx` — restylé en place
