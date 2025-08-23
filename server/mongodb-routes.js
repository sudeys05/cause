// MongoDB-based API routes for Police Management System
import {
  OBEntriesCRUD,
  LicensePlatesCRUD,
  EvidenceCRUD,
  PoliceVehiclesCRUD,
  GeofilesCRUD,
  OfficersCRUD,
  ReportsCRUD,
  UsersCRUD
} from './mongodb-crud.js';
import bcrypt from 'bcryptjs';

// Assume getDatabase and ObjectId are available from a MongoDB connection module
// For demonstration purposes, we'll mock them here. In a real app, you'd import them.
const getDatabase = () => {
  // Replace with your actual database connection logic
  console.log('Mock getDatabase called');
  return {
    collection: (name) => ({
      find: () => ({ toArray: async () => [] }),
      findOne: async () => null,
      insertOne: async () => ({ insertedId: 'mockId' }),
      updateOne: async () => ({ matchedCount: 0 }),
      deleteOne: async () => ({ deletedCount: 0 }),
    }),
  };
};
const ObjectId = (id) => id; // Mock ObjectId

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

export function registerMongoDBRoutes(app, upload, uploadCustodial) {
  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await UsersCRUD.findByUsername(username);

      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials or account disabled' });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user._id.toString();
      req.session.user = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };

      res.json({
        user: {
          id: user._id.toString(),
          username: user.username,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          badgeNumber: user.badgeNumber
        }
      });
    } catch (error) {
      res.status(500).json({ message: 'Login failed', error: error.message });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', (req, res) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ user: req.session.user });
  });

  app.post('/api/auth/register', async (req, res) => {
    try {
      console.log('🔐 Registration attempt with data:', req.body);

      const { username, email, password, confirmPassword, ...otherData } = req.body;

      // Validate required fields
      if (!username || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username, email, and password are required'
        });
      }

      // Validate password match
      if (password !== confirmPassword) {
        return res.status(400).json({
          success: false,
          message: 'Passwords do not match'
        });
      }

      // Check if user already exists
      const existingUser = await UsersCRUD.findByUsername(username);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user data
      const userData = {
        username,
        email,
        password: hashedPassword,
        firstName: otherData.firstName || '',
        lastName: otherData.lastName || '',
        badgeNumber: otherData.badgeNumber || '',
        department: otherData.department || '',
        position: otherData.position || '',
        phone: otherData.phone || '',
        role: otherData.role || 'user',
        isActive: true
      };

      const newUser = await UsersCRUD.create(userData);
      console.log('✅ User registered successfully:', newUser.username);

      // Return user without password
      const userResponse = {
        id: newUser._id.toString(),
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        badgeNumber: newUser.badgeNumber,
        department: newUser.department,
        position: newUser.position,
        phone: newUser.phone,
        role: newUser.role,
        isActive: newUser.isActive,
        createdAt: newUser.createdAt,
        updatedAt: newUser.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        user: userResponse
      });

    } catch (error) {
      console.error('❌ Registration error:', error);

      // Handle MongoDB duplicate key errors
      if (error.code === 11000) {
        const field = Object.keys(error.keyPattern || {})[0];
        return res.status(409).json({
          success: false,
          message: `${field || 'Field'} already exists`
        });
      }

      res.status(500).json({
        success: false,
        message: 'Registration failed due to server error'
      });
    }
  });

  // Users API Routes
  app.get('/api/users', async (req, res) => {
    try {
      console.log('🔍 Fetching all users from MongoDB...');
      const users = await UsersCRUD.findAll();
      console.log('📊 Found users in MongoDB:', users.length, 'records');

      // Remove passwords from response and format properly
      const safeUsers = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return {
          ...userWithoutPassword,
          id: user._id.toString()
        };
      });

      res.json({ users: safeUsers });
    } catch (error) {
      console.error('❌ Failed to fetch users:', error);
      res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
  });

  app.get('/api/users/:id', async (req, res) => {
    try {
      const user = await UsersCRUD.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
  });

  app.post('/api/users', async (req, res) => {
    try {
      const userData = { ...req.body };
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      const user = await UsersCRUD.create(userData);
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
  });

  app.put('/api/users/:id', async (req, res) => {
    try {
      const updateData = { ...req.body };
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      const updated = await UsersCRUD.update(req.params.id, updateData);
      if (!updated) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
  });

  app.delete('/api/users/:id', async (req, res) => {
    try {
      const deleted = await UsersCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
  });

  // OB Entries API Routes
  app.get('/api/ob-entries', async (req, res) => {
    try {
      console.log('🔍 Fetching all OB entries from MongoDB...');
      const obEntries = await OBEntriesCRUD.findAll();
      console.log('📊 Found OB entries in MongoDB:', obEntries.length, 'records');

      // Transform MongoDB data to match frontend expectations
      const transformedEntries = obEntries.map(entry => ({
        ...entry,
        id: entry._id.toString(),
        obNumber: entry.obNumber || `OB-${new Date().getFullYear()}-${entry._id.toString().slice(-3).toUpperCase()}`,
        officer: entry.officer || 'Officer Smith'
      }));

      res.json({ obEntries: transformedEntries });
    } catch (error) {
      console.error('❌ Failed to fetch OB entries:', error);
      res.status(500).json({ message: 'Failed to fetch OB entries', error: error.message });
    }
  });

  app.post('/api/ob-entries', async (req, res) => {
    try {
      console.log('🔍 Creating new OB entry with data:', req.body);

      // Generate OB number if not provided
      const obNumber = req.body.obNumber || `OB-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      const obData = {
        ...req.body,
        obNumber,
        dateTime: req.body.dateTime || new Date().toISOString(),
        date: req.body.date || new Date().toISOString().split('T')[0],
        time: req.body.time || new Date().toTimeString().split(' ')[0],
        status: req.body.status || 'Pending',
        officer: req.body.officer || 'Officer Smith',
        recordingOfficerId: 1 // Default admin user
      };

      const createdEntry = await OBEntriesCRUD.create(obData);
      console.log('✅ OB entry created successfully:', createdEntry);

      const responseEntry = {
        ...createdEntry,
        id: createdEntry._id.toString()
      };

      res.status(201).json({ obEntry: responseEntry });
    } catch (error) {
      console.error('❌ Failed to create OB entry:', error);
      res.status(500).json({ message: 'Failed to create OB entry', error: error.message });
    }
  });

  app.put('/api/ob-entries/:id', async (req, res) => {
    try {
      console.log('🔍 Updating OB entry:', req.params.id, 'with data:', req.body);
      const updated = await OBEntriesCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'OB entry not found' });
      }

      // Fetch the updated entry
      const updatedEntry = await OBEntriesCRUD.findById(req.params.id);
      const responseEntry = {
        ...updatedEntry,
        id: updatedEntry._id.toString()
      };

      res.json({ obEntry: responseEntry });
    } catch (error) {
      console.error('❌ Failed to update OB entry:', error);
      res.status(500).json({ message: 'Failed to update OB entry', error: error.message });
    }
  });

  app.delete('/api/ob-entries/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting OB entry:', req.params.id);
      const deleted = await OBEntriesCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'OB entry not found' });
      }
      console.log('✅ OB entry deleted successfully');
      res.json({ message: 'OB entry deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete OB entry:', error);
      res.status(500).json({ message: 'Failed to delete OB entry', error: error.message });
    }
  });

  // License Plates API Routes
  app.get('/api/license-plates', async (req, res) => {
    try {
      console.log('🔍 Fetching all license plates from MongoDB...');
      const plates = await LicensePlatesCRUD.findAll();
      console.log('📊 Found license plates in MongoDB:', plates.length, 'records');

      res.json({ licensePlates: plates });
    } catch (error) {
      console.error('❌ Failed to fetch license plates:', error);
      res.status(500).json({ message: 'Failed to fetch license plates', error: error.message });
    }
  });

  // Add mongo prefix route for compatibility
  app.get('/api/mongo/license-plates', async (req, res) => {
    try {
      console.log('🔍 Fetching all license plates from MongoDB via /mongo endpoint...');
      const plates = await LicensePlatesCRUD.findAll();
      console.log('📊 Found license plates in MongoDB:', plates.length, 'records');

      res.json({ licensePlates: plates });
    } catch (error) {
      console.error('❌ Failed to fetch license plates:', error);
      res.status(500).json({ message: 'Failed to fetch license plates', error: error.message });
    }
  });

  app.post('/api/mongo/license-plates', async (req, res) => {
    try {
      console.log('🔍 Creating new license plate via /mongo endpoint with data:', req.body);

      const plateData = {
        ...req.body,
        addedById: 1, // Default admin user
        status: req.body.status || 'Active'
      };

      const createdPlate = await LicensePlatesCRUD.create(plateData);
      console.log('✅ License plate created successfully:', createdPlate);

      res.status(201).json({ licensePlate: createdPlate });
    } catch (error) {
      console.error('❌ Failed to create license plate:', error);
      res.status(500).json({ message: 'Failed to create license plate', error: error.message });
    }
  });

  app.get('/api/license-plates/search/:plateNumber', async (req, res) => {
    try {
      console.log('🔍 Searching for license plate:', req.params.plateNumber);
      const plate = await LicensePlatesCRUD.findByPlateNumber(req.params.plateNumber);

      if (!plate) {
        return res.status(404).json({ message: "License plate not found" });
      }

      const responsePlate = {
        ...plate,
        id: plate._id.toString()
      };

      res.json({ licensePlate: responsePlate });
    } catch (error) {
      console.error('❌ Failed to search license plate:', error);
      res.status(500).json({ message: 'Failed to search license plate', error: error.message });
    }
  });

  app.post('/api/license-plates', async (req, res) => {
    try {
      console.log('🔍 Creating new license plate with data:', req.body);

      const plateData = {
        ...req.body,
        addedById: 1, // Default admin user
        status: req.body.status || 'Active'
      };

      const createdPlate = await LicensePlatesCRUD.create(plateData);
      console.log('✅ License plate created successfully:', createdPlate);

      res.status(201).json({ licensePlate: createdPlate });
    } catch (error) {
      console.error('❌ Failed to create license plate:', error);
      res.status(500).json({ message: 'Failed to create license plate', error: error.message });
    }
  });

  app.put('/api/license-plates/:id', async (req, res) => {
    try {
      console.log('🔍 Updating license plate:', req.params.id, 'with data:', req.body);
      const updated = await LicensePlatesCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'License plate not found' });
      }

      // Fetch the updated plate
      const updatedPlate = await LicensePlatesCRUD.findById(req.params.id);
      const responsePlate = {
        ...updatedPlate,
        id: updatedPlate._id.toString()
      };

      res.json({ licensePlate: responsePlate });
    } catch (error) {
      console.error('❌ Failed to update license plate:', error);
      res.status(500).json({ message: 'Failed to update license plate', error: error.message });
    }
  });

  app.delete('/api/license-plates/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting license plate:', req.params.id);
      const deleted = await LicensePlatesCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'License plate not found' });
      }
      console.log('✅ License plate deleted successfully');
      res.json({ message: 'License plate deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete license plate:', error);
      res.status(500).json({ message: 'Failed to delete license plate', error: error.message });
    }
  });

  // Evidence routes are handled in evidence-routes.js

  // Police Vehicles API Routes
  app.get('/api/police-vehicles', async (req, res) => {
    try {
      const vehicles = await PoliceVehiclesCRUD.findAll();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch police vehicles', error: error.message });
    }
  });

  app.post('/api/police-vehicles', async (req, res) => {
    try {
      const vehicle = await PoliceVehiclesCRUD.create(req.body);
      res.status(201).json(vehicle);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create police vehicle record', error: error.message });
    }
  });

  // Officers API Routes
  app.get('/api/officers', async (req, res) => {
    try {
      console.log('🔍 Fetching all officers from MongoDB...');
      const officers = await OfficersCRUD.findAll();
      console.log('📊 Found officers in MongoDB:', officers.length, 'records');

      const mappedOfficers = officers.map(officer => ({
        ...officer,
        id: officer._id.toString()
      }));

      res.json({ officers: mappedOfficers });
    } catch (error) {
      console.error('❌ Failed to fetch officers:', error);
      res.status(500).json({ message: 'Failed to fetch officers', error: error.message });
    }
  });

  app.post('/api/officers', async (req, res) => {
    try {
      console.log('🔍 Creating new officer with data:', req.body);
      const officer = await OfficersCRUD.create(req.body);
      const responseOfficer = {
        ...officer,
        id: officer._id.toString()
      };
      res.status(201).json({ officer: responseOfficer });
    } catch (error) {
      console.error('❌ Failed to create officer:', error);
      res.status(500).json({ message: 'Failed to create officer', error: error.message });
    }
  });

  app.put('/api/officers/:id', async (req, res) => {
    try {
      console.log('🔍 Updating officer:', req.params.id, 'with data:', req.body);
      const updated = await OfficersCRUD.update(req.params.id, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Officer not found' });
      }

      // Fetch the updated officer
      const updatedOfficer = await OfficersCRUD.findById(req.params.id);
      const responseOfficer = {
        ...updatedOfficer,
        id: updatedOfficer._id.toString()
      };

      res.json({ officer: responseOfficer });
    } catch (error) {
      console.error('❌ Failed to update officer:', error);
      res.status(500).json({ message: 'Failed to update officer', error: error.message });
    }
  });

  app.delete('/api/officers/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting officer:', req.params.id);
      const deleted = await OfficersCRUD.delete(req.params.id);
      if (!deleted) {
        return res.status(404).json({ message: 'Officer not found' });
      }
      console.log('✅ Officer deleted successfully');
      res.json({ message: 'Officer deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete officer:', error);
      res.status(500).json({ message: 'Failed to delete officer', error: error.message });
    }
  });

  // Geofiles API Routes
  app.get('/api/geofiles', async (req, res) => {
    try {
      console.log('🔍 Fetching geofiles with query params:', req.query);

      // Extract filter parameters
      const filters = {
        search: req.query.search,
        fileType: req.query.fileType,
        accessLevel: req.query.accessLevel,
        tags: req.query.tags ? req.query.tags.split(',') : [],
        dateFrom: req.query.dateFrom,
        dateTo: req.query.dateTo
      };

      const geofiles = await GeofilesCRUD.findAll(filters);
      console.log('📊 Found geofiles:', geofiles.length, 'records');

      res.json({ geofiles });
    } catch (error) {
      console.error('❌ Failed to fetch geofiles:', error);
      res.status(500).json({ message: 'Failed to fetch geofiles', error: error.message });
    }
  });

  app.get('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🔍 Fetching geofile by ID:', req.params.id);
      const geofile = await GeofilesCRUD.findById(req.params.id);

      if (!geofile) {
        return res.status(404).json({ message: 'Geofile not found' });
      }

      // Update access timestamp
      await GeofilesCRUD.updateAccess(req.params.id);

      const responseGeofile = {
        ...geofile,
        id: geofile._id.toString()
      };

      res.json({ geofile: responseGeofile });
    } catch (error) {
      console.error('❌ Failed to fetch geofile:', error);
      res.status(500).json({ message: 'Failed to fetch geofile', error: error.message });
    }
  });

  app.post('/api/geofiles', async (req, res) => {
    try {
      console.log('🔍 Creating new geofile with data:', req.body);

      const geofileData = {
        ...req.body,
        uploadedBy: req.session?.userId || 1, // Use session user or default to admin
        lastAccessedAt: new Date(),
        downloadCount: 0
      };

      // Validate required fields
      if (!geofileData.filename || !geofileData.fileType) {
        return res.status(400).json({ message: 'Filename and file type are required' });
      }

      // Validate file type
      const allowedTypes = ['shp', 'kml', 'geojson', 'csv', 'gpx', 'kmz', 'gml'];
      if (!allowedTypes.includes(geofileData.fileType.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid file type. Allowed types: ' + allowedTypes.join(', ') });
      }

      const createdGeofile = await GeofilesCRUD.create(geofileData);
      console.log('✅ Geofile created successfully:', createdGeofile.id);

      res.status(201).json({ geofile: createdGeofile });
    } catch (error) {
      console.error('❌ Failed to create geofile:', error);
      res.status(500).json({ message: 'Failed to create geofile record', error: error.message });
    }
  });

  app.put('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🔍 Updating geofile:', req.params.id, 'with data:', req.body);
      const updated = await GeofilesCRUD.update(req.params.id, req.body);

      if (!updated) {
        return res.status(404).json({ message: 'Geofile not found' });
      }

      // Fetch the updated geofile
      const updatedGeofile = await GeofilesCRUD.findById(req.params.id);
      const responseGeofile = {
        ...updatedGeofile,
        id: updatedGeofile._id.toString()
      };

      console.log('✅ Geofile updated successfully');
      res.json({ geofile: responseGeofile });
    } catch (error) {
      console.error('❌ Failed to update geofile:', error);
      res.status(500).json({ message: 'Failed to update geofile', error: error.message });
    }
  });

  app.delete('/api/geofiles/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting geofile:', req.params.id);
      const deleted = await GeofilesCRUD.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: 'Geofile not found' });
      }

      console.log('✅ Geofile deleted successfully');
      res.json({ message: 'Geofile deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete geofile:', error);
      res.status(500).json({ message: 'Failed to delete geofile', error: error.message });
    }
  });

  app.post('/api/geofiles/upload', upload.single('file'), async (req, res) => {
    try {
      console.log('🔍 Uploading geofile with form data:', req.body);
      console.log('🔍 Uploaded file:', req.file);
      console.log('🔍 Form fields received:', Object.keys(req.body));
      console.log('🔍 Filename field:', req.body.filename);

      // Validate required fields
      if (!req.body.filename || req.body.filename.trim() === '') {
        console.log('❌ Validation failed: filename is missing or empty');
        return res.status(400).json({ message: 'Name/Label is required' });
      }

      // Set default file type if not provided
      const fileType = req.body.fileType || 'GEOJSON';
      const fileName = req.body.filename;

      // For now, simulate file upload without actual file storage
      const geofileData = {
        filename: fileName + '.' + fileType.toLowerCase(),
        filepath: `/geofiles/${fileName}.${fileType.toLowerCase()}`,
        fileType: fileType.toUpperCase(),
        fileSize: Math.floor(Math.random() * 100000) + 10000, // Random size for demo
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [],
        coordinateSystem: req.body.coordinateSystem || 'WGS84',
        accessLevel: req.body.accessLevel || 'internal',
        isPublic: req.body.isPublic === 'true',
        caseId: req.body.caseId || null,
        obId: req.body.obId || null,
        evidenceId: req.body.evidenceId || null,
        address: `${fileName} Location`,
        locationName: fileName,
        coordinates: JSON.stringify([-122.4194, 37.7749]), // Default SF coordinates
        boundingBox: JSON.stringify([[-122.45, 37.75], [-122.38, 37.80]]),
        metadata: JSON.stringify({
          creator: 'Police Department',
          coordinateSystem: req.body.coordinateSystem || 'WGS84',
          uploadMethod: 'web_interface'
        }),
        uploadedBy: req.session?.userId || 1,
        downloadCount: 0
      };

      const createdGeofile = await GeofilesCRUD.create(geofileData);
      console.log('✅ Geofile uploaded successfully:', createdGeofile.id);

      res.status(201).json({
        geofile: createdGeofile,
        message: 'Geofile uploaded successfully'
      });
    } catch (error) {
      console.error('❌ Failed to upload geofile:', error);
      res.status(500).json({ message: 'Failed to upload geofile', error: error.message });
    }
  });

  app.post('/api/geofiles/:id/download', async (req, res) => {
    try {
      console.log('📥 Recording download for geofile:', req.params.id);
      await GeofilesCRUD.incrementDownload(req.params.id);
      res.json({ message: 'Download recorded successfully' });
    } catch (error) {
      console.error('❌ Failed to record download:', error);
      res.status(500).json({ message: 'Failed to record download', error: error.message });
    }
  });

  app.get('/api/geofiles/stats/summary', async (req, res) => {
    try {
      console.log('📊 Fetching geofiles statistics');
      const stats = await GeofilesCRUD.getStats();
      res.json({ stats });
    } catch (error) {
      console.error('❌ Failed to fetch geofiles stats:', error);
      res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
  });

  // Custodial Records (Inmates) API Routes
  app.get('/api/custodial-records', async (req, res) => {
    try {
      console.log('🔍 Fetching all custodial records from MongoDB...');
      const { InmatesCRUD } = await import('./mongodb-crud.js');
      const inmates = await InmatesCRUD.findAll();
      console.log('📊 Found custodial records in MongoDB:', inmates.length, 'records');

      // Transform MongoDB data to match frontend expectations
      const transformedInmates = inmates.map(inmate => ({
        ...inmate,
        id: inmate._id.toString()
      }));

      res.json({ inmates: transformedInmates });
    } catch (error) {
      console.error('❌ Failed to fetch custodial records:', error);
      res.status(500).json({ message: 'Failed to fetch custodial records', error: error.message });
    }
  });

  app.get('/api/custodial-records/:id', async (req, res) => {
    try {
      console.log('🔍 Fetching custodial record by ID:', req.params.id);
      const { InmatesCRUD } = await import('./mongodb-crud.js');
      const inmate = await InmatesCRUD.findById(req.params.id);

      if (!inmate) {
        return res.status(404).json({ message: 'Custodial record not found' });
      }

      const responseInmate = {
        ...inmate,
        id: inmate._id.toString()
      };

      res.json({ inmate: responseInmate });
    } catch (error) {
      console.error('❌ Failed to fetch custodial record:', error);
      res.status(500).json({ message: 'Failed to fetch custodial record', error: error.message });
    }
  });

  app.post('/api/custodial-records', uploadCustodial.single('idPhoto'), async (req, res) => {
    try {
      console.log('🔍 Creating new custodial record with data:', req.body);
      console.log('🔍 Uploaded file:', req.file);
      const { InmatesCRUD } = await import('./mongodb-crud.js');

      // Handle file upload
      let idPhotoData = null;
      if (req.file) {
        idPhotoData = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          uploadedAt: new Date()
        };
        console.log('📸 ID Photo uploaded:', idPhotoData);
      }

      // Parse charges if it's a string
      let charges = [];
      if (req.body.charges) {
        try {
          charges = JSON.parse(req.body.charges);
        } catch (e) {
          charges = Array.isArray(req.body.charges) ? req.body.charges : [req.body.charges];
        }
      }

      const inmateData = {
        ...req.body,
        charges,
        idPhoto: idPhotoData,
        admissionDate: req.body.admissionDate || new Date().toISOString().split('T')[0]
      };

      const createdInmate = await InmatesCRUD.create(inmateData);
      console.log('✅ Custodial record created successfully:', createdInmate);

      const responseInmate = {
        ...createdInmate,
        id: createdInmate._id.toString()
      };

      res.status(201).json({ inmate: responseInmate });
    } catch (error) {
      console.error('❌ Failed to create custodial record:', error);
      res.status(500).json({ message: 'Failed to create custodial record', error: error.message });
    }
  });

  app.put('/api/custodial-records/:id', uploadCustodial.single('idPhoto'), async (req, res) => {
    try {
      console.log('🔍 Updating custodial record:', req.params.id, 'with data:', req.body);
      console.log('🔍 Uploaded file for update:', req.file);
      const { InmatesCRUD } = await import('./mongodb-crud.js');

      // Handle file upload
      let updateData = { ...req.body };
      if (req.file) {
        updateData.idPhoto = {
          filename: req.file.filename,
          originalName: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          path: req.file.path,
          uploadedAt: new Date()
        };
        console.log('📸 ID Photo updated:', updateData.idPhoto);
      }

      // Parse charges if it's a string
      if (req.body.charges) {
        try {
          updateData.charges = JSON.parse(req.body.charges);
        } catch (e) {
          updateData.charges = Array.isArray(req.body.charges) ? req.body.charges : [req.body.charges];
        }
      }

      const updated = await InmatesCRUD.update(req.params.id, updateData);

      if (!updated) {
        return res.status(404).json({ message: 'Custodial record not found' });
      }

      // Fetch the updated record
      const updatedInmate = await InmatesCRUD.findById(req.params.id);
      const responseInmate = {
        ...updatedInmate,
        id: updatedInmate._id.toString()
      };

      res.json({ inmate: responseInmate });
    } catch (error) {
      console.error('❌ Failed to update custodial record:', error);
      res.status(500).json({ message: 'Failed to update custodial record', error: error.message });
    }
  });

  app.delete('/api/custodial-records/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting custodial record:', req.params.id);
      const { InmatesCRUD } = await import('./mongodb-crud.js');
      const deleted = await InmatesCRUD.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: 'Custodial record not found' });
      }

      console.log('✅ Custodial record deleted successfully');
      res.json({ message: 'Custodial record deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete custodial record:', error);
      res.status(500).json({ message: 'Failed to delete custodial record', error: error.message });
    }
  });

  // Reports API Routes
  app.get('/api/reports', async (req, res) => {
    try {
      console.log('🔍 Fetching all reports from MongoDB...');
      const reports = await ReportsCRUD.findAll();
      console.log('📊 Found reports in MongoDB:', reports.length, 'records');

      // Transform MongoDB data to match frontend expectations
      const transformedReports = reports.map(report => ({
        ...report,
        id: report._id.toString(),
        reportNumber: report.reportNumber || `RPT-${new Date().getFullYear()}-${report._id.toString().slice(-3).toUpperCase()}`
      }));

      res.json({ reports: transformedReports });
    } catch (error) {
      console.error('❌ Failed to fetch reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
    }
  });

  app.get('/api/reports/:id', async (req, res) => {
    try {
      console.log('🔍 Fetching report by ID:', req.params.id);
      const report = await ReportsCRUD.findById(req.params.id);

      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }

      const responseReport = {
        ...report,
        id: report._id.toString()
      };

      res.json({ report: responseReport });
    } catch (error) {
      console.error('❌ Failed to fetch report:', error);
      res.status(500).json({ message: 'Failed to fetch report', error: error.message });
    }
  });

  app.post('/api/reports', async (req, res) => {
    try {
      console.log('🔍 Creating new report with data:', req.body);

      const reportData = {
        ...req.body,
        requestedBy: req.session?.userId || 1, // Default admin user
        status: req.body.status || 'Pending'
      };

      const createdReport = await ReportsCRUD.create(reportData);
      console.log('✅ Report created successfully:', createdReport);

      res.status(201).json({ report: createdReport });
    } catch (error) {
      console.error('❌ Failed to create report:', error);
      res.status(500).json({ message: 'Failed to create report', error: error.message });
    }
  });

  app.put('/api/reports/:id', async (req, res) => {
    try {
      console.log('🔍 Updating report:', req.params.id, 'with data:', req.body);
      const updated = await ReportsCRUD.update(req.params.id, req.body);

      if (!updated) {
        return res.status(404).json({ message: 'Report not found' });
      }

      // Fetch the updated report
      const updatedReport = await ReportsCRUD.findById(req.params.id);
      const responseReport = {
        ...updatedReport,
        id: updatedReport._id.toString()
      };

      res.json({ report: responseReport });
    } catch (error) {
      console.error('❌ Failed to update report:', error);
      res.status(500).json({ message: 'Failed to update report', error: error.message });
    }
  });

  app.delete('/api/reports/:id', async (req, res) => {
    try {
      console.log('🗑️ Deleting report:', req.params.id);
      const deleted = await ReportsCRUD.delete(req.params.id);

      if (!deleted) {
        return res.status(404).json({ message: 'Report not found' });
      }

      console.log('✅ Report deleted successfully');
      res.json({ message: 'Report deleted successfully' });
    } catch (error) {
      console.error('❌ Failed to delete report:', error);
      res.status(500).json({ message: 'Failed to delete report', error: error.message });
    }
  });

  // Evidence routes handled in evidence-routes.js
}