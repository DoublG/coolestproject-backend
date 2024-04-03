const express = require('express');
var cors = require('cors')
const models = require('../models');
const Project = models.Project;
const Message = models.Message;
const PublicVote = models.PublicVote;
const Table = models.Table;
const Event = models.Event;
const Sequelize = require('sequelize');
const bodyParser = require('body-parser');
const passport = require('passport');
const slugify = require('slugify');
const qr = require('qrcode');
const Stream = require('stream')
const fs = require('fs');
const path = require('path');
const os = require('os'); 

const AzureBlob = models.AzureBlob;
const Attachment = models.Attachment;
const Azure = require('../azure');

//temp folder for qrcodes
const tmpPath = fs.mkdtempSync(path.join(os.tmpdir(), 'coolestproject'))

if (!fs.existsSync(tmpPath)) {
  fs.mkdirSync(tmpPath)
}

const DBA = require('../dba');
const database = new DBA();

var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false })); // for SMS

router.use('/static', express.static('static'));
const corsOptions = {
  origin: '*',
  methods: [],
  allowedHeaders: [],
  exposedHeaders: [],
  credentials: true
};

var handlebars = require('handlebars');
handlebars.registerHelper("setVar", function (varName, varValue, options) {
  options.data.root[varName] = varValue;
});

router.get('/qr/sms/:projectId', cors(corsOptions), async function (req, res, next) {
  const project = await Project.findOne({
    where: {
      id: req.params.projectId,
    },
    include:[
      {
        model: Table,
        required: true
      }
    ]
  });
  
  if (!project) {
    return next(new Error('Project not found'))
  }

  let tableTxt = 'Table'
  if (project.project_lang == 'fr') {
    tableTxt = 'Table'
  } else if (project.project_lang == 'nl') {
    tableTxt = 'Tafel'
  }
  const qrCodeText = `SMSTO:${ process.env.TWILIO_NUMBER }:${ tableTxt } ${ project.Tables[0].id }`
  
  const qrcode_filename = path.join(tmpPath, `sms${ req.params.projectId }.png`);
  if(!fs.existsSync(qrcode_filename)){
    const stream = fs.createWriteStream(qrcode_filename);
    await qr.toFileStream(stream, qrCodeText)
  }
  res.sendFile(qrcode_filename);
});

router.get('/qr/planning/:eventId', cors(corsOptions), async function (req, res, next) {
  const event = await Event.findByPk(req.params.eventId, { attributes: ['id', 'event_title'] });
  if (!event) {
    return next(new Error('Event not found'))
  }

  const qrCodeText = `${ new URL('website/' + slugify(event.event_title), process.env.BACKENDURL) }`
  
  const qrcode_filename = path.join(tmpPath, `planning${ req.params.eventId }.png`);
  if(!fs.existsSync(qrcode_filename)){
    const stream = fs.createWriteStream(qrcode_filename);
    await qr.toFileStream(stream, qrCodeText)
  }
  res.sendFile(qrcode_filename);
});

