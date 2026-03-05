# Accès Rapide - Tableau de Bord Médecins

## 🚀 ÉTAPE 1 : Insérer les Données de Démonstration

**IMPORTANT : Cette étape est obligatoire avant de voir le tableau de bord**

### Via l'interface Supabase :

1. **Ouvrez votre projet Supabase** dans le navigateur
2. Dans le menu de gauche, cliquez sur **SQL Editor**
3. Cliquez sur **+ New Query** (bouton en haut)
4. **Copiez tout le contenu** du fichier :
   ```
   scripts/insert-demo-doctors-okapi-congolais.sql
   ```
5. **Collez** le code SQL dans l'éditeur
6. Cliquez sur le bouton **RUN** (vert, en bas à droite)
7. Attendez quelques secondes jusqu'à voir : **"Success. No rows returned"**

### Ce qui vient d'être créé :

✅ **10 médecins congolais** avec des noms réalistes :
- Dr. Jean Mukendi (Cardiologie)
- Dr. Sarah Kapinga (Pédiatrie)
- Dr. Marie-Louise Nzuji (Gynécologie-Obstétrique)
- Dr. Patrick Bolamba (Médecine Générale - matin)
- Dr. Alice Watuna (Médecine Générale - soir)
- Dr. Robert Kasongo (Chirurgie)
- Dr. Hélène Yowa (Neurologie)
- Dr. David Mutombo (Ophtalmologie)
- Dr. Sophie Kalala (Radiologie)
- Dr. Marc Zola (Urgences 24/7)

✅ **Informations complètes** :
- Téléphones congolais (+243)
- Emails professionnels (@okapiamedical.com)
- Numéros RPPS congolais (RDC-XXX-XXX)
- Spécialisations
- Horaires de travail personnalisés
- Assignations aux départements

---

## 🩺 ÉTAPE 2 : Accéder au Tableau de Bord

### Méthode 1 : Via le Menu (RECOMMANDÉ)

1. **Connectez-vous** à l'application OKAPIA Medical
2. Dans le **menu de gauche**, cherchez l'icône **🩺** (stéthoscope)
3. Cliquez sur **"Médecins Référents"**
4. Le tableau de bord s'affiche !

### Méthode 2 : Via l'URL Directe

Naviguez vers :
```
http://localhost:5173/tableau-de-bord/doctors-dashboard
```

(Remplacez `localhost:5173` par votre URL de production si nécessaire)

---

## 📊 ÉTAPE 3 : Ce que Vous Allez Voir

### A. En-tête du Tableau de Bord
- **Titre** : "Tableau de Bord Médecins"
- **Description** : "Vue d'ensemble de l'activité médicale"
- **Bouton Exporter CSV** (en haut à droite)

### B. Filtres par Département
Cochez les cases pour filtrer :
- ☐ Administration
- ☐ Cardiologie
- ☐ Chirurgie
- ☐ Dentisterie
- ☐ Kinésithérapie
- ☐ Logistique
- ☐ Médecine Générale
- ☐ Orthopédie
- ☐ Pédiatrie

### C. 4 Cards de Métriques Globales

#### 1. 👥 Médecins Actifs
- Nombre total de médecins
- Médecins disponibles actuellement
- Barre de progression verte

#### 2. 📊 Taux d'Occupation
- Pourcentage moyen d'occupation
- Badge de statut :
  - 🟢 **Optimal** (< 60%)
  - 🟠 **Élevé** (60-80%)
  - 🔴 **Critique** (> 80%)

#### 3. 📅 Rendez-vous du Jour
- Total des rendez-vous
- Répartition :
  - **Confirmés** (bleu)
  - **En attente** (orange)
  - **Terminés** (vert)

#### 4. 👤 Patients Suivis
- Nombre total de patients avec médecin référent
- Moyenne de patients par médecin

### D. Liste des Départements (Accordéon)

Chaque département est cliquable et affiche :

