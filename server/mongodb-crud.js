// MongoDB CRUD operations for Police Management System
import { getDatabase } from './mongodb-connection.js';
import { ObjectId } from 'mongodb';

// Users Collection CRUD
export const UsersCRUD = {
  async create(userData) {
    const db = getDatabase();
    const result = await db.collection('users').insertOne({
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...userData, _id: result.insertedId };
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('users').findOne({ _id: new ObjectId(id) });
  },

  async findByUsername(username) {
    const db = getDatabase();
    return await db.collection('users').findOne({ username });
  },

  async findByEmail(email) {
    const db = getDatabase();
    return await db.collection('users').findOne({ email });
  },

  async findAll() {
    const db = getDatabase();
    return await db.collection('users').find({}).toArray();
  },

  async update(id, updateData) {
    const db = getDatabase();
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// Occurrence Book (OB) Entries CRUD
export const OBEntriesCRUD = {
  async create(obData) {
    console.log('🔍 Creating OB entry in MongoDB with data:', obData);
    const db = getDatabase();
    const docToInsert = {
      ...obData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('📝 Document to insert:', docToInsert);

    const result = await db.collection('ob_entries').insertOne(docToInsert);
    console.log('✅ Insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('ob_entries').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted OB document:', insertedDoc);

    return insertedDoc;
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('ob_entries').findOne({ _id: new ObjectId(id) });
  },

  async findAll() {
    console.log('🔍 Fetching all OB entries from MongoDB');
    const db = getDatabase();
    const obEntries = await db.collection('ob_entries').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found OB entries in MongoDB:', obEntries.length, 'records');
    return obEntries;
  },

  async findByDateRange(startDate, endDate) {
    const db = getDatabase();
    return await db.collection('ob_entries').find({
      createdAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
    }).toArray();
  },

  async update(id, updateData) {
    const db = getDatabase();
    const result = await db.collection('ob_entries').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('ob_entries').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// License Plates CRUD
export const LicensePlatesCRUD = {
  async create(plateData) {
    console.log('🔍 Creating license plate with data:', plateData);
    const db = getDatabase();
    const docToInsert = {
      ...plateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('📝 Document to insert:', docToInsert);

    const result = await db.collection('license_plates').insertOne(docToInsert);
    console.log('✅ Insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('license_plates').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted document:', insertedDoc);

    return {
      ...insertedDoc,
      id: insertedDoc._id.toString()
    };
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('license_plates').findOne({ _id: new ObjectId(id) });
  },

  async findByPlateNumber(plateNumber) {
    const db = getDatabase();
    return await db.collection('license_plates').findOne({ plateNumber });
  },

  async findAll() {
    console.log('🔍 Fetching all license plates from MongoDB');
    const db = getDatabase();
    const plates = await db.collection('license_plates').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found license plates in MongoDB:', plates.length, 'records');
    console.log('📄 Raw plates data:', plates);

    const mappedPlates = plates.map(plate => ({
      ...plate,
      id: plate._id.toString()
    }));
    console.log('🔄 Mapped plates data:', mappedPlates);

    return mappedPlates;
  },

  async findByStatus(status) {
    const db = getDatabase();
    return await db.collection('license_plates').find({ status }).toArray();
  },

  async update(id, updateData) {
    const db = getDatabase();
    const result = await db.collection('license_plates').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('license_plates').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// Evidence CRUD
export const EvidenceCRUD = {
  async create(evidenceData) {
    console.log('🔍 Creating evidence in MongoDB with data:', evidenceData);
    const db = getDatabase();

    // Generate evidence number if not provided
    const evidenceNumber = evidenceData.evidenceNumber || `EVD-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    // Initialize chain of custody log
    const initialCustodyEntry = {
      action: 'collected',
      officer: evidenceData.collectedBy || 'Unknown Officer',
      timestamp: new Date(),
      notes: 'Initial evidence collection',
      location: evidenceData.location || 'Unknown Location'
    };

    const docToInsert = {
      ...evidenceData,
      evidenceNumber,
      custodyLog: [initialCustodyEntry],
      media: evidenceData.media || [],
      tags: evidenceData.tags || [],
      priority: evidenceData.priority || 'Medium',
      condition: evidenceData.condition || 'Good',
      isSealed: evidenceData.isSealed || false,
      bagsSealed: evidenceData.bagsSealed || false,
      photographed: evidenceData.photographed || false,
      fingerprinted: evidenceData.fingerprinted || false,
      dnaCollected: evidenceData.dnaCollected || false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Evidence document to insert:', docToInsert);

    const result = await db.collection('evidence').insertOne(docToInsert);
    console.log('✅ Evidence insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('evidence').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted evidence document:', insertedDoc);

    return insertedDoc;
  },

  async findById(id) {
    console.log('🔍 Finding evidence by ID:', id);
    const db = getDatabase();
    const evidence = await db.collection('evidence').findOne({ _id: new ObjectId(id) });
    console.log('📄 Found evidence:', evidence ? 'Yes' : 'No');
    return evidence;
  },

  async findByEvidenceNumber(evidenceNumber) {
    console.log('🔍 Finding evidence by evidence number:', evidenceNumber);
    const db = getDatabase();
    return await db.collection('evidence').findOne({ evidenceNumber });
  },

  async findByCaseId(caseId) {
    console.log('🔍 Finding evidence by case ID:', caseId);
    const db = getDatabase();
    return await db.collection('evidence').find({ caseId }).toArray();
  },

  async findByOBId(obId) {
    console.log('🔍 Finding evidence by OB ID:', obId);
    const db = getDatabase();
    return await db.collection('evidence').find({ obId }).toArray();
  },

  async findAll() {
    console.log('🔍 Fetching all evidence from MongoDB');
    const db = getDatabase();
    const evidence = await db.collection('evidence').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found evidence in MongoDB:', evidence.length, 'records');
    return evidence;
  },

  async findByStatus(status) {
    console.log('🔍 Finding evidence by status:', status);
    const db = getDatabase();
    return await db.collection('evidence').find({ status }).toArray();
  },

  async findByType(type) {
    console.log('🔍 Finding evidence by type:', type);
    const db = getDatabase();
    return await db.collection('evidence').find({ type }).toArray();
  },

  async addCustodyEntry(id, custodyEntry) {
    console.log('🔍 Adding custody entry to evidence:', id, custodyEntry);
    const db = getDatabase();
    const result = await db.collection('evidence').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { custodyLog: { ...custodyEntry, timestamp: new Date() } },
        $set: { updatedAt: new Date() }
      }
    );
    console.log('📝 Custody entry add result:', { modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  },

  async update(id, updateData) {
    console.log('🔍 Updating evidence:', id, 'with data:', updateData);
    const db = getDatabase();

    // Remove fields that shouldn't be directly updated
    const { custodyLog, evidenceNumber, createdAt, ...safeUpdateData } = updateData;

    const result = await db.collection('evidence').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...safeUpdateData, updatedAt: new Date() } }
    );
    console.log('📝 Evidence update result:', { modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  },

  async addMedia(id, mediaFile) {
    console.log('🔍 Adding media to evidence:', id, mediaFile);
    const db = getDatabase();
    const result = await db.collection('evidence').updateOne(
      { _id: new ObjectId(id) },
      {
        $push: { media: { ...mediaFile, uploadedAt: new Date() } },
        $set: { updatedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    console.log('🔍 Deleting evidence:', id);
    const db = getDatabase();
    const result = await db.collection('evidence').deleteOne({ _id: new ObjectId(id) });
    console.log('📝 Evidence delete result:', { deletedCount: result.deletedCount });
    return result.deletedCount > 0;
  },

  async getEvidenceStats() {
    console.log('🔍 Getting evidence statistics');
    const db = getDatabase();
    const stats = await db.collection('evidence').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byStatus: {
            $push: {
              status: '$status',
              count: 1
            }
          },
          byType: {
            $push: {
              type: '$type',
              count: 1
            }
          }
        }
      }
    ]).toArray();

    return stats[0] || { total: 0, byStatus: [], byType: [] };
  }
};

// Police Vehicles CRUD
export const PoliceVehiclesCRUD = {
  async create(vehicleData) {
    const db = getDatabase();
    const result = await db.collection('police_vehicles').insertOne({
      ...vehicleData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return { ...vehicleData, _id: result.insertedId };
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('police_vehicles').findOne({ _id: new ObjectId(id) });
  },

  async findByVehicleId(vehicleId) {
    const db = getDatabase();
    return await db.collection('police_vehicles').findOne({ vehicleId });
  },

  async findAll() {
    const db = getDatabase();
    return await db.collection('police_vehicles').find({}).toArray();
  },

  async findByStatus(status) {
    const db = getDatabase();
    return await db.collection('police_vehicles').find({ status }).toArray();
  },

  async update(id, updateData) {
    const db = getDatabase();
    const result = await db.collection('police_vehicles').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('police_vehicles').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// Officers Collection CRUD
export const OfficersCRUD = {
  async create(officerData) {
    console.log('🔍 Creating officer in MongoDB with data:', officerData);
    const db = getDatabase();

    // Generate badge number if not provided
    const badgeNumber = officerData.badgeNumber || `OFC-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const docToInsert = {
      ...officerData,
      badgeNumber,
      status: officerData.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('📝 Officer document to insert:', docToInsert);

    const result = await db.collection('officers').insertOne(docToInsert);
    console.log('✅ Officer insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('officers').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted officer document:', insertedDoc);

    return insertedDoc;
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('officers').findOne({ _id: new ObjectId(id) });
  },

  async findByBadgeNumber(badgeNumber) {
    const db = getDatabase();
    return await db.collection('officers').findOne({ badgeNumber });
  },

  async findByDepartment(department) {
    const db = getDatabase();
    return await db.collection('officers').find({ department }).toArray();
  },

  async findAll() {
    console.log('🔍 Fetching all officers from MongoDB');
    const db = getDatabase();
    const officers = await db.collection('officers').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found officers in MongoDB:', officers.length, 'records');
    return officers;
  },

  async update(id, updateData) {
    console.log('🔍 Updating officer:', id, 'with data:', updateData);
    const db = getDatabase();
    const result = await db.collection('officers').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    console.log('📝 Officer update result:', { modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('officers').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// Inmates (Custodial Records) CRUD
export const InmatesCRUD = {
  async create(inmateData) {
    console.log('🔍 Creating inmate in MongoDB with data:', inmateData);
    const db = getDatabase();

    // Generate prisoner number if not provided
    const prisonerNumber = inmateData.prisonerNumber || `INM-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Handle empty string values by converting to null for enum fields
    const processedData = {
      ...inmateData,
      prisonerNumber,
      gender: inmateData.gender === '' ? null : inmateData.gender,
      dateOfBirth: inmateData.dateOfBirth === '' ? null : inmateData.dateOfBirth,
      age: inmateData.age === '' || isNaN(Number(inmateData.age)) ? null : Number(inmateData.age),
      nationality: inmateData.nationality === '' ? null : inmateData.nationality,
      releaseDate: inmateData.releaseDate === '' ? null : inmateData.releaseDate,
      charges: Array.isArray(inmateData.charges) ? inmateData.charges : [],
      status: inmateData.status || 'Active'
    };

    const docToInsert = {
      ...processedData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Inmate document to insert:', docToInsert);

    const result = await db.collection('inmates').insertOne(docToInsert);
    console.log('✅ Inmate insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('inmates').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted inmate document:', insertedDoc);

    return insertedDoc;
  },

  async findAll() {
    console.log('🔍 Fetching all inmates from MongoDB');
    const db = getDatabase();
    const inmates = await db.collection('inmates').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found inmates in MongoDB:', inmates.length, 'records');
    return inmates;
  },

  async findById(id) {
    console.log('🔍 Finding inmate by ID:', id);
    const db = getDatabase();
    const inmate = await db.collection('inmates').findOne({ _id: new ObjectId(id) });
    console.log('📄 Found inmate:', inmate ? 'Found' : 'Not found');
    return inmate;
  },

  async findByPrisonerNumber(prisonerNumber) {
    console.log('🔍 Finding inmate by prisoner number:', prisonerNumber);
    const db = getDatabase();
    return await db.collection('inmates').findOne({ prisonerNumber });
  },

  async findByStatus(status) {
    console.log('🔍 Finding inmates by status:', status);
    const db = getDatabase();
    return await db.collection('inmates').find({ status }).toArray();
  },

  async update(id, updateData) {
    console.log('🔍 Updating inmate:', id, 'with data:', updateData);
    const db = getDatabase();

    // Handle empty string values by converting to null for enum fields
    const processedData = {
      ...updateData,
      gender: updateData.gender === '' ? null : updateData.gender,
      dateOfBirth: updateData.dateOfBirth === '' ? null : updateData.dateOfBirth,
      age: updateData.age === '' || isNaN(Number(updateData.age)) ? null : Number(updateData.age),
      nationality: updateData.nationality === '' ? null : updateData.nationality,
      releaseDate: updateData.releaseDate === '' ? null : updateData.releaseDate
    };

    const result = await db.collection('inmates').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...processedData, updatedAt: new Date() } }
    );

    console.log('📝 Inmate update result:', { modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  },

  async delete(id) {
    console.log('🗑️ Deleting inmate with ID:', id);
    const db = getDatabase();
    const result = await db.collection('inmates').deleteOne({ _id: new ObjectId(id) });
    console.log('📝 Inmate delete result:', { deletedCount: result.deletedCount });
    return result.deletedCount > 0;
  }
};

// Reports CRUD
export const ReportsCRUD = {
  async create(reportData) {
    console.log('🔍 Creating report with data:', reportData);
    const db = getDatabase();
    const docToInsert = {
      ...reportData,
      reportNumber: reportData.reportNumber || `RPT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('reports').insertOne(docToInsert);
    console.log('✅ Report created successfully with ID:', result.insertedId);

    const createdReport = await db.collection('reports').findOne({ _id: result.insertedId });
    return { ...createdReport, id: createdReport._id.toString() };
  },

  async findById(id) {
    const db = getDatabase();
    return await db.collection('reports').findOne({ _id: new ObjectId(id) });
  },

  async findAll() {
    console.log('🔍 Fetching all reports from MongoDB');
    const db = getDatabase();
    const reports = await db.collection('reports').find({}).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found reports in MongoDB:', reports.length, 'records');
    return reports;
  },

  async update(id, updateData) {
    const db = getDatabase();
    const result = await db.collection('reports').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async delete(id) {
    const db = getDatabase();
    const result = await db.collection('reports').deleteOne({ _id: new ObjectId(id) });
    return result.deletedCount > 0;
  }
};

// Geofiles CRUD
export const GeofilesCRUD = {
  async create(geofileData) {
    console.log('🔍 Creating geofile in MongoDB with data:', geofileData);
    const db = getDatabase();

    const docToInsert = {
      ...geofileData,
      downloadCount: geofileData.downloadCount || 0,
      lastAccessedAt: geofileData.lastAccessedAt || new Date(),
      isPublic: geofileData.isPublic || false,
      accessLevel: geofileData.accessLevel || 'internal',
      tags: geofileData.tags || [],
      metadata: typeof geofileData.metadata === 'string' ? JSON.parse(geofileData.metadata || '{}') : geofileData.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('📝 Geofile document to insert:', docToInsert);

    const result = await db.collection('geofiles').insertOne(docToInsert);
    console.log('✅ Geofile insert result:', { insertedId: result.insertedId, acknowledged: result.acknowledged });

    // Return the actual document from database
    const insertedDoc = await db.collection('geofiles').findOne({ _id: result.insertedId });
    console.log('📄 Retrieved inserted geofile document:', insertedDoc);

    return {
      ...insertedDoc,
      id: insertedDoc._id.toString()
    };
  },

  async findById(id) {
    console.log('🔍 Finding geofile by ID:', id);
    const db = getDatabase();
    const geofile = await db.collection('geofiles').findOne({ _id: new ObjectId(id) });
    console.log('📄 Found geofile:', geofile ? 'Yes' : 'No');
    return geofile;
  },

  async findAll(filters = {}) {
    console.log('🔍 Fetching all geofiles from MongoDB with filters:', filters);
    const db = getDatabase();

    let query = {};

    // Apply search filter
    if (filters.search) {
      const searchRegex = { $regex: filters.search, $options: 'i' };
      query.$or = [
        { filename: searchRegex },
        { description: searchRegex },
        { address: searchRegex },
        { locationName: searchRegex }
      ];
    }

    // Apply file type filter
    if (filters.fileType) {
      query.fileType = { $regex: `^${filters.fileType}$`, $options: 'i' };
    }

    // Apply access level filter
    if (filters.accessLevel) {
      query.accessLevel = filters.accessLevel;
    }

    // Apply tags filter
    if (filters.tags && filters.tags.length > 0) {
      query.tags = { $in: filters.tags };
    }

    // Apply date range filter
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo);
    }

    const geofiles = await db.collection('geofiles').find(query).sort({ createdAt: -1 }).toArray();
    console.log('📊 Found geofiles in MongoDB:', geofiles.length, 'records');

    // Transform the data to match frontend expectations
    const transformedGeofiles = geofiles.map(geofile => ({
      ...geofile,
      id: geofile._id.toString(),
      tags: Array.isArray(geofile.tags) ? geofile.tags : JSON.parse(geofile.tags || '[]'),
      metadata: typeof geofile.metadata === 'object' ? geofile.metadata : JSON.parse(geofile.metadata || '{}')
    }));

    return transformedGeofiles;
  },

  async findByType(fileType) {
    console.log('🔍 Finding geofiles by type:', fileType);
    const db = getDatabase();
    return await db.collection('geofiles').find({
      fileType: { $regex: `^${fileType}$`, $options: 'i' }
    }).toArray();
  },

  async findByAccessLevel(accessLevel) {
    console.log('🔍 Finding geofiles by access level:', accessLevel);
    const db = getDatabase();
    return await db.collection('geofiles').find({ accessLevel }).toArray();
  },

  async findByTags(tags) {
    console.log('🔍 Finding geofiles by tags:', tags);
    const db = getDatabase();
    return await db.collection('geofiles').find({
      tags: { $in: Array.isArray(tags) ? tags : [tags] }
    }).toArray();
  },

  async update(id, updateData) {
    console.log('🔍 Updating geofile:', id, 'with data:', updateData);
    const db = getDatabase();

    // Process tags and metadata
    const processedData = { ...updateData };
    if (processedData.tags && typeof processedData.tags === 'string') {
      processedData.tags = JSON.parse(processedData.tags);
    }
    if (processedData.metadata && typeof processedData.metadata === 'string') {
      processedData.metadata = JSON.parse(processedData.metadata);
    }

    const result = await db.collection('geofiles').updateOne(
      { _id: new ObjectId(id) },
      { $set: { ...processedData, updatedAt: new Date() } }
    );
    console.log('📝 Geofile update result:', { modifiedCount: result.modifiedCount });
    return result.modifiedCount > 0;
  },

  async delete(id) {
    console.log('🗑️ Deleting geofile:', id);
    const db = getDatabase();
    const result = await db.collection('geofiles').deleteOne({ _id: new ObjectId(id) });
    console.log('📝 Geofile delete result:', { deletedCount: result.deletedCount });
    return result.deletedCount > 0;
  },

  async updateAccess(id) {
    console.log('🔍 Updating geofile access timestamp:', id);
    const db = getDatabase();
    const result = await db.collection('geofiles').updateOne(
      { _id: new ObjectId(id) },
      { $set: { lastAccessedAt: new Date() } }
    );
    return result.modifiedCount > 0;
  },

  async incrementDownload(id) {
    console.log('🔍 Incrementing geofile download count:', id);
    const db = getDatabase();
    const result = await db.collection('geofiles').updateOne(
      { _id: new ObjectId(id) },
      {
        $inc: { downloadCount: 1 },
        $set: { lastAccessedAt: new Date() }
      }
    );
    return result.modifiedCount > 0;
  },

  async getStats() {
    console.log('🔍 Getting geofiles statistics');
    const db = getDatabase();
    const stats = await db.collection('geofiles').aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          byFileType: {
            $push: {
              fileType: '$fileType',
              count: 1
            }
          },
          byAccessLevel: {
            $push: {
              accessLevel: '$accessLevel',
              count: 1
            }
          },
          totalDownloads: { $sum: '$downloadCount' }
        }
      }
    ]).toArray();

    return stats[0] || { total: 0, byFileType: [], byAccessLevel: [], totalDownloads: 0 };
  }
};