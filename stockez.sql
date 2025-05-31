-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 31, 2025 at 08:21 AM
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
CREATE DEFINER=`root`@`localhost` PROCEDURE `add_expense` (IN `description` TEXT, IN `amount` TEXT, IN `expense_date` DATE)   BEGIN

INSERT INTO expenses(expense_decs,expense_amount,expense_date) VALUES(description,amount,expense_date);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `add_SKU` (IN `pname` TEXT, IN `manufacturer` TEXT)   BEGIN

INSERT INTO inventory(product_name,manufacturer) VALUES(pname,manufacturer);

END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `get_expense` ()   BEGIN

SELECT * FROM expenses;


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
  `expense_decs` text NOT NULL,
  `expense_amount` text NOT NULL,
  `expense_date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `expenses`
--

INSERT INTO `expenses` (`expense_id`, `expense_decs`, `expense_amount`, `expense_date`) VALUES
(1, 'test expense description', '3500', '2025-05-31'),
(2, 'water bill', '1000', '2025-05-31'),
(3, 'internet bill', '1500', '2025-05-31');

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
(2, 'test3', '$2b$13$yQGJj3gylXYi/oL2LwCcR.Sa5qqEmOmDF6IU7498LwaZKWeDs6/WK', 1, '2025-05-30 22:39:53', 1);

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
(2, 'john', NULL, 'doe', '09123456787', 'LLC');

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
-- Indexes for table `purchase_history`
--
ALTER TABLE `purchase_history`
  ADD PRIMARY KEY (`purchase_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`);

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
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `inventory`
--
ALTER TABLE `inventory`
  MODIFY `product_code` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `purchase_history`
--
ALTER TABLE `purchase_history`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `variant`
--
ALTER TABLE `variant`
  MODIFY `v_id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
