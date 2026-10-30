-- ==============================================================================
-- DATABASE CLEANUP & QUARANTINE PROPOSAL FOR MANAGEMENT / DBA REVIEW
-- Target Database: CanteenFeedbackDB (Azure SQL / SQL Server)
-- Objective: Safely quarantine 5,925 automated penetration scanner records
--            injected on 2026-10-28 without data loss, restoring authentic
--            canteen employee feedback metrics and averages (~3.95/5).
-- ==============================================================================

USE CanteenFeedbackDB;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 1: VERIFY CURRENT COUNTS & RECORD METRICS (READ-ONLY)
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN is_critical = 1 THEN 1 ELSE 0 END) AS total_critical,
    ROUND(AVG(CAST(food_quality AS FLOAT)), 2) AS avg_food_quality,
    ROUND(AVG(CAST(food_taste AS FLOAT)), 2) AS avg_food_taste,
    ROUND(AVG(CAST(food_hygiene AS FLOAT)), 2) AS avg_food_hygiene,
    ROUND(AVG(CAST(staff_behavior AS FLOAT)), 2) AS avg_staff_behavior,
    ROUND(AVG(CAST(overall_rating AS FLOAT)), 2) AS avg_overall
FROM Feedback;
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 2: CREATE A COMPLETE PHYSICAL TABLE BACKUP BEFORE ANY ACTION
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Feedback_Backup_20261028')
BEGIN
    SELECT * INTO Feedback_Backup_20261028 FROM Feedback;
    PRINT '[SUCCESS] Full backup table Feedback_Backup_20261028 created.';
END
ELSE
BEGIN
    PRINT '[INFO] Backup table Feedback_Backup_20261028 already exists.';
END
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 3: PREVIEW SUSPECT SCANNER RECORDS TO BE QUARANTINED (READ-ONLY)
-- Criteria:
--   1. Automated test payloads with comments 'Ty' (5,555 rows) or 'Tr' (266 rows)
--   2. Injected SQL commands in comments or canteen_name ('WAITFOR DELAY', 'PG_SLEEP', 'UNION', 'SELECT')
--   3. Path traversal fuzzing payloads ('etc/passwd')
-- ─────────────────────────────────────────────────────────────────────────────
SELECT 
    COUNT(*) AS suspect_scanner_records_count,
    MIN(id) AS lowest_suspect_id,
    MAX(id) AS highest_suspect_id,
    MIN(created_at) AS earliest_timestamp,
    MAX(created_at) AS latest_timestamp
FROM Feedback
WHERE 
    comments IN ('Ty', 'Tr')
    OR canteen_name LIKE '%SELECT%'
    OR canteen_name LIKE '%CASE%'
    OR canteen_name LIKE '%passwd%'
    OR canteen_name LIKE '%0x%'
    OR comments LIKE '%WAITFOR%'
    OR comments LIKE '%SLEEP%';
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- STEP 4: MOVE SUSPECT RECORDS TO QUARANTINE TABLE (EXECUTE WITH DBA APPROVAL)
-- ─────────────────────────────────────────────────────────────────────────────
/*
BEGIN TRANSACTION;

-- Create Quarantine Table if it does not exist
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Feedback_Quarantined_Scanner_Data')
BEGIN
    SELECT * INTO Feedback_Quarantined_Scanner_Data 
    FROM Feedback 
    WHERE 
        comments IN ('Ty', 'Tr')
        OR canteen_name LIKE '%SELECT%'
        OR canteen_name LIKE '%CASE%'
        OR canteen_name LIKE '%passwd%'
        OR canteen_name LIKE '%0x%'
        OR comments LIKE '%WAITFOR%'
        OR comments LIKE '%SLEEP%';

    DELETE FROM Feedback
    WHERE id IN (SELECT id FROM Feedback_Quarantined_Scanner_Data);

    PRINT '[SUCCESS] Suspect records moved to Feedback_Quarantined_Scanner_Data.';
END;

-- Verify Genuine Employee Records Remaining
SELECT 
    COUNT(*) AS authentic_records_count,
    ROUND(AVG(CAST(food_quality AS FLOAT)), 2) AS authentic_avg_quality,
    ROUND(AVG(CAST(food_taste AS FLOAT)), 2) AS authentic_avg_taste,
    ROUND(AVG(CAST(food_hygiene AS FLOAT)), 2) AS authentic_avg_hygiene,
    ROUND(AVG(CAST(staff_behavior AS FLOAT)), 2) AS authentic_avg_menu,
    ROUND(AVG(CAST(overall_rating AS FLOAT)), 2) AS authentic_avg_overall
FROM Feedback;

-- COMMIT TRANSACTION;
-- ROLLBACK TRANSACTION;
*/
