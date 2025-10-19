const express = require("express")
const router = express.Router()
const {exec} = require('child_process')
const fs = require('fs')
const path = require('path')
const BACKUP_DIR = path.join(process.cwd(), 'backups')

router.get("/backup" , async (req,res) => {

    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Unauthorized" });
    
    if (!fs.existsSync(BACKUP_DIR)) {
            fs.mkdirSync(BACKUP_DIR);
        }
    
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupFile = path.join(BACKUP_DIR, `${process.env.MYSQL_DATABASE}-${timestamp}.sql`);
    
        const dumpCommand = `"C:\\xampp\\mysql\\bin\\mysqldump.exe" -u ${process.env.MYSQL_USER} ${process.env.MYSQL_PASSWORD ? `-p${process.env.MYSQL_PASSWORD}` : ''} ${process.env.MYSQL_DATABASE} > "${backupFile}"`;
    
        exec(dumpCommand,{ shell: true }, (error, stdout, stderr) => {
            if (error) {
                console.error('Backup failed:', stderr);
                return res.status(500).json({ message: 'Backup failed', error: stderr });
            }
    
            // console.log('Backup successful:', backupFile);
            res.json({ message: 'Backup created successfully', file: backupFile });
        });
})

module.exports = router