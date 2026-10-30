// test-backend.js -- Automated verification of Apollo GraphQL Server, Resolvers, and MySQL
const { start } = require('./server');
const pool = require('./db');

async function runTests() {
  console.log('=== STARTING APOLLO GRAPHQL BACKEND TESTS ===\n');

  // Reset books table to initial 3 seed items
  await pool.query('DELETE FROM books WHERE id > 3');
  await pool.query('ALTER TABLE books AUTO_INCREMENT = 4');
  console.log('Reset database to clean 3 sample books.');

  // Start the Apollo Server instance
  const { server, url } = await start();
  console.log(`Apollo Server started at: ${url}`);

  const gqlEndpoint = url;

  // Helper function to query the GraphQL API via HTTP POST
  async function gql(query, variables = {}) {
    const response = await fetch(gqlEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables }),
    });
    const result = await response.json();
    return result;
  }

  // TEST 1: Authors query with nested books (Part 5 of PDF & Requirement 8)
  console.log('\n--- TEST 1: Query authors with nested books ---');
  const query1 = `
    query {
      authors {
        id
        name
        country
        books {
          title
          year
        }
      }
    }
  `;
  const res1 = await gql(query1);
  console.log('Response:', JSON.stringify(res1, null, 2));

  if (!res1.data || !res1.data.authors || res1.data.authors.length !== 2) {
    throw new Error('Test 1 Failed: Expected 2 authors');
  }
  const asha = res1.data.authors.find(a => a.name === 'Asha Patel');
  const ravi = res1.data.authors.find(a => a.name === 'Ravi Kumar');
  if (!asha || asha.books.length !== 2) throw new Error('Test 1 Failed: Asha Patel should have 2 books');
  if (!ravi || ravi.books.length !== 1) throw new Error('Test 1 Failed: Ravi Kumar should have 1 book');
  console.log('PASSED: Authors with nested books fetched correctly.');

  // TEST 2: Single author query and Book.author relationship resolver
  console.log('\n--- TEST 2: Query single author and Book.author relationship ---');
  const query2 = `
    query {
      author(id: "1") {
        id
        name
        country
      }
      books {
        id
        title
        author {
          id
          name
        }
      }
    }
  `;
  const res2 = await gql(query2);
  console.log('Response:', JSON.stringify(res2, null, 2));
  if (res2.data.author.name !== 'Asha Patel') throw new Error('Test 2 Failed: Author 1 is not Asha Patel');
  if (!res2.data.books[0].author.name) throw new Error('Test 2 Failed: Book.author resolver did not return author');
  console.log('PASSED: Single author query and Book.author resolver verified.');

  // TEST 3: addBook Mutation (Requirement 8)
  console.log('\n--- TEST 3: Execute addBook Mutation ---');
  const mutation = `
    mutation {
      addBook(
        title: "GraphQL for Beginners"
        year: 2025
        authorId: "2"
      ) {
        id
        title
        year
      }
    }
  `;
  const res3 = await gql(mutation);
  console.log('Response:', JSON.stringify(res3, null, 2));
  if (!res3.data || !res3.data.addBook || res3.data.addBook.title !== 'GraphQL for Beginners') {
    throw new Error('Test 3 Failed: Mutation failed to return newly created book');
  }
  const newBookId = res3.data.addBook.id;
  console.log(`PASSED: Book added with ID ${newBookId}`);

  // TEST 4: Query authors again to confirm new book appears under Ravi Kumar
  console.log('\n--- TEST 4: Verify Ravi Kumar now has 2 books via GraphQL ---');
  const res4 = await gql(query1);
  const raviUpdated = res4.data.authors.find(a => a.name === 'Ravi Kumar');
  console.log('Ravi Kumar books now:', JSON.stringify(raviUpdated.books, null, 2));
  if (raviUpdated.books.length !== 2) {
    throw new Error('Test 4 Failed: Ravi Kumar should now have 2 books');
  }
  const foundNewBook = raviUpdated.books.find(b => b.title === 'GraphQL for Beginners' && b.year === 2025);
  if (!foundNewBook) throw new Error('Test 4 Failed: GraphQL for Beginners not found under Ravi Kumar');
  console.log('PASSED: New book correctly reflected under Ravi Kumar in GraphQL response.');

  // TEST 5: Direct MySQL Verification
  console.log('\n--- TEST 5: Verify directly in MySQL ---');
  const [rows] = await pool.query('SELECT title, year FROM books WHERE author_id = 2');
  console.log('MySQL SELECT title, year FROM books WHERE author_id = 2:');
  console.table(rows);
  const dbFound = rows.find(r => r.title === 'GraphQL for Beginners' && r.year === 2025);
  if (!dbFound) throw new Error('Test 5 Failed: New book not found directly in MySQL database');
  console.log('PASSED: New book confirmed directly inside MySQL table.');

  // TEST 6: Validation Error Handling
  console.log('\n--- TEST 6: Verify validation error handling ---');
  const invalidMutation = `
    mutation {
      addBook(title: "   ", year: 2025, authorId: "2") {
        id
      }
    }
  `;
  const resErr = await gql(invalidMutation);
  if (!resErr.errors || resErr.errors.length === 0) {
    throw new Error('Test 6 Failed: Expected validation error for empty title');
  }
  console.log('Expected error caught:', resErr.errors[0].message);
  console.log('PASSED: Input validation properly handled.');

  // Clean shutdown
  console.log('\n=== ALL BACKEND & MUTATION TESTS PASSED SUCCESSFULLY! ===\n');
  await server.stop();
  await pool.end();
}

runTests().then(() => {
  console.log('Test run completed successfully.');
}).catch(async (err) => {
  console.error('\n❌ Test suite failed:', err);
  try { await pool.end(); } catch (_) {}
  process.exit(1);
});