router.get('/:eventSlug/', cors(corsOptions), async function (req, res, next) {
  const events = await Event.findAll({ attributes: ['id', 'event_title'] });
  const slugList = events.map((item) => slugify(item.event_title));
  const eventIndex = slugList.indexOf(req.params.eventSlug);

  if (eventIndex === -1) {
    return next(new Error('event not found'))
  }

  const event = await Event.findByPk(events[eventIndex].id)
  if (event === null) {
    return next(new Error('event not found'))
  }

  const locations = await event.getLocations()
  const tablesGroupedCount = await Table.findAll(
    {
      attributes: ['LocationId', 'EventId', [Sequelize.fn('count', Sequelize.col('LocationId')), 'count']],
      group: ['LocationId', 'EventId'],
      having: { 'EventId': event.get('id') }
    }
  )
  // we need header values in the first row so + 1 for length
  const maxTablesCount = Math.max(...tablesGroupedCount.map(o => o.get('count')), 0) + 1;

  const result = Array(maxTablesCount).fill().map(() => Array(locations.length));
  for (const [i, location] of locations.entries()) {
    result[0][i] = {
      name: location.get('text'),
      header: true
    }

    let tables = await location.getTables()
    for (const [j, table] of tables.entries()) {
      let projectList = []
      let projects = await table.getProjects()
      let Needs = true
      let tableEquip = "";
      if (tables[j]?.requirements !== null) { tableEquip = JSON.stringify(tables[j]?.requirements); Needs = true }

      for (let project of projects) {
        let participantsList = []
        let owner = await project.getOwner()
        let agreedToPhoto = true
        if (owner) {
          participantsList.push(owner)
          agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
        }
        let participants = await project.getParticipant()
        if (participants) {
          for (let participant of participants) {
            agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
          }
          participantsList.push(...participants)
        }

        let attachments = await project.getAttachments({ where: { confirmed: true } })

        let cardStyle = ''
        if (!agreedToPhoto) {
          cardStyle = 'border-danger'
        } else if (project.get('project_lang') == 'nl') {
          cardStyle = 'border-primary'
        } else if (project.get('project_lang') == 'fr') {
          cardStyle = 'border-secondary'
        }
        let endTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('endTime'));
        let startTime = new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let testTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let yesdescript = true;

        if (endTime == '00:00') { endTime = 0; yesdescript = true };
        if (testTime == '00:00') { endTime = 0; yesdescript = true };
        let requirements = project.get('project_type');


        projectList.push({
          'style': cardStyle,
          'language': project.get('project_lang'),
          'startTime': startTime,
          'endTime': endTime,
          'projectName': project.get('project_name'),
          'projectID': project.get('id'),
          'participants': participantsList.map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }).join(', '),
          'link': (await attachments.pop()?.getHyperlink())?.get('href'),
          'description': project.get('project_descr'),
          'agreedToPhoto': agreedToPhoto,
          'startTimeShort': new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime')),
          'yesdescript': yesdescript
        })

        const url = req.originalUrl;
        const last = url.charAt(url.length - 1);
        if (last != '/') { eventId = last }
        console.log(req.originalUrl);
        console.log(last);
      }

      result[j + 1][i] = {
        name: table.get('name'),
        projects: projectList
      }
    }
  }

  res.render('coolestprojects2022.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    grid: result
  })
});

