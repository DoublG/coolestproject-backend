'use strict';

const cls = require('cls-hooked');
const namespace = cls.createNamespace('coolestproject');

const addYears = require('date-fns/addYears');
const parseISO = require('date-fns/parseISO');

const models = require('../models');
const crypto = require('crypto');

const Sequelize = require('sequelize');
Sequelize.useCLS(namespace);

const bcrypt = require("bcrypt");

const Account = models.Account;
const QuestionRegistration = models.QuestionRegistration;
const QuestionUser = models.QuestionUser;
const Project = models.Project;
const Question = models.Question;
const User = models.User;
const Voucher = models.Voucher;
const Event = models.Event;
const TShirt = models.TShirt;
const TShirtGroup = models.TShirtGroup;
const Registration = models.Registration;
const sequelize = models.sequelize;
const Op = Sequelize.Op;
const QuestionTranslation = models.QuestionTranslation;

const MAX_VOUCHERS = process.env.MAX_VOUCHERS || 0

class DBA {
    /**
     * @param {Integer} registrationId 
     * @returns {Promise<User>} created User
     */
    static async createUserFromRegistration(registrationId) {
        return await sequelize.transaction(
            async (t) => {
                const registration = await this.getRegistration(registrationId);
                if (registration === null) {
                    throw new Error(`No registration found for id ${registrationId}`)
                }
                let userId = null
                if (registration.project_code) {
                    // create user and add to existing project
                    const participant = await this.createUserWithVoucher(
                        {
                            language: registration.language,
                            postalcode: registration.postalcode,
                            email: registration.email,
                            gsm: registration.gsm,
                            firstname: registration.firstname,
                            lastname: registration.lastname,
                            sex: registration.sex,
                            birthmonth: registration.birthmonth,
                            sizeId: registration.sizeId,
                            via: registration.via,
                            medical: registration.medical,
                            gsm_guardian: registration.gsm_guardian,
                            email_guardian: registration.email_guardian,
                            eventId: registration.eventId,
                            street: registration.street,
                            municipality_name: registration.municipality_name,
                            house_number: registration.house_number,
                            box_number: registration.box_number,
                            questions: registration.questions.map(i => { return { QuestionId: i.QuestionId } }),
                        },
                        registration.project_code,
                        registration.id
                    );
                    userId = participant.id
                } else {
                    // create user with project
                    const owner = await this.createUserWithProject(
                        {
                            language: registration.language,
                            postalcode: registration.postalcode,
                            email: registration.email,
                            gsm: registration.gsm,
                            firstname: registration.firstname,
                            lastname: registration.lastname,
                            sex: registration.sex,
                            birthmonth: registration.birthmonth,
                            sizeId: registration.sizeId,
                            via: registration.via,
                            medical: registration.medical,
                            gsm_guardian: registration.gsm_guardian,
                            email_guardian: registration.email_guardian,
                            general_questions: registration.general_questions,
                            eventId: registration.eventId,
                            municipality_name: registration.municipality_name,
                            street: registration.street,
                            house_number: registration.house_number,
                            box_number: registration.box_number,
                            questions: registration.questions.map(i => { return { QuestionId: i.QuestionId } }),
                            project: {
                                eventId: registration.eventId,
                                project_name: registration.project_name,
                                project_descr: registration.project_descr,
                                project_type: registration.project_type,
                                project_lang: registration.project_lang,
                                max_tokens: registration.max_tokens,
                            }
                        },
                        registration.id
                    );
                    userId = owner.id;
                }
                // return the newly created user
                return await this.getUser(userId);
            }
        );
    }

    /**
     * @param {string} password - unencrypted password
     * @returns {string}
     */
    static generatePwd(password) {
        const salt = bcrypt.genSaltSync();
        const hash = bcrypt.hashSync(password, salt);
        return hash
    }

