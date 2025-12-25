
const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const bcrypt = require('bcrypt');
const session = require("express-session");

const app = express();
const port = 3000;
 

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public"))); // Serve static files
app.use(bodyParser.urlencoded({ extended: true }));


// MySQL Database Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Dubey@123',
  database: 'studentmanagement',
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err.message);
    process.exit(1);
  }
  console.log("Connected to MySQL Database!");
});

// Set up multer storage for file uploads
const storage = multer.diskStorage({
  destination: './public/uploads', // Folder to store uploaded files
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Create unique filenames
  },
});



// Define the upload middleware
const upload = multer({ storage });

// Serve pages
app.get("/StaffLogin", (req, res) => {
  res.sendFile(path.join(__dirname, "./public", "Faculty/StaffLogin.html"));
});

app.get("/Staff", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Faculty/Staff.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Student/register.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Student/login.html"));
});

app.get("/HallCreate",(req,res) => {
  res.sendFile(path.join(__dirname,"public","Faculty/HallTicket/Hall.html"))
})

app.get("/about",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","About/about.html"));
})

app.get("/contact",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","Contact/base.html"));
})


app.get("/Placement",(req,res)=>{
  res.sendFile(path.join(__dirname,"public","Placement/placed.html"));
})

app.get("/Card", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Faculty/IDCard/Card.html"));
});

// Serve the collection page
app.get('/Collection', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Faculty/IDCard/index.html'));
});

// Serve the search page for ID Cards
app.get('/Search', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Student/S_IdCard/search.html'));
});



// Register a new student (POST request)
app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  try {
    const uniqueId = "STU" + Math.floor(1000 + Math.random() * 9000);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const sql =
      "INSERT INTO Student (unique_id, name, email, password) VALUES (?, ?, ?, ?)";
    db.query(sql, [uniqueId, name, email, passwordHash], (err) => {
      if (err) {
        console.error("Database Error:", err.message);
        return res.status(500).json({ error: "Failed to register user" });
      }

      res.status(201).json({ message: "User registered successfully", uniqueId });

    });
  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: "Server error" });
  }
});


// Login Route
app.use(session({
  secret: "your_secret_key",
  resave: false,
  saveUninitialized: false,
  cookie: { 
      secure: false, // Change to `true` in production with HTTPS
      httpOnly: true, // Prevents XSS attacks
      maxAge: 5 * 60 * 1000 // Session expires after 30 minutes
  }
}));

app.post("/login", (req, res) => {
  const { uniqueId, password } = req.body;

  if (!uniqueId || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  const sql = "SELECT * FROM Student WHERE unique_id = ?";
  db.query(sql, [uniqueId], async (err, results) => {
    if (err) {
      console.error("Database Error:", err.message);
      return res.status(500).json({ error: "Login failed" });
    }
    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = results[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // ✅ Store user info in session
    req.session.user = { id: user.unique_id, name: user.name };

    res.status(200).json({
      message: "Login successful",
      redirectUrl: "/student",
      name: user.name,
    });
  });
});

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) { 
      next(); // User is authenticated, proceed
  } else {
      res.status(401).json({ error: "Unauthorized Access. Please log in." });
  }
};

// Protect student route
app.get("/student", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "Student/student.html"));
});

// Logout Button

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
      if (err) {
          return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid"); // Clear session cookie
      res.status(200).json({ message: "Logged out successfully" });
  });
});


//***** Hall-Ticket Creation *******/

// ***** POST Route to Create Hall Ticket *****