// TOBE Removed after discussion with the web team
router.get('/coolestprojects2022/:eventId/', cors(corsOptions), async function (req, res, next) {
  // create a planning table structure 
  // x -> list of locations
  // y -> list of table
  // z -> list of projects

  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }
  // Save eventId from user input
  //eventId = event.id;
  const locations = await event.getLocations()
  const tablesGroupedCount = await Table.findAll(
    {
      attributes: ['LocationId', 'EventId', [Sequelize.fn('count', Sequelize.col('LocationId')), 'count']],
      group: ['LocationId', 'EventId'],
      having: { 'EventId': event.get('id') }
    }
  )
  // we need header values in the first row so + 1 for length
  const maxTablesCount = Math.max(...tablesGroupedCount.map(o => o.get('count')), 0) + 1;

  const result = Array(maxTablesCount).fill().map(() => Array(locations.length));
  for (const [i, location] of locations.entries()) {
    result[0][i] = {
      name: location.get('text'),
      header: true
    }


    let tables = await location.getTables()
    for (const [j, table] of tables.entries()) {
      let projectList = []
      let projects = await table.getProjects()
      let Needs = true
      let tableEquip = "";
      if (tables[j]?.requirements !== null) { tableEquip = JSON.stringify(tables[j]?.requirements); Needs = true }

      //console.log("tableEquip:",tableEquip)
      //console.log("Needs:",Needs)


      for (let project of projects) {
        let participantsList = []
        let owner = await project.getOwner()
        let agreedToPhoto = true
        if (owner) {
          participantsList.push(owner)
          agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
        }
        let participants = await project.getParticipant()
        if (participants) {
          for (let participant of participants) {
            agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
          }
          participantsList.push(...participants)
        }

        let attachments = await project.getAttachments({ where: { confirmed: true } })

        let cardStyle = ''
        if (!agreedToPhoto) {
          cardStyle = 'border-danger'
        } else if (project.get('project_lang') == 'nl') {
          cardStyle = 'border-primary'
        } else if (project.get('project_lang') == 'fr') {
          cardStyle = 'border-secondary'
        }
        let endTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('endTime'));
        let startTime = new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let testTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let yesdescript = true;

        if (endTime == '00:00') { endTime = 0; yesdescript = true };
        if (testTime == '00:00') { endTime = 0; yesdescript = true };
        let requirements = project.get('project_type');

        const participantsPhotoList = []
        for (const participant of participantsList) {
          const questions = await participant.getQuestions();
          const photoAllowed = questions.some((q) => { return q.name == 'Agreed to Photo' });
          participantsPhotoList.push(
            participant.get('firstname') + ' ' + participant.get('lastname') + ((!photoAllowed) ? ' (no photo)' : '')
          )
        }

        projectList.push({
          'style': cardStyle,
          'language': project.get('project_lang'),
          'startTime': startTime,
          'endTime': endTime,
          'projectName': project.get('project_name'),
          'projectID': project.get('id'),
          'participants': participantsPhotoList.join(', '),
          'link': (await attachments.pop()?.getHyperlink())?.get('href'),
          'description': project.get('project_descr'),
          'agreedToPhoto': agreedToPhoto,
          'startTimeShort': new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime')),
          'yesdescript': yesdescript
        })
        //console.log(projectList)  ;

        const url = req.originalUrl;
        const last = url.charAt(url.length - 1);
        if (last != '/') { eventId = last }
        console.log(req.originalUrl);
        console.log(last);
      }

      result[j + 1][i] = {
        name: table.get('name'),
        projects: projectList
      }
    }
  }
  //console.log(result)


  res.render('coolestprojects2022.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    grid: result
  })
});



router.get('/planning/:eventId/projects.xml', cors(corsOptions), async function (req, res) {
  const { create } = require('xmlbuilder');
  var root = create('projects.xml');
  var projects = await Project.findAll({ where: { eventId: req.params.eventId } });

  for (let project of projects) {
    let owner = await project.getOwner()
    let participants = await project.getParticipant()
    let attachments = await project.getAttachments({ where: { confirmed: true } })

    root.root().ele('project', {
      'Language': project.get('project_lang'),
      'ProjectName': project.get('project_name'),
      'ProjectID': project.get('id'),
      'participants': [owner].concat(participants).map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }).join(', '),
      'link': (await attachments[0]?.getHyperlink())?.get('href'),
      'Description': project.get('project_descr')
    });
  }
  const xml = root.end({ pretty: true });
  res.set('Content-Type', 'text/xml');
  res.send(xml);

});


router.get('/planning/:eventId/projects.json', cors(corsOptions), async function (req, res) {
  var projects = await Project.findAll({ where: { eventId: req.params.eventId } });
  var response = []

  for (let project of projects) {
    let sas = null;
    
    let owner = await project.getOwner();
    let participants = await project.getParticipant();
    let attachments = await project.getAttachments({ where: { confirmed: true } });
    let blob = await attachments[0]?.getAzureBlob();
    if (blob) {
      sas = await Azure.generateSAS(blob.blob_name, 'r', attachments[0]?.filename, blob.container_name);  
    }
    let table = await project.getTables()
    let tableEquip = table[0]?.requirements
    if (!tableEquip) { tableEquip = "" }
    response.push({
      'projectName': project.get('project_name'),
      'Language': project.get('project_lang'),
      'projectID': project.get('id'),
      'participants': [owner].concat(participants).map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }).join(', '),
      'link': (await attachments[0]?.getHyperlink())?.get('href'),
      'pic' : sas?.url,
      'location': table[0]?.LocationId,
      'place': table[0]?.name,
      'usedPlaces': table[0]?.ProjectTable.get('usedPlaces'),
      'techrequire': project.get('project_type'),
      'tableEquip': tableEquip,
      'description': project.get('project_descr')
    })
  }
  res.json(response);
});

