const { Op } = require('sequelize');
const { OfferSheet, Welder, NdtRecord, WeldPwht, User, ActionAlert } = require('../models');

exports.globalSearch = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ message: 'Query parameter "q" is required.' });

    // We prioritize searching by unique_code, then joint_id, then welder details.
    const results = await OfferSheet.findAll({
      where: {
        [Op.or]: [
          { unique_code: { [Op.like]: `%${q}%` } },
          { joint_id: { [Op.like]: `%${q}%` } },
          { '$Welder.welder_name$': { [Op.like]: `%${q}%` } },
          { '$Welder.welder_id$': { [Op.like]: `%${q}%` } }
        ]
      },
      include: [
        { model: Welder, required: false },
        { model: NdtRecord, required: false },
        { model: WeldPwht, required: false },
        { model: User, as: 'supervisor', attributes: ['id', 'username', 'role'], required: false }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50 // Limit for enterprise performance
    });

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
