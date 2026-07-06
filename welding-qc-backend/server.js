require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

const authRoutes = require('./routes/authRoutes');
const welderRoutes = require('./routes/welderRoutes');
const offerSheetRoutes = require('./routes/offerSheetRoutes');
const jointRoutes = require('./routes/jointRoutes');
const rtRoutes = require('./routes/rtRoutes');
const weldRoutes = require('./routes/weldRoutes');
const ndtRoutes = require('./routes/ndtRoutes');
const alertRoutes = require('./routes/alertRoutes');
const searchRoutes = require('./routes/searchRoutes');
const userRoutes = require('./routes/userRoutes');
const supervisorRoutes = require('./routes/supervisorRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const areaSystemRoutes = require('./routes/areaSystemRoutes');
const reportRoutes = require('./routes/reportRoutes');

const uploadRoutes = require('./routes/uploadRoutes');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const http = require('http');
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // allow all for dev
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

// Make io accessible in our routers
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`[Socket.IO] Client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/welders', welderRoutes);
app.use('/api/offer-sheets', offerSheetRoutes);
app.use('/api/joints', jointRoutes);
app.use('/api/rt', rtRoutes);
app.use('/api/welds', weldRoutes);
app.use('/api/ndt', ndtRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/users', userRoutes);
app.use('/api/supervisors', supervisorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/area-systems', areaSystemRoutes);
app.use('/api/reports', reportRoutes);

// Database Sync and Server Start
const PORT = process.env.PORT || 5000;

sequelize.sync({ alter: false })
  .then(async () => {
    console.log('Database schema validated.');
    
    // Auto-backfill RT, PWHT, PAUT, MPI, and Area Systems for existing joints
    try {
      const { Joint, RtAttempt, WeldPwht, NdtRecord, AreaSystem } = require('./models');
      const allJoints = await Joint.findAll();
      let backfilledCount = 0;
      let pwhtAdded = 0;
      let pwhtRemoved = 0;
      let pautAdded = 0;
      let mpiAdded = 0;
      let areaSystemsAdded = 0;

      // Seeding Area Systems first
      const uniqueAreaSystems = [...new Set(allJoints.map(j => j.area_system ? j.area_system.trim() : '').filter(Boolean))];
      for (const name of uniqueAreaSystems) {
        const [record, created] = await AreaSystem.findOrCreate({ where: { name } });
        if (created) {
          areaSystemsAdded++;
        }
      }

      for (const joint of allJoints) {
        // RT backfill
        const attempts = await RtAttempt.findAll({ where: { unique_code: joint.unique_code } });
        if (attempts.length === 0) {
          await RtAttempt.create({ unique_code: joint.unique_code, attempt_number: 1 });
          backfilledCount++;
        }

        // PWHT backfill
        const hasPwht = await WeldPwht.findByPk(joint.unique_code);
        if (joint.pwht_required) {
          if (!hasPwht) {
            await WeldPwht.create({ joint_id: joint.unique_code, pwht_required: true, pwht_status: 'Pending' });
            pwhtAdded++;
          }
        } else {
          if (hasPwht) {
            await hasPwht.destroy();
            pwhtRemoved++;
          }
        }

        // PAUT backfill
        const hasPaut = await NdtRecord.findOne({ where: { joint_id: joint.unique_code, type: 'PAUT' } });
        if (!hasPaut) {
          await NdtRecord.create({ joint_id: joint.unique_code, type: 'PAUT', inspection_turn: 1, result: 'Pending' });
          pautAdded++;
        }

        // MPI backfill
        const hasMpi = await NdtRecord.findOne({ where: { joint_id: joint.unique_code, type: 'MPI' } });
        if (!hasMpi) {
          await NdtRecord.create({ joint_id: joint.unique_code, type: 'MPI', inspection_turn: 1, result: 'Pending' });
          mpiAdded++;
        }
      }

      if (areaSystemsAdded > 0) {
        console.log(`[Backfill AreaSystems] Seeded ${areaSystemsAdded} unique Area Systems from existing joints.`);
      }
      if (backfilledCount > 0) {
        console.log(`[Backfill RT] Created initial RT Attempt 1 for ${backfilledCount} existing joints.`);
      }
      if (pwhtAdded > 0 || pwhtRemoved > 0) {
        console.log(`[Backfill PWHT] Created ${pwhtAdded} and deleted ${pwhtRemoved} PWHT records.`);
      }
      if (pautAdded > 0) {
        console.log(`[Backfill PAUT] Created initial PAUT Attempt 1 for ${pautAdded} existing joints.`);
      }
      if (mpiAdded > 0) {
        console.log(`[Backfill MPI] Created initial MPI Attempt 1 for ${mpiAdded} existing joints.`);
      }
    } catch (e) {
      console.error('[Backfill Error]', e);
    }

    server.listen(PORT, () => {
      console.log(`Server & WebSocket Engine running on port ${PORT}.`);
    });
  })
  .catch(err => {
    console.error('Database sync encountered a lock. Please restart gracefully:', err.message);
  });