router.get('/planning/:eventId/', cors(corsOptions), passport.authenticate('planning_login'), async function (req, res, next) {
  // create a planning table structure 
  // x -> list of locations
  // y -> list of table
  // z -> list of projects

  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }
  // Save eventId from user input
  //eventId = event.id;
  const locations = await event.getLocations()
  const tablesGroupedCount = await Table.findAll(
    {
      attributes: ['LocationId', 'EventId', [Sequelize.fn('count', Sequelize.col('LocationId')), 'count']],
      group: ['LocationId', 'EventId'],
      having: { 'EventId': event.get('id') }
    }
  )
  // we need header values in the first row so + 1 for length
  const maxTablesCount = Math.max(...tablesGroupedCount.map(o => o.get('count')), 0) + 1;

  const result = Array(maxTablesCount).fill().map(() => Array(locations.length));
  for (const [i, location] of locations.entries()) {
    result[0][i] = {
      name: location.get('text'),
      header: true
    }


    let tables = await location.getTables()
    for (const [j, table] of tables.entries()) {
      let projectList = []
      let projects = await table.getProjects()
      let Needs = true
      let tableEquip = "";
      if (tables[j]?.requirements !== null) { tableEquip = JSON.stringify(tables[j]?.requirements); Needs = true }

      //console.log("tableEquip:",tableEquip)
      //console.log("Needs:",Needs)


      for (let project of projects) {
        let participantsList = []
        let owner = await project.getOwner()
        let agreedToPhoto = true
        if (owner) {
          participantsList.push(owner)
          agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
        }
        let participants = await project.getParticipant()
        if (participants) {
          for (let participant of participants) {
            agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
          }
          participantsList.push(...participants)
        }

        let attachments = await project.getAttachments({ where: { confirmed: true } })

        let cardStyle = ''
        if (!agreedToPhoto) {
          cardStyle = 'border-danger'
        } else if (project.get('project_lang') == 'nl') {
          cardStyle = 'border-primary'
        } else if (project.get('project_lang') == 'fr') {
          cardStyle = 'border-secondary'
        }
        let endTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('endTime'));
        let startTime = new Intl.DateTimeFormat('nl-BE', { dateStyle: 'medium', timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let testTime = new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime'));
        let yesdescript = true;
        // let Needs = false;

        if (endTime == '00:00') { endTime = 0; yesdescript = false; Needs = true };
        if (testTime == '00:00') { endTime = 0; yesdescript = false; Needs = true };
        let requirements = project.get('project_type');


        projectList.push({
          'style': cardStyle,
          'language': project.get('project_lang'),
          'startTime': startTime,
          'endTime': endTime,
          'projectName': project.get('project_name'),
          'projectID': project.get('id'),
          'participants': participantsList.map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }).join(', '),
          'link': (await attachments.pop()?.getHyperlink())?.get('href'),
          'description': project.get('project_descr'),
          'agreedToPhoto': agreedToPhoto,
          'startTimeShort': new Intl.DateTimeFormat('nl-BE', { timeStyle: 'short' }).format(project.ProjectTable.get('startTime')),
          'techrequire': requirements,
          'Needs': Needs,
          'tableEquip': tableEquip,
          'yesdescript': yesdescript
        })
        //console.log(projectList)  ;

        const url = req.originalUrl;
        const last = url.charAt(url.length - 1);
        if (last != '/') { eventId = last }
        //console.log(req.originalUrl);
        //console.log(last);
      }

      result[j + 1][i] = {
        name: table.get('name'),
        projects: projectList
      }
    }
  }
  //console.log(result)


  res.render('calendar.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    grid: result
  })
});

