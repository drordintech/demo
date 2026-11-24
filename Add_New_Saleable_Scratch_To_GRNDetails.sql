-- =====================================================================================
-- Migration Script: Add New, Saleable, and Scratch integer columns to GRNDetails table
-- Database: Drodin (SQL Server)
-- Purpose: Support Breakdown of Passed Quantity into NEW, SALEABLE, and SCRATCH.
-- Validation rule: NEW + SALEABLE + SCRATCH = PASSED
-- Default value: 0 for all three columns
-- Safe & Idempotent: Can be run repeatedly without errors.
-- =====================================================================================

IF DB_ID('Drodin') IS NOT NULL
BEGIN
    USE [Drodin];
END
GO

PRINT 'Starting migration: Adding New, Saleable, Scratch columns to GRNDetails...';

-- 1. Ensure table exists
IF OBJECT_ID(N'dbo.GRNDetails', N'U') IS NOT NULL
BEGIN
    -- ---------------------------------------------------------------------------------
    -- Add [New] column if it does not exist
    -- ---------------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.GRNDetails') 
          AND name = 'New'
    )
    BEGIN
        ALTER TABLE dbo.GRNDetails 
        ADD [New] INT NOT NULL CONSTRAINT DF_GRNDetails_New DEFAULT 0 WITH VALUES;
        PRINT 'Column [New] added successfully to dbo.GRNDetails with DEFAULT 0.';
    END
    ELSE
    BEGIN
        PRINT 'Column [New] already exists in dbo.GRNDetails.';
        -- Ensure any existing NULL values are updated to 0
        EXEC sp_executesql N'UPDATE dbo.GRNDetails SET [New] = 0 WHERE [New] IS NULL;';
    END

    -- ---------------------------------------------------------------------------------
    -- Add [Saleable] column if it does not exist
    -- ---------------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.GRNDetails') 
          AND name = 'Saleable'
    )
    BEGIN
        ALTER TABLE dbo.GRNDetails 
        ADD [Saleable] INT NOT NULL CONSTRAINT DF_GRNDetails_Saleable DEFAULT 0 WITH VALUES;
        PRINT 'Column [Saleable] added successfully to dbo.GRNDetails with DEFAULT 0.';
    END
    ELSE
    BEGIN
        PRINT 'Column [Saleable] already exists in dbo.GRNDetails.';
        -- Ensure any existing NULL values are updated to 0
        EXEC sp_executesql N'UPDATE dbo.GRNDetails SET [Saleable] = 0 WHERE [Saleable] IS NULL;';
    END

    -- ---------------------------------------------------------------------------------
    -- Add [Scratch] column if it does not exist
    -- ---------------------------------------------------------------------------------
    IF NOT EXISTS (
        SELECT 1 
        FROM sys.columns 
        WHERE object_id = OBJECT_ID(N'dbo.GRNDetails') 
          AND name = 'Scratch'
    )
    BEGIN
        ALTER TABLE dbo.GRNDetails 
        ADD [Scratch] INT NOT NULL CONSTRAINT DF_GRNDetails_Scratch DEFAULT 0 WITH VALUES;
        PRINT 'Column [Scratch] added successfully to dbo.GRNDetails with DEFAULT 0.';
    END
    ELSE
    BEGIN
        PRINT 'Column [Scratch] already exists in dbo.GRNDetails.';
        -- Ensure any existing NULL values are updated to 0
        EXEC sp_executesql N'UPDATE dbo.GRNDetails SET [Scratch] = 0 WHERE [Scratch] IS NULL;';
    END

    PRINT 'Migration completed successfully!';
END
ELSE
BEGIN
    PRINT 'WARNING: dbo.GRNDetails table was not found in the current database.';
END
GO

-- Verification query
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'GRNDetails' 
  AND COLUMN_NAME IN ('New', 'Saleable', 'Scratch');
GO
