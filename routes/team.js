const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/team");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/image-upload");
const { isCountryAdmin, isAdmin } = require("../middleware/role");

/**
 * @openapi
 * /team/main:
 *   get:
 *     tags:
 *       - Team
 *     summary: get all main team
 *     responses:
 *       200:
 *         description: successfull
 *       500:
 *         description: server error
 */
router.get('/main', teamsController.getTeamsMain);

/**
 * @openapi
 * /team/{countryId}:
 *   get:
 *     tags:
 *       - Team
 *     summary: get team members by country
 *     parameters:
 *       - name: countryId
 *         in: path
 *         required: true
 *         description: country id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: successfull
 *       500:
 *         description: server error
 */
router.get('/:countryId', teamsController.getTeamMembersByCountry);

/**
 * @openapi
 * /team/main:
 *   post:
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     summary: Add member to team
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamInput'
 *     responses:
 *       201:
 *         description: successfull creation
 *       500:
 *         description: server error
 */
router.post('/main',verifyToken, isAdmin, upload.single("profilePicture"), teamsController.addTeamMemberForMain);

/**
 * @openapi
 * /team/main/{teamMemberId}:
 *   put:
 *     tags:
 *       - Team
 *     summary: update main team member by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: teamMemberId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: member id
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamInput'
 *     responses:
 *       201:
 *         description: successfull creation
 *       500:
 *         description: server error
 */
router.put('/main/:teamMemberId', verifyToken, isAdmin, upload.single("profilePicture"), teamsController.updateTeamMemberForMain);

/**
 * @openapi
 * /team/main/{teamMemberId}:
 *   delete:
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     summary: detele main team member
 *     parameters:
 *       - name: teamMemberId
 *         in: path
 *         required: true
 *         description: member id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: successfully deleted
 *       500:
 *         description: server error
 */
router.delete('/main/:teamMemberId', verifyToken, isAdmin,teamsController.deleteMainTeamMember);

/**
 * @openapi
 * /team/{countryId}:
 *   post:
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     summary: Add member to team to country
 *     parameters:
 *       - name: countryId
 *         in: params
 *         required: true
 *         description: country id
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamInput'
 *     responses:
 *       201:
 *         description: successfull creation
 *       500:
 *         description: server error
 */
router.post('/:countryId', verifyToken, isCountryAdmin, upload.single("profilePicture"), teamsController.addTeamMember);

/**
 * @openapi
 * /team/{countryId}/{teamMemberId}:
 *   put:
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     summary: update country team member
 *     parameters:
 *       - name: countryId
 *         in: path
 *         required: true
 *         description: country id
 *         schema:
 *           type: string
 *       - name: teamMemberId
 *         in: path
 *         required: true
 *         description: member id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamInput'
 *     responses:
 *       200:
 *         description: successfully deleted
 *       500:
 *         description: server error
 */
router.put('/:countryId/:teamMemberId', verifyToken, isCountryAdmin, upload.single("profilePicture"), teamsController.updateTeamMember);

/**
 * @openapi
 * /team/{countryId}/{teamMemberId}:
 *   delete:
 *     tags:
 *       - Team
 *     security:
 *       - bearerAuth: []
 *     summary: detele country team member
 *     parameters:
 *       - name: countryId
 *         in: path
 *         required: true
 *         description: country id
 *         schema:
 *           type: string
 *       - name: teamMemberId
 *         in: path
 *         required: true
 *         description: member id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: successfully deleted
 *       500:
 *         description: server error
 */
router.delete('/:countryId/:teamMemberId', verifyToken, isCountryAdmin,teamsController.deleteTeamMember);

module.exports = router;
