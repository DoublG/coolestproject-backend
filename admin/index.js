const AdminJS = require('adminjs')
const AdminJSExpress = require('@adminjs/express')
const passport = require('passport')
const express = require('express')
const app = express()
const db = require('../models');
const importExportFeature = require('@adminjs/import-export').default;
//const router = AdminJSExpress.buildRouter(adminJs)
const AdminJSSequelize = require('@adminjs/sequelize')

//const session = require("express-session");
//const SequelizeStore = require('connect-session-sequelize')(session.Store);

const AzureBlob = db.AzureBlob;
const Attachment = db.Attachment;
const ProjectTable = db.ProjectTable;
const Voucher = db.Voucher;
const User = db.User
const Project = db.Project
const Hyperlink = db.Hyperlink
var DBA = require('../dba');
const Azure = require('../azure');
const database = new DBA(Azure);
const sequelize = db.sequelize;
//const sessionStore = new SequelizeStore({ db: sequelize });
var stream = require('stream');
var Mail = require('../mailer');
const Token = require('../jwts');
const { triggerAsyncId } = require('async_hooks');
const Sequelize = require('sequelize');


const projectParent = {
  name: 'Projects',
  icon: 'Roadmap'
}

const projectHistory = {
  name: 'History',
  icon: 'Roadmap'
}
const reportParent = {
  name: 'Reporting',
  icon: 'fa fa-stream',
}

const internalParent = {
  name: 'Internal',
  icon: 'fa fa-exclamation-triangle',
}

const eventParent = {
  name: 'Event Settings',
  icon: 'Events'
}

const registerParent = {
  name: 'Configuration Tables',
  icon: 'Flow'
}

const votingParent = {
  name: 'Voting',
  icon: 'Event'
}

const planningParent = {
  name: 'On-site Planning',
  icon: 'Location'
}

const adminParent = {
  name: 'Administration',
  icon: 'Identification'
}


function superAdminAllowed({ currentAdmin }) {
 return currentAdmin.account_type === 'super_admin'
}

function adminAllowed({ currentAdmin }) {
 return superAdminAllowed({ currentAdmin }) || currentAdmin.account_type === 'admin'
}

function adminAllowedOwnUser(context) {
  return superAdminAllowed({ currentAdmin: context.currentAdmin }) || (context.currentAdmin.account_type === 'admin' && context.record.params.email === context.currentAdmin.email)
}


