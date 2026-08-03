/**
 * Creates standard CRUD controller functions for a given NeDB datastore.
 * @param {import('nedb-promises')} store - NeDB datastore instance
 * @param {string} name - Resource name for error messages
 * @param {Function} [buildQuery] - Optional function(req.query) => NeDB query object for getAll filtering
 */
function makeCrud(store, name, buildQuery) {
  return {
    async getAll(req, res) {
      try {
        const query = buildQuery ? buildQuery(req.query) : {};
        const docs = await store.find(query);
        res.json(docs);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
    async getOne(req, res) {
      try {
        const doc = await store.findOne({ _id: req.params.id });
        if (!doc) return res.status(404).json({ message: `${name} not found` });
        res.json(doc);
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
    async create(req, res) {
      try {
        const doc = await store.insert(req.body);
        res.status(201).json(doc);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    async update(req, res) {
      try {
        const num = await store.update({ _id: req.params.id }, req.body, { returnUpdatedDocs: true });
        if (!num) return res.status(404).json({ message: `${name} not found` });
        const doc = await store.findOne({ _id: req.params.id });
        res.json(doc);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    async patch(req, res) {
      try {
        const num = await store.update({ _id: req.params.id }, { $set: req.body }, { returnUpdatedDocs: true });
        if (!num) return res.status(404).json({ message: `${name} not found` });
        const doc = await store.findOne({ _id: req.params.id });
        res.json(doc);
      } catch (err) {
        res.status(400).json({ message: err.message });
      }
    },
    async remove(req, res) {
      try {
        const num = await store.remove({ _id: req.params.id }, {});
        if (!num) return res.status(404).json({ message: `${name} not found` });
        res.json({ message: `${name} deleted` });
      } catch (err) {
        res.status(500).json({ message: err.message });
      }
    },
  };
}

module.exports = makeCrud;
