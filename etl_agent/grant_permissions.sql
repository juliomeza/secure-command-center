-- Script para otorgar permisos al usuario ETL sobre la función RHL_DataCard_Reports
-- Este script ha sido actualizado con la sintaxis correcta para funciones con valor de tabla

USE FootPrint;
GO

-- Otorgar permiso SELECT sobre el esquema KPower_BI (necesario para funciones con valor de tabla)
GRANT SELECT ON SCHEMA::KPower_BI TO [etl_service_user];
GO

-- Otorgar permiso SELECT específico para la función RHL_DataCard_Reports (TVF)
GRANT SELECT ON [KPower_BI].[RHL_DataCard_Reports] TO [etl_service_user];
GO

-- Para funciones con valor de tabla, no se usa EXECUTE sino REFERENCES
-- si necesitamos permisos adicionales
GRANT REFERENCES ON [KPower_BI].[RHL_DataCard_Reports] TO [etl_service_user];
GO

-- Verificar que los permisos se hayan aplicado correctamente
SELECT 
    prin.name AS [User],
    obj.name AS [Object],
    perm.permission_name AS [Permission]
FROM sys.database_permissions perm
INNER JOIN sys.database_principals prin ON perm.grantee_principal_id = prin.principal_id
INNER JOIN sys.objects obj ON perm.major_id = obj.object_id
WHERE obj.name = 'RHL_DataCard_Reports' AND prin.name = 'etl_service_user';