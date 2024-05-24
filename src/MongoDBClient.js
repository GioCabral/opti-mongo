const { MongoClient } = require('mongodb');

class MongoDBClient {
  constructor(uri, poolSize = 50, dbName) {
    this.uri = uri;
    this.poolSize = poolSize;
    this.client = null;
    this.dbName = dbName;
    this.operations = 0;
  }

  async connect(options = {
    serverSelectionTimeoutMS: 5000,
    waitQueueTimeoutMS: 5000
  }) {
    if (!this.client) {
      this.client = new MongoClient(this.uri, options);
    }
    return this.client.connect();
  }

  async executeOperation(operation, ...args) {
    try {
      this.operations++;
      if (this.operations == 10) {
        this.operations = 0
        await this.monitorAndAdjustPoolSize()
      }
      return await operation(...args);
    } catch (error) {
      console.error('Operation failed:', error);
      await this.connect();
      return operation(...args);
    }
  }

  async find(collection, query, options) {
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.find(query, options).toArray();
    };
    return this.executeOperation(operation);
  }

  async findOne(collection, query, options) {
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.findOne(query, options);
    };
    return this.executeOperation(operation);
  }

  async insertOne(collection, document) {
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.insertOne(document);
    };
    return this.executeOperation(operation);
  }

  async insertMany(collection, documents) {
    if (documents.length > 0) {
      const operation = async () => {
        const db = this.client.db(this.dbName);
        const col = db.collection(collection);
        return await col.insertMany(documents);
      };
      return this.executeOperation(operation);
    }
  }

  async updateOne(collection, filter = {}, update = {}, options = {}) {
    filter = this.cleanFilters(filter);
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.updateOne(filter, update, options);
    };
    return filter ? this.executeOperation(operation) : { message: 'No filters to update.' };
  }

  async updateMany(collection, filter = {}, update = {}, options = {}) {
    filter = this.cleanFilters(filter);
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.updateMany(filter, update, options);
    };
    return filter ? this.executeOperation(operation) : { message: 'No filters to update.' };
  }

  async deleteOne(collection, filter = {}, options = {}) {
    filter = this.cleanFilters(filter);
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.deleteOne(filter, options);
    };
    return filter ? this.executeOperation(operation) : { message: 'No filters to delete.' };
  }

  async deleteMany(collection, filter = {}, options = {}) {
    filter = this.cleanFilters(filter);
    const operation = async () => {
      const db = this.client.db(this.dbName);
      const col = db.collection(collection);
      return await col.deleteMany(filter, options);
    };
    return filter ? this.executeOperation(operation) : { message: 'No filters to delete.' };
  }

  cleanFilters(filter) {
    Object.keys(filter).forEach(key => {
      if (filter[key] === undefined) {
        delete filter[key];
      }
    });
    return Object.keys(filter).length ? filter : null;
  }

  async monitorAndAdjustPoolSize() {
    const metrics = await this.client.db(this.dbName).command({ serverStatus: 1 });

    const connectionsCurrent = metrics.connections.current;
    const connectionsAvailable = metrics.connections.available;
    const totalConnections = connectionsCurrent + connectionsAvailable;

    if (connectionsCurrent > this.poolSize * 0.8 && totalConnections < 500) {
      await this.adjustPoolSize(this.poolSize + 10);
    } else if (connectionsCurrent < this.poolSize * 0.2 && this.poolSize > 50) {
      await this.adjustPoolSize(this.poolSize - 10);
    }
  }

  async adjustPoolSize(newPoolSize) {
    try {
      if (newPoolSize !== this.poolSize) {
        this.poolSize = newPoolSize;
        await this.client.close();
        await this.connect();
      }
    } catch (error) {
      console.error('Error adjusting pool size:', error);
    }
  }

  async close() {
    if (this.client) {
      await this.client.close();
    }
  }
}

module.exports = MongoDBClient;
