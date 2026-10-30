// server.js -- the GraphQL API
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { GraphQLError } = require('graphql');
const pool = require('./db');

// 1. The GraphQL schema
const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    country: String
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    year: Int
    author: Author!
  }

  type Query {
    authors: [Author!]!
    author(id: ID!): Author
    books: [Book!]!
  }

  type Mutation {
    addBook(title: String!, year: Int, authorId: ID!): Book!
  }
`;

// 2. The resolvers: mapping GraphQL requests to parameterized MySQL queries
const resolvers = {
  Query: {
    authors: async () => {
      try {
        const [rows] = await pool.query('SELECT * FROM authors');
        return rows;
      } catch (err) {
        throw new GraphQLError(`Failed to fetch authors: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
    author: async (_parent, { id }) => {
      try {
        const [rows] = await pool.query('SELECT * FROM authors WHERE id = ?', [id]);
        return rows[0] || null;
      } catch (err) {
        throw new GraphQLError(`Failed to fetch author: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
    books: async () => {
      try {
        const [rows] = await pool.query('SELECT * FROM books');
        return rows;
      } catch (err) {
        throw new GraphQLError(`Failed to fetch books: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
  },

  // Relationship resolvers
  Author: {
    books: async (author) => {
      try {
        const [rows] = await pool.query('SELECT * FROM books WHERE author_id = ?', [author.id]);
        return rows;
      } catch (err) {
        throw new GraphQLError(`Failed to fetch books for author ${author.id}: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
  },

  Book: {
    author: async (book) => {
      try {
        const [rows] = await pool.query('SELECT * FROM authors WHERE id = ?', [book.author_id]);
        return rows[0] || null;
      } catch (err) {
        throw new GraphQLError(`Failed to fetch author for book ${book.id}: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
  },

  Mutation: {
    addBook: async (_parent, { title, year, authorId }) => {
      // Form and input validation
      if (!title || typeof title !== 'string' || !title.trim()) {
        throw new GraphQLError('Book title is required and cannot be empty.', {
          extensions: { code: 'BAD_USER_INPUT', argumentName: 'title' },
        });
      }

      let parsedYear = null;
      if (year !== undefined && year !== null) {
        parsedYear = Number(year);
        if (isNaN(parsedYear) || parsedYear < 1000 || parsedYear > 2100) {
          throw new GraphQLError('Publication year must be a valid 4-digit year (between 1000 and 2100).', {
            extensions: { code: 'BAD_USER_INPUT', argumentName: 'year' },
          });
        }
      }

      // Check author existence in MySQL
      const [authorRows] = await pool.query('SELECT id FROM authors WHERE id = ?', [authorId]);
      if (authorRows.length === 0) {
        throw new GraphQLError(`Author with ID '${authorId}' does not exist.`, {
          extensions: { code: 'BAD_USER_INPUT', argumentName: 'authorId' },
        });
      }

      try {
        const [result] = await pool.query(
          'INSERT INTO books (title, year, author_id) VALUES (?, ?, ?)',
          [title.trim(), parsedYear, authorId]
        );
        const [rows] = await pool.query('SELECT * FROM books WHERE id = ?', [result.insertId]);
        return rows[0];
      } catch (err) {
        throw new GraphQLError(`Failed to insert book: ${err.message}`, {
          extensions: { code: 'DATABASE_ERROR' },
        });
      }
    },
  },
};

// 3. Start standalone Apollo Server
async function start() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  const port = parseInt(process.env.PORT || '4000', 10);
  const { url } = await startStandaloneServer(server, {
    listen: { port },
  });

  console.log(`GraphQL API ready at ${url}`);
  return { server, url };
}

if (require.main === module) {
  start().catch((err) => {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  });
}

module.exports = { typeDefs, resolvers, start };
