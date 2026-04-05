-- ============================================================
-- Canteen Feedback System - SQL Server Schema
-- Database: CanteenFeedbackDB
-- Server: localhost\SQLEXPRESS01 (Windows Authentication)
-- ============================================================

CREATE DATABASE CanteenFeedbackDB;
GO

USE CanteenFeedbackDB;
GO

-- ============================================================
-- Table: Canteen
-- ============================================================
CREATE TABLE Canteen (
    id          INT IDENTITY(1,1) PRIMARY KEY,
    name        NVARCHAR(100) NOT NULL,
    location    NVARCHAR(200) NOT NULL,
    created_at  DATETIME DEFAULT GETDATE()
);
GO

-- ============================================================
-- Table: Feedback
-- ============================================================
CREATE TABLE Feedback (
    id              INT IDENTITY(1,1) PRIMARY KEY,
    canteen_id      INT FOREIGN KEY REFERENCES Canteen(id),
    canteen_name    NVARCHAR(100),
    meal_type       NVARCHAR(20)  NOT NULL,    -- Breakfast / Lunch / Dinner
    food_quality    INT           NOT NULL,    -- 1-5 stars
    food_taste      INT           NOT NULL,    -- 1-5 stars
    food_hygiene    INT           NOT NULL,    -- 1-5 stars
    staff_behavior  INT           NOT NULL,    -- 1-5 stars
    hospitality     INT           NOT NULL,    -- 1-5 stars
    comments        NVARCHAR(500),             -- optional free text
    feedback_date   DATE          DEFAULT CAST(GETDATE() AS DATE),  -- hidden in UI
    created_at      DATETIME      DEFAULT GETDATE()                 -- hidden in UI
);
GO

-- ============================================================
-- Constraints: Star ratings must be between 1 and 5
-- ============================================================
ALTER TABLE Feedback ADD CONSTRAINT chk_food_quality   CHECK (food_quality   BETWEEN 1 AND 5);
ALTER TABLE Feedback ADD CONSTRAINT chk_food_taste      CHECK (food_taste      BETWEEN 1 AND 5);
ALTER TABLE Feedback ADD CONSTRAINT chk_food_hygiene    CHECK (food_hygiene    BETWEEN 1 AND 5);
ALTER TABLE Feedback ADD CONSTRAINT chk_staff_behavior  CHECK (staff_behavior  BETWEEN 1 AND 5);
ALTER TABLE Feedback ADD CONSTRAINT chk_hospitality     CHECK (hospitality     BETWEEN 1 AND 5);
ALTER TABLE Feedback ADD CONSTRAINT chk_meal_type       CHECK (meal_type IN ('Breakfast', 'Lunch', 'Dinner'));
GO

-- ============================================================
-- Seed Data: Default canteen
-- ============================================================
INSERT INTO Canteen (name, location)
VALUES ('Main Canteen', 'Ground Floor, Block A');
GO

-- ============================================================
-- Verify
-- ============================================================
SELECT * FROM Canteen;
GO
