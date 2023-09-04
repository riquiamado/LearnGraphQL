const { gql } = require("apollo-server");

//Schema

const typeDefs = gql`
  type Usuario {
    id: ID
    nombre: String
    apellido: String
    email: String
    creado: String
  }

  type Cliente {
    id: ID
    nombre: String
    apellido: String
    empresa: String
    email: String
    telefono: String
    vendedor: ID
  }

  type Token {
    token: String
  }

  type Producto {
    id: ID
    nombre: String
    precio: Float
    existencia: Int
    creado: String
  }

  type Pedido {
    id: ID
   pedido:[pedidoProducto] 
    cliente: Cliente
    vendedor: ID
    estado: estadoPedido
    total: Float
    fecha:String
   
  }
  type pedidoProducto{
    id:ID
    cantidad:Int
    nombre:String
    precio:Float
  }

  type TopCliente {
    cliente: [Cliente]
    total: Float

  }

  type TopVendedor {
    vendedor: [Usuario]
    total: Float
  }

  input UsuarioInput {
    nombre: String!
    apellido: String!
    email: String!
    password: String!
  }
  input ClienteInput {
    nombre: String!
    apellido: String!
    empresa: String!
    email: String!
    telefono: String
  }
  input AutenticarInput {
    email: String!
    password: String!
  }

  input ProductoInput {
    nombre: String!
    precio: Float!
    existencia: Int!
  }
  input pedidoProductoInput{
    id:ID
    cantidad:Int
    nombre:String
   precio:Float
   creado:String
  }

  input PedidoInput {
    pedido:[pedidoProductoInput]
    cliente: ID
    estado: estadoPedido
    total: Float
  
  }
  enum estadoPedido{
    PENDIENTE
    COMPLETADO
    CANCELADO
  }

  type Query {
    #Usuarios
    obtenerUsuario: Usuario

    #Clientes
    ObtenerCliente: [Cliente]
    ObtenerClienteVendedor:[Cliente]
    ObtenerClient(id:ID!):Cliente

    #Productos
    ObtenerProductos: [Producto]
    ObtenerProducto(id: ID!): Producto

    #Pedidos
    ObtenerPedidos: [Pedido]
    ObtenerPedidosVendedor: [Pedido]
    ObtenerPedido(id: ID!): Pedido
    ObtenerPedidosEstado(estado:String!): [Pedido]

    #busquedas Avanzadas
    mejoresClientes: [TopCliente]
    mejoresVendedores: [TopVendedor]
    buscarProducto(texto: String!): [Producto]
  
  }
  type Mutation {
    #Usuario
    NuevoUsuario(input: UsuarioInput): Usuario
    autenticarUsuario(input: AutenticarInput): Token

    #Cliente
    NuevoCliente(input: ClienteInput): Cliente
    actualizarCliente(id: ID!, input: ClienteInput): Cliente
    eliminarCliente(id: ID!): String 

    #Producto
    NuevoProducto(input: ProductoInput): Producto
    actualizarProducto(id: ID!, input: ProductoInput): Producto
    eliminarProducto(id: ID!): String

    #Pedidos
    NuevoPedido(input:PedidoInput): Pedido
    actualizarPedido(id: ID!, input: PedidoInput): Pedido
    eliminarPedido(id: ID!): String
 }
`;

module.exports = typeDefs;
