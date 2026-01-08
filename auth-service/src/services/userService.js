const userRepo = require('../repositories/userRepository');

async function createUser(data) {
  return userRepo.create(data);
}

async function findByEmail(email) {
  return userRepo.findByEmail(email);
}

async function findById(id) {
  return userRepo.findById(id);
}

async function listUsers() {
  return userRepo.listUsers();
}

async function updateRole(id, role) {
  return userRepo.updateRole(id, role);
}

async function updateReputation(id, delta) {
  const user = await userRepo.findById(id);
  if (!user) throw new Error('User not found');
  const reputation = (user.reputation || 0) + delta;
  let role = user.role;
  if (reputation >= 10 && role === 'USER') {
    role = 'EXPERT';
  }
  return userRepo.updateFields(id, { reputation, role });
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
  updateRole,
  updateReputation,
};
