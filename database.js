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
    const [rows] = await pool.execute(`SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid `)
    return rows
}

export async function getUserById(uid){
    const [rows] = await pool.execute(`SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid WHERE u.uid = ?`,[uid])
    return rows
}

export async function changeUserStatus(uid){
    await pool.execute(`UPDATE users SET users.status = IF(users.status = 1, 0, 1) WHERE users.uid = ?`,[uid])
}

export async function registerUser(user,pass,role,flag,fname,mname,lname,pnumber,address){     
    const [userResult] = await pool.execute(`INSERT INTO 
    users (username, password, role, status) 
    VALUES (?, ?, ?, ?)`,[user, pass, role, flag]);

    const newUserId = userResult.insertId;

    await pool.execute(`INSERT INTO 
    users_info (uid, firstname, middlename, lastname, phone_number, address)
    VALUES (?, ?, ?, ?, ?, ?)`,[newUserId, fname, mname, lname, pnumber, address]);    
}

export async function loginUser(user){
    const [result] = await pool.execute('SELECT * from users WHERE username = ?',[user])
    return result
}

export async function resetUserPassword(uid,pass){
    await pool.execute(`UPDATE users SET password = ? WHERE uid = ?`,[pass,uid])
}

// EXPENSES
export async function getExpenses() {
    const [rows] = await pool.execute(`SELECT
    expense_id,biller,expense_decs,expense_amount,DATE_FORMAT(expense_date, '%Y-%m-%d')
    AS formatted_expense_date FROM expenses ORDER BY expense_date DESC`);
    return rows;
}

export async function addExpense(biller,expense_desc,expense_amount,expense_date){
    await pool.execute(`INSERT INTO 
    expenses(biller,expense_decs,expense_amount,expense_date)
    VALUES(?,?,?,?)`,[biller,expense_desc,expense_amount,expense_date])
}

//INVENTORY
export async function addProduct(barcode,description,category){
    await pool.execute(`INSERT INTO products(barcode,description,category) VALUES(?,?,?)`,[barcode,description,category])
}

export async function getProducts(){
    const [products] = await pool.execute(`SELECT * FROM products`)
    return products
}

export async function addBatch(pid,dDate,mDate,eDate,qty,uom,bp,sp){
    await pool.execute(`INSERT INTO 
    product_batches(product_id,delivery_date,manufacturing_date,expiration_date,quantity,UOM,buy_price,sell_price)
    VALUES(?,?,?,?,?,?,?,?)`,[pid,dDate,mDate,eDate,qty,uom,bp,sp])
}

export async function getBatch(bid){
    const [batch] = await pool.execute(`SELECT * ,
    DATE_FORMAT(delivery_date, '%Y-%m-%d') AS delivery_date,
    DATE_FORMAT(manufacturing_date, '%Y-%m-%d') AS manufacturing_date,
    DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date
    FROM product_batches 
    WHERE product_id =?`,[bid])
    return batch
}

export async function getItem(barcode){
    const [item] = await pool.query(`SELECT 
    p.product_id,pb.batch_id,barcode,description,pb.quantity,UOM,sell_price 
    FROM products p 
    JOIN product_batches pb 
    ON pb.product_id=p.product_id 
    WHERE p.barcode = i_barcode
    AND pb.quantity > 0
    ORDER BY 
    pb.expiration_date ASC,
    pb.batch_id ASC
    LIMIT 1;`,[barcode])
    return item
}
