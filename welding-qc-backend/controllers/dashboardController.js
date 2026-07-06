const { OfferSheet, Welder, NdtRecord, WeldPwht, Supervisor } = require('../models');

exports.getDashboardKPIs = async (req, res) => {
  try {
    const totalJoints = await OfferSheet.count();
    const totalWelders = await Welder.count();
    const totalSupervisors = await Supervisor.count({ where: { status: 'Active' } });
    
    const rtCount = await NdtRecord.count({ where: { type: 'RT' } });
    const pautCount = await NdtRecord.count({ where: { type: 'PAUT' } });
    const pwhtCount = await WeldPwht.count({ where: { pwht_required: true } });
    const pwhtPending = await WeldPwht.count({ where: { pwht_required: true, pwht_status: 'Pending' } });
    const pwhtInProgress = await WeldPwht.count({ where: { pwht_required: true, pwht_status: 'In Progress' } });
    const pwhtCompleted = await WeldPwht.count({ where: { pwht_required: true, pwht_status: 'Completed' } });

    // Calculate RT clearance rate (approximation: Passed / Total RT records)
    const passedRt = await NdtRecord.count({ where: { type: 'RT', result: 'Pass' } });
    const rtClearanceRate = rtCount > 0 ? ((passedRt / rtCount) * 100).toFixed(1) : 0;

    res.status(200).json({
      totalJoints,
      totalWelders,
      totalSupervisors,
      totalInspections: rtCount + pautCount,
      rtClearanceRate,
      pwhtCount,
      pwhtPending,
      pwhtInProgress,
      pwhtCompleted
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