app.post("/HallCreate", upload.single("photo"), (req, res) => {
  try {
      const { name, studentId, subjects, examDates } = req.body;
      const photoPath = req.file ? req.file.filename : null;

      // Validate required fields
      if (!name || !studentId || !subjects || !examDates || !photoPath) {
          return res.status(400).json({ message: "All fields are required!" });
      }

      // Convert JSON Strings to Arrays
      let subjectList, examDateList;
      try {
          subjectList = JSON.parse(subjects);
          examDateList = JSON.parse(examDates);
      } catch (error) {
          return res.status(400).json({ message: "Invalid subjects or examDates format" });
      }

      // Ensure subjects and exam dates match
      if (subjectList.length !== examDateList.length) {
          return res.status(400).json({ message: "Subjects and exam dates count mismatch!" });
      }

      // Insert Student Info into Hall table
      const sqlStudent = "INSERT INTO Hall (student_id, student_name, photo_path) VALUES (?, ?, ?)";
      db.query(sqlStudent, [studentId, name, photoPath], (err, result) => {
          if (err) {
              console.error("Database error:", err);
              return res.status(500).json({ message: "Database error" });
          }

          const studentDbId = result.insertId; // Get the inserted student's ID

          // Insert Subjects & Exam Dates into ExamSchedule
          const sqlSubjects = "INSERT INTO ExamSchedule (student_id, subject_name, exam_date) VALUES ?";
          const values = subjectList.map((subj, index) => [studentId, subj, examDateList[index]]);

          db.query(sqlSubjects, [values], (err) => {
              if (err) {
                  console.error("Failed to save exam details:", err);
                  return res.status(500).json({ message: "Failed to save exam details" });
              }
              res.json({ message: "Hall Ticket Created Successfully!" });
          });
      });
  } catch (error) {
      console.error("Unexpected Error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
  }
});


/*** Hall Ticket ****/

app.get('/Tsearch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Student/HallStudent/StuHall.html'));
});

 

// Fetch Hall Ticket
app.get('/search-HT', (req, res) => {
    const { studentId } = req.query;  

    if (!studentId) {
        return res.send("<h1>Student ID is required!</h1>");
    }

    console.log("Received Student ID:", studentId);

    const query = `
        SELECT h.student_id, h.student_name, h.photo_path, e.subject_name, e.exam_date 
        FROM Hall h
        LEFT JOIN ExamSchedule e ON h.student_id = e.student_id
        WHERE h.student_id = ?`;

    db.query(query, [studentId], (err, results) => {
        if (err) {
            console.error('Query Error:', err);
            return res.status(500).send('<h1>Database Error</h1>');
        }

        if (results.length === 0) {
            return res.status(404).send('<h1>No Data Found for Student</h1>');
        }

        const student = results[0];
        const subjects = results.map(row => {
            const formattedDate = new Date(row.exam_date).toDateString(); // Formats to "Day Mon DD YYYY"
            return `<tr><td>${row.subject_name}</td><td>${formattedDate}</td></tr>`;
        }).join('');

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Exam Hall Ticket</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; margin: 20px; }
                    .ticket { width: 60%; margin: auto; padding: 20px; border: 2px solid #333; }
                    img { width: 100px; height: 100px; border-radius: 50%; }
                    table { width: 100%; margin-top: 20px; border-collapse: collapse; }
                    th, td { border: 1px solid #333; padding: 10px; text-align: left; }
                    th { background: #ddd; }
                </style>
            </head>
            <body>
                <div class="ticket">
                    <h1>Hall Ticket</h1>
                    <img src="./uploads/${student.photo_path}" alt="Student Photo">
                    <p><strong>Student ID:</strong> ${student.student_id}</p>
                    <p><strong>Name:</strong> ${student.student_name}</p>
                    <h3>Exam Schedule</h3>
                    <table>
                        <tr><th>Subject</th><th>Exam Date</th></tr>
                        ${subjects}
                    </table>
                </div>
            </body>
            </html>
        `);
    });
});

//*** Id-Card ****/

// ID Card Generation (POST request)
app.post('/Card', upload.single('photo'), (req, res) => {
  const { full_name, email, phone, dob } = req.body;

  // Check if all fields are present
  if (!full_name || !email || !phone || !dob || !req.file) {
    return res.status(400).send('All fields are required, including the photo.');
  }

  // Store the photo path
  const photoPath = `/uploads/${req.file.filename}`;

  // SQL query to insert data into IDCard2 table
  const sql = 'INSERT INTO IDCard2 (full_name, email, phone, dob, photo_path) VALUES (?, ?, ?, ?, ?)';

  db.query(sql, [full_name, email, phone, dob, photoPath], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Database error occurred.');
    }
    res.send('Student data successfully added!');
  });
});

// Fetch all ID cards (GET request)
app.get('/Cards', (req, res) => {
  const sql = 'SELECT * FROM IDCard2';

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Database error occurred.');
    }
    res.json(results); // Return the data as JSON
  });
});

// Fetch a specific student's ID card by phone number (GET request)
app.get('/Card/:phone', (req, res) => {
  const { phone } = req.params;

  // SQL query to fetch a student's data based on the phone number
  const sql = 'SELECT * FROM IDCard2 WHERE phone = ?';

  db.query(sql, [phone], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Database error occurred.');
    }

    if (results.length === 0) {
      return res.status(404).send('No student found with the provided phone number.');
    }

    res.json(results[0]); // Return the student's data as JSON
  });
});

// Create necessary directories if they don't exist
if (!fs.existsSync('./public/uploads')) {
  fs.mkdirSync('./public/uploads', { recursive: true });
}


//****** Result Insertion ********/

// Serve the marks input form (Submit Marks Page)
app.get('/marks', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Faculty/ResultC/marks.html'));
});

// Handle form submission for entering student marks
app.post('/submit-marks', (req, res) => {
  const { studentId, studentName, subject1, marks1, subject2, marks2, subject3, marks3, subject4, marks4, subject5, marks5 } = req.body;

  if (!studentId || !studentName || !subject1 || !marks1 || !subject2 || !marks2 || !subject3 || !marks3 || !subject4 || !marks4 || !subject5 || !marks5) {
    return res.status(400).send('All fields are required.');
  }

  // Calculate total and percentage
  const totalMarks = parseInt(marks1) + parseInt(marks2) + parseInt(marks3) + parseInt(marks4) + parseInt(marks5);
  const percentage = (totalMarks / 500) * 100;

  // Insert into database
  const query = `INSERT INTO marks (student_id, student_name, subject1, marks1, subject2, marks2, subject3, marks3, subject4, marks4, subject5, marks5, total_marks, percentage) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [studentId, studentName, subject1, marks1, subject2, marks2, subject3, marks3, subject4, marks4, subject5, marks5, totalMarks, percentage], (err, result) => {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).send('Database error.');
    }
    res.send(`Marks submitted successfully! Total Marks: ${totalMarks}, Percentage: ${percentage.toFixed(2)}%`);
  });
});


//******* Exam Result ********/ 

// Serve the search page (Result Search Page)
app.get('/Rsearch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Student/Result/Result.html'));
});


