'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('TShirtGroups', [
      { name: 'woman', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1 },
      { name: 'child', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1 },
      { name: 'men', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1 },
      { name: 'woman', createdAt: new Date(), updatedAt: new Date(), eventId: 2 },
      { name: 'child', createdAt: new Date(), updatedAt: new Date(), eventId: 2 },
      { name: 'men', createdAt: new Date(), updatedAt: new Date(), eventId: 2 }
    ], {});
    await queryInterface.bulkInsert('TShirts', [
      { name: 'kid_3/4', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 2 },
      { name: 'kid_5/6', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 2 },
      { name: 'kid_7/8', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 2 },
      { name: 'kid_9/11', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 2 },
      { name: 'kid_12/14', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 2 },
      { name: 'female_medium', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'female_xs', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'female_large', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'female_xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'female_2xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'female_3xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 1 },
      { name: 'male_xsmall', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_small', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_medium', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_large', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_xxl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_3xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_4xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'male_5xl', createdAt: '2021-01-31 22:31:55', updatedAt: new Date(), eventId: 1, groupId: 3 },
      { name: 'kid_3/4', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 5 },
      { name: 'kid_5/6', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 5 },
      { name: 'kid_7/8', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 5 },
      { name: 'kid_9/11', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 5 },
      { name: 'kid_12/14', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 5 },
      { name: 'female_medium', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'female_xs', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'female_large', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'female_xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'female_2xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'female_3xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 4 },
      { name: 'male_xsmall', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_small', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_medium', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6},
      { name: 'male_large', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_xxl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_3xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_4xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 },
      { name: 'male_5xl', createdAt: new Date(), updatedAt: new Date(), eventId: 2, groupId: 6 }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('TShirts', null, {});
    await queryInterface.bulkDelete('TShirtGroups', null, {});
  }
};