    /**
    * Create a new user with a project
    * @param {Object} userProject - UserProject object
    * @returns {Promise<User>}
    * @example     
        {
            postalcode: 1000,
            email: "test@test.be",
            gsm: "003237722452",
            firstname: 'John',
            lastname: 'Doe',
            sex: 'm',
            birthmonth: new Date(2003, 01, 01),
            mandatory_approvals: 'aa',
            t_size: 'female_large',
            project: {
                project_name: 'test',
                project_descr: 'aaa',
                project_type: 'aa'
            }
        }
    */
    static async createUserWithProject(userProject, registrationId) {
        console.log(userProject)
        const user = await User.create(userProject, {
            include: ['project', { model: QuestionUser, as: 'questions' }]
        });
        await Registration.destroy({ where: { id: registrationId } });
        return user;
    }

    /**
     * Create a new user with a token
     * @param {Object} user - User object 
     * @param {Number} voucherId - voucher id
     * @returns {Promise<User>}
     * @example
        {
            postalcode: 1000,
            email: "test@test.be",
            gsm: "003237722452",
            firstname: 'John',
            lastname: 'Doe',
            sex: 'm',                
            birthmonth: new Date(2003, 01, 01),
            mandatory_approvals: 'aa',
            t_size: 'female_large'
        }
     */
    static async createUserWithVoucher(user_data, voucherId, registrationId) {
        const voucher = await Voucher.findOne({ where: { id: voucherId, participantId: null }, lock: true });
        if (voucher === null) {
            throw new Error(`Token ${voucherId} not found`);
        }
        const user = await User.create(user_data);
        await voucher.setParticipant(user, { include: [{ model: QuestionUser, as: 'questions' }] });
        await Registration.destroy({ where: { id: registrationId } });

        return user;
    }

    /**
     * Update user information
     * @param {User} user
     * @param {Number} userId
     * @returns {Promise<Boolean>} updated successfully
     */
    static async updateUser(changedFields, userId) {
        // remove fields that are not allowed to change (be paranoid)
        delete changedFields.email;
        delete changedFields.mandatory_approvals;

        // cleanup guardian fields when not needed anymore
        const user = await User.findByPk(userId);
        const event = await user.getEvent();

        const minGuardian = addYears(event.startDate, -1 * event.minGuardianAge);
        if (minGuardian > parseISO(changedFields.birthmonth)) {
            changedFields.gsm_guardian = null;
            changedFields.email_guardian = null;
        }
        return await user.update(changedFields);
    }

    /**
     * Get registration information
     * @param {Number} registrationId
     * @returns {Promise<Registration>} created registration
     */
    static async getRegistration(registrationId) {
        return await Registration.findByPk(registrationId);
    }

    /**
     * Delete a user
     * @param {Number} userId
     * @returns {Promise<Boolean>} Delete ok ?
     */
    static async deleteUser(userId) {
        const project = await Project.findOne({ where: { ownerId: userId }, attributes: ['id'] });
        if (project === null) {
            throw new Error('Project not found');
        }
        const usedVoucher = await Voucher.count({ where: { projectId: project.id, participantId: { [Op.ne]: null } } });
        if (usedVoucher > 0) {
            throw new Error('Delete not possible tokens in use');
        }
        return await User.destroy({ where: { id: userId } });
    }

    /**
     * create a project and assign to existing user
     * @param {Object} project
     * @returns {Promise<Project>} created account
     */
    static async createProject(project, userId) {
        const user = await User.findByPk(userId);
        const event = await user.getEvent();
        project.ownerId = userId;
        project.max_tokens = event.maxVoucher;

        return await Project.create(project);
    }

    /**
     * Create a Account (user for admin panel & jury)
     * @param {Object} account
     * @returns {Promise<Account>} account
     */
    static async createAccount(account) {
        return await Account.create(account);
    }

    /**
     * Update a project
     * @param {Project} project 
     * @param {Number} userId
     * @returns {Promise<Boolean>} Delete ok ?
     */
    static async updateProject(changedFields, userId) {
        const project = await Project.findOne({ where: { ownerId: userId } });
        return project.update(changedFields);
    }

