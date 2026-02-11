#!/usr/bin/env node

/**
 * Script to test and debug multiple result set support
 * 
 * Usage:
 *   node test-multi-resultsets.js <connection_string> <schema> <procedure_name> [param1] [param2] ...
 * 
 * Example:
 *   node test-multi-resultsets.js "DSN=MYDSN" "MYSCHEMA" "MY_PROC"
 */

const odbc = require('./lib/odbc');

async function testMultipleResultSets() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.error('Usage: node test-multi-resultsets.js <connection_string> <schema> <procedure_name> [param1] [param2] ...');
    console.error('');
    console.error('Example:');
    console.error('  node test-multi-resultsets.js "DSN=MYDSN" "MYSCHEMA" "MY_PROC"');
    console.error('  node test-multi-resultsets.js "DSN=MYDSN" "MYSCHEMA" "MY_PROC" "param1_value" "param2_value"');
    process.exit(1);
  }

  const [connectionString, schema, procedureName, ...paramValues] = args;
  
  console.log('='.repeat(80));
  console.log('Testing Multiple Result Sets Support');
  console.log('='.repeat(80));
  console.log('Connection String:', connectionString);
  console.log('Schema:', schema);
  console.log('Procedure:', procedureName);
  console.log('Parameters:', paramValues.length > 0 ? paramValues : 'none');
  console.log('');

  let connection;
  try {
    console.log('Connecting to database...');
    connection = await odbc.connect(connectionString);
    console.log('✓ Connected successfully');
    console.log('');

    console.log('Calling stored procedure...');
    const result = await connection.callProcedure(null, schema, procedureName, paramValues.length > 0 ? paramValues : []);
    console.log('✓ Procedure called successfully');
    console.log('');

    console.log('-'.repeat(80));
    console.log('RESULTS ANALYSIS');
    console.log('-'.repeat(80));
    
    // Check if result is an array
    if (!Array.isArray(result)) {
      console.error('✗ ERROR: Result is not an array!');
      console.error('  Type:', typeof result);
      console.error('  Value:', result);
      return;
    }
    console.log('✓ Result is an array');
    
    // Check array length
    console.log('');
    console.log('Result array length:', result.length);
    if (result.length === 0) {
      console.log('⚠ WARNING: No result sets returned!');
      console.log('  Possible reasons:');
      console.log('  1. Stored procedure does not return any SELECT results');
      console.log('  2. Stored procedure not configured with DYNAMIC RESULT SETS N');
      console.log('  3. All result sets were empty (0 columns)');
    } else {
      console.log('✓ Result sets found:', result.length);
    }
    
    // Check metadata
    console.log('');
    console.log('Metadata Properties:');
    console.log('  statement:', result.statement ? 'present' : 'missing');
    console.log('  parameters:', result.parameters ? 'present' : 'missing');
    console.log('  return:', result.return !== undefined ? 'present' : 'missing');
    
    // Analyze each result set
    console.log('');
    console.log('Result Sets Details:');
    for (let i = 0; i < result.length; i++) {
      console.log('');
      console.log(`  Result Set #${i + 1}:`);
      const resultSet = result[i];
      
      if (!Array.isArray(resultSet)) {
        console.log('    ✗ ERROR: Not an array!');
        console.log('    Type:', typeof resultSet);
        continue;
      }
      
      console.log('    Rows:', resultSet.length);
      console.log('    Columns:', resultSet.columns ? resultSet.columns.length : 'N/A');
      console.log('    Statement:', resultSet.statement ? 'present' : 'missing');
      console.log('    Count property:', resultSet.count !== undefined ? resultSet.count : 'missing');
      
      if (resultSet.columns && resultSet.columns.length > 0) {
        console.log('    Column names:', resultSet.columns.map(c => c.name).join(', '));
      }
      
      if (resultSet.length > 0) {
        const firstRowJson = JSON.stringify(resultSet[0], null, 2);
        const indentedJson = firstRowJson.split('\n').map(line => `    ${line}`).join('\n');
        console.log('    First row:');
        console.log(indentedJson);
      } else {
        console.log('    (empty result set)');
      }
    }
    
    console.log('');
    console.log('='.repeat(80));
    console.log('Test completed successfully!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('');
    console.error('✗ ERROR:', error.message);
    console.error('');
    if (error.odbcErrors) {
      console.error('ODBC Errors:');
      error.odbcErrors.forEach((err, idx) => {
        console.error(`  ${idx + 1}. [${err.state}] ${err.message}`);
      });
    }
    console.error('');
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.close();
      console.log('Connection closed.');
    }
  }
}

testMultipleResultSets();
