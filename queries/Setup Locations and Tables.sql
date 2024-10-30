START TRANSACTION;

SELECT @eventIdNew := id FROM `events`
WHERE eventBeginDate <= CURDATE() and CURDATE() <= eventEndDate;
SET @eventIdOld = @eventIdNew - 1;

-- Name contains the year!
SET @old = RIGHT(CAST(YEAR(now()) as CHAR), 1);
SET @new = RIGHT(CAST(YEAR(now())+1 as CHAR), 1);
select @old, @new;

INSERT INTO locations
(
`text`,
createdAt,
updatedAt,
eventId)
SELECT 
`text`,
now(),
now(),
@eventIdNew
FROM locations 
where eventid = @eventIdOld  -- Previous event
order by `text`
;

SELECT * FROM locations where eventid = @eventIdNew;

SELECT @location0 := MIN(id) FROM locations
WHERE eventid = @eventIdNew;

SELECT @locationNo := COUNT(id) FROM locations
WHERE eventid = @eventIdNew;

SELECT @location0, @locationNo;

-- '5_Table_01'

INSERT INTO `tables`
(
`name`,
`maxPlaces`,
`requirements`,
`createdAt`,
`updatedAt`,
`eventId`,
`LocationId`)
SELECT
CONCAT(@new, RIGHT(`name`, LENGTH(`name`)-1 )),
`maxPlaces`,
`requirements`,
now(),
now(),
@eventIdNew,
MOD( (ROW_NUMBER() OVER w) - 1, @locationNo) + @location0
FROM `tables`
WHERE eventid = @eventIdOld
WINDOW w AS (ORDER BY id);

SELECT * FROM `tables` where eventid = @eventIdNew;

-- ROLLBACK;
COMMIT;
