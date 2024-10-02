-- Origineel
select 
	`p`.`project_name` AS `Project_Name`
    ,`p`.`id` AS `ProjectID`
    ,concat(concat_ws(' ',`o`.`firstname`,`o`.`lastname`)
    ,concat(convert(if(count(`pa`.`id`) > 0,', ','') using latin1)
    ,group_concat(concat_ws(' ',`pa`.`firstname`,`pa`.`lastname`) separator ', '))) AS `participants`
    ,max(`ha`.`href`) AS `Youtube`,`p`.`project_descr` AS `project_descr`
    ,'3:00' AS `Length`
    ,`p`.`project_lang` AS `Language` 
from 
	(((((`projects` `p` 
    join `users` `o` on(`o`.`id` = `p`.`ownerId`)) 
    left join `vouchers` `v` on(`v`.`projectId` = `p`.`id` and `v`.`participantId` <> 0)) 
		left join `users` `pa` on(`v`.`participantId` = `pa`.`id`)) 
	left join `attachments` `at` on(`at`.`ProjectId` = `p`.`id`)) 
		left join `hyperlinks` `ha` on(`ha`.`AttachmentId` = `at`.`id`)) 
group by 
	`p`.`id`;

-- enkel de HRef per project uit Hyperlinks 
select 
    `p`.`id` AS `ProjectID`
	,max(`ha`.`href`) AS `Youtube`
    ,'3:00' AS `Length`
from 
	`projects` `p`
	left join `attachments` `at` on  `at`.`ProjectId` = `p`.`id` 
		left join `hyperlinks` `ha` on `ha`.`AttachmentId` = `at`.`id`
group by 
	`p`.`id`;
    
-- Correcte view, zonder attachments/href
select 
	`p`.`project_name` AS `Project_Name`
    ,`p`.`id` AS `ProjectID`
    ,concat(concat_ws(' ',`o`.`firstname`,`o`.`lastname`)
    ,concat(convert(if(count(`pa`.`id`) > 0,', ','') using latin1)
    ,group_concat(concat_ws(' ',`pa`.`firstname`,`pa`.`lastname`) separator ', '))) AS `participants`
    -- ,max(`ha`.`href`) AS `Youtube`
    ,`p`.`project_descr` AS `project_descr`
    ,'3:00' AS `Length`
    ,`p`.`project_lang` AS `Language` 
from 
	`projects` `p` 
    join `users` `o` on(`o`.`id` = `p`.`ownerId`)
    left join `vouchers` `v` on (`v`.`projectId` = `p`.`id` and `v`.`participantId` <> 0)
		left join `users` `pa` on (`v`.`participantId` = `pa`.`id`)
group by 
	`p`.`id`;
    
-- VOLLEDIGE samenstelling
SELECT 
	p.project_name AS Project_Name
    , p.id AS ProjectID
    , CONCAT(CONCAT_WS(' ', o.firstname, o.lastname)
    , CONCAT(CONVERT(IF(COUNT(pa.id) > 0, ', ' ,'') USING LATIN1)
    , GROUP_CONCAT(CONCAT_WS(' ',pa.firstname, pa.lastname) SEPARATOR ', '))) AS participants
    , href.Youtube
    , p.project_descr AS project_descr
    ,'3:00' AS Length
    , p.project_lang AS `Language` 
FROM 
	projects p 
    JOIN users o ON (o.id = p.ownerId)
    LEFT JOIN vouchers v ON (v.projectId = p.id AND v.participantId <> 0) -- Only used vouchers
		LEFT JOIN users pa ON (v.participantId = pa.id)
	JOIN (
		SELECT 
			p1.id AS ProjectId
			, MAX(ha.href) AS Youtube
			,'3:00' AS Length
		FROM 
			projects p1
			LEFT JOIN attachments at ON  at.ProjectId = p1.id 
				LEFT JOIN hyperlinks ha ON ha.AttachmentId = at.id
		GROUP BY 
			p1.id
    ) AS href ON href.projectId = p.id
GROUP BY
	p.id;
    