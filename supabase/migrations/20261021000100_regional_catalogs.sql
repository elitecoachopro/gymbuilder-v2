CREATE OR REPLACE FUNCTION public.catalog_market(country text) RETURNS text
LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT CASE
    WHEN normalized IN ('', 'unknown', 'necunoscut', 'other', 'altele') THEN NULL
    WHEN normalized IN ('romania', 'ro', 'rou') THEN 'romania'
    WHEN normalized = ANY (ARRAY[
      'afghanistan','afganistan','af','afg','armenia','am','arm','azerbaijan','azerbaidjan','az','aze',
      'bahrain','bh','bhr','bangladesh','bd','bgd','bhutan','bt','btn','brunei','bn','brn',
      'cambodia','cambodgia','kh','khm','china','cn','chn','cyprus','cipru','cy','cyp',
      'georgia','ge','geo','hong kong','hong kong sar china','hk','hkg','india','in','ind','indonesia','indonezia','id','idn',
      'iran','ir','irn','iraq','irak','iq','irq','israel','il','isr','japan','japonia','jp','jpn',
      'jordan','iordania','jo','jor','kazakhstan','kazahstan','kz','kaz','kuwait','kuweit','kw','kwt',
      'kyrgyzstan','kargazstan','kg','kgz','laos','la','lao','lebanon','liban','lb','lbn',
      'macao','macao sar china','macau','mo','mac','malaysia','malaezia','my','mys','maldives','maldive','mv','mdv',
      'mongolia','mn','mng','myanmar','myanmar (burma)','burma','mm','mmr','nepal','np','npl',
      'north korea','coreea de nord','kp','prk','oman','om','omn','pakistan','pk','pak',
      'palestine','palestinian territories','palestina','ps','pse','philippines','filipine','ph','phl','qatar','qa','qat',
      'saudi arabia','arabia saudita','sa','sau','singapore','sg','sgp',
      'south korea','coreea de sud','korea','republic of korea','kr','kor','sri lanka','lk','lka',
      'syria','siria','sy','syr','taiwan','tw','twn','tajikistan','tadjikistan','tj','tjk',
      'thailand','thailanda','th','tha','timor-leste','east timor','timorul de est','tl','tls',
      'turkey','turkiye','turcia','tr','tur','turkmenistan','tm','tkm',
      'united arab emirates','emiratele arabe unite','uae','ae','are','uzbekistan','uz','uzb',
      'vietnam','viet nam','vn','vnm','yemen','ye','yem'
    ]) THEN 'asia'
    ELSE 'rest-of-world'
  END
  FROM (SELECT translate(lower(trim(coalesce(country, ''))), 'ăâîșşțţü', 'aaissttu') AS normalized) value;
$$;
REVOKE ALL ON FUNCTION public.catalog_market(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.catalog_market(text) TO service_role;

CREATE OR REPLACE VIEW public.public_catalog_products WITH (security_invoker = true) AS
SELECT product.*, brand.name AS brand_name,
       supplier.country AS supplier_country, public.catalog_market(supplier.country) AS market,
       brand.country AS brand_country
FROM public.products product
JOIN public.supplier_profiles supplier ON supplier.id = product.supplier_id AND supplier.status = 'approved'
LEFT JOIN public.brands brand ON brand.id = product.brand_id
WHERE product.status IN ('active', 'featured');

CREATE OR REPLACE VIEW public.public_supplier_directory WITH (security_invoker = true) AS
SELECT id, company_name, country, city, website, phone, description, logo_url,
       status, plan, verified, created_at, public.catalog_market(country) AS market
FROM public.supplier_profiles WHERE status = 'approved';
REVOKE ALL ON public.public_supplier_directory FROM anon, authenticated;
GRANT SELECT ON public.public_supplier_directory TO service_role;
