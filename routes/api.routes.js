const express = require('express');
const router = express.Router();

const verifyToken = require('../middlewares/auth.middleware');
const permit = require('../middlewares/permit');
const portalCheck = require('../middlewares/portalCheck');
const upload = require('../middlewares/upload.middleware');

const {
    registerValidation,
    providerRegisterValidation,
    loginValidation,
    updatePasswordValidation,
    categoryValidation,
    subcategoryValidation,
    serviceValidation,
    bookingValidation,
    statusUpdateValidation
} = require('../middlewares/validator');

/* ================= CONTROLLERS ================= */

const auth = require('../controllers/auth.controller');
const category = require('../controllers/category.controller');
const subcategory = require('../controllers/subcategory.controller');
const service = require('../controllers/service.controller');
const booking = require('../controllers/booking.controller');
const user = require('../controllers/user.controller');
const adminUser = require('../controllers/user.management.controller');
const dashboard = require('../controllers/dashboard.controller');
const tokenCtrl = require('../controllers/token.controller');
const availability = require('../controllers/availability.controller');
const notification = require('../controllers/notification.controller');
const adminService = require('../controllers/admin.service.controller');

/* ================= ACCESS FILTERS ================= */

const admin = [verifyToken, portalCheck('AdminPortal'), permit('admin', 'adminuser')];
const provider = [verifyToken, portalCheck('ProviderPortal'), permit('provider', 'admin')];
const customer = [verifyToken, portalCheck('CustomerPortal'), permit('customer', 'admin')];

const serviceRead = [
    verifyToken,
    portalCheck(['AdminPortal', 'ProviderPortal', 'CustomerPortal']),
    permit('admin', 'adminuser', 'provider', 'customer')
];

const serviceWrite = [
    verifyToken,
    portalCheck(['AdminPortal', 'ProviderPortal']),
    permit('admin', 'adminuser', 'provider')
];

/* ================= AUTH ================= */


router.post('/login', loginValidation, auth.login);


router.post('/adminlogin', loginValidation, auth.adminLogin);


router.post('/logout', ...serviceRead, auth.logout);



router.post('/register', upload.single('image'), registerValidation, auth.userRegister);


router.post('/register/provider', upload.fields([{
    name: 'image',
    maxCount: 1
}, {
    name: 'gallery',
    maxCount: 10
}]), providerRegisterValidation, auth.providerRegister);


/* ================= PUBLIC ================= */


router.get('/category', category.getAllCategories);


router.get('/category/active', category.getAllActiveCategory);


router.get('/category/:id', category.getCategoryById);

router.get('/subcategory', subcategory.getAllSubcategory);


router.get('/subcategory/active', subcategory.getAllActiveSubcategory);


router.get('/subcategory/:categoryId', subcategory.getSubcategoryByCategoryId);

router.get('/service/detail', service.getActiveServiceDetails);

router.get('/service/detail/:id', service.getServiceDetailsById);


router.get('/service/provider/:id', service.getServiceByProviderId);


router.get('/service/gallery', service.getAllServiceGallery);

router.get('/service/:serviceId/availability', service.getServiceAvailability);


router.get('/providers/active', user.getAllActiveProviders);


router.get('/provider/active/:id', user.getActiveProviderById);

/* ================= ADMIN ================= */


router.get('/users', ...admin, user.getAllUsers);


router.get('/users/customers', ...admin, adminUser.getAllCustomers);


router.get('/users/:id', ...admin, user.getUserById);


router.put('/users/:id/status', ...admin, statusUpdateValidation, adminUser.userChangeStatus);


router.delete('/users/:id', ...admin, user.deleteUser);


router.get('/providers', ...admin, adminUser.getAllProviders);


router.get('/providers/pending', ...admin, adminUser.getPendingProviders);


router.get('/provider/:id', ...serviceRead, user.getProviderById);


router.put('/providers/:id/approve', ...admin, adminUser.approveProvider);


router.put('/providers/:id/reject', ...admin, adminUser.rejectProvider);


router.get('/services/admin', ...admin, adminUser.getAllServicesAdmin);


router.get('/services/pending', ...admin, adminUser.getPendingServices);


router.put('/services/:id/approve', ...admin, statusUpdateValidation, adminUser.approveService);


router.put('/services/:id/reject', ...admin, statusUpdateValidation, adminUser.rejectService);


