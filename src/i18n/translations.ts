export type Language = 'fr';

export interface TranslationKeys {
  common: {
    home: string;
    services: string;
    appointments: string;
    news: string;
    about: string;
    contact: string;
    login: string;
    logout: string;
    dashboard: string;
    my_account: string;
    loading: string;
    back_to_home: string;
  };
  home: {
    hero_cta: string;
    mission_title: string;
    mission_text: string;
    services_title: string;
    why_choose_1: string;
    why_choose_2: string;
    why_choose_3: string;
    why_choose_4: string;
  };
  auth: {
    email: string;
    password: string;
    sign_in: string;
    sign_in_error: string;
    forgot_password: string;
    no_account: string;
    have_account: string;
  };
  contact: {
    title: string;
    your_name: string;
    your_email: string;
    your_phone: string;
    subject: string;
    message: string;
    message_title: string;
    send_message: string;
    success_message: string;
    error_message: string;
    address: string;
    phone: string;
    email: string;
  };
  doctors: {
    title: string;
    specialization: string;
    experience: string;
    consultation_fee: string;
  };
  appointments: {
    phone: string;
  };
  biometricCheckIn: {
    title: string;
    subtitle: string;
    scan_finger: string;
    place_finger: string;
    scanning: string;
    success: string;
    welcome_back: string;
    error: string;
    try_again: string;
    not_enrolled: string;
    no_credentials: string;
    use_alternative: string;
  };
  patientRegistration: {
    title: string;
    subtitle: string;
    personalInfo: string;
    medicalInfo: string;
    identityDocs: string;
    biometric: string;
    validation: string;
    steps: string;
    success: string;
  };
}

export const translations: TranslationKeys = {
  common: {
    home: 'Accueil',
    services: 'Services',
    appointments: 'Rendez-vous',
    news: 'Actualites',
    about: 'A propos',
    contact: 'Contact',
    login: 'Connexion',
    logout: 'Deconnexion',
    dashboard: 'Tableau de bord',
    my_account: 'Mon compte',
    loading: 'Chargement...',
    back_to_home: 'Retour a l\'accueil',
  },
  home: {
    hero_cta: 'Prendre rendez-vous',
    mission_title: 'Notre Mission',
    mission_text: 'OKAPIA Medical offre des soins de sante de qualite, accessibles a tous, avec une equipe medicale devouee et des equipements modernes.',
    services_title: 'Nos Services',
    why_choose_1: 'Equipe medicale qualifiee',
    why_choose_2: 'Equipements de pointe',
    why_choose_3: 'Soins personnalises',
    why_choose_4: 'Disponibilite 24h/24',
  },
  auth: {
    email: 'Adresse e-mail',
    password: 'Mot de passe',
    sign_in: 'Se connecter',
    sign_in_error: 'Identifiants incorrects. Veuillez reessayer.',
    forgot_password: 'Mot de passe oublie ?',
    no_account: 'Pas encore de compte ?',
    have_account: 'Deja un compte ?',
  },
  contact: {
    title: 'Contactez-nous',
    your_name: 'Votre nom',
    your_email: 'Votre e-mail',
    your_phone: 'Votre telephone',
    subject: 'Sujet',
    message: 'Message',
    message_title: 'Envoyez-nous un message',
    send_message: 'Envoyer le message',
    success_message: 'Votre message a ete envoye avec succes.',
    error_message: 'Une erreur est survenue. Veuillez reessayer.',
    address: 'Adresse',
    phone: 'Telephone',
    email: 'E-mail',
  },
  doctors: {
    title: 'Nos Medecins',
    specialization: 'Specialisation',
    experience: 'Experience',
    consultation_fee: 'Frais de consultation',
  },
  appointments: {
    phone: 'Telephone',
  },
  biometricCheckIn: {
    title: 'Pointage Biometrique',
    subtitle: 'Placez votre doigt sur le lecteur pour pointer',
    scan_finger: 'Scanner l\'empreinte',
    place_finger: 'Placez votre doigt',
    scanning: 'Scan en cours...',
    success: 'Pointage enregistre avec succes',
    welcome_back: 'Bienvenue',
    error: 'Erreur lors du pointage',
    try_again: 'Reessayer',
    not_enrolled: 'Empreinte non enregistree',
    no_credentials: 'Aucune donnee biometrique trouvee',
    use_alternative: 'Utiliser une methode alternative',
  },
  patientRegistration: {
    title: 'Inscription Patient',
    subtitle: 'Remplissez le formulaire pour vous inscrire',
    personalInfo: 'Informations personnelles',
    medicalInfo: 'Informations medicales',
    identityDocs: 'Documents d\'identite',
    biometric: 'Donnees biometriques',
    validation: 'Validation',
    steps: 'Etapes',
    success: 'Inscription reussie ! Votre dossier patient a ete cree.',
  },
};
