const { exec } = require('child_process');
import axios from 'axios';
const util = require('util');

import { UserGateway } from '../dataaccess/gateway';
const gateway=UserGateway.getInstance()
async function getFromCache(key: string,client:any): Promise<any | null> {
const getAsync = util.promisify(client.get).bind(client);
const setAsync = util.promisify(client.set).bind(client); 
 const cachedData = await getAsync(key);
  return JSON.parse(cachedData);
}
async function cacheData(key: string, data: any,client:any): Promise<void> {
const getAsync = util.promisify(client.get).bind(client);
const setAsync = util.promisify(client.set).bind(client);  
await setAsync(key, JSON.stringify(data));
}
interface RpcRequest {
  jsonrpc: string;
  id: string;
  method: string;
  params: any[];
}
export class raptoreumCoreAccess {
    private static instance: raptoreumCoreAccess;
    private client:any
     public static async getInstance(): Promise<raptoreumCoreAccess>
    {

      if (!raptoreumCoreAccess.instance) {
 const instance = new raptoreumCoreAccess();
 instance.client = await (await gateway).getRedisClient();
 raptoreumCoreAccess.instance = instance;
      }
      return raptoreumCoreAccess.instance;
    }



public async getassetdetailsbyname(name: string): Promise<any> {
  try {
    const rpcUser = 'rodrigo';
    const rpcPassword = '1234'; // Reemplaza con tu contraseña
    const rpcHost = `http://localhost:10225/wallet/`;
    const requestData: RpcRequest = {
      jsonrpc: '1.0',
      id: 'curltest',
      method: 'getassetdetailsbyname',
      params: [name],
    };
    console.log('Sending request to RPC server');
    const response = await axios.post(
      rpcHost,
      requestData,
      {
        auth: {
          username: rpcUser,
          password: rpcPassword,
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      }
    );
    console.log('Received response from RPC server');
    if (response) {
      console.log(`Response status: ${response.status}`);
      if (response.status === 200) {
        console.log('Response status is 200');

        if (response.data && response.data.result) {
          console.log('Response data and result exist');

          if (response.data.result.Asset_name) {
            console.log('Asset name found');
            return response.data.result;
          } else {
            console.log('Asset name not found');
            return "notFound";
          }
        } else {
          console.log('Response data or result does not exist');
          return "notFound";
        }
      } else if (response.status === 500) {
        console.log('Response status is 500');
        return "notFound";
      } else {
        console.log('Response status is neither 200 nor 500');
        return "getassetdetailsbynameError";
      }
    } else {
      console.log('Response is empty');
      return "getassetdetailsbynameError";
    }
  } catch (error:any) {
    console.log('Caught an error');
    if (error.response && error.response.status === 500) {
      console.log('Error status is 500');
      return "notFound";
    } else {
      console.log('Error status is not 500 or error response does not exist');
      return "getassetdetailsbynameError";
    }
  }
}
public async getAddressBalance(address: string, asset: string): Promise<any> {
  try {
    const rpcUser = 'rodrigo';
    const rpcPassword = '1234'; // Reemplaza con tu contraseña
    const rpcHost = `http://localhost:10225/wallet/`;
    const requestData = {
      jsonrpc: '1.0',
      id: 'curltest',
      method: 'getaddressbalance',
      params: [{ addresses: [address], asset: asset }],
    };

    console.log('Sending request to RPC server');
    const response = await axios.post(
      rpcHost,
      requestData,
      {
        auth: {
          username: rpcUser,
          password: rpcPassword,
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      }
    );

    console.log('Received response from RPC server');
    if (response) {
      console.log(`Response status: ${response.status}`);
      if (response.status === 200) {
        console.log('Response status is 200');

        if (response.data && response.data.result) {
           console.log('Response data and result exist');
          const assetData = response.data.result[asset];
          if (assetData) {
            console.log(`Balance for asset ${asset}: ${assetData.balance}`);

  const DECIMAL_FACTOR = Math.pow(10, 8);
         
            const rawValue = assetData.balance;
            const realValue = rawValue / DECIMAL_FACTOR;
assetData.balance=realValue
            return assetData;
          } else {
            console.log('Asset data not found');
            return "notFound";
          }
        } else {
          console.log('Response data or result does not exist');
          return "notFound";
        }
      } else if (response.status === 500) {
        console.log('Response status is 500');
        return "notFound";
      } else {
        console.log('Response status is neither 200 nor 500');
        return "error";
      }
    } else {
      console.log('Response is empty');
      return "error";
    }
  } catch (error: any) {
    console.log('Caught an error');
    if (error.response && error.response.status === 500) {
      console.log('Error status is 500');
      return "notFound";
    } else {
      console.log('Error status is not 500 or error response does not exist');
      return "error";
    }
  }
}
public  async getUserAssets(address: string): Promise<any> {
  try {
    const rpcUser = 'rodrigo';
    const rpcPassword = '1234'; // Cambia con tu contraseña
    const rpcHost = 'http://localhost:10225/';
    const requestData = {
      jsonrpc: '1.0',
      id: 'curltest',
      method: 'listassetbalancesbyaddress',
      params: [address],
    };

    const response = await axios.post(rpcHost, requestData, {
      auth: { username: rpcUser, password: rpcPassword },
      headers: { 'Content-Type': 'text/plain;' },
    });

    if (response.status === 200 && response.data && response.data.result) {
      const data = response.data.result;
      const DECIMAL_FACTOR = Math.pow(10, 8);

      const result = await Promise.all(
        Object.keys(data).map(async (key) => {
          // Intentar obtener detalles del activo desde el caché
          const cachedAssetDetails = await getFromCache(`assetDetails:${key}`,this.client);

          if (cachedAssetDetails) {
            // Si se encuentra en el caché, usar los detalles del caché
            return {
              asset: key,
              balance: data[key] / DECIMAL_FACTOR,
              _id: false,
              enVenta: false,
              type: cachedAssetDetails.Isunique ? 'NFT' : 'TOKEN',
              assetpicture: 'none',
              acronimo: '',
              assetid: cachedAssetDetails.Asset_id,
            };
          } else {
            // Si no está en el caché, obtener detalles del activo y almacenarlos en el caché
            let isNft = await this.getassetdetailsbyname(key);

            if (isNft === 'getassetdetailsbynameError') {
              return 'error';
            }

            const assetData = {
              Isunique: isNft.Isunique,
              Asset_id: isNft.Asset_id,
            };

            // Guardar en caché los detalles del activo con una expiración de 5 minutos (300 segundos)
            await cacheData(`assetDetails:${key}`, assetData,this.client);

            // Construir y retornar el objeto de activo
            return {
              asset: key,
              balance: data[key] / DECIMAL_FACTOR,
              _id: false,
              enVenta: false,
              type: isNft.Isunique ? 'NFT' : 'TOKEN',
              assetpicture: 'none',
              acronimo: '',
              assetid: isNft.Asset_id,
            };
          }
        })
      );

      // Verificar si hay algún error en los resultados
      if (result.includes('error')) {
        return 'getUserAssetsError';
      }

      // Filtrar resultados indefinidos que pueden haber quedado
      const filteredResult = result.filter((r) => r !== undefined);

      return filteredResult;
    } else if (response.status === 404) {
      return 'getUserAssetsError';
    } else {
      console.log('La petición salió mal en getUserAssets');
      return 'getUserAssetsError';
    }
  } catch (error) {
    console.error('Error en getUserAssets:', error);
    return 'getUserAssetsError';
  }
}
     
      public async getAccountBalance(usuario: any): Promise<number> {
        return new Promise(async (resolve, reject) => {
          try {
        const rpcUser = 'rodrigo';
const rpcPassword = '1234'; // Reemplaza con tu contraseña
const rpcHost = `http://localhost:10225/wallet/${usuario}`;
        const requestData: RpcRequest = {
          jsonrpc: '1.0',
          id: 'curltest',
          method: 'getbalance',
          params: [],
        };

        const response = await axios.post(
          rpcHost,
          requestData,
          {
            auth: {
              username: rpcUser,
              password: rpcPassword,
            },
            headers: {
              'Content-Type': 'text/plain;',
            },
          }
        );

        if (response) {
          console.log("response true account balance!")
          console.log(response)
          const accountBalance = parseFloat(response.data.result);
          resolve(accountBalance) ;
        } else {
          console.log("response false!")
          reject(false)
        }
      } catch (error:any) {
        console.log("error account balance:",error)
        reject(false)
      }
      })
    }
public async listCoinholders(coin:string):Promise<any>{
  try {
    const rpcUser = 'rodrigo';
    const rpcPassword = '1234'; // Reemplaza con tu contraseña
    const rpcHost = `http://localhost:10225/`;
    const requestData: RpcRequest = {
      jsonrpc: '1.0',
      id: 'curltest',
      method: 'listassetbalancesbyaddress',
      params: [coin],
    };
    const response = await axios.post(
      rpcHost,
      requestData,
      {
        auth: {
          username: rpcUser,
          password: rpcPassword,
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      }
    );
    if (response) {
      if(response.status == 200){
        if(response.data)
        {
          console.log("DATA LIST COIN HOLDERS:", response.data);
          let data = response.data.result || false;
          if (!data || Object.keys(data).length === 0) return "listCoinHoldersError";
          
          const DECIMAL_FACTOR = Math.pow(10, 8);
          const result = await Promise.all(Object.keys(data).map(async (key) => {
            const rawValue = data[key];
            const realValue = rawValue / DECIMAL_FACTOR;
          
            return {
              address: key,
              amount: realValue
            };
          }));
          
          return result;
        }
      }else if(response.status == 404){
        return"listCoinHoldersError"
        }

     } else {
      return"listCoinHoldersError"
     }


} catch (error)
{

  return"listCoinHoldersError"
}

}

    public async getAssetBalance(address:string,assetId:string): Promise<any>{
      try {
        const rpcUser = 'rodrigo';
    const rpcPassword = '1234'; // Reemplaza con tu contraseña
    const rpcHost = `http://localhost:10225/`;
        const requestData: RpcRequest = {
          jsonrpc: '1.0',
          id: 'curltest',
          method: 'getaddressbalance',
          params: [address,assetId],
        };
    
        const response = await axios.post(
          rpcHost,
          requestData,
          {
            auth: {
              username: rpcUser,
              password: rpcPassword,
            },
            headers: {
              'Content-Type': 'text/plain;',
            },
          }
        );
    
        if (response && response.data.result) {
    
          console.log("response create wallet:",response.data.result)
          return response.data.result;
        } else {
          console.log("ELSE create wallet:",response)
          return false;
        }
      } catch (error:any) {
        console.log("ERROR CREATE WALLET:",error)
        return false;
      }
    }
   
public async withdrawToken(billeteraDelToken:string,to:string,cantidad:number,assetID:string,rtmSpendAddresss:string,assetSpendAddress:string): Promise<any>{
  try {
    const rpcUser = 'rodrigo';
const rpcPassword = '1234'; // Reemplaza con tu contraseña


const rpcHost = `http://localhost:10225/wallet/${billeteraDelToken}`;
    const requestData: RpcRequest = {
      jsonrpc: '1.0',
      id: 'curltest',
      method: 'sendasset',
      params: [assetID,cantidad,to,rtmSpendAddresss,assetSpendAddress],
    };
    const response = await axios.post(
      rpcHost,
      requestData,
      {
        auth: {
          username: rpcUser,
          password: rpcPassword,
        },
        headers: {
          'Content-Type': 'text/plain;',
        },
      }
    );

    if (response && response.status==200) {
      console.log(response)
    return true

    }
  } catch (error:any) {
 console.log("ERROR WITHDRAW TOKEN",error)
    return false
  }
}

public async withdrawRaptoreum(username: string, address: string, amount: number): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      if(amount>0){


      let userBalance = await this.getAccountBalance(username);
      if (userBalance) {
        if (userBalance > amount) {
          const rpcUser = 'rodrigo';
          const rpcPassword = '1234'; // Reemplaza con tu contraseña
          const rpcHost = `http://localhost:10225/wallet/${username}`;
          const requestData: RpcRequest = {
            jsonrpc: '1.0',
            id: 'curltest',
            method: 'sendtoaddress',
            params: [address, amount],
          };
          const response = await axios.post(
            rpcHost,
            requestData,
            {
              auth: {
                username: rpcUser,
                password: rpcPassword,
              },
              headers: {
                'Content-Type': 'text/plain;',
              },
            }
          );
          if (response) {
            if (response.status == 200) {
              if (response.data.result.length == 64) {
                resolve(response.data.result);
              } else {
                reject("noValidResponse");
              }
            } else {
              reject("notOk");
            }
          } else {
            reject("notResponse");
          }
        } else {
          reject("notEnoughBalance");
        }
      }
    }else{
      reject("notEnoughBalance");
    }
    } catch (error) {
      console.log(error)
    }
  });
}
  public async validateAddress(address: string): Promise<boolean> {
      return new Promise(async (resolve, reject) => {
        try {
              const rpcUser = 'rodrigo';
              const rpcPassword = '1234'; // Reemplaza con tu contraseña
              const rpcHost = `http://localhost:10225/wallet/`;
              const requestData: RpcRequest = {
                jsonrpc: '1.0',
                id: 'curltest',
                method: 'validateaddress',
                params: [address],
              };
              const response = await axios.post(
                rpcHost,
                requestData,
                {
                  auth: {
                    username: rpcUser,
                    password: rpcPassword,
                  },
                  headers: {
                    'Content-Type': 'text/plain;',
                  },
                }
              );
              if (response) {

                if(response.status == 200){
                  if(response.data.result.isvalid == true)
                  {
                    resolve(true)
                  }else
                  {
                    resolve(false)
                  }
                }else{
                   reject(false)
                  }

               } else {
                   reject(false)
               }


         } catch (error) {
           reject(false)
         }



     });
     }



}

