var AWS = require("aws-sdk");
var registration = require('../public/javascripts/register.js');
var amazon = require('amazon-affiliate-api');

AWS.config.update({
  region: "us-east-1",
  endpoint: 'https://dynamodb.us-east-1.amazonaws.com'
});

var docClient = new AWS.DynamoDB.DocumentClient();
var list = [];

exports.showGrocery = function(req,res){
	 console.log("RQID:" + req.user.id);
	 var params = {
     ExpressionAttributeValues: {
      ':N': parseInt(req.user.id)
     },
	
	 KeyConditionExpression: 'userId = :N',
     TableName: 'SmartContainer'
     };

     docClient.query(params, function(err, data) {
	 if (err) {
        console.error("Unable to query the table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
		list = []
        data.Items.forEach(function(smart_container) {	
			var map = new Object;
			map["deviceId"] = smart_container.deviceId;
			map["asin"] = smart_container.asin;
            map["deviceName"] = smart_container.deviceName;
            map["deviceValue"] = smart_container.deviceValue; 
			map["half_mark"] = smart_container.half_mark;
			//console.log("Half:" + smart_container.half_mark);
			if( smart_container.deviceValue <= 0) {
				map["threshhold_level"] = 2;
			} else if ( smart_container.deviceValue <= Number(smart_container.half_mark)) {
				map["threshhold_level"] = 1;
			} else {
				map["threshhold_level"] = 0;
			}
			
			var img = "/images/" + smart_container.deviceId + ".png";
			map["image"] = img;
			console.log(map);
			list = list.concat(map);
        });
        // TODO: Update the smart container     
        res.render('index', { title: 'Grocery Management Page', results: list});		
    }
  });             
};	 	 

function updateDBInAnalytics(req,res,timeStamp){
	var deviceId = req.body.asin + req.user.id;
	var params = {
    TableName:"SmartContainerAnalytics",
    Item:{
		"deviceId": deviceId,
        "deviceName": req.body.itemName,
		"deviceValue": req.body.wt,
		"half_mark": req.body.halfMark,
		"userId": req.user.id,
		"deviceTimeStamp": timeStamp
    }
   };
   
   docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		   // TODO: Redirect to an "oops" error page here.
       } else {
		   res.redirect("/index");
       }
      });
}

function updateDB(req,res,title){
	var deviceId = req.body.asin+req.user.id;
	var moment = require('moment');
	var now = moment();
    var formatted = now.format('YYYY-MM-DD HH:mm:ss');
	var params = {
    TableName:"SmartContainer",
    Item:{
		"deviceId": deviceId,
        "deviceName": req.body.itemName,
		"deviceValue": req.body.wt,
		"half_mark": req.body.halfMark,
		"userId": parseInt(req.user.id),
		"asin": req.body.asin,
		"deviceTimeStamp": formatted
    }
   };
   
   docClient.put(params, function(err, data) {
       if (err) {
           console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
		   // TODO: Redirect to an "oops" error page here.
       } else {
           // Save the item in smartcontaineranalytics as well
		  updateDBInAnalytics(req,res,formatted);
       }
      });
}

exports.displayAnalytics = function(req,res) {	

	var params = {
    ExpressionAttributeValues: {
      ':s': req.query.str,
    },
	
	KeyConditionExpression: 'deviceId = :s',
    TableName: 'SmartContainerAnalytics'
    };

    docClient.query(params, function(err, data) {
    if (err) {
       console.log("Error", err);
    } else {
       ts_list = []
	   consumption_list = []
	   actual_wt_list = []
	   prev_deviceValue = 0;
	   var deviceName = "";
        data.Items.forEach(function(current) {	
			//var map = new Object;
			deviceName = current.deviceName;
			consumption = prev_deviceValue - current.deviceValue;
			if ( consumption < 0 ) {
				consumption = 0;
			}
			
            prev_deviceValue = current.deviceValue;
			console.log("dk:"+prev_deviceValue+" " +consumption+" "+current.deviceValue);
            ts_list.push(current.deviceTimeStamp);
            consumption_list.push(consumption);
            actual_wt_list.push(current.deviceValue);  			
        });
        // TODO: Update the smart container     
        res.render('chart', {device: deviceName, x_axis: JSON.stringify(ts_list), y_axis: JSON.stringify(consumption_list), 
		                                         y_axis_wt:JSON.stringify(actual_wt_list) });
    }
  });

 };

exports.saveItem = function(req,res) {
   console.log("RQ:" + req.user.id);
   var util = require('util'),
   
   OperationHelper = require('apac').OperationHelper; 
   
   var opHelper = new OperationHelper({
       awsId:     'Enter awsID here',
       awsSecret: 'Enter awsSecret here',
       assocId:   'Enter assoc ID here', 
   });
   
   opHelper.execute('ItemLookup', {
       'ItemId': req.body.asin,
       'MerchantId': 'All',
       'Condition': 'All',
       'ResponseGroup': 'Medium'
   }, function(error, results) {
       if (error) 
	   { 
	      console.log('Error: ' + error + "\n"); //TODO       
	   } else {
		   console.log(results);
		   //console.log(results.ItemLookupResponse.Items.Item.ItemAttributes.Title);
		   var download_path = "./public/images/" + req.body.asin + req.user.id + ".png";
		   console.log("DK:" + download_path);
		   //var title = results.ItemLookupResponse.Items.Item.ItemAttributes.Title;
		   registration.download(results.ItemLookupResponse.Items.Item.SmallImage.URL, download_path, function()
		   {
               console.log('Download completed');
			   title="test" + req.body.asin;
			   updateDB(req,res,title);
		   });
	   }	 	   
   });	  
};

exports.checkout = function(req, res) {
   var cart_id = "";
   var cart_HMAC = "";
   
   // Affiliate Client
  var client = amazon.createClient({
     awsId: "Enter aws Id here",
     awsSecret: "Enter secret here",
     awsTag: "Enter tag here"
   });
   console.log("After:Value:" + req.query.str);
   console.log("Client:" + client);
   client.cartCreate({
     items:[{
       ASIN: req.query.str,
       Quantity: 1
     }]
   }, function (err, results ){
	   console.log(results);
	   if(err) {
		   res.redirect("/index");
	   }
	   res.redirect(results.Cart.PurchaseURL);
   });
   
};

exports.removeItem = function(req,res) {
	var deviceId = req.query.str;  
	var userId = req.user.id;
	var params = {
    TableName:"SmartContainer",
    Key:{
		"userId": parseInt(userId),
		"deviceId": deviceId
    }
   };

   console.log("Deleting item..." + req.query.str );
   
   docClient.delete(params, function(err, data) {
       if (err) {
           console.error("Unable to delete item. Error JSON:", JSON.stringify(err, null, 2));
		   // TODO: Redirect to an "oops" error page here.
       } else {
           //console.log("Deleted item:", JSON.stringify(data, null, 2));
		   res.redirect("/index");
       }
      });
	  
};