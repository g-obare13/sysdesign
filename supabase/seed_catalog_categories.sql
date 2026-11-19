-- Idempotent seed for public.catalog_categories
-- Matches initial CATEGORY_STYLE presets in src/types/diagram.ts

insert into public.catalog_categories (
  id, label, color, bg, border, text_color, pill,
  dark_color, dark_bg, dark_border, dark_text_color, dark_pill,
  is_active, sort_order
)
values
  ('microservice',  'Microservices', '#2B5B7A', '#F2F6F9', '#C9D8E2', '#1E3F54', '#E6EFF5', '#78A9C8', '#15222C', '#243A4A', '#D9E8F2', '#1C2E3C', true, 1),
  ('cloud',         'Cloud Infra',   '#3B6E5C', '#F2F7F5', '#C7DDD5', '#264A3E', '#E5EFEA', '#70B098', '#14241F', '#233D34', '#D5EBE2', '#1B3029', true, 2),
  ('database',      'Databases',     '#9A6B3B', '#F9F6F1', '#E4D6C3', '#664625', '#F2EAE0', '#D4A36A', '#261E14', '#403221', '#F2E4D2', '#33281B', true, 3),
  ('frontend',      'Frontend',      '#7A4E6D', '#F8F4F7', '#DFCED9', '#523349', '#EFE6EC', '#C08EB0', '#241821', '#3D2938', '#EEDCE8', '#30202C', true, 4),
  ('networking',    'Networking',    '#2F7270', '#F1F7F7', '#C4DEDC', '#1E4C4B', '#E3EFEF', '#6EB5B2', '#132424', '#213D3C', '#D4ECEB', '#1A302F', true, 5),
  ('security',      'Security',      '#A84A44', '#FAF3F2', '#E6CBC9', '#70302C', '#F4E5E4', '#D97E78', '#281615', '#452624', '#F5DAD8', '#361E1C', true, 6),
  ('observability', 'Observability', '#52568A', '#F4F4F9', '#CECEE2', '#35385C', '#E8E9F3', '#9296C9', '#191A28', '#2B2D45', '#DFE0F2', '#222336', true, 7),
  ('ai',            'AI / ML',       '#365C94', '#F2F5FA', '#C8D5E8', '#233D63', '#E5ECF5', '#7BA3DC', '#151E2B', '#24344B', '#D9E5F5', '#1C283A', true, 8),
  ('devops',        'DevOps',        '#4E5B66', '#F4F6F7', '#D1D7DC', '#333C44', '#E9ECEF', '#94A3B0', '#181D21', '#2B333A', '#E1E6EA', '#21272C', true, 9),
  ('flow',          'Interactions',  '#55635D', '#F4F6F5', '#D0D8D4', '#38423D', '#E8ECEA', '#92A39B', '#181E1B', '#2A332F', '#E0E7E4', '#202724', true, 10),
  ('shape',         'Shapes',        '#5A626A', '#F5F6F7', '#D4D8DC', '#3B4046', '#EAECEF', '#9BA3AB', '#1A1C1F', '#2E3237', '#E3E6E8', '#23262A', true, 11),
  ('c4',            'C4 Model',      '#2B4657', '#F3F6F7', '#CBD6DC', '#1C2E3A', '#E6ECEF', '#8FB3C9', '#141D24', '#243440', '#DCE7EE', '#1B2730', true, 12)
on conflict (id) do update set
  label = excluded.label,
  color = excluded.color,
  bg = excluded.bg,
  border = excluded.border,
  text_color = excluded.text_color,
  pill = excluded.pill,
  dark_color = excluded.dark_color,
  dark_bg = excluded.dark_bg,
  dark_border = excluded.dark_border,
  dark_text_color = excluded.dark_text_color,
  dark_pill = excluded.dark_pill,
  is_active = excluded.is_active,
  sort_order = excluded.sort_order;
