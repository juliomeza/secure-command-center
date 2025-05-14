# PostgreSQL Migration Script
# Add PostgreSQL binaries to PATH
$env:Path += ";C:\Program Files\PostgreSQL\15\bin;C:\Program Files\PostgreSQL\16\bin"

# Create backup directory if it doesn't exist
$backupDir = "C:\temp"
if (-not (Test-Path -Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir
}

# Function to prompt for continuation
function Confirm-Step {
    param($message)
    Write-Host "`n$message" -ForegroundColor Cyan
    $response = Read-Host "Continue? (Y/N)"
    return $response -eq 'Y'
}

# Step 1: Create backup
if (Confirm-Step "Step 1: Create backup of PostgreSQL 15 database") {
    Write-Host "`nCreating backup of PostgreSQL 15 database..."
    $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $backupFile = Join-Path $backupDir "enterprise_portal_pre_migration_${timestamp}.backup"
    
    pg_dump -U postgres -p 5433 -d enterprise_portal -Fc -f $backupFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Backup completed successfully!" -ForegroundColor Green
        Write-Host "Backup file: $backupFile"
    } else {
        Write-Host "Error creating backup!" -ForegroundColor Red
        exit 1
    }

    # Display PostgreSQL versions
    Write-Host "`nCurrent PostgreSQL 15 version:"
    psql -U postgres -p 5433 -d enterprise_portal -c "SELECT version();"

    Write-Host "`nTarget PostgreSQL 16 version:"
    psql -U postgres -p 5432 -d postgres -c "SELECT version();"
}

# Step 2: Create and restore test database
if (Confirm-Step "Step 2: Create test database in PostgreSQL 16 and restore backup") {
    Write-Host "`nCreating test database in PostgreSQL 16..."
    psql -U postgres -p 5432 -c "DROP DATABASE IF EXISTS enterprise_portal_test;"
    psql -U postgres -p 5432 -c "CREATE DATABASE enterprise_portal_test;"

    Write-Host "`nRestoring backup to test database..."
    pg_restore -U postgres -p 5432 -d enterprise_portal_test $backupFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Test database restore completed successfully!" -ForegroundColor Green
    } else {
        Write-Host "Error restoring test database!" -ForegroundColor Red
        exit 1
    }
}

# Step 3: Test the migrated database
if (Confirm-Step "Step 3: Test the migrated database") {
    Write-Host "`nTesting connection to migrated database..."
    psql -U postgres -p 5432 -d enterprise_portal_test -c "SELECT count(*) from information_schema.tables;"
    
    # Add more specific tests here if needed
}

# Step 4: Final Migration
if (Confirm-Step "Step 4: Perform final migration to PostgreSQL 16") {
    Write-Host "`nCreating final database in PostgreSQL 16..."
    psql -U postgres -p 5432 -c "DROP DATABASE IF EXISTS enterprise_portal;"
    psql -U postgres -p 5432 -c "CREATE DATABASE enterprise_portal;"

    Write-Host "`nRestoring backup to final database..."
    pg_restore -U postgres -p 5432 -d enterprise_portal $backupFile

    if ($LASTEXITCODE -eq 0) {
        Write-Host "Final database migration completed successfully!" -ForegroundColor Green
        Write-Host "`nNext steps:"
        Write-Host "1. Update your .env file to use port 5432"
        Write-Host "2. Test your application with the new database"
        Write-Host "3. If everything works, you can stop PostgreSQL 15"
    } else {
        Write-Host "Error in final migration!" -ForegroundColor Red
        exit 1
    }
}