**En-tête :**
- 🏥 Icône du département
- Nom du département
- Nombre de médecins

**Tableau détaillé (quand développé) :**

| Médecin | Patients | RDV Aujourd'hui | Taux d'occupation | Note | Statut | Actions |
|---------|----------|-----------------|-------------------|------|--------|---------|
| Avatar + Nom + Spécialité | Nombre | Aujourd'hui / Semaine | Barre de progression % | ★ Note / Total consultations | Badge couleur | 📅 ✉️ 📞 |

**Badges de statut :**
- 🟢 **Disponible** (vert)
- 🔵 **En consultation** (bleu)
- 🔴 **Indisponible** (rouge)

**Boutons d'action :**
- 📅 **Planning** : Voir le calendrier du médecin
- ✉️ **Email** : Envoyer un email
- 📞 **Téléphone** : Appeler directement

### E. Barre de Recherche
- Recherche en temps réel
- Filtrage par nom ou spécialité
- Résultats instantanés

---

## ✅ ÉTAPE 4 : Vérifier que Tout Fonctionne

### Test 1 : Vérifier les Médecins dans Supabase

Exécutez cette requête SQL :

```sql
SELECT
  up.full_name as "Nom",
  ms.specialization as "Spécialité",
  d.name as "Département",
  up.phone as "Téléphone",
  ms.rpps_number as "RPPS"
FROM user_profiles up
JOIN medical_staff ms ON ms.id = up.id
LEFT JOIN doctor_departments dd ON dd.doctor_id = up.id AND dd.is_primary = true
LEFT JOIN departments d ON d.id = dd.department_id
WHERE up.role = 'doctor'
ORDER BY up.full_name;
```

**Résultat attendu :** 10 lignes avec tous les médecins

### Test 2 : Filtrer par Département

1. Sur le tableau de bord, cochez **"Cardiologie"**
2. Seul **Dr. Jean Mukendi** devrait apparaître
3. Décochez "Cardiologie"
4. Cochez **"Pédiatrie"**
5. Seul **Dr. Sarah Kapinga** devrait apparaître

### Test 3 : Rechercher un Médecin

1. Dans la barre de recherche, tapez **"Jean"**
2. Dr. Jean Mukendi apparaît
3. Tapez **"Cardio"**
4. Dr. Jean Mukendi apparaît aussi (recherche par spécialité)
5. Tapez **"Urgence"**
6. Dr. Marc Zola apparaît

### Test 4 : Développer un Département

1. Cliquez sur **"Médecine Générale"**
2. Le tableau se développe
3. Vous voyez 5 médecins :
   - Dr. Marie-Louise Nzuji (Gynécologie)
   - Dr. Patrick Bolamba (Médecine Générale)
   - Dr. Alice Watuna (Médecine Générale)
   - Dr. Hélène Yowa (Neurologie)
   - Dr. David Mutombo (Ophtalmologie)
   - Dr. Sophie Kalala (Radiologie)
   - Dr. Marc Zola (Urgences)

### Test 5 : Exporter en CSV

1. Cliquez sur **"Exporter CSV"** (en haut à droite)
2. Un fichier `medecins-rapport-2026-02-13.csv` se télécharge
3. Ouvrez-le dans Excel ou LibreOffice
4. Vérifiez les colonnes :
   - ID
   - Nom Complet
   - Email
   - Téléphone
   - Département
   - Spécialité
   - Accepte Patients
   - Note Moyenne
   - Total Consultations

---

## 🔍 Dépannage Rapide

### Problème : "Aucun médecin disponible"

**Solution :**
1. Vérifiez que le script SQL a été exécuté
2. Exécutez cette requête pour compter :
   ```sql
   SELECT COUNT(*) FROM medical_staff;
   ```
   Résultat attendu : au moins 10

### Problème : Le menu "Médecins Référents" n'apparaît pas

