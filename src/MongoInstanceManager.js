const MongoDBClient = require("./MongoDBClient");


class MongoInstancesManager {
  constructor(uri, dbName, poolSize) {
    this.instances = [];
    this.uri = uri;
    this.dbName = dbName;
    this.poolSize = poolSize;
  }

  async addInstance(instanceName) {
    const instance = new MongoDBClient(this.uri, this.poolSize, this.dbName);
    await instance.connect();
    this.instances.push({ name: instanceName, instance: instance });
    return this.getInstance(instanceName)
  }

  async removeInstance(instanceName) {
    const chosenInstance = this.instances.find((instance) => instance.name === instanceName);
    chosenInstance.instance.close();
  }

  async getInstance(instanceName) {
    return this.instances.find((instance) => instance.name === instanceName).instance;
  }

  async getAllIntances() {
    return this.instances
  }

  async closeAll() {
    await Promise.all(this.instances.map((i) => i.close()));
  }
}

module.exports = MongoInstancesManager;
