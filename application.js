const express = require('express');
const mysql = require('mysql');
const dbConfig = require('./dbConfig'); // Adjust the path accordingly

const bodyParser = require('body-parser');


const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // I changed to extended:true 
app.use(express.static(__dirname));


// Establish a database connection
const db = mysql.createConnection(dbConfig);

// Connect to the MySQL database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    process.exit(1); // Terminate the application on connection error
  }

  console.log('Connected to MySQL database');
});


// ===============First Page To Load Should be Login.html===========//
app.get('/', (req, res) => {
  res.sendFile(__dirname+'/login.html');
});

//============Register endpoint=====================
app.post('/register', async (req, res) => {
 
  const { username, password, confirmPassword } = req.body;

  // First we test if there is an existing user with same name


   result = db.query(`SELECT * FROM users WHERE username = "${username}";`, function (err, result, fields) {
    if (err) throw err;
    if (result.length > 0) {
      res.status(409).json({ success: false, message: 'Username already exists' });
    }else{
      addNewUser()
      async function addNewUser(){
        try {
          // Hash the password before storing it
      
      
      
          // Store the user in the database
          const result = await db.query('INSERT INTO users (username, password_hash) VALUES (?, ?)', [username, password]);
      
          console.log({ success: true, message: 'Registration successful' });
          // Here we save the name of the user on session and send back to the client
         
          res.redirect('/index.html');
        } catch (error) {
            res.status(500).json({ success: false, message: 'Internal server error' });
          }
      }
    }
  
  });
  
    
  }
);


//===============Login endpoint=============
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(req.body)

  try {

    // Check if the user exists in the database and test for errors 
    result = db.query(`SELECT * FROM users WHERE username = "${username}";`, function (err, result, fields) {
      if (err) throw err;
      console.log(result.length)
      if (result.length > 0) {
        if(password === result[0].password_hash){
          res.status(200).json({ success: true, message: 'Successfull login' });
        }else{
           // We clear the localStorage
           res.status(401).json({ success: false, message: 'Password incorrect' });
        }
       

      } else {
        // User not found
        res.status(404).json({ success: false, message: 'User not found' });

      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});



app.post('/update', (req, res) => {
  const { id, name, description, color, image_url, model_url } = req.body;
console.log(req.body)
  // Check if the name exists in the database
  db.query('SELECT * FROM furniture_table WHERE name = ?', [name], (err, result) => {
    console.log(result)
    if (err) {
      console.error(err);
      res.status(500).send('Error querying the database');
      return;
    }

    if (result.length > 0) {
      
      // Name exists in the database, update the existing record
      const updateQuery = 'UPDATE furniture_table SET description = ?, color = ?, image_url = ?, model_url = ? WHERE name = ?';
      db.query(updateQuery, [description, color, image_url, model_url, name], (updateErr) => {
        if (updateErr) {
          console.error(updateErr);
          res.status(500).send('Error updating database');
        } else {
          console.log('Record updated in the database');
          //res.send('Record updated successfully');
          res.status(200).json({ success: true, message: 'Successfull update' });
        }
      });
    } else {
      // Name doesn't exist in the database, insert a new record
      const insertQuery = 'INSERT INTO furniture_table (name, description, color, image_url, model_url) VALUES (?, ?, ?, ?, ?)';
      db.query(insertQuery, [name, description, color, image_url, model_url], (insertErr) => {
        if (insertErr) {
          console.error(insertErr);
          res.status(500).send('Error inserting into the database');
        } else {
          console.log('Record inserted into the database');
          //res.send('Record inserted successfully');
          res.status(200).json({ success: true, message: 'Successfull insert' });

        }
      });
    }
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});