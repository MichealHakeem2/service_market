const express = require('express');
const router = express.Router();
const {
    userRegister,
    providerRegister,
    login,
    adminLogin,
    logout
} = require('../controllers/auth.controller');
const {
    verifyToken
} = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const {
    getAllSubcategory,
    getSubcategoryByCategoryId,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
} = require('../controllers/subcategory.controller');
const {
    getAllService,
    getServiceById,
    createService,
    createServiceAndAvailability,
    updateService,
    deleteService,
    getServiceAvailability,
    getAllServiceGallery
} = require('../controllers/service.controller');
const {
    getAllBooking,
    getAllBookingForProvider,
    getAllBookingForCustomer,
    getBookingById,
    createBooking,
    updateBooking,
    deleteBooking
} = require('../controllers/booking.controller');
const {
    getAllUsers,
    getUserById,
    getProviderById,
    updateUser,
    updateUserPassword,
    deleteUser
} = require('../controllers/user.controller');
const {
    getAllProviders,
    getPendingProviders,
    approveProvider,
    rejectProvider,
    getAllCustomers,
    userChangeStatus
} = require('../controllers/user.management.controller');
const {
    getCustomerStats,
    getProviderStats
} = require('../controllers/dashboard.controller');
const {
    getAllToken,
    getOneToken,
    deleteToken
} = require('../controllers/token.controller');
const {
    getAllAvailability,
    createNewAvailability,
    updateAvailability,
    setAlwaysAvailable
} = require('../controllers/availability.controller');
const {
    registerValidation,
    providerRegisterValidation,
    loginValidation,
    updatePasswordValidation
} = require('../middlewares/validator');
const {
    getAllAdminServices,
    getAdminServiceById,
    createAdminService,
    updateAdminService,
    deleteAdminService
} = require('../controllers/admin.service.controller');
const {
    getAllServiceTitle,
    getServiceTitleById,
    createServiceTitle,
    updateServiceTitle,
    deleteServiceTitle
} = require('../controllers/service_title.controller');
const permit = require('../middlewares/permit');
const portalCheck = require('../middlewares/portalCheck');

router.post('/login', loginValidation, login);
router.post('/adminlogin', loginValidation, adminLogin);
router.post('/register', registerValidation, upload.single('image'), userRegister);
router.post('/register/provider', providerRegisterValidation, upload.single('image'), providerRegister);
router.post('/logout', verifyToken, logout);

router.get('/users', getAllUsers);
router.get('/users/customers', getAllCustomers);
router.get('/users/:id', getUserById);

router.get('/providers', getAllProviders);
router.get('/providers/pending', getPendingProviders);
router.put('/providers/:id/approve', verifyToken, approveProvider);
router.put('/providers/:id/reject', verifyToken, rejectProvider);
router.put('/users/:id/status', verifyToken, userChangeStatus);

router.get('/provider/availability', getAllAvailability);
router.post('/provider/availability', verifyToken, updateAvailability);
router.post('/provider/availability/always', verifyToken, setAlwaysAvailable);
router.post('/provider/availability/new', verifyToken, createNewAvailability);
router.get('/provider/:id', getProviderById);

router.put('/users/:id', verifyToken, upload.single('image'), updateUser);
router.patch('/users/:id/password', verifyToken, updatePasswordValidation, updateUserPassword);
router.delete('/users/:id', verifyToken, deleteUser);


router.get('/category', getAllCategories);
router.get('/category/:id', getCategoryById);
router.post('/category', verifyToken, upload.single('image'), createCategory);
router.put('/category/:id', verifyToken, upload.single('image'), updateCategory);
router.delete('/category/:id', verifyToken, deleteCategory);

router.get('/subcategory', getAllSubcategory);
router.get('/subcategory/:categoryId', getSubcategoryByCategoryId);
router.post('/subcategory', verifyToken, upload.single('image'), createSubcategory);
router.put('/subcategory/:id', verifyToken, upload.single('image'), updateSubcategory);
router.delete('/subcategory/:id', verifyToken, deleteSubcategory);

router.get('/service', getAllService);
router.get('/service/gallery', getAllServiceGallery);
router.get('/service/:id', getServiceById);
router.get('/service/:serviceId/availability', getServiceAvailability);
router.post('/service', verifyToken, upload.single('image'), createService);
router.post('/service/create', verifyToken, upload.single('image'), createServiceAndAvailability);
router.put('/service/:id', verifyToken, upload.single('image'), updateService);
router.delete('/service/:id', verifyToken, deleteService);

router.get('/admin/service', getAllAdminServices);
router.get('/admin/service/:id', getAdminServiceById);
router.post('/admin/service', verifyToken, createAdminService);
router.put('/admin/service/:id', verifyToken, updateAdminService);
router.delete('/admin/service/:id', verifyToken, deleteAdminService);

router.get('/service_title', getAllServiceTitle);
router.get('/service_title/:id', getServiceTitleById);
router.post('/service_title', verifyToken, createServiceTitle);
router.put('/service_title/:id', verifyToken, updateServiceTitle);
router.delete('/service_title/:id', verifyToken, deleteServiceTitle);

router.get('/booking', getAllBooking);
router.get('/booking/:id', getBookingById);
router.post('/booking', verifyToken, createBooking);
router.put('/booking/:id', verifyToken, updateBooking);
router.delete('/booking/:id', verifyToken, deleteBooking);
router.get('/booking/provider/:id', getAllBookingForProvider);
router.get('/booking/customer/:id', getAllBookingForCustomer);

router.get('/dashboard/customer', verifyToken, getCustomerStats);
router.get('/dashboard/provider', verifyToken, getProviderStats);

router.get('/token', getAllToken);
router.get('/token/:id', getOneToken);
router.delete('/token/:id', deleteToken);

module.exports = router;