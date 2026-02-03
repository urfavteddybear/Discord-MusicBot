const fs = require('fs');
const path = require('path');

class LocalStorage {
  constructor() {
    this.filePath = path.join(__dirname, '..', 'data', 'prefixes.json');
    this.data = this.loadData();
  }

  loadData() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.dirname(this.filePath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      // Load existing data or create empty object
      if (fs.existsSync(this.filePath)) {
        const fileData = fs.readFileSync(this.filePath, 'utf8');
        return JSON.parse(fileData);
      } else {
        return {};
      }
    } catch (error) {
      console.error('Error loading local storage:', error);
      return {};
    }
  }

  saveData() {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      console.error('Error saving local storage:', error);
    }
  }

  async findOne(query) {
    if (query.guildId) {
      const guildData = this.data[query.guildId];
      return guildData ? { guildId: query.guildId, prefix: guildData.prefix } : null;
    }
    return null;
  }

  async create(data) {
    this.data[data.guildId] = {
      prefix: data.prefix,
      createdAt: new Date().toISOString()
    };
    this.saveData();
    return data;
  }

  async updateOne(query, update) {
    if (query.guildId && this.data[query.guildId]) {
      this.data[query.guildId].prefix = update.prefix;
      this.data[query.guildId].updatedAt = new Date().toISOString();
      this.saveData();
      return true;
    }
    return false;
  }

  async save(guildId, prefix) {
    this.data[guildId] = {
      prefix: prefix,
      updatedAt: new Date().toISOString()
    };
    this.saveData();
    return true;
  }
}

module.exports = new LocalStorage();