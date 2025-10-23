-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 23, 2025 at 01:03 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `stockez`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `add_expense` (IN `biller` TEXT, IN `description` TEXT, IN `amount` TEXT, IN `expense_date` DATE)   BEGIN

INSERT INTO expenses(biller,expense_decs,expense_amount,expense_date) VALUES(biller,description,amount,expense_date);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `add_product` (IN `i_barcode` VARCHAR(50), IN `i_description` VARCHAR(100), IN `i_category` INT)   BEGIN

INSERT INTO products(barcode,description,category) VALUES(i_barcode,i_description,i_category);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `add_product_batch` (IN `pid` INT, IN `dDate` DATE, IN `mDate` DATE, IN `eDate` DATE, IN `qty` INT, IN `UOM` TEXT, IN `bp` DECIMAL, IN `sp` DECIMAL)   BEGIN

INSERT INTO product_batches(product_id,delivery_date,manufacturing_date,expiration_date,quantity,UOM,buy_price,sell_price) VALUES(pid,dDate,mDate,eDate,qty,UOM,bp,sp);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `change_user_status` (IN `id` INT)   BEGIN

UPDATE users
SET users.status = IF(users.status = 1, 0, 1)
WHERE users.uid = id;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_expense` ()   BEGIN

SELECT 
expense_id,
biller,
expense_decs,
expense_amount,
DATE_FORMAT(expense_date, '%Y-%m-%d') AS formatted_expense_date
FROM expenses ORDER BY expense_date DESC;


END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_item` (IN `i_barcode` VARCHAR(50))   BEGIN

SELECT p.product_id,pb.batch_id,barcode,description,pb.quantity,UOM,sell_price 
FROM products p 
JOIN product_batches pb 
ON pb.product_id=p.product_id 
WHERE p.barcode = i_barcode
AND pb.quantity > 0
ORDER BY 
pb.expiration_date ASC,
pb.batch_id ASC
LIMIT 1;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_products` ()   BEGIN

SELECT * FROM products;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_product_batch` (IN `pid` INT)   BEGIN

SELECT * ,
DATE_FORMAT(delivery_date, '%Y-%m-%d') AS delivery_date,
DATE_FORMAT(manufacturing_date, '%Y-%m-%d') AS manufacturing_date,
DATE_FORMAT(expiration_date, '%Y-%m-%d') AS expiration_date
FROM product_batches 
WHERE product_id =pid;

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_users` ()   BEGIN

SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid ;



END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_user_by_id` (IN `user_id` INT)   BEGIN

SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid  WHERE u.uid=user_id;



END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `login` (IN `user` VARCHAR(50))   BEGIN
	SELECT * from users WHERE username = user;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `register` (IN `user` VARCHAR(50), IN `pass` TEXT, IN `role` INT, IN `flag` INT, IN `fname` TEXT, IN `mname` TEXT, IN `lname` TEXT, IN `pnumber` VARCHAR(15), IN `address` TEXT)   BEGIN
	DECLARE new_user_id INT;

 	INSERT INTO users(username,password,role,status) VALUES(user,pass,role,flag);
 
 	SET new_user_id = LAST_INSERT_ID();
 
 	INSERT into users_info(uid,firstname,middlename,lastname,phone_number,address) VALUES(new_user_id,fname,mname,lname,pnumber,address);
 
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `reset_user_password` (IN `user_id` INT, IN `user_pass` TEXT)   BEGIN

UPDATE users 
SET password = user_pass 
WHERE uid = user_id;

END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `biller` text NOT NULL,
  `expense_decs` text NOT NULL,
  `expense_amount` decimal(10,0) NOT NULL,
  `expense_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `biller`, `expense_decs`, `expense_amount`, `expense_date`) VALUES
(1, 'meco', 'electric bill', 2690, '2025-09-30'),
(2, 'PLDT', 'internet', 1500, '2025-09-30'),
(3, 'john doe', 'RENT', 10000, '2025-10-01'),
(4, 'MCWD', 'water bill', 500, '2025-10-04'),
(5, 'MECO', 'electric bill', 5000, '2025-10-15');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `barcode` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `category` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `barcode`, `description`, `category`) VALUES
(1, '4800016077913', '10 x 30g packs presto creams choco peanut butter', 'Food'),
(2, '4800092111822', '10 x 30g REBISCO CRACKERS PLAIN', 'Food'),
(5, '4800092113338', '1 x 30g REBISCO CRACKERS PLAIN', 'Food'),
(6, '4800016077906', '1 x 30g presto cream choco peanut butter', 'Food');

-- --------------------------------------------------------

--
-- Table structure for table `product_batches`
--

CREATE TABLE `product_batches` (
  `batch_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `delivery_date` date NOT NULL,
  `manufacturing_date` date NOT NULL,
  `expiration_date` date NOT NULL,
  `quantity` int(11) NOT NULL,
  `UOM` text NOT NULL,
  `buy_price` decimal(10,0) NOT NULL,
  `sell_price` decimal(10,0) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `product_batches`
