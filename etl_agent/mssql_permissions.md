# SQL Server Permissions Guide

## Current Table Permissions
Execute the following command in SQL Server Management Studio to grant SELECT permission on specific tables:

```sql
-- Grant SELECT permission on Orders table
GRANT SELECT ON datex_footprint.Orders TO etl_service_user;

-- To grant SELECT permission on additional tables, use the same pattern:
-- GRANT SELECT ON datex_footprint.TableName TO etl_service_user;
```

## Alternative: Schema-Level Permissions
If you decide to grant access to all tables in the schema, you can use this command instead:

```sql
-- Grant SELECT permission on all tables in the schema
GRANT SELECT ON SCHEMA::datex_footprint TO etl_service_user;
```

## Verify Permissions
To verify the current permissions for the ETL user:

```sql
-- Check table-level permissions
SELECT 
    class_desc,
    OBJECT_NAME(major_id) as object_name,
    permission_name,
    state_desc
FROM sys.database_permissions dp
JOIN sys.database_principals dp2 ON dp.grantee_principal_id = dp2.principal_id
WHERE dp2.name = 'etl_service_user';

-- Check schema-level permissions
SELECT 
    dp2.name AS [User],
    dp.class_desc,
    SCHEMA_NAME(major_id) as schema_name,
    permission_name,
    state_desc
FROM sys.database_permissions dp
JOIN sys.database_principals dp2 ON dp.grantee_principal_id = dp2.principal_id
WHERE dp2.name = 'etl_service_user' AND class_desc = 'SCHEMA';
```

## Best Practices
1. Start with minimal permissions (table-level) and expand as needed
2. Document each new table permission added
3. Regularly review and audit permissions
4. Consider using schema-level permissions only when necessary
5. Keep this file updated with any permission changes