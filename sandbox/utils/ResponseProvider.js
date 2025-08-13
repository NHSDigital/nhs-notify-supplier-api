const fs = require('fs/promises');
class ResponseProvider {
  static fileMap = {
    PENDING: 'data/examples/getLetters/responses/getLetters_pending.json',
    ACCEPTED: 'data/examples/getLetters/responses/getLetters_accepted.json',
  };

  static async loadByStatus(status) {
    const filename = this.fileMap[status];
    if (!filename) {
      throw { message: `Unsupported status: ${status}`, status: 400 };
    }

    const content = await fs.readFile(filename, 'utf8');
    return JSON.parse(content);
  }
}
module.exports = ResponseProvider;
