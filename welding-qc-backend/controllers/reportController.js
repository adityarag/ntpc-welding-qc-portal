const { Op, fn, col, literal } = require('sequelize');
const {
  sequelize, OfferSheet, Joint, RtAttempt, WeldPwht, NdtRecord,
  User, Welder, Supervisor, RtSubmissionBatch
} = require('../models');

// ─── Helper: safe number ───────────────────────────────────────────────────
const n = (v) => (v === null || v === undefined ? 0 : Number(v));
const pct = (a, b) => (n(b) > 0 ? ((n(a) / n(b)) * 100).toFixed(1) : '0.0');

// ─── A. Offer Sheet Master Log ─────────────────────────────────────────────
exports.getOfferSheetReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.date = { [Op.gte]: from };
    } else if (to) {
      whereClause.date = { [Op.lte]: to };
    }

    const sheets = await OfferSheet.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'username'] },
        { model: Joint, attributes: ['unique_code', 'status'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = sheets.map(s => {
      const joints = s.Joints || [];
      const completed = joints.filter(j => ['RT Accepted', 'Completed', 'Accepted'].includes(j.status)).length;
      return {
        offer_sheet_id: s.offer_sheet_id,
        supervisor_id: s.supervisor_id,
        supervisor_username: s.supervisor ? s.supervisor.username : '—',
        target_joints: n(s.target_joints),
        joints_created: joints.length,
        joints_completed: completed,
        joints_remaining: Math.max(0, n(s.target_joints) - joints.length),
        completion_pct: pct(completed, s.target_joints) + '%',
        date: s.date,
        created_at: s.createdAt ? s.createdAt.toISOString().split('T')[0] : ''
      };
    });

    const summary = {
      total_offer_sheets: data.length,
      total_assigned_joints: data.reduce((a, d) => a + d.target_joints, 0),
      total_joints_created: data.reduce((a, d) => a + d.joints_created, 0),
      total_completed: data.reduce((a, d) => a + d.joints_completed, 0)
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── B. Joints Master Log ──────────────────────────────────────────────────
exports.getJointsReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      whereClause.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      whereClause.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const joints = await Joint.findAll({
      where: whereClause,
      include: [
        { model: OfferSheet, attributes: ['offer_sheet_id', 'date', 'supervisor_id'] },
        { model: Welder, attributes: ['welder_id', 'welder_name'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = joints.map(j => ({
      unique_code: j.unique_code,
      offer_sheet_id: j.offer_sheet_id,
      joint_id: j.joint_id,
      area_system: j.area_system || '—',
      coil_no: j.coil_no || '—',
      tube_no: j.tube_no || '—',
      material_spec: j.material_spec || '—',
      weld_size: j.weld_size || '—',
      welder_id: j.welder_id || '—',
      welder_name: j.Welder ? j.Welder.welder_name : '—',
      supervisor_id: j.OfferSheet ? j.OfferSheet.supervisor_id : '—',
      pwht_required: j.pwht_required ? 'YES' : 'NO',
      status: j.status || 'Pending',
      created_at: j.createdAt ? j.createdAt.toISOString().split('T')[0] : '',
      updated_at: j.updatedAt ? j.updatedAt.toISOString().split('T')[0] : ''
    }));

    const statusCounts = data.reduce((acc, d) => {
      const s = d.status;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const summary = {
      total_joints: data.length,
      accepted: n(statusCounts['RT Accepted'] || statusCounts['Accepted'] || statusCounts['Completed']),
      pending: n(statusCounts['Pending']),
      rejected: n(statusCounts['RT Rejected'] || statusCounts['Rejected'])
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── C. RT Evaluation Summary ──────────────────────────────────────────────
exports.getRtEvaluationReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.report_date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.report_date = { [Op.gte]: from };
    } else if (to) {
      whereClause.report_date = { [Op.lte]: to };
    }

    const attempts = await RtAttempt.findAll({
      where: whereClause,
      include: [
        {
          model: Joint,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id'],
          include: [{ model: OfferSheet, attributes: ['offer_sheet_id', 'supervisor_id'] }]
        },
        { model: User, as: 'verifier', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = attempts.map(a => ({
      unique_code: a.unique_code,
      joint_id: a.Joint ? a.Joint.joint_id : '—',
      area_system: a.Joint ? (a.Joint.area_system || '—') : '—',
      coil_no: a.Joint ? (a.Joint.coil_no || '—') : '—',
      tube_no: a.Joint ? (a.Joint.tube_no || '—') : '—',
      welder_id: a.Joint ? (a.Joint.welder_id || '—') : '—',
      offer_sheet_id: a.Joint && a.Joint.OfferSheet ? a.Joint.OfferSheet.offer_sheet_id : '—',
      supervisor_id: a.Joint && a.Joint.OfferSheet ? a.Joint.OfferSheet.supervisor_id : '—',
      attempt_number: a.attempt_number,
      offer_date: a.report_date || '—',
      evaluation_status: a.status || 'Pending',
      defect_classification: a.defect_type || '—',
      remark_number: a.remark_number || '—',
      verifier_name: a.verifier ? a.verifier.username : '—',
      is_submitted: a.is_submitted ? 'YES' : 'NO',
      verified_at: a.verified_at ? new Date(a.verified_at).toISOString().split('T')[0] : '—',
      created_at: a.createdAt ? a.createdAt.toISOString().split('T')[0] : ''
    }));

    const total = data.length;
    const passed = data.filter(d => d.evaluation_status === 'Accepted').length;
    const failed = data.filter(d => d.evaluation_status === 'Rejected').length;

    const summary = {
      total_rt_evaluations: total,
      pass_count: passed,
      fail_count: failed,
      pass_rate: pct(passed, total) + '%'
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── D. PWHT Progress Report ───────────────────────────────────────────────
exports.getPwhtProgressReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = { pwht_required: true };
    if (from && to) {
      whereClause.pwht_date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.pwht_date = { [Op.gte]: from };
    } else if (to) {
      whereClause.pwht_date = { [Op.lte]: to };
    }

    const records = await WeldPwht.findAll({
      where: whereClause,
      include: [
        {
          model: Joint,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id'],
          include: [{ model: OfferSheet, attributes: ['offer_sheet_id', 'supervisor_id'] }]
        },
        { model: User, as: 'verifier', attributes: ['id', 'username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const data = records.map(p => ({
      unique_code: p.joint_id,
      joint_id: p.Joint ? p.Joint.joint_id : '—',
      area_system: p.Joint ? (p.Joint.area_system || '—') : '—',
      coil_no: p.Joint ? (p.Joint.coil_no || '—') : '—',
      tube_no: p.Joint ? (p.Joint.tube_no || '—') : '—',
      welder_id: p.Joint ? (p.Joint.welder_id || '—') : '—',
      offer_sheet_id: p.Joint && p.Joint.OfferSheet ? p.Joint.OfferSheet.offer_sheet_id : '—',
      pwht_chart_number: p.pwht_chart_number || '—',
      pwht_date: p.pwht_date || '—',
      hardness: p.hardness || '—',
      pwht_status: p.pwht_status || 'Pending',
      remark_number: p.remark_number || '—',
      report_date: p.report_date || '—',
      verifier_name: p.verifier ? p.verifier.username : '—',
      wps_no: p.wps_no || '—',
      electrode: p.electrode || '—',
      created_at: p.createdAt ? p.createdAt.toISOString().split('T')[0] : ''
    }));

    const summary = {
      pwht_required: data.length,
      pending: data.filter(d => d.pwht_status === 'Pending').length,
      in_progress: data.filter(d => d.pwht_status === 'In Progress').length,
      completed: data.filter(d => d.pwht_status === 'Completed').length
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── E. Supervisor Performance Report ─────────────────────────────────────
exports.getSupervisorPerformanceReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const osWhere = {};
    if (from && to) {
      osWhere.date = { [Op.between]: [from, to] };
    } else if (from) {
      osWhere.date = { [Op.gte]: from };
    } else if (to) {
      osWhere.date = { [Op.lte]: to };
    }

    const supervisors = await User.findAll({
      where: { role: 1 },
      include: [
        {
          model: OfferSheet,
          where: Object.keys(osWhere).length > 0 ? osWhere : undefined,
          required: false,
          include: [
            {
              model: Joint,
              include: [
                { model: RtAttempt, attributes: ['attempt_id', 'status', 'attempt_number'] },
                { model: WeldPwht, attributes: ['joint_id', 'pwht_status'] }
              ]
            }
          ]
        }
      ]
    });

    const data = supervisors.map(sup => {
      const offerSheets = sup.OfferSheets || [];
      const allJoints = offerSheets.flatMap(os => os.Joints || []);
      const allAttempts = allJoints.flatMap(j => j.RtAttempts || []);
      const allPwht = allJoints.map(j => j.WeldPwht).filter(Boolean);

      const totalJoints = allJoints.length;
      const targetJoints = offerSheets.reduce((a, os) => a + n(os.target_joints), 0);
      const rtPassed = allAttempts.filter(a => a.status === 'Accepted').length;
      const rtFailed = allAttempts.filter(a => a.status === 'Rejected').length;
      const rtPending = allAttempts.filter(a => a.status === 'Pending').length;
      const pwhtPending = allPwht.filter(p => p.pwht_status === 'Pending').length;
      const completionRate = pct(totalJoints, targetJoints);

      return {
        supervisor_id: sup.id,
        supervisor_username: sup.username,
        offer_sheets_assigned: offerSheets.length,
        target_joints: targetJoints,
        joints_created: totalJoints,
        rt_pending: rtPending,
        rt_passed: rtPassed,
        rt_failed: rtFailed,
        pwht_pending: pwhtPending,
        completion_rate_pct: completionRate + '%'
      };
    });

    const sorted = [...data].sort((a, b) => parseFloat(b.completion_rate_pct) - parseFloat(a.completion_rate_pct));

    const summary = {
      total_supervisors: data.length,
      best_performer: sorted.length > 0 ? sorted[0].supervisor_username : '—',
      lowest_performer: sorted.length > 0 ? sorted[sorted.length - 1].supervisor_username : '—',
      avg_completion_rate: data.length > 0
        ? (data.reduce((a, d) => a + parseFloat(d.completion_rate_pct), 0) / data.length).toFixed(1) + '%'
        : '0.0%'
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── F. Welder Performance Report ─────────────────────────────────────────
exports.getWelderPerformanceReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const jointWhere = {};
    if (from && to) {
      jointWhere.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      jointWhere.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      jointWhere.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const welders = await Welder.findAll({
      include: [
        {
          model: Joint,
          where: Object.keys(jointWhere).length > 0 ? jointWhere : undefined,
          required: false,
          include: [{ model: RtAttempt, attributes: ['attempt_id', 'status', 'attempt_number'] }]
        }
      ]
    });

    const data = welders.map(w => {
      const joints = w.Joints || [];
      const allAttempts = joints.flatMap(j => j.RtAttempts || []);
      const passed = allAttempts.filter(a => a.status === 'Accepted').length;
      const failed = allAttempts.filter(a => a.status === 'Rejected').length;
      // repairs = joints that needed attempt 2 or 3
      const repairs = joints.filter(j => (j.RtAttempts || []).some(a => a.attempt_number > 1)).length;

      return {
        welder_id: w.welder_id,
        welder_name: w.welder_name,
        qualification: w.qualification || '—',
        employer: w.employer || '—',
        total_welds: joints.length,
        rt_passed: passed,
        rt_failed: failed,
        repairs_required: repairs,
        success_rate_pct: pct(passed, allAttempts.length) + '%'
      };
    });

    const sorted = [...data].filter(d => d.total_welds > 0).sort(
      (a, b) => parseFloat(b.success_rate_pct) - parseFloat(a.success_rate_pct)
    );

    const summary = {
      total_welders: data.length,
      total_welds: data.reduce((a, d) => a + d.total_welds, 0),
      best_welder: sorted.length > 0 ? sorted[0].welder_name : '—',
      weakest_welder: sorted.length > 0 ? sorted[sorted.length - 1].welder_name : '—'
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── G. Joint Lifecycle Tracking Report ───────────────────────────────────
exports.getJointLifecycleReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      whereClause.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      whereClause.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const joints = await Joint.findAll({
      where: whereClause,
      include: [
        { model: OfferSheet, attributes: ['offer_sheet_id', 'supervisor_id', 'date'] },
        { model: Welder, attributes: ['welder_id', 'welder_name'] },
        { model: RtAttempt, attributes: ['attempt_number', 'status', 'report_date', 'defect_type'] },
        {
          model: WeldPwht,
          attributes: ['pwht_required', 'pwht_status', 'pwht_date', 'pwht_chart_number']
        },
        {
          model: NdtRecord,
          attributes: ['type', 'result', 'date', 'defect_type'],
          where: { type: ['PAUT', 'MPI'] },
          required: false
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const data = joints.map(j => {
      const attempts = (j.RtAttempts || []).sort((a, b) => a.attempt_number - b.attempt_number);
      const paut = (j.NdtRecords || []).find(r => r.type === 'PAUT');
      const mpi = (j.NdtRecords || []).find(r => r.type === 'MPI');
      const pwht = j.WeldPwht;

      const rt1 = attempts.find(a => a.attempt_number === 1);
      const rt2 = attempts.find(a => a.attempt_number === 2);
      const rt3 = attempts.find(a => a.attempt_number === 3);

      // Determine final lifecycle status
      let lifecycle_status = 'CREATED';
      if (rt1) lifecycle_status = `RT-1: ${rt1.status.toUpperCase()}`;
      if (rt2) lifecycle_status = `RT-2: ${rt2.status.toUpperCase()}`;
      if (rt3) lifecycle_status = `RT-3: ${rt3.status.toUpperCase()}`;
      if (pwht && pwht.pwht_status === 'Completed') lifecycle_status = 'PWHT COMPLETED';
      if (paut && paut.result === 'Pass') lifecycle_status = 'PAUT PASSED';
      if (mpi && mpi.result === 'Pass') lifecycle_status = 'MPI PASSED';
      if (j.status === 'RT Accepted' || j.status === 'Accepted') lifecycle_status = 'FINAL: ACCEPTED';

      return {
        unique_code: j.unique_code,
        joint_id: j.joint_id,
        area_system: j.area_system || '—',
        coil_no: j.coil_no || '—',
        tube_no: j.tube_no || '—',
        welder_id: j.welder_id || '—',
        welder_name: j.Welder ? j.Welder.welder_name : '—',
        offer_sheet_id: j.offer_sheet_id,
        supervisor_id: j.OfferSheet ? j.OfferSheet.supervisor_id : '—',
        joint_created: j.createdAt ? j.createdAt.toISOString().split('T')[0] : '',
        rt1_status: rt1 ? rt1.status : 'NOT DONE',
        rt1_date: rt1 ? (rt1.report_date || '—') : '—',
        rt1_defect: rt1 ? (rt1.defect_type || '—') : '—',
        rt2_status: rt2 ? rt2.status : 'NOT DONE',
        rt2_date: rt2 ? (rt2.report_date || '—') : '—',
        rt3_status: rt3 ? rt3.status : 'NOT DONE',
        rt3_date: rt3 ? (rt3.report_date || '—') : '—',
        pwht_required: j.pwht_required ? 'YES' : 'NO',
        pwht_status: pwht ? pwht.pwht_status : 'N/A',
        pwht_date: pwht ? (pwht.pwht_date || '—') : '—',
        paut_result: paut ? paut.result : 'NOT DONE',
        paut_date: paut ? (paut.date || '—') : '—',
        mpi_result: mpi ? mpi.result : 'NOT DONE',
        mpi_date: mpi ? (mpi.date || '—') : '—',
        current_status: j.status || 'Pending',
        lifecycle_status
      };
    });

    const summary = {
      total_joints: data.length,
      rt_accepted: data.filter(d => d.rt1_status === 'Accepted' || d.rt2_status === 'Accepted' || d.rt3_status === 'Accepted').length,
      pwht_completed: data.filter(d => d.pwht_status === 'Completed').length,
      paut_passed: data.filter(d => d.paut_result === 'Pass').length,
      mpi_passed: data.filter(d => d.mpi_result === 'Pass').length,
      fully_completed: data.filter(d => d.current_status === 'RT Accepted' || d.current_status === 'Accepted').length
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── H. Pending Work Report ────────────────────────────────────────────────
exports.getPendingWorkReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const jointWhere = {};
    if (from && to) {
      jointWhere.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      jointWhere.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      jointWhere.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const hasDateFilter = Object.keys(jointWhere).length > 0;

    const [rtPending, pwhtPending, pautPending, mpiPending] = await Promise.all([
      RtAttempt.findAll({
        where: { status: 'Pending' },
        include: [{
          model: Joint,
          where: hasDateFilter ? jointWhere : undefined,
          required: hasDateFilter,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id'],
          include: [{ model: OfferSheet, attributes: ['offer_sheet_id', 'supervisor_id'] }]
        }]
      }),
      WeldPwht.findAll({
        where: { pwht_required: true, pwht_status: 'Pending' },
        include: [{
          model: Joint,
          where: hasDateFilter ? jointWhere : undefined,
          required: hasDateFilter,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no']
        }]
      }),
      NdtRecord.findAll({
        where: { type: 'PAUT', result: 'Pending' },
        include: [{
          model: Joint,
          where: hasDateFilter ? jointWhere : undefined,
          required: hasDateFilter,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no']
        }]
      }),
      NdtRecord.findAll({
        where: { type: 'MPI', result: 'Pending' },
        include: [{
          model: Joint,
          where: hasDateFilter ? jointWhere : undefined,
          required: hasDateFilter,
          attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no']
        }]
      })
    ]);

    const data = [
      ...rtPending.map(r => ({
        category: 'RT PENDING',
        unique_code: r.unique_code,
        joint_id: r.Joint ? r.Joint.joint_id : '—',
        area_system: r.Joint ? (r.Joint.area_system || '—') : '—',
        coil_no: r.Joint ? (r.Joint.coil_no || '—') : '—',
        tube_no: r.Joint ? (r.Joint.tube_no || '—') : '—',
        welder_id: r.Joint ? (r.Joint.welder_id || '—') : '—',
        offer_sheet_id: r.Joint && r.Joint.OfferSheet ? r.Joint.OfferSheet.offer_sheet_id : '—',
        supervisor_id: r.Joint && r.Joint.OfferSheet ? r.Joint.OfferSheet.supervisor_id : '—',
        attempt_number: r.attempt_number,
        pending_since: r.createdAt ? r.createdAt.toISOString().split('T')[0] : ''
      })),
      ...pwhtPending.map(p => ({
        category: 'PWHT PENDING',
        unique_code: p.joint_id,
        joint_id: p.Joint ? p.Joint.joint_id : '—',
        area_system: p.Joint ? (p.Joint.area_system || '—') : '—',
        coil_no: p.Joint ? (p.Joint.coil_no || '—') : '—',
        tube_no: p.Joint ? (p.Joint.tube_no || '—') : '—',
        welder_id: '—',
        offer_sheet_id: '—',
        supervisor_id: '—',
        attempt_number: '—',
        pending_since: p.createdAt ? p.createdAt.toISOString().split('T')[0] : ''
      })),
      ...pautPending.map(r => ({
        category: 'PAUT PENDING',
        unique_code: r.joint_id,
        joint_id: r.Joint ? r.Joint.joint_id : '—',
        area_system: r.Joint ? (r.Joint.area_system || '—') : '—',
        coil_no: r.Joint ? (r.Joint.coil_no || '—') : '—',
        tube_no: r.Joint ? (r.Joint.tube_no || '—') : '—',
        welder_id: '—',
        offer_sheet_id: '—',
        supervisor_id: '—',
        attempt_number: '—',
        pending_since: r.createdAt ? r.createdAt.toISOString().split('T')[0] : ''
      })),
      ...mpiPending.map(r => ({
        category: 'MPI PENDING',
        unique_code: r.joint_id,
        joint_id: r.Joint ? r.Joint.joint_id : '—',
        area_system: r.Joint ? (r.Joint.area_system || '—') : '—',
        coil_no: r.Joint ? (r.Joint.coil_no || '—') : '—',
        tube_no: r.Joint ? (r.Joint.tube_no || '—') : '—',
        welder_id: '—',
        offer_sheet_id: '—',
        supervisor_id: '—',
        attempt_number: '—',
        pending_since: r.createdAt ? r.createdAt.toISOString().split('T')[0] : ''
      }))
    ];

    const summary = {
      rt_pending: rtPending.length,
      pwht_pending: pwhtPending.length,
      paut_pending: pautPending.length,
      mpi_pending: mpiPending.length,
      total_pending: rtPending.length + pwhtPending.length + pautPending.length + mpiPending.length
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── I. Failure Analysis Report ────────────────────────────────────────────
exports.getFailureAnalysisReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const where = { status: 'Rejected' };
    if (from && to) {
      where.report_date = { [Op.between]: [from, to] };
    } else if (from) {
      where.report_date = { [Op.gte]: from };
    } else if (to) {
      where.report_date = { [Op.lte]: to };
    }

    const failures = await RtAttempt.findAll({
      where,
      include: [{
        model: Joint,
        attributes: ['unique_code', 'joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id']
      }],
      order: [['createdAt', 'DESC']]
    });

    // Group by defect type
    const defectMap = {};
    failures.forEach(f => {
      const defect = f.defect_type || 'UNCLASSIFIED';
      if (!defectMap[defect]) defectMap[defect] = { defect_type: defect, frequency: 0, joints: new Set() };
      defectMap[defect].frequency++;
      defectMap[defect].joints.add(f.unique_code);
    });

    const grouped = Object.values(defectMap).map(d => ({
      defect_type: d.defect_type,
      frequency: d.frequency,
      failed_joints_count: d.joints.size
    })).sort((a, b) => b.frequency - a.frequency);

    const detail = failures.map(f => ({
      unique_code: f.unique_code,
      joint_id: f.Joint ? f.Joint.joint_id : '—',
      area_system: f.Joint ? (f.Joint.area_system || '—') : '—',
      coil_no: f.Joint ? (f.Joint.coil_no || '—') : '—',
      tube_no: f.Joint ? (f.Joint.tube_no || '—') : '—',
      welder_id: f.Joint ? (f.Joint.welder_id || '—') : '—',
      attempt_number: f.attempt_number,
      defect_type: f.defect_type || 'UNCLASSIFIED',
      remark_number: f.remark_number || '—',
      date: f.report_date || (f.createdAt ? f.createdAt.toISOString().split('T')[0] : '—')
    }));

    const summary = {
      total_failures: failures.length,
      unique_defect_types: grouped.length,
      most_common_defect: grouped.length > 0 ? grouped[0].defect_type : '—',
      most_common_frequency: grouped.length > 0 ? grouped[0].frequency : 0
    };

    res.json({ summary, grouped, data: detail });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── J. Area System Report ─────────────────────────────────────────────────
exports.getAreaSystemReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      whereClause.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      whereClause.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const joints = await Joint.findAll({
      where: whereClause,
      include: [
        { model: RtAttempt, attributes: ['attempt_id', 'status'] },
        { model: WeldPwht, attributes: ['joint_id', 'pwht_status', 'pwht_required'] }
      ]
    });

    const areaMap = {};
    joints.forEach(j => {
      const area = j.area_system || 'UNKNOWN';
      if (!areaMap[area]) areaMap[area] = { area_system: area, total_joints: 0, completed: 0, pending: 0, rt_failures: 0, pwht_pending: 0 };
      areaMap[area].total_joints++;
      if (['RT Accepted', 'Accepted', 'Completed'].includes(j.status)) areaMap[area].completed++;
      else areaMap[area].pending++;

      const failedRt = (j.RtAttempts || []).some(a => a.status === 'Rejected');
      if (failedRt) areaMap[area].rt_failures++;

      if (j.WeldPwht && j.WeldPwht.pwht_required && j.WeldPwht.pwht_status === 'Pending') {
        areaMap[area].pwht_pending++;
      }
    });

    const data = Object.values(areaMap).map(a => ({
      ...a,
      completion_pct: pct(a.completed, a.total_joints) + '%'
    })).sort((a, b) => b.total_joints - a.total_joints);

    const summary = {
      total_area_systems: data.length,
      total_joints: data.reduce((a, d) => a + d.total_joints, 0),
      most_active_area: data.length > 0 ? data[0].area_system : '—',
      highest_rt_failures_area: data.length > 0
        ? [...data].sort((a, b) => b.rt_failures - a.rt_failures)[0].area_system
        : '—'
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── K. Productivity Report ────────────────────────────────────────────────
exports.getProductivityReport = async (req, res) => {
  try {
    const { period = 'daily', days = 30, from, to } = req.query;
    
    let dateFilter;
    if (from && to) {
      dateFilter = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      dateFilter = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      dateFilter = { [Op.lte]: to + ' 23:59:59' };
    } else {
      const since = new Date();
      since.setDate(since.getDate() - Number(days));
      dateFilter = { [Op.gte]: since };
    }

    const [joints, rtAttempts, pwhts, ndtRecords] = await Promise.all([
      Joint.findAll({ where: { createdAt: dateFilter }, attributes: ['unique_code', 'createdAt'] }),
      RtAttempt.findAll({ where: { createdAt: dateFilter, status: { [Op.ne]: 'Pending' } }, attributes: ['attempt_id', 'createdAt', 'status'] }),
      WeldPwht.findAll({ where: { updatedAt: dateFilter, pwht_status: 'Completed' }, attributes: ['joint_id', 'updatedAt'] }),
      NdtRecord.findAll({ where: { updatedAt: dateFilter, result: { [Op.ne]: 'Pending' } }, attributes: ['id', 'type', 'updatedAt', 'result'] })
    ]);

    const bucketKey = (date) => {
      const d = new Date(date);
      if (period === 'weekly') {
        // Get start of week (Monday)
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        return monday.toISOString().split('T')[0];
      }
      return d.toISOString().split('T')[0];
    };

    const map = {};
    const ensure = (k) => {
      if (!map[k]) map[k] = { date: k, joints_created: 0, rt_done: 0, pwht_done: 0, paut_done: 0, mpi_done: 0 };
    };

    joints.forEach(j => { const k = bucketKey(j.createdAt); ensure(k); map[k].joints_created++; });
    rtAttempts.forEach(r => { const k = bucketKey(r.createdAt); ensure(k); map[k].rt_done++; });
    pwhts.forEach(p => { const k = bucketKey(p.updatedAt); ensure(k); map[k].pwht_done++; });
    ndtRecords.forEach(r => {
      const k = bucketKey(r.updatedAt); ensure(k);
      if (r.type === 'PAUT') map[k].paut_done++;
      if (r.type === 'MPI') map[k].mpi_done++;
    });

    const data = Object.values(map).sort((a, b) => a.date.localeCompare(b.date));

    const summary = {
      period,
      days_covered: Number(days),
      total_joints_created: joints.length,
      total_rt_done: rtAttempts.length,
      total_pwht_done: pwhts.length,
      total_paut_done: ndtRecords.filter(r => r.type === 'PAUT').length,
      total_mpi_done: ndtRecords.filter(r => r.type === 'MPI').length
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── L. Verifier Activity Report ──────────────────────────────────────────
exports.getVerifierActivityReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    const verifyWhere = {};
    if (from && to) {
      verifyWhere.verified_at = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      verifyWhere.verified_at = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      verifyWhere.verified_at = { [Op.lte]: to + ' 23:59:59' };
    }

    const verifiers = await User.findAll({
      where: { role: [2, 3] },
      include: [
        { 
          model: RtAttempt, 
          as: 'verifiedAttempts', 
          where: Object.keys(verifyWhere).length > 0 ? verifyWhere : undefined,
          required: false,
          attributes: ['attempt_id', 'status', 'verified_at'] 
        },
        { 
          model: WeldPwht, 
          as: 'verifiedPwhts', 
          where: Object.keys(verifyWhere).length > 0 ? verifyWhere : undefined,
          required: false,
          attributes: ['joint_id', 'pwht_status', 'verified_at'] 
        }
      ]
    });

    const data = verifiers.map(v => {
      const rtVerified = (v.verifiedAttempts || []).length;
      const pwhtVerified = (v.verifiedPwhts || []).length;

      return {
        verifier_id: v.id,
        verifier_username: v.username,
        role: v.role === 3 ? 'Admin / Head Verifier' : 'Verifier',
        rt_verified: rtVerified,
        pwht_verified: pwhtVerified,
        paut_verified: 0, // future when PAUT verifier_id is tracked
        mpi_verified: 0,
        total_actions: rtVerified + pwhtVerified
      };
    });

    const sorted = [...data].sort((a, b) => b.total_actions - a.total_actions);
    const summary = {
      total_verifiers: data.length,
      most_active_verifier: sorted.length > 0 ? sorted[0].verifier_username : '—',
      total_rt_verified: data.reduce((a, d) => a + d.rt_verified, 0),
      total_pwht_verified: data.reduce((a, d) => a + d.pwht_verified, 0)
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ─── M. Final Project Summary ──────────────────────────────────────────────
exports.getProjectSummaryReport = async (req, res) => {
  try {
    const { from, to } = req.query;
    
    const osWhere = {};
    const jointWhere = {};
    const rtWhere = {};
    const pwhtWhere = { pwht_required: true };
    const ndtWhere = {};

    if (from && to) {
      osWhere.date = { [Op.between]: [from, to] };
      jointWhere.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
      rtWhere.report_date = { [Op.between]: [from, to] };
      pwhtWhere.pwht_date = { [Op.between]: [from, to] };
      ndtWhere.date = { [Op.between]: [from, to] };
    } else if (from) {
      osWhere.date = { [Op.gte]: from };
      jointWhere.createdAt = { [Op.gte]: from + ' 00:00:00' };
      rtWhere.report_date = { [Op.gte]: from };
      pwhtWhere.pwht_date = { [Op.gte]: from };
      ndtWhere.date = { [Op.gte]: from };
    } else if (to) {
      osWhere.date = { [Op.lte]: to };
      jointWhere.createdAt = { [Op.lte]: to + ' 23:59:59' };
      rtWhere.report_date = { [Op.lte]: to };
      pwhtWhere.pwht_date = { [Op.lte]: to };
      ndtWhere.date = { [Op.lte]: to };
    }

    const [
      totalSheets, totalJoints, totalWelders, totalSupervisors,
      rtAttempts, pwhtRequired, pwhtCompleted, pautRecords, mpiRecords
    ] = await Promise.all([
      OfferSheet.count({ where: osWhere }),
      Joint.count({ where: jointWhere }),
      Welder.count(),
      Supervisor.count({ where: { status: 'Active' } }),
      RtAttempt.findAll({ where: rtWhere, attributes: ['attempt_id', 'status'] }),
      WeldPwht.count({ where: pwhtWhere }),
      WeldPwht.count({ where: { ...pwhtWhere, pwht_status: 'Completed' } }),
      NdtRecord.findAll({ where: { ...ndtWhere, type: 'PAUT' }, attributes: ['id', 'result'] }),
      NdtRecord.findAll({ where: { ...ndtWhere, type: 'MPI' }, attributes: ['id', 'result'] })
    ]);

    const rtTotal = rtAttempts.length;
    const rtPassed = rtAttempts.filter(a => a.status === 'Accepted').length;
    const rtFailed = rtAttempts.filter(a => a.status === 'Rejected').length;

    // Average completion time: from joint createdAt → updatedAt for accepted joints
    const acceptedJoints = await Joint.findAll({
      where: { ...jointWhere, status: { [Op.in]: ['RT Accepted', 'Accepted', 'Completed'] } },
      attributes: ['createdAt', 'updatedAt']
    });
    let avgDays = 0;
    if (acceptedJoints.length > 0) {
      const totalDays = acceptedJoints.reduce((sum, j) => {
        const diff = (new Date(j.updatedAt) - new Date(j.createdAt)) / (1000 * 60 * 60 * 24);
        return sum + diff;
      }, 0);
      avgDays = (totalDays / acceptedJoints.length).toFixed(1);
    }

    const data = [
      { metric: 'Total Offer Sheets', value: totalSheets, category: 'Project Scale' },
      { metric: 'Total Joints', value: totalJoints, category: 'Project Scale' },
      { metric: 'Completed Joints', value: acceptedJoints.length, category: 'Progress' },
      { metric: 'Pending Joints', value: totalJoints - acceptedJoints.length, category: 'Progress' },
      { metric: 'Total Welders', value: totalWelders, category: 'Resources' },
      { metric: 'Active Supervisors', value: totalSupervisors, category: 'Resources' },
      { metric: 'RT Total Evaluations', value: rtTotal, category: 'RT Status' },
      { metric: 'RT Pass Count', value: rtPassed, category: 'RT Status' },
      { metric: 'RT Fail Count', value: rtFailed, category: 'RT Status' },
      { metric: 'RT Pass Rate', value: pct(rtPassed, rtTotal) + '%', category: 'RT Status' },
      { metric: 'RT Fail Rate', value: pct(rtFailed, rtTotal) + '%', category: 'RT Status' },
      { metric: 'PWHT Required', value: pwhtRequired, category: 'PWHT Status' },
      { metric: 'PWHT Completed', value: pwhtCompleted, category: 'PWHT Status' },
      { metric: 'PAUT Total', value: pautRecords.length, category: 'NDT Status' },
      { metric: 'PAUT Passed', value: pautRecords.filter(r => r.result === 'Pass').length, category: 'NDT Status' },
      { metric: 'MPI Total', value: mpiRecords.length, category: 'NDT Status' },
      { metric: 'MPI Passed', value: mpiRecords.filter(r => r.result === 'Pass').length, category: 'NDT Status' },
      { metric: 'Avg Completion Time (days)', value: avgDays, category: 'Efficiency' }
    ];

    const summary = {
      total_offer_sheets: totalSheets,
      total_joints: totalJoints,
      completed_joints: acceptedJoints.length,
      pending_joints: totalJoints - acceptedJoints.length,
      completion_rate: pct(acceptedJoints.length, totalJoints) + '%',
      rt_pass_rate: pct(rtPassed, rtTotal) + '%',
      rt_fail_rate: pct(rtFailed, rtTotal) + '%',
      avg_completion_days: avgDays
    };

    res.json({ summary, data });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
