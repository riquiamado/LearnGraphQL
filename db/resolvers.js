const bcrypt = require("bcrypt");
require("dotenv").config({ path: "variables.env" });
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuario");
const Cliente = require("../models/Clientes");
const Pedido = require("../models/Pedidos");
const Producto = require("../models/Productos");


//resolvers
const crearToken = (usuario, secreta, expiresIn) => {
  const { id, nombre, email, apellido } = usuario;
  return jwt.sign(
    {
      id,
      nombre,
      email,
      apellido,
    },
    secreta,
    { expiresIn }
  );
};

const resolvers = {
  Query: {
    obtenerUsuario: async (_, { },ctx) => {
        // console.log(ctx.usuario)  
      return ctx.usuario;
    },
    ObtenerProductos: async () => {
      try {
        const productos = await Producto.find({});
        return productos;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerProducto: async (_, { id }) => {
      try {
        const producto = await Producto.findById(id);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }
        return producto;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerCliente: async () => {
      try {
        const clientes = await Cliente.find({});
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerClienteVendedor: async (_, {}, ctx) => {
      try {
        const clientes = await Cliente.find({
          vendedor: ctx.usuario.id.toString()
        });
        console.log(clientes)
        return clientes;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerClient: async (_, { id }, ctx) => {
      //revisar si el cliente existe
      const cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      //quien lo creo puede verlo
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      return cliente;
    },
    ObtenerPedidos: async () => {
      try {
        const pedidos = await Pedido.find({});
        console.log(pedidos)
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    
    
    
    ObtenerPedidosVendedor: async (_, {}, ctx) => {
      try {
        const pedidos = await Pedido.find({vendedor: ctx.usuario.id}).populate("cliente");
        console.log(pedidos)
        return pedidos;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerPedido: async (_, { id }, ctx) => {
      try {
        const pedido = await Pedido.findById(id);
       // console.log(pedido)
        if (!pedido) {
          throw new Error("Pedido no encontrado");
        }
        if (pedido.vendedor.toString() !== ctx.usuario.id) {
          throw new Error("No tiene las credenciales");
        }
        return pedido;
      } catch (error) {
        console.log(error);
      }
    },
    ObtenerPedidosEstado: async (_, { estado }, ctx) => {
      const pedido = await Pedido.find({
        vendedor: ctx.usuario.id,
        estado,
      });
      return pedido;
    },
    mejoresClientes: async () => {
      const clientes = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        {
          $group: {
            _id: "$cliente",
            total: { $sum: "$total" },
          },
        },
        {
          $lookup: {
            from: "clientes",
            localField: "_id",
            foreignField: "_id",
            as: "cliente",
          },
        },
        {
          $limit: 5,
        },
        {
          $sort: { total: -1 },
        },
      ]);
      return clientes;
    },
    mejoresVendedores: async () => {
      const vendedores = await Pedido.aggregate([
        { $match: { estado: "COMPLETADO" } },
        { $group: { _id: "$vendedor", total: { $sum: "$total" } } },
        {
          $lookup: {
            from: "usuarios",
            localField: "_id",
            foreignField: "_id",
            as: "vendedor",
          },
        },
        { $limit: 3 },
        { $sort: { total: -1 } },
      ]);
      return vendedores;
    },
    buscarProducto: async (_, { texto }) => {
      const productos = await Producto.find({
        $text: { $search: texto }.$limit(10),
      });
      return productos;
    },
  },
  Mutation: {
    NuevoUsuario: async (_, { input }) => {
      //revisar si el usuario existe
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (existeUsuario) {
        throw new Error("El usuario ya existe");
      }

      //hashear su password
      const salt = await bcrypt.genSalt(10);
      input.password = await bcrypt.hash(password, salt);
      //guardar en la base de datos
      try {
        const usuario = new Usuario(input);
        usuario.save();
        return usuario;
      } catch (error) {
        console.log(error);
      }
    },
    autenticarUsuario: async (_, { input }) => {
      const { email, password } = input;
      const existeUsuario = await Usuario.findOne({ email });
      if (!existeUsuario) {
        throw new Error("El usuario no existe");
      }
      const passwordCorrecto = await bcrypt.compare(
        password,
        existeUsuario.password
      );
      if (!passwordCorrecto) {
        throw new Error("El password es incorrecto");
      }
      return {
        token: crearToken(existeUsuario, process.env.SECRET, "24h"),
      };
    },
    NuevoProducto: async (_, { input }) => {
      try {
        const newProducto = await new Producto(input);
        const resultado = await newProducto.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarProducto: async (_, { id, input }) => {
      try {
        let producto = await Producto.findById(id);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }
        producto = await Producto.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return producto;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarProducto: async (_, { id }) => {
      try {
        let producto = await Producto.findById(id);
        if (!producto) {
          throw new Error("Producto no encontrado");
        }
        await Producto.findOneAndDelete({ _id: id });
        return "Producto eliminado";
      } catch (error) {
        console.log(error);
      }
    },
    NuevoCliente: async (_, { input }, ctx) => {
     //console.log(input);
      //console.log(ctx);
      //verificar si el cliente ya esta registrado
      const { email } = input;
      const cliente = await Cliente.findOne({ email });
      if (cliente) {
        throw new Error("El cliente ya esta registrado");
      }

      //crear nuevo cliente
      const nuevoCliente = new Cliente(input);
      //asignar el vendedor
      nuevoCliente.vendedor = ctx.usuario.id;
      //guardar en la base de datos
      try {
        //guardarlo
        const resultado = await nuevoCliente.save();
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    actualizarCliente: async (_, { id, input }, ctx) => {
      //revisar si el cliente existe
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      //verificar si el vendedor es correcto
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      //actualizar
      cliente = await Cliente.findOneAndUpdate({ _id: id }, input, {
        new: true,
      });
      return cliente;
    },
    eliminarCliente: async (_, { id }, ctx) => {
      //revisar si el cliente existe
      let cliente = await Cliente.findById(id);
      if (!cliente) {
        throw new Error("Cliente no encontrado");
      }
      //verificar si el vendedor es correcto
      if (cliente.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      //eliminar
      await Cliente.findOneAndDelete({ _id: id });
      return "Cliente eliminado";
    },
    NuevoPedido: async (_, { input }, ctx) => {
      //verificar si el cliente existe
      const { cliente } = input;
      let clienteExiste = await Cliente.findById(cliente);
      if (!clienteExiste) {
        throw new Error("Cliente no encontrado");
      }
      //verificar si el vendedor es correcto
      if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tienes las credenciales");
      }
      // verificar si hay stock
      for await (const articulo of input.pedido) {
        const { id } = articulo;
        const producto = await Producto.findById(id);
        if (articulo.cantidad > producto.existencia) {
          throw new Error(
            `El articulo: ${producto.nombre} excede la cantidad disponible`
          );
        } //else{
        //disminuir el stock
        producto.existencia = producto.existencia - articulo.cantidad;
        await producto.save();
      }
      //guardar el pedido
      const nuevoPedido = await new Pedido(input);
      //asignarle un vendedor
      nuevoPedido.vendedor = ctx.usuario.id;
      //guardarlo
      const resultado = await nuevoPedido.save();
      return resultado;
    },
    actualizarPedido: async (_, { id, input }, ctx) => {
      const { cliente } = input;
      try {
        // si el pedido existe
        const pedido = await Pedido.findById(id);
        if (!pedido) {
          throw new Error("Pedido no encontrado");
        }
        //si el cliente existe
        const clienteExiste = await Cliente.findById(cliente);
        if (!clienteExiste) {
          throw new Error("Cliente no encontrado");
        }
        //si el vendedor existe
        if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
          throw new Error("No tiene las credenciales");
        }
        //revisar el stock
        // verificar si hay stock
        if (input.pedido) {
          for await (const articulo of input.pedido) {
            const { id } = articulo;
            const producto = await Producto.findById(id);
            if (articulo.cantidad > producto.existencia) {
              throw new Error(
                `El articulo: ${producto.nombre} excede la cantidad disponible`
              );
            } //else{
            //disminuir el stock
            producto.existencia = producto.existencia - articulo.cantidad;
            await producto.save();
          }
        }
        //actualizar el pedido
        const resultado = await Pedido.findOneAndUpdate({ _id: id }, input, {
          new: true,
        });
        return resultado;
      } catch (error) {
        console.log(error);
      }
    },
    eliminarPedido: async (_, { id }, ctx) => {
      const pedido = await Pedido.findById(id);
      if (!pedido) {
        throw new Error("Pedido no encontrado");
      }
      if (pedido.vendedor.toString() !== ctx.usuario.id) {
        throw new Error("No tiene las credenciales");
      }
      await Pedido.findOneAndDelete({ _id: id });
      return "Pedido eliminado";
    },
  },
};
module.exports = resolvers;
