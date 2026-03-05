# Guide Rapide - Tableaux de Bord Spécialisés

## Accès Rapide aux Dashboards

### Via le Simulateur RBAC

Le moyen le plus simple d'accéder aux différents dashboards est d'utiliser le simulateur RBAC :

1. **Connectez-vous** à l'application
2. **Cliquez sur le sélecteur de rôle** en haut à droite
3. **Sélectionnez un rôle** dans la liste déroulante
4. **Vous êtes automatiquement redirigé** vers le dashboard approprié

### URLs Directes

Si vous connaissez l'URL, vous pouvez accéder directement :

| Module | URL Dashboard |
|--------|---------------|
| Pharmacie | `/pharmacy/dashboard` |
| Laboratoire | `/laboratory/dashboard` |
| Radiologie | `/staff/radiology/dashboard` |
| Médecin | `/doctor/dashboard` |
| Patient | `/patient/dashboard` |

---

## Par Rôle

### 1. Pharmacien

**Dashboard**: `/pharmacy/dashboard`

**Vous voyez**:
- Nombre total de médicaments en stock
- Médicaments en stock bas (alerte rouge)
- Médicaments expirant bientôt (< 30 jours)
- Ordonnances en attente de dispensation
- Valeur totale du stock en USD
- Ordonnances dispensées aujourd'hui
- Liste des dernières ordonnances

**Actions rapides**:
- Gérer l'inventaire → Voir tous les médicaments
- Traiter les ordonnances → Dispenser les prescriptions
- Stock bas → Médicaments à réapprovisionner

---

### 2. Technicien de Laboratoire

**Dashboard**: `/laboratory/dashboard`

**Vous voyez**:
- Analyses en attente
- Analyses en cours
- Résultats disponibles
- Résultats validés
- Analyses urgentes

**Actions rapides**:
- Voir la file d'attente → Examens à réaliser
- Saisir des résultats → Enregistrer les analyses
- Valider des rapports → Approuver les résultats (si Chef Lab)

---

### 3. Radiologue / Technicien Radiologie

**Dashboard**: `/staff/radiology/dashboard`

**Vous voyez**:
- Examens prescrits (en attente)
- Examens en cours
- Examens terminés
- Rapports validés
- Examens urgents

**Actions rapides**:
- Prescrire un examen (médecins uniquement)
- File d'attente → Examens à réaliser
- Espace de travail → Rédiger comptes-rendus
- Visualiseur → Voir les images et rapports

**Note**: Le contenu varie selon vos permissions (Médecin, Radiologue, Technicien)

---

### 4. Médecin

**Dashboard**: `/doctor/dashboard`

**Vous voyez**:
- Rendez-vous aujourd'hui
- Consultations cette semaine
- Analyses en attente de résultats
- Prescriptions actives
- Agenda du jour avec détails des patients
- Performance (consultations/semaine, satisfaction)

**Actions rapides**:
- Nouvelle consultation → Créer une consultation
- Nouvelle prescription → Prescrire des médicaments
- Prescrire analyse → Commander une analyse de labo

---

### 5. Patient

**Dashboard**: `/patient/dashboard`

**Vous voyez**:
- Prochains rendez-vous avec compte à rebours
- Nouveaux résultats d'analyses (< 7 jours)
- Ordonnances actives
- Total de vos consultations
- Liste détaillée des rendez-vous futurs
- Résultats récents avec badge "Nouveau"

**Actions rapides**:
- Prendre rendez-vous → Réserver avec un médecin
- Voir résultats → Consulter vos analyses
- Contacter → Assistance médicale
- FAQ → Questions fréquentes

---

## Navigation dans l'Interface

### Menu Latéral (Sidebar)

Chaque module dispose d'un menu de navigation sur le côté gauche :

**Pharmacie** (couleur bleue/cyan):
- Tableau de Bord
- Inventaire
- Ordonnances
- Historique
- Paramètres

**Laboratoire** (couleur verte):
- Dashboard
- File d'attente
- Saisie résultats
- Équipement
- Historique

**Radiologie** (couleur cyan):
- Dashboard
- Prescrire examen
- File d'attente
- Espace de travail
- Visualiseur
- Historique

**Médecin** (couleur bleue):
- Dashboard
- Consultations
- Dossiers patients
- Prescriptions
- Analyses de labo
- Agenda

**Patient** (couleur teal):
- Mon espace santé
- Rendez-vous
- Résultats
- Ordonnances
- Historique
- Profil

---

## Comprendre les KPI Cards

### Code Couleur des Statuts

**Badges de Statut**:
- 🟡 **Jaune** = En attente / À traiter
- 🔵 **Bleu** = En cours / En progression
- 🟢 **Vert** = Terminé / Disponible
- 🟩 **Émeraude** = Validé / Approuvé
- 🔴 **Rouge** = Urgent / Critique
- ⚫ **Gris** = Annulé / Inactif

### Gradients de Couleur des Cartes KPI

Les cartes utilisent des dégradés pour une meilleure lisibilité :
- **Bleu** → Informations générales, inventaire
- **Rouge** → Alertes, urgences, stocks critiques
- **Orange** → Avertissements, expirations prochaines
- **Violet** → Ordonnances, prescriptions
- **Vert** → Valeurs financières, succès
- **Teal** → Activités du jour, performance
- **Cyan** → Commandes, achats
- **Indigo** → Taux, pourcentages

