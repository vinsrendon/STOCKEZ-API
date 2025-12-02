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
    const [rows] = await pool.query('SELECT 1')
    console.log('Database connected successfully!')
  } catch (error) {
    console.error('Database connection failed:', error)  
  }
}
checkConnection()

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
    const conn = await pool.getConnection()

    try {
        await conn.beginTransaction()

        const [userResult] = await conn.execute(`
            INSERT INTO users (username, password, role, status) 
            VALUES (?, ?, ?, ?)`, 
            [user, pass, role, flag])

        const newUserId = userResult.insertId

        await conn.execute(`
            INSERT INTO users_info (uid, firstname, middlename, lastname, phone_number, address)
            VALUES (?, ?, ?, ?, ?, ?)`, 
            [newUserId, fname, mname, lname, pnumber, address])

        await conn.commit()
    } catch (err) {
        await conn.rollback()
        throw err
    } finally {
        conn.release()
    }
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
    AS formatted_expense_date FROM expenses ORDER BY expense_date DESC`)
    return rows
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
    try {
        const [result] = await pool.execute(`INSERT INTO 
        product_batches(product_id,delivery_date,manufacturing_date,expiration_date,quantity,UOM,buy_price,sell_price)
        VALUES(?,?,?,?,?,?,?,?)`,[pid,dDate,mDate,eDate,qty,uom,bp,sp])
        return result.insertId
    } catch (error) {
        throw error
    }
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
    const [item] = await pool.execute(`SELECT 
    p.product_id,pb.batch_id,barcode,description,pb.quantity,UOM,sell_price 
    FROM products p 
    JOIN product_batches pb 
    ON pb.product_id=p.product_id 
    WHERE p.barcode = ?
    AND pb.quantity > 0
    ORDER BY 
    pb.expiration_date ASC,
    pb.batch_id ASC
    LIMIT 1`,[barcode])
    return item
}

export async function stock_history(uid,pid,bid){
    try {
        await pool.execute(`INSERT INTO stock_history(stocked_by,product_id,batch_id) VALUES(?,?,?)`,[uid,pid,bid])
    } catch (error) {
        throw error
    }
}

export async function mostSoldToday(){    
    try {
        const [result] = await pool.execute(`SELECT 
        p.product_id,
        p.description,
        p.barcode,
        SUM(phi.qty) AS total_sold
        FROM purchase_history_items phi
        JOIN purchase_history ph 
            ON ph.purchase_id = phi.purchase_id
        JOIN product_batches pb
            ON pb.batch_id = phi.batch_id
        JOIN products p
            ON p.product_id = pb.product_id
        WHERE DATE(ph.purchase_date) = CURDATE()   -- today
        GROUP BY p.product_id
        ORDER BY total_sold DESC
        LIMIT 1`)
        return result
    } catch (error) {
        throw error
    }
}

export async function mostSoldMonth(){    
    try {
        const [result] = await pool.execute(`SELECT 
        p.product_id,
        p.description,
        p.barcode,
        SUM(phi.qty) AS total_sold
        FROM purchase_history_items phi
        JOIN purchase_history ph ON ph.purchase_id = phi.purchase_id
        JOIN product_batches pb ON pb.batch_id = phi.batch_id
        JOIN products p ON p.product_id = pb.product_id
        WHERE YEAR(ph.purchase_date) = YEAR(CURDATE()) AND MONTH(ph.purchase_date) = MONTH(CURDATE())  -- current month
        GROUP BY p.product_id
        ORDER BY total_sold DESC
        LIMIT 1`)
        return result
    } catch (error) {
        throw error
    }
}

export async function lowStockAlert(){    
    try {
        const [result] = await pool.execute(`SELECT 
            p.product_id,
            p.barcode,        
            p.description,
            pb.UOM,
            pb.batch_id,
            pb.quantity,
        SUM(pb.quantity) AS totalQty
        FROM products p
        JOIN product_batches pb ON p.product_id = pb.product_id
        HAVING 
            totalQty <= 20
        ORDER BY p.product_id ASC`)
        return result
    } catch (error) {
        throw error
    }
}


// CASHIER
export async function getCashierProducts(){
    const [products] = await pool.execute(`SELECT *, SUM(b.quantity) AS totalQty 
    FROM products p INNER JOIN product_batches b ON p.product_id = b.product_id GROUP BY p.product_id`)
    return products
}

export async function savePurchase(receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod,items){
    const conn = await pool.getConnection()

    try {
        await conn.beginTransaction()

        const [result] = await conn.execute(`INSERT INTO 
        purchase_history(receipt_number,cashier,purchase_total,amount_tendered,amount_change,payment_method) 
        VALUES(?,?,?,?,?,?)`,[receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod])
        const purchase_id = result.insertId
        
        if (Array.isArray(items)) {
            for (const item of items) {                
                await conn.execute(`INSERT INTO 
                purchase_history_items(purchase_id,batch_id,qty)
                VALUES(?,?,?)`,[purchase_id,item.batch_id,item.quantity]) 

                const [result] = await conn.execute(`UPDATE product_batches 
                SET quantity = quantity - ? WHERE batch_id = ? AND quantity >= ?`,[item.quantity, item.batch_id, item.quantity])
                
                if (result.affectedRows === 0) {
                    console.log("here");
                    
                    let err = new Error("Not enough stock in this batch")
                    err.code = "INSUFFICIENT_STOCK"
                    throw err
                }
            }
        }
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        console.log(err);
        
        throw err
    } finally {
        conn.release()
    }
}

export async function startCashierSession(user_id, opening_balance){
    const [result]  = await pool.execute(`INSERT INTO cashier_sessions(user_id, opening_balance) VALUES (?,?)`,[user_id, opening_balance])
    return result.insertId
}

export async function endCashierSession(cashierSessionId, closing_balance){
    await pool.execute(`UPDATE cashier_sessions SET closed_at = NOW(),closing_balance = ? WHERE id = ?`,[closing_balance, cashierSessionId])
}

export async function getLastReceiptNumber(prefix){
    const [rows] = await pool.execute(`SELECT receipt_number 
    FROM purchase_history WHERE receipt_number LIKE ? ORDER BY receipt_number DESC LIMIT 1`,[`${prefix}%`])
    return rows
}

export async function getSalesHistories(from,to){
    if (!from || !to) {
        const [histories] = await pool.execute(`SELECT 
        purchase_Id,receipt_number,purchase_date,DATE_FORMAT(purchase_date, '%M %d, %Y %h:%i %p') 
        AS formatted_purchase_date from purchase_history`)        
        return histories
    } else {
        const [histories] = await pool.execute(`SELECT 
        purchase_Id,receipt_number,purchase_date,DATE_FORMAT(purchase_date, '%M %d, %Y %h:%i %p') 
        AS formatted_purchase_date from purchase_history where date(purchase_date) between ? and ?`,[from,to])
        return histories   
    }
}

export async function getSalesHistory(hId){
    const [headerRows] = await pool.execute(`
        SELECT p.receipt_number,p.purchase_Id,p.purchase_date,p.purchase_total,p.amount_tendered,p.amount_change,p.payment_method,
        si.firstname,si.lastname, 
        DATE_FORMAT(p.purchase_date, '%Y-%m-%d %h:%i:%s %p') AS formatted_purchase_date
        FROM purchase_history p
        JOIN users_info si ON p.cashier = si.uid
        WHERE p.purchase_id = ?
    `, [hId])

    if (headerRows.length === 0) return null

    const [items] = await pool.execute(`
        SELECT p.barcode,p.description,pb.UOM,phi.qty,pb.sell_price from purchase_history_items phi 
        JOIN product_batches pb ON phi.batch_id = pb.batch_id 
        JOIN products p ON pb.product_id = p.product_id
        where phi.purchase_id = ?
    `, [hId])

    return [ headerRows, items ]

}