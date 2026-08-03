const bcrypt = require('bcryptjs');
const db = require('../db');
const makeCrud = require('./_crud');

const base = makeCrud(db.users, 'User');

async function getAll(req, res) {
  try {
    const users = await db.users.find({});
    res.json(users.map(({ password, ...u }) => u));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function getOne(req, res) {
  try {
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...u } = user;
    res.json(u);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

async function create(req, res) {
  try {
    const data = { ...req.body };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    const user = await db.users.insert(data);
    const { password, ...u } = user;
    res.status(201).json(u);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function update(req, res) {
  try {
    const data = { ...req.body };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    await db.users.update({ _id: req.params.id }, data, {});
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...u } = user;
    res.json(u);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

async function patch(req, res) {
  try {
    const data = { ...req.body };
    if (data.password) data.password = await bcrypt.hash(data.password, 10);
    await db.users.update({ _id: req.params.id }, { $set: data }, {});
    const user = await db.users.findOne({ _id: req.params.id });
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { password, ...u } = user;
    res.json(u);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

module.exports = { getAll, getOne, create, update, patch, remove: base.remove };
