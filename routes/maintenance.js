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
const cron = require('node-cron')


dotenv.config()

const  { scheduleBackup, getScheduleBackup} = require('../database.js')

let backupJob = null

function stopBackup() {
  if (backupJob) {
    backupJob.stop();
    backupJob = null;
    console.log("Backup scheduler stopped");
  }
}

function startBackup(time) {
  stopBackup();

  const [hour, minute] = time.split(":");
  const cronTime = `${minute} ${hour} * * *`;

  backupJob = cron.schedule(cronTime, async () => {
    console.log("Running scheduled backup...");
    await runBackup();
  });

  console.log("Backup scheduled at", time);
}

router.post("/backup" ,verifyToken, async (req,res) => {  
  try {
    const backupFile = await runBackup()
    return res.status(200).json({ message: 'Backup created successfully', file: backupFile })
  } catch (error) {
    return res.status(500).json({ message: 'Backup failed', error: stderr || error.message})
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
})

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
})

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
})

let scheduledBackupTime = "01:00"

router.post("/set-backup-time", verifyToken, async (req, res) => {
  const { time, enabled } = req.body
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return res.status(400).json({ message: "Invalid time format" })
  }
  const isEnabled = enabled ? 1 : 0
  try {
    await scheduleBackup(time,isEnabled)    

    scheduledBackupTime = time

    await loadBackupSchedule()

    return res.status(200).json({ message: "Backup time/status updated", time })
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to set backup time" });
  }
})

router.get("/get-backup-time", verifyToken, async (req, res) => {
  try {
    const status = await getScheduleBackup()    
    scheduledBackupTime = status[0].time
    return res.status(200).json(status)
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Failed to get status" });
  }
})

async function runBackup(){
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
    console.log('BACKUP CREATED')
    return backupFile
  } catch (error) {
    console.log('BACKUP FAILED',error)    
    throw error
  }
}

async function loadBackupSchedule() {
  try {
    const rows = await getScheduleBackup()

    if (!rows.length) return

    const { time, enabled } = rows[0];
    // console.log(time,enabled);

    if (enabled) startBackup(time)

    else stopBackup()

  } catch (err) {
    console.log("Failed to load backup schedule:", err.message)
  }
}

loadBackupSchedule()

module.exports = router