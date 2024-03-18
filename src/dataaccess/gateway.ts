
import { createPool,RowDataPacket } from 'mysql2';
import * as mysql from 'mysql2/promise';
const brcryptjs= require('bcryptjs')
import {CONFIG} from '../config/testingconfig'
import {decodeToken} from '../domain/jwtFunctions'
import { ResultSetHeader } from 'mysql2/promise';
import { MongoClient, Db, Collection } from 'mongodb';

export class UserGateway {
  private static instance: UserGateway;
  private pool: mysql.Pool | null;
  private db: Db | null;
  private assetsCollection: Collection<any> | null;
  private assetsEnVentaCollection:Collection<any> | null;

  private constructor() {
    this.pool = null;
    this.db = null;
    this.assetsEnVentaCollection= null
    this.assetsCollection = null;
  }

  public static async getInstance(): Promise<UserGateway>
  {
    if (!UserGateway.instance) {
      UserGateway.instance = new UserGateway();
      let setup = await UserGateway.instance.setupDatabase();
    }
    return UserGateway.instance;
  }
  public async verifyAccountBlocked(user:string): Promise<boolean | undefined>{
    const result= await  this.assetsEnVentaCollection?.find({usuario:user}).toArray();
    if(result){
      let transactionsBlocked=result[0].transactionsBlocked
      if(transactionsBlocked==true){
        return true
      }else{
        return false
      }
    }
  }
  public async blockOrUnblockUserTransactions(user:string,type:string): Promise<boolean | undefined>{
    if(type=='block'){
      const resultado = await  this.assetsEnVentaCollection?.updateOne(
        { usuario: user }, // Filtro para encontrar el documento
         { $set: { transactionsBlocked: true } } // Actualización del campo 'user'
      );
      if (resultado) {
          if(resultado.modifiedCount > 0){
            return true
          }else{
            return false
          }
      }

    }else if(type=='unblock'){
      const resultado = await  this.assetsEnVentaCollection?.updateOne(
        { usuario: user }, // Filtro para encontrar el documento
         { $set: { transactionsBlocked: false } } // Actualización del campo 'user'
      );
      if (resultado) {
          if(resultado.modifiedCount > 0){
            return true
          }else{
            return false
          }
      }
    }
 
  }

  public async getUserAddress(user:string): Promise<string> 
  {
    const getAddressQuery="SELECT address FROM users WHERE usuario=? "

    if (!this.pool) {
      throw new Error('No se pudo conectar a la base de datos');
    }else{

      let [result] = await this.pool.execute<RowDataPacket[]>(getAddressQuery,[user]);

      if(Array.isArray(result))
      {   
        if(result.length == 0 || result==undefined)
        {
          return "no address"
        }else if(result.length > 0)
        {
          return result[0].address
        }else{
          throw new Error("UNEXPECTED RESULT")
        }

      }else{
        return "no address"
      }
    }
  } 
  public async verifyPassword(usuario:string,contrasena:string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      if(this.pool){
        let [result]: any = await (await this.pool).execute("SELECT usuario,contrasena FROM users WHERE usuario = ?", [usuario]);
  
        if (result) {
          // Verifica que la contraseña ingresada coincida con la almacenada en la base de datos
          const passwordMatch = brcryptjs.compareSync(contrasena, result.contrasena);
          if (passwordMatch) {
            resolve(true);
          } else {
            reject(false);
          }
        } else {
          reject(false);
        }
      }
 
    });
  }
  public async getAssetsComprados(){

  }
  public async insertAssetComprado(){

  }
  public async detenerVenta(usuario: string, asset: string): Promise<boolean> {
    try {
        const resultEliminarVenta = await this.assetsEnVentaCollection?.deleteOne({vendedor: usuario, asset: asset});
        if (resultEliminarVenta && resultEliminarVenta.deletedCount) {
            if (resultEliminarVenta.deletedCount === 1) {
                return true;
            } else if (resultEliminarVenta.deletedCount === 0) {
                return false;
            }
        }
        return false; // Si ninguna de las condiciones anteriores se cumple
    } catch (error) {
        console.error('Error al eliminar el elemento:', error);
        return false;
    }
}
  public async getMarketAssets(): Promise<any[] >{
   return new Promise(async (resolve, reject) => {
    const resultGetAssetsEnVenta = await  this.assetsEnVentaCollection?.find().toArray();
    if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
      // Se encontraron assets
      return resolve(resultGetAssetsEnVenta)
    }  else if( resultGetAssetsEnVenta==undefined|| resultGetAssetsEnVenta.length == 0 ){
      return resolve([])
    }
      // No se encontraron assets
    
  })}
  public async getAssetEnVentaPorVendedor(asset: string,vendedor:string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.db) {
          console.log('El pool no está disponible');
          return reject(new Error("la pool no está activa"));
        }
        
        // Verificar si el pool de la base de datos está disponible
        if (this.db) {
          let resultGetAsset = await this.assetsCollection?.countDocuments({asset: asset,vendedor});

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
  public async getMarketAssetsByUser(user:string): Promise<any[]>{
    return new Promise(async (resolve, reject) => {
     const resultGetAssetsEnVenta = await  this.assetsEnVentaCollection?.find({vendedor:user}).toArray();
     if (resultGetAssetsEnVenta && resultGetAssetsEnVenta.length > 0) {
       // Se encontraron assets
       return resolve(resultGetAssetsEnVenta)
     } else if( resultGetAssetsEnVenta==undefined|| resultGetAssetsEnVenta.length == 0 ){
       // No se encontraron assets
       return resolve([])
     }
   })}
  
  public async getAssets(): Promise< any[]> {
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
          }  else if( resultGetAsset==undefined|| resultGetAsset.length == 0 ){
            // No se encontraron assets
            return resolve([])
          }
     
        }
      } catch (error) {
        console.log("Error en la función de inserción de billetera:", error);
        return reject(new Error("error tratando de conseguir aaset"));
      }
    });
  }

  private async setupDatabase(): Promise<void> 
  {
    let connected = false;
    
    while (!connected) {
      try {
        this.pool = await mysql.createPool({
          host:"localhost",
          user: "root",
          password: "1234",
          database: "raptoreumworld",
        });
        console.log("connected to database")
        const client = new MongoClient('mongodb://127.0.0.1:27017');
        await client.connect();
        this.db = client.db('raptoreumworld');
        this.assetsCollection = this.db.collection('assets');
        this.assetsEnVentaCollection = this.db.collection('assetsEnVenta');
        console.log('Connected to MongoDB');
        connected = true; // Establecemos la conexión con éxito
      } catch (error) {
        console.log("ERRORRRRRR")
        connected=false
        console.error("Error al conectar a la base de datos:", error);
        // Esperamos antes de intentar nuevamente
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Puedes ajustar el tiempo de espera según tus necesidades
      }

    }
   } }