const { ApolloServer } = require("apollo-server");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");
const typeDefs = require("./db/schema");
const resolvers = require("./db/resolvers");


const conectarDB = require("./config/db");

//conectar a la base de datos
conectarDB();

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => {
    // console.log(req.headers["authorization"])
    const token = req.headers["authorization"] || "";
    if (token) {
      try {
        const usuario = jwt.verify(token.replace("Bearer",""), process.env.SECRET);
       // console.log(usuario);
        return { usuario };
      } catch (error) {
        console.log(error);
      }
    }
  },
});

//arrancar servidor

server.listen({port: process.env.PORT || 4000}).then(({ url }) => {
  console.log(`servidor listo en la url ${url}`);
});