const adminJsOptions = {
  databases: [db],
  rootPath: '/admin',
  dashboard: {
    handler: async () => {
      const evt = await database.getEventActive()
      return { ...evt.dataValues, questions: evt.questions, tshirts: evt.tshirts };
    },
    component: AdminJS.bundle('./components/dashboard')
  },
  branding: {
    companyName: 'Coolest Projects',
  },
  locale: {
    translations: {
      labels: {
        contactlist: 'Show contacts current event',
        ShowUserWithNoProject: 'Show User(s) With No Project',
        showprojectusersemail: 'Show Project Users Email',
        ShowAttachmentLoaded: 'Show Attachment(s) Loaded'
      }
    }
  },
  resources: [
    {
      resource: db.Sessions,
      options: {
        navigation: adminParent,
        actions: {
          new: {
            isAccessible: superAdminAllowed
          },
          edit: {
            isAccessible: superAdminAllowed
          },
          delete: {
            isAccessible: superAdminAllowed
          },
          show: {
            isAccessible: superAdminAllowed
          },
          list: {
            isAccessible: superAdminAllowed
          }
        }
      },
    },
    {
      resource: db.Account,
      options: {
        navigation: adminParent,
        properties: {
          account_type: {
            isVisible: {
              filter: true,
              list: true,
              show: true,
              edit: true
            }
          }
        },
        actions: {
          new: {
            isAccessible: superAdminAllowed
          },
          edit: {
            isAccessible: adminAllowedOwnUser,
            before: async (request, { currentAdmin }) => {
              function changeAccountType() {
                if (currentAdmin.account_type === 'super_admin') {
                  return request.payload.account_type
                }
                return currentAdmin.account_type
              }
              request.payload = {
                ...request.payload,
                account_type: changeAccountType()
              }
              return request




              if (currentAdmin.account_type === 'super_admin')

                console.log('index.js_01_super admin:')
              return request
            }
          },
          delete: {
            isAccessible: adminAllowed
          },
          show: {
            isAccessible: adminAllowed
          },
          list: {
            before: async (request, { currentAdmin }) => {
              if (currentAdmin.account_type != 'super_admin')
                request.query = { ...request.query, 'filters.email': currentAdmin.email }
              return request
            },
            isAccessible: adminAllowed
          }
        }
      },
    },
    {
      resource: db.Event,
      options: {
        navigation: eventParent,
        properties: {
          event_title: {
            isTitle: true,
            label: 'event'
          },
          overdue_registration: {
            list: true,
            show: true
          },
          waiting_list: {
            list: true,
            show: true
          },
          days_remaining: {
            list: true,
            show: true
          },
          total_males: {
            list: true,
            show: true
          },
          total_females: {
            list: true,
            show: true
          },
          total_X: {
            list: true,
            show: true
          },
          tlang_nl: {
            list: true,
            show: true
          },
          tlang_fr: {
            list: true,
            show: true
          },
          tlang_en: {
            list: true,
            show: true
          },
          tcontact: {
            list: true,
            show: true
          },
          tphoto: {
            list: true,
            show: true
          },
          tclini: {
            list: true,
            show: true
          },
          total_unusedVouchers: {
            list: true,
            show: true
          },
          total_unusedVouchers: {
            list: true,
            show: true
          },
          pending_users: {
            list: true,
            show: true
          },
          total_users: {
            list: true,
            show: true
          },
          total_videos: {
            list: true,
            show: true
          },
          total_projects: {
            list: true,
            show: true
          },
          current: {
            isDisabled: true,
            type: "boolean"
          },
          closed: {
            isDisabled: true,
            type: "boolean"
          }
        },
        actions: {
          list: {
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const evt = await database.getEventDetail(r.params['id']);
                  const properties = await evt.get({ plain: true });
                  for (let p in properties) {
                    r.params[p] = properties[p];
                  }
                } catch (error) {
                  console.log('index.js_02',error)
                }
                return r
              }));
              return response
            },
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }

              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.id': event.id }
              return request
            }
          },
          show: {
            after: async (response, request, context) => {
              try {
                const evt = await database.getEventDetail(response.record.params.id);
                const properties = await evt.get({ plain: true });
                for (let p in properties) {
                  response.record.params[p] = properties[p];
                }
              } catch (error) {
                console.log('index.js_03',error)
              }
              return response;
            }
          },
          new: {
            isAccessible: superAdminAllowed
          },
          edit: {
            isAccessible: superAdminAllowed
          },
          delete: {
            isAccessible: superAdminAllowed
          },
          syncAzureSettings: {
            isAccessible: superAdminAllowed,
            actionType: 'record',
            label: 'Sync Azure',
            icon: 'fas fa-envelope',
            component: false,
            handler: async (request, response, data) => {
              const { record, resource, currentAdmin, h } = data
              try {
                const evt = await database.getEventDetail(request.params.recordId);
                await Azure.syncSetting(evt.azure_storage_container);
                return {
                  record: record.toJSON(currentAdmin),
                  redirectUrl: h.resourceUrl({ resourceId: resource._decorated?.id() || resource.id() }),
                  notice: {
                    message: `Sync Azure settings for ${evt.id}`,
                    type: 'success',
                  },
                }
              } catch (error) {
                return {
                  record: data.record.toJSON(data.currentAdmin),
                  notice: {
                    message: error,
                    type: 'error',
                  },
                }
              }
            }
          },
          showDashboard: {
            actionType: 'record',
            label: 'Dashboard',
            icon: 'fas fa-gauge',
            component: true,
            handler: async (request, response, data) => {
              const { record, resource, currentAdmin, h } = data
              const evt = await database.getEventDetail(request.params.recordId)
              console.log('index.js_04',record.toJSON(evt))
              return {
                record: record.toJSON(evt),
              }
            },
            component: AdminJS.bundle('./components/eventDashboard')
          },
          setActive: {
            isAccessible: superAdminAllowed,
            icon: 'View',
            actionType: 'record',
            component: false,
            handler: async (request, response, data) => {
              const { record, resource, currentAdmin, h } = data
              try {
                const evt = await database.setEventActive(request.params.recordId)
                return {
                  record: record.toJSON(currentAdmin),
                  redirectUrl: h.resourceUrl({ resourceId: resource._decorated?.id() || resource.id() }),
                  notice: {
                    message: `Event ${evt.id} is active`,
                    type: 'success',
                  },
                }
              } catch (error) {
                return {
                  record: data.record.toJSON(data.currentAdmin),
                  notice: {
                    message: error,
                    type: 'error',
                  },
                }
              }
            }
          }
        }
      }
    },
    {
      resource: db.Question,
      options: {
        navigation: registerParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.QuestionTranslation,
      options: {
        navigation: registerParent,
        properties: {
          EventId: {
            isVisible: { list: true, filter: true, show: false, edit: false },
          }
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }

      }
    },
    {
      resource: db.TShirtGroup,
      options: {
        navigation: registerParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.TShirtGroupTranslation,
      options: {
        navigation: registerParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.TShirt,
      options: {
        navigation: registerParent,
        properties: {
          eventId: {
            isVisible: { list: true, filter: true, show: false, edit: false },
          }
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.TShirtTranslation,
      options: {
        navigation: registerParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }
      }
    },

    {
      resource: db.Registration,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: projectParent,
        actions: {
          new: {
            isVisible: true
          },
          mailAction: {
            actionType: 'record',
            label: 'Resend confirmation mail',
            icon: 'fas fa-envelope',
            isVisible: true,
            component: false,
            handler: async (request, response, data) => {
              if (!request.params.recordId || !data.record) {
                throw new NotFoundError([
                  'You have to pass "recordId" to Mail Action',
                ].join('\n'), 'Action#handler');
              }
              try {
                const registration = await database.getRegistration(request.params.recordId);
                const event = await registration.getEvent();
                const token = await Token.generateRegistrationToken(registration.id);
                const mail = await Mail.activationMail(registration, token, event);
                console.log(`index.js_05:Mail was send ${mail}`);
              } catch (error) {
                return {
                  record: data.record.toJSON(data.currentAdmin),
                  notice: {
                    message: error,
                    type: 'error',
                  },
                }
              }
              return {
                record: data.record.toJSON(data.currentAdmin),
                notice: {/*  */
                  message: 'Re-registration mail sent',
                  type: 'success',
                },
              }
            },
          },
          actions: {}
        },
        properties: {
          internalinfo: { type: 'richtext' }
          // createdAt: { isVisible: { list: false } },
          // updatedAt: { isVisible: { list: false } }
        }
      }
    },

    {
      resource: db.QuestionRegistration,
      options: {
        navigation: projectParent
      },
      actions: {
        list: {
          before: async (request, { currentAdmin }) => {
            request.query.perPage ??= 100;
            if (superAdminAllowed({ currentAdmin })) {
              return request;
            }
            const event = await database.getEventActive();
            request.query = { ...request.query, 'filters.EventId': event.id }
            return request
          }
        }
      }
    },
    {
      resource: db.Project,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: projectParent,
        properties: {
          project_id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          }, 
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },          
          project_lang: {
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
          project_type: {
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
          updatedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          project_name: {
            isTitle: true,
            label: 'project',
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          ownerId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          createdAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          eventId: {
            isVisible: { list: false, filter: true, show: true, edit: false },
          },
          max_tokens: {
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          project_descr: { 
            isVisible: { list: true, filter: true, show: true, edit: true }

          },
          internalinfo: { 
            isVisible: { list: true, filter: false, show: true, edit: true },
            type: 'richtext' },
          
          /*
          totalAttachments: {
            list: true,
            show: true,
            filter: false
          },
          totalAzureBlobs: {
            list: true,
            show: true,
            filter: false
          },
          videoConfirmed: {
            list: true,
            show: true,
            filter: false,
            type: 'boolean'
          },
          videoConfirmedId: {
            list: true,
            show: true,
            filter: false,
          },
          confirmedHref: {
            list: true,
            show: true,
            filter: false
          }*/
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 200;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const attachments = await Attachment.findAndCountAll({ includes: [{ model: AzureBlob, includes: [Hyperlink] }], where: { 'projectId': r.params['id'] } })
                  r.params.totalAttachments = attachments.count

                  let successCount = 0;
                  let confirmed = false;
                  let confirmedId = -1;
                  let confirmedHref = '';
                  for (let a of attachments.rows) {
                    const azureBlob = await a.getAzureBlob();
                    successCount += (await Azure.checkBlobExists(azureBlob.get('blob_name'), azureBlob.get('container_name'))) ? 1 : 0;
                    if (a.get('confirmed')) {
                      confirmed = true
                      confirmedId = a.get('id')
                      confirmedHref = (await a.getHyperlink())?.get('href')
                    }
                  }
                  r.params.totalAzureBlobs = successCount
                  r.params.videoConfirmed = confirmed
                  r.params.confirmedHref = confirmedHref
                  r.params.videoConfirmedId = confirmedId
                } catch (error) {
                  console.log('index.js_06',error)
                }
                return r
              }));
              return response
            }
          },
          show: {
            after: async (response, request, context) => {
              try {
                const attachments = await Attachment.findAndCountAll({ includes: [{ model: AzureBlob, includes: [Hyperlink] }], where: { 'projectId': response.record.params.id } })
                response.record.params.totalAttachments = attachments.count

                let successCount = 0;
                let confirmed = false;
                let confirmedId = -1;
                let confirmedHref = '';
                for (let a of attachments.rows) {
                  const azureBlob = await a.getAzureBlob();
                  successCount += (await Azure.checkBlobExists(azureBlob.get('blob_name'), azureBlob.get('container_name'))) ? 1 : 0;
                  if (a.get('confirmed')) {
                    confirmed = true
                    confirmedId = a.get('id')
                    confirmedHref = (await a.getHyperlink())?.get('href')
                  }
                }
                response.record.params.totalAzureBlobs = successCount
                response.record.params.videoConfirmed = confirmed
                response.record.params.videoConfirmedId = confirmedId
                response.record.params.confirmedHref = confirmedHref
              } catch (error) {
                console.log('index.js_07',error)
              }
              return response;
            }
          },
          new: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id,
              }
              return request
            },
          }
        }
      }
    },
    {
      resource: db.User,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: projectParent,
        properties: {
          sizeId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          birthmonth: {
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          postalcode: {
            isVisible: { list: false, filter: false, show: false, edit: false },
          },
          municipality_name: {
            isVisible: { list: false, filter: false, show: false, edit: false },
          },
          street: {
            isVisible: { list: false, filter: false, show: false, edit: false },
          },
          house_number: {
            isVisible: { list: false, filter: false, show: false, edit: false },
          },
          box_number: {
            isVisible: { list: false, filter: false, show: false, edit: false },
          },
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          via: {
            isVisible: { list: false, filter: false, show: true, edit: true},
          },
          email_guardian: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          eventId: {
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          updatedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          createdAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          gsm_guardian: {
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          gsm: {
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          medical: {
            isVisible: { list: false, filter: false, show: true, edit: true },
          },
          last_token: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          internalinfo: { type: 'richtext',
          isVisible: { list: false, filter: false, show: true, edit: true }, },
          isOwner: {
            list: false,
            show: true,
            edit: false,
            filter: false,
            type: 'boolean'
          },
                    /*
          isParticipant: {
            list: false,
            show: true,
            filter: false,
            type: 'boolean'
          },
          hasProject: {
            list: false,
            show: true,
            filter: false,
            type: 'boolean'
          },*/
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 200;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const owner = await Project.count({ where: { ownerId: r.params['id'] } })
                  const participant = await Voucher.count({ where: { participantId: r.params['id'] } })
                  r.params.isOwner = (owner > 0) ? true : false
                  r.params.isParticipant = (participant > 0) ? true : false
                  r.params.hasProject = (owner > 0 || participant > 0) ? true : false
                } catch (error) {
                  console.log('index.js_08',error)
                }
                return r
              }));
              return response
            }
          },
          show: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id,
              }
              return request
            },
            after: async (response, request, context) => {
              try {
                const owner = await Project.count({ where: { ownerId: response.record.params.id } })
                const participant = await Voucher.count({ where: { participantId: response.record.params.id } })
                response.record.params.isOwner = (owner > 0) ? true : false
                response.record.params.isParticipant = (participant > 0) ? true : false
                response.record.params.hasProject = (owner > 0 || participant > 0) ? true : false
              } catch (error) {
                console.log('Admin index.js user.show.after', error)
              }
              return response;
            }
          },
          new: { // Poging tot vastleggen van EventId voor nieuwe records
            before: async (request, response, context) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id,
              }
              return request
            },
            after: async (response, request, context) => {
              // Vastleggen van EventId voor nieuwe records waar nog geen Event gekozen was
              const event = await database.getEventActive();
              response.record.params.eventId ??= event.id;
              return response;
            }
          }
        }
      }
    },
    {
      resource: db.QuestionUser,
      options: {
        navigation: projectParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.Voucher,
      options: {
        navigation: projectParent,
        properties: {
          eventId: {
            isVisible: { list: false, filter: true, show: false, edit: false },
          },
          projectId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          participantId: {
            isVisible: { list: true, filter: true, show: true ,edit: true },
          },
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {

              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          },
          edit: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id
              }
              return request
            }
          },
          new: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
                request.payload = {
                  ...request.payload,
                  eventId: event.id
                }
                return request
              }
           },
        }
      }
    },
    {
      resource: db.Certificate,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: votingParent,
        properties: {
          ProjectId: {
            isVisible: { list: true, filter: true, show: true, edit: true },
          },
          EventId: {
            isVisible: { list: true, filter: true, show: false, edit: true},
          },
          text: {
            isVisible: { list: true, filter: true, show: true, edit: true},
            type: 'textarea',
            props: {
              rows: 10,
            },
          },
          id: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          updatedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          createdAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 200;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          },
          edit: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id
              }
              return request
            }
          },
          new: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
                request.payload = {
                  ...request.payload,
                  eventId: event.id
                }
                return request
              }
           },
              
        },

      }
    },
    {
      resource: db.Attachment,
      options: {
        navigation: projectParent,
        properties: {
          id: {
            isVisible: {list: true, show: true, new: true,  filter: true},
          },
          createdAt: {
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          updatedAt: {
            isVisible: { list: false, filter: true, show: true, edit: true },
          },
          filename: {
            isVisible: {list: false, show: true, new: true,  filter: true},
          },
          name: {
            isVisible: {list: true, show: true, new: true,  filter: true},
          },
          azureExists: {
            list: true,
            show: true,
            new: false,
            filter: false,
            type: 'boolean'
          },
          downloadLink: {
            isVisible: {
              list: true,
              show: true,
              new: false,
              filter: false,
            },
            components: {
              list: AdminJS.bundle('./components/file'),
              show: AdminJS.bundle('./components/file'),
            },
          }
        },
        actions: {
          new: {
            isVisible: false
          },
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 200;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const attachment = await Attachment.findByPk(r.id, { include: [{ model: AzureBlob }] });
                  const sas = await Azure.generateSAS(attachment.AzureBlob.blob_name, 'r', attachment.filename, attachment.AzureBlob.container_name)
                  r.params['downloadLink'] = sas.url
                  r.params['azureExists'] = await Azure.checkBlobExists(attachment.AzureBlob.blob_name, attachment.AzureBlob.container_name);
                } catch (error) {
                  //ignore
                }
                return r
              }));
              return response
            },
          },
          show: {
            after: async (response, request, context) => {
              try {
                const attachment = await Attachment.findByPk(response.record.params.id, { include: [{ model: AzureBlob }] });
                const sas = await Azure.generateSAS(attachment.AzureBlob.blob_name, 'r', attachment.filename, attachment.AzureBlob.container_name)
                response.record.params['downloadLink'] = sas.url
                response.record.params['azureExists'] = await Azure.checkBlobExists(attachment.AzureBlob.blob_name, attachment.AzureBlob.container_name);
              } catch (error) {
                console.log('index.js_10',error)
              }
              return response;
            }
          }
        }
      }
    },
    {
      resource: db.AzureBlob,
      options: {
        navigation: projectParent,
        properties: {
          downloadLink: {
            isVisible: {
              list: true,
              show: true,
              new: false,
              filter: false,
            },
            components: {
              list: AdminJS.bundle('./components/file'),
              show: AdminJS.bundle('./components/file'),
            },
          },
          azureExists: {
            list: true,
            show: true,
            new: false,
            filter: false,
            type: 'boolean'
          }
        },
        actions: {
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 200;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.createdAt~~from': event.eventBeginDate }
              request.query = { ...request.query, 'filters.createdAt~~to': event.eventEndDate }
              return request
            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const blob = await AzureBlob.findByPk(r.id, { include: [{ model: Attachment }] });
                  const sas = await Azure.generateSAS(blob.blob_name, 'r', blob.Attachment.filename, blob.container_name)
                  r.params['azureExists'] = await Azure.checkBlobExists(blob.blob_name, blob.container_name);
                  r.params['downloadLink'] = sas.url
                } catch (error) {
                  //ignore
                }
                return r
              }));
              return response
            },
          },
          show: {
            after: async (response, request, context) => {
              try {
                const blob = await AzureBlob.findByPk(response.record.params.id, { include: [{ model: Attachment }] });
                const sas = await Azure.generateSAS(blob.blob_name, 'r', blob.Attachment.filename, blob.container_name)
                response.record.params['downloadLink'] = sas.url
                response.record.params['azureExists'] = await Azure.checkBlobExists(blob.blob_name, blob.container_name);
              } catch (error) {
                console.log('index.js_11',error)
              }
              return response;
            }
          },
        }
      }
    },
    {
      resource: db.Hyperlink,
      options: {
        navigation: projectParent,
        //sort:{direction:'DESC',sortBy: 'Attachment.id'},
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request

            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const hyperlink = await Hyperlink.findByPk(r.id, { include: [{ model: Attachment, include: [Project] }] });
                  r.params.projectId = hyperlink.Attachment.ProjectId
                  r.params.projectName = hyperlink.Attachment.Project.project_name
                } catch (error) {
                  //ignore
                }
                return r
              }));
              return response
            },
          },
          show: {
            after: async (response, request, context) => {
              try {
                const hyperlink = await Hyperlink.findByPk(response.record.params.id, { include: [{ model: Attachment, include: [Project] }] });
                response.record.params.projectId = hyperlink.Attachment.ProjectId
                response.record.params.projectName = hyperlink.Attachment.Project.project_name

              } catch (error) {
                console.log('index.js_12',error)
              }
              return response;
            }
          }
        }
      },
    },
    {
      resource: db.Vote,
      options: {
        navigation: votingParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 500;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.createdAt~~from': event.eventBeginDate }
              request.query = { ...request.query, 'filters.createdAt~~to': event.eventEndDate }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.VoteCategory,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: votingParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.PublicVote,
      options: {
        navigation: votingParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 500;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          },
        }
      }
    },
    {
      resource: db.Message,
      options: {
        navigation: planningParent,
        properties: {
          endAt: {
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
          startAt: {
            isVisible: { list: true, filter: false, show: true, edit: true },
          },
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          }
        }
      }

    },

    {
      resource: db.Award,
      options: {
        navigation: votingParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        }
      }
    },
    {
      resource: db.showprojectusersemail,
      options: {
        name: "Projects met Email en deelnemers)",
        listProperties: ['ProjectID', 'email', 'participants', 'Project_Name', 'project_descr', 'Language', 'eventId'],
        parent: reportParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.eventId': event.id }
              return request
            }
          },

          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.ShowUserWithNoProject,
      options: {
        name: "Users zonder project of medewerker)",
        listProperties: ['id', 'firstname', 'lastname', 'email'],
        parent: reportParent,
        actions: {
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.contactlist,
      features: [
        importExportFeature(),
      ],
      options: {
        name: "contactlist",
        listProperties: ['firstname', 'lastname', 'language','Age','Photo','Contact','via','gsm','gsm_guardian','email','email_guardian'],
        parent: reportParent,
        actions: {
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.ShowAttachmentLoaded,
      features: [
        importExportFeature(),
      ],
      options: {
        name: "Alle geladen projecten",
        parent: reportParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.userprojectvideo,
      options: {
        name: "Alle projecten met youtube link",
        parent: reportParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventID': event.id }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.stats_demographics,
      options: {
        name: "Alle overzichten history",
        parent: projectHistory,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.stats_genderage,
      options: {
        name: "Alle overzichten history",
        parent: projectHistory,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.stats_language,
      options: {
        name: "Alle overzichten history",
        parent: projectHistory,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.stats_languagegender,
      options: {
        name: "Alle overzichten history",
        parent: projectHistory,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.stats_teams,
      options: {
        name: "Alle overzichten history",
        parent: projectHistory,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              return request
            },
          },
          new: {
            isVisible: false
          },
          edit: {
            isVisible: false
          },
          delete: {
            isVisible: false
          }
        },
        properties: {
        }
      }
    },
    {
      resource: db.Table,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: planningParent,
        properties: {
          createdAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
          updatedAt: {
            isVisible: { list: false, filter: false, show: true, edit: false },
          },
        },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            },
            after: async (response, request, context) => {
              response.records = await Promise.all(response.records.map(async (r) => {
                try {
                  const remaining = await ProjectTable.sum('UsedPlaces', {
                    where: {
                      TableId: r.id
                    }
                  });
                  r.params['remainingPlaces'] = r.params.maxPlaces - remaining
                } catch (error) {
                  console.log('index.js_13',error)
                }
                return r
              }));
              return response
            }
          },
          show: {
            after: async (response, request, context) => {
              try {
                const remaining = await ProjectTable.sum('UsedPlaces', {
                  where: {
                    TableId: response.record.params.id
                  }
                });
                response.record.params['remainingPlaces'] = response.record.params.maxPlaces - remaining
              } catch (error) {
                console.log('index.js_14',error)
              }
              return response;
            }
          },
          properties: {
            remainingPlaces: {
              label: 'remaining places'
            }
          },
        }
      }
    },
    {
      resource: db.Location,
      options: {
        navigation: planningParent,
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
              const event = await database.getEventActive();
              request.query = { ...request.query, 'filters.EventId': event.id }
              return request
            }
          }
        },
        properties: {
          text: {
            isTitle: true,
            label: 'text'
          }
        }
      }
    },
    {
      resource: db.ProjectTable,
      features: [
        importExportFeature(),
      ],
      options: {
        navigation: planningParent,
        properties: {
        projectId: {
            isVisible: { list: false, filter: false, show: false, edit: true },
        },
        id: {
          isVisible: { list: false, filter: false, show: true, edit: false},
      },
        tableId: {
            isVisible: { list: false, filter: false, show: false, edit: true},
        },
        eventId: {
        isVisible: { list: true, filter: true, show: false, edit: false},
        },
        updatedAt: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
        createdAt: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
        startTime: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
        endTime: {
          isVisible: { list: false, filter: false, show: true, edit: false },
        },
      },
        actions: {
          list: {
            before: async (request, { currentAdmin }) => {
              request.query.perPage ??= 100;
             if (superAdminAllowed({ currentAdmin })) {
                return request;
              }
             const event = await database.getEventActive();
             request.query = { ...request.query, 'filters.eventId': event.id }
             
            return request
            }
          },
          edit: {
            before: async (request, { currentAdmin }) => {
              const event = await database.getEventActive();
              request.payload = {
                ...request.payload,
                eventId: event.id
              }
              return request
            }

            },
            new: {
              before: async (request, { currentAdmin }) => {
                const event = await database.getEventActive();
                request.payload = {
                  ...request.payload,
                  eventId: event.id
                }
                return request
              }
  
              },
          switch: {
            actionType: 'record',
            icon: 'Switch',
            isVisible: true,
            handler: async () => { } // TODO: Implement Switch Action https://docs.adminjs.co/ui-customization/writing-your-own-components#props-passed-to-components
          },
          plan: {
            actionType: 'resource',
            icon: 'Plan',
            isVisible: true,
            handler: async () => { } // TODO: Implement Plan Action https://docs.adminjs.co/ui-customization/writing-your-own-components#props-passed-to-components
          },
        }
      }
    }
  ]
}

AdminJS.registerAdapter(AdminJSSequelize)
const adminJs = new AdminJS(adminJsOptions)

let router = express.Router()
router.use(passport.authenticate('planning_login'));
router.use((req, res, next) => {

   req.session.adminUser = req.user
    next()
  
})
router.get('/login', passport.authenticate('planning_login'),(req,res)=> {
  req.session.adminUser = req.user
  res.redirect('/admin' );
}
);

router.get('/logout',(req, res, next) => {
    req.logout(function(err) {
      req.session.destroy(() => {
        res.redirect('/admin/login')
      })
    });
})

router = AdminJSExpress.buildRouter(adminJs, router)

//const router = AdminJSExpress.buildRouter(adminJs)
//router.use('/', passport.authenticate('admin_login'));
module.exports = router;

console.log('AdminJS index.js done');
