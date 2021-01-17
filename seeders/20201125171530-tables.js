'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Tables', [
      { name: 'Tafel 1', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 2', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 3', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 4', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 5', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 6', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 7', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 8', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 9', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 },
      { name: 'Tafel 10', createdAt: new Date(), updatedAt: new Date(), eventId: 1, location: 'grote hal', maxPlaces: 4 }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Tables', null, {});
  }
};