---

## Alertes et Notifications

### Bannières d'Alerte

Certains dashboards affichent des bannières en haut si une action est requise :

**Exemple Pharmacie**:
```
⚠️ Attention: 5 médicament(s) en stock bas
   → Voir les médicaments concernés
```

### Badge de Notification

Le nombre non lu apparaît sur l'icône de cloche (🔔) en haut à droite.

### Types de Notifications

- **Urgences** → Bordure rouge, son d'alerte
- **Informations** → Bordure bleue
- **Succès** → Bordure verte
- **Avertissements** → Bordure orange

---

## Filtres et Recherche

### Filtres de Période (Dashboard Financier)

Si disponible, vous pouvez filtrer par :
- Aujourd'hui
- Cette semaine
- Ce mois
- Ce trimestre
- Cette année
- Personnalisé (plage de dates)

### Recherche dans les Tableaux

La plupart des tableaux incluent une barre de recherche :
- Recherche par nom de patient
- Recherche par numéro d'ordonnance
- Recherche par date
- Recherche par statut

---

## Actions Rapides Courantes

### Depuis le Dashboard Pharmacie

1. **Dispenser une ordonnance**:
   - Cliquer sur "Traiter Ordonnances"
   - Sélectionner l'ordonnance
   - Vérifier les médicaments disponibles
   - Marquer comme dispensée

2. **Vérifier un stock bas**:
   - Cliquer sur la carte "Stock Bas"
   - Voir la liste des médicaments concernés
   - Créer une commande de réapprovisionnement

### Depuis le Dashboard Laboratoire

1. **Traiter une analyse**:
   - Cliquer sur "Voir la file d'attente"
   - Sélectionner l'analyse
   - Marquer comme "En cours"
   - Saisir les résultats
   - Soumettre pour validation

### Depuis le Dashboard Médecin

1. **Voir l'agenda du jour**:
   - Consulter la liste sur le dashboard
   - Cliquer sur un rendez-vous
   - Accéder au dossier patient
   - Créer une consultation

2. **Prescrire rapidement**:
   - Cliquer sur "Nouvelle prescription"
   - Sélectionner le patient
   - Ajouter les médicaments
   - Valider et envoyer

### Depuis le Dashboard Patient

1. **Prendre un rendez-vous**:
   - Cliquer sur "Prendre rendez-vous"
   - Choisir le service médical
   - Sélectionner le médecin
   - Choisir date et heure
   - Confirmer

2. **Consulter un résultat**:
   - Voir les résultats récents
   - Cliquer sur "Voir" à côté du résultat
   - Télécharger le PDF si disponible

---

## Raccourcis Clavier (Si implémentés)

| Touche | Action |
|--------|--------|
| `Ctrl/Cmd + K` | Recherche globale |
| `Ctrl/Cmd + N` | Nouvelle action (selon contexte) |
| `Ctrl/Cmd + S` | Sauvegarder |
| `Esc` | Fermer modal |
| `Tab` | Navigation formulaire |

---

## Troubleshooting Rapide

### Le dashboard ne charge pas

1. Vérifier votre connexion internet
2. Rafraîchir la page (F5)
3. Vider le cache du navigateur
4. Se déconnecter et se reconnecter

### Les statistiques sont à zéro

1. Vérifier que vous êtes bien connecté avec le bon compte
2. Vérifier que des données existent dans le système
3. Consulter la console du navigateur (F12) pour les erreurs

### Permission refusée

1. Vérifier que votre rôle a les bonnes permissions
2. Contacter un administrateur
3. Vérifier dans le simulateur RBAC vos permissions actuelles

### Le dashboard affiche des erreurs

1. Vérifier la console navigateur (F12 → Console)
2. Vérifier que Supabase est accessible
3. Vérifier les permissions RLS sur les tables
4. Contacter le support technique

---

## Astuces et Bonnes Pratiques

### Pour les Pharmaciens

- Consultez le dashboard chaque matin pour voir les stocks bas
- Traitez les ordonnances urgentes en premier (badge rouge)
- Surveillez les expirations à 30 jours pour anticiper

### Pour les Techniciens de Labo

- Priorisez les analyses urgentes (carte rouge)
- Vérifiez la file d'attente régulièrement
- Validez les résultats rapidement pour débloquer les médecins

### Pour les Radiologues

- Consultez la file d'attente au début de chaque vacation
- Priorisez les examens urgents
- Validez les rapports dans les 24h

### Pour les Médecins

- Consultez l'agenda du jour chaque matin
- Traitez les analyses en attente pour débloquer les patients
- Mettez à jour les consultations régulièrement

### Pour les Patients

- Vérifiez vos nouveaux résultats chaque semaine
- Prenez vos rendez-vous à l'avance
- Consultez votre historique médical avant une consultation

---

## Support

### Aide en Ligne

- Documentation complète : Voir `SPECIALIZED_DASHBOARDS_RESTORATION_COMPLETE.md`
- Guide technique : Voir les fichiers `*_IMPLEMENTATION.md`

### Contact

- Support technique : Via le bouton "Contacter" sur le dashboard
- Urgences médicales : Téléphone d'urgence affiché sur l'application
- Questions générales : FAQ accessible depuis chaque dashboard

---

**Version**: 2.0
**Dernière mise à jour**: 26 février 2026
**Statut**: ✅ Opérationnel
