-- ============================================================
-- 003_seed.sql  –  Equipment categories, models & portfolio
-- ============================================================

-- ── Equipment Categories ──────────────────────────────────────
insert into equipment_categories (slug, name_en, name_ar, description_en, description_ar, icon, sort_order)
values
  ('bulldozers',        'Bulldozers',          'الجرافات',             'Heavy-duty bulldozers for earthmoving and site clearance.',          'جرافات ثقيلة لأعمال الحفريات وتسوية الأراضي.',             '🏗️', 1),
  ('wheel-loaders',     'Wheel Loaders',        'اللوادر الإطارية',     'Six wheel loader models for aggregate handling and site loading.',   'ستة طرازات للوادر لمناولة الركام وتحميل الموقع.',          '🚛', 2),
  ('excavators',        'Excavators',           'الحفارات',             'Hydraulic excavators for trenching and urban site work.',            'حفارات هيدروليكية للحفر وأعمال المواقع الحضرية.',          '⛏️', 3),
  ('backhoe-loaders',   'Backhoe Loaders',      'اللوادر الخلفية',      'Versatile backhoe loaders for trenching and backfilling.',          'لوادر خلفية متعددة الاستخدام للحفر والردم.',               '🔧', 4),
  ('telehandlers',      'Telehandlers',         'الرافعات التلسكوبية',  'Telehandler boom trucks for upper-floor material placement.',        'رافعات تلسكوبية لرفع المواد إلى الأدوار العليا.',          '🏢', 5),
  ('tower-lights',      'Tower Lights',         'أبراج الإضاءة',        'Mobile lighting towers for night-shift construction work.',          'أبراج إضاءة متنقلة لأعمال البناء في الوردية الليلية.',    '💡', 6),
  ('power-generators',  'Power Generators',     'مولدات الطاقة',        'CAT and Perkins diesel generators from 25 to 600 kilowatts.',        'مولدات ديزل كاتربيلر وبيركنز من ٢٥ إلى ٦٠٠ كيلوواط.',  '⚡', 7);

-- ── Bulldozers ────────────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, v.model, v.brand, v.specs::jsonb, 'available'
from equipment_categories c,
(values
  ('Komatsu D475', 'Komatsu',     '{"operating_weight_kg":108000,"engine_power_kw":410,"blade_capacity_m3":37.6}'),
  ('CAT D9N',      'Caterpillar', '{"operating_weight_kg":49574,"engine_power_kw":305,"blade_type":"Semi-U"}'),
  ('CAT D8K',      'Caterpillar', '{"operating_weight_kg":38102,"engine_power_kw":180,"blade_capacity_m3":12.5}'),
  ('Komatsu D155', 'Komatsu',     '{"operating_weight_kg":37000,"engine_power_kw":162,"blade_capacity_m3":10.4}')
) as v(model, brand, specs)
where c.slug = 'bulldozers';

-- ── Wheel Loaders ─────────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, v.model, v.brand, v.specs::jsonb, 'available'
from equipment_categories c,
(values
  ('CAT 966E',  'Caterpillar', '{"bucket_capacity_m3":3.1,"engine_power_kw":185,"operating_weight_kg":20412}'),
  ('CAT 950E',  'Caterpillar', '{"bucket_capacity_m3":2.5,"engine_power_kw":132,"operating_weight_kg":16329}'),
  ('CAT 928G',  'Caterpillar', '{"bucket_capacity_m3":2.0,"engine_power_kw":110,"operating_weight_kg":13154}'),
  ('CAT 926E',  'Caterpillar', '{"bucket_capacity_m3":1.8,"engine_power_kw":97, "operating_weight_kg":12566}'),
  ('CAT 910',   'Caterpillar', '{"bucket_capacity_m3":1.2,"engine_power_kw":66, "operating_weight_kg":8530}'),
  ('XCMG 958',  'XCMG',        '{"bucket_capacity_m3":3.0,"engine_power_kw":162,"operating_weight_kg":18600}')
) as v(model, brand, specs)
where c.slug = 'wheel-loaders';

