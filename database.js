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
export async function addProduct(barcode,description,category,uom){
    await pool.execute(`INSERT INTO products(barcode,description,category_id,uom_id) VALUES(?,?,?,?)`,[barcode,description,category,uom])
}

export async function getProducts(){
    const [products] = await pool.execute(`SELECT p.barcode,p.description,p.product_id,c.category_name,c.category_id,o.uom_name,o.uom_id FROM products p JOIN category c ON p.category_id = c.category_id JOIN uom o ON p.uom_id = o.uom_id`)
    return products
}

export async function addBatch(pid,dDate,eDate,qty,bp,sp,uid){
    const conn = await pool.getConnection()
    try {
        await conn.beginTransaction()
        if(!eDate) eDate=""
        const [result] = await conn.execute(`INSERT INTO 
        product_batches(product_id,delivery_date,expiration_date,quantity,buy_price,sell_price)
        VALUES(?,?,?,?,?,?)`,[pid,dDate,eDate,qty,bp,sp])

        const bid = result.insertId

        await conn.execute(`INSERT INTO stock_history(stocked_by,product_id,batch_id,qty) VALUES(?,?,?,?)`,[uid,pid,bid,qty])
        
        await conn.commit()
    } catch (error) {
        await conn.rollback()
        throw error
    } finally{
        conn.release()
    }
}

export async function getBatch(bid){
    const [batch] = await pool.execute(`SELECT * ,
    DATE_FORMAT(delivery_date, '%Y-%m-%d') AS delivery_date,
    DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date
    FROM product_batches 
    WHERE product_id =?`,[bid])
    return batch
}

export async function getItem(barcode){
    const [item] = await pool.execute(`SELECT 
    p.product_id,pb.batch_id,barcode,description,pb.quantity,u.uom_name,sell_price 
    FROM products p 
    JOIN product_batches pb 
    ON pb.product_id=p.product_id 
    JOIN uom u ON p.uom_id = u.uom_id
    WHERE p.barcode = ?
    AND pb.quantity > 0
    ORDER BY 
    pb.expiration_date ASC,
    pb.batch_id ASC
    LIMIT 1`,[barcode])
    return item
}