router.post('/category', ...admin, upload.single('image'), categoryValidation, category.createCategory);


router.put('/category/:id', ...admin, upload.single('image'), categoryValidation, category.updateCategory);


router.delete('/category/:id', ...admin, category.deleteCategory);


router.post('/subcategory', ...admin, upload.single('image'), subcategoryValidation, subcategory.createSubcategory);


router.put('/subcategory/:id', ...admin, upload.single('image'), subcategoryValidation, subcategory.updateSubcategory);


router.delete('/subcategory/:id', ...admin, subcategory.deleteSubcategory);

/* ================= SERVICE MANAGEMENT ================= */


router.get('/service/catalog', ...serviceRead, adminService.getAllAdminServices);


router.get('/service/catalog/:id', ...serviceRead, adminService.getAdminServiceById);


router.post('/service', ...serviceWrite, upload.fields([{
    name: 'image',
    maxCount: 1
}, {
    name: 'gallery',
    maxCount: 10
}]), service.createService);


router.post('/service/create', ...serviceWrite, upload.fields([{
    name: 'image',
    maxCount: 1
}, {
    name: 'gallery',
    maxCount: 10
}]), serviceValidation, service.createServiceAndAvailability);


router.put('/service/:id', ...serviceWrite, upload.fields([{
    name: 'image',
    maxCount: 1
}, {
    name: 'gallery',
    maxCount: 10
}]), serviceValidation, service.updateService);


router.delete('/service/:id', ...admin, service.deleteService);

/* ================= SERVICE TITLES ================= */


router.get('/service_title', ...serviceRead, adminService.getAllAdminServices);
router.get('/service_title/:id', ...serviceRead, adminService.getAdminServiceById);
router.post('/service_title', ...admin, adminService.createAdminService);
router.put('/service_title/:id', ...admin, adminService.updateAdminService);
router.delete('/service_title/:id', ...admin, adminService.deleteAdminService);

/* ================= TOKENS ================= */


router.get('/token', ...admin, tokenCtrl.getAllToken);


router.get('/token/:id', ...admin, tokenCtrl.getOneToken);


router.delete('/token/:id', ...admin, tokenCtrl.deleteToken);

/* ================= PROVIDER ================= */


router.get('/dashboard/provider', ...provider, dashboard.getProviderStats);
router.get('/dashboard/admin', ...admin, dashboard.getAdminStats);


router.get('/provider/availability', ...provider, availability.getAllAvailability);


router.post('/provider/availability', ...provider, availability.updateAvailability);


router.post('/provider/availability/new', ...provider, availability.createNewAvailability);


router.post('/provider/availability/always', ...provider, availability.setAlwaysAvailable);


router.get('/booking/provider/:id', ...provider, booking.getAllBookingForProvider);


router.put('/services/:id/active', ...provider, adminUser.activeTheService);


router.put('/services/:id/deactive', ...provider, adminUser.deactiveTheService);

router.delete('/service/delete/:id', ...provider, service.deleteService);
/* ================= CUSTOMER ================= */


router.get('/dashboard/customer', ...customer, dashboard.getCustomerStats);


router.post('/booking', ...customer, bookingValidation, booking.createBooking);


router.get('/booking/customer/:id', ...customer, booking.getAllBookingForCustomer);

/* ================= SHARED ================= */


router.get('/booking/:id', ...serviceRead, booking.getBookingById);


router.get('/booking', ...admin, booking.getAllBooking);


router.get('/booking/:id', ...serviceRead, booking.getBookingById);


router.patch('/booking/:id/status', ...serviceWrite, booking.updateStatusBooking);


router.delete('/booking/:id', ...admin, booking.deleteBooking);

/* ================= NOTIFICATIONS ================= */


router.get('/notifications', ...serviceRead, notification.getNotifications);


router.put('/notifications/:id/read', ...serviceRead, notification.markAsRead);


router.delete('/notifications/:id', ...serviceRead, notification.deleteNotification);

/* ================= PROFILE ================= */


router.put('/users/:id', ...serviceRead, upload.single('image'), user.updateUser);


router.patch('/users/:id/password', verifyToken, portalCheck(['AdminPortal', 'ProviderPortal', 'CustomerPortal']), permit('admin', 'adminuser', 'provider', 'customer'), updatePasswordValidation, user.updateUserPassword);


module.exports = router;