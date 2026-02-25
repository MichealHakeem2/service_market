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
    updatePasswordValidation
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
const serviceTitle = require('../controllers/service_title.controller');

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

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, auth.login);

/**
 * @swagger
 * /adminlogin:
 *   post:
 *     summary: Admin Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Admin Login successful
 */
router.post('/adminlogin', loginValidation, auth.adminLogin);

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', verifyToken, auth.logout);

/**
 * @swagger
 * /logout/all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out everywhere
 */
router.post('/logout/all', verifyToken, auth.logoutAll);

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new customer
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               role: { type: string, enum: [customer, provider] }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/register', registerValidation, upload.single('image'), auth.userRegister);

/**
 * @swagger
 * /register/provider:
 *   post:
 *     summary: Register a new provider
 *     tags: [Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               image: { type: string, format: binary }
 *               categoryId: { type: integer }
 *               subcategoryId: { type: integer }
 *               service_title_id: { type: integer }
 *               price_Type: { type: string }
 *               price: { type: number }
 *               max_price: { type: number }
 *               day_of_week: { type: string }
 *               start_time: { type: string }
 *               end_time: { type: string }
 *               availabilityStatus: { type: string }
 *     responses:
 *       201:
 *         description: Provider registered
 */
router.post('/register/provider', upload.fields([{ name: 'image', maxCount: 1 }, { name: 'images', maxCount: 1 }]), auth.providerRegister);

/* ================= PUBLIC ================= */

/**
 * @swagger
 * /category:
 *   get:
 *     summary: Get all categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get('/category', category.getAllCategories);

/**
 * @swagger
 * /category/active:
 *   get:
 *     summary: Get all active categories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of active categories
 */
router.get('/category/active', category.getAllActiveCategory);

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category details
 */
router.get('/category/:id', category.getCategoryById);
/**
 * @swagger
 * /subcategory:
 *   get:
 *     summary: Get all subcategories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of subcategories
 */
router.get('/subcategory', subcategory.getAllSubcategory);

/**
 * @swagger
 * /subcategory/active:
 *   get:
 *     summary: Get all active subcategories
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of active subcategories
 */
router.get('/subcategory/active', subcategory.getAllActiveSubcategory);

/**
 * @swagger
 * /subcategory/{categoryId}:
 *   get:
 *     summary: Get subcategories by category ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of subcategories
 */
router.get('/subcategory/:categoryId', subcategory.getSubcategoryByCategoryId);
/**
 * @swagger
 * /service/detail:
 *   get:
 *     summary: Get all active services with full details
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of active services with category, provider, and availability details
 */
router.get('/service/detail', service.getActiveServiceDetails);
/**
 * @swagger
 * /service/detail/{id}:
 *   get:
 *     summary: Get service details by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service details
 */
router.get('/service/detail/:id', service.getServiceDetailsById);

/**
 * @swagger
 * /service/provider/{id}:
 *   get:
 *     summary: Get services by provider ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of services for the provider
 */
router.get('/service/provider/:id', service.getServiceByProviderId);

/**
 * @swagger
 * /service/gallery:
 *   get:
 *     summary: Get service image gallery
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of images
 */
router.get('/service/gallery', service.getAllServiceGallery);
/**
 * @swagger
 * /service/{serviceId}/availability:
 *   get:
 *     summary: Get availability slots for a service
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: serviceId
 *         required: true
 *         schema: { type: integer }
 *       - in: query
 *         name: date
 *         required: true
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: List of available slots
 */
router.get('/service/:serviceId/availability', service.getServiceAvailability);

/**
 * @swagger
 * /providers/active:
 *   get:
 *     summary: Get all active providers
 *     tags: [Public]
 *     responses:
 *       200:
 *         description: List of active providers
 */
router.get('/providers/active', user.getAllActiveProviders);

/**
 * @swagger
 * /provider/active/{id}:
 *   get:
 *     summary: Get active provider details by ID
 *     tags: [Public]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Provider details
 */
router.get('/provider/active/:id', user.getActiveProviderById);

/* ================= ADMIN ================= */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/users', ...admin, user.getAllUsers);

/**
 * @swagger
 * /users/customers:
 *   get:
 *     summary: Get all customers (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of customers
 */