export async function getStockMovement(product_id ){
    try {
        const [rows] = await pool.execute(`
            (
                SELECT 
                    sh.log_id AS ref_id,
                    sh.product_id,
                    sh.batch_id,
                    sh.qty,
                    sh.stock_date AS timestamp,
                    DATE_FORMAT(sh.stock_date, '%Y-%m-%d %h:%i %p') AS readable_timestamp,
                    'IN' AS remark
                FROM stock_history sh
                WHERE sh.product_id = ?
            )

            UNION ALL

            (
                SELECT 
                    phi.purchase_id AS ref_id,
                    b.product_id,
                    phi.batch_id,
                    phi.qty,
                    ph.purchase_date AS timestamp,
                    DATE_FORMAT(ph.purchase_date, '%Y-%m-%d %h:%i %p') AS readable_timestamp,
                    'OUT' AS remark
                FROM purchase_history_items phi
                JOIN purchase_history ph 
                    ON ph.purchase_id = phi.purchase_id
                JOIN product_batches b 
                    ON b.batch_id = phi.batch_id
                WHERE b.product_id = ?
            )

            ORDER BY timestamp DESC
            `,
            [product_id, product_id])
            return rows;
    } catch (error) {
        console.log(error);
        
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
        MIN(pb.batch_id) AS batch_id, 
        MIN(pb.quantity) AS quantity, 
        SUM(pb.quantity) AS totalQty
        FROM products p
        JOIN product_batches pb ON p.product_id = pb.product_id
        GROUP BY p.product_id, p.barcode, p.description 
        HAVING SUM(pb.quantity) <= 10
        ORDER BY p.product_id ASC`)
        return result
    } catch (error) {
        throw error
    }
}

export async function getCategories(){    
    try {
        const [result] = await pool.execute(`SELECT * FROM category`)
        return result
    } catch (error) {
        throw error
    }
}

export async function addCategory(category_name,has_expiration){    
    try {
        await pool.execute(`INSERT INTO category(category_name,has_expiration) VALUES(?,?)`,[category_name,has_expiration])
    } catch (error) {
        throw error
    }
}

export async function dltCategory(category_id){    
    try {
        const [result] = await pool.execute(`DELETE FROM category WHERE category.category_id = ?`,[category_id])
        return result.affectedRows
    } catch (error) {
        throw error
    }
}

export async function getUOM(){    
    try {
        const [result] = await pool.execute(`SELECT * FROM uom`)
        return result
    } catch (error) {
        throw error
    }
}

export async function addUOM(uom_name){    
    try {
        await pool.execute(`INSERT INTO uom(uom_name) VALUES(?)`,[uom_name])
    } catch (error) {
        throw error
    }
}

export async function dltUOM(uom_id){    
    try {
        const [result] = await pool.execute(`DELETE FROM uom WHERE uom.uom_id = ?`,[uom_id])
        return result.affectedRows
    } catch (error) {
        throw error
    }
}

// export async function itemsSold() {    
//     try {        
//         const [result] = await pool.execute(`SELECT 
//             MONTHNAME(p.purchase_date) AS month,
//             SUM(hi.qty) AS total_sold
//             FROM purchase_history_items hi
//             JOIN purchase_history p ON hi.purchase_id = p.purchase_id
//             GROUP BY MONTH(p.purchase_date)
//             ORDER BY MONTH(p.purchase_date)`)
//             return result
//     } catch (error) {
//         throw error
//     }
// }
export async function itemsSold() {
    try {
        const [result] = await pool.execute(`
            SELECT 
                MONTHNAME(p.purchase_date) AS month,
                SUM(hi.qty) AS total_sold
            FROM purchase_history_items hi
            JOIN purchase_history p ON hi.purchase_id = p.purchase_id
            GROUP BY MONTH(p.purchase_date), MONTHNAME(p.purchase_date)
            ORDER BY MONTH(p.purchase_date)
        `);
        return result;
    } catch (error) {
        throw error;
    }
}

export async function expenses() {    
    try {
        const [result] = await pool.execute(`SELECT 
            MONTHNAME(e.expense_date) AS month,
            SUM(e.expense_amount) AS total_amount
            FROM expenses e
            GROUP BY MONTH(e.expense_date),MONTHNAME(e.expense_date)
            ORDER BY MONTH(e.expense_date)`)
            return result
    } catch (error) {
        throw error
    }
}

export async function countSoldToday() {
    try {
        const [count] = await pool.execute(`SELECT
            COALESCE(SUM(phi.qty), 0) AS items_sold_today
            FROM purchase_history ph
            JOIN purchase_history_items phi
                ON ph.purchase_id = phi.purchase_id
            WHERE DATE(ph.purchase_date) = CURDATE()`)
        return count
    } catch (error) {
        throw error
    }
}

export async function countSoldWeek() {
    try {
        const [count] = await pool.execute(`SELECT
        COALESCE(SUM(phi.qty), 0) AS items_sold_this_week
        FROM purchase_history ph
        JOIN purchase_history_items phi
            ON ph.purchase_id = phi.purchase_id
        WHERE YEARWEEK(ph.purchase_date, 1) = YEARWEEK(CURDATE(), 1)`)
        return count
    } catch (error) {
        throw error
    }
}

// CASHIER
export async function getCashierProducts(){
    const [products] = await pool.execute(`SELECT p.product_id,p.barcode,p.description,b.sell_price,u.uom_name, SUM(b.quantity) AS totalQty 
    FROM products p JOIN product_batches b ON p.product_id = b.product_id JOIN uom u ON p.uom_id = u.uom_id GROUP BY p.product_id,p.barcode,p.description,b.sell_price,u.uom_name`)
    return products
}

export async function savePurchase(cs_id,receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod,items,pi){
    const conn = await pool.getConnection()
    let payIntent = pi
    if(!payIntent){
        payIntent=""
    }
    try {
        await conn.beginTransaction()

        const [result] = await conn.execute(`INSERT INTO 
        purchase_history(cs_id,receipt_number,cashier_id,purchase_total,amount_tendered,amount_change,payment_method,reference) 
        VALUES(?,?,?,?,?,?,?,?)`,[cs_id,receiptNumber,cashier,purchase_total,amount_tendered,amount_change,paymentMethod,payIntent])
        const purchase_id = result.insertId
        
        if (Array.isArray(items)) {
            for (const item of items) {                
                await conn.execute(`INSERT INTO 
                purchase_history_items(purchase_id,batch_id,qty)
                VALUES(?,?,?)`,[purchase_id,item.batch_id,item.quantity]) 

                const [result] = await conn.execute(`UPDATE product_batches 
                SET quantity = quantity - ? WHERE batch_id = ? AND quantity >= ?`,[item.quantity, item.batch_id, item.quantity])
                
                if (result.affectedRows === 0) {
                    // console.log("here")
                    
                    let err = new Error("Not enough stock in this batch")
                    err.code = "INSUFFICIENT_STOCK"
                    throw err
                }
            }
        }
        await conn.commit()
    } catch (err) {
        await conn.rollback()
        console.log(err)
        
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

export async function getSalesHistories({ from, to, page, limit, search ,cashierId}) {
    const offset = (page - 1) * limit

    let where = "WHERE 1=1"
    let params = []


    if (search) {
        where += " AND receipt_number LIKE ?"
        params.push(`%${search}%`)
    }

    if (cashierId) {
        where += " AND cashier_id = ?"
        params.push(cashierId)
    }

    if (from && to) {
        where += " AND DATE(purchase_date) BETWEEN ? AND ?"
        params.push(from, to)
    } 

    
    if(where === ""){
        console.log("blank");
        
        const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM purchase_history`)

        const total = countRows[0].total

        const [rows] = await pool.execute(`SELECT purchase_Id,receipt_number,purchase_date,
            DATE_FORMAT(purchase_date, '%M %d, %Y %h:%i %p') AS formatted_purchase_date 
            FROM purchase_history 
            ORDER BY purchase_date DESC
            LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`)

        return { data: rows, total, page, limit }
    }
    else{
        const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM purchase_history ${where}`,params)
        
        const total = countRows[0].total
            
        const [rows] = await pool.execute(
            `SELECT 
                purchase_Id,
                receipt_number,
                purchase_date,
                DATE_FORMAT(purchase_date, '%M %d, %Y %h:%i %p') AS formatted_purchase_date
            FROM purchase_history
            ${where}
            ORDER BY purchase_date DESC
            LIMIT ${parseInt(limit, 10)} OFFSET ${parseInt(offset, 10)}`,
            [...params]
        )
        return { data: rows, total, page, limit }
    }        
}

export async function getSalesHistory(hId){
    const [headerRows] = await pool.execute(`
        SELECT p.receipt_number,p.purchase_Id,p.purchase_date,p.purchase_total,p.amount_tendered,p.amount_change,p.payment_method,p.reference,
        si.firstname,si.lastname, 
        DATE_FORMAT(p.purchase_date, '%Y-%m-%d %h:%i:%s %p') AS formatted_purchase_date
        FROM purchase_history p
        JOIN users_info si ON p.cashier_id = si.uid
        WHERE p.purchase_id = ?
    `, [hId])

    if (headerRows.length === 0) return null

    const [items] = await pool.execute(`
        SELECT p.barcode,p.description,phi.qty,pb.sell_price from purchase_history_items phi 
        JOIN product_batches pb ON phi.batch_id = pb.batch_id 
        JOIN products p ON pb.product_id = p.product_id
        where phi.purchase_id = ?
    `, [hId])

    return [ headerRows, items ]

}

export async function getCashiesSessionSummary(cs_id) {
    const [result] = await pool.execute(`SELECT * FROM purchase_history p WHERE cs_id = ? `,[cs_id])
    return result
}

export async function getCashiesSessionInfo(cs_id) {
    const [result] = await pool.execute(`SELECT * FROM cashier_sessions p WHERE id = ? LIMIT 1`,[cs_id])
    return result
}

//CASHFLOW

export async function getItemsSold(from,to) {
  const [items] = await pool.execute(
        `SELECT 
            p.barcode,
            p.description,
            b.sell_price AS sold_price,
            SUM(phi.qty) AS total_quantity
        FROM purchase_history ph
        JOIN purchase_history_items phi 
            ON ph.purchase_id = phi.purchase_id
        JOIN product_batches b 
            ON phi.batch_id = b.batch_id
        JOIN products p 
            ON b.product_id = p.product_id
        WHERE ph.purchase_date BETWEEN ? AND ?
        GROUP BY 
            p.product_id,
            b.sell_price
        ORDER BY total_quantity DESC`,
      [from, to]
    )
    return items
}

export async function getCashflowSales(from,to){
    const [sales] = await pool.execute(
      `SELECT receipt_number, DATE_FORMAT(purchase_date, '%Y-%m-%d') AS date, purchase_total
       FROM purchase_history
       WHERE DATE(purchase_date) BETWEEN ? AND ?
       ORDER BY purchase_date`,
      [from, to]
    );
    return sales
}

export async function getCashflowExpenses(from,to){
    const [expenses] = await pool.execute(
      `SELECT biller, expense_decs, DATE_FORMAT(expense_date, '%Y-%m-%d') AS date, expense_amount
       FROM expenses
       WHERE DATE(expense_date) BETWEEN ? AND ?
       ORDER BY expense_date`,
      [from, to]
    )
    return expenses 
}

//MAINTENANCE
export async function scheduleBackup(time,enabled){
    await pool.execute("INSERT INTO scheduled_backup (time,enabled) VALUES (?,?)", [time,enabled])
}
export async function getScheduleBackup(){
    const [rows] = await pool.execute("SELECT * FROM scheduled_backup ORDER BY id DESC LIMIT 1")
    return rows
}