    /**
     * @param {Number} userId
     * @returns {Promise<Boolean>} Is user allowed to be deleted ?
     */
    static async isUserDeletable(userId) {
        return await sequelize.transaction(
            async (t) => {
                const project = await Project.findOne({ where: { ownerId: userId }, attributes: ['id'], lock: true });
                if (project == null) {
                    return true;
                }
                const usedVoucher = await Voucher.count({ where: { projectId: project.id, participantId: { [Op.ne]: null } }, lock: true });
                if (usedVoucher > 0) {
                    return false;
                }
                return true;
            }
        );
    }

    /**
     * Delete a project
     * @param {Number} userId 
     * @returns {Promise<Boolean>} delete ok 
     */
    static async deleteProject(userId) {
        // delete project or voucher
        // only possible when there are no used vouchers
        return await sequelize.transaction(
            async (t) => {
                const project = await Project.findOne({ where: { ownerId: userId }, attributes: ['id'], lock: true });
                if (project !== null) {
                    const usedVoucher = await Voucher.count({ where: { projectId: project.id, participantId: { [Op.ne]: null } }, lock: true });
                    if (usedVoucher > 0) {
                        throw new Error('Delete not possible tokens in use');
                    }
                    // delete project
                    return await Project.destroy({ where: { ownerId: userId } });
                } else {
                    // delete voucher
                    return await Voucher.destroy({ where: { participantId: userId } });
                }
            }
        );
    }

    /**
     * Create a voucher for a project
     * @param {Number} projectId 
     * @returns {Promise<Voucher>} created voucher
     */
    static async createVoucher(userId) {
        return await sequelize.transaction(
            async (t) => {
                const project = await Project.findOne({ where: { ownerId: userId }, attributes: ['id', 'eventId', 'max_tokens'], lock: true });
                if (project === null) {
                    throw new Error('No project found');
                }

                var totalVouchers = await Voucher.count({ where: { projectId: project.id }, lock: true });
                if (totalVouchers >= project.max_tokens) {
                    throw new Error('Max token reached');
                }

                var token = await new Promise(function (resolve, reject) {
                    crypto.randomBytes(18, function (error, buffer) {
                        if (error) {
                            reject(error);
                        }
                        resolve(buffer.toString('hex'));
                    });
                });
                return await Voucher.create({ projectId: project.id, id: token, eventId: project.eventId });
            }
        );
    }

    /**
     * Delete a participant from a project
     * @param {Number} projectId 
     * @param {Number} participantId
     * @returns {Promise<Boolean>} delete successfully
     */
    static async deleteParticipantProject(projectId, participantId) {
        return await Voucher.destroy({ where: { projectId: projectId, participantId: participantId } });
    }

    /**
     * Add participant to a project
     * @param {Number} userId 
     * @param {Number} voucherId 
     * @returns {Promise<User>} created participant
     */
    static async addParticipantProject(userId, voucherId) {
        const voucher = await Voucher.findOne({ where: { id: voucherId, participantId: null }, lock: true });
        if (voucher === null) {
            throw new Error('Voucher not found');
        }
        await voucher.setParticipant(userId);
        return await voucher.getParticipant();
    }