**Solutions :**
1. Vérifiez que vous êtes connecté
2. Vérifiez votre rôle dans `user_profiles`
3. Rôles ayant accès :
   - `hospital_admin`
   - `super_admin`
   - `doctor`
   - `nurse`
   - `receptionist`

### Problème : Page blanche ou erreur 404

**Solutions :**
1. Vérifiez l'URL : `/tableau-de-bord/doctors-dashboard`
2. Actualisez la page (F5)
3. Videz le cache du navigateur (Ctrl+Shift+R)
4. Vérifiez la console (F12) pour des erreurs

### Problème : Les statistiques affichent 0

**Causes possibles :**
1. Aucun rendez-vous n'a été créé aujourd'hui
2. Aucun patient n'a de médecin référent assigné
3. Base de données vide

**Solution :**
- Les médecins s'affichent quand même
- Les statistiques se mettront à jour quand vous créerez des rendez-vous

---

## 🎯 Prochaines Étapes

Une fois que le tableau de bord fonctionne :

### 1. Assigner des Médecins Référents aux Patients

Utilisez le composant `DepartmentDoctorCascadeSelector` dans vos formulaires :

```tsx
import DepartmentDoctorCascadeSelector from '@/components/appointments/DepartmentDoctorCascadeSelector';

<DepartmentDoctorCascadeSelector
  selectedDepartmentId={departmentId}
  selectedDoctorId={doctorId}
  onDepartmentChange={setDepartmentId}
  onDoctorChange={(id, name) => {
    setDoctorId(id);
    setDoctorName(name);
  }}
  required
/>
```

### 2. Prendre des Rendez-vous

Utilisez le calendrier interactif :

```tsx
import InteractiveAppointmentCalendar from '@/components/appointments/InteractiveAppointmentCalendar';

<InteractiveAppointmentCalendar
  doctorId={doctorId}
  doctorName={doctorName}
  selectedDate={date}
  selectedTime={time}
  onDateTimeSelect={(d, t) => {
    setDate(d);
    setTime(t);
  }}
/>
```

### 3. Exporter des Données Patient avec Médecin

Les exports PDF et Excel incluent maintenant automatiquement :
- Nom du médecin référent
- Spécialité
- Département
- Téléphone
- Email

### 4. Créer Plus de Médecins

Modifiez le fichier `scripts/insert-demo-doctors-okapi-congolais.sql` :
- Ajoutez d'autres médecins
- Changez les spécialisations
- Personnalisez les horaires
- Réexécutez le script

---

## 📚 Documentation Complémentaire

Pour aller plus loin :

1. **Documentation complète** :
   - `MODULE_MEDECINS_REFERENTS_DOCUMENTATION.md`
   - 21 pages avec tous les détails techniques

2. **Guide de démarrage** :
   - `GUIDE_DEMARRAGE_RAPIDE_MEDECINS.md`
   - Exemples de code et cas d'usage

3. **Données démonstration** :
   - `src/data/demo-doctors.json`
   - Format JSON pour référence

---

## 📞 Support

### Console de Développement

Si vous avez des erreurs :

1. Ouvrez la console (F12)
2. Allez dans l'onglet **Console**
3. Cherchez les messages d'erreur en rouge
4. Notez le message et le fichier concerné

### Logs Supabase

Pour vérifier les requêtes SQL :

1. Dans Supabase Dashboard
2. Allez dans **Logs** → **API**
3. Filtrez par statut 400-500 pour voir les erreurs
4. Vérifiez les requêtes SQL exécutées

### Créer une Issue

Si le problème persiste :

1. Créez une issue GitHub avec :
   - Description du problème
   - Étapes pour reproduire
   - Captures d'écran
   - Messages d'erreur (console + Supabase)
   - Version du navigateur

---

**Document créé le 13 Février 2026**
**Version 1.0.0 - Système de Gestion des Médecins Référents**
**© 2026 OKAPIA Medical - Tous droits réservés**
