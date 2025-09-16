-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 14, 2025 at 04:46 PM
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `add_SKU` (IN `pname` TEXT, IN `manufacturer` TEXT)   BEGIN

INSERT INTO inventory(product_name,manufacturer) VALUES(pname,manufacturer);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_expense` ()   BEGIN

SELECT 
expense_id,
biller,
expense_decs,
expense_amount,
DATE_FORMAT(expense_date, '%Y-%m-%d') AS formatted_expense_date
FROM expenses;


END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_users` ()   BEGIN

SELECT * FROM users_info ui JOIN users u ON u.uid=ui.uid ;



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

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `expenses`
--

CREATE TABLE `expenses` (
  `expense_id` int(11) NOT NULL,
  `biller` text NOT NULL,
  `expense_decs` text NOT NULL,
  `expense_amount` text NOT NULL,
  `expense_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `biller`, `expense_decs`, `expense_amount`, `expense_date`) VALUES
(2, 'Metropolitan Cebu Water District', 'water bill', '1000', '2025-05-31'),
(3, 'GLOBE TELECOM', 'internet bill', '1500', '2025-05-31'),
(4, 'MACTAN ELECTRIC COMPANY', 'electricity bill', '3500', '2025-05-31'),
(9, '', 'rent', '10000', '2025-05-30'),
(12, 'MECO', 'electricity', '10000', '2025-04-30');

-- --------------------------------------------------------

--
-- Table structure for table `inventory`
--

CREATE TABLE `inventory` (
  `product_code` int(11) NOT NULL,
  `product_name` text NOT NULL,
  `manufacturer` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory`
--

INSERT INTO `inventory` (`product_code`, `product_name`, `manufacturer`) VALUES
(1, 'Coca Cola', 'The Coca Cola Company'),
(2, 'Sprite', 'The Coca Cola Company'),
(3, 'Minute Maid', 'The Coca Cola Company'),
(5, 'Royal', 'The Coca Cola Company');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_logs`
--

CREATE TABLE `inventory_logs` (
  `product_code` int(11) NOT NULL,
  `stock_date` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `size` int(11) NOT NULL,
  `unit` text NOT NULL,
  `qty` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `items`
--

CREATE TABLE `items` (
  `purhase_id` int(11) NOT NULL,
  `variant_id` int(11) NOT NULL,
  `qty` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `product_code` bigint(20) NOT NULL,
  `description` text NOT NULL,
  `quantity` int(11) NOT NULL,
  `UOM` int(11) NOT NULL,
  `price` double NOT NULL,
  `date added` datetime NOT NULL DEFAULT current_timestamp(),
  `expiration date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
(1, 'test2', '$2b$13$mrzf8m0mqxADs.HOV9hTZuOEJDA8lCwTGZyCrK7HrLOiQQtcOwkiq', 1, '2025-05-30 22:39:25', 1),
(2, 'test3', '$2b$13$yQGJj3gylXYi/oL2LwCcR.Sa5qqEmOmDF6IU7498LwaZKWeDs6/WK', 1, '2025-05-30 22:39:53', 1),
(3, 'admin1', '$2b$13$44NfjeVN0IdgoIUkCn9VQef4A9LTdZg1qws.2Nb5geECtz0fbm2K2', 0, '2025-07-29 09:36:40', 1),
(4, 'test4', '$2b$13$zufYbrImaQu1mYqZL08ZLuSeGtFoWOlKXgLNWlKEDO9M.qFZkLaR.', 1, '2025-08-28 08:30:32', 1),
(5, 'test5', '$2b$13$kDUFsi4eeYlRKh5KwItn0.aoJ6f8yhFo22hgSKd6gyrzlqM5FEZL.', 1, '2025-08-28 08:35:41', 1);

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
(4, 'john', 'mark', 'gabe', '09415121231', 'maribago llc'),
(5, 'mark', 'john', 'mangubat', '09745124984', 'gabi cordova');

-- --------------------------------------------------------

--
-- Table structure for table `variant`
--

CREATE TABLE `variant` (
  `v_id` int(11) NOT NULL,
  `product_code` int(11) NOT NULL,
  `variant_name` text NOT NULL,
  `size` int(11) NOT NULL,
  `unit` text NOT NULL,
  `qty` int(11) NOT NULL,
  `price` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`);

--
-- Indexes for table `inventory`
--
ALTER TABLE `inventory`
  ADD PRIMARY KEY (`product_code`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `product_code` (`product_code`);

--
-- Indexes for table `purchase_history`
--
ALTER TABLE `purchase_history`
  ADD PRIMARY KEY (`purchase_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`),
  ADD KEY `username_idx` (`username`);

--
-- Indexes for table `variant`
--
ALTER TABLE `variant`
  ADD PRIMARY KEY (`v_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `product_code` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `variant`
--
ALTER TABLE `variant`
  MODIFY `v_id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
