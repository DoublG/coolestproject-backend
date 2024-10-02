CREATE OR REPLACE VIEW `tablesheet` AS
SELECT 
    p.project_name AS Project_Name
    , p.id AS ProjectID
    , CONCAT(CONCAT_WS(' ', o.firstname, o.lastname),
            CONCAT(CONVERT( IF((COUNT(pa.id) > 0), ', ', '') USING LATIN1),
                    GROUP_CONCAT(CONCAT_WS(' ', pa.firstname, pa.lastname)
                        SEPARATOR ', '))) AS participants
    , p.project_descr AS Description
    , p.project_lang AS Language
	, MAX(CAST((RIGHT(t.name, length(t.name) - length(
		CASE p.eventId
			WHEN 1 THEN 'Room'
			WHEN 2 THEN 'Table'
			WHEN 3 THEN '3_Table_'
            WHEN 4 THEN '4_Table_'
            WHEN 5 THEN '5_Table_'
            WHEN 6 THEN '6_Table_'
            WHEN 7 THEN '7_Table_'
            WHEN 8 THEN '8_Table_'
            WHEN 9 THEN '9_Table_'
			ELSE 'Table'
		END
    ))) as SIGNED )) as TableNr
    , MAX(IFNULL(q.name,'No photo')) as Photo1
    ,  IF( MAX(IFNULL(q.name, 1)) >= 1, 'NoPhoto.png', 'Blanco.png') as Photo2
FROM
    projects p
    JOIN users o ON o.id = p.ownerId
    LEFT JOIN vouchers v ON v.projectId = p.id AND v.participantId <> 0
    LEFT JOIN users pa ON v.participantId = pa.id
	inner join projecttables pt on pt.ProjectId = p.id
    inner join tables t on t.id = pt.TableId
    left join (
		questionusers qu 
		inner join questions q 
        on q.id = qu.QuestionId 
        and q.name like '%photo%') on qu.UserId = o.id
WHERE
	p.eventId = (
		SELECT id 
        FROM voting.events
		WHERE registrationClosedDate <= CURDATE() and CURDATE() <= eventEndDate
		)
GROUP BY p.id
ORDER BY TableNr;

SELECT * FROM tablesheet;
