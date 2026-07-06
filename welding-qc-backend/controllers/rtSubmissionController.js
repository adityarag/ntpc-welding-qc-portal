const { RtSubmissionBatch, RtAttempt, Joint, OfferSheet, User } = require('../models');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

exports.submitRtBatch = async (req, res) => {
  try {
    const { attempt_ids, offer_sheet_id } = req.body;
    if (!attempt_ids || !Array.isArray(attempt_ids) || attempt_ids.length === 0 || !offer_sheet_id) {
      return res.status(400).json({ message: 'Missing required fields or empty selection.' });
    }

    // Generate batch ID: SUB-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const submission_batch_id = `SUB-${dateStr}-${randSuffix}`;

    // Verify attempts exist and are not already submitted
    const attempts = await RtAttempt.findAll({
      where: {
        attempt_id: attempt_ids,
        is_submitted: false
      }
    });

    if (attempts.length === 0) {
      return res.status(400).json({ message: 'No valid or unsubmitted attempts selected.' });
    }

    // Create the batch record
    const batch = await RtSubmissionBatch.create({
      submission_batch_id,
      supervisor_id: req.userId,
      offer_sheet_id,
      weld_count: attempts.length,
      status: 'PENDING'
    });

    // Update attempts to associate with the batch
    await RtAttempt.update({
      submission_batch_id,
      is_submitted: true
    }, {
      where: {
        attempt_id: attempts.map(a => a.attempt_id)
      }
    });

    req.app.get('io').emit('DATA_UPDATED', { module: 'rt-submissions', action: 'create' });
    res.status(201).json(batch);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const whereClause = {};
    if (req.userRole === 1) {
      whereClause.supervisor_id = req.userId;
    }

    const batches = await RtSubmissionBatch.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'username'] },
        { 
          model: RtAttempt, 
          include: [{ model: Joint, attributes: ['joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id'] }] 
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Dynamically calculate status on read based on attempts verification
    const formatted = batches.map(batch => {
      const attempts = batch.RtAttempts || [];
      const total = attempts.length;
      const verifiedCount = attempts.filter(a => a.status !== 'Pending').length;

      let calculatedStatus = 'PENDING';
      if (verifiedCount === total && total > 0) {
        calculatedStatus = 'COMPLETED';
      } else if (verifiedCount > 0) {
        calculatedStatus = 'IN PROGRESS';
      }

      return {
        submission_batch_id: batch.submission_batch_id,
        supervisor_id: batch.supervisor_id,
        supervisor_name: batch.supervisor?.username,
        offer_sheet_id: batch.offer_sheet_id,
        weld_count: batch.weld_count,
        submitted_at: batch.submitted_at,
        status: calculatedStatus,
        createdAt: batch.createdAt
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.downloadPdf = async (req, res) => {
  try {
    const { batch_id } = req.params;
    const batch = await RtSubmissionBatch.findByPk(batch_id, {
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'username'] },
        { 
          model: RtAttempt, 
          include: [{ model: Joint, attributes: ['joint_id', 'area_system', 'coil_no', 'tube_no', 'welder_id'] }] 
        }
      ]
    });

    if (!batch) {
      return res.status(404).json({ message: 'Submission batch not found.' });
    }

    // Set dynamic status
    const attempts = batch.RtAttempts || [];
    const total = attempts.length;
    const verifiedCount = attempts.filter(a => a.status !== 'Pending').length;
    let calculatedStatus = 'PENDING';
    if (verifiedCount === total && total > 0) {
      calculatedStatus = 'COMPLETED';
    } else if (verifiedCount > 0) {
      calculatedStatus = 'IN PROGRESS';
    }

    // Initialize PDF Document (A4: 595 x 842 points)
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${batch_id}.pdf`);
    doc.pipe(res);

    // 1. Branding Header
    const logoPath = path.join(__dirname, '../../src/assets/NTPC_logo.png');
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 40, 30, { width: 55 });
    } else {
      doc.fontSize(16).fillColor('#1e3b8b').text('NTPC', 40, 35, { bold: true });
    }

    doc.fontSize(14).fillColor('#1e3b8b').text('NTPC LIMITED', 110, 35, { bold: true });
    doc.fontSize(10).fillColor('#64748b').text('WELDING QUALITY ASSURANCE PORTAL', 110, 52);
    doc.fontSize(14).fillColor('#0f172a').text('RT SUBMISSION REPORT', 400, 35, { bold: true, align: 'right' });
    
    // Separator line
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 75).lineTo(555, 75).stroke();

    // 2. Submission Details Block
    doc.fontSize(9).fillColor('#475569');
    doc.font('Helvetica-Bold').text('SUBMISSION DETAILS', 40, 95);
    
    doc.strokeColor('#e2e8f0').lineWidth(0.5).rect(40, 110, 515, 65).stroke();

    const formattedDate = new Date(batch.submitted_at).toLocaleDateString();
    const formattedTime = new Date(batch.submitted_at).toLocaleTimeString();

    doc.font('Helvetica').fontSize(8.5);
    // Column 1
    doc.text(`Supervisor ID/Name:`, 50, 120);
    doc.font('Helvetica-Bold').text(`${batch.supervisor?.id} / ${batch.supervisor?.username || 'N/A'}`, 150, 120);
    doc.font('Helvetica').text(`Offer Sheet ID:`, 50, 138);
    doc.font('Helvetica-Bold').text(`${batch.offer_sheet_id}`, 150, 138);
    doc.font('Helvetica').text(`Batch ID:`, 50, 156);
    doc.font('Helvetica-Bold').text(`${batch.submission_batch_id}`, 150, 156);

    // Column 2
    doc.font('Helvetica').text(`Submission Date:`, 310, 120);
    doc.font('Helvetica-Bold').text(`${formattedDate}`, 410, 120);
    doc.font('Helvetica').text(`Submission Time:`, 310, 138);
    doc.font('Helvetica-Bold').text(`${formattedTime}`, 410, 138);
    doc.font('Helvetica').text(`Total Welds:`, 310, 156);
    doc.font('Helvetica-Bold').text(`${batch.weld_count}`, 410, 156);

    // 3. Welds Table Header
    let y = 195;
    const startX = 40;
    const colWidths = [85, 45, 75, 45, 45, 55, 60, 50, 55]; // Total A4 width: 515
    const headers = ['UNIQUE CODE', 'JOINT ID', 'AREA SYSTEM', 'COIL NO', 'TUBE NO', 'WELDER ID', 'OFFER DATE', 'RT ATTEMPT', 'STATUS'];

    doc.fillColor('#1e3b8b').rect(startX, y, 515, 20).fill();
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);

    let currentX = startX;
    for (let i = 0; i < headers.length; i++) {
      doc.text(headers[i], currentX + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
      currentX += colWidths[i];
    }
    y += 20;

    // 4. Table Rows
    let rowIndex = 0;
    doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
    
    for (const att of attempts) {
      // Check page overflow
      if (y > 750) {
        doc.addPage();
        y = 50;
        
        // Draw Header on new page
        doc.fillColor('#1e3b8b').rect(startX, y, 515, 20).fill();
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7.5);
        currentX = startX;
        for (let i = 0; i < headers.length; i++) {
          doc.text(headers[i], currentX + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
          currentX += colWidths[i];
        }
        y += 20;
        doc.font('Helvetica').fontSize(7.5).fillColor('#334155');
      }

      // Alternate row backgrounds
      if (rowIndex % 2 === 1) {
        doc.fillColor('#f8fafc').rect(startX, y, 515, 20).fill();
      }
      doc.fillColor('#334155');

      const rowValues = [
        att.unique_code,
        att.Joint?.joint_id || 'N/A',
        att.Joint?.area_system || 'N/A',
        att.Joint?.coil_no || 'N/A',
        att.Joint?.tube_no || 'N/A',
        att.Joint?.welder_id || 'N/A',
        att.report_date || 'N/A',
        `ATTEMPT ${att.attempt_number}`,
        att.status || 'PENDING'
      ];

      currentX = startX;
      for (let i = 0; i < rowValues.length; i++) {
        doc.text(rowValues[i].toUpperCase(), currentX + 4, y + 6, { width: colWidths[i] - 8, align: 'left' });
        currentX += colWidths[i];
      }

      // Draw bottom row line
      doc.strokeColor('#e2e8f0').lineWidth(0.5).moveTo(startX, y + 20).lineTo(startX + 515, y + 20).stroke();

      y += 20;
      rowIndex++;
    }

    // 5. Signature Footer
    if (y > 680) {
      doc.addPage();
      y = 50;
    }
    
    doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, 750).lineTo(555, 750).stroke();
    doc.fontSize(7).fillColor('#94a3b8').text(`Generated automatically by Welding QC Portal on ${new Date().toLocaleString()} | Batch Status: ${calculatedStatus}`, 40, 760);

    doc.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
