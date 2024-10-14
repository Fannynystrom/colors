import mysql from 'mysql2';
import dotenv from 'dotenv'; 

dotenv.config();

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// kontrollera anslutningen
connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL: ', err);
    return;
  }
  console.log('Connected to MySQL database!'); 
});

export default connection;
