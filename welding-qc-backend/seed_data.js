require('dotenv').config();
const { sequelize, Welder, OfferSheet, WeldPwht, NdtRecord } = require('./models');

async function seedData() {
  try {
    await sequelize.authenticate();
    console.log('Connected to DB for seeding test data...');

    // Seed Welders
    await Welder.bulkCreate([
      { welder_id: 'W-01', welder_name: 'Rajesh Kumar', qualification: 'ASME Sec IX (6G)', employer: 'Apex Piping Ltd', contact_number: '+91 98765 43210', notes: 'Certified for high-pressure alloy lines.' },
      { welder_id: 'W-02', welder_name: 'Amit Modi', qualification: 'AWS D1.1 Structural', employer: 'Infrastruct Corp', contact_number: '+91 87654 32109', notes: 'Sleeper build build-out specialist.' },
      { welder_id: 'W-09', welder_name: 'Vikram Singh', qualification: 'ASME Sec IX (TIG/MIG)', employer: 'Apex Piping Ltd', contact_number: '+91 76543 21098', notes: 'Maintains perfect compliance index.' }
    ], { ignoreDuplicates: true });

    // Seed Offer Sheets
    await OfferSheet.bulkCreate([
      { unique_code: 'A1C1T12J1', joint_id: 'J1', area_system: 'A1', coil_no: 'C1', tube_no: 'T12', material_spec: 'A335 P22', weld_size: '2.0"', date: '2026-06-15', welder_id: 'W-02', pwht_required: true },
      { unique_code: 'A2C92T41J2', joint_id: 'J2', area_system: 'A2', coil_no: 'C92', tube_no: 'T41', material_spec: 'A335 P11', weld_size: '2.5"', date: '2026-06-16', welder_id: 'W-09', pwht_required: false }
    ], { ignoreDuplicates: true });

    // Seed Welds
    await WeldPwht.bulkCreate([
      { joint_id: 'J1', area_system: 'A1', welder_id: 'W-02', electrode: 'E6010', wps_no: 'WPS-01', hardness: '185 HB', pwht_required: true, pwht_chart_number: 'CH-9921', pwht_date: '2026-06-16' },
      { joint_id: 'J2', area_system: 'A2', welder_id: 'W-09', electrode: 'E7018', wps_no: 'WPS-04', hardness: 'N/A', pwht_required: false, pwht_chart_number: '', pwht_date: null }
    ], { ignoreDuplicates: true });

    // Seed NDT Records
    await NdtRecord.bulkCreate([
      { joint_id: 'J1', type: 'RT', date: '2026-06-15', inspection_turn: 3, result: 'Pass', defect_type: 'None', attached_file: 'reports/J1_radiography.png' },
      { joint_id: 'J2', type: 'RT', date: '2026-06-16', inspection_turn: 1, result: 'Pending', defect_type: '', attached_file: null },
      { joint_id: 'J1', type: 'PAUT', date: '2026-06-17', inspection_turn: 1, result: 'Pass', defect_type: 'None', attached_file: 'reports/J1_paut.pdf' }
    ], { ignoreDuplicates: true });

    console.log('Sample data seeded successfully! Refresh your frontend browser.');
  } catch (err) {
    console.error('Seeding error:', err);
  } finally {
    process.exit(0);
  }
}

seedData();
