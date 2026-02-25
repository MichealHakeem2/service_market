const express = require('express');
const router = express.Router();
const {
    getCustomerStats
} = require('../controllers/dashboard.controller');
const {
    createBooking,
    getAllBookingForCustomer
} = require('../controllers/booking.controller');
const {
    verifyToken
} = require('../middlewares/auth.middleware');
const permit = require('../middlewares/permit');
const portalCheck = require('../middlewares/portalCheck');

const customerFilter = [verifyToken, portalCheck('CustomerPortal'), permit('customer')];

router.get('/dashboard/customer', ...customerFilter, getCustomerStats);
router.post('/booking', ...customerFilter, createBooking);
router.get('/booking/customer/:id', ...customerFilter, getAllBookingForCustomer);

module.exports = router;