router.get('/presentation/:eventId/', cors(corsOptions), async function (req, res, next) {
  // create a planning table structure 
  // x -> list of locations
  // y -> list of table
  // z -> list of projects

  //console.log("=====parameter input:...planning/2/?Project=##")
  //console.log(req.query)


  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }
  const locations = await event.getLocations()
  const tablesGroupedCount = await Table.findAll(
    {
      attributes: ['LocationId', 'EventId', [Sequelize.fn('count', Sequelize.col('LocationId')), 'count']],
      group: ['LocationId', 'EventId'],
      having: { 'EventId': event.get('id') }
    }
  )

  // we need header values in the first row so + 1 for length
  const maxTablesCount = Math.max(...tablesGroupedCount.map(o => o.get('count')), 0) + 1;

  const result = Array(maxTablesCount).fill().map(() => Array(locations.length));
  for (const [i, location] of locations.entries()) {
    result[0][i] = {
      name: location.get('text'),
      header: true
    }

    let tables = await location.getTables()

    for (const [j, table] of tables.entries()) {
      let projectList = []
      let projects = await table.getProjects()
      let tableEquip = "";

      if (projects != []) {
        for (let project of projects) {

          if (!req.query.ProjectId || project.get('id') == req.query.ProjectId) {
            let participantsList = []
            let owner = await project.getOwner()
            let agreedToPhoto = true

            if (owner) {
              participantsList.push(owner)
              agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
            }
            let participants = await project.getParticipant()

            if (participants) {
              for (let participant of participants) {
                agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
              }
              participantsList.push(...participants)
            }

            let attachments = await project.getAttachments({ where: { confirmed: true } })

            let cardStyle = ''
            if (!agreedToPhoto) {
              cardStyle = 'border-danger'
            } else if (project.get('project_lang') == 'nl') {
              cardStyle = 'border-primary'
            } else if (project.get('project_lang') == 'fr') {
              cardStyle = 'border-secondary'
            }

            projectList.push({
              'style': cardStyle,
              'language': project.get('project_lang'),
              'name': table.name,
              'projectName': project.get('project_name'),
              'projectID': project.get('id'),
              'participants': participantsList.map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }).join(', '),
              'link': (await attachments.pop()?.getHyperlink())?.get('href'),
              'description': project.get('project_descr'),
              'messages': '😎<====Running text footer for important messages 🎯 =====<<===Running text 😅<',
              // https://getemoji.com/     https://www.tutorialspoint.com/html/html_marquees.htm
              'agreedToPhoto': agreedToPhoto
            })
            //console.log("====>projectList")
            //console.log(projectList)

            result[j + 1][i] = {
              name: table.get('name'),
              projects: projectList
            }
          }
        }
      }
    }
  }

  //console.log(result)

  res.render('presentation.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    grid: result
  })
});

