-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Máy chủ: 127.0.0.1
-- Thời gian đã tạo: Th5 06, 2025 lúc 04:56 AM
-- Phiên bản máy phục vụ: 10.4.32-MariaDB
-- Phiên bản PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Cơ sở dữ liệu: `danofund`
--

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `funds`
--

CREATE TABLE `funds` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `longDescription` text NOT NULL,
  `category` varchar(100) NOT NULL,
  `members` int(11) NOT NULL DEFAULT 0,
  `proposals` int(11) NOT NULL DEFAULT 0,
  `transactions` int(11) NOT NULL DEFAULT 0,
  `startDate` date NOT NULL,
  `creator` varchar(255) NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `votingMechanism` varchar(50) NOT NULL DEFAULT 'per-capita',
  `proposalEligibility` varchar(50) NOT NULL DEFAULT 'all-members',
  `approvalThreshold` int(11) NOT NULL DEFAULT 51,
  `minContribution` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cooldownPeriod` int(11) NOT NULL DEFAULT 7,
  `visibility` varchar(20) NOT NULL DEFAULT 'private'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `invitations`
--

CREATE TABLE `invitations` (
  `id` int(11) NOT NULL,
  `fundId` varchar(255) NOT NULL,
  `senderAddress` varchar(255) NOT NULL,
  `receiverAddress` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `date` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `members`
--

CREATE TABLE `members` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `fundId` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `role` varchar(20) NOT NULL DEFAULT 'thành viên',
  `joinDate` date NOT NULL,
  `lastActive` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `status` varchar(20) NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Cấu trúc bảng cho bảng `proposals`
--

CREATE TABLE `proposals` (
  `id` varchar(255) NOT NULL,
  `fundId` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `creator` varchar(255) NOT NULL,
  `amount` decimal(18,2) NOT NULL,
  `votes` int(11) NOT NULL DEFAULT 0,
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `deadline` date NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `attachments` text DEFAULT NULL COMMENT 'Đường dẫn file đính kèm dưới dạng JSON',
  `details` text NOT NULL DEFAULT ''
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Chỉ mục cho các bảng đã đổ
--

--
-- Chỉ mục cho bảng `funds`
--
ALTER TABLE `funds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_creator` (`creator`);

--
-- Chỉ mục cho bảng `invitations`
--
ALTER TABLE `invitations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fundId` (`fundId`);

--
-- Chỉ mục cho bảng `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_fund_address` (`fundId`,`address`),
  ADD KEY `idx_address` (`address`),
  ADD KEY `idx_fundId` (`fundId`);

--
-- Chỉ mục cho bảng `proposals`
--
ALTER TABLE `proposals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fundId` (`fundId`),
  ADD KEY `idx_creator` (`creator`);

--
-- AUTO_INCREMENT cho các bảng đã đổ
--

--
-- AUTO_INCREMENT cho bảng `invitations`
--
ALTER TABLE `invitations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT cho bảng `members`
--
ALTER TABLE `members`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- Các ràng buộc cho các bảng đã đổ
--

--
-- Các ràng buộc cho bảng `invitations`
--
ALTER TABLE `invitations`
  ADD CONSTRAINT `invitations_ibfk_1` FOREIGN KEY (`fundId`) REFERENCES `funds` (`id`);

--
-- Các ràng buộc cho bảng `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `members_ibfk_1` FOREIGN KEY (`fundId`) REFERENCES `funds` (`id`) ON DELETE CASCADE;

--
-- Các ràng buộc cho bảng `proposals`
--
ALTER TABLE `proposals`
  ADD CONSTRAINT `proposals_ibfk_1` FOREIGN KEY (`fundId`) REFERENCES `funds` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
