# Guide Rapide de Démarrage - Système Clinique Kinshasa

## Démarrage Rapide en 5 Minutes

### 1. Connexion au Système

1. Ouvrez votre navigateur et accédez à l'application
2. Connectez-vous avec vos identifiants
3. Le tableau de bord s'affiche automatiquement

### 2. Configuration Initiale (Administrateurs)

#### Étape 1: Configurer le Taux de Change
1. Cliquez sur **"Taux de Change"** dans le menu
2. Saisissez le taux USD/CDF du jour
3. Validez

#### Étape 2: Ajouter des Employés
1. Allez dans **"Employés"**
2. Cliquez sur **"Ajouter un Employé"**
3. Remplissez les informations:
   - Matricule
   - Nom et prénom
   - Téléphone
   - Poste
   - Date d'embauche
4. Cochez "Personnel Médical" si applicable
5. Enregistrez

#### Étape 3: Créer un Contrat
1. Dans **"Contrats"**, créez un nouveau contrat
2. Sélectionnez l'employé
3. Définissez:
   - Type de contrat
   - Dates
   - Salaire de base (CDF)
   - Allocations de transport et logement
4. Sauvegardez

#### Étape 4: Lancer la Paie
1. Allez dans **"Paie"**
2. Cliquez sur **"Nouvelle Période de Paie"**
3. Définissez:
   - Nom (ex: "Salaire Janvier 2025")
   - Dates de début et fin
   - Date de paiement
4. Le système calcule automatiquement:
   - Salaires bruts
   - Cotisations CNSS (5% + 13%)
   - IPR selon le barème
   - Salaires nets
5. Validez

### 3. Utilisation Quotidienne

#### Pour les Administrateurs RH

**Gérer les Employés**:
- Tableau de bord → Employés
- Rechercher, filtrer, modifier
- Ajouter des documents

**Traiter la Paie**:
- Vérifier les périodes créées
- Générer les bulletins
- Marquer comme payé

**Gérer les Horaires**:
- Afficher le calendrier
- Assigner les gardes
- Confirmer les présences

#### Pour les Réceptionnistes

**Gérer les Assurances**:
- Consulter les assureurs
- Vérifier les couvertures
- Traiter les vouchers

#### Pour les Pharmaciens

**Gérer l'Inventaire**:
- Vérifier les alertes de péremption
- Ajouter de nouveaux lots
- Suivre les stocks

## Comprendre le Système de Paie

### Exemple de Calcul

**Employé**: Jean MBALA
**Salaire de Base**: 1 000 000 CDF
**Allocation Transport**: 200 000 CDF
**Allocation Logement**: 300 000 CDF

**Calcul**:
1. **Salaire Brut** = 1 000 000 + 200 000 + 300 000 = **1 500 000 CDF**

2. **CNSS Employé** (5%) = 1 500 000 × 0.05 = **75 000 CDF**

3. **Revenu Imposable** = 1 500 000 - 75 000 = **1 425 000 CDF**

4. **IPR** (Tranche 2):
   - Base: 15 720 CDF
   - + (1 425 000 - 524 000) × 10% = 90 100 CDF
   - Total IPR = **105 820 CDF**

5. **Salaire Net** = 1 500 000 - 75 000 - 105 820 = **1 319 180 CDF**

6. **CNSS Employeur** (13%) = 1 500 000 × 0.13 = **195 000 CDF**

### Barème IPR Simplifié

| Salaire Mensuel | Taux IPR |
|----------------|----------|
| 0 - 524K CDF | 3% |
| 524K - 1.4M CDF | 10% |
| 1.4M - 2.9M CDF | 20% |
| 2.9M - 5.7M CDF | 30% |
| 5.7M+ CDF | 40% |

## Alertes Importantes

### Alertes RH
- **Rouge**: Contrat expire dans moins de 10 jours
- **Orange**: Contrat expire dans 30 jours
- **Vert**: Tout est normal

### Alertes Pharmacie
- **Critique**: Médicament expire dans 30 jours
- **Haute**: Médicament expire dans 60 jours
- **Moyenne**: Médicament expire dans 90 jours

## Navigation Rapide

| Module | Raccourci | Description |
|--------|-----------|-------------|
| Tableau de Bord | Home | Vue d'ensemble |
| Employés | Alt+E | Gestion RH |
| Paie | Alt+P | Salaires |
| Horaires | Alt+H | Gardes |
| Assurances | Alt+A | Mutuelles |

## Résolution Problèmes Courants

### "Aucun taux de change actif"
**Solution**: Allez dans Taux de Change et ajoutez le taux du jour

### "Le calcul de paie échoue"
**Solution**: Vérifiez que:
1. L'employé a un contrat actif
2. Le contrat contient le salaire de base
3. Le taux de change est configuré

### "Les horaires ne s'affichent pas"
**Solution**: Vérifiez que l'employé est marqué comme "Personnel Médical"

## Astuces

1. **Mise à Jour Quotidienne**: Mettez à jour le taux de change chaque matin
2. **Backup Hebdomadaire**: Exportez les données importantes
3. **Vérification Mensuelle**: Avant la paie, vérifiez tous les contrats
4. **Alertes**: Consultez le tableau de bord chaque jour

## Support

En cas de problème:
1. Consultez ce guide
2. Vérifiez les alertes système
3. Contactez l'administrateur système
4. Documentation complète: `DRC_CLINIC_SYSTEM_GUIDE.md`

---

**Bon courage dans la gestion de votre clinique!**
