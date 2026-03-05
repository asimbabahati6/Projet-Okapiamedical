# Logo et Format de Présentation Miniature - Documentation

## 1. Redimensionnement du Logo

### Versions créées :
- **30x50px** : `okapia-logo-mini.png` (1.9 KB) - Ultra compact pour favicon/icônes
- **500x500px** : `okapia-logo-500.png` (56 KB) - Version optimisée pour affichage de qualité
- **Original** : `okapia-logo.png` (247 KB) - Version haute résolution

### Classes CSS disponibles :

```css
/* Tailles prédéfinies */
.okapia-logo-mini       /* 30px × 50px - Ultra compact */
.okapia-logo-small      /* 40px × 66px - Petit */
.okapia-logo-medium     /* 48px × 80px - Moyen */
.okapia-logo-large      /* 60px × 100px - Grand */
.okapia-logo-xlarge     /* 500px × 500px - Très grand */

/* Contextes spécifiques */
.okapia-logo-header     /* 48px height - En-tête */
.okapia-logo-footer     /* 48px height - Pied de page */
.okapia-logo-sidebar    /* 40px height - Barre latérale */
.okapia-logo-sidebar-collapsed /* 32px height - Barre latérale réduite */
```

### Implémentation HTML/CSS :

#### Exemple 1 : Logo dans l'en-tête
```html
<div class="okapia-logo-wrapper">
  <div class="okapia-logo-container">
    <img
      src="/okapia-logo.png"
      alt="OKAPIA Médical Logo"
      class="okapia-logo okapia-logo-header"
    />
  </div>
  <span class="text-xl font-bold text-gray-900">OKAPIA Médical</span>
</div>
```

#### Exemple 2 : Logo 30×50 (Mini)
```html
<img
  src="/okapia-logo-mini.png"
  alt="OKAPIA Icon"
  class="okapia-logo okapia-logo-mini"
/>
```

#### Exemple 3 : Logo 500×500 (Grande version)
```html
<div class="flex justify-center">
  <img
    src="/okapia-logo-500.png"
    alt="OKAPIA Médical"
    class="okapia-logo okapia-logo-xlarge"
  />
</div>
```

### Caractéristiques CSS :

```css
.okapia-logo {
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

.okapia-logo-container:hover img {
  transform: scale(1.05);
  transition: transform 0.3s ease;
}
```

---

## 2. Composant de Présentation Miniature

### Composant React : `MiniatureCard`

#### Import :
```typescript
import { MiniatureCard, MiniatureGrid } from '@/components/public/MiniatureCard';
```

### Variantes disponibles :

1. **Default** - Carte standard (120px min-height)
2. **Compact** - Version compacte (80px min-height)
3. **Thumbnail** - Miniature (60px min-height)

### Exemples d'utilisation :

#### Exemple 1 : Carte avec icône (Default)
```tsx
import { Heart } from 'lucide-react';

<MiniatureCard
  icon={Heart}
  title="Cardiologie"
  description="Services de soins cardiaques complets avec équipement moderne"
  onClick={() => navigate('/services/cardiology')}
  variant="default"
/>
```

#### Exemple 2 : Carte compacte avec image
```tsx
<MiniatureCard
  image="/images/service-consultation.jpg"
  title="Consultation Générale"
  description="Examens médicaux de routine"
  variant="compact"
/>
```

#### Exemple 3 : Miniature (Thumbnail)
```tsx
<MiniatureCard
  icon={Users}
  title="Pédiatrie"
  variant="thumbnail"
/>
```

#### Exemple 4 : Grille de miniatures
```tsx
<MiniatureGrid columns={3} gap="medium">
  <MiniatureCard
    icon={Heart}
    title="Cardiologie"
    description="Soins cardiaques avancés"
    variant="compact"
  />
  <MiniatureCard
    icon={Brain}
    title="Neurologie"
    description="Traitement du système nerveux"
    variant="compact"
  />
  <MiniatureCard
    icon={Bone}
    title="Orthopédie"
    description="Soins des os et articulations"
    variant="compact"
  />
</MiniatureGrid>
```

---

## 3. Code CSS Complet

### Fichier : `src/styles/logo.css`

