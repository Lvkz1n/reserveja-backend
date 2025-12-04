import { PrismaClient, RoleCompany, RoleGlobal } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function upsertUser(email: string, password: string, name: string, roleGlobal: RoleGlobal = 'user') {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, roleGlobal },
    create: { email, name, passwordHash, roleGlobal },
  });
}

async function main() {
  // Super admin global
  const superAdmin = await upsertUser('admin@reserveja.local', 'admin123', 'Super Admin', 'super_admin');

  const company = await prisma.company.upsert({
    where: { id: 'company-demo' },
    update: {},
    create: {
      id: 'company-demo',
      name: 'Empresa Demo',
      email: 'contato@empresa.demo',
      phone: '(11) 99999-0000',
      plan: 'pro',
      status: 'active',
      scheduleMode: 'per_professional',
    },
  });

  const adminUser = await upsertUser('admin@empresa.demo', 'senha123', 'Admin Empresa');
  const atendenteUser = await upsertUser('atendente@empresa.demo', 'senha123', 'Atendente Demo');
  const profUser = await upsertUser('profissional@empresa.demo', 'senha123', 'Profissional Demo');

  const link = async (userId: string, roleCompany: RoleCompany) => {
    return prisma.companyUser.upsert({
      where: { userId_companyId: { userId, companyId: company.id } },
      update: { roleCompany },
      create: { userId, companyId: company.id, roleCompany },
    });
  };

  await Promise.all([
    link(adminUser.id, 'admin'),
    link(atendenteUser.id, 'atendente'),
    link(profUser.id, 'profissional'),
  ]);

  // seed service/client for tests
  await prisma.service.upsert({
    where: { id: 'seed-service' },
    update: {},
    create: {
      id: 'seed-service',
      companyId: company.id,
      name: 'Corte de Cabelo',
      durationMinutes: 60,
      price: 100,
      active: true,
    },
  });

  console.log('Seed concluído:');
  console.log('Empresa:', company.name);
  console.log('Admin:', 'admin@empresa.demo / senha123');
  console.log('Atendente:', 'atendente@empresa.demo / senha123');
  console.log('Profissional:', 'profissional@empresa.demo / senha123');
  console.log('Super admin global:', `${superAdmin.email} / admin123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
