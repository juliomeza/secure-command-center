-- Prueba de la consulta Projects
SELECT *
FROM datex_footprint.Projects
WHERE id IN (295, 329, 474, 437);

-- Prueba de la consulta DataCard con el mejor formato (similar a nuestro ETL)
-- Reemplazar 2025, 18, '14,20' con valores válidos para tu entorno
SELECT
    d.warehouseId,
    d.warehouseOrder,
    d.warehouse,
    d.section,
    d.listOrder,
    d.description,
    -- Formateo de valores según tipo
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d1, '0')
        WHEN d.totalPorc = 1 THEN d.d1
        WHEN d.vText = 1 THEN d.d1
        ELSE d.d1
    END AS day1_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d2, '0')
        WHEN d.totalPorc = 1 THEN d.d2
        WHEN d.vText = 1 THEN d.d2
        ELSE d.d2
    END AS day2_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d3, '0')
        WHEN d.totalPorc = 1 THEN d.d3
        WHEN d.vText = 1 THEN d.d3
        ELSE d.d3
    END AS day3_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d4, '0')
        WHEN d.totalPorc = 1 THEN d.d4
        WHEN d.vText = 1 THEN d.d4
        ELSE d.d4
    END AS day4_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d5, '0')
        WHEN d.totalPorc = 1 THEN d.d5
        WHEN d.vText = 1 THEN d.d5
        ELSE d.d5
    END AS day5_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d6, '0')
        WHEN d.totalPorc = 1 THEN d.d6
        WHEN d.vText = 1 THEN d.d6
        ELSE d.d6
    END AS day6_value,
    CASE 
        WHEN d.tInt = 1 THEN ISNULL(d.d7, '0')
        WHEN d.totalPorc = 1 THEN d.d7
        WHEN d.vText = 1 THEN d.d7
        ELSE d.d7
    END AS day7_value,
    -- Calculando el total cuando es posible
    CASE
        WHEN d.tInt = 1 AND ISNULL(d.totalPorc, 0) = 0 
            AND ISNUMERIC(ISNULL(d.d1, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d2, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d3, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d4, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d5, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d6, 0)) = 1 
            AND ISNUMERIC(ISNULL(d.d7, 0)) = 1 
        THEN CONVERT(VARCHAR, CONVERT(INT, ISNULL(d.d1, 0)) + CONVERT(INT, ISNULL(d.d2, 0)) 
            + CONVERT(INT, ISNULL(d.d3, 0)) + CONVERT(INT, ISNULL(d.d4, 0)) 
            + CONVERT(INT, ISNULL(d.d5, 0)) + CONVERT(INT, ISNULL(d.d6, 0)) 
            + CONVERT(INT, ISNULL(d.d7, 0)))
        ELSE NULL
    END AS total,
    -- Indicadores de tipo
    ISNULL(d.tInt, 0) AS is_integer,
    ISNULL(d.totalPorc, 0) AS is_percentage,
    ISNULL(d.vText, 0) AS is_text,
    -- Metadatos adicionales útiles
    ISNULL(d.title, 0) AS is_title,
    ISNULL(d.heatColors, 0) AS has_heat_colors
FROM KPower_BI.RHL_DataCard_Reports(2025, 18, '14,20') d
WHERE ISNULL(d.projectDetails, 0) = 0;

-- Prueba con un solo warehouse
SELECT
    d.warehouseId,
    d.warehouse,
    d.section,
    d.description,
    -- Solo algunos campos clave para análisis rápido
    CASE WHEN d.tInt = 1 THEN ISNULL(d.d1, '0') ELSE d.d1 END AS day1_value,
    CASE WHEN d.tInt = 1 THEN ISNULL(d.d2, '0') ELSE d.d2 END AS day2_value,
    ISNULL(d.tInt, 0) AS is_integer,
    ISNULL(d.totalPorc, 0) AS is_percentage,
    ISNULL(d.vText, 0) AS is_text
FROM KPower_BI.RHL_DataCard_Reports(2025, 18, '1') d
WHERE ISNULL(d.projectDetails, 0) = 0;

-- Prueba sin filtro de warehouse (todos los warehouses)
SELECT COUNT(*) as total_records
FROM KPower_BI.RHL_DataCard_Reports(2025, 18, NULL) d
WHERE ISNULL(d.projectDetails, 0) = 0;