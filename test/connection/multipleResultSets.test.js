/* eslint-env node, mocha */
const assert = require('assert').strict;
const odbc   = require('../../lib/odbc');

describe('.callProcedure() with multiple result sets', () => {
  let connection = null;
  const dbms = process.env.DBMS;
  const schema = process.env.DB_SCHEMA;

  // Skip if no database configured
  if (!process.env.CONNECTION_STRING || !schema) {
    return;
  }

  beforeEach(async () => {
    connection = await odbc.connect(process.env.CONNECTION_STRING);
  });

  afterEach(async () => {
    if (connection) {
      await connection.close();
      connection = null;
    }
  });

  describe('...with promises...', () => {
    it('...should return all result sets from a stored procedure', async function() {
      // This test requires a stored procedure that returns multiple result sets
      // Skip if not properly configured
      if (!process.env.DB_MULTI_RESULTSET_PROC) {
        this.skip();
      }

      const procedureName = process.env.DB_MULTI_RESULTSET_PROC;
      
      try {
        const result = await connection.callProcedure(null, schema, procedureName, []);
        
        // Result should be an array
        assert.ok(Array.isArray(result), 'Result should be an array');
        
        // Log result structure for debugging
        console.log(`Total result sets: ${result.length}`);
        console.log(`Result keys: ${Object.keys(result)}`);
        
        // Each element should be a result set (array with rows)
        for (let i = 0; i < result.length; i++) {
          console.log(`Result set ${i}:`, {
            isArray: Array.isArray(result[i]),
            length: result[i] ? result[i].length : 'N/A',
            hasColumns: result[i] && result[i].columns ? true : false
          });
        }
        
        // Should have metadata properties
        assert.ok(result.statement !== undefined, 'Result should have statement property');
        assert.ok(result.parameters !== undefined, 'Result should have parameters property');
        
      } catch (error) {
        console.error('Test error:', error);
        throw error;
      }
    });
  });

  describe('...with callbacks...', () => {
    it('...should return all result sets from a stored procedure', (done) => {
      // This test requires a stored procedure that returns multiple result sets
      if (!process.env.DB_MULTI_RESULTSET_PROC) {
        done();
        return;
      }

      const procedureName = process.env.DB_MULTI_RESULTSET_PROC;
      
      connection.callProcedure(null, schema, procedureName, [], (error, result) => {
        try {
          assert.deepEqual(error, null, 'Should not have an error');
          assert.ok(result, 'Should have a result');
          
          // Result should be an array
          assert.ok(Array.isArray(result), 'Result should be an array');
          
          // Log result structure for debugging
          console.log(`Total result sets: ${result.length}`);
          console.log(`Result keys: ${Object.keys(result)}`);
          
          // Each element should be a result set (array with rows)
          for (let i = 0; i < result.length; i++) {
            console.log(`Result set ${i}:`, {
              isArray: Array.isArray(result[i]),
              length: result[i] ? result[i].length : 'N/A',
              hasColumns: result[i] && result[i].columns ? true : false
            });
          }
          
          // Should have metadata properties
          assert.ok(result.statement !== undefined, 'Result should have statement property');
          assert.ok(result.parameters !== undefined, 'Result should have parameters property');
          
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });
});
