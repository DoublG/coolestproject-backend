/****************
 * Do not forget to create a new container 
 * in Azure Storage (Test, then Prod)
 ***************/

START TRANSACTION;

SELECT * FROM events;

INSERT INTO `events`
(`id`,
`azure_storage_container`,
`minAge`,
`maxAge`,
`minGuardianAge`,
`maxRegistration`,
`maxVoucher`,
`officialStartDate`,
`event_title`,
`createdAt`,
`updatedAt`,
`maxFileSize`,
`eventBeginDate`,
`registrationOpenDate`,
`registrationClosedDate`,
`projectClosedDate`,
`eventEndDate`)
VALUES
(5,
'coolestproject25',
7,
18,
16,
64,
3,
DATE('2025-04-26'), -- officialStartDate
'Coolest Projects 2025',
CURRENT_TIMESTAMP(),
CURRENT_TIMESTAMP(),
2*1024*1024*1024, -- 2 GB
DATE('2024-09-29'), -- eventBeginDate
DATE('2024-11-01'), -- registrationOpenDate
DATE('2025-04-01'),  -- registrationClosedDate
DATE('2025-04-14'), -- projectClosedDate
DATE('2025-08-31') -- eventEndDate
);

SELECT * FROM events;

-- ROLLBACK;
COMMIT;
