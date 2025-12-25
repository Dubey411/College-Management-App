-- Create the database
CREATE DATABASE StudentManagement;

-- Use the database
USE StudentManagement;

-- Create the Student table
CREATE TABLE IF NOT EXISTS Student (
    id INT AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE IDCard2 (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  dob DATE NOT NULL,
  photo_path VARCHAR(255) NOT NULL
);


CREATE TABLE marks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id VARCHAR(255) NOT NULL,
  student_name VARCHAR(255) NOT NULL,
  subject1 VARCHAR(255) NOT NULL,
  marks1 INT NOT NULL,
  subject2 VARCHAR(255) NOT NULL,
  marks2 INT NOT NULL,
  subject3 VARCHAR(255) NOT NULL,
  marks3 INT NOT NULL,
  subject4 VARCHAR(255) NOT NULL,
  marks4 INT NOT NULL,
  subject5 VARCHAR(255) NOT NULL,
  marks5 INT NOT NULL,
  total_marks INT NOT NULL,
  percentage FLOAT NOT NULL
);



CREATE TABLE Hall (
   student_id VARCHAR(255) NOT NULL PRIMARY KEY,
   student_name VARCHAR(255) NOT NULL,
   photo_path VARCHAR(255) NOT NULL
);

CREATE TABLE ExamSchedule (
   id INT AUTO_INCREMENT PRIMARY KEY,
   student_id VARCHAR(255) NOT NULL,
   subject_name VARCHAR(255) NOT NULL,
   exam_date DATE NOT NULL,
   FOREIGN KEY (student_id) REFERENCES Hall(student_id) ON DELETE CASCADE
);



USE studentmanagement;

SELECT * FROM Hall;

SELECT * FROM examschedule;
-- select * from IDCard2;
DROP TABLE Hall;
