-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 31, 2025 at 01:13 AM
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
(1, 'test expense description', '3500', '2025-05-31');

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

--
-- Indexes for dumped tables
--

--
-- Indexes for table `expenses`
--
ALTER TABLE `expenses`
  ADD PRIMARY KEY (`expense_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`uid`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `expenses`
--
ALTER TABLE `expenses`
  MODIFY `expense_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `uid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