router.get('/projectview/:eventId/map', cors(corsOptions), async function (req, res, next) {
  
  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }
  var projects = await Project.findAll({ 
      where: { eventId: req.params.eventId }, 
      include:[
         { 
             model: Attachment, 
             include: [
                 {model: AzureBlob}
             ],
             where: { confirmed: true }, 
             required: false
         },
      ]
  });

  const render_projects = [];
  for (let project of projects) {
    let owner = await project.getOwner()
    let participants = await project.getParticipant()
    let agreedToPhoto = true
    if (owner) {
      agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
    }
    if (participants) {
      for (let participant of participants) {
        agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
      }
    }
    
    const evStorage = event.azure_storage_container
    let piclink = ''
    const attachment = (await project.getAttachments({where: { confirmed: true }}))[0]
    if (attachment) {
        // console.log('attachment: ', attachment)
        const azureblob = await attachment.getAzureBlob()
        // console.log('azureblob: ', azureblob)
        const sas = await Azure.generateSAS(azureblob.blob_name, 'r', attachment.filename, azureblob.container_name)        
        piclink = sas.url
        // console.log('piclink: ', piclink)
    }
	    
    const table = (await project.getTables())?.[0]?.name;
    table_id = parseInt(table?.replace(' ', '_').split('_').at(-1)) || 0
    
    if (table_id == 0){
        continue
    }
    
    //console.log('table_id: ', table_id)
    
    render_projects.push({
      language: project.get('project_lang').toUpperCase(),
      projectName: project.get('project_name'),
      participants: [owner].concat(participants).map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }),
      description: project.get('project_descr'),
      agreedToPhoto: agreedToPhoto,
      tableNumber: table_id,
      picturLink: piclink, //'https://dummyimage.com/500x300.png',
      voteLink: 'sms:' + process.env.TWILIO_NUMBER + ';?&body=' + ("0" + table_id).slice (-2),
      projectId: project.get('id')
    })
  }
  
  res.render('projectview_map.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    eventId: req.params.eventId,
    projects: render_projects.sort((p1, p2) => (p1.tableNumber < p2.tableNumber) ? -1 : (p1.tableNumber > p2.tableNumber) ? 1 : 0)
  })

});

router.get('/projectview/:eventId/', cors(corsOptions), async function (req, res, next) {
  
  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }
  var projects = await Project.findAll({ 
      where: { eventId: req.params.eventId }, 
      include:[
         { 
             model: Attachment, 
             include: [
                 {model: AzureBlob}
             ],
             where: { confirmed: true }, 
             required: false
         },
      ]
  });

  const render_projects = [];
  for (let project of projects) {
    let owner = await project.getOwner()
    let participants = await project.getParticipant()
    let agreedToPhoto = true
    if (owner) {
      agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
    }
    if (participants) {
      for (let participant of participants) {
        agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
      }
    }
    
    const evStorage = event.azure_storage_container
    let piclink = ''
    const attachment = (await project.getAttachments({where: { confirmed: true }}))[0]
    if (attachment) {
        // console.log('attachment: ', attachment)
        const azureblob = await attachment.getAzureBlob()
        // console.log('azureblob: ', azureblob)
        const sas = await Azure.generateSAS(azureblob.blob_name, 'r', attachment.filename, azureblob.container_name)        
        piclink = sas.url
        // console.log('piclink: ', piclink)
    }
	    
    const table = (await project.getTables())?.[0]?.name;
    table_id = parseInt(table?.replace(' ', '_').split('_').at(-1)) || 0
    
    if (table_id == 0){
        continue
    }
    
    //console.log('table_id: ', table_id)
    
    render_projects.push({
      language: project.get('project_lang').toUpperCase(),
      projectName: project.get('project_name'),
      participants: [owner].concat(participants).map((ele) => { return ele.get('firstname') + ' ' + ele.get('lastname') }),
      description: project.get('project_descr'),
      agreedToPhoto: agreedToPhoto,
      tableNumber: table_id,
      picturLink: piclink, //'https://dummyimage.com/500x300.png',
      voteLink: 'sms:' + process.env.TWILIO_NUMBER + ';?&body=' + ("0" + table_id).slice (-2),
      projectId: project.get('id')
    })
  }
  
  res.render('projectview_list.handlebars', {
    eventName: event.event_title,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
    eventId: req.params.eventId,
    projects: render_projects.sort((p1, p2) => (p1.tableNumber < p2.tableNumber) ? -1 : (p1.tableNumber > p2.tableNumber) ? 1 : 0)
  })

});

router.get('/project-list/:eventId', cors(corsOptions), async function (req, res, next) {
  const event = await Event.findByPk(req.params.eventId)
  if (event === null) {
    return next(new Error('event not found'))
  }

  const projects = await Project.findAll({
    where: {
      eventId: event.id,
    },
    attributes: ['id'],
    include:[
      {
        model: Table,
        required: true,
        attributes: []
      }
    ]
  });

  res.json(projects);
});

