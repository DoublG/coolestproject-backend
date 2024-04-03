CREATE OR REPLACE VIEW `ContactList` AS
SELECT 
    u.id, u.firstname, u.lastname, u.language,
    TIMESTAMPDIFF(YEAR, u.birthmonth, e.officialStartDate) AS Age,
	CASE WHEN p.Agree IS NULL THEN 'NO PHOTO' ELSE 'OK' END as Photo,
    CASE WHEN c.Agree IS NULL THEN 'NO CONTACT' ELSE 'OK' END as Contact
    , u.via, u.gsm, u.gsm_guardian, u.email, u.email_guardian
FROM
	users u
    inner join events e on u.eventId = e.id
	left outer join ( 
		SELECT qu.UserId, q.name as Agree, qu.eventid
        FROM questionusers qu
		inner join questions q on (qu.QuestionId = q.id and q.name like '%photo%')
        ) p
        on u.id = p.UserId and p.eventid = u.eventid
    left outer join ( 
		SELECT qu.UserId, q.name as Agree, qu.eventid
        FROM questionusers qu
		inner join questions q on (qu.QuestionId = q.id and q.name like '%contact%')
        ) c
        on u.id = c.UserId  and c.eventid = u.eventid
where 
	u.eventid = (SELECT id FROM voting.events WHERE registrationOpenDate <= CURDATE() and CURDATE() <= eventEndDate)
;

SELECT * FROM `ContactList`;
