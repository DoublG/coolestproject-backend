SELECT 
    p.id, p.project_name
    , t.name as 'Table'
    , count(a.id) as Aantal_Uploads
    , sum(a.confirmed) as Aantal_Confirmed
FROM 
    projects p
    left outer join attachments a on a.ProjectId = p.id
    left outer join projecttables pt on pt.projectid = p.id
    left outer join tables t on pt.TableId = t.id
WHERE
    p.eventid = (SELECT id FROM events WHERE registrationOpenDate <= CURDATE() and CURDATE() <= eventEndDate)
    -- and t.name is not null
GROUP BY 
    p.id, p.project_name, t.name
ORDER BY 
    p.id