router.get('/users/customers', ...admin, adminUser.getAllCustomers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user details by ID (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/users/:id', ...admin, user.getUserById);

/**
 * @swagger
 * /users/{id}/status:
 *   put:
 *     summary: Change user status (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [active, pending, rejected, banned] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put('/users/:id/status', ...admin, adminUser.userChangeStatus);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user (Admin)
 *     tags: [Admin - Users]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete('/users/:id', ...admin, user.deleteUser);

/**
 * @swagger
 * /providers:
 *   get:
 *     summary: Get all providers (Admin)
 *     tags: [Admin - Providers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of providers
 */
router.get('/providers', ...admin, adminUser.getAllProviders);

/**
 * @swagger
 * /providers/pending:
 *   get:
 *     summary: Get pending providers (Admin)
 *     tags: [Admin - Providers]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending providers
 */
router.get('/providers/pending', ...admin, adminUser.getPendingProviders);

/**
 * @swagger
 * /provider/{id}:
 *   get:
 *     summary: Get provider details (Admin)
 *     tags: [Admin - Providers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Provider details
 */
router.get('/provider/:id', ...serviceRead, user.getProviderById);

/**
 * @swagger
 * /providers/{id}/approve:
 *   put:
 *     summary: Approve provider application (Admin)
 *     tags: [Admin - Providers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Provider approved
 */
router.put('/providers/:id/approve', ...admin, adminUser.approveProvider);

/**
 * @swagger
 * /providers/{id}/reject:
 *   put:
 *     summary: Reject provider application (Admin)
 *     tags: [Admin - Providers]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Provider rejected
 */
router.put('/providers/:id/reject', ...admin, adminUser.rejectProvider);

/**
 * @swagger
 * /services/admin:
 *   get:
 *     summary: Get all services for management (Admin)
 *     tags: [Admin - Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 */
router.get('/services/admin', ...admin, adminUser.getAllServicesAdmin);

/**
 * @swagger
 * /services/pending:
 *   get:
 *     summary: Get pending services (Admin)
 *     tags: [Admin - Services]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending services
 */
router.get('/services/pending', ...admin, adminUser.getPendingServices);

/**
 * @swagger
 * /services/{id}/approve:
 *   put:
 *     summary: Approve service (Admin)
 *     tags: [Admin - Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service approved
 */
router.put('/services/:id/approve', ...admin, adminUser.approveService);

/**
 * @swagger
 * /services/{id}/reject:
 *   put:
 *     summary: Reject service (Admin)
 *     tags: [Admin - Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service rejected
 */
router.put('/services/:id/reject', ...admin, adminUser.rejectService);

/**
 * @swagger
 * /category:
 *   post:
 *     summary: Create new category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *               max_price: { type: integer }
 *               commission_fee: { type: integer }
 *     responses:
 *       201:
 *         description: Category created
 */
router.post('/category', ...admin, upload.single('image'), category.createCategory);

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Update category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *               max_price: { type: integer }
 *               commission_fee: { type: integer }
 *     responses:
 *       200:
 *         description: Category updated
 */
router.put('/category/:id', ...admin, upload.single('image'), category.updateCategory);

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete category (Admin)
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Category deleted
 */
router.delete('/category/:id', ...admin, category.deleteCategory);

/**
 * @swagger
 * /subcategory:
 *   post:
 *     summary: Create new subcategory (Admin)
 *     tags: [Admin - Subcategories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId: { type: integer }
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       201:
 *         description: Subcategory created
 */
router.post('/subcategory', ...admin, upload.single('image'), subcategory.createSubcategory);

/**
 * @swagger
 * /subcategory/{id}:
 *   put:
 *     summary: Update subcategory (Admin)
 *     tags: [Admin - Subcategories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId: { type: integer }
 *               name: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Subcategory updated
 */
router.put('/subcategory/:id', ...admin, upload.single('image'), subcategory.updateSubcategory);

/**
 * @swagger
 * /subcategory/{id}:
 *   delete:
 *     summary: Delete subcategory (Admin)
 *     tags: [Admin - Subcategories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Subcategory deleted
 */
router.delete('/subcategory/:id', ...admin, subcategory.deleteSubcategory);

/* ================= SERVICE MANAGEMENT ================= */

/**
 * @swagger
 * /service/catalog:
 *   get:
 *     summary: Get all services from catalog (Secure)
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of services in catalog
 */
router.get('/service/catalog', ...serviceRead, adminService.getAllAdminServices);

/**
 * @swagger
 * /service/catalog/{id}:
 *   get:
 *     summary: Get catalog service by ID (Secure)
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Catalog service details
 */
router.get('/service/catalog/:id', ...serviceRead, adminService.getAdminServiceById);

/**
 * @swagger
 * /service:
 *   post:
 *     summary: Create new service offering
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               service_title_id: { type: integer }
 *               price: { type: number }
 *               max_price: { type: number }
 *               image: { type: string, format: binary }
 *               images[]: { type: array, items: { type: string, format: binary } }
 *     responses:
 *       201:
 *         description: Service created
 */
router.post('/service', ...serviceWrite, upload.single('images'), service.createService);

/**
 * @swagger
 * /service/create:
 *   post:
 *     summary: Create service offering with availability
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               categoryId:
 *                 type: integer
 *               subcategoryId:
 *                 type: integer
 *               service_title_id:
 *                 type: integer
 *               price:
 *                 type: number
 *               state:
 *                 type: string
 *                 enum: [active, inactive]
 *               max_price:
 *                 type: number
 *               day_of_week:
 *                 type: string
 *               start_time:
 *                 type: string
 *                 example: "09:00"
 *               end_time:
 *                 type: string
 *                 example: "17:00"
 *               availability_status:
 *                 type: string
 *               images:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Service and availability created
 */
router.post('/service/create', ...serviceWrite, upload.single('images'), service.createServiceAndAvailability);

/**
 * @swagger
 * /service/{id}:
 *   put:
 *     summary: Update service offering
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               price: { type: number }
 *               status: { type: string }
 *               images: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Service updated
 */
router.put('/service/:id', ...serviceWrite, upload.single('images'), service.updateService);

/**
 * @swagger
 * /service/{id}:
 *   delete:
 *     summary: Delete service offering (Admin)
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.delete('/service/:id', ...admin, service.deleteService);

/* ================= SERVICE TITLES ================= */

/**
 * @swagger
 * /service_title:
 *   get:
 *     summary: Get all service titles (Admin)
 *     tags: [Admin - Service Titles]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of service titles
 */
router.get('/service_title', ...serviceRead, serviceTitle.getAllServiceTitle);

/**
 * @swagger
 * /service_title/{id}:
 *   get:
 *     summary: Get service title by ID (Admin)
 *     tags: [Admin - Service Titles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service title details
 */
router.get('/service_title/:id', ...serviceRead, serviceTitle.getServiceTitleById);

/**
 * @swagger
 * /service_title:
 *   post:
 *     summary: Create new service title (Admin)
 *     tags: [Admin - Service Titles]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       201:
 *         description: Service title created
 */
router.post('/service_title', ...admin, serviceTitle.createServiceTitle);

/**
 * @swagger
 * /service_title/{id}:
 *   put:
 *     summary: Update service title (Admin)
 *     tags: [Admin - Service Titles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *     responses:
 *       200:
 *         description: Service title updated
 */
router.put('/service_title/:id', ...admin, serviceTitle.updateServiceTitle);

/**
 * @swagger
 * /service_title/{id}:
 *   delete:
 *     summary: Delete service title (Admin)
 *     tags: [Admin - Service Titles]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service title deleted
 */
router.delete('/service_title/:id', ...admin, serviceTitle.deleteServiceTitle);

/* ================= TOKENS ================= */

/**
 * @swagger
 * /token:
 *   get:
 *     summary: Get all active tokens (Admin)
 *     tags: [Admin - Tokens]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of tokens
 */
router.get('/token', ...admin, tokenCtrl.getAllToken);

/**
 * @swagger
 * /token/{id}:
 *   get:
 *     summary: Get token details by ID (Admin)
 *     tags: [Admin - Tokens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Token details
 */
router.get('/token/:id', ...admin, tokenCtrl.getOneToken);

/**
 * @swagger
 * /token/{id}:
 *   delete:
 *     summary: Revoke/Delete token (Admin)
 *     tags: [Admin - Tokens]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Token deleted
 */
router.delete('/token/:id', ...admin, tokenCtrl.deleteToken);

/* ================= PROVIDER ================= */

/**
 * @swagger
 * /dashboard/provider:
 *   get:
 *     summary: Get provider statistics
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Provider stats
 */
router.get('/dashboard/provider', ...provider, dashboard.getProviderStats);

/**
 * @swagger
 * /provider/availability:
 *   get:
 *     summary: Get personal availability schedules
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of availability rules
 */
router.get('/provider/availability', ...provider, availability.getAllAvailability);

/**
 * @swagger
 * /provider/availability:
 *   post:
 *     summary: Update availability schedule
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               day_of_week: { type: string }
 *               start_time: { type: string }
 *               end_time: { type: string }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Availability updated
 */
router.post('/provider/availability', ...provider, availability.updateAvailability);

/**
 * @swagger
 * /provider/availability/new:
 *   post:
 *     summary: Create new custom availability
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               serviceId: { type: integer }
 *               day_of_week: { type: string }
 *               start_time: { type: string }
 *               end_time: { type: string }
 *     responses:
 *       201:
 *         description: Availability created
 */
router.post('/provider/availability/new', ...provider, availability.createNewAvailability);

/**
 * @swagger
 * /provider/availability/always:
 *   post:
 *     summary: Set provider as always available
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Availability updated to always
 */
router.post('/provider/availability/always', ...provider, availability.setAlwaysAvailable);

/**
 * @swagger
 * /booking/provider/{id}:
 *   get:
 *     summary: Get all bookings for a provider
 *     tags: [Provider]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of provider bookings
 */
router.get('/booking/provider/:id', ...provider, booking.getAllBookingForProvider);

/**
 * @swagger
 * /services/{id}/active:
 *   put:
 *     summary: active service (provider)
 *     tags: [provider - Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service actived
 */
router.put('/services/:id/active', ...provider, adminUser.activeTheService);

/**
 * @swagger
 * /services/{id}/deactive:
 *   put:
 *     summary: deactive service (Provider)
 *     tags: [Provider - Services]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service deactived
 */
router.put('/services/:id/deactive', ...provider, adminUser.deactiveTheService);
/**
 * @swagger
 * /service/{id}:
 *   delete:
 *     summary: Delete service offering (provider)
 *     tags: [Service Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.delete('/service/delete/:id', ...provider, service.deleteService);
/* ================= CUSTOMER ================= */

/**
 * @swagger
 * /dashboard/customer:
 *   get:
 *     summary: Get customer dashboard statistics
 *     tags: [Customer]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Customer stats
 */
router.get('/dashboard/customer', ...customer, dashboard.getCustomerStats);

/**
 * @swagger
 * /booking:
 *   post:
 *     summary: Create a new service booking
 *     tags: [Customer]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               service_id: { type: integer }
 *               booking_date: { type: string, format: date }
 *               booking_time: { type: string }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Booking created
 */
router.post('/booking', ...customer, booking.createBooking);

/**
 * @swagger
 * /booking/customer/{id}:
 *   get:
 *     summary: Get all bookings for a customer
 *     tags: [Customer]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: List of customer bookings
 */
router.get('/booking/customer/:id', ...customer, booking.getAllBookingForCustomer);

/* ================= SHARED ================= */

/**
 * @swagger
 * /booking/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     tags: [Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Booking details
 */
router.get('/booking/:id', verifyToken, permit('admin', 'adminuser', 'provider', 'customer'), booking.getBookingById);

/**
 * @swagger
 * /booking:
 *   get:
 *     summary: Get all bookings (System Wide)
 *     tags: [Booking Management]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of all bookings
 */
router.get('/booking', verifyToken, permit('admin', 'adminuser'), booking.getAllBooking);

/**
 * @swagger
 * /booking/{id}:
 *   put:
 *     summary: Update booking details
 *     tags: [Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Booking updated
 */
router.put('/booking/:id', verifyToken, permit('admin', 'adminuser', 'provider', 'customer'), booking.updateBooking);

/**
 * @swagger
 * /booking/{id}/status:
 *   patch:
 *     summary: Update booking status (State Machine)
 *     tags: [Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status: { type: string, enum: [accepted, rejected, in_progress, completed, cancelled] }
 *     responses:
 *       200:
 *         description: Status updated
 */
router.patch('/booking/:id/status', verifyToken, permit('admin', 'adminuser', 'provider'), booking.updateStatusBooking);

/**
 * @swagger
 * /booking/{id}:
 *   delete:
 *     summary: Hard delete booking (Admin only)
 *     tags: [Booking Management]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Booking deleted
 */
router.delete('/booking/:id', verifyToken, permit('admin', 'adminuser'), booking.deleteBooking);

/* ================= NOTIFICATIONS ================= */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/notifications', verifyToken, notification.getNotifications);

/**
 * @swagger
 * /notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification updated
 */
router.put('/notifications/:id/read', verifyToken, notification.markAsRead);

/**
 * @swagger
 * /notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Notification deleted
 */
router.delete('/notifications/:id', verifyToken, notification.deleteNotification);

/* ================= PROFILE ================= */

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update personal profile
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               phone: { type: string }
 *               address: { type: string }
 *               city: { type: string }
 *               image: { type: string, format: binary }
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/users/:id', verifyToken, upload.single('image'), user.updateUser);

/**
 * @swagger
 * /users/{id}/password:
 *   patch:
 *     summary: Update password
 *     tags: [Profile]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Password updated
 */
router.patch('/users/:id/password', verifyToken, updatePasswordValidation, user.updateUserPassword);

module.exports = router;