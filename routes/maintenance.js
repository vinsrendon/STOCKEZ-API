const express = require("express")
const router = express.Router()
const {exec,spawn} = require('child_process')
const fs = require('fs')
const path = require('path')
const BACKUP_DIR = path.join(process.cwd(), 'backups')
const {verifyToken} = require('./verify.js')
const mysql = require('mysql2/promise')
const dotenv = require('dotenv')
const mysqldump = require('mysqldump')

dotenv.config()

router.get("/backup" ,verifyToken, async (req,res) => {  
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR)
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(BACKUP_DIR, `${process.env.MYSQL_DATABASE}-${timestamp}.sql`)

  try {
    mysqldump({
      connection: {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE
      },
      dump: {
        addDropTable: true
      },
      dumpToFile: backupFile,
    });
    console.log('Dump completed');
    return res.status(200).json({ message: 'Backup created successfully', file: backupFile });
  } catch (error) {
    return res.status(500).json({ message: 'Backup failed', error: stderr || error.message});
  }
})

router.post("/restore",verifyToken, async (req, res) => {
  const token = req.cookies.token;
  
  const { fileName } = req.body;

  if (!fileName) return res.status(400).json({ message: "Backup file is required" });

  const backupFile = path.join(BACKUP_DIR, fileName);
  if (!fs.existsSync(backupFile)) {
    return res.status(404).json({ message: "Backup file not found" });
  }

  let connection;

  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST,
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE,
      multipleStatements: true,
    });

    // Start transaction
    await connection.beginTransaction();

    // Drop all tables first
    const [tables] = await connection.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    if (tableNames.length) {
      await connection.query(`SET FOREIGN_KEY_CHECKS = 0;`);
      for (const table of tableNames) {
        await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
      }
      await connection.query(`SET FOREIGN_KEY_CHECKS = 1;`);
    }

    // Read the SQL file
    let sql = fs.readFileSync(backupFile, 'utf8');

    // Execute the SQL statements
    await connection.query(sql);

    // Commit transaction
    await connection.commit();
    await connection.end();

    return res.status(200).json({ message: "Database restored successfully" });

  } catch (error) {
    console.error("Restore failed:", error);
    if (connection) {
      try {
        await connection.rollback(); // rollback if any error occurs
        await connection.end();
      } catch (rollbackError) {
        console.error("Rollback failed:", rollbackError);
      }
    }
    return res.status(500).json({ message: "Restore failed, changes rolled back", error: error.message });
  }
});

router.get("/backups",verifyToken, (req, res) => {
  try {
    // Ensure directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      return res.status(404).json({ message: "No backup folder found" });
    }

    // Read all files in the backup directory
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(file => file.endsWith(".sql") || file.endsWith(".sql.gz")) // filter SQL files
      .map(file => {
        const filePath = path.join(BACKUP_DIR, file);
        const stats = fs.statSync(filePath);

        return {
          name: file,
          size: (stats.size / 1024).toFixed(2) + " KB",
          createdAt: stats.birthtime, // or stats.mtime for last modified
          path: filePath
        };
      })
      .sort((a, b) => b.createdAt - a.createdAt); // newest first

    return res.status(200).json({ backups: files });
  } catch (err) {
    console.error("Error listing backups:", err);
    return res.status(500).json({ message: "Failed to list backups", error: err.message });
  }
});

router.delete("/backups/:filename",verifyToken, (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(BACKUP_DIR, filename);

    // Prevent directory traversal (security check)
    if (!filePath.startsWith(BACKUP_DIR)) {
      return res.status(400).json({ message: "Invalid file path" });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: "Backup file not found" });
    }

    fs.unlinkSync(filePath);

    return res.status(200).json({ message: "Backup file deleted successfully", filename });
  } catch (err) {
    return res.status(500).json({ message: "Failed to delete backup", error: err.message });
  }
});

module.exports = router