    /**
     * Add registration
     * @param {Registration} registration
     * @returns {Promise<Registration>} created registration
     */
    static async createRegistration(registrationValues) {
        return await sequelize.transaction(
            async (t) => {
                // set the current event
                const event = await Event.findOne({ where: { current: true } });
                if (event === null) {
                    throw new Error('No Active event found');
                }
                registrationValues.eventId = event.id;
                registrationValues.max_tokens = event.maxVoucher;

                // validate mandatory fields for registration 
                // TODO check if question are for the event & mandatory is filled in
                const possibleQuestions = await event.getQuestions();
                console.log(possibleQuestions);

                // map the questions to the correct table
                const answers = [];
                answers.push(...registrationValues.general_questions.map(QuestionId => { return { QuestionId } }));
                answers.push(...registrationValues.mandatory_approvals.map(QuestionId => { return { QuestionId } }));
                registrationValues.questions = answers;

                delete registrationValues.general_questions;
                delete registrationValues.mandatory_approvals;

                // to month (set hour to 12)
                registrationValues.birthmonth
                    = new Date(registrationValues.year, registrationValues.month, 12);

                delete registrationValues.year;
                delete registrationValues.month;

                // check for waiting list
                const registration_count = await User.count({ where: { eventId: event.id }, lock: true }) + await Registration.count({ lock: true });
                if (registration_count >= event.maxRegistration) {
                    registrationValues.waiting_list = true;
                }
                return await Registration.create(registrationValues, { include: [{ model: models.QuestionRegistration, as: 'questions' }] });
            }
        );
    }

    /**
     * Get registration
     * @param {Registration} registration
     * @returns {Promise<Registration>}
     */
    static async getRegistration(registrationId) {
        return await Registration.findByPk(registrationId, {
            lock: true,
            include: [{ model: QuestionRegistration, as: 'questions' },
            { model: Event, as: 'event' }]
        });
    }

    /**
     * Add registration
     * @param {Registration} registration
     * @returns {Promise<Registration>}
     */
    static async getUser(userId) {
        return User.findByPk(userId);
    }

    /**
     * Add registration
     * @param {Registration} registration
     * @returns {Promise<Voucher>} list of vouchers for project
     */
    static async getVouchers(userId) {
        var project = await Project.findOne({ where: { ownerId: userId }, attributes: ['id'] });
        let vouchers = [];
        if (project !== null) {
            vouchers = await Voucher.findAll({
                where: { projectId: project.id }, attributes: ['id'], include: [{
                    model: User,
                    as: 'participant',
                    attributes: ['firstname', 'lastname']
                }]
            });
        }
        return vouchers;
    }

    /**
     * get Project
     * @param {Registration} registration
     * @returns {Promise<Registration>} project information
     */
    static async getProject(userId) {
        // first look for own project
        var project = await Project.findOne({
            where: { ownerId: userId }, include: [
                {
                    model: Voucher,
                    include: [
                        { model: User, as: 'participant', attributes: ['firstname', 'lastname', 'id'] }
                    ]
                },
                { model: User, as: 'owner', attributes: ['firstname', 'lastname'] }
            ]
        });
        // check other project via voucher
        if (project === null) {
            const voucher = await Voucher.findOne({ where: { participantId: userId }, attributes: ['projectId'] });
            if (voucher === null) {
                return; //nothing exists on DB -> frontend redirects to no project page
            }
            project = await Project.findByPk(voucher.projectId, {
                include: [
                    {
                        model: Voucher,
                        include: [
                            { model: User, as: 'participant', attributes: ['firstname', 'lastname', 'id'] }
                        ]
                    },
                    { model: User, as: 'owner', attributes: ['firstname', 'lastname'] }
                ]
            });
        }
        return project;
    }

    /**
     * Check if email address exists in User records table
     * @param {String} email
     * @returns {Promise<Boolean>} 
     */
    static async doesEmailExists(emailAddress) {
        const count = await User.count({ where: { email: emailAddress } });
        return count !== 0;
    }
    /**
     * Get user via email
     * @param {String} email
     * @returns {Promise<User>}
     */
    static async getUsersViaMail(email) {
        return await User.findAll({
            where: {
                [Op.or]: [
                    {
                        email: email
                    },
                    {
                        email_guardian: email
                    }
                ]
            }
        });
    }

    /**
     * Update token
     * @param {Number} userId
     * @returns {Promise<User>}
     */
    static async updateLastToken(userId) {
        const user = await User.findByPk(userId);
        user.last_token = new Date();
        await user.save();
    }