-- ── Excavators ────────────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, 'CAT 320', 'Caterpillar',
  '{"operating_weight_kg":20000,"engine_power_kw":103,"max_dig_depth_m":6.27,"bucket_capacity_m3":0.97}'::jsonb,
  'available'
from equipment_categories c where c.slug = 'excavators';

-- ── Backhoe Loaders ───────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, 'JCB 3CX', 'JCB',
  '{"engine_power_kw":74,"operating_weight_kg":8460,"max_dig_depth_m":5.97,"loader_capacity_m3":1.0}'::jsonb,
  'available'
from equipment_categories c where c.slug = 'backhoe-loaders';

-- ── Telehandlers ──────────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, 'Telehandler Boom Truck', 'Mixed',
  '{"max_reach_m":14,"rated_capacity_kg":3500}'::jsonb,
  'available'
from equipment_categories c where c.slug = 'telehandlers';

-- ── Tower Lights ──────────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, '10m Mobile Tower Light', 'Mixed',
  '{"mast_height_m":10,"lamps":4,"lamp_wattage_w":1000,"coverage_m2":5000}'::jsonb,
  'available'
from equipment_categories c where c.slug = 'tower-lights';

-- ── Power Generators ──────────────────────────────────────────
insert into equipment (category_id, model_name, brand, specs, status)
select c.id, v.model, v.brand, v.specs::jsonb, 'available'
from equipment_categories c,
(values
  ('CAT 25 kW Generator',     'Caterpillar', '{"rated_kw":25, "fuel":"diesel","config":"soundproofed"}'),
  ('Perkins 100 kW Generator','Perkins',     '{"rated_kw":100,"fuel":"diesel","config":"open"}'),
  ('CAT 250 kW Generator',    'Caterpillar', '{"rated_kw":250,"fuel":"diesel","config":"soundproofed"}'),
  ('CAT 400 kW Generator',    'Caterpillar', '{"rated_kw":400,"fuel":"diesel","config":"open"}'),
  ('Perkins 600 kW Generator','Perkins',     '{"rated_kw":600,"fuel":"diesel","config":"open"}')
) as v(model, brand, specs)
where c.slug = 'power-generators';

-- ── Portfolio Projects ────────────────────────────────────────
insert into projects_portfolio (name_en, name_ar, category, owner, location, area_sqm, featured)
values
  ('Residential Area – Al Sagr',              'منطقة سكنية – الصقر',                   'residential', 'Hani Abu Al-Farj',              'Jeddah – Al Sagr',                    2940,  true),
  ('Residential Area – Al Nuzlah Al Sharqia', 'منطقة سكنية – النزلة الشرقية',           'residential', 'Muhammad Abu Al-Farj',          'Jeddah – Al Nuzlah Al Sharqia',       null,  false),
  ('Residential Area – 20 Villas',            'منطقة سكنية – ٢٠ فيلا',                  'residential', 'Eng. Talal Al Ameer',           'Jeddah – Al Johara Al Mohammadiah',   7200,  true),
  ('Mosque – Al Rawdah',                      'مسجد – الروضة',                           'commercial',  'Private Owner',                 'Jeddah – Al Rawdah',                  null,  false),
  ('Petrol Station – Al Nahda',               'محطة وقود – النهضة',                      'commercial',  'Al Qahtani Holding Group',      'Jeddah – Al Nahda',                   null,  true),
  ('Commercial Center – Tahliyah Street',     'مركز تجاري – شارع التحلية',               'commercial',  'Private Owner',                 'Jeddah – Tahliyah Street',            null,  true),
  ('GRC Decorative Works – Al Amir Fawaz',    'أعمال GRC الزخرفية – حي الأمير فواز',    'commercial',  'Multiple Clients',              'Jeddah – Al Amir Fawaz District',     null,  false),
  ('Commercial Offices – Kutbi Street',       'مكاتب تجارية – شارع كتبي',               'commercial',  'Private Owner',                 'Jeddah – Kutbi Street',               null,  false),
  ('Building Maintenance Contract – CBD',     'عقد صيانة مباني – وسط المدينة',           'maintenance', 'Multiple Building Owners',      'Jeddah – Central Business District',  null,  false);
