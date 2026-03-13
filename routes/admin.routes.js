const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload.middleware');
const {
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require('../controllers/category.controller');
const {
    createSubcategory,
    updateSubcategory,
    deleteSubcategory
} = require('../controllers/subcategory.controller');
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProviderById
} = require('../controllers/user.controller');
const {
    getAllProviders,
    getPendingProviders,
    approveProvider,
    rejectProvider,
    getAllCustomers
} = require('../controllers/user.management.controller');
const {
    getAllAdminServices,
    getAdminServiceById,
    createAdminService,
    updateAdminService,
    deleteAdminService
} = require('../controllers/admin.service.controller');
const {
    getAllToken,
    getOneToken,
    deleteToken
} = require('../controllers/token.controller');
const {
    verifyToken
} = require('../middlewares/auth.middleware');
const permit = require('../middlewares/permit');
const portalCheck = require('../middlewares/portalCheck');

const adminFilter = [verifyToken, portalCheck('AdminPortal'), permit('admin', 'adminuser')];

router.get('/users', ...adminFilter, getAllUsers);
router.get('/users/customers', ...adminFilter, getAllCustomers);
router.get('/users/:id', ...adminFilter, getUserById);
router.put('/users/:id', ...adminFilter, upload.single('image'), updateUser);
router.delete('/users/:id', ...adminFilter, deleteUser);
router.get('/providers', ...adminFilter, getAllProviders);
router.get('/providers/pending', ...adminFilter, getPendingProviders);
router.get('/provider/:id', ...adminFilter, getProviderById);
router.put('/providers/:id/approve', ...adminFilter, approveProvider);
router.put('/providers/:id/reject', ...adminFilter, rejectProvider);
router.post('/category', ...adminFilter, upload.single('image'), createCategory);
router.put('/category/:id', ...adminFilter, upload.single('image'), updateCategory);
router.delete('/category/:id', ...adminFilter, deleteCategory);
router.post('/subcategory', ...adminFilter, upload.single('image'), createSubcategory);
router.put('/subcategory/:id', ...adminFilter, upload.single('image'), updateSubcategory);
router.delete('/subcategory/:id', ...adminFilter, deleteSubcategory);
router.get('/admin/service', ...adminFilter, getAllAdminServices);
router.get('/admin/service/:id', ...adminFilter, getAdminServiceById);
router.post('/admin/service', ...adminFilter, createAdminService);
router.put('/admin/service/:id', ...adminFilter, updateAdminService);
router.delete('/admin/service/:id', ...adminFilter, deleteAdminService);
router.get('/service_title', ...adminFilter, getAllAdminServices);
router.get('/service_title/:id', ...adminFilter, getAdminServiceById);
router.post('/service_title', ...adminFilter, createAdminService);
router.put('/service_title/:id', ...adminFilter, updateAdminService);
router.delete('/service_title/:id', ...adminFilter, deleteAdminService);
router.get('/token', ...adminFilter, getAllToken);
router.get('/token/:id', ...adminFilter, getOneToken);
router.delete('/token/:id', ...adminFilter, deleteToken);

module.exports = router;