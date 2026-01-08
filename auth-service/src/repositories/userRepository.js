const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function create({ email, username, password }) {
  return prisma.user.create({ data: { email, username, password, role: 'USER', reputation: 0 } });
}

async function findByEmail(email) {
  return prisma.user.findUnique({ where: { email } });
}

async function findById(id) {
  return prisma.user.findUnique({ where: { id } });
}

async function listUsers() {
  return prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
}

async function updateRole(id, role) {
  return prisma.user.update({ where: { id }, data: { role } });
}

async function updateFields(id, data) {
  return prisma.user.update({ where: { id }, data });
}

module.exports = { create, findByEmail, findById, listUsers, updateRole, updateFields };
