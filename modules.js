var  config = require('./dbconfig');
const  sql = require('mssql');
var request = require('request');
async function devices(Id,limit,offset,SortBy,SortType) 
{
  try {
    let  pool = await  sql.connect(config);	
	let modules="";
	let count=0;
	SortBy=SortBy?SortBy:"ASC"
	SortType=SortType?SortType:"Id"
	
	if(offset>=1)
	{
		offset=offset-1;
	}
	offset=offset?offset:"0"
	limit=limit?limit:"25"	
	
	let page =offset*limit;
	if(Id!="" && Id!=undefined)
	{
		  count = await  pool.request().query("SELECT count(*) as count FROM ["+process.env.DATABASE+"].[dbo].[DEVICES] where ([Id]='"+Id+"' OR REPLACE(Id, ' ', '')='"+Id.replace(/\s/g, '')+"')");	
		  modules = await  pool.request().query("SELECT * FROM ["+process.env.DATABASE+"].[dbo].[DEVICES] where ([Id]='"+Id+"' OR REPLACE(Id, ' ', '')='"+Id.replace(/\s/g, '')+"') ORDER BY ["+SortType+"] "+SortBy+" OFFSET "+page+" ROWS FETCH FIRST "+limit+" ROWS ONLY");
	}
	else
	{
		count = await  pool.request().query("SELECT count(*) as count FROM ["+process.env.DATABASE+"].[dbo].[DEVICES]");		
		modules = await  pool.request().query("SELECT * FROM ["+process.env.DATABASE+"].[dbo].[DEVICES] ORDER BY ["+SortType+"] "+SortBy+" OFFSET "+page+" ROWS FETCH FIRST "+limit+" ROWS ONLY");
	}
	let response = 
	{ 
		"result":{
			"devices":devices.recordsets[0],
			"count":count.recordsets[0][0].count
		}, 
		"status":{
			"code":0,
			"message":"success",
		} 			
	}
	await pool.close()
	return response;   
  }
  catch (error) {
    console.log(error);

    let response = 
	{ 
		"result":{
			"devices":"",
			"count":0
		}, 
		"status":{
			"code":0,
			"message":"success",
		} 			
	}
  }
}

module.exports = devices;