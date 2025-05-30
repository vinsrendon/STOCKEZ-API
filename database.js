import mysql2 from 'mysql2'

import dotenv from 'dotenv'

dotenv.config()

const pool = mysql2.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()


export async function getUsers(){
    const [rows] = await pool.query(`CALL get_users()`)
    return rows[0]
}

export async function registerUser(user,pass,role,flag,fname,mname,lname,pnumber,address){    
    await pool.query(`CALL register(?,?,?,?,?,?,?,?,?)`,[user,pass,role,flag,fname,mname,lname,pnumber,address])    
}

export async function loginUser(user){
    const [result] = await pool.query('CALL login(?)',[user])
    return result[0]
}

export async function getExpenses(){
    const [rows] = await pool.query(`CALL get_expense()`)
    return rows[0]
}

export async function addExpense(expense_desc,expense_amount,expense_date){
    await pool.query(`CALL add_expense(?,?,?)`,[expense_desc,expense_amount,expense_date])    
}

