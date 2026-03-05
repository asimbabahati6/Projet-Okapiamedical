# Guide Rapide - Modification de Prescriptions

## Pour les Médecins

### Comment modifier une de vos prescriptions

1. **Accédez au module Ordonnances**
   - Cliquez sur "Ordonnances" dans le menu latéral

2. **Identifiez vos prescriptions modifiables**
   - Seules vos prescriptions avec le statut "En attente" peuvent être modifiées
   - Un bouton crayon bleu ✏️ apparaît dans la colonne "Actions"

3. **Ouvrez le formulaire de modification**
   - Cliquez sur l'icône crayon ✏️
   - Le modal "Modifier l'ordonnance n°..." s'ouvre

4. **Éléments verrouillés (non modifiables)**
   - N° Prescription
   - Patient
   - Date de création
   - Médecin prescripteur

5. **Éléments modifiables**
   - Diagnostic
   - Date d'expiration
   - Liste des médicaments
   - Notes additionnelles

6. **Modifier les médicaments**
   - **Ajouter**: Cliquez sur "+ Ajouter un médicament"
   - **Modifier**: Changez directement les valeurs dans les champs
   - **Supprimer**: Cliquez sur l'icône poubelle (confirmation demandée)

7. **Enregistrer les modifications**
   - Cliquez sur "Enregistrer les Modifications"
   - Un message de confirmation s'affiche
   - La liste des prescriptions se rafraîchit automatiquement

### Restrictions importantes

❌ **Vous ne pouvez PAS modifier**:
- Les prescriptions déjà dispensées
- Les prescriptions expirées
- Les prescriptions annulées
- Les prescriptions d'autres médecins

✅ **Vous pouvez SEULEMENT modifier**:
- Vos propres prescriptions
- Avec le statut "En attente"

## Pour les Administrateurs

### Privilèges étendus

En tant qu'administrateur, vous pouvez:
- ✅ Modifier **toutes** les prescriptions en attente (même celles d'autres médecins)
- ✅ Voir toutes les prescriptions du système
- ✅ Accéder aux logs d'audit complets

### Même restrictions de statut

❌ Même les administrateurs **ne peuvent pas** modifier:
- Les prescriptions déjà dispensées
- Les prescriptions expirées
- Les prescriptions annulées

> Cette restriction garantit l'intégrité des données médicales conformément aux normes légales.

## Pour les Pharmaciens

### Droits limités

En tant que pharmacien, vous:
- ✅ Pouvez **voir** toutes les prescriptions
- ✅ Pouvez **dispenser** les prescriptions en attente
- ❌ **Ne pouvez pas** modifier les prescriptions

Le bouton "Modifier" n'est pas visible dans votre interface.

## Messages d'erreur courants

| Message | Signification | Action |
|---------|---------------|--------|
| "Cette prescription a déjà été dispensée" | La prescription ne peut plus être modifiée | Créer une nouvelle prescription si nécessaire |
| "Prescription expirée" | La date de validité est dépassée | Créer une nouvelle prescription |
| "Vous n'avez pas les droits" | Prescription d'un autre médecin | Contacter l'administrateur si nécessaire |
| "Veuillez remplir tous les champs obligatoires" | Formulaire incomplet | Vérifier les champs marqués d'un * rouge |

## Traçabilité

### Audit automatique

Chaque modification est automatiquement enregistrée avec:
- 👤 Qui a modifié
- 🕐 Quand (date et heure exactes)
- 📝 Quoi (détails des changements)
- 📊 Valeurs avant/après modification

Ces informations sont conservées pour la conformité légale et peuvent être consultées par les administrateurs.

## Raccourcis et astuces

### Validation rapide

- Tous les champs marqués d'un astérisque rouge (*) sont obligatoires
- Au moins un médicament doit être prescrit
- La date d'expiration doit être dans le futur

### Annulation rapide

- Cliquez sur "Annuler" ou sur le X en haut à droite pour fermer sans sauvegarder
- Aucune modification ne sera appliquée

### Suppression de médicament

1. Cliquez sur l'icône poubelle rouge
2. Une confirmation s'affiche
3. Cliquez "Confirmer la suppression" ou "Annuler"

## Support

Pour toute question ou problème:
- Contactez votre administrateur système
- Consultez la documentation complète: `PRESCRIPTION_EDIT_IMPLEMENTATION.md`

## Résumé des permissions

| Rôle | Créer | Modifier ses propres | Modifier toutes | Voir | Dispenser |
|------|-------|----------------------|-----------------|------|-----------|
| Médecin | ✅ | ✅ | ❌ | ✅ | ❌ |
| Directeur Médical | ✅ | ✅ | ✅ | ✅ | ❌ |
| Médecin Chef de Staff | ❌ | ❌ | ✅ | ✅ | ❌ |
| Pharmacien | ❌ | ❌ | ❌ | ✅ | ✅ |
| Administrateur | ✅ | ✅ | ✅ | ✅ | ✅ |

---

**Version**: 1.0
**Date**: Janvier 2025
**Système**: OKAPIA Medical ERP v2.0
