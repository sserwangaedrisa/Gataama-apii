const express = require("express");
const router = express.Router();
const teamsController = require("../controllers/team");
const verifyToken = require("../middleware/auth");
const upload = require("../middleware/image-upload");

const { isCountryAdmin, isAdmin } = require("../middleware/role");

router.post('/:countryId',verifyToken, isCountryAdmin, upload.single("profilePicture"), teamsController.addTeamMember);

router.get('/:countryId', teamsController.getTeamMembersByCountry);

router.put('/:countryId/:teamMemberId', verifyToken, isCountryAdmin, upload.single("profilePicture"), teamsController.updateTeamMember);

router.delete('/:countryId/:teamMemberId', verifyToken, isCountryAdmin,teamsController.deleteTeamMember);

module.exports = router;
