function updateDeveloper(projectCode){
  let developerList = getDevelopers()

  let html = HtmlService.createTemplateFromFile('Developer Interface');
  html.developerList = developerList
  html.sylCode = projectCode;

  let htmlWindow = HtmlService.createHtmlOutput(html.evaluate()).setWidth(400).setHeight(200);
  SpreadsheetApp.getUi().showModalDialog(htmlWindow,"Add developer to project")
  
}

function addDevToProject(projectCode,developerId){
  //Update database
  updateDbSingleRange(projectCode,globalValues.developerIdColumn,developerId);

  //Check whether the user wants to create a deal too
  const ui = SpreadsheetApp.getUi();
  const promptResponse = ui.alert("Create a deal for this project?","Do you want to create a deal for this project",ui.ButtonSet.YES_NO);

  if(promptResponse!==ui.Button.YES){
    return
  }

  //Create the deal and associate it with the company
  const API_KEY = "eu1-62f0-617a-4a2b-b7a0-5326e92fae39"
  const url = `https://api.hubapi.com/crm/v3/objects/deals?hapikey=${API_KEY}`;
  const body = {properties:{"dealname": projectCode,"pipeline":"default","dealstage":"72734655"}}
  const params = {method:'post',payload:JSON.stringify(body),  'contentType': 'application/json'}
  const responseRaw = UrlFetchApp.fetch(url,params);
  const response = JSON.parse(responseRaw);

  const associationUrl = `https://api.hubapi.com/crm-associations/v1/associations?hapikey=${API_KEY}`;
  const associationBody = {
  "fromObjectId": response.id,
  "toObjectId": developerId,
  "category": "HUBSPOT_DEFINED",
  "definitionId": 5
  };
  const associationParams = {method:"put",payload:JSON.stringify(associationBody),contentType:'application/json'}
  UrlFetchApp.fetch(associationUrl,associationParams);
  updateDbSingleRange(projectCode,globalValues.hubspotDealColumn,`=HYPERLINK("https://app-eu1.hubspot.com/contacts/25866103/deal/${response.id}","${response.id}")`);

  //Update all the deal information
  getDealInformation();
}

function getDevelopers(){
  const API_KEY = "eu1-62f0-617a-4a2b-b7a0-5326e92fae39" //How do we keep this safe?
  const url = `https://api.hubapi.com/crm/v3/objects/companies?limit=10&archived=false&hapikey=${API_KEY}`
  const responseRaw = UrlFetchApp.fetch(url,{method:"get"})
  const response = JSON.parse(responseRaw);
  Logger.log(response.results)
  return response.results
}

function getDealInformation(){
  const API_KEY = "eu1-62f0-617a-4a2b-b7a0-5326e92fae39";

  //Get deals
  const url = `https://api.hubapi.com/crm/v3/objects/deals?properties=requested_shapefiles&properties=dealstage&archived=false&hapikey=${API_KEY}`;
  const dealResponse = UrlFetchApp.fetch(url,{method:'get'});
  const deals = JSON.parse(dealResponse);

  //Get pipeline stages
  const pipelineUrl = `https://api.hubapi.com/crm/v3/pipelines/deals/default/stages?hapikey=${API_KEY}`;
  const pipelineStages = UrlFetchApp.fetch(pipelineUrl,{method:"get"});
  const stagesRaw = JSON.parse(pipelineStages);
  const stages = {};

  //Create object where key is the id and the value is the label
  stagesRaw.results.forEach(stage=>{
    stages[stage.id]=stage.label
  })

  //Get developer information
  const developerUrl = `https://api.hubapi.com/crm/v3/objects/companies?hapikey=${API_KEY}`;
  const developersResponse = UrlFetchApp.fetch(developerUrl,{method:"get"});
  const developersRaw = JSON.parse(developersResponse);
  const developers = {}

  developersRaw.results.forEach(dev=>{
    developers[dev.properties.hs_object_id] = dev.properties.name;
  })

  
  //Paste status
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const database = ss.getSheetByName("Project DB");
  const values = database.getRange(globalValues.rowOffset,globalValues.developerIdColumn,database.getLastRow()-globalValues.rowOffset+1,2).getValues();
  const dumpArray = [];
  values.forEach(value=>{
  if(value[0]!==""){
    let developer = developers[value[0]];
    if(value[1]!==""){
      for(let i=0;i<deals.results.length;i++){
        if(deals.results[i].id==value[1].toString()){
          dumpArray.push([developer,"",stages[deals.results[i].properties.dealstage],deals.results[i].properties["requested_shapefiles"]!=null?properties["requested_shapefiles"]:"No"])
        }
      }
    }else{
      dumpArray.push([developer,"","",""])
    }
  }else{
    dumpArray.push(["","","",""]);
  }
  });

  database.getRange(globalValues.rowOffset,globalValues.developerNameColumn,dumpArray.length,dumpArray[0].length).setValues(dumpArray);
}


function getDealsOnly(){
  const API_KEY = "eu1-62f0-617a-4a2b-b7a0-5326e92fae39"
  const url = `https://api.hubapi.com/crm/v3/objects/companies?hapikey=${API_KEY}`;
  const dealResponse = UrlFetchApp.fetch(url,{method:'get'});
  const deals = JSON.parse(dealResponse);
  Logger.log(deals);
}
