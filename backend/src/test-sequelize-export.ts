// test-sequelize-details.ts
import * as Sequelize from 'sequelize';

console.log('=== Sequelize Version Info ===');
console.log('Sequelize version:', Sequelize.Sequelize?.version || 'Unknown');

console.log('\n=== All Exports ===');
const allExports = Object.keys(Sequelize).sort();
console.log(allExports);

console.log('\n=== Type-related Exports ===');
const typeExports = allExports.filter(exp => 
  exp.includes('Attributes') || 
  exp.includes('Optional') || 
  exp.includes('Infer') ||
  exp.includes('Creation')
);
console.log(typeExports);

console.log('\n=== Checking Specific Exports ===');
console.log('InferAttributes:', 'InferAttributes' in Sequelize);
console.log('InferCreationAttributes:', 'InferCreationAttributes' in Sequelize);
console.log('CreationOptional:', 'CreationOptional' in Sequelize);
console.log('Model:', 'Model' in Sequelize);
console.log('DataTypes:', 'DataTypes' in Sequelize);