router.get('/video-presentation/:eventId/', cors(corsOptions), async function (req, res, next) {
  
  if (typeof req.query.Projectid === "undefined") {
    console.log('Video-presentation: parameter is wrong', req.query, ' should be: ?projectid=<nn>');
  }else {
  const project = await Project.findOne({
    where: {
      id: req.query.Projectid,
      eventId: req.params.eventId
    },
    include:[
      {
        model: Table,
        required: true
      }
    ]
  });

  if(!project){
    return next(new Error('project not found'))
  }

  const event = await Event.findByPk(req.params.eventId)

  if (event === null) {
    return next(new Error('event not found'))
  }
  const evStorage = event.azure_storage_container

  let image = '-image'
  let position1 = evStorage.search(/-test/)
  let position2 = evStorage.search(/-dev/)
  if (position1 >= 0 || position2 >= 0) { image = ''}
  const activeMessage = await Message.findOne({
    where: {
      startAt: { [Sequelize.Op.lt]: Sequelize.literal('CURRENT_TIMESTAMP()') },
      endAt: { [Sequelize.Op.gt]: Sequelize.literal('CURRENT_TIMESTAMP()') },
      eventId: event.id
    }
  });

  let participantsList = []
  let table = await project.getTables()
  let agreedToPhoto = true

  let owner = await project.getOwner()
  if (owner) {
    participantsList.push(owner)
    agreedToPhoto = agreedToPhoto && (await owner.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
  }
  let participants = await project.getParticipant()
  if (participants) {
    for (let participant of participants) {
      agreedToPhoto = agreedToPhoto && (await participant.getQuestions()).some((ele) => { return ele.name == 'Agreed to Photo' })
    }
    participantsList.push(...participants)
  }

  let cardStyle = ''
  if (!agreedToPhoto) {
    cardStyle = 'border-danger'
  } else if (project.get('project_lang') == 'nl') {
    cardStyle = 'border-primary'
  } else if (project.get('project_lang') == 'fr') {
    cardStyle = 'border-secondary'
  }

  let hlink2 = ''
  const attachment = (await project.getAttachments({where: {confirmed: true }}))[0]

  if (attachment) {
      const aazureblob = await attachment.getAzureBlob()
      const ssas = await Azure.generateSAS(aazureblob.blob_name, 'r', attachment.filename, aazureblob.container_name)        
      hlink2 = ssas.url
  }
  //let hlink2 = 'https://coolestprojects.blob.core.windows.net/'+ evStorage + image +'/proj-' + project.id + '.png'
  
  tName = table[0]?.name.replaceAll("3_", "")
  vNumber = ''
  if (!tName) {
    tName = "not yet assigned"
  } else { vNumber = tName.match(/\d+/)[0] }

  const participantsPhotoList = []
  for (const participant of participantsList) {
    const questions = await participant.getQuestions();
    const photoAllowed = questions.some((q) => { return q.name == 'Agreed to Photo' });
    participantsPhotoList.push(
      participant.get('firstname') + ' ' + participant.get('lastname') + ((!photoAllowed) ? ' (no photo)' : '')
    )
  }

  const projectforUI = {
    'style': cardStyle,
    'language': project.get('project_lang'),
    'projectName': project.get('project_name'),
    'participants': participantsPhotoList.join(','),
    'link2': hlink2,
    'description': project.get('project_descr'),
    'agreedToPhoto': agreedToPhoto,
    'location': 'Voting Number: ' + vNumber + '    ',
    'name': 'table_' + vNumber, 
    'tableNumber': 'table_' + vNumber,     //tName.toLowerCase().replaceAll(" ", "_"),
    'messages': activeMessage?.message
  }

  const result = {
    project: projectforUI,
  }
  res.render('video-presentation.handlebars', {
    project: projectforUI,
    eventDate: new Intl.DateTimeFormat('nl-BE', { dateStyle: 'short' }).format(event.officialStartDate),
  })
  return
};
});

module.exports = router; 

console.log('Website index.js done');
