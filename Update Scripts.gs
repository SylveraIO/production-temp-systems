//All scrips to do with requesting project updates, including HTML interface and database(s) interactions

function requestUpdate(sylCode){
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Validation");
  let updateTypeData = sheet.getRange("D2:D").getValues();
  let updateTypes = flattenData(updateTypeData);

  let teamsData = sheet.getRange("C2:C").getValues();
  let teams = flattenData(teamsData);

  let sizeData = sheet.getRange("E2:E").getValues();
  let size = flattenData(sizeData);

  let urgencyData = sheet.getRange("F2:F").getValues();
  let urgency = flattenData(urgencyData)

  let html = HtmlService.createTemplateFromFile("Update Request");
  html.updateList = updateTypes;
  html.teamList = teams;
  html.sylCode = sylCode;
  html.size = size;
  html.urgency = urgency;

  let htmlWindow = HtmlService.createHtmlOutput(html.evaluate()).setWidth(400).setHeight(450);
  SpreadsheetApp.getUi().showModalDialog(htmlWindow,"Update Assistant");
}

function logUpdate(sylCode,updateType,updateDescription,updateTeam,updateUrgency,updateSize){
  const database = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Update DB");
  const uniqueId = Utilities.getUuid();
  const user = Session.getActiveUser().getEmail();
  const updateValues = [uniqueId,new Date(),sylCode,updateType,user,updateDescription,updateTeam,updateSize,updateUrgency,"","Open"];
  database.appendRow(updateValues);
}

function closeUpdate(updateId){
  Logger.log(updateId);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Update DB");
  const values = sheet.getRange(2,1,sheet.getLastRow()-1,1).getValues();
  const user = Session.getActiveUser().getEmail();
  const today = new Date();
  for(let i=0;i<values.length;i++){
    if(values[i][0]==updateId){  
      sheet.getRange(i+2,11,1,3).setValues([["Closed",user,today]]);
      break;
    }
  }
}

