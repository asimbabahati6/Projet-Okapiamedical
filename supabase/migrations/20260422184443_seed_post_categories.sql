/*
  # Seed post categories

  Inserts the 5 default post categories for the news management system.
  Uses ON CONFLICT DO NOTHING to be idempotent.
*/

INSERT INTO post_categories (name, description, name_en, name_ar)
VALUES
  ('innovation',   'Innovations médicales et technologies de pointe',            'Medical innovations and cutting-edge technologies', 'الابتكارات الطبية والتقنيات المتطورة'),
  ('événement',    'Événements, conférences et actualités de l''hôpital',        'Events, conferences and hospital news',            'الفعاليات والمؤتمرات وأخبار المستشفى'),
  ('produit',      'Nouveaux produits et services médicaux',                     'New medical products and services',                'المنتجات والخدمات الطبية الجديدة'),
  ('actualité',    'Actualités générales et informations importantes',           'General news and important information',           'الأخبار العامة والمعلومات المهمة'),
  ('santé',        'Conseils de santé et prévention',                            'Health tips and prevention',                       'نصائح صحية والوقاية')
ON CONFLICT DO NOTHING;