--

INSERT INTO `product_batches` (`batch_id`, `product_id`, `delivery_date`, `manufacturing_date`, `expiration_date`, `quantity`, `UOM`, `buy_price`, `sell_price`) VALUES
(1, 1, '2025-10-14', '2025-10-08', '2026-10-08', 100, 'Packs', 65, 75),
(2, 2, '2025-10-15', '2025-10-09', '2026-10-08', 50, 'Packs', 70, 80),
(3, 1, '2025-10-15', '2025-10-09', '2026-10-09', 100, 'Packs', 65, 75);

-- --------------------------------------------------------

--
-- Table structure for table `purchase_history`
--

CREATE TABLE `purchase_history` (
  `purchase_id` int(11) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `purchase_amount` int(11) NOT NULL,
  `cashier` int(11) NOT NULL,
  `purchase_total` double NOT NULL,
  `amount_tendered` double NOT NULL,
  `amount_change` double NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_history`
--

CREATE TABLE `stock_history` (
  `log_id` int(11) NOT NULL,
  `stockedBy` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `batch_id` int(11) NOT NULL,
  `stock_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `uid` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` text NOT NULL,
  `role` int(11) NOT NULL COMMENT '0=admin,1=cashier',
  `creation_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` int(11) NOT NULL COMMENT '0=inactive,1=active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`uid`, `username`, `password`, `role`, `creation_date`, `status`) VALUES
(1, 'test2', '$2b$13$iJSfv6Y7mbzzY0vucHZIK.gWzM6dx0m6bz5cmallKIVG2k8CHsTuO', 1, '2025-10-09 22:31:46', 1),
(2, 'test3', '$2b$13$yQGJj3gylXYi/oL2LwCcR.Sa5qqEmOmDF6IU7498LwaZKWeDs6/WK', 1, '2025-05-30 22:39:53', 1),
(3, 'admin1', '$2b$13$44NfjeVN0IdgoIUkCn9VQef4A9LTdZg1qws.2Nb5geECtz0fbm2K2', 0, '2025-07-29 09:36:40', 1),
(9, 'test4', '$2b$13$FhU3Mfb0d0D9rEaMzni9uONb3eEF.vnL5NWzuzDiPYbBIJqJotyMO', 1, '2025-10-14 20:31:31', 0),
(10, 'test5', '$2b$13$1oqI5yfJiM0lXJYt/PVjSe4SvNJllkPV95M2ewzjTvzCjfAFQVWKO', 1, '2025-09-30 07:20:19', 1),
(16, 'test6', '$2b$13$CNnTunc57vcq/THGjqrMPutNjrXpMKnxkNkWEQqBeq/Ifbh2AgUxG', 1, '2025-10-04 10:40:29', 1),
(17, 'test7', '$2b$13$xyTwgRijMIQYw4/mEEhDGehEgmhb3AWKnm8tb5OokbZi.s57cn0Cy', 1, '2025-10-04 10:41:41', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users_info`
--

CREATE TABLE `users_info` (
  `uid` int(11) NOT NULL,
  `firstname` text NOT NULL,
  `middlename` text DEFAULT NULL,
  `lastname` text NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `address` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users_info`
--

INSERT INTO `users_info` (`uid`, `firstname`, `middlename`, `lastname`, `phone_number`, `address`) VALUES
(1, 'marie', NULL, 'currie', '09123456788', 'LLC'),
(2, 'john', NULL, 'doe', '09123456787', 'LLC'),
(3, 'admin', 'admin', 'admin', '09923456786', 'Gabi Cordova Cebu'),
(9, 'test4', 'test4', 'test4', '09783647236', 'gabi'),
(10, 'test5', 'test5', 'test5', '09128462375', 'gabi'),
(16, 'test6', 'test6', 'test6', '09248273753', 'gabi'),
(17, 'test7', 'test7', 'test7', '09128476237', 'gabi');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `barcode` (`barcode`);

--
-- Indexes for table `product_batches`
--
ALTER TABLE `product_batches`
  ADD PRIMARY KEY (`batch_id`);

--
-- Indexes for table `purchase_history`
--
ALTER TABLE `purchase_history`
  ADD PRIMARY KEY (`purchase_id`);

--
-- Indexes for table `stock_history`
--
ALTER TABLE `stock_history`
  ADD PRIMARY KEY (`log_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`),
  ADD UNIQUE KEY `username` (`username`),
  ADD KEY `username_idx` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `product_batches`
--
ALTER TABLE `product_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `stock_history`
--
ALTER TABLE `stock_history`
  MODIFY `log_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