    /**
     * Set the event active
     * @param {Number} eventId
     * @returns {Promise<Event>}
     */
    static async setEventActive(eventId) {
        return await sequelize.transaction(
            async (t) => {
                // cancel previous events
                await Event.update({ current: false }, { where: {} })

                //activate current
                const event = await Event.findByPk(eventId);
                if (event === null) {
                    throw new Error('No event found');
                }
                event.current = true
                return await event.save();
            }
        );
    }

    /**
     * get event by id
     * @param {Number} eventId
     * @returns {Promise<Event>}
     */
    static async getEvent(eventId) {
        return await Event.findByPk(eventId);
    }

    /**
     * get active event
     * @param {Number} eventId
     * @returns {Promise<Event>}
     */
    static async getEventActive() {
        return await Event.findOne({
            where: { current: true }, attributes: {
                include: [
                    [sequelize.literal(`(SELECT count(*) from Registrations where Registrations.eventId = eventId)`), 'pending_users'],
                    [sequelize.literal(`(SELECT count(*) from Registrations where Registrations.eventId = eventId)`), 'overdue_registration'],
                    [sequelize.literal(`(SELECT count(*) from Registrations where Registrations.eventId = eventId and waiting_list = 1)`), 'waiting_list'],
                    [sequelize.literal(`(SELECT count(*) from Users where Users.eventId = eventId)`), 'total_users'],
                    [sequelize.literal(`(SELECT count(*) from Users where Users.eventId = eventId and Users.sex = 'm')`), 'total_males'],
                    [sequelize.literal(`(SELECT count(*) from Users where Users.eventId = eventId and Users.sex = 'f')`), 'total_females'],
                    [sequelize.literal(`DATEDIFF(startDate, CURDATE())`), 'days_remaining'],
                    [sequelize.literal(`(SELECT count(*) from Projects where Projects.eventId = eventId)`), 'total_projects'],
                    [sequelize.literal(`(SELECT count(*) from Registrations where Registrations.eventId = eventId and DATE_ADD(Registrations.createdAt, INTERVAL ${process.env.TOKEN_VALID_TIME} SECOND) < CURDATE() )`), 'overdue_registration']
                ]
            }
        })
    }

    /**
     * get active event
     * @returns {Promise<TShirt>}
     */
    static async getTshirts() {
        const event = await this.getEventActive();
        if (event === null) {
            throw new Error('No event found');
        }
        return await TShirt.findAll({
            attributes: ['id', 'name'],
            include: { model: TShirtGroup, as: 'group', attributes: ['id', 'name'] },
            where: { eventId: event.id }
        });
    }

    /**
     * get questions
     * @returns {Promise<object>}
     */
    static async getQuestions(language) {
        const event = await this.getEventActive();
        if (event === null) {
            throw new Error('No event found');
        }
        // const mandatoryQuestions = await Question.findAll({ attributes: ['id', 'name'], where: { eventId: event.id, mandatory: true } })
        const optionalQuestions = await Question.findAll({
            attributes: ['id', 'name'], where: { eventId: event.id, mandatory: { [Op.not]: true } }
            , include: [{ model: QuestionTranslation, where: { language: language }, attributes: ['description', 'positive', 'negative'] }]
        })
        return optionalQuestions.map((q) => {
            return {
                'id': q.id,
                'name': q.name,
                'description': q.QuestionTranslations[0].description,
                'positive': q.QuestionTranslations[0].positive,
                'negative': q.QuestionTranslations[0].negative
            }
        })
    }

    /**
     * get approvals
     * @returns {Promise<object>}
     */
    static async getApprovals(language) {
        const event = await this.getEventActive();
        if (event === null) {
            throw new Error('No event found');
        }
        const mandatoryQuestions = await Question.findAll({
            attributes: ['id', 'name'], where: { eventId: event.id, mandatory: true }
            , include: [{ model: QuestionTranslation, where: { language: language }, attributes: ['description', 'positive', 'negative'] }]
        })
        return mandatoryQuestions.map((q) => {
            return {
                'id': q.id,
                'name': q.name,
                'description': q.QuestionTranslations[0].description
            }
        })
    }

}

module.exports = DBA