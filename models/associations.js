const User = require('./Users');
const Service = require('./Service');
const Category = require('./Category');
const Subcategory = require('./Subcategory');
const Booking = require('./Bookings');
const ProviderAvailability = require('./Provider_availabilities');
const ServiceAdmin = require('./Service_admin');
const Notification = require('./Notification');
const Review = require('./Review');
const Token = require('./Token');

// User & Token
User.hasMany(Token, {
    foreignKey: 'user_id'
});
Token.belongsTo(User, {
    foreignKey: 'user_id'
});

// User & Service (as provider)
User.hasMany(Service, {
    foreignKey: 'userid'
});
Service.belongsTo(User, {
    foreignKey: 'userid'
});

// Category & Subcategory
Category.hasMany(Subcategory, {
    foreignKey: 'categoryId'
});
Subcategory.belongsTo(Category, {
    foreignKey: 'categoryId'
});

// Category & Service
Category.hasMany(Service, {
    foreignKey: 'categoryId'
});
Service.belongsTo(Category, {
    foreignKey: 'categoryId'
});

// Subcategory & Service
Subcategory.hasMany(Service, {
    foreignKey: 'subcategoryId'
});
Service.belongsTo(Subcategory, {
    foreignKey: 'subcategoryId'
});

// Subcategory & ServiceAdmin
Subcategory.hasMany(ServiceAdmin, {
    foreignKey: 'subcategory_id'
});
ServiceAdmin.belongsTo(Subcategory, {
    foreignKey: 'subcategory_id'
});

// ServiceAdmin & Category
Category.hasMany(ServiceAdmin, {
    foreignKey: 'categoryId'
});
ServiceAdmin.belongsTo(Category, {
    foreignKey: 'categoryId'
});

// Service & ServiceAdmin
ServiceAdmin.hasMany(Service, {
    foreignKey: 'service_title_id'
});
Service.belongsTo(ServiceAdmin, {
    foreignKey: 'service_title_id'
});

// Bookings
User.hasMany(Booking, {
    foreignKey: 'customer_id',
    as: 'customerBookings'
});
User.hasMany(Booking, {
    foreignKey: 'provider_id',
    as: 'providerBookings'
});
Booking.belongsTo(User, {
    foreignKey: 'customer_id',
    as: 'customer'
});
Booking.belongsTo(User, {
    foreignKey: 'provider_id',
    as: 'provider'
});
Booking.belongsTo(Service, {
    foreignKey: 'service_id'
});
Service.hasMany(Booking, {
    foreignKey: 'service_id'
});

// Provider Availabilities
User.hasMany(ProviderAvailability, {
    foreignKey: 'userid'
});
ProviderAvailability.belongsTo(User, {
    foreignKey: 'userid'
});
Service.hasMany(ProviderAvailability, {
    foreignKey: 'serviceId'
});
ProviderAvailability.belongsTo(Service, {
    foreignKey: 'serviceId'
});

// Notifications
User.hasMany(Notification, {
    foreignKey: 'userId'
});
Notification.belongsTo(User, {
    foreignKey: 'userId'
});

// Reviews
User.hasMany(Review, {
    foreignKey: 'customer_id',
    as: 'sentReviews'
});
User.hasMany(Review, {
    foreignKey: 'provider_id',
    as: 'receivedReviews'
});
Review.belongsTo(User, {
    foreignKey: 'customer_id',
    as: 'customer'
});
Review.belongsTo(User, {
    foreignKey: 'provider_id',
    as: 'provider'
});
Review.belongsTo(Service, {
    foreignKey: 'service_id'
});
Review.belongsTo(Booking, {
    foreignKey: 'booking_id'
});

module.exports = {
    User,
    Service,
    Category,
    Subcategory,
    Booking,
    ProviderAvailability,
    ServiceAdmin,
    Notification,
    Review,
    Token
};