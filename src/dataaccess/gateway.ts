import { MongoClient, Db, Collection } from 'mongodb';
import * as mysql from 'mysql2/promise';
import { ObjectId } from 'mongodb';
import { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
const axios=require('axios')
const redis = require('redis');
const util = require('util');
const jwt = require('jsonwebtoken');
type userTransactions = {
  _id:string,
  usuario:string,
  transactions: { }[],
}
export class UserGateway {
  private pool: mysql.Pool | null;
  private db: Db | null;
  private assetsCollection: Collection<any> | null;
  private assetsEnVentaCollection: Collection<any> | null;
  private static instance: UserGateway;
  private volatileUserDataCollection:Collection<any> | null
 private ordenesVentaAssetsCollection:Collection<any> | null
 private comprasYventasAssetsCollection:Collection<userTransactions> | null
 private transaccionesPendientesCollection:Collection<any> | null
 private stockTransactionsCollection:Collection<userTransactions> | null
 private nftCollection:Collection<any> | null
 private nftsEnVentaCollection:Collection<any> | null
 private ordenesVentaNFTsCollection:Collection<any> | null
 private transaccionesErroneasCollection:Collection<any> | null
  private apiUrl:string
private client:any

  private constructor() 
  {
    this.db = null;
    this.assetsCollection = null;
    this.assetsEnVentaCollection=null;
    this.pool = null;
    this.volatileUserDataCollection=null
    this.ordenesVentaAssetsCollection=null
    this.comprasYventasAssetsCollection=null
    this.transaccionesPendientesCollection=null
    this.stockTransactionsCollection=null
    this.nftCollection=null
    this.nftsEnVentaCollection=null
    this.ordenesVentaNFTsCollection=null
    this.transaccionesErroneasCollection=null
     this.apiUrl='http://localhost:3030' 
    this.client = redis.createClient({
  host: 'localhost', // Cambia a la dirección IP del host si no estás usando localhost
  port: 6380,        // Cambia al puerto al que has mapeado el contenedor de Redis (6380 en este eje                                                         mplo)
  // password: 'tu-contraseña', // Si has configurado una contraseña para Redis, descomenta y config                                                         ura esta línea
legacyMode: true

});
this.client.connect().catch(console.error)
 
    }

  public static async getInstance(): Promise<UserGateway> {
    if (!this.instance) {
      this.instance = new UserGateway();
      await this.instance.setupDatabase();
    }
    return this.instance;
  }
  public async getRedisClient() {
    return await this.client;
  }
  public async addWrongTransaction(deudorId:string,deudorAddress:string,toId:string,toAddress:string,activo:string,monto:number){
    await this.transaccionesErroneasCollection?.insertOne({deudorId:deudorId,deudorAddress:deudorAddress,toId:toId,toAddress:toAddress,activo:activo,monto:monto})
  }
  public async transaccionPendiente(deudorId:string,deudorAddress:string,toAddress:string,toId:string,rtmOassetId:string,monto:number): Promise<any>{
    try {
      console.log("EJECUTANDO TRANSACCIONPENDIENTE")
      let _id = await new ObjectId().toString();
      await this.transaccionesPendientesCollection?.insertOne({_id:_id,deudorId:deudorId,deudorAddress:deudorAddress,toId:toId,toAddress:toAddress,activo:rtmOassetId,monto:monto})
      return _id
    } catch (error) {
      console.log("error en transaccion pendiente")
    }
  }

  public async transaccionPendienteOut(id:string): Promise<any>{
    
    this.transaccionesPendientesCollection?.deleteOne({_id:id})  
  }
  public async isActive(id:string): Promise<any>{
   let is=await this.transaccionesPendientesCollection?.find({_id:id}).toArray()
   if( is && is.length>0){
     return true
   }else{
    return false
   }
  }
  public async getAssetRegistered(asset: string): Promise<any> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.db) {
            console.log('El pool no está disponible');
            return reject(new Error("La pool no está activa"));
          }

          // Verificar si el pool de la base de datos está disponible
          let resultGetAsset = await this.assetsCollection?.findOne({ asset: asset });
           console.log("RESULT GET ASSET:",resultGetAsset)
          // Verificar si el activo fue encontrado y retornar el objeto
          if (resultGetAsset) {
            resolve(resultGetAsset);
          } else {
            resolve(null); // Retorna null si no se encuentra el activo
          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(new Error("Error tratando de conseguir el asset"));
        }
      });
    }

    public async getNFTRegistered(asset: string): Promise<any> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.db) {
            console.log('El pool no está disponible');
            return reject(new Error("La pool no está activa"));
          }

          // Verificar si el pool de la base de datos está disponible
          let resultGetAsset = await this.nftCollection?.findOne({ asset: asset });

          // Verificar si el activo fue encontrado y retornar el objeto
          if (resultGetAsset) {
            resolve(resultGetAsset);
          } else {
            resolve(null); // Retorna null si no se encuentra el activo
          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(new Error("Error tratando de conseguir el asset"));
        }
      });
    }

  public  getTransaccionesPendientes(): any{
   let result= this.transaccionesPendientesCollection?.find().toArray()  
   return result
  }
  public async getTransaccionPendiente(id: string): Promise<boolean | string> {
    try {
        const result = await this.transaccionesPendientesCollection?.findOne({ _id: id });
        if (result) {
            // Si se encuentra la transacción
            return true;
        } else {
            // Si no se encuentra la transacción
            return false;
        }
    } catch (error) {
        // Si hay un error
        console.error("Error al buscar la transacción:", error);
        return "error";
    }
}
public async updateCompraOventa(idTransaccion: string, newStatus: string, txid: string): Promise<any> {
  const result = await this.comprasYventasAssetsCollection?.updateOne(
    { "transactions._id": idTransaccion },
    { $set: { "transactions.$.status": newStatus, "transactions.$.txid": txid } }
  );
  return result;
}

 public async insertCompraOventa(
  user: string,
  type: string,
  rtmInvolucrado: number,
  assetInvolucrado: string,
  assetInvolucradoCantidad: number,
  URLcoinSoldOrBought: string,
  typeAsset: string
): Promise<any> {
  const _id = new ObjectId().toString();
  const date = new Date().toISOString();
  
  if (type === "venta") {
    const transaccion = {
      _id: _id,
      type: "venta",
      txid: "none",
      rtmGanado: rtmInvolucrado,
      assetVendido: assetInvolucrado,
      assetVendidoCantidad: assetInvolucradoCantidad,
      URLcoinSoldOrBought: URLcoinSoldOrBought,
      status: "PENDING",
      typeAsset: typeAsset,
      date: date
    };
    
    const result = await this.comprasYventasAssetsCollection?.updateOne(
      { usuario: user },
      { $push: { transactions: transaccion } }
    );
    return _id;
  } else if (type === "compra") {
    const transaccion = {
      _id: _id,
      type: "compra",
      txid: "none",
      rtmGastado: rtmInvolucrado,
      assetComprado: assetInvolucrado,
      assetCompradoCantidad: assetInvolucradoCantidad,
      URLcoinSoldOrBought: URLcoinSoldOrBought,
      status: "PENDING",
      typeAsset: typeAsset,
      date: date
    };
    
    const result = await this.comprasYventasAssetsCollection?.updateOne(
      { usuario: user },
      { $push: { transactions: transaccion } }
    );
    return _id;
  }
}
  public async getMarketAssets(): Promise<any[] >{
   return new Promise(async (resolve, reject) => {
    const resultGetAssetsEnVenta = await  this.assetsEnVentaCollection?.find().toArray();
 console.log('Result resultGetAssetsEnVenta:', resultGetAssetsEnVenta);

    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
      // Se encontraron assets
      return resolve(resultGetAssetsEnVenta)
    }else{
      return resolve([])
    }
      // No se encontraron assets

  })}
  public async getMarketNFTs(): Promise<any[]>{
    return new Promise(async (resolve, reject) => {
     const resultGetAssetsEnVenta = await  this.nftsEnVentaCollection?.find().toArray();
     if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
       // Se encontraron assets
       return resolve(resultGetAssetsEnVenta)
     }else{
       return resolve([])
     }
       // No se encontraron assets
 
   })}
     public async verifyTokenEnVenta2(assetEnVenta: string, user: string, type: string): Promise<any> {
  console.log("USUARIO QUE USAMOS PARA BUSCAR EN SUS ORDENES DE VENTA", user);

  let collectionOrdenes, collectionEnVenta;

  if (type === "TOKEN") {
    collectionOrdenes = this.ordenesVentaAssetsCollection;
    collectionEnVenta = this.assetsEnVentaCollection;
  } else if (type === "NFT") {
    collectionOrdenes = this.ordenesVentaNFTsCollection;
    collectionEnVenta = this.nftsEnVentaCollection;
  } else {
    return "Invalid type provided";
  }

  if (!collectionOrdenes || !collectionEnVenta) {
    return "errorGettingToken";
  }

  try {
    const result = await collectionOrdenes.find({ vendedorId: user }).toArray();
    console.log("entrando a verify token en venta 2");

    if (result && result.length > 0) {
      console.log("tenemos ordenes de venta:", result);

      const promises = result.map(async (e: any) => {
        let element = e.ordenId;
        let elemento = await collectionEnVenta.find({ _id: element }).toArray();
        console.log("asset en venta y ordenid que usamos para encontrar el elemento en assetsEnVentaColeccion: ", element, "<orden asset> ", assetEnVenta);
        console.log("ELEMENTO FALLANDO EN VERIFYTOKENENVENTA:", elemento);

        return elemento && elemento[0].asset === assetEnVenta;
      });

      const results = await Promise.all(promises);
      console.log("Resultado de las promesas recorridas ya que las ordenes de venta superan el largo cero:", results);
      const found = results.includes(true);

      return found;
    } else if (result && result.length === 0) {
      return false;
    } else {
      return "errorGettingToken";
    }
  } catch (error) {
    console.error("Error verifying token in sale:", error);
    return "errorGettingToken";
  }
}
  public async raptoreumWorldStockTransaction(userid:string,rtmEnviado:number,transactionType:string)
  {
    let hora = new Date().toISOString();
    let transaccion={type:transactionType,usuario:userid,rtmGanado:rtmEnviado,hora:hora}
    const result = await this.stockTransactionsCollection?.updateOne(
      { usuario: userid },
      { $push: { transactions: transaccion } }
  );
  }
  
  public async getVendedorDelToken(ordenId:string,type:string): Promise<any>{
if(type==="Asset"){
    const result= await  this.ordenesVentaAssetsCollection?.find({ordenId:ordenId}).toArray();
    if(result){
     return result[0]
    }else if(!result){
     return false
    }
}else if(type==="nft"){
   const result= await  this.ordenesVentaNFTsCollection.find({ordenId:ordenId}).toArray();
    if(result){
     return result[0]
    }else if(!result){
     return false
    }
}
  }
  public async getVendedorDelNFT(ordenId:string): Promise<any>{
    const result= await  this.ordenesVentaNFTsCollection?.find({ordenId:ordenId}).toArray();
    if(result){
     return result[0]
    }else if(!result){
     return false
    }
  }
  
    public async getMarketAssetsById(id:string): Promise<any[]>{
    return new Promise(async (resolve, reject) => {
     const resultGetAssetsEnVenta = await  this.assetsEnVentaCollection?.find({_id:id}).toArray();
     if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
       // Se encontraron assets
       return resolve(resultGetAssetsEnVenta)
     } else if( resultGetAssetsEnVenta==undefined|| resultGetAssetsEnVenta.length == 0 ){
       // No se encontraron assets
       return resolve([])
     }
   })}
  public async getMarketNFTsById(id:string): Promise<any[]>{
    return new Promise(async (resolve, reject) => {
     const resultGetAssetsEnVenta = await  this.nftsEnVentaCollection?.find({_id:id}).toArray();
     console.log("RESULTADO GET MARKET NFTS:",resultGetAssetsEnVenta)
     if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
       // Se encontraron assets
       return resolve(resultGetAssetsEnVenta)
     } else if( resultGetAssetsEnVenta==undefined|| resultGetAssetsEnVenta.length == 0 ){
       // No se encontraron assets
       return resolve([])
     }
   })}
   public async detenerVenta(usuario: string, id: string,type:string): Promise<boolean> {
   
    if(type=="asset"){
console.log("TYPE DETENER: asset")
      console.log("DETONANDO DETENER VENTA DEL GATEWAY")
      try {
        console.log("ID AL INGRESAR LA STOP VENTA:",id)
          const resultEliminarVenta = await this.assetsEnVentaCollection?.deleteMany({ _id: id });
          const resultEliminarOrden = await this.ordenesVentaAssetsCollection?.deleteMany({ ordenId: id, vendedorId: usuario });
          if(resultEliminarVenta != undefined && resultEliminarOrden != undefined){
            const eliminacionExitosa = resultEliminarVenta?.deletedCount > 0 && resultEliminarOrden?.deletedCount > 0;

            if (eliminacionExitosa) {
                return true;
            } else {
                console.log('Error: No se pudo eliminar correctamente.');
                return false;
            }
          }else{
            return false;
          }
   
      } catch (error) {
          console.error('Error al eliminar el elemento:', error);
          return false;
      }
    }else if(type=="nft"){
      console.log("DETONANDO DETENER VENTA (VERSION NFT) DEL GATEWAY")
      try {
        console.log("ID AL INGRESAR LA STOP VENTA:",id)
          const resultEliminarVenta = await this.nftsEnVentaCollection?.deleteMany({ _id: id });
          const resultEliminarOrden = await this.ordenesVentaNFTsCollection?.deleteMany({ ordenId: id, vendedorId: usuario });
          if(resultEliminarVenta != undefined && resultEliminarOrden != undefined)
          {
            const eliminacionExitosa = resultEliminarVenta?.deletedCount > 0 && resultEliminarOrden?.deletedCount > 0;
            if (eliminacionExitosa)
               {
                return true;
            } else 
            {
                console.log('Error: No se pudo eliminar correctamente.');
                return false;
            }
          }else{
            return false;
          }
   
      } catch (error) {
          console.error('Error al eliminar el elemento:', error);
          return false;
      }
    }else{
      return false
    }
     
    }
  
  public async getData(sentence:string,  values: any[]): Promise<any>{

    if(this.pool != null){
      const sanitizedValues = values ? values.map(value => (value !== undefined ? value : null)) : [];
      console.log("sentencia:",sentence)
      console.log("valores a insertar=",sanitizedValues)
      const [result] = await this.pool.execute(sentence, sanitizedValues);
      return result;
    }else{
      return false
    }

    }

   public async verifyAccountBlocked(username: string): Promise<boolean | string> {
const securityTokenResult = await jwt.sign({ user: "root" }, "LongLiveSkrillexBnx6aw300172_", {
      expiresIn: '1h' // El token expirará en 1 hora
    });
 
   const config = {
      headers: {
        'Authorization': `Bearer ${securityTokenResult}`
      }
    };

    try {
      const response = await axios.get(`${this.apiUrl}/accountBlocked/${username}`, config);
      if (response.status === 200) {
        return response.data;
      } else {
        return "error";
      }
    } catch (error) {
      console.error('Error verifying account block status:', error);
      return "error";
    }
  }

    public async blockOrUnblockUserTransactions(username: string, action: 'block' | 'unblock'): Promise<boolean> {
    const securityTokenResult = await jwt.sign({ user: username }, "LongLiveSkrillexBnx6aw300172_", {
      expiresIn: '1h' // El token expirará en 1 hora
    });

    const config = {
      headers: {
        'Authorization': `Bearer ${securityTokenResult}`,
        'Content-Type': 'application/json'
      }
    };

    const body = {
      user: username
    };

    const endpoint = action === 'block' ? 'blockAccount' : 'unblockAccount';

    try {
console.log("body enviado:",body)
      const response = await axios.get(`${this.apiUrl}/${endpoint}`, config);
      if (response && response.status==200) {
       
      return true
  
      } else {
        return false
      }
      
    } catch (error) {
      console.error(`Error ${action}ing account:`, error);
      return false;
    }
  }

   public async getMarketAssetsByUser(user:string): Promise<any[]>{
    return new Promise(async (resolve, reject) => {
     const resultGetAssetsEnVenta = await  this.assetsEnVentaCollection?.find().toArray();
     const resultOrders= await this.ordenesVentaAssetsCollection?.find({vendedorId:user}).toArray();
     if (resultOrders && resultOrders.length > 0) {
      let marketAssets:any[]=[]
      resultOrders.forEach((e)=>{
        let marketid=e.ordenId
        let result=resultGetAssetsEnVenta?.find(elemento => {
          return elemento._id === marketid ;
        });
        marketAssets.push(result)
      })

       // Se encontraron assets
       return resolve(marketAssets)
     } else if( resultGetAssetsEnVenta==undefined|| resultGetAssetsEnVenta.length == 0 ){
       // No se encontraron assets
       return resolve([])
     }else if(resultOrders && resultOrders.length == 0){
      return resolve([])
     } else if(!resultOrders){
      return resolve([])
     }
   })}
        public async getUserAddress(user:string): Promise<string>
    {
      try {
        const getAddressQuery="SELECT address FROM users WHERE userId=? "

        if (!this.pool) {
          throw new Error('No se pudo conectar a la base de datos');
        }else{
  
          let [result] = await this.pool.execute<RowDataPacket[]>(getAddressQuery,[user]);
  
          if(Array.isArray(result))
          {
            if(result.length == 0 || result==undefined)
            {
              return " await (await this.gateway).verifyAccountBlocked(buyer);"
            }else if(result.length > 0)
            {
              return result[0].address
            }else{
              return "error"
            }
  
          }else{
            return "no address"
          }
        }
      } catch (error) {
        console.log("error get user address:",error)
        return "error"
      }
     
    }
    public async insertData(sentence: string, values: any[]): Promise<boolean> {
      let success = false;
      if (this.pool != null) {
        const sanitizedValues = values ? values.map(value => (value !== undefined ? value : null)) : [];
        try {
          console.log("ejecutando consulta")
          const [result]: any = await this.pool.execute(sentence, sanitizedValues)
          console.log("RESULTADO DE LA insercion",result)
          if (result.affectedRows > 0) {
            console.log("affected rows")
            success=true
             return true
          }else{
            success=false
          }
        } catch (error) {
          console.log("Error inserting data:", error);
          success = false;
        }
      }
      return success;
    }

    public async insertVolatileData(user:string):Promise<boolean>{
      if(this.db){
        let result=await  this.volatileUserDataCollection?.insertOne({usuario:user,transactionsBlocked:false})

      }
      return true
    }
    public async insertWallet(usuario: string, wallet: string): Promise<boolean> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.pool) {
            console.log('El pool no está disponible');
            return reject(false);
          }

          // Verificar si el pool de la base de datos está disponible
          if (this.pool) {
            const updateQuery = 'UPDATE users SET address=? WHERE userid=?';
            const updateValues = [wallet, usuario];

            // Ejecutar la consulta SQL para actualizar la billetera
            const [result, fields] = await (await this.pool).execute(updateQuery, updateValues);

            // Verificar si la consulta se ejecutó correctamente
            if (result && 'affectedRows' in result) {
              const updateWallet = result as ResultSetHeader;
              // Verificar si se realizó una inserción exitosa
              if (updateWallet.affectedRows > 0) {
                console.log("INSERT WALLET: true");
                return resolve(true);
              } else {
                console.log("No se actualizó ninguna fila");
                return reject(false);
              }
            } else {
              console.log("Hubo un error al actualizar la billetera");
              return reject(false);
            }
          } else {
            console.log("El pool no está activo");
            return reject(false);
          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(false);
        }
      });
    }
    public async insertAsset(asset: string, usuario: string,usuarioId:string,assetpicture:string,total:number,creatorAddress:string,assetId:string,acronimo:string,description:string): Promise<any> {
      return new Promise(async (resolve, reject) => {
        try {
          // Verificar si el pool de la base de datos está disponible
          if (this.db) {
            let resultInsertAsset = await this.assetsCollection?.insertOne({creador: usuario,creadorId:usuarioId, asset: asset, assetpicture: assetpicture, total: total,creadorAddress:creatorAddress,assetId:assetId,acronimo:acronimo,description:description});

                if (resultInsertAsset) {
                 console.log("La inserción se ha realizado correctamente.");

           return resolve({creador: usuario,creadorId:usuarioId, asset: asset, assetpicture: assetpicture, total: total,creadorAddress:creatorAddress,assetId:assetId,acronimo:acronimo,description:description})
            }else{

            return reject(new Error("error intentando insertar el asset"));
            }
          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(new Error("error intentando insertar el asset"));
        }

      });
    }
  

    public async getAssets(): Promise< false | any[]> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.db) {
            console.log('El pool no está disponible');
            return reject(new Error("la pool no está activa"));
          }

          // Verificar si el pool de la base de datos está disponible
          if (this.db) {
            const resultGetAsset = await  this.assetsCollection?.find().toArray();
            if (resultGetAsset && resultGetAsset.length > 0) {
              // Se encontraron assets
              return resolve(resultGetAsset)
            } else{
              // No se encontraron assets
              return resolve(false)
            }

          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(new Error("error tratando de conseguir aaset"));
        }
      });
    }
  public async verifyTokenEnVenta(asset: string, user: string,orden:string):Promise<any> {
    const result = await this.ordenesVentaAssetsCollection?.find({ vendedorId: user }).toArray();
    console.log("entrando a verify token en venta")
    if (result) {
      console.log("tenemos o ordenesAssetEnVenta:",result)
      const promises = result.map(async (e:any) => {
        if(e.ordenId==orden){
          return true
        }else{
         return false
       }
      });

      const results = await Promise.all(promises);
      const found = results.includes(true);
      const foundFalse = results.every((result) => result === false);
      if (found && !foundFalse) {
        return true;
      } else if(!found && foundFalse){
        return false;
      }
    } else {
      return "errorGettingToken";
    }
  }
  public async verifyNftEnVenta(asset: string, user: string,orden:string):Promise<any> {
    const result = await this.ordenesVentaNFTsCollection?.find({ vendedorId: user }).toArray();
    console.log("entrando a verify token en venta")
    if (result) {
      console.log("tenemos o ordenesAssetEnVenta:",result)
      const promises = result.map(async (e:any) => {
        if(e.ordenId==orden){
          return true
        }else{
         return false
       }
      });
      
      const results = await Promise.all(promises);
      const found = results.includes(true);
      const foundFalse = results.every((result) => result === false);
      if (found && !foundFalse) {
        return true;
      } else if(!found && foundFalse){
        return false;
      }
    } else {
      return "errorGettingToken";
    }
  }
    
       public async insertAssetInMarket(assetEnVenta: string, userid: string, nombre: string, address: string, price: number, type: string): Promise<any> {
      return new Promise(async (resolve, reject) => {
        try{ 
        // Verificar si el pool de la base de datos está disponible
        if (this.db) {
          let asset;
    console.log("TYPE INSERT ASSET:",type)
          if (type === "NFT") {
            asset = await this.getNFTRegistered(assetEnVenta);
          } else if (type === "TOKEN") {
            asset = await this.getAssetRegistered(assetEnVenta);
          }
    
            if (asset) {
              let _id = new ObjectId().toString();
              let vendedorId = userid;
              let sellerAddress = address;
    
              let collection;
              if (type === "NFT") {
                collection = this.nftsEnVentaCollection;
              } else if (type === "TOKEN") {
                collection = this.assetsEnVentaCollection;
              }
    
              if (collection) {
                let resultInsert = await collection.insertOne({
                  _id: _id,
                  creador: asset.creador,
                  asset: asset.asset,
                  assetpicture: asset.assetpicture,
                  total: asset.total,
                  vendedor: nombre,
                  assetId: asset.assetId,
                  acronimo: asset.acronimo,
                  description: asset.description,
                  ipfsLink: asset.linkIPFS,
                  price: price
                });
               if(!resultInsert) return reject("No se pudo insertar el asset en la colección correspondiente");
                if (type === "NFT") {
                  await this.ordenesVentaNFTsCollection?.insertOne({ ordenId: _id, vendedorId: vendedorId, sellerAddress: sellerAddress });
                } else if (type === "TOKEN") {
                  await this.ordenesVentaAssetsCollection?.insertOne({ ordenId: _id, vendedorId: vendedorId, sellerAddress: sellerAddress });
                }
    
                return resolve({
                  _id: _id,
                  creador: asset.creador,
                  vendedor: nombre,
                  asset: asset.asset,
                  assetId: asset.assetId,
                  assetpicture: asset.assetpicture,
                  total: asset.total,
                  price: price,
                  acronimo: asset.acronimo
                });
              } else {
                return reject("No se pudo insertar el asset en la colección correspondiente");
              }
            } else {
              console.log("por esto la respuesta sale mal:", asset);
              return reject("el activo no existe por lo tanto no puede ser vendido");
            }
     
        } else {
          return reject("Database connection is not available");
        }
      }catch(e){
         console.log(e)
         return reject("No se pudo insertar el asset en la colección correspondiente");
      }
      });
    }     
    public async getAsset(asset: string): Promise<boolean> {
      return new Promise(async (resolve, reject) => {
        try {
          if (!this.db) {
            console.log('El pool no está disponible');
            return reject(new Error("la pool no está activa"));
          }

          // Verificar si el pool de la base de datos está disponible
          if (this.db) {
            let resultGetAsset = await this.assetsCollection?.countDocuments({asset: asset});

            if (resultGetAsset && resultGetAsset > 0) {
              // Se encontraron assets
              return resolve(true)
            } else   if (resultGetAsset == 0 ||resultGetAsset == undefined){
              // No se encontraron assets
              return resolve(false)
            }

          }
        } catch (error) {
          console.log("Error en la función de inserción de billetera:", error);
          return reject(new Error("error tratando de conseguir aaset"));
        }
      });
    }
    public async removeData(sentence:string, values: string[]): Promise<RowDataPacket[] | boolean>{
      let success = false;
      if (this.pool != null) {
        const sanitizedValues = values ? values.map(value => (value !== undefined ? value : null)) : [];
        const [result] = await this.pool.execute(sentence, sanitizedValues);

        success = true;
        return success;
      }
      return success;
    }
    public async updateData(sentence:string, values: string[]): Promise<RowDataPacket[] | boolean>{
      let success = false;
      if (this.pool != null) {
        const sanitizedValues = values ? values.map(value => (value !== undefined ? value : null)) : [];
        const [result] = await this.pool.execute(sentence, sanitizedValues);
        if(result !== undefined){
          success = true;
        }

        return success;
      }
      return success;
    }


  
  private async setupDatabase(): Promise<void> {
    let connected = false;
    // Nos conectamos a MySQL
    while (!connected) {
      try {
        this.pool = await mysql.createPool({
          host: '127.0.0.1',
          user: 'raptoreumworld',
          password: 'Bnx6aw300172_',
          database: 'raptoreumworld'
        });
        console.log('Connected to MySQL');
   // Una vez conectados a MySQL, establecemos la conexión a MongoDB
        const client = new MongoClient('mongodb://127.0.0.1:27017');
        await client.connect();
        this.db = client.db('raptoreumworld');
        this.assetsCollection = this.db.collection('assets');
        this.assetsEnVentaCollection = this.db.collection('assetsEnVenta');
        this.volatileUserDataCollection=this.db.collection('volatileUserData')
        this.ordenesVentaAssetsCollection=this.db.collection('ordenesAssetEnVenta')
        this.comprasYventasAssetsCollection=this.db.collection('comprasYventas')
        this.transaccionesPendientesCollection=this.db.collection('transaccionesPendientes')
        this.stockTransactionsCollection=this.db.collection('stockTransactions')
        this.nftCollection=this.db.collection('nft')
        this.nftsEnVentaCollection=this.db.collection('nftsEnVenta')
        this.ordenesVentaNFTsCollection=this.db.collection('ordenesNFTsEnVenta')
        console.log('Connected to MongoDB');
        connected = true;
      } catch (error) {
        console.error('Error connecting to databases:', error);
        connected = false;
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }
}