```css
/* Classes de base pour le logo */
.okapia-logo {
  object-fit: contain;
  image-rendering: -webkit-optimize-contrast;
  image-rendering: crisp-edges;
}

/* Tailles spécifiques */
.okapia-logo-mini {
  width: 30px;
  height: 50px;
}

.okapia-logo-small {
  width: 40px;
  height: auto;
  max-height: 66px;
}

.okapia-logo-medium {
  width: 48px;
  height: auto;
  max-height: 80px;
}

.okapia-logo-large {
  width: 60px;
  height: auto;
  max-height: 100px;
}

.okapia-logo-xlarge {
  width: 500px;
  height: 500px;
}

/* Classes contextuelles */
.okapia-logo-header {
  height: 48px;
  width: auto;
}

.okapia-logo-sidebar {
  height: 40px;
  width: auto;
}

.okapia-logo-sidebar-collapsed {
  height: 32px;
  width: auto;
}

.okapia-logo-footer {
  height: 48px;
  width: auto;
}

/* Responsive */
@media (max-width: 640px) {
  .okapia-logo-header {
    height: 40px;
  }

  .okapia-logo-footer {
    height: 40px;
  }
}

/* Conteneurs et wrappers */
.okapia-logo-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
}

.okapia-logo-container {
  position: relative;
  overflow: hidden;
}

.okapia-logo-container img {
  transition: transform 0.3s ease;
}

.okapia-logo-container:hover img {
  transform: scale(1.05);
}

/* Accessibilité */
@media (prefers-reduced-motion: reduce) {
  .okapia-logo-container img {
    transition: none;
  }

  .okapia-logo-container:hover img {
    transform: none;
  }
}
```

---

## 4. Optimisations Web

### Performance :
- ✅ Logo mini (30×50) : **1.9 KB** - Chargement ultra-rapide
- ✅ Logo 500×500 : **56 KB** - Qualité optimisée
- ✅ Lazy loading sur les miniatures
- ✅ Image rendering optimisé pour netteté

### Compatibilité navigateurs :
- ✅ Chrome, Firefox, Safari, Edge
- ✅ Mobile responsive
- ✅ Support des animations (avec fallback)
- ✅ Accessibility (prefers-reduced-motion)

### SEO :
- ✅ Attributs `alt` descriptifs
- ✅ Tailles d'images appropriées
- ✅ Lazy loading des images

---

## 5. Intégration dans le Projet

### Fichiers modifiés :
1. `src/components/public/Header.tsx` - Logo en-tête
2. `src/components/public/Footer.tsx` - Logo pied de page
3. `src/pages/staff/StaffLayout.tsx` - Logo barre latérale
4. `src/index.css` - Import des styles

### Nouveaux fichiers créés :
1. `src/components/public/MiniatureCard.tsx` - Composant miniature
2. `src/styles/logo.css` - Styles du logo
3. `public/okapia-logo-mini.png` - Logo 30×50
4. `public/okapia-logo-500.png` - Logo 500×500

---

## 6. Exemples d'Usage Complet

### Page de services avec miniatures :

```tsx
import { MiniatureCard, MiniatureGrid } from '@/components/public/MiniatureCard';
import { Heart, Brain, Bone, Eye, Ear } from 'lucide-react';

function ServicesPage() {
  const services = [
    { icon: Heart, title: 'Cardiologie', desc: 'Soins cardiaques' },
    { icon: Brain, title: 'Neurologie', desc: 'Système nerveux' },
    { icon: Bone, title: 'Orthopédie', desc: 'Os et articulations' },
    { icon: Eye, title: 'Ophtalmologie', desc: 'Soins des yeux' },
    { icon: Ear, title: 'ORL', desc: 'Oreille, nez, gorge' },
  ];

  return (
    <div className="py-12">
      <h1 className="text-3xl font-bold mb-8">Nos Services</h1>

      <MiniatureGrid columns={3} gap="medium">
        {services.map(service => (
          <MiniatureCard
            key={service.title}
            icon={service.icon}
            title={service.title}
            description={service.desc}
            variant="compact"
            onClick={() => navigate(`/services/${service.title.toLowerCase()}`)}
          />
        ))}
      </MiniatureGrid>
    </div>
  );
}
```

### Logo dans différents contextes :

```tsx
// En-tête principal
<div className="okapia-logo-wrapper">
  <img src="/okapia-logo.png" className="okapia-logo okapia-logo-header" />
</div>

// Favicon / Icône
<link rel="icon" type="image/png" href="/okapia-logo-mini.png" />

// Grande version pour page "À propos"
<div className="text-center py-12">
  <img src="/okapia-logo-500.png" className="okapia-logo okapia-logo-xlarge mx-auto" />
</div>
```

---

## Résumé des Fonctionnalités

✅ **Logo redimensionné** : 30×50px optimisé (1.9 KB)
✅ **Version haute qualité** : 500×500px (56 KB)
✅ **Classes CSS flexibles** : 8 tailles prédéfinies
✅ **Composant miniature** : 3 variantes (default, compact, thumbnail)
✅ **Grille responsive** : Colonnes configurables
✅ **Effets hover** : Animations fluides
✅ **Performance web** : Lazy loading, optimisations
✅ **Cross-browser** : Compatible tous navigateurs modernes
✅ **Accessible** : Support des préférences utilisateur
✅ **Design cohérent** : Intégration harmonieuse

