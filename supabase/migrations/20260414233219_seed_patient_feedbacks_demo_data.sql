/*
  # Seed Patient Feedbacks Demo Data

  ## Overview
  Inserts ~45 realistic patient feedback entries spread over the last 8 weeks.
  Data uses Congolese/French patient names with authentic comments in French.

  ## Distribution
  - ~60% positive ratings (4-5 stars) — reflects generally good care
  - ~25% neutral ratings (3 stars) — room for improvement
  - ~15% negative ratings (1-2 stars) — critical feedback

  ## Notes
  - Uses fixed UUIDs to allow idempotent re-runs (ON CONFLICT DO NOTHING)
  - appointment_id and patient_id set to NULL (standalone feedback entries)
  - submitted_at spread across last 8 weeks for realistic chart data
*/

INSERT INTO patient_feedbacks (id, patient_name, overall_rating, wait_time_rating, reception_rating, comment, submitted_at)
VALUES
  -- Semaine -8 (il y a 8 semaines)
  ('a1000001-0000-0000-0000-000000000001', 'Marie KABILA', 5, 4, 5, 'Accueil exceptionnel, le personnel est très professionnel et attentionné. Je recommande vivement.', now() - interval '55 days'),
  ('a1000001-0000-0000-0000-000000000002', 'Joseph NGANDU', 4, 3, 4, 'Bonne prise en charge globale. Un peu d''attente mais le médecin a bien expliqué mon traitement.', now() - interval '54 days'),
  ('a1000001-0000-0000-0000-000000000003', 'Clarisse MUTOMBO', 2, 1, 2, 'Attente de plus de 2 heures sans information. Les toilettes n''étaient pas propres.', now() - interval '53 days'),
  ('a1000001-0000-0000-0000-000000000004', 'Emmanuel LUMUMBA', 5, 5, 5, 'Service impeccable du début à la fin. Félicitations à toute l''équipe.', now() - interval '52 days'),
  ('a1000001-0000-0000-0000-000000000005', 'Patience MWAMBA', 4, 4, 4, 'Très satisfaite. Le Dr. a pris le temps d''écouter mes préoccupations.', now() - interval '51 days'),

  -- Semaine -7
  ('a1000001-0000-0000-0000-000000000006', 'Pascal TSHISEKEDI', 3, 2, 3, 'Consultation correcte mais l''attente était trop longue. Environ 90 minutes.', now() - interval '47 days'),
  ('a1000001-0000-0000-0000-000000000007', 'Angelique KAZADI', 5, 5, 5, 'Parfait ! Tout s''est très bien passé. Le personnel est souriant et compétent.', now() - interval '46 days'),
  ('a1000001-0000-0000-0000-000000000008', 'Bienvenu LUKAMBA', 4, 4, 5, 'Excellent accueil à la réception. La consultation a été rapide et efficace.', now() - interval '45 days'),
  ('a1000001-0000-0000-0000-000000000009', 'Solange ILUNGA', 1, 1, 2, 'Très déçue. Mon rendez-vous a été annulé sans prévenance. Personnel peu aimable.', now() - interval '44 days'),
  ('a1000001-0000-0000-0000-000000000010', 'Thierry MUSONDA', 4, 3, 4, 'Bon service médical. Le médecin était compétent et à l''écoute. Légère attente.', now() - interval '43 days'),
  ('a1000001-0000-0000-0000-000000000011', 'Fatou DIALLO', 3, 3, 3, 'Service moyen. Rien de particulier à signaler, ni en positif ni en négatif.', now() - interval '42 days'),

  -- Semaine -6
  ('a1000001-0000-0000-0000-000000000012', 'Rodrigue NKOSI', 5, 4, 5, 'Je suis très content de ma visite. Médecin compétent, accueil chaleureux.', now() - interval '40 days'),
  ('a1000001-0000-0000-0000-000000000013', 'Beatrice KALOMBO', 5, 5, 5, 'Incroyable ! Jamais vu un service aussi efficace en RDC. Bravo à l''équipe !', now() - interval '39 days'),
  ('a1000001-0000-0000-0000-000000000014', 'Gerard NZUZI', 2, 2, 3, 'Long délai avant d''être vu. La salle d''attente manque de sièges. À améliorer.', now() - interval '38 days'),
  ('a1000001-0000-0000-0000-000000000015', 'Sylvie MAKIESSE', 4, 4, 4, 'Consultation bien menée. Je suis satisfaite du suivi médical proposé.', now() - interval '37 days'),
  ('a1000001-0000-0000-0000-000000000016', 'Albert TUTA', 3, 2, 4, 'Accueil agréable mais attente trop longue avant la consultation.', now() - interval '36 days'),
  ('a1000001-0000-0000-0000-000000000017', 'Nathalie BWANA', 5, 5, 5, 'Excellente expérience. Le médecin a été très clair et rassurant.', now() - interval '35 days'),

  -- Semaine -5
  ('a1000001-0000-0000-0000-000000000018', 'Christophe MULAMBA', 4, 3, 5, 'Très bien accueillie. La prise en charge est professionnelle et humaine.', now() - interval '33 days'),
  ('a1000001-0000-0000-0000-000000000019', 'Veronique KATUMBA', 1, 1, 1, 'Horrible expérience. Personnel grossier, attente interminable, locaux sales.', now() - interval '32 days'),
  ('a1000001-0000-0000-0000-000000000020', 'Didier MBAYA', 5, 4, 5, 'Service de qualité. Médecin très attentif. Je reviendrai sans hésitation.', now() - interval '31 days'),
  ('a1000001-0000-0000-0000-000000000021', 'Jocelyne MBUYI', 4, 4, 4, 'Bonne consultation. Tout était bien organisé et le personnel très aimable.', now() - interval '30 days'),
  ('a1000001-0000-0000-0000-000000000022', 'Serge KABONGO', 3, 3, 3, 'Service correct sans plus. L''organisation peut être améliorée.', now() - interval '29 days'),
  ('a1000001-0000-0000-0000-000000000023', 'Henriette TSHIBANDA', 5, 5, 5, 'Très bonne expérience ! Médecin compétent, personnel attentionné.', now() - interval '28 days'),

  -- Semaine -4
  ('a1000001-0000-0000-0000-000000000024', 'Fabrice LENGE', 4, 3, 4, 'Consultation satisfaisante. Quelques minutes d''attente mais rien d''excessif.', now() - interval '26 days'),
  ('a1000001-0000-0000-0000-000000000025', 'Martine NGALULA', 5, 5, 5, 'Magnifique ! Le médecin a été très compréhensif et m''a donné tous les détails.', now() - interval '25 days'),
  ('a1000001-0000-0000-0000-000000000026', 'Christian KASONGO', 2, 1, 3, 'Attente trop longue. J''ai attendu 3 heures pour une consultation de 10 minutes.', now() - interval '24 days'),
  ('a1000001-0000-0000-0000-000000000027', 'Odette MUKENDI', 4, 4, 5, 'Personnel très professionnel. Je me suis sentie bien accompagnée tout au long.', now() - interval '23 days'),
  ('a1000001-0000-0000-0000-000000000028', 'Raymond KITENGE', 5, 4, 5, 'Excellent service. Le diagnostic a été clair et le traitement bien expliqué.', now() - interval '22 days'),
  ('a1000001-0000-0000-0000-000000000029', 'Florence BOLAMBA', 3, 2, 4, 'Accueil correct mais l''attente est trop longue pour les consultations.', now() - interval '21 days'),

  -- Semaine -3
  ('a1000001-0000-0000-0000-000000000030', 'Augustin MAKENGO', 5, 5, 5, 'Clinique parfaite ! Propreté, professionnalisme et rapidité au rendez-vous.', now() - interval '19 days'),
  ('a1000001-0000-0000-0000-000000000031', 'Colette NKEMBA', 4, 4, 4, 'Très bonne prise en charge. Je recommande cette clinique à mon entourage.', now() - interval '18 days'),
  ('a1000001-0000-0000-0000-000000000032', 'Daniel NTUMBA', 1, 2, 1, 'Service déplorable. Personne n''était disponible pour m''orienter à mon arrivée.', now() - interval '17 days'),
  ('a1000001-0000-0000-0000-000000000033', 'Rosine KABEYA', 5, 5, 5, 'Je suis très satisfaite. Le médecin était à l''écoute et les soins de qualité.', now() - interval '16 days'),
  ('a1000001-0000-0000-0000-000000000034', 'Fiston MWANGI', 4, 3, 4, 'Bon accueil. Consultation claire et précise. Merci à toute l''équipe.', now() - interval '15 days'),

  -- Semaine -2
  ('a1000001-0000-0000-0000-000000000035', 'Liliane ZOLA', 5, 4, 5, 'Très professionnel. L''infirmière a été très douce lors des soins.', now() - interval '12 days'),
  ('a1000001-0000-0000-0000-000000000036', 'Bruno KASOLWA', 3, 3, 3, 'Rien de particulier à signaler. Service dans la moyenne.', now() - interval '11 days'),
  ('a1000001-0000-0000-0000-000000000037', 'Nadège KILUBA', 5, 5, 5, 'Formidable équipe ! Je suis ressortie rassurée et bien prise en charge.', now() - interval '10 days'),
  ('a1000001-0000-0000-0000-000000000038', 'Herve MUKUNA', 2, 2, 2, 'Attente excessive et manque d''information sur les délais. À améliorer.', now() - interval '9 days'),
  ('a1000001-0000-0000-0000-000000000039', 'Celestine BUKASA', 4, 4, 5, 'Accueil très agréable. Le personnel prend soin des patients avec bienveillance.', now() - interval '8 days'),

  -- Semaine -1 (semaine courante)
  ('a1000001-0000-0000-0000-000000000040', 'Junior KABILA', 5, 5, 5, 'Parfait du début à la fin. Médecin très compétent et personnel bienveillant.', now() - interval '5 days'),
  ('a1000001-0000-0000-0000-000000000041', 'Sandrine MBUJIMAYI', 4, 4, 4, 'Très bonne consultation. Je suis satisfaite de la prise en charge globale.', now() - interval '4 days'),
  ('a1000001-0000-0000-0000-000000000042', 'Patrick MATONDO', 3, 2, 4, 'Accueil sympa mais attente longue. Le médecin était néanmoins très professionnel.', now() - interval '3 days'),
  ('a1000001-0000-0000-0000-000000000043', 'Esther LUMBU', 5, 5, 5, 'Superbe expérience ! Tout était parfaitement organisé. Merci à l''équipe.', now() - interval '2 days'),
  ('a1000001-0000-0000-0000-000000000044', 'Bernadette TSHIMANGA', 4, 3, 5, 'Personnel très attentionné. Quelques minutes d''attente mais tout s''est bien passé.', now() - interval '1 day'),
  ('a1000001-0000-0000-0000-000000000045', 'Olivier NZUZI', 5, 5, 5, 'Excellente clinique ! Je recommande à 100%. Personnel compétent et humain.', now() - interval '6 hours')
ON CONFLICT (id) DO NOTHING;
