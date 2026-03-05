export const CONGOLESE_FIRST_NAMES = {
  male: [
    'Jean', 'Pierre', 'Paul', 'Joseph', 'Emmanuel',
    'Patrick', 'Michel', 'André', 'François', 'Daniel',
    'Robert', 'Jacques', 'Antoine', 'Marc', 'Luc',
    'David', 'Thomas', 'Philippe', 'Charles', 'Georges'
  ],
  female: [
    'Marie', 'Jeanne', 'Anne', 'Thérèse', 'Cécile',
    'Catherine', 'Chantal', 'Françoise', 'Claudine', 'Bernadette',
    'Sylvie', 'Monique', 'Rose', 'Louise', 'Véronique',
    'Nadine', 'Pauline', 'Brigitte', 'Joséphine', 'Marceline'
  ]
};

export const CONGOLESE_LAST_NAMES = [
  'Mukendi', 'Tshala', 'Kabongo', 'Mbuyi', 'Kalala',
  'Mwamba', 'Kasongo', 'Mulamba', 'Ngoy', 'Ilunga',
  'Ntumba', 'Kazembe', 'Tshimanga', 'Luboya', 'Katombe',
  'Mutombo', 'Nkulu', 'Museng', 'Tshibangu', 'Kayembe',
  'Kabila', 'Lumumba', 'Tshisekedi', 'Bemba', 'Katumbi',
  'Moise', 'Vital', 'Félix', 'Laurent', 'Patrice',
  'Etienne', 'Nzanga', 'Kamerhe', 'Fayulu', 'Shadary',
  'Muzito', 'Matata', 'Kengo', 'Ruberwa', 'Gizenga'
];

export function generateCongoleseFullName(): string {
  const isMale = Math.random() > 0.5;
  const firstName = isMale
    ? CONGOLESE_FIRST_NAMES.male[Math.floor(Math.random() * CONGOLESE_FIRST_NAMES.male.length)]
    : CONGOLESE_FIRST_NAMES.female[Math.floor(Math.random() * CONGOLESE_FIRST_NAMES.female.length)];

  const lastName = CONGOLESE_LAST_NAMES[Math.floor(Math.random() * CONGOLESE_LAST_NAMES.length)];

  return `${lastName} ${firstName}`;
}

export function generatePhone(): string {
  const prefixes = ['+243 81', '+243 82', '+243 84', '+243 85', '+243 89', '+243 97', '+243 98', '+243 99'];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const number = Math.floor(1000000 + Math.random() * 9000000);
  return `${prefix} ${number}`;
}

export function generateAddress(): string {
  const avenues = ['Av. Kasavubu', 'Av. Lumumba', 'Av. Tombalbaye', 'Av. Bokassa', 'Av. Wagenia'];
  const communes = ['Gombe', 'Kinshasa', 'Lemba', 'Limete', 'Matete', 'Ngaliema', 'Bandalungwa', 'Kalamu'];

  const avenue = avenues[Math.floor(Math.random() * avenues.length)];
  const number = Math.floor(1 + Math.random() * 500);
  const commune = communes[Math.floor(Math.random() * communes.length)];

  return `${avenue} N°${number}, ${commune}`;
}