// Handle search by student ID
app.post('/search-result', (req, res) => {
  const { studentId } = req.body;

  if (!studentId) {
    return res.status(400).send('Student ID is required.');
  }

  // Query the database for the student by ID
  const query = 'SELECT * FROM marks WHERE student_id = ?';
  db.query(query, [studentId], (err, results) => {
    if (err) {
      console.error('Error fetching data:', err);
      return res.status(500).send('Database error.');
    }

    if (results.length === 0) {
      return res.send('No results found for the given Student ID.');
    }

    const student = results[0];
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Student Result</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            padding: 20px;
          }
          h1 {
            text-align: center;
            color: #333;
          }
          table {
            width: 80%;
            margin: 20px auto;
            border-collapse: collapse;
            text-align: left;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
          th, td {
            padding: 12px;
            border: 1px solid #ddd;
          }
          th {
            background-color: #f4f4f4;
          }
          tr:hover {
            background-color: #f9f9f9;
          }
        </style>
      </head>
      <body>
        <h1>Student Result</h1>
        <table>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Student ID</td>
            <td>${student.student_id}</td>
          </tr>
          <tr>
            <td>Student Name</td>
            <td>${student.student_name}</td>
          </tr>
          <tr>
            <td>${student.subject1}</td>
            <td>${student.marks1}</td>
          </tr>
          <tr>
            <td>${student.subject2}</td>
            <td>${student.marks2}</td>
          </tr>
          <tr>
            <td>${student.subject3}</td>
            <td>${student.marks3}</td>
          </tr>
          <tr>
            <td>${student.subject4}</td>
            <td>${student.marks4}</td>
          </tr>
          <tr>
            <td>${student.subject5}</td>
            <td>${student.marks5}</td>
          </tr>
          <tr>
            <td>Total Marks</td>
            <td>${student.total_marks}</td>
          </tr>
          <tr>
            <td>Percentage</td>
            <td>${student.percentage.toFixed(2)}%</td>
          </tr>
        </table>
      </body>
      </html>
    `);
  });
});



// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});





