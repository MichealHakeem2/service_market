const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const {
    createService,
    createServiceAndAvailability,
    updateService,
    deleteService
} = require('../controllers/service.controller');
const {
    getAllAvailability,
    createNewAvailability,
    updateAvailability,
    setAlwaysAvailable
} = require('../controllers/availability.controller');
const {
    getAllBookingForProvider
} = require('../controllers/booking.controller');
const {
    getProviderStats
} = require('../controllers/dashboard.controller');
const {
    verifyToken
} = require('../middlewares/auth.middleware');
const permit = require('../middlewares/permit');
const portalCheck = require('../middlewares/portalCheck');

const providerFilter = [verifyToken, portalCheck('ProviderPortal'), permit('provider')];

router.get('/dashboard/provider', ...providerFilter, getProviderStats);
router.post('/service', ...providerFilter, upload.single('image'), createService);
router.post('/service/create', ...providerFilter, upload.single('image'), createServiceAndAvailability);
router.put('/service/:id', ...providerFilter, upload.single('image'), updateService);
router.delete('/service/:id', ...providerFilter, deleteService);
router.get('/provider/availability', ...providerFilter, getAllAvailability);
router.post('/provider/availability', ...providerFilter, updateAvailability);
router.post('/provider/availability/always', ...providerFilter, setAlwaysAvailable);
router.post('/provider/availability/new', ...providerFilter, createNewAvailability);
router.get('/booking/provider/:id', ...providerFilter, getAllBookingForProvider);

module.exports = router;