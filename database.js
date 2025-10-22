import mysql2 from 'mysql2'

import dotenv from 'dotenv'


dotenv.config()

const pool = mysql2.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE
}).promise()

async function checkConnection() {
  try {
    const [rows] = await pool.query('SELECT 1');
    console.log('Database connected successfully!');
  } catch (error) {
    console.error('Database connection failed:', error.message);
  }
}
checkConnection();

//USERS
export async function getUsers(){
    const [rows] = await pool.query(`CALL get_users()`)
    return rows[0]
}

export async function getUserById(uid){
    const [rows] = await pool.query(`CALL get_user_by_id(?)`,[uid])
    return rows[0]
}

export async function changeUserStatus(uid){
    await pool.query(`CALL change_user_status(?)`,[uid])
}

export async function registerUser(user,pass,role,flag,fname,mname,lname,pnumber,address){    
    await pool.query(`CALL register(?,?,?,?,?,?,?,?,?)`,[user,pass,role,flag,fname,mname,lname,pnumber,address])    
}

export async function loginUser(user){
    const [result] = await pool.query('CALL login(?)',[user])
    return result[0]
}

export async function resetUserPassword(uid,pass){
    await pool.query(`CALL reset_user_password(?,?)`,[uid,pass])
}

// EXPENSES
export async function getExpenses(){
    const [rows] = await pool.query(`CALL get_expense()`)
    return rows[0]
}

export async function addExpense(biller,expense_desc,expense_amount,expense_date){
    await pool.query(`CALL add_expense(?,?,?,?)`,[biller,expense_desc,expense_amount,expense_date])    
}

//INVENTORY
export async function addProduct(barcode,description,category){
    await pool.query(`CALL add_product(?,?,?)`,[barcode,description,category])
}

export async function getProducts(){
    const [products] = await pool.query(`CALL get_products()`)
    return products[0]
}

export async function addBatch(pid,dDate,mDate,eDate,qty,uom,bp,sp){
    await pool.query(`CALL add_product_batch(?,?,?,?,?,?,?,?)`,[pid,dDate,mDate,eDate,qty,uom,bp,sp])
}

export async function getBatch(pid){
    const [batch] = await pool.query(`CALL get_product_batch(?)`,[pid])
    return batch[0]